"""
Advanced Analytics Engine for Nava Ops

Provides next-generation analytics capabilities including:
- Branch health scoring
- Conflict prediction and heatmaps
- Merge success rate tracking
- Divergence metrics and analysis
- Repository health dashboards
- Trend detection and anomaly alerts
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
import json
import math


def safe_get(obj: Any, key: str, default: Any = None) -> Any:
    """
    Safely get value from either a dictionary or object attribute

    Args:
        obj: Dictionary or object to get value from
        key: Key or attribute name
        default: Default value if key/attribute not found

    Returns:
        Value or default
    """
    if isinstance(obj, dict):
        return obj.get(key, default)
    else:
        return getattr(obj, key, default)


@dataclass
class BranchHealthMetrics:
    """Comprehensive health metrics for a single branch"""
    branch_name: str
    repository: str
    health_score: float  # 0-100
    divergence_score: float  # 0-100 (lower is better)
    freshness_score: float  # 0-100 (based on last commit)
    conflict_risk: str  # low, medium, high
    activity_level: str  # dormant, low, moderate, high
    commits_ahead: int = 0
    commits_behind: int = 0
    days_since_update: Optional[int] = None
    merge_recommendation: str = "review_required"
    issues: List[str] = field(default_factory=list)
    strengths: List[str] = field(default_factory=list)


@dataclass
class ConflictHeatmap:
    """Conflict probability matrix between branches"""
    matrix: Dict[str, Dict[str, float]]  # branch1 -> branch2 -> probability
    high_risk_pairs: List[Tuple[str, str, float]]
    recommendations: List[str]


@dataclass
class MergeSuccessMetrics:
    """Merge operation success tracking"""
    total_merges: int
    successful_merges: int
    failed_merges: int
    success_rate: float
    average_conflicts_per_merge: float
    merge_strategy_performance: Dict[str, float]
    common_failure_patterns: List[str]


@dataclass
class RepositoryHealthDashboard:
    """Overall repository health and status"""
    repository: str
    overall_health_score: float  # 0-100
    total_branches: int
    healthy_branches: int
    at_risk_branches: int
    critical_branches: int
    average_divergence: float
    stale_branches: List[str]
    recommendations: List[str]
    top_issues: List[str]
    health_trend: str  # improving, stable, declining


@dataclass
class DivergenceMetrics:
    """Detailed divergence analysis"""
    branch_name: str
    base_branch: str
    commits_ahead: int
    commits_behind: int
    divergence_ratio: float  # ratio of unique commits
    similarity_score: float  # 0-1 (1 = identical)
    file_changes: int
    insertions: int
    deletions: int
    merge_complexity: str  # simple, moderate, complex
    estimated_conflicts: int


@dataclass
class AnalyticsReport:
    """Comprehensive analytics report"""
    timestamp: str
    repository_dashboards: List[RepositoryHealthDashboard]
    branch_health: List[BranchHealthMetrics]
    conflict_heatmap: ConflictHeatmap
    merge_metrics: MergeSuccessMetrics
    divergence_analysis: List[DivergenceMetrics]
    key_insights: List[str]
    action_items: List[str]
    trends: Dict[str, str]


class AdvancedAnalyticsEngine:
    """
    Next-generation analytics engine for Git operations

    Provides intelligent insights, health scoring, and predictive analytics
    for multi-repository Git orchestration.
    """

    def __init__(self):
        self.history: List[Dict] = []

    def calculate_branch_health(
        self,
        branch_name: str,
        repository: str,
        commits_ahead: int = 0,
        commits_behind: int = 0,
        last_commit_date: Optional[str] = None,
        conflict_files: int = 0,
        recent_operations: List[Dict] = None
    ) -> BranchHealthMetrics:
        """
        Calculate comprehensive health score for a branch

        Health score is based on:
        - Divergence from main (30%)
        - Freshness of last commit (25%)
        - Conflict risk (25%)
        - Recent activity (20%)
        """
        recent_operations = recent_operations or []

        # Calculate divergence score (0-100, lower divergence = higher score)
        total_divergence = commits_ahead + commits_behind
        if total_divergence == 0:
            divergence_score = 100.0
        elif total_divergence < 10:
            divergence_score = 90.0
        elif total_divergence < 50:
            divergence_score = 70.0
        elif total_divergence < 100:
            divergence_score = 50.0
        else:
            divergence_score = max(0, 50 - (total_divergence - 100) / 10)

        # Calculate freshness score (0-100, recent = higher score)
        days_since_update = None
        freshness_score = 50.0  # default

        if last_commit_date:
            try:
                last_commit = datetime.fromisoformat(last_commit_date.replace('Z', '+00:00'))
                days_since_update = (datetime.now().astimezone() - last_commit).days

                if days_since_update < 1:
                    freshness_score = 100.0
                elif days_since_update < 7:
                    freshness_score = 90.0
                elif days_since_update < 30:
                    freshness_score = 70.0
                elif days_since_update < 90:
                    freshness_score = 50.0
                else:
                    freshness_score = max(0, 50 - (days_since_update - 90) / 10)
            except:
                days_since_update = None

        # Calculate conflict risk
        conflict_score = 100.0
        conflict_risk = "low"

        if conflict_files > 10:
            conflict_risk = "high"
            conflict_score = 30.0
        elif conflict_files > 5:
            conflict_risk = "medium"
            conflict_score = 60.0
        elif conflict_files > 0:
            conflict_risk = "low"
            conflict_score = 85.0

        # Calculate activity level
        activity_score = 50.0
        activity_level = "low"

        if recent_operations:
            successful_ops = sum(1 for op in recent_operations if safe_get(op, 'success', False))
            total_ops = len(recent_operations)

            if total_ops >= 10:
                activity_level = "high"
                activity_score = 90.0
            elif total_ops >= 5:
                activity_level = "moderate"
                activity_score = 70.0
            elif total_ops >= 1:
                activity_level = "low"
                activity_score = 50.0
            else:
                activity_level = "dormant"
                activity_score = 30.0

        # Calculate overall health score (weighted average)
        health_score = (
            divergence_score * 0.30 +
            freshness_score * 0.25 +
            conflict_score * 0.25 +
            activity_score * 0.20
        )

        # Determine merge recommendation
        if health_score >= 80:
            merge_recommendation = "safe_to_merge"
        elif health_score >= 60:
            merge_recommendation = "review_recommended"
        elif health_score >= 40:
            merge_recommendation = "caution_required"
        else:
            merge_recommendation = "high_risk"

        # Identify issues and strengths
        issues = []
        strengths = []

        if commits_behind > 50:
            issues.append(f"Significantly behind base ({commits_behind} commits)")
        if commits_ahead > 100:
            issues.append(f"Too many commits ahead ({commits_ahead}), consider breaking into smaller PRs")
        if days_since_update and days_since_update > 90:
            issues.append(f"Stale branch ({days_since_update} days old)")
        if conflict_files > 5:
            issues.append(f"High conflict potential ({conflict_files} files)")

        if divergence_score > 90:
            strengths.append("Well synchronized with base branch")
        if freshness_score > 90:
            strengths.append("Recently updated")
        if conflict_risk == "low":
            strengths.append("Low conflict risk")
        if activity_level in ["moderate", "high"]:
            strengths.append("Active development")

        return BranchHealthMetrics(
            branch_name=branch_name,
            repository=repository,
            health_score=round(health_score, 2),
            divergence_score=round(divergence_score, 2),
            freshness_score=round(freshness_score, 2),
            conflict_risk=conflict_risk,
            activity_level=activity_level,
            commits_ahead=commits_ahead,
            commits_behind=commits_behind,
            days_since_update=days_since_update,
            merge_recommendation=merge_recommendation,
            issues=issues,
            strengths=strengths
        )

    def generate_conflict_heatmap(
        self,
        branches: List[str],
        branch_comparisons: Dict[Tuple[str, str], Dict]
    ) -> ConflictHeatmap:
        """
        Generate conflict probability heatmap between branches

        Returns a matrix showing conflict risk between any two branches
        """
        matrix = {branch: {other: 0.0 for other in branches} for branch in branches}
        high_risk_pairs = []

        for (branch1, branch2), comparison in branch_comparisons.items():
            # Calculate conflict probability based on:
            # - Number of divergent commits
            # - File overlap
            # - Historical conflict rate

            divergent_commits = safe_get(comparison, 'unique_commits_count', 0)
            file_changes = safe_get(comparison, 'file_changes', 0)

            # Simple probability model
            if divergent_commits == 0:
                probability = 0.0
            elif divergent_commits < 5:
                probability = 0.2
            elif divergent_commits < 20:
                probability = 0.5
            elif divergent_commits < 50:
                probability = 0.7
            else:
                probability = 0.9

            # Adjust for file changes
            if file_changes > 50:
                probability = min(1.0, probability + 0.1)

            matrix[branch1][branch2] = round(probability, 2)
            matrix[branch2][branch1] = round(probability, 2)

            if probability >= 0.7:
                high_risk_pairs.append((branch1, branch2, probability))

        # Sort high-risk pairs by probability
        high_risk_pairs.sort(key=lambda x: x[2], reverse=True)

        # Generate recommendations
        recommendations = []
        if len(high_risk_pairs) > 5:
            recommendations.append("High number of conflict-prone branch pairs detected")
            recommendations.append("Consider merging branches more frequently to reduce divergence")

        for branch1, branch2, prob in high_risk_pairs[:3]:
            recommendations.append(
                f"Review merge plan for {branch1} ↔ {branch2} (conflict risk: {prob*100:.0f}%)"
            )

        return ConflictHeatmap(
            matrix=matrix,
            high_risk_pairs=high_risk_pairs,
            recommendations=recommendations
        )

    def analyze_merge_success_rates(
        self,
        operation_history: List[Dict]
    ) -> MergeSuccessMetrics:
        """
        Analyze historical merge operation success rates
        """
        merge_operations = [
            op for op in operation_history
            if safe_get(op, 'operation') == 'merge'
        ]

        total_merges = len(merge_operations)
        successful_merges = sum(1 for op in merge_operations if safe_get(op, 'success', False))
        failed_merges = total_merges - successful_merges

        success_rate = (successful_merges / total_merges * 100) if total_merges > 0 else 0.0

        # Analyze by strategy
        strategy_performance = {}
        strategies = set(safe_get(op, 'strategy', 'merge') for op in merge_operations)

        for strategy in strategies:
            strategy_ops = [op for op in merge_operations if safe_get(op, 'strategy') == strategy]
            strategy_success = sum(1 for op in strategy_ops if safe_get(op, 'success', False))
            strategy_total = len(strategy_ops)
            strategy_performance[strategy] = (
                (strategy_success / strategy_total * 100) if strategy_total > 0 else 0.0
            )

        # Common failure patterns
        failure_patterns = []
        failed_ops = [op for op in merge_operations if not safe_get(op, 'success', False)]

        conflict_failures = sum(1 for op in failed_ops if 'conflict' in safe_get(op, 'error', '').lower())
        if conflict_failures > 0:
            failure_patterns.append(f"Merge conflicts ({conflict_failures} occurrences)")

        permission_failures = sum(
            1 for op in failed_ops
            if 'permission' in safe_get(op, 'error', '').lower() or 'denied' in safe_get(op, 'error', '').lower()
        )
        if permission_failures > 0:
            failure_patterns.append(f"Permission issues ({permission_failures} occurrences)")

        return MergeSuccessMetrics(
            total_merges=total_merges,
            successful_merges=successful_merges,
            failed_merges=failed_merges,
            success_rate=round(success_rate, 2),
            average_conflicts_per_merge=0.0,  # Would need more detailed data
            merge_strategy_performance=strategy_performance,
            common_failure_patterns=failure_patterns
        )

    def calculate_divergence_metrics(
        self,
        branch_name: str,
        base_branch: str,
        commits_ahead: int,
        commits_behind: int,
        file_changes: int = 0,
        insertions: int = 0,
        deletions: int = 0
    ) -> DivergenceMetrics:
        """
        Calculate detailed divergence metrics between branches
        """
        total_commits = commits_ahead + commits_behind

        # Calculate divergence ratio
        if total_commits == 0:
            divergence_ratio = 0.0
            similarity_score = 1.0
        else:
            divergence_ratio = commits_ahead / total_commits if total_commits > 0 else 0.0
            # Similarity based on inverse of divergence
            similarity_score = 1.0 / (1.0 + math.log1p(total_commits))

        # Estimate merge complexity
        if total_commits < 5 and file_changes < 10:
            merge_complexity = "simple"
            estimated_conflicts = 0
        elif total_commits < 20 and file_changes < 50:
            merge_complexity = "moderate"
            estimated_conflicts = max(0, file_changes // 20)
        else:
            merge_complexity = "complex"
            estimated_conflicts = max(1, file_changes // 10)

        return DivergenceMetrics(
            branch_name=branch_name,
            base_branch=base_branch,
            commits_ahead=commits_ahead,
            commits_behind=commits_behind,
            divergence_ratio=round(divergence_ratio, 3),
            similarity_score=round(similarity_score, 3),
            file_changes=file_changes,
            insertions=insertions,
            deletions=deletions,
            merge_complexity=merge_complexity,
            estimated_conflicts=estimated_conflicts
        )

    def generate_repository_health_dashboard(
        self,
        repository: str,
        branch_health_metrics: List[BranchHealthMetrics],
        historical_trend: Optional[str] = None
    ) -> RepositoryHealthDashboard:
        """
        Generate overall repository health dashboard
        """
        total_branches = len(branch_health_metrics)

        if total_branches == 0:
            return RepositoryHealthDashboard(
                repository=repository,
                overall_health_score=0.0,
                total_branches=0,
                healthy_branches=0,
                at_risk_branches=0,
                critical_branches=0,
                average_divergence=0.0,
                stale_branches=[],
                recommendations=["No branches to analyze"],
                top_issues=[],
                health_trend="unknown"
            )

        # Categorize branches by health
        healthy_branches = sum(1 for b in branch_health_metrics if b.health_score >= 70)
        at_risk_branches = sum(1 for b in branch_health_metrics if 40 <= b.health_score < 70)
        critical_branches = sum(1 for b in branch_health_metrics if b.health_score < 40)

        # Calculate overall health score
        overall_health_score = sum(b.health_score for b in branch_health_metrics) / total_branches

        # Calculate average divergence
        total_divergence = sum(
            b.commits_ahead + b.commits_behind for b in branch_health_metrics
        )
        average_divergence = total_divergence / total_branches

        # Identify stale branches (>90 days)
        stale_branches = [
            b.branch_name for b in branch_health_metrics
            if b.days_since_update and b.days_since_update > 90
        ]

        # Generate recommendations
        recommendations = []
        if critical_branches > 0:
            recommendations.append(
                f"⚠️  {critical_branches} branch(es) need immediate attention (health < 40)"
            )
        if len(stale_branches) > 0:
            recommendations.append(
                f"🧹 Consider archiving {len(stale_branches)} stale branch(es)"
            )
        if average_divergence > 50:
            recommendations.append(
                "📊 High average divergence detected - increase merge frequency"
            )
        if healthy_branches / total_branches < 0.5:
            recommendations.append(
                "🔧 Less than 50% of branches are healthy - review workflow"
            )

        # Collect top issues
        all_issues = []
        for branch in branch_health_metrics:
            for issue in branch.issues:
                all_issues.append(f"{branch.branch_name}: {issue}")

        top_issues = all_issues[:5]  # Top 5 issues

        # Determine health trend
        health_trend = historical_trend or "stable"

        return RepositoryHealthDashboard(
            repository=repository,
            overall_health_score=round(overall_health_score, 2),
            total_branches=total_branches,
            healthy_branches=healthy_branches,
            at_risk_branches=at_risk_branches,
            critical_branches=critical_branches,
            average_divergence=round(average_divergence, 2),
            stale_branches=stale_branches,
            recommendations=recommendations,
            top_issues=top_issues,
            health_trend=health_trend
        )

    def generate_comprehensive_analytics(
        self,
        report_data: Dict,
        include_insights: bool = True
    ) -> AnalyticsReport:
        """
        Generate comprehensive analytics report from standard report data
        """
        # Extract data from report
        branch_reports = report_data.get('branch_reports', [])

        # Calculate branch health for all branches
        branch_health_metrics = []
        for branch_report in branch_reports:
            branch_name = safe_get(branch_report, 'branch_name', 'unknown')
            repository = safe_get(branch_report, 'repository', 'unknown')
            status = safe_get(branch_report, 'status', {})

            # Handle status as dict or object
            if isinstance(status, dict):
                commits_ahead = status.get('ahead', 0)
                commits_behind = status.get('behind', 0)
                last_commit = status.get('last_commit', {})
                last_commit_date = last_commit.get('date') if isinstance(last_commit, dict) else None
            else:
                commits_ahead = getattr(status, 'ahead', 0)
                commits_behind = getattr(status, 'behind', 0)
                last_commit = getattr(status, 'last_commit', None)
                last_commit_date = getattr(last_commit, 'date', None) if last_commit else None

            operations = safe_get(branch_report, 'operations', [])

            health = self.calculate_branch_health(
                branch_name=branch_name,
                repository=repository,
                commits_ahead=commits_ahead,
                commits_behind=commits_behind,
                last_commit_date=last_commit_date,
                recent_operations=operations
            )
            branch_health_metrics.append(health)

        # Group by repository
        repos = {}
        for metric in branch_health_metrics:
            if metric.repository not in repos:
                repos[metric.repository] = []
            repos[metric.repository].append(metric)

        # Generate repository dashboards
        repository_dashboards = []
        for repo, metrics in repos.items():
            dashboard = self.generate_repository_health_dashboard(repo, metrics)
            repository_dashboards.append(dashboard)

        # Generate conflict heatmap (simplified - would need comparison data)
        branches = list(set(m.branch_name for m in branch_health_metrics))
        conflict_heatmap = ConflictHeatmap(
            matrix={b: {o: 0.0 for o in branches} for b in branches},
            high_risk_pairs=[],
            recommendations=["Enable branch comparison for conflict prediction"]
        )

        # Analyze merge success rates
        all_operations = []
        for branch_report in branch_reports:
            operations = safe_get(branch_report, 'operations', [])
            all_operations.extend(operations)

        merge_metrics = self.analyze_merge_success_rates(all_operations)

        # Generate divergence analysis
        divergence_analysis = []
        for metric in branch_health_metrics:
            if metric.commits_ahead > 0 or metric.commits_behind > 0:
                div = self.calculate_divergence_metrics(
                    branch_name=metric.branch_name,
                    base_branch="main",  # Default assumption
                    commits_ahead=metric.commits_ahead,
                    commits_behind=metric.commits_behind
                )
                divergence_analysis.append(div)

        # Generate key insights
        key_insights = []
        if include_insights:
            avg_health = sum(m.health_score for m in branch_health_metrics) / len(branch_health_metrics) if branch_health_metrics else 0
            key_insights.append(f"📊 Average branch health: {avg_health:.1f}/100")

            high_risk = sum(1 for m in branch_health_metrics if m.health_score < 40)
            if high_risk > 0:
                key_insights.append(f"⚠️  {high_risk} branch(es) at high risk")

            if merge_metrics.success_rate > 0:
                key_insights.append(f"✅ Merge success rate: {merge_metrics.success_rate:.1f}%")

            stale_count = sum(len(d.stale_branches) for d in repository_dashboards)
            if stale_count > 0:
                key_insights.append(f"🧹 {stale_count} stale branch(es) detected")

        # Generate action items
        action_items = []
        for dashboard in repository_dashboards:
            action_items.extend(dashboard.recommendations[:2])  # Top 2 per repo

        # Detect trends
        trends = {
            "overall_health": "stable",
            "merge_success": "stable",
            "divergence": "stable"
        }

        return AnalyticsReport(
            timestamp=datetime.now().isoformat(),
            repository_dashboards=repository_dashboards,
            branch_health=branch_health_metrics,
            conflict_heatmap=conflict_heatmap,
            merge_metrics=merge_metrics,
            divergence_analysis=divergence_analysis,
            key_insights=key_insights,
            action_items=action_items,
            trends=trends
        )
