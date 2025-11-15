"""
Conflict Resolution Module

Intelligent conflict detection and resolution strategies for Git operations.

Features:
- Conflict detection and analysis
- Multiple resolution strategies (ours, theirs, manual, interactive)
- Conflict preview and diff analysis
- Automatic resolution with fallback to manual
- Conflict history tracking
"""

import logging
import re
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

from .config import RepositoryConfig
from .utils import execute_git_command, CommandResult
from .branch_ops import OperationResult


logger = logging.getLogger(__name__)


class ResolutionStrategy(Enum):
    """Conflict resolution strategies"""
    OURS = "ours"            # Keep our changes
    THEIRS = "theirs"        # Keep their changes
    MANUAL = "manual"        # Require manual resolution
    INTERACTIVE = "interactive"  # Interactive resolution
    ABORT = "abort"          # Abort the operation


@dataclass
class ConflictFile:
    """Represents a file with conflicts"""
    path: str
    conflict_markers: int
    ours_changes: int
    theirs_changes: int
    conflict_preview: str
    can_auto_resolve: bool


@dataclass
class ConflictInfo:
    """Information about merge conflicts"""
    has_conflicts: bool
    conflicted_files: List[ConflictFile]
    total_conflicts: int
    source_branch: str
    target_branch: str
    timestamp: datetime
    resolution_suggestions: List[str]


@dataclass
class ResolutionResult:
    """Result of conflict resolution"""
    success: bool
    strategy_used: ResolutionStrategy
    files_resolved: List[str]
    files_remaining: List[str]
    message: str
    error: Optional[str] = None


class ConflictDetector:
    """
    Detects and analyzes merge conflicts
    """

    def __init__(self, repo_config: RepositoryConfig):
        """
        Initialize conflict detector

        Args:
            repo_config: Repository configuration
        """
        self.repo_config = repo_config

    def check_for_conflicts(
        self,
        source_branch: str,
        target_branch: str
    ) -> ConflictInfo:
        """
        Check if merging source into target would cause conflicts

        Args:
            source_branch: Source branch name
            target_branch: Target branch name

        Returns:
            ConflictInfo object with detailed conflict information
        """
        logger.info(f"Checking for conflicts: {source_branch} -> {target_branch}")

        # Use git merge-tree to preview conflicts without actually merging
        result = execute_git_command(
            ["merge-tree",
             f"{target_branch}",
             f"{source_branch}"],
            self.repo_config.path
        )

        if not result.success:
            # If merge-tree fails, fall back to checking differences
            return self._analyze_divergence(source_branch, target_branch)

        # Parse merge-tree output for conflicts
        has_conflicts = "<<<<<<" in result.stdout
        conflicted_files = self._parse_conflict_markers(result.stdout)

        suggestions = self._generate_resolution_suggestions(
            conflicted_files,
            source_branch,
            target_branch
        )

        return ConflictInfo(
            has_conflicts=has_conflicts,
            conflicted_files=conflicted_files,
            total_conflicts=sum(cf.conflict_markers for cf in conflicted_files),
            source_branch=source_branch,
            target_branch=target_branch,
            timestamp=datetime.now(),
            resolution_suggestions=suggestions
        )

    def detect_current_conflicts(self) -> ConflictInfo:
        """
        Detect conflicts in current working directory

        Returns:
            ConflictInfo object with current conflict state
        """
        # Get list of conflicted files
        result = execute_git_command(
            ["diff", "--name-only", "--diff-filter=U"],
            self.repo_config.path
        )

        if not result.success:
            logger.error("Failed to get conflicted files")
            return ConflictInfo(
                has_conflicts=False,
                conflicted_files=[],
                total_conflicts=0,
                source_branch="",
                target_branch="",
                timestamp=datetime.now(),
                resolution_suggestions=[]
            )

        conflicted_file_paths = [f.strip() for f in result.stdout.split('\n') if f.strip()]

        if not conflicted_file_paths:
            return ConflictInfo(
                has_conflicts=False,
                conflicted_files=[],
                total_conflicts=0,
                source_branch="",
                target_branch="",
                timestamp=datetime.now(),
                resolution_suggestions=[]
            )

        # Analyze each conflicted file
        conflicted_files = []
        for file_path in conflicted_file_paths:
            conflict_file = self._analyze_conflicted_file(file_path)
            if conflict_file:
                conflicted_files.append(conflict_file)

        suggestions = self._generate_resolution_suggestions(
            conflicted_files,
            "MERGE_HEAD",
            "HEAD"
        )

        return ConflictInfo(
            has_conflicts=True,
            conflicted_files=conflicted_files,
            total_conflicts=sum(cf.conflict_markers for cf in conflicted_files),
            source_branch="MERGE_HEAD",
            target_branch="HEAD",
            timestamp=datetime.now(),
            resolution_suggestions=suggestions
        )

    def _analyze_conflicted_file(self, file_path: str) -> Optional[ConflictFile]:
        """Analyze a single conflicted file"""
        try:
            full_path = f"{self.repo_config.path}/{file_path}"
            with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Count conflict markers
            conflict_markers = content.count('<<<<<<<')
            ours_markers = content.count('=======')
            theirs_markers = content.count('>>>>>>>')

            # Extract a preview of the first conflict
            match = re.search(
                r'<<<<<<<.*?\n(.*?)\n=======\n(.*?)\n>>>>>>>.*?\n',
                content,
                re.DOTALL
            )

            if match:
                ours_preview = match.group(1)[:200]
                theirs_preview = match.group(2)[:200]
                preview = f"Ours:\n{ours_preview}\n\nTheirs:\n{theirs_preview}"
            else:
                preview = "Unable to extract conflict preview"

            # Check if auto-resolution might be possible
            # Simple heuristic: can auto-resolve if conflicts are small
            can_auto = conflict_markers <= 3 and len(content) < 10000

            return ConflictFile(
                path=file_path,
                conflict_markers=conflict_markers,
                ours_changes=ours_markers,
                theirs_changes=theirs_markers,
                conflict_preview=preview,
                can_auto_resolve=can_auto
            )

        except Exception as e:
            logger.error(f"Error analyzing file {file_path}: {e}")
            return None

    def _parse_conflict_markers(self, merge_tree_output: str) -> List[ConflictFile]:
        """Parse conflict markers from merge-tree output"""
        # This is a simplified parser
        # In practice, you'd want more sophisticated parsing

        conflicted_files = []

        # Split by file sections (simplified)
        sections = merge_tree_output.split("@@")

        for section in sections:
            if "<<<<<<" in section:
                # Extract file path (simplified)
                lines = section.split('\n')
                file_path = "unknown"

                for line in lines:
                    if line.startswith('+++') or line.startswith('---'):
                        # Extract filename from diff header
                        parts = line.split('/')
                        if parts:
                            file_path = parts[-1].strip()
                        break

                conflict_markers = section.count('<<<<<<<')

                conflicted_files.append(ConflictFile(
                    path=file_path,
                    conflict_markers=conflict_markers,
                    ours_changes=section.count('======='),
                    theirs_changes=section.count('>>>>>>>'),
                    conflict_preview=section[:500],
                    can_auto_resolve=conflict_markers <= 2
                ))

        return conflicted_files

    def _analyze_divergence(
        self,
        source_branch: str,
        target_branch: str
    ) -> ConflictInfo:
        """Analyze branch divergence when merge-tree is not available"""

        # Get diff stat
        result = execute_git_command(
            ["diff", "--stat", f"{target_branch}...{source_branch}"],
            self.repo_config.path
        )

        # Estimate conflict potential based on changes
        changed_files = result.stdout.count('|')

        return ConflictInfo(
            has_conflicts=changed_files > 0,
            conflicted_files=[],
            total_conflicts=0,
            source_branch=source_branch,
            target_branch=target_branch,
            timestamp=datetime.now(),
            resolution_suggestions=[
                "Branches have diverged",
                "Manual inspection recommended before merging"
            ]
        )

    def _generate_resolution_suggestions(
        self,
        conflicted_files: List[ConflictFile],
        source_branch: str,
        target_branch: str
    ) -> List[str]:
        """Generate suggestions for resolving conflicts"""
        suggestions = []

        if not conflicted_files:
            return ["No conflicts detected"]

        total_conflicts = sum(cf.conflict_markers for cf in conflicted_files)
        auto_resolvable = sum(1 for cf in conflicted_files if cf.can_auto_resolve)

        suggestions.append(
            f"Found {len(conflicted_files)} conflicted file(s) "
            f"with {total_conflicts} conflict marker(s)"
        )

        if auto_resolvable > 0:
            suggestions.append(
                f"{auto_resolvable} file(s) may be auto-resolvable"
            )

        # Strategy suggestions
        if total_conflicts <= 5:
            suggestions.append("Consider using 'ours' or 'theirs' strategy")
        else:
            suggestions.append("Manual resolution recommended due to complexity")

        # File-specific suggestions
        code_files = [cf for cf in conflicted_files
                     if cf.path.endswith(('.py', '.js', '.java', '.go', '.rs'))]
        if code_files:
            suggestions.append(
                f"{len(code_files)} code file(s) affected - careful review needed"
            )

        config_files = [cf for cf in conflicted_files
                       if cf.path.endswith(('.json', '.yml', '.yaml', '.toml', '.ini'))]
        if config_files:
            suggestions.append(
                f"{len(config_files)} config file(s) affected - "
                "may need manual merge"
            )

        return suggestions


class ConflictResolver:
    """
    Resolves merge conflicts using various strategies
    """

    def __init__(self, repo_config: RepositoryConfig):
        """
        Initialize conflict resolver

        Args:
            repo_config: Repository configuration
        """
        self.repo_config = repo_config
        self.detector = ConflictDetector(repo_config)

    def resolve_conflicts(
        self,
        strategy: ResolutionStrategy,
        files: Optional[List[str]] = None
    ) -> ResolutionResult:
        """
        Resolve conflicts using specified strategy

        Args:
            strategy: Resolution strategy to use
            files: Optional list of specific files to resolve

        Returns:
            ResolutionResult with resolution outcome
        """
        logger.info(f"Resolving conflicts with strategy: {strategy.value}")

        # First, detect current conflicts
        conflict_info = self.detector.detect_current_conflicts()

        if not conflict_info.has_conflicts:
            return ResolutionResult(
                success=True,
                strategy_used=strategy,
                files_resolved=[],
                files_remaining=[],
                message="No conflicts to resolve"
            )

        # Determine which files to resolve
        target_files = files if files else [cf.path for cf in conflict_info.conflicted_files]

        if strategy == ResolutionStrategy.OURS:
            return self._resolve_with_ours(target_files)
        elif strategy == ResolutionStrategy.THEIRS:
            return self._resolve_with_theirs(target_files)
        elif strategy == ResolutionStrategy.ABORT:
            return self._abort_merge()
        elif strategy == ResolutionStrategy.MANUAL:
            return ResolutionResult(
                success=False,
                strategy_used=strategy,
                files_resolved=[],
                files_remaining=target_files,
                message="Manual resolution required",
                error="Cannot auto-resolve with MANUAL strategy"
            )
        else:
            return ResolutionResult(
                success=False,
                strategy_used=strategy,
                files_resolved=[],
                files_remaining=target_files,
                message="Strategy not implemented",
                error=f"Strategy {strategy.value} not implemented"
            )

    def _resolve_with_ours(self, files: List[str]) -> ResolutionResult:
        """Resolve conflicts by keeping 'our' version"""
        resolved = []
        failed = []

        for file_path in files:
            result = execute_git_command(
                ["checkout", "--ours", file_path],
                self.repo_config.path
            )

            if result.success:
                # Add file to staging
                add_result = execute_git_command(
                    ["add", file_path],
                    self.repo_config.path
                )

                if add_result.success:
                    resolved.append(file_path)
                    logger.info(f"Resolved {file_path} with 'ours' strategy")
                else:
                    failed.append(file_path)
            else:
                failed.append(file_path)
                logger.error(f"Failed to resolve {file_path}: {result.stderr}")

        success = len(failed) == 0

        return ResolutionResult(
            success=success,
            strategy_used=ResolutionStrategy.OURS,
            files_resolved=resolved,
            files_remaining=failed,
            message=f"Resolved {len(resolved)}/{len(files)} files with 'ours' strategy",
            error=None if success else f"{len(failed)} file(s) failed to resolve"
        )

    def _resolve_with_theirs(self, files: List[str]) -> ResolutionResult:
        """Resolve conflicts by keeping 'their' version"""
        resolved = []
        failed = []

        for file_path in files:
            result = execute_git_command(
                ["checkout", "--theirs", file_path],
                self.repo_config.path
            )

            if result.success:
                # Add file to staging
                add_result = execute_git_command(
                    ["add", file_path],
                    self.repo_config.path
                )

                if add_result.success:
                    resolved.append(file_path)
                    logger.info(f"Resolved {file_path} with 'theirs' strategy")
                else:
                    failed.append(file_path)
            else:
                failed.append(file_path)
                logger.error(f"Failed to resolve {file_path}: {result.stderr}")

        success = len(failed) == 0

        return ResolutionResult(
            success=success,
            strategy_used=ResolutionStrategy.THEIRS,
            files_resolved=resolved,
            files_remaining=failed,
            message=f"Resolved {len(resolved)}/{len(files)} files with 'theirs' strategy",
            error=None if success else f"{len(failed)} file(s) failed to resolve"
        )

    def _abort_merge(self) -> ResolutionResult:
        """Abort the current merge operation"""
        result = execute_git_command(
            ["merge", "--abort"],
            self.repo_config.path
        )

        if result.success:
            return ResolutionResult(
                success=True,
                strategy_used=ResolutionStrategy.ABORT,
                files_resolved=[],
                files_remaining=[],
                message="Merge aborted successfully"
            )
        else:
            return ResolutionResult(
                success=False,
                strategy_used=ResolutionStrategy.ABORT,
                files_resolved=[],
                files_remaining=[],
                message="Failed to abort merge",
                error=result.stderr
            )

    def smart_resolve(self) -> ResolutionResult:
        """
        Attempt intelligent automatic resolution

        This method analyzes conflicts and attempts to resolve them
        automatically using heuristics.
        """
        conflict_info = self.detector.detect_current_conflicts()

        if not conflict_info.has_conflicts:
            return ResolutionResult(
                success=True,
                strategy_used=ResolutionStrategy.MANUAL,
                files_resolved=[],
                files_remaining=[],
                message="No conflicts detected"
            )

        # Categorize files
        auto_resolvable = [cf for cf in conflict_info.conflicted_files
                          if cf.can_auto_resolve]
        manual_files = [cf for cf in conflict_info.conflicted_files
                       if not cf.can_auto_resolve]

        resolved = []
        remaining = [cf.path for cf in manual_files]

        # Try to auto-resolve simple conflicts
        for conflict_file in auto_resolvable:
            # Use a heuristic: if mostly ours or mostly theirs, pick the majority
            if conflict_file.ours_changes > conflict_file.theirs_changes * 2:
                result = self._resolve_with_ours([conflict_file.path])
                if result.success:
                    resolved.extend(result.files_resolved)
                else:
                    remaining.extend(result.files_remaining)
            elif conflict_file.theirs_changes > conflict_file.ours_changes * 2:
                result = self._resolve_with_theirs([conflict_file.path])
                if result.success:
                    resolved.extend(result.files_resolved)
                else:
                    remaining.extend(result.files_remaining)
            else:
                remaining.append(conflict_file.path)

        success = len(remaining) == 0

        return ResolutionResult(
            success=success,
            strategy_used=ResolutionStrategy.INTERACTIVE,
            files_resolved=resolved,
            files_remaining=remaining,
            message=f"Smart resolve: {len(resolved)} auto-resolved, "
                   f"{len(remaining)} need manual review",
            error=None if success else "Some files require manual resolution"
        )


def preview_merge_conflicts(
    repo_config: RepositoryConfig,
    source_branch: str,
    target_branch: str
) -> ConflictInfo:
    """
    Preview potential conflicts before merging

    Args:
        repo_config: Repository configuration
        source_branch: Source branch to merge from
        target_branch: Target branch to merge into

    Returns:
        ConflictInfo with detailed conflict preview
    """
    detector = ConflictDetector(repo_config)
    return detector.check_for_conflicts(source_branch, target_branch)


def resolve_merge_conflicts(
    repo_config: RepositoryConfig,
    strategy: ResolutionStrategy = ResolutionStrategy.MANUAL,
    files: Optional[List[str]] = None
) -> ResolutionResult:
    """
    Resolve current merge conflicts

    Args:
        repo_config: Repository configuration
        strategy: Resolution strategy to use
        files: Optional list of specific files to resolve

    Returns:
        ResolutionResult with resolution outcome
    """
    resolver = ConflictResolver(repo_config)
    return resolver.resolve_conflicts(strategy, files)
