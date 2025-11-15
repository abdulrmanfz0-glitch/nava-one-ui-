"""
Branch Comparison Module

Advanced branch comparison and divergence analysis tools.

Features:
- Branch divergence analysis
- Commit comparison
- File change analysis
- Merge base detection
- Branch relationship visualization
- Similarity scoring
"""

import logging
from typing import List, Dict, Optional, Tuple, Set
from dataclasses import dataclass
from datetime import datetime

from .config import RepositoryConfig
from .utils import execute_git_command, parse_git_log


logger = logging.getLogger(__name__)


@dataclass
class CommitInfo:
    """Information about a single commit"""
    hash: str
    short_hash: str
    author: str
    date: datetime
    message: str
    files_changed: int
    insertions: int
    deletions: int


@dataclass
class BranchDivergence:
    """Analysis of divergence between two branches"""
    branch_a: str
    branch_b: str
    merge_base: str
    ahead: int  # commits in branch_a not in branch_b
    behind: int  # commits in branch_b not in branch_a
    unique_commits_a: List[CommitInfo]
    unique_commits_b: List[CommitInfo]
    common_commits: List[CommitInfo]
    files_diverged: int
    conflict_potential: str  # "low", "medium", "high"
    can_fast_forward: bool
    needs_merge: bool


@dataclass
class FileChange:
    """Information about changes to a specific file"""
    path: str
    status: str  # modified, added, deleted, renamed
    insertions: int
    deletions: int
    binary: bool


@dataclass
class BranchComparison:
    """Detailed comparison between two branches"""
    branch_a: str
    branch_b: str
    divergence: BranchDivergence
    file_changes: List[FileChange]
    total_insertions: int
    total_deletions: int
    total_files_changed: int
    similarity_score: float  # 0.0 to 1.0
    merge_recommendation: str


class BranchAnalyzer:
    """
    Analyzes and compares branches
    """

    def __init__(self, repo_config: RepositoryConfig):
        """
        Initialize branch analyzer

        Args:
            repo_config: Repository configuration
        """
        self.repo_config = repo_config

    def compare_branches(
        self,
        branch_a: str,
        branch_b: str,
        include_files: bool = True
    ) -> BranchComparison:
        """
        Perform comprehensive comparison between two branches

        Args:
            branch_a: First branch name
            branch_b: Second branch name
            include_files: Whether to include detailed file analysis

        Returns:
            BranchComparison object with detailed analysis
        """
        logger.info(f"Comparing branches: {branch_a} <-> {branch_b}")

        # Get divergence analysis
        divergence = self.analyze_divergence(branch_a, branch_b)

        # Get file changes if requested
        file_changes = []
        total_insertions = 0
        total_deletions = 0
        total_files = 0

        if include_files:
            file_changes = self.get_file_changes(branch_a, branch_b)
            for fc in file_changes:
                total_insertions += fc.insertions
                total_deletions += fc.deletions
                total_files += 1

        # Calculate similarity score
        similarity = self._calculate_similarity(divergence, file_changes)

        # Generate merge recommendation
        recommendation = self._generate_recommendation(divergence, similarity)

        return BranchComparison(
            branch_a=branch_a,
            branch_b=branch_b,
            divergence=divergence,
            file_changes=file_changes,
            total_insertions=total_insertions,
            total_deletions=total_deletions,
            total_files_changed=total_files,
            similarity_score=similarity,
            merge_recommendation=recommendation
        )

    def analyze_divergence(
        self,
        branch_a: str,
        branch_b: str
    ) -> BranchDivergence:
        """
        Analyze how two branches have diverged

        Args:
            branch_a: First branch name
            branch_b: Second branch name

        Returns:
            BranchDivergence object with divergence details
        """
        # Find merge base
        merge_base_result = execute_git_command(
            ["merge-base", branch_a, branch_b],
            self.repo_config.path
        )

        merge_base = merge_base_result.stdout.strip() if merge_base_result.success else ""

        # Get commits ahead (in branch_a but not in branch_b)
        ahead_result = execute_git_command(
            ["rev-list", "--count", f"{branch_b}..{branch_a}"],
            self.repo_config.path
        )
        ahead = int(ahead_result.stdout.strip()) if ahead_result.success else 0

        # Get commits behind (in branch_b but not in branch_a)
        behind_result = execute_git_command(
            ["rev-list", "--count", f"{branch_a}..{branch_b}"],
            self.repo_config.path
        )
        behind = int(behind_result.stdout.strip()) if behind_result.success else 0

        # Get unique commits in branch_a
        unique_a = self._get_unique_commits(branch_a, branch_b)

        # Get unique commits in branch_b
        unique_b = self._get_unique_commits(branch_b, branch_a)

        # Get common commits
        common = self._get_common_commits(branch_a, branch_b, merge_base)

        # Count diverged files
        diff_stat_result = execute_git_command(
            ["diff", "--stat", f"{branch_a}...{branch_b}"],
            self.repo_config.path
        )
        files_diverged = diff_stat_result.stdout.count('|') if diff_stat_result.success else 0

        # Assess conflict potential
        conflict_potential = self._assess_conflict_potential(
            ahead, behind, files_diverged
        )

        # Check if fast-forward is possible
        can_fast_forward = behind == 0

        # Check if merge is needed
        needs_merge = ahead > 0 and behind > 0

        return BranchDivergence(
            branch_a=branch_a,
            branch_b=branch_b,
            merge_base=merge_base[:8] if merge_base else "unknown",
            ahead=ahead,
            behind=behind,
            unique_commits_a=unique_a,
            unique_commits_b=unique_b,
            common_commits=common,
            files_diverged=files_diverged,
            conflict_potential=conflict_potential,
            can_fast_forward=can_fast_forward,
            needs_merge=needs_merge
        )

    def get_file_changes(
        self,
        branch_a: str,
        branch_b: str
    ) -> List[FileChange]:
        """
        Get detailed file changes between branches

        Args:
            branch_a: First branch name
            branch_b: Second branch name

        Returns:
            List of FileChange objects
        """
        # Get diff with numstat
        result = execute_git_command(
            ["diff", "--numstat", f"{branch_a}...{branch_b}"],
            self.repo_config.path
        )

        if not result.success:
            logger.error(f"Failed to get file changes: {result.stderr}")
            return []

        file_changes = []

        for line in result.stdout.split('\n'):
            if not line.strip():
                continue

            parts = line.split('\t')
            if len(parts) >= 3:
                insertions_str = parts[0]
                deletions_str = parts[1]
                file_path = parts[2]

                # Handle binary files
                if insertions_str == '-' or deletions_str == '-':
                    file_changes.append(FileChange(
                        path=file_path,
                        status="modified",
                        insertions=0,
                        deletions=0,
                        binary=True
                    ))
                else:
                    file_changes.append(FileChange(
                        path=file_path,
                        status="modified",
                        insertions=int(insertions_str),
                        deletions=int(deletions_str),
                        binary=False
                    ))

        # Get file status (added, deleted, renamed)
        status_result = execute_git_command(
            ["diff", "--name-status", f"{branch_a}...{branch_b}"],
            self.repo_config.path
        )

        if status_result.success:
            status_map = {}
            for line in status_result.stdout.split('\n'):
                if not line.strip():
                    continue
                parts = line.split('\t')
                if len(parts) >= 2:
                    status = parts[0]
                    file_path = parts[1]
                    status_map[file_path] = status

            # Update file change status
            for fc in file_changes:
                if fc.path in status_map:
                    status_code = status_map[fc.path]
                    if status_code == 'A':
                        fc.status = 'added'
                    elif status_code == 'D':
                        fc.status = 'deleted'
                    elif status_code.startswith('R'):
                        fc.status = 'renamed'
                    elif status_code == 'M':
                        fc.status = 'modified'

        return file_changes

    def find_common_ancestor(
        self,
        branch_a: str,
        branch_b: str
    ) -> Optional[str]:
        """
        Find the common ancestor (merge base) of two branches

        Args:
            branch_a: First branch name
            branch_b: Second branch name

        Returns:
            Commit hash of common ancestor or None
        """
        result = execute_git_command(
            ["merge-base", branch_a, branch_b],
            self.repo_config.path
        )

        if result.success:
            return result.stdout.strip()

        return None

    def get_branch_relationships(
        self,
        branches: Optional[List[str]] = None
    ) -> Dict[str, List[str]]:
        """
        Analyze relationships between multiple branches

        Args:
            branches: List of branch names (None for all branches)

        Returns:
            Dictionary mapping branch names to their related branches
        """
        if not branches:
            # Get all branches
            result = execute_git_command(
                ["branch", "--format=%(refname:short)"],
                self.repo_config.path
            )
            if result.success:
                branches = [b.strip() for b in result.stdout.split('\n') if b.strip()]
            else:
                return {}

        relationships = {}

        for branch_a in branches:
            related = []

            for branch_b in branches:
                if branch_a == branch_b:
                    continue

                # Check if branch_a is ancestor of branch_b
                result = execute_git_command(
                    ["merge-base", "--is-ancestor", branch_a, branch_b],
                    self.repo_config.path
                )

                if result.returncode == 0:
                    related.append(f"{branch_b} (descendant)")

                # Check if branch_b is ancestor of branch_a
                result = execute_git_command(
                    ["merge-base", "--is-ancestor", branch_b, branch_a],
                    self.repo_config.path
                )

                if result.returncode == 0:
                    related.append(f"{branch_b} (ancestor)")

            relationships[branch_a] = related

        return relationships

    def _get_unique_commits(
        self,
        branch_a: str,
        branch_b: str,
        limit: int = 50
    ) -> List[CommitInfo]:
        """Get commits in branch_a that are not in branch_b"""
        result = execute_git_command(
            ["log", f"{branch_b}..{branch_a}",
             "--pretty=format:%H|%h|%an|%ai|%s",
             f"-n{limit}"],
            self.repo_config.path
        )

        if not result.success:
            return []

        commits = []
        for line in result.stdout.split('\n'):
            if not line.strip():
                continue

            parts = line.split('|')
            if len(parts) >= 5:
                try:
                    commit_date = datetime.fromisoformat(parts[3].replace(' ', 'T'))
                except:
                    commit_date = datetime.now()

                commits.append(CommitInfo(
                    hash=parts[0],
                    short_hash=parts[1],
                    author=parts[2],
                    date=commit_date,
                    message=parts[4],
                    files_changed=0,
                    insertions=0,
                    deletions=0
                ))

        return commits

    def _get_common_commits(
        self,
        branch_a: str,
        branch_b: str,
        merge_base: str,
        limit: int = 10
    ) -> List[CommitInfo]:
        """Get commits common to both branches"""
        if not merge_base:
            return []

        result = execute_git_command(
            ["log", merge_base,
             "--pretty=format:%H|%h|%an|%ai|%s",
             f"-n{limit}"],
            self.repo_config.path
        )

        if not result.success:
            return []

        commits = []
        for line in result.stdout.split('\n'):
            if not line.strip():
                continue

            parts = line.split('|')
            if len(parts) >= 5:
                try:
                    commit_date = datetime.fromisoformat(parts[3].replace(' ', 'T'))
                except:
                    commit_date = datetime.now()

                commits.append(CommitInfo(
                    hash=parts[0],
                    short_hash=parts[1],
                    author=parts[2],
                    date=commit_date,
                    message=parts[4],
                    files_changed=0,
                    insertions=0,
                    deletions=0
                ))

        return commits

    def _assess_conflict_potential(
        self,
        ahead: int,
        behind: int,
        files_diverged: int
    ) -> str:
        """Assess the potential for merge conflicts"""

        # Heuristic scoring
        if ahead == 0 or behind == 0:
            return "low"

        if files_diverged == 0:
            return "low"

        if files_diverged <= 5 and (ahead <= 10 and behind <= 10):
            return "low"

        if files_diverged <= 20 and (ahead <= 50 and behind <= 50):
            return "medium"

        return "high"

    def _calculate_similarity(
        self,
        divergence: BranchDivergence,
        file_changes: List[FileChange]
    ) -> float:
        """
        Calculate similarity score between branches (0.0 to 1.0)

        1.0 = identical branches
        0.0 = completely different
        """
        if divergence.ahead == 0 and divergence.behind == 0:
            return 1.0

        # Factor in commits
        total_commits = divergence.ahead + divergence.behind
        if total_commits == 0:
            commit_score = 1.0
        else:
            # More commits = less similar
            commit_score = max(0.0, 1.0 - (total_commits / 100.0))

        # Factor in file changes
        if not file_changes:
            file_score = 1.0
        else:
            total_changes = sum(fc.insertions + fc.deletions for fc in file_changes)
            # More changes = less similar
            file_score = max(0.0, 1.0 - (total_changes / 1000.0))

        # Weighted average
        similarity = (commit_score * 0.6) + (file_score * 0.4)

        return round(similarity, 2)

    def _generate_recommendation(
        self,
        divergence: BranchDivergence,
        similarity: float
    ) -> str:
        """Generate merge recommendation based on analysis"""

        if divergence.ahead == 0 and divergence.behind == 0:
            return "Branches are identical - no action needed"

        if divergence.can_fast_forward:
            return f"Fast-forward merge possible - {divergence.branch_a} is {divergence.ahead} commit(s) ahead"

        if divergence.ahead == 0:
            return f"{divergence.branch_a} is behind {divergence.branch_b} by {divergence.behind} commit(s) - consider pulling"

        if divergence.needs_merge:
            if divergence.conflict_potential == "low":
                return f"Merge recommended - low conflict potential ({divergence.ahead} ahead, {divergence.behind} behind)"
            elif divergence.conflict_potential == "medium":
                return f"Merge possible but review carefully - medium conflict potential ({divergence.ahead} ahead, {divergence.behind} behind)"
            else:
                return f"Merge complex - high conflict potential ({divergence.ahead} ahead, {divergence.behind} behind, {divergence.files_diverged} files diverged)"

        return "Branch analysis complete"


def compare_branches(
    repo_config: RepositoryConfig,
    branch_a: str,
    branch_b: str,
    include_files: bool = True
) -> BranchComparison:
    """
    Compare two branches

    Args:
        repo_config: Repository configuration
        branch_a: First branch name
        branch_b: Second branch name
        include_files: Whether to include file-level analysis

    Returns:
        BranchComparison object
    """
    analyzer = BranchAnalyzer(repo_config)
    return analyzer.compare_branches(branch_a, branch_b, include_files)


def analyze_branch_divergence(
    repo_config: RepositoryConfig,
    branch_a: str,
    branch_b: str
) -> BranchDivergence:
    """
    Analyze divergence between two branches

    Args:
        repo_config: Repository configuration
        branch_a: First branch name
        branch_b: Second branch name

    Returns:
        BranchDivergence object
    """
    analyzer = BranchAnalyzer(repo_config)
    return analyzer.analyze_divergence(branch_a, branch_b)
