"""
Branch Operations Module

This module handles all Git branch operations including creation, switching,
merging, and status checking across single or multiple repositories.

Key responsibilities:
- Create and manage Git branches
- Switch between branches safely
- Merge branches with different strategies
- Fetch and pull from remotes with retry logic
- Query branch status and metadata

Optimizations:
- Batch operations when possible
- Concurrent execution for multi-branch operations
- Retry logic for network operations
- Efficient error handling and rollback
"""

import os
import logging
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

from .utils import (
    execute_git_command,
    retry_with_backoff,
    validate_branch_name,
    CommandResult,
    GitCommandError,
    is_git_repository
)
from .config import BranchConfig, RepositoryConfig


logger = logging.getLogger(__name__)


@dataclass
class BranchInfo:
    """Information about a Git branch"""
    name: str
    current: bool
    remote: Optional[str]
    last_commit: Optional[str]
    last_commit_date: Optional[str]
    ahead: int = 0
    behind: int = 0


@dataclass
class OperationResult:
    """Result of a branch operation"""
    success: bool
    branch_name: str
    operation: str
    message: str
    timestamp: datetime = field(default_factory=datetime.now)
    error: Optional[str] = None


class BranchOperations:
    """
    Handles all Git branch operations for a repository

    This class provides a high-level interface for branch management with
    optimized batch operations and error handling.
    """

    def __init__(self, repo_config: RepositoryConfig, retry_attempts: int = 3):
        """
        Initialize branch operations for a repository

        Args:
            repo_config: Repository configuration
            retry_attempts: Number of retry attempts for network operations
        """
        self.repo_config = repo_config
        self.repo_path = repo_config.path
        self.retry_attempts = retry_attempts

        if not is_git_repository(self.repo_path):
            raise GitCommandError(f"Not a git repository: {self.repo_path}")

    def get_current_branch(self) -> Optional[str]:
        """
        Get the current branch name

        Returns:
            Current branch name or None if detached HEAD
        """
        result = execute_git_command(
            ["rev-parse", "--abbrev-ref", "HEAD"],
            self.repo_path
        )

        if result.success:
            branch = result.stdout.strip()
            return None if branch == "HEAD" else branch

        return None

    def list_branches(self, include_remote: bool = False) -> List[BranchInfo]:
        """
        List all branches in the repository

        Args:
            include_remote: Include remote branches

        Returns:
            List of BranchInfo objects
        """
        args = ["branch", "-vv"]
        if include_remote:
            args.append("-a")

        result = execute_git_command(args, self.repo_path)

        branches = []
        if not result.success:
            logger.error(f"Failed to list branches: {result.stderr}")
            return branches

        current_branch = self.get_current_branch()

        for line in result.stdout.split('\n'):
            if not line.strip():
                continue

            # Parse branch information
            is_current = line.startswith('*')
            parts = line.strip('* ').split()

            if not parts:
                continue

            branch_name = parts[0]

            # Extract commit hash and message
            commit_hash = parts[1] if len(parts) > 1 else None

            # Check for remote tracking
            remote = None
            ahead, behind = 0, 0

            if '[' in line and ']' in line:
                tracking_info = line[line.find('[')+1:line.find(']')]
                if ':' in tracking_info:
                    remote = tracking_info.split(':')[0]

                # Parse ahead/behind
                if 'ahead' in tracking_info:
                    ahead = int(tracking_info.split('ahead')[1].split(']')[0].strip())
                if 'behind' in tracking_info:
                    behind = int(tracking_info.split('behind')[1].split(',')[0].strip())

            branches.append(BranchInfo(
                name=branch_name,
                current=is_current or (branch_name == current_branch),
                remote=remote,
                last_commit=commit_hash,
                last_commit_date=None,
                ahead=ahead,
                behind=behind
            ))

        return branches

    def create_branch(self, branch_name: str, from_branch: Optional[str] = None) -> OperationResult:
        """
        Create a new branch

        Args:
            branch_name: Name of the new branch
            from_branch: Source branch (defaults to current branch)

        Returns:
            OperationResult with operation details
        """
        if not validate_branch_name(branch_name):
            return OperationResult(
                success=False,
                branch_name=branch_name,
                operation="create",
                message="Invalid branch name",
                error="Branch name contains invalid characters"
            )

        # Check if branch already exists
        branches = self.list_branches()
        if any(b.name == branch_name for b in branches):
            return OperationResult(
                success=False,
                branch_name=branch_name,
                operation="create",
                message="Branch already exists",
                error=f"Branch '{branch_name}' already exists"
            )

        # Create branch
        args = ["branch", branch_name]
        if from_branch:
            args.append(from_branch)

        result = execute_git_command(args, self.repo_path)

        return OperationResult(
            success=result.success,
            branch_name=branch_name,
            operation="create",
            message=f"Branch '{branch_name}' created successfully" if result.success else "Failed to create branch",
            error=result.stderr if not result.success else None
        )

    def switch_branch(self, branch_name: str, create_if_missing: bool = False) -> OperationResult:
        """
        Switch to a different branch

        Args:
            branch_name: Target branch name
            create_if_missing: Create branch if it doesn't exist

        Returns:
            OperationResult with operation details
        """
        # Check if branch exists
        branches = self.list_branches()
        branch_exists = any(b.name == branch_name for b in branches)

        if not branch_exists and not create_if_missing:
            return OperationResult(
                success=False,
                branch_name=branch_name,
                operation="switch",
                message="Branch does not exist",
                error=f"Branch '{branch_name}' not found"
            )

        # Switch or create and switch
        args = ["checkout"]
        if create_if_missing and not branch_exists:
            args.append("-b")
        args.append(branch_name)

        result = execute_git_command(args, self.repo_path)

        return OperationResult(
            success=result.success,
            branch_name=branch_name,
            operation="switch",
            message=f"Switched to branch '{branch_name}'" if result.success else "Failed to switch branch",
            error=result.stderr if not result.success else None
        )

    def fetch_branch(self, branch_name: str, remote: str = "origin") -> OperationResult:
        """
        Fetch a branch from remote with retry logic

        Args:
            branch_name: Branch name to fetch
            remote: Remote name

        Returns:
            OperationResult with operation details
        """
        def fetch_operation():
            return execute_git_command(
                ["fetch", remote, branch_name],
                self.repo_path,
                timeout=60
            )

        result = retry_with_backoff(
            fetch_operation,
            max_attempts=self.retry_attempts,
            initial_delay=2.0
        )

        return OperationResult(
            success=result.success,
            branch_name=branch_name,
            operation="fetch",
            message=f"Fetched '{branch_name}' from '{remote}'" if result.success else "Failed to fetch branch",
            error=result.stderr if not result.success else None
        )

    def pull_branch(self, branch_name: Optional[str] = None, remote: str = "origin") -> OperationResult:
        """
        Pull updates for a branch with retry logic

        Args:
            branch_name: Branch name (None for current branch)
            remote: Remote name

        Returns:
            OperationResult with operation details
        """
        current = branch_name or self.get_current_branch()
        if not current:
            return OperationResult(
                success=False,
                branch_name="unknown",
                operation="pull",
                message="Cannot determine current branch",
                error="Detached HEAD state"
            )

        def pull_operation():
            return execute_git_command(
                ["pull", remote, current],
                self.repo_path,
                timeout=120
            )

        result = retry_with_backoff(
            pull_operation,
            max_attempts=self.retry_attempts,
            initial_delay=2.0
        )

        return OperationResult(
            success=result.success,
            branch_name=current,
            operation="pull",
            message=f"Pulled updates for '{current}'" if result.success else "Failed to pull updates",
            error=result.stderr if not result.success else None
        )

    def merge_branch(
        self,
        source_branch: str,
        target_branch: Optional[str] = None,
        strategy: str = "merge"
    ) -> OperationResult:
        """
        Merge one branch into another

        Args:
            source_branch: Branch to merge from
            target_branch: Branch to merge into (None for current)
            strategy: Merge strategy ('merge', 'rebase', or 'squash')

        Returns:
            OperationResult with operation details
        """
        current = target_branch or self.get_current_branch()
        if not current:
            return OperationResult(
                success=False,
                branch_name="unknown",
                operation="merge",
                message="Cannot determine target branch",
                error="Detached HEAD state"
            )

        # Switch to target branch if needed
        if target_branch and self.get_current_branch() != target_branch:
            switch_result = self.switch_branch(target_branch)
            if not switch_result.success:
                return switch_result

        # Perform merge based on strategy
        if strategy == "rebase":
            result = execute_git_command(["rebase", source_branch], self.repo_path)
        elif strategy == "squash":
            result = execute_git_command(["merge", "--squash", source_branch], self.repo_path)
        else:  # default merge
            result = execute_git_command(["merge", source_branch], self.repo_path)

        return OperationResult(
            success=result.success,
            branch_name=f"{source_branch} -> {current}",
            operation=f"merge ({strategy})",
            message=f"Merged '{source_branch}' into '{current}'" if result.success else "Failed to merge",
            error=result.stderr if not result.success else None
        )

    def push_branch(
        self,
        branch_name: Optional[str] = None,
        remote: str = "origin",
        set_upstream: bool = False
    ) -> OperationResult:
        """
        Push a branch to remote with retry logic

        Args:
            branch_name: Branch to push (None for current)
            remote: Remote name
            set_upstream: Set upstream tracking

        Returns:
            OperationResult with operation details
        """
        current = branch_name or self.get_current_branch()
        if not current:
            return OperationResult(
                success=False,
                branch_name="unknown",
                operation="push",
                message="Cannot determine branch to push",
                error="Detached HEAD state"
            )

        def push_operation():
            args = ["push"]
            if set_upstream:
                args.extend(["-u", remote, current])
            else:
                args.extend([remote, current])

            return execute_git_command(args, self.repo_path, timeout=120)

        result = retry_with_backoff(
            push_operation,
            max_attempts=self.retry_attempts,
            initial_delay=2.0
        )

        return OperationResult(
            success=result.success,
            branch_name=current,
            operation="push",
            message=f"Pushed '{current}' to '{remote}'" if result.success else "Failed to push branch",
            error=result.stderr if not result.success else None
        )

    def get_branch_status(self, branch_name: str) -> Dict[str, any]:
        """
        Get detailed status of a branch

        Args:
            branch_name: Branch name

        Returns:
            Dictionary with branch status information
        """
        # Get commit count
        commit_result = execute_git_command(
            ["rev-list", "--count", branch_name],
            self.repo_path
        )

        # Get last commit info
        log_result = execute_git_command(
            ["log", "-1", "--format=%H|%an|%ae|%ad|%s", branch_name],
            self.repo_path
        )

        status = {
            "branch": branch_name,
            "exists": commit_result.success,
            "commit_count": int(commit_result.stdout) if commit_result.success else 0,
        }

        if log_result.success:
            parts = log_result.stdout.split('|')
            if len(parts) == 5:
                status.update({
                    "last_commit_hash": parts[0],
                    "last_author_name": parts[1],
                    "last_author_email": parts[2],
                    "last_commit_date": parts[3],
                    "last_commit_message": parts[4],
                })

        return status


class MultiBranchOperations:
    """
    Optimized operations across multiple branches

    This class provides efficient batch operations for working with
    multiple branches concurrently.
    """

    def __init__(
        self,
        repo_config: RepositoryConfig,
        max_workers: int = 4,
        retry_attempts: int = 3
    ):
        """
        Initialize multi-branch operations

        Args:
            repo_config: Repository configuration
            max_workers: Maximum concurrent operations
            retry_attempts: Retry attempts for network operations
        """
        self.branch_ops = BranchOperations(repo_config, retry_attempts)
        self.max_workers = max_workers

    def fetch_all_branches(
        self,
        branch_names: List[str],
        remote: str = "origin"
    ) -> List[OperationResult]:
        """
        Fetch multiple branches concurrently

        Args:
            branch_names: List of branch names to fetch
            remote: Remote name

        Returns:
            List of OperationResults
        """
        results = []

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = {
                executor.submit(self.branch_ops.fetch_branch, branch, remote): branch
                for branch in branch_names
            }

            for future in as_completed(futures):
                try:
                    result = future.result()
                    results.append(result)
                except Exception as e:
                    branch = futures[future]
                    logger.error(f"Error fetching branch {branch}: {e}")
                    results.append(OperationResult(
                        success=False,
                        branch_name=branch,
                        operation="fetch",
                        message="Operation failed with exception",
                        error=str(e)
                    ))

        return results

    def get_all_branch_statuses(self, branch_names: List[str]) -> Dict[str, Dict]:
        """
        Get status for multiple branches concurrently

        Args:
            branch_names: List of branch names

        Returns:
            Dictionary mapping branch names to their status
        """
        statuses = {}

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = {
                executor.submit(self.branch_ops.get_branch_status, branch): branch
                for branch in branch_names
            }

            for future in as_completed(futures):
                branch = futures[future]
                try:
                    status = future.result()
                    statuses[branch] = status
                except Exception as e:
                    logger.error(f"Error getting status for branch {branch}: {e}")
                    statuses[branch] = {"error": str(e)}

        return statuses
