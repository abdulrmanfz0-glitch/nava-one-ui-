"""
Nava Ops REST API

FastAPI-based REST API for Git orchestration operations.
Provides endpoints for branch management, merge operations, and reporting.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
import os
import tempfile
from pathlib import Path

from .orchestrator import MultibranchOrchestrator
from .config import Config, RepositoryConfig, BranchConfig, ReportingConfig
from .reporting import ReportGenerator, Report
from .notifications import NotificationManager, NotificationConfig
from .branch_ops import BranchOperations
from .utils import execute_git_command

# Initialize FastAPI app
app = FastAPI(
    title="Nava Ops API",
    description="REST API for multi-branch Git orchestration",
    version="2.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
orchestrator: Optional[MultibranchOrchestrator] = None
notification_manager: Optional[NotificationManager] = None


# =============================================================================
# Pydantic Models for Request/Response
# =============================================================================

class BranchConfigModel(BaseModel):
    """Branch configuration model"""
    name: str
    remote: str = "origin"
    auto_fetch: bool = True
    auto_pull: bool = False
    merge_strategy: str = "merge"


class RepositoryConfigModel(BaseModel):
    """Repository configuration model"""
    path: str
    name: Optional[str] = None
    branches: List[BranchConfigModel]


class ReportingConfigModel(BaseModel):
    """Reporting configuration model"""
    output_format: str = "json"
    output_dir: str = "./reports"
    include_commits: bool = False
    max_commits: int = 10


class ConfigModel(BaseModel):
    """Main configuration model"""
    repositories: List[RepositoryConfigModel]
    reporting: Optional[ReportingConfigModel] = None
    parallel_operations: bool = True
    max_workers: int = 4
    retry_attempts: int = 3
    retry_delay: int = 2


class WorkflowRequest(BaseModel):
    """Workflow execution request"""
    operations: List[str] = Field(..., example=["fetch", "pull"])
    repositories: Optional[List[str]] = None
    branches: Optional[List[str]] = None


class MergeRequest(BaseModel):
    """Merge operation request"""
    repository_path: str
    source_branch: str
    target_branch: str
    strategy: str = "merge"
    commit_message: Optional[str] = None


class NotificationConfigModel(BaseModel):
    """Notification configuration model"""
    console_enabled: bool = True
    slack_enabled: bool = False
    email_enabled: bool = False
    slack_webhook_url: Optional[str] = None
    email_smtp_host: Optional[str] = None
    email_smtp_port: int = 587
    email_from: Optional[str] = None
    email_to: Optional[List[str]] = None
    email_username: Optional[str] = None
    email_password: Optional[str] = None


class BranchInfo(BaseModel):
    """Branch information response"""
    name: str
    remote: str
    is_current: bool
    last_commit: Optional[str] = None
    last_commit_author: Optional[str] = None
    last_commit_date: Optional[str] = None


class RepositoryStatus(BaseModel):
    """Repository status response"""
    repository: str
    branches: List[BranchInfo]
    current_branch: str
    has_uncommitted_changes: bool


# =============================================================================
# Helper Functions
# =============================================================================

def convert_config_model_to_config(config_model: ConfigModel) -> Config:
    """Convert Pydantic config model to internal Config object"""
    repositories = []
    for repo_model in config_model.repositories:
        branches = [
            BranchConfig(
                name=b.name,
                remote=b.remote,
                auto_fetch=b.auto_fetch,
                auto_pull=b.auto_pull,
                merge_strategy=b.merge_strategy
            )
            for b in repo_model.branches
        ]
        repositories.append(
            RepositoryConfig(
                path=repo_model.path,
                name=repo_model.name,
                branches=branches
            )
        )

    reporting_config = None
    if config_model.reporting:
        reporting_config = ReportingConfig(
            output_format=config_model.reporting.output_format,
            output_dir=config_model.reporting.output_dir,
            include_commits=config_model.reporting.include_commits,
            max_commits=config_model.reporting.max_commits
        )

    return Config(
        repositories=repositories,
        reporting=reporting_config,
        parallel_operations=config_model.parallel_operations,
        max_workers=config_model.max_workers,
        retry_attempts=config_model.retry_attempts,
        retry_delay=config_model.retry_delay
    )


def get_branch_info(repo_path: str, branch_name: str) -> BranchInfo:
    """Get detailed information about a branch"""
    try:
        # Check if it's the current branch
        result = execute_git_command(repo_path, ["branch", "--show-current"])
        is_current = result.success and result.output.strip() == branch_name

        # Get last commit info
        result = execute_git_command(
            repo_path,
            ["log", branch_name, "-1", "--format=%H|%an|%ai"]
        )

        last_commit = None
        last_commit_author = None
        last_commit_date = None

        if result.success and result.output:
            parts = result.output.strip().split('|')
            if len(parts) == 3:
                last_commit = parts[0][:8]  # Short hash
                last_commit_author = parts[1]
                last_commit_date = parts[2]

        return BranchInfo(
            name=branch_name,
            remote="origin",  # Default
            is_current=is_current,
            last_commit=last_commit,
            last_commit_author=last_commit_author,
            last_commit_date=last_commit_date
        )
    except Exception as e:
        return BranchInfo(
            name=branch_name,
            remote="origin",
            is_current=False
        )


# =============================================================================
# API Endpoints
# =============================================================================

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "name": "Nava Ops API",
        "version": "2.1.0",
        "status": "operational",
        "docs": "/api/docs",
        "endpoints": {
            "config": "/api/config",
            "branches": "/api/branches",
            "workflow": "/api/workflow",
            "merge": "/api/merge",
            "reports": "/api/reports"
        }
    }


@app.post("/api/config")
async def configure(config: ConfigModel):
    """
    Configure the orchestrator with repository and branch settings

    This endpoint initializes the orchestrator with the provided configuration.
    Must be called before executing workflows.
    """
    global orchestrator

    try:
        internal_config = convert_config_model_to_config(config)
        orchestrator = MultibranchOrchestrator(internal_config)

        return {
            "status": "success",
            "message": "Configuration applied successfully",
            "repositories": len(config.repositories),
            "total_branches": sum(len(r.branches) for r in config.repositories)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Configuration error: {str(e)}")


@app.get("/api/config")
async def get_config():
    """Get current orchestrator configuration"""
    if not orchestrator:
        raise HTTPException(status_code=400, detail="Orchestrator not configured")

    return {
        "status": "configured",
        "repositories": [
            {
                "name": repo.name,
                "path": repo.path,
                "branches": [b.name for b in repo.branches]
            }
            for repo in orchestrator.config.repositories
        ],
        "parallel_operations": orchestrator.config.parallel_operations,
        "max_workers": orchestrator.config.max_workers
    }


@app.get("/api/branches", response_model=List[RepositoryStatus])
async def list_branches():
    """
    List all branches across configured repositories

    Returns detailed information about branches including current status,
    last commit information, and uncommitted changes.
    """
    if not orchestrator:
        raise HTTPException(status_code=400, detail="Orchestrator not configured")

    results = []

    for repo_config in orchestrator.config.repositories:
        try:
            # Get all branches
            result = execute_git_command(repo_config.path, ["branch", "-a"])

            if not result.success:
                continue

            # Parse branches
            branch_lines = [
                line.strip().replace('* ', '').replace('remotes/origin/', '')
                for line in result.output.split('\n')
                if line.strip() and not '->' in line
            ]

            # Get unique branch names
            branch_names = list(set(branch_lines))
            branch_infos = [
                get_branch_info(repo_config.path, branch)
                for branch in branch_names[:20]  # Limit to 20 branches
            ]

            # Get current branch
            result = execute_git_command(repo_config.path, ["branch", "--show-current"])
            current_branch = result.output.strip() if result.success else "unknown"

            # Check for uncommitted changes
            result = execute_git_command(repo_config.path, ["status", "--porcelain"])
            has_changes = bool(result.output.strip()) if result.success else False

            results.append(RepositoryStatus(
                repository=repo_config.name or repo_config.path,
                branches=branch_infos,
                current_branch=current_branch,
                has_uncommitted_changes=has_changes
            ))

        except Exception as e:
            continue

    return results


@app.get("/api/branches/{repository_name}")
async def list_repository_branches(repository_name: str):
    """List branches for a specific repository"""
    if not orchestrator:
        raise HTTPException(status_code=400, detail="Orchestrator not configured")

    # Find repository
    repo_config = None
    for repo in orchestrator.config.repositories:
        if repo.name == repository_name or repo.path.endswith(repository_name):
            repo_config = repo
            break

    if not repo_config:
        raise HTTPException(status_code=404, detail=f"Repository '{repository_name}' not found")

    try:
        result = execute_git_command(repo_config.path, ["branch", "-a"])

        if not result.success:
            raise HTTPException(status_code=500, detail=f"Failed to list branches: {result.error}")

        branch_lines = [
            line.strip().replace('* ', '').replace('remotes/origin/', '')
            for line in result.output.split('\n')
            if line.strip() and not '->' in line
        ]

        branch_names = list(set(branch_lines))
        branch_infos = [
            get_branch_info(repo_config.path, branch)
            for branch in branch_names
        ]

        return {
            "repository": repository_name,
            "branches": branch_infos
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/workflow")
async def execute_workflow(request: WorkflowRequest, background_tasks: BackgroundTasks):
    """
    Execute a workflow with specified operations

    Operations can include: fetch, pull, push, merge, create, switch
    Can optionally filter by repositories and branches.
    """
    if not orchestrator:
        raise HTTPException(status_code=400, detail="Orchestrator not configured")

    try:
        report = orchestrator.execute_workflow(
            operations=request.operations,
            repositories=request.repositories,
            branches=request.branches
        )

        # Send notification in background
        if notification_manager:
            background_tasks.add_task(
                notification_manager.notify,
                f"Workflow completed: {request.operations}",
                f"Success rate: {report.summary.success_rate:.1%}"
            )

        return {
            "status": "success",
            "summary": {
                "total_operations": report.summary.total_operations,
                "successful_operations": report.summary.successful_operations,
                "failed_operations": report.summary.failed_operations,
                "success_rate": report.summary.success_rate,
                "duration_seconds": report.summary.duration_seconds
            },
            "operations": [
                {
                    "repository": br.repository,
                    "branch": br.branch,
                    "operation": br.operation,
                    "status": br.status,
                    "message": br.message
                }
                for br in report.branch_reports
            ],
            "errors": report.errors
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Workflow execution failed: {str(e)}")


@app.post("/api/workflow/sync")
async def sync_all(background_tasks: BackgroundTasks):
    """
    Synchronize all configured branches (fetch + pull)

    Convenience endpoint for complete synchronization.
    """
    if not orchestrator:
        raise HTTPException(status_code=400, detail="Orchestrator not configured")

    try:
        report = orchestrator.sync_all_branches()

        # Send notification
        if notification_manager:
            background_tasks.add_task(
                notification_manager.notify,
                "Sync completed",
                f"Success rate: {report.summary.success_rate:.1%}"
            )

        return {
            "status": "success",
            "summary": {
                "total_operations": report.summary.total_operations,
                "successful_operations": report.summary.successful_operations,
                "failed_operations": report.summary.failed_operations,
                "success_rate": report.summary.success_rate,
                "duration_seconds": report.summary.duration_seconds
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")


@app.post("/api/merge")
async def merge_branches(request: MergeRequest, background_tasks: BackgroundTasks):
    """
    Merge one branch into another

    Performs a Git merge operation with the specified strategy.
    Supports 'merge', 'rebase', and 'squash' strategies.
    """
    try:
        branch_ops = BranchOperations(request.repository_path)

        # Switch to target branch
        switch_result = execute_git_command(
            request.repository_path,
            ["checkout", request.target_branch]
        )

        if not switch_result.success:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to switch to {request.target_branch}: {switch_result.error}"
            )

        # Perform merge
        if request.strategy == "merge":
            merge_cmd = ["merge", request.source_branch]
            if request.commit_message:
                merge_cmd.extend(["-m", request.commit_message])
        elif request.strategy == "rebase":
            merge_cmd = ["rebase", request.source_branch]
        elif request.strategy == "squash":
            merge_cmd = ["merge", "--squash", request.source_branch]
        else:
            raise HTTPException(status_code=400, detail=f"Unknown strategy: {request.strategy}")

        result = execute_git_command(request.repository_path, merge_cmd)

        # Send notification
        if notification_manager:
            if result.success:
                background_tasks.add_task(
                    notification_manager.notify,
                    "Merge successful",
                    f"{request.source_branch} → {request.target_branch}"
                )
            else:
                background_tasks.add_task(
                    notification_manager.notify,
                    "Merge failed",
                    f"{request.source_branch} → {request.target_branch}: {result.error}"
                )

        if result.success:
            return {
                "status": "success",
                "message": f"Successfully merged {request.source_branch} into {request.target_branch}",
                "output": result.output
            }
        else:
            # Check if it's a conflict
            if "conflict" in result.error.lower():
                return {
                    "status": "conflict",
                    "message": "Merge conflict detected",
                    "conflicts": result.error
                }
            else:
                raise HTTPException(status_code=400, detail=result.error)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/reports")
async def list_reports():
    """List available reports"""
    if not orchestrator or not orchestrator.config.reporting:
        return {"reports": []}

    report_dir = Path(orchestrator.config.reporting.output_dir)

    if not report_dir.exists():
        return {"reports": []}

    reports = []
    for file_path in report_dir.glob("*"):
        if file_path.is_file():
            reports.append({
                "name": file_path.name,
                "size": file_path.stat().st_size,
                "created": datetime.fromtimestamp(file_path.stat().st_ctime).isoformat(),
                "format": file_path.suffix[1:]  # Remove the dot
            })

    return {"reports": sorted(reports, key=lambda x: x["created"], reverse=True)}


@app.get("/api/reports/{report_name}")
async def download_report(report_name: str):
    """Download a specific report"""
    if not orchestrator or not orchestrator.config.reporting:
        raise HTTPException(status_code=400, detail="Reporting not configured")

    report_path = Path(orchestrator.config.reporting.output_dir) / report_name

    if not report_path.exists():
        raise HTTPException(status_code=404, detail="Report not found")

    return FileResponse(
        path=report_path,
        filename=report_name,
        media_type="application/octet-stream"
    )


@app.post("/api/reports/generate")
async def generate_report(
    format: str = Query("json", regex="^(json|markdown|html)$"),
    include_stats: bool = True
):
    """
    Generate a report from the last workflow execution

    Formats: json, markdown, html
    """
    if not orchestrator:
        raise HTTPException(status_code=400, detail="Orchestrator not configured")

    # For demonstration, we'll create a simple report
    # In a real scenario, you'd store the last report
    return {
        "status": "success",
        "message": f"Report would be generated in {format} format",
        "note": "Execute a workflow first to generate a real report"
    }


@app.post("/api/notifications/config")
async def configure_notifications(config: NotificationConfigModel):
    """Configure notification settings"""
    global notification_manager

    try:
        notification_config = NotificationConfig(
            console_enabled=config.console_enabled,
            slack_enabled=config.slack_enabled,
            email_enabled=config.email_enabled,
            slack_webhook_url=config.slack_webhook_url,
            email_smtp_host=config.email_smtp_host,
            email_smtp_port=config.email_smtp_port,
            email_from=config.email_from,
            email_to=config.email_to or [],
            email_username=config.email_username,
            email_password=config.email_password
        )

        notification_manager = NotificationManager(notification_config)

        return {
            "status": "success",
            "message": "Notification settings configured",
            "enabled_channels": {
                "console": config.console_enabled,
                "slack": config.slack_enabled,
                "email": config.email_enabled
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Configuration error: {str(e)}")


@app.post("/api/notifications/test")
async def test_notification(message: str = "Test notification from Nava Ops"):
    """Send a test notification"""
    if not notification_manager:
        raise HTTPException(status_code=400, detail="Notifications not configured")

    try:
        notification_manager.notify("Test Notification", message)
        return {
            "status": "success",
            "message": "Test notification sent"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send notification: {str(e)}")


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "orchestrator_configured": orchestrator is not None,
        "notifications_configured": notification_manager is not None
    }


# =============================================================================
# Main Entry Point
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
