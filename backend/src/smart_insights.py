"""
Smart Insights Engine

Provides AI-powered recommendations and insights for Git operations:
- Merge strategy recommendations
- Branch cleanup suggestions
- Conflict resolution guidance
- Performance optimization tips
- Security audit insights
- Best practices analysis
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime, timedelta


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
class Insight:
    """Represents a smart insight"""
    category: str  # merge, cleanup, performance, security, best_practice
    priority: str  # low, medium, high, critical
    title: str
    description: str
    recommendation: str
    impact: str  # Estimated impact of following recommendation
    effort: str  # Estimated effort to implement (low, medium, high)


@dataclass
class SmartRecommendation:
    """Detailed recommendation with action steps"""
    title: str
    rationale: str
    action_steps: List[str]
    expected_benefit: str
    related_branches: List[str]
    priority: str


class SmartInsightsEngine:
    """
    AI-powered insights engine for Git operations

    Analyzes reports and analytics to provide actionable recommendations
    """

    def __init__(self):
        self.insights_cache = []

    def analyze_and_generate_insights(
        self,
        report: Dict,
        analytics: Dict = None,
        history: List[Dict] = None
    ) -> List[Insight]:
        """
        Generate comprehensive insights from report and analytics data

        Args:
            report: Current report data
            analytics: Analytics data
            history: Historical reports

        Returns:
            List of insights
        """
        insights = []

        # Analyze success rate
        insights.extend(self._analyze_success_rate(report, history))

        # Analyze branch health
        if analytics and 'branch_health' in analytics:
            insights.extend(self._analyze_branch_health(analytics['branch_health']))

        # Analyze merge patterns
        insights.extend(self._analyze_merge_patterns(report))

        # Analyze performance
        insights.extend(self._analyze_performance(report, history))

        # Analyze branch structure
        insights.extend(self._analyze_branch_structure(report, analytics))

        # Security analysis
        insights.extend(self._analyze_security(report, analytics))

        # Best practices
        insights.extend(self._analyze_best_practices(report, analytics))

        # Sort by priority
        priority_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}
        insights.sort(key=lambda x: priority_order.get(x.priority, 4))

        self.insights_cache = insights
        return insights

    def _analyze_success_rate(self, report: Dict, history: Optional[List[Dict]]) -> List[Insight]:
        """Analyze success rate and trends"""
        insights = []
        summary = safe_get(report, 'summary', {})
        success_rate = safe_get(summary, 'success_rate', 0)

        # Low success rate
        if success_rate < 70:
            insights.append(Insight(
                category="performance",
                priority="high" if success_rate < 50 else "medium",
                title="Low Success Rate Detected",
                description=f"Current success rate is {success_rate:.1f}%, which is below the recommended 90%",
                recommendation="Review failed operations and address common failure patterns. "
                             "Consider increasing retry attempts or fixing environmental issues.",
                impact="High - Improving success rate will increase reliability",
                effort="medium"
            ))

        # Declining trend
        if history and len(history) >= 2:
            recent_rates = [safe_get(safe_get(h, 'summary', {}), 'success_rate', 0) for h in history[-5:]]
            if len(recent_rates) >= 3:
                first_half_avg = sum(recent_rates[:len(recent_rates)//2]) / (len(recent_rates)//2)
                second_half_avg = sum(recent_rates[len(recent_rates)//2:]) / (len(recent_rates) - len(recent_rates)//2)

                if second_half_avg < first_half_avg - 5:  # Declining by 5%+
                    insights.append(Insight(
                        category="performance",
                        priority="high",
                        title="Success Rate Declining Trend",
                        description=f"Success rate has declined from {first_half_avg:.1f}% to {second_half_avg:.1f}%",
                        recommendation="Investigate recent changes that may have impacted reliability. "
                                     "Review error logs and increase monitoring.",
                        impact="High - Preventing further decline is critical",
                        effort="medium"
                    ))

        return insights

    def _analyze_branch_health(self, branch_health: List[Dict]) -> List[Insight]:
        """Analyze branch health metrics"""
        insights = []

        # Count unhealthy branches
        unhealthy = [b for b in branch_health if b.get('health_score', 0) < 40]
        at_risk = [b for b in branch_health if 40 <= b.get('health_score', 0) < 70]

        if unhealthy:
            branch_names = [b.get('branch_name', 'unknown') for b in unhealthy[:3]]
            insights.append(Insight(
                category="cleanup",
                priority="high",
                title=f"{len(unhealthy)} Unhealthy Branch(es) Detected",
                description=f"Branches with health score < 40: {', '.join(branch_names)}",
                recommendation="Review and either merge, update, or archive these branches. "
                             "They may be stale or have significant conflicts.",
                impact="Medium - Reduces maintenance overhead and confusion",
                effort="low"
            ))

        if at_risk:
            insights.append(Insight(
                category="cleanup",
                priority="medium",
                title=f"{len(at_risk)} Branch(es) At Risk",
                description=f"{len(at_risk)} branches have health scores between 40-70",
                recommendation="Monitor these branches closely and update them regularly "
                             "to prevent them from becoming unhealthy.",
                impact="Low - Proactive maintenance prevents future issues",
                effort="low"
            ))

        # Analyze divergence
        highly_divergent = [
            b for b in branch_health
            if b.get('commits_behind', 0) > 50 or b.get('commits_ahead', 0) > 100
        ]

        if highly_divergent:
            insights.append(Insight(
                category="merge",
                priority="high",
                title="Highly Divergent Branches Detected",
                description=f"{len(highly_divergent)} branches have significant divergence from main",
                recommendation="Consider breaking large branches into smaller, more manageable PRs. "
                             "Merge or rebase with main branch regularly to reduce divergence.",
                impact="High - Reduces merge conflicts and complexity",
                effort="high"
            ))

        # Stale branches
        stale = [b for b in branch_health if b.get('days_since_update') and b.get('days_since_update') > 90]

        if stale:
            insights.append(Insight(
                category="cleanup",
                priority="medium",
                title=f"{len(stale)} Stale Branch(es) Detected",
                description=f"Branches not updated in over 90 days",
                recommendation="Review stale branches and archive or delete those no longer needed. "
                             "This keeps the repository clean and manageable.",
                impact="Medium - Improves repository cleanliness",
                effort="low"
            ))

        return insights

    def _analyze_merge_patterns(self, report: Dict) -> List[Insight]:
        """Analyze merge operation patterns"""
        insights = []

        # Count merge operations
        merge_ops = []
        for branch_report in safe_get(report, 'branch_reports', []):
            for op in safe_get(branch_report, 'operations', []):
                if safe_get(op, 'operation') == 'merge':
                    merge_ops.append(op)

        if merge_ops:
            failed_merges = [op for op in merge_ops if not safe_get(op, 'success', False)]
            success_rate = ((len(merge_ops) - len(failed_merges)) / len(merge_ops)) * 100

            if success_rate < 80:
                insights.append(Insight(
                    category="merge",
                    priority="high",
                    title="High Merge Failure Rate",
                    description=f"Only {success_rate:.1f}% of merge operations succeeded",
                    recommendation="Analyze merge conflicts and consider using rebase strategy "
                                 "for feature branches. Ensure branches are synchronized regularly.",
                    impact="High - Reduces developer friction and delays",
                    effort="medium"
                ))

        return insights

    def _analyze_performance(self, report: Dict, history: Optional[List[Dict]]) -> List[Insight]:
        """Analyze performance metrics"""
        insights = []
        summary = safe_get(report, 'summary', {})
        duration = safe_get(summary, 'duration_seconds', 0)
        operations = safe_get(summary, 'total_operations', 0)

        # Slow execution
        if operations > 0:
            avg_time_per_op = duration / operations

            if avg_time_per_op > 10:  # More than 10s per operation
                insights.append(Insight(
                    category="performance",
                    priority="medium",
                    title="Slow Operation Execution",
                    description=f"Average time per operation is {avg_time_per_op:.1f}s",
                    recommendation="Consider enabling parallel operations if not already enabled. "
                                 "Check network connectivity and Git server performance.",
                    impact="Medium - Faster operations improve developer productivity",
                    effort="low"
                ))

        # Performance regression
        if history and len(history) >= 2:
            prev_summary = history[-2].get('summary', {})
            prev_duration = prev_safe_get(summary, 'duration_seconds', 0)

            if prev_duration > 0 and duration > prev_duration * 1.5:  # 50% slower
                insights.append(Insight(
                    category="performance",
                    priority="high",
                    title="Performance Regression Detected",
                    description=f"Execution time increased from {prev_duration:.1f}s to {duration:.1f}s",
                    recommendation="Investigate what changed. Check for network issues, "
                                 "increased repository size, or configuration changes.",
                    impact="High - Performance degradation affects all operations",
                    effort="medium"
                ))

        return insights

    def _analyze_branch_structure(self, report: Dict, analytics: Optional[Dict]) -> List[Insight]:
        """Analyze branch structure and organization"""
        insights = []
        total_branches = safe_get(safe_get(report, 'summary', {}), 'total_branches', 0)

        # Too many branches
        if total_branches > 50:
            insights.append(Insight(
                category="cleanup",
                priority="medium",
                title="High Branch Count",
                description=f"{total_branches} branches detected in the repository",
                recommendation="Implement a branch cleanup policy. Archive or delete merged branches. "
                             "Consider using branch naming conventions and automated cleanup.",
                impact="Medium - Improves repository navigation and performance",
                effort="medium"
            ))

        # Repository count
        total_repos = safe_get(safe_get(report, 'summary', {}), 'total_repositories', 0)
        if total_branches > 0 and total_repos > 0:
            avg_branches_per_repo = total_branches / total_repos

            if avg_branches_per_repo > 20:
                insights.append(Insight(
                    category="best_practice",
                    priority="low",
                    title="High Branch Density",
                    description=f"Average of {avg_branches_per_repo:.1f} branches per repository",
                    recommendation="Consider implementing branch lifecycle management. "
                                 "Use short-lived feature branches and delete after merge.",
                    impact="Low - Long-term maintainability improvement",
                    effort="medium"
                ))

        return insights

    def _analyze_security(self, report: Dict, analytics: Optional[Dict]) -> List[Insight]:
        """Analyze security-related aspects"""
        insights = []

        # Check for branches with security-related issues
        for branch_report in safe_get(report, 'branch_reports', []):
            branch_name = safe_get(branch_report, 'branch_name', '').lower()

            # Detect security-related branch names
            if any(keyword in branch_name for keyword in ['hotfix', 'security', 'vulnerability', 'cve']):
                insights.append(Insight(
                    category="security",
                    priority="high",
                    title="Security-Related Branch Detected",
                    description=f"Branch '{safe_get(branch_report, 'branch_name')}' appears to be security-related",
                    recommendation="Ensure security branches are reviewed promptly and merged with priority. "
                                 "Follow security disclosure procedures.",
                    impact="Critical - Security issues require immediate attention",
                    effort="high"
                ))
                break  # Only report once

        return insights

    def _analyze_best_practices(self, report: Dict, analytics: Optional[Dict]) -> List[Insight]:
        """Analyze adherence to best practices"""
        insights = []

        # Check if reports are being generated regularly
        # (This would require history, but we can infer from current report)

        total_operations = safe_get(safe_get(report, 'summary', {}), 'total_operations', 0)
        successful_operations = safe_get(safe_get(report, 'summary', {}), 'successful_operations', 0)

        if total_operations > 0:
            # Perfect success rate
            if successful_operations == total_operations:
                insights.append(Insight(
                    category="best_practice",
                    priority="low",
                    title="Excellent Operation Success",
                    description="All operations completed successfully",
                    recommendation="Maintain current practices and configurations. "
                                 "Consider documenting your setup for team reference.",
                    impact="Low - Validation of good practices",
                    effort="low"
                ))

        return insights

    def generate_recommendations(
        self,
        insights: List[Insight],
        max_recommendations: int = 5
    ) -> List[SmartRecommendation]:
        """
        Generate detailed recommendations from insights

        Args:
            insights: List of insights
            max_recommendations: Maximum number of recommendations to generate

        Returns:
            List of smart recommendations
        """
        recommendations = []

        # Group insights by category
        by_category = {}
        for insight in insights:
            if insight.category not in by_category:
                by_category[insight.category] = []
            by_category[insight.category].append(insight)

        # Generate recommendations for high-priority insights
        for category, category_insights in by_category.items():
            high_priority = [i for i in category_insights if i.priority in ['critical', 'high']]

            if high_priority and len(recommendations) < max_recommendations:
                insight = high_priority[0]  # Top priority insight

                # Generate action steps based on category
                action_steps = self._generate_action_steps(insight)

                recommendations.append(SmartRecommendation(
                    title=insight.title,
                    rationale=insight.description,
                    action_steps=action_steps,
                    expected_benefit=insight.impact,
                    related_branches=[],  # Would be populated with actual branch names
                    priority=insight.priority
                ))

        return recommendations[:max_recommendations]

    def _generate_action_steps(self, insight: Insight) -> List[str]:
        """Generate specific action steps for an insight"""
        steps = []

        if insight.category == "cleanup":
            steps = [
                "Run `git branch -a` to list all branches",
                "Identify merged branches with `git branch --merged`",
                "Delete local branches: `git branch -d <branch-name>`",
                "Delete remote branches: `git push origin --delete <branch-name>`",
                "Update documentation to reflect removed branches"
            ]
        elif insight.category == "merge":
            steps = [
                "Sync feature branches with main: `git checkout <branch> && git merge main`",
                "Resolve any conflicts that arise",
                "Test thoroughly after merge",
                "Consider using rebase for cleaner history: `git rebase main`",
                "Create PR and request review"
            ]
        elif insight.category == "performance":
            steps = [
                "Enable parallel operations in Nava Ops configuration",
                "Check network connectivity: `ping github.com`",
                "Optimize Git configuration: `git config --global core.preloadindex true`",
                "Consider using shallow clones for faster operations",
                "Monitor and profile slow operations"
            ]
        elif insight.category == "security":
            steps = [
                "Review security-related changes immediately",
                "Run security scanning tools",
                "Follow security disclosure procedures",
                "Prioritize security branch merges",
                "Document security fixes in changelog"
            ]
        else:
            steps = [insight.recommendation]

        return steps
