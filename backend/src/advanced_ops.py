"""
Advanced Git Operations Module

Advanced Git operations including cherry-pick, stash, tags, and more.

Features:
- Cherry-pick operations
- Stash management
- Tag operations
- Rebase operations
- Submodule management
- Worktree operations
"""

import logging
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime

from .config import RepositoryConfig
from .utils import execute_git_command, retry_with_backoff
from .branch_ops import OperationResult


logger = logging.getLogger(__name__)


@dataclass
class StashEntry:
    """Represents a git stash entry"""
    index: int
    name: str
    branch: str
    message: str
    timestamp: str


@dataclass
class TagInfo:
    """Information about a git tag"""
    name: str
    commit_hash: str
    type: str  # lightweight or annotated
    tagger: Optional[str]
    date: Optional[str]
    message: Optional[str]


class AdvancedGitOperations:
    """
    Advanced Git operations
    """

    def __init__(self, repo_config: RepositoryConfig, retry_attempts: int = 3):
        """
        Initialize advanced operations

        Args:
            repo_config: Repository configuration
            retry_attempts: Number of retry attempts for operations
        """
        self.repo_config = repo_config
        self.repo_path = repo_config.path
        self.retry_attempts = retry_attempts

    # ===== Cherry-pick Operations =====

    def cherry_pick_commit(
        self,
        commit_hash: str,
        branch_name: Optional[str] = None
    ) -> OperationResult:
        """
        Cherry-pick a specific commit

        Args:
            commit_hash: Commit hash to cherry-pick
            branch_name: Optional branch name to cherry-pick onto

        Returns:
            OperationResult
        """
        logger.info(f"Cherry-picking commit: {commit_hash}")

        # Switch to branch if specified
        if branch_name:
            switch_result = execute_git_command(
                ["checkout", branch_name],
                self.repo_path
            )
            if not switch_result.success:
                return OperationResult(
                    success=False,
                    branch_name=branch_name or "current",
                    operation="cherry-pick",
                    message=f"Failed to switch to branch {branch_name}",
                    error=switch_result.stderr
                )

        # Perform cherry-pick
        result = execute_git_command(
            ["cherry-pick", commit_hash],
            self.repo_path
        )

        if result.success:
            return OperationResult(
                success=True,
                branch_name=branch_name or "current",
                operation="cherry-pick",
                message=f"Successfully cherry-picked {commit_hash[:8]}"
            )
        else:
            # Check if there are conflicts
            if "conflict" in result.stderr.lower():
                return OperationResult(
                    success=False,
                    branch_name=branch_name or "current",
                    operation="cherry-pick",
                    message="Cherry-pick resulted in conflicts",
                    error=result.stderr
                )
            else:
                return OperationResult(
                    success=False,
                    branch_name=branch_name or "current",
                    operation="cherry-pick",
                    message="Cherry-pick failed",
                    error=result.stderr
                )

    def cherry_pick_range(
        self,
        start_commit: str,
        end_commit: str,
        branch_name: Optional[str] = None
    ) -> List[OperationResult]:
        """
        Cherry-pick a range of commits

        Args:
            start_commit: Start commit hash (exclusive)
            end_commit: End commit hash (inclusive)
            branch_name: Optional branch name to cherry-pick onto

        Returns:
            List of OperationResults
        """
        logger.info(f"Cherry-picking range: {start_commit[:8]}..{end_commit[:8]}")

        # Switch to branch if specified
        if branch_name:
            switch_result = execute_git_command(
                ["checkout", branch_name],
                self.repo_path
            )
            if not switch_result.success:
                return [OperationResult(
                    success=False,
                    branch_name=branch_name,
                    operation="cherry-pick-range",
                    message=f"Failed to switch to branch {branch_name}",
                    error=switch_result.stderr
                )]

        # Perform cherry-pick
        result = execute_git_command(
            ["cherry-pick", f"{start_commit}..{end_commit}"],
            self.repo_path
        )

        if result.success:
            return [OperationResult(
                success=True,
                branch_name=branch_name or "current",
                operation="cherry-pick-range",
                message=f"Successfully cherry-picked {start_commit[:8]}..{end_commit[:8]}"
            )]
        else:
            return [OperationResult(
                success=False,
                branch_name=branch_name or "current",
                operation="cherry-pick-range",
                message="Cherry-pick range failed",
                error=result.stderr
            )]

    def abort_cherry_pick(self) -> OperationResult:
        """
        Abort an ongoing cherry-pick operation

        Returns:
            OperationResult
        """
        result = execute_git_command(
            ["cherry-pick", "--abort"],
            self.repo_path
        )

        return OperationResult(
            success=result.success,
            branch_name="current",
            operation="cherry-pick-abort",
            message="Cherry-pick aborted" if result.success else "Failed to abort cherry-pick",
            error=result.stderr if not result.success else None
        )

    # ===== Stash Operations =====

    def stash_save(
        self,
        message: Optional[str] = None,
        include_untracked: bool = False
    ) -> OperationResult:
        """
        Save changes to stash

        Args:
            message: Optional stash message
            include_untracked: Include untracked files

        Returns:
            OperationResult
        """
        logger.info("Saving changes to stash")

        cmd = ["stash", "push"]

        if include_untracked:
            cmd.append("--include-untracked")

        if message:
            cmd.extend(["-m", message])

        result = execute_git_command(cmd, self.repo_path)

        return OperationResult(
            success=result.success,
            branch_name="current",
            operation="stash-save",
            message="Changes stashed successfully" if result.success else "Failed to stash",
            error=result.stderr if not result.success else None
        )

    def stash_pop(self, index: int = 0) -> OperationResult:
        """
        Apply and remove stash entry

        Args:
            index: Stash index (default: 0 = most recent)

        Returns:
            OperationResult
        """
        logger.info(f"Popping stash entry: {index}")

        result = execute_git_command(
            ["stash", "pop", f"stash@{{{index}}}"],
            self.repo_path
        )

        return OperationResult(
            success=result.success,
            branch_name="current",
            operation="stash-pop",
            message=f"Stash {index} applied" if result.success else "Failed to pop stash",
            error=result.stderr if not result.success else None
        )

    def stash_apply(self, index: int = 0) -> OperationResult:
        """
        Apply stash entry without removing it

        Args:
            index: Stash index (default: 0 = most recent)

        Returns:
            OperationResult
        """
        logger.info(f"Applying stash entry: {index}")

        result = execute_git_command(
            ["stash", "apply", f"stash@{{{index}}}"],
            self.repo_path
        )

        return OperationResult(
            success=result.success,
            branch_name="current",
            operation="stash-apply",
            message=f"Stash {index} applied" if result.success else "Failed to apply stash",
            error=result.stderr if not result.success else None
        )

    def stash_list(self) -> List[StashEntry]:
        """
        List all stash entries

        Returns:
            List of StashEntry objects
        """
        result = execute_git_command(
            ["stash", "list", "--format=%gd|%gs|%cr"],
            self.repo_path
        )

        if not result.success:
            logger.error("Failed to list stash entries")
            return []

        stashes = []
        for i, line in enumerate(result.stdout.split('\n')):
            if not line.strip():
                continue

            parts = line.split('|')
            if len(parts) >= 3:
                stashes.append(StashEntry(
                    index=i,
                    name=parts[0],
                    branch="unknown",
                    message=parts[1],
                    timestamp=parts[2]
                ))

        return stashes

    def stash_drop(self, index: int = 0) -> OperationResult:
        """
        Delete a stash entry

        Args:
            index: Stash index to delete

        Returns:
            OperationResult
        """
        result = execute_git_command(
            ["stash", "drop", f"stash@{{{index}}}"],
            self.repo_path
        )

        return OperationResult(
            success=result.success,
            branch_name="current",
            operation="stash-drop",
            message=f"Stash {index} dropped" if result.success else "Failed to drop stash",
            error=result.stderr if not result.success else None
        )

    def stash_clear(self) -> OperationResult:
        """
        Clear all stash entries

        Returns:
            OperationResult
        """
        result = execute_git_command(
            ["stash", "clear"],
            self.repo_path
        )

        return OperationResult(
            success=result.success,
            branch_name="current",
            operation="stash-clear",
            message="All stashes cleared" if result.success else "Failed to clear stashes",
            error=result.stderr if not result.success else None
        )

    # ===== Tag Operations =====

    def create_tag(
        self,
        tag_name: str,
        message: Optional[str] = None,
        commit: Optional[str] = None
    ) -> OperationResult:
        """
        Create a new tag

        Args:
            tag_name: Tag name
            message: Optional annotation message (creates annotated tag)
            commit: Optional commit hash to tag (default: HEAD)

        Returns:
            OperationResult
        """
        logger.info(f"Creating tag: {tag_name}")

        cmd = ["tag"]

        if message:
            cmd.extend(["-a", tag_name, "-m", message])
        else:
            cmd.append(tag_name)

        if commit:
            cmd.append(commit)

        result = execute_git_command(cmd, self.repo_path)

        return OperationResult(
            success=result.success,
            branch_name="current",
            operation="tag-create",
            message=f"Tag {tag_name} created" if result.success else "Failed to create tag",
            error=result.stderr if not result.success else None
        )

    def delete_tag(self, tag_name: str) -> OperationResult:
        """
        Delete a tag

        Args:
            tag_name: Tag name to delete

        Returns:
            OperationResult
        """
        logger.info(f"Deleting tag: {tag_name}")

        result = execute_git_command(
            ["tag", "-d", tag_name],
            self.repo_path
        )

        return OperationResult(
            success=result.success,
            branch_name="current",
            operation="tag-delete",
            message=f"Tag {tag_name} deleted" if result.success else "Failed to delete tag",
            error=result.stderr if not result.success else None
        )

    def list_tags(self, pattern: Optional[str] = None) -> List[TagInfo]:
        """
        List all tags

        Args:
            pattern: Optional pattern to filter tags (e.g., "v1.*")

        Returns:
            List of TagInfo objects
        """
        cmd = ["tag", "-l"]

        if pattern:
            cmd.append(pattern)

        cmd.append("--format=%(refname:short)|%(objectname:short)|%(objecttype)")

        result = execute_git_command(cmd, self.repo_path)

        if not result.success:
            logger.error("Failed to list tags")
            return []

        tags = []
        for line in result.stdout.split('\n'):
            if not line.strip():
                continue

            parts = line.split('|')
            if len(parts) >= 3:
                tag_name = parts[0]
                commit_hash = parts[1]
                tag_type = "annotated" if parts[2] == "tag" else "lightweight"

                tags.append(TagInfo(
                    name=tag_name,
                    commit_hash=commit_hash,
                    type=tag_type,
                    tagger=None,
                    date=None,
                    message=None
                ))

        return tags

    def push_tag(
        self,
        tag_name: str,
        remote: str = "origin"
    ) -> OperationResult:
        """
        Push tag to remote

        Args:
            tag_name: Tag name to push
            remote: Remote name

        Returns:
            OperationResult
        """
        logger.info(f"Pushing tag {tag_name} to {remote}")

        def push_operation():
            return execute_git_command(
                ["push", remote, tag_name],
                self.repo_path
            )

        result = retry_with_backoff(
            push_operation,
            max_attempts=self.retry_attempts
        )

        return OperationResult(
            success=result.success,
            branch_name="current",
            operation="tag-push",
            message=f"Tag {tag_name} pushed to {remote}" if result.success else "Failed to push tag",
            error=result.stderr if not result.success else None
        )

    def push_all_tags(self, remote: str = "origin") -> OperationResult:
        """
        Push all tags to remote

        Args:
            remote: Remote name

        Returns:
            OperationResult
        """
        logger.info(f"Pushing all tags to {remote}")

        def push_operation():
            return execute_git_command(
                ["push", remote, "--tags"],
                self.repo_path
            )

        result = retry_with_backoff(
            push_operation,
            max_attempts=self.retry_attempts
        )

        return OperationResult(
            success=result.success,
            branch_name="current",
            operation="tags-push-all",
            message=f"All tags pushed to {remote}" if result.success else "Failed to push tags",
            error=result.stderr if not result.success else None
        )

    # ===== Rebase Operations =====

    def rebase_branch(
        self,
        base_branch: str,
        branch_name: Optional[str] = None
    ) -> OperationResult:
        """
        Rebase current or specified branch onto base branch

        Args:
            base_branch: Branch to rebase onto
            branch_name: Optional branch to rebase (default: current)

        Returns:
            OperationResult
        """
        logger.info(f"Rebasing onto {base_branch}")

        # Switch to branch if specified
        if branch_name:
            switch_result = execute_git_command(
                ["checkout", branch_name],
                self.repo_path
            )
            if not switch_result.success:
                return OperationResult(
                    success=False,
                    branch_name=branch_name,
                    operation="rebase",
                    message=f"Failed to switch to branch {branch_name}",
                    error=switch_result.stderr
                )

        # Perform rebase
        result = execute_git_command(
            ["rebase", base_branch],
            self.repo_path
        )

        if result.success:
            return OperationResult(
                success=True,
                branch_name=branch_name or "current",
                operation="rebase",
                message=f"Successfully rebased onto {base_branch}"
            )
        else:
            return OperationResult(
                success=False,
                branch_name=branch_name or "current",
                operation="rebase",
                message="Rebase failed",
                error=result.stderr
            )

    def abort_rebase(self) -> OperationResult:
        """
        Abort an ongoing rebase operation

        Returns:
            OperationResult
        """
        result = execute_git_command(
            ["rebase", "--abort"],
            self.repo_path
        )

        return OperationResult(
            success=result.success,
            branch_name="current",
            operation="rebase-abort",
            message="Rebase aborted" if result.success else "Failed to abort rebase",
            error=result.stderr if not result.success else None
        )

    def continue_rebase(self) -> OperationResult:
        """
        Continue rebase after resolving conflicts

        Returns:
            OperationResult
        """
        result = execute_git_command(
            ["rebase", "--continue"],
            self.repo_path
        )

        return OperationResult(
            success=result.success,
            branch_name="current",
            operation="rebase-continue",
            message="Rebase continued" if result.success else "Failed to continue rebase",
            error=result.stderr if not result.success else None
        )

    # ===== Clean Operations =====

    def clean_untracked(
        self,
        dry_run: bool = True,
        include_directories: bool = False
    ) -> OperationResult:
        """
        Remove untracked files

        Args:
            dry_run: If True, only show what would be removed
            include_directories: Include untracked directories

        Returns:
            OperationResult
        """
        cmd = ["clean"]

        if dry_run:
            cmd.append("-n")
        else:
            cmd.append("-f")

        if include_directories:
            cmd.append("-d")

        result = execute_git_command(cmd, self.repo_path)

        action = "Would remove" if dry_run else "Removed"

        return OperationResult(
            success=result.success,
            branch_name="current",
            operation="clean",
            message=f"{action} untracked files" if result.success else "Clean operation failed",
            error=result.stderr if not result.success else None
        )

    # ===== Reset Operations =====

    def reset_soft(self, commit: str = "HEAD~1") -> OperationResult:
        """
        Soft reset to specified commit

        Args:
            commit: Commit to reset to

        Returns:
            OperationResult
        """
        result = execute_git_command(
            ["reset", "--soft", commit],
            self.repo_path
        )

        return OperationResult(
            success=result.success,
            branch_name="current",
            operation="reset-soft",
            message=f"Soft reset to {commit}" if result.success else "Reset failed",
            error=result.stderr if not result.success else None
        )

    def reset_hard(self, commit: str = "HEAD") -> OperationResult:
        """
        Hard reset to specified commit (DESTRUCTIVE!)

        Args:
            commit: Commit to reset to

        Returns:
            OperationResult
        """
        logger.warning(f"Performing hard reset to {commit}")

        result = execute_git_command(
            ["reset", "--hard", commit],
            self.repo_path
        )

        return OperationResult(
            success=result.success,
            branch_name="current",
            operation="reset-hard",
            message=f"Hard reset to {commit}" if result.success else "Reset failed",
            error=result.stderr if not result.success else None
        )
