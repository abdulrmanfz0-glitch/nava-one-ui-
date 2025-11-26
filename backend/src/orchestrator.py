"""
Orchestrator Module

This module provides high-level orchestration for multi-branch operations
across multiple repositories. It coordinates branch operations, manages
concurrent execution, and generates comprehensive reports.

Key responsibilities:
- Orchestrate complex multi-branch workflows
- Coordinate operations across multiple repositories
- Manage parallel execution with thread pooling
- Handle errors and implement rollback strategies
- Generate and export comprehensive reports

Optimizations:
- Concurrent repository operations
- Batch processing for multiple branches
- Intelligent error handling and recovery
- Efficient resource utilization
"""

import logging
from typing import List, Dict, Optional, Callable
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

from .config import Config, RepositoryConfig, BranchConfig
from .branch_ops import (
    BranchOperations,
    MultiBranchOperations,
    OperationResult
)
from .reporting import ReportGenerator, BranchReport, Report
from .utils import is_git_repository


logger = logging.getLogger(__name__)


class MultibranchOrchestrator:
    """
    High-level orchestrator for multi-branch operations

    This class provides a unified interface for complex branch operations
    across multiple repositories with optimized execution and reporting.
    """

    def __init__(self, config: Config):
        """
        Initialize the orchestrator

        Args:
            config: System configuration
        """
        self.config = config
        self.report_generator = ReportGenerator(config.reporting)
        self.errors = []

        # Validate configuration
        validation_errors = config.validate()
        if validation_errors:
            raise ValueError(f"Configuration errors: {', '.join(validation_errors)}")

    def execute_operation_on_branch(
        self,
        repo_config: RepositoryConfig,
        branch_config: BranchConfig,
        operation: str,
        **kwargs
    ) -> OperationResult:
        """
        Execute a single operation on a branch

        Args:
            repo_config: Repository configuration
            branch_config: Branch configuration
            operation: Operation name (fetch, pull, push, merge, etc.)
            **kwargs: Additional arguments for the operation

        Returns:
            OperationResult
        """
        try:
            branch_ops = BranchOperations(repo_config, self.config.retry_attempts)

            # Map operation names to methods
            operations_map = {
                "fetch": branch_ops.fetch_branch,
                "pull": branch_ops.pull_branch,
                "push": branch_ops.push_branch,
                "create": branch_ops.create_branch,
                "switch": branch_ops.switch_branch,
                "merge": branch_ops.merge_branch,
            }

            if operation not in operations_map:
                return OperationResult(
                    success=False,
                    branch_name=branch_config.name,
                    operation=operation,
                    message=f"Unknown operation: {operation}",
                    error=f"Operation '{operation}' is not supported"
                )

            # Execute the operation
            op_func = operations_map[operation]

            # Prepare arguments based on operation
            if operation in ["fetch", "pull", "push"]:
                return op_func(
                    branch_name=branch_config.name,
                    remote=branch_config.remote,
                    **kwargs
                )
            elif operation == "create":
                return op_func(branch_name=branch_config.name, **kwargs)
            elif operation == "switch":
                return op_func(branch_name=branch_config.name, **kwargs)
            elif operation == "merge":
                return op_func(
                    source_branch=branch_config.name,
                    strategy=branch_config.merge_strategy,
                    **kwargs
                )
            else:
                return op_func(branch_config.name, **kwargs)

        except Exception as e:
            logger.error(f"Error executing {operation} on {branch_config.name}: {e}")
            return OperationResult(
                success=False,
                branch_name=branch_config.name,
                operation=operation,
                message="Operation failed with exception",
                error=str(e)
            )

    def execute_workflow_on_repository(
        self,
        repo_config: RepositoryConfig,
        operations: List[str],
        branches: Optional[List[str]] = None
    ) -> List[BranchReport]:
        """
        Execute a workflow on a single repository

        Args:
            repo_config: Repository configuration
            operations: List of operations to execute
            branches: List of branch names (None for all configured branches)

        Returns:
            List of BranchReport objects
        """
        branch_reports = []

        # Determine which branches to operate on
        target_branches = []
        if branches:
            # Filter configured branches
            target_branches = [
                bc for bc in repo_config.branches
                if bc.name in branches
            ]
        else:
            target_branches = repo_config.branches

        if not target_branches:
            logger.warning(f"No branches configured for repository: {repo_config.name}")
            return branch_reports

        # Create multi-branch operations handler
        multi_ops = MultiBranchOperations(
            repo_config,
            max_workers=self.config.max_workers,
            retry_attempts=self.config.retry_attempts
        )

        # Execute operations for each branch
        for branch_config in target_branches:
            operation_results = []

            for operation in operations:
                logger.info(
                    f"Executing {operation} on {branch_config.name} "
                    f"in {repo_config.name}"
                )

                result = self.execute_operation_on_branch(
                    repo_config,
                    branch_config,
                    operation
                )
                operation_results.append(result)

                # Stop if operation failed and we're not continuing on errors
                if not result.success:
                    logger.warning(
                        f"Operation {operation} failed on {branch_config.name}"
                    )
                    # Continue to next operation anyway for reporting

            # Get branch status
            branch_status = {}
            try:
                branch_status = multi_ops.branch_ops.get_branch_status(
                    branch_config.name
                )
            except Exception as e:
                logger.error(f"Error getting status for {branch_config.name}: {e}")
                self.errors.append(
                    f"Failed to get status for {branch_config.name}: {str(e)}"
                )

            # Create branch report
            branch_report = BranchReport(
                branch_name=branch_config.name,
                repository=repo_config.name,
                operations=operation_results,
                status=branch_status,
                success=all(op.success for op in operation_results)
            )
            branch_reports.append(branch_report)

        return branch_reports

    def execute_workflow(
        self,
        operations: List[str],
        repositories: Optional[List[str]] = None,
        branches: Optional[List[str]] = None
    ) -> Report:
        """
        Execute a workflow across multiple repositories

        This is the main entry point for orchestrating multi-branch operations.
        Operations are executed in parallel across repositories for efficiency.

        Args:
            operations: List of operations to execute (fetch, pull, push, etc.)
            repositories: List of repository names (None for all)
            branches: List of branch names (None for all)

        Returns:
            Complete Report object
        """
        start_time = datetime.now()
        all_branch_reports = []

        # Determine which repositories to operate on
        target_repos = []
        if repositories:
            target_repos = [
                repo for repo in self.config.repositories
                if repo.name in repositories
            ]
        else:
            target_repos = self.config.repositories

        if not target_repos:
            logger.error("No repositories to operate on")
            self.errors.append("No repositories configured or specified")
            end_time = datetime.now()
            return self.report_generator.create_report(
                [], start_time, end_time, self.errors
            )

        # Execute operations
        if self.config.parallel_operations and len(target_repos) > 1:
            # Parallel execution across repositories
            logger.info(
                f"Executing operations in parallel across {len(target_repos)} repositories"
            )

            with ThreadPoolExecutor(max_workers=self.config.max_workers) as executor:
                futures = {
                    executor.submit(
                        self.execute_workflow_on_repository,
                        repo,
                        operations,
                        branches
                    ): repo
                    for repo in target_repos
                }

                for future in as_completed(futures):
                    repo = futures[future]
                    try:
                        branch_reports = future.result()
                        all_branch_reports.extend(branch_reports)
                        logger.info(
                            f"Completed operations on repository: {repo.name}"
                        )
                    except Exception as e:
                        logger.error(f"Error processing repository {repo.name}: {e}")
                        self.errors.append(
                            f"Repository {repo.name} failed: {str(e)}"
                        )
        else:
            # Sequential execution
            logger.info("Executing operations sequentially")
            for repo in target_repos:
                try:
                    branch_reports = self.execute_workflow_on_repository(
                        repo,
                        operations,
                        branches
                    )
                    all_branch_reports.extend(branch_reports)
                    logger.info(f"Completed operations on repository: {repo.name}")
                except Exception as e:
                    logger.error(f"Error processing repository {repo.name}: {e}")
                    self.errors.append(f"Repository {repo.name} failed: {str(e)}")

        end_time = datetime.now()

        # Generate report
        report = self.report_generator.create_report(
            all_branch_reports,
            start_time,
            end_time,
            self.errors
        )

        logger.info(
            f"Workflow completed: {report.summary.successful_operations}/"
            f"{report.summary.total_operations} operations succeeded "
            f"({report.summary.success_rate:.1f}%)"
        )

        return report

    def sync_all_branches(
        self,
        repositories: Optional[List[str]] = None
    ) -> Report:
        """
        Sync all configured branches across repositories

        This is a convenience method that fetches and pulls all branches.

        Args:
            repositories: List of repository names (None for all)

        Returns:
            Complete Report object
        """
        logger.info("Starting sync workflow for all branches")
        return self.execute_workflow(
            operations=["fetch", "pull"],
            repositories=repositories
        )

    def fetch_all_branches(
        self,
        repositories: Optional[List[str]] = None
    ) -> Report:
        """
        Fetch all configured branches across repositories

        Args:
            repositories: List of repository names (None for all)

        Returns:
            Complete Report object
        """
        logger.info("Starting fetch workflow for all branches")
        return self.execute_workflow(
            operations=["fetch"],
            repositories=repositories
        )

    def custom_workflow(
        self,
        workflow_func: Callable[[BranchOperations, BranchConfig], List[OperationResult]],
        repositories: Optional[List[str]] = None,
        branches: Optional[List[str]] = None
    ) -> Report:
        """
        Execute a custom workflow function

        This allows for complex custom workflows beyond the standard operations.

        Args:
            workflow_func: Function that takes BranchOperations and BranchConfig
                          and returns a list of OperationResults
            repositories: List of repository names (None for all)
            branches: List of branch names (None for all)

        Returns:
            Complete Report object
        """
        start_time = datetime.now()
        all_branch_reports = []

        # Determine target repositories
        target_repos = []
        if repositories:
            target_repos = [
                repo for repo in self.config.repositories
                if repo.name in repositories
            ]
        else:
            target_repos = self.config.repositories

        # Execute custom workflow
        for repo_config in target_repos:
            target_branches = []
            if branches:
                target_branches = [
                    bc for bc in repo_config.branches
                    if bc.name in branches
                ]
            else:
                target_branches = repo_config.branches

            branch_ops = BranchOperations(repo_config, self.config.retry_attempts)

            for branch_config in target_branches:
                try:
                    operation_results = workflow_func(branch_ops, branch_config)

                    # Get branch status
                    branch_status = branch_ops.get_branch_status(branch_config.name)

                    branch_report = BranchReport(
                        branch_name=branch_config.name,
                        repository=repo_config.name,
                        operations=operation_results,
                        status=branch_status,
                        success=all(op.success for op in operation_results)
                    )
                    all_branch_reports.append(branch_report)

                except Exception as e:
                    logger.error(
                        f"Error in custom workflow for {branch_config.name}: {e}"
                    )
                    self.errors.append(
                        f"Custom workflow failed for {branch_config.name}: {str(e)}"
                    )

        end_time = datetime.now()

        # Generate report
        return self.report_generator.create_report(
            all_branch_reports,
            start_time,
            end_time,
            self.errors
        )
