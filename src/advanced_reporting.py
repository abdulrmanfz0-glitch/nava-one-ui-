"""
Advanced Reporting Hub

Central module that integrates all revolutionary reporting features:
- Analytics engine
- Export formats (CSV, XML, Prometheus, Grafana, Enhanced MD)
- Interactive HTML with visualizations
- Enhanced notifications
- Report history and comparison
- Smart insights engine

This module provides a unified interface for next-generation reporting.
"""

from typing import Dict, List, Optional
from datetime import datetime
import os
from pathlib import Path

# Import all revolutionary modules
from .analytics import (
    AdvancedAnalyticsEngine,
    AnalyticsReport,
    BranchHealthMetrics,
    RepositoryHealthDashboard
)
from .export_formats import EnhancedExportFormats
from .interactive_html import InteractiveHTMLGenerator
from .enhanced_notifications import (
    EnhancedNotificationManager,
    EnhancedNotificationConfig,
    NotificationPriority,
    EnhancedNotificationChannel
)
from .report_history import ReportHistoryManager, ComparisonResult
from .smart_insights import SmartInsightsEngine, Insight, SmartRecommendation


class AdvancedReportingHub:
    """
    Unified interface for next-generation reporting capabilities

    Combines analytics, export formats, visualizations, notifications,
    and intelligent insights into a single powerful reporting engine.
    """

    def __init__(
        self,
        output_dir: str = "./reports",
        history_dir: str = "./reports/history",
        notification_config: Optional[EnhancedNotificationConfig] = None,
        enable_history: bool = True,
        enable_notifications: bool = False,
        enable_insights: bool = True
    ):
        """
        Initialize advanced reporting hub

        Args:
            output_dir: Directory for report outputs
            history_dir: Directory for report history
            notification_config: Configuration for notifications
            enable_history: Enable report history tracking
            enable_notifications: Enable notification system
            enable_insights: Enable smart insights generation
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Initialize engines
        self.analytics_engine = AdvancedAnalyticsEngine()
        self.export_formats = EnhancedExportFormats()
        self.html_generator = InteractiveHTMLGenerator()
        self.insights_engine = SmartInsightsEngine() if enable_insights else None

        # Optional components
        self.history_manager = ReportHistoryManager(history_dir) if enable_history else None
        self.notification_manager = (
            EnhancedNotificationManager(notification_config)
            if enable_notifications and notification_config
            else None
        )

    def generate_comprehensive_report(
        self,
        report_data: Dict,
        export_formats: List[str] = None,
        send_notifications: bool = False,
        notification_priority: NotificationPriority = NotificationPriority.MEDIUM,
        compare_with_previous: bool = True
    ) -> Dict:
        """
        Generate comprehensive report with all revolutionary features

        Args:
            report_data: Standard report data from ReportGenerator
            export_formats: List of formats to export (default: all)
            send_notifications: Whether to send notifications
            notification_priority: Priority for notifications
            compare_with_previous: Compare with previous report

        Returns:
            Dictionary containing all generated artifacts
        """
        result = {
            'timestamp': datetime.now().isoformat(),
            'files_generated': [],
            'analytics': None,
            'insights': None,
            'comparison': None,
            'notifications_sent': False
        }

        # 1. Generate advanced analytics
        print("📊 Generating advanced analytics...")
        analytics_report = self.analytics_engine.generate_comprehensive_analytics(
            report_data,
            include_insights=True
        )
        result['analytics'] = analytics_report

        # Convert analytics to dict for easier handling
        analytics_dict = self._analytics_to_dict(analytics_report)

        # 2. Generate smart insights
        if self.insights_engine:
            print("💡 Generating smart insights...")
            insights = self.insights_engine.analyze_and_generate_insights(
                report_data,
                analytics_dict,
                self.history_manager.history if self.history_manager else None
            )
            result['insights'] = insights

            # Generate recommendations
            recommendations = self.insights_engine.generate_recommendations(insights, max_recommendations=5)
            result['recommendations'] = recommendations

        # 3. Compare with previous report
        if self.history_manager and compare_with_previous:
            print("📈 Comparing with previous report...")
            comparison = self.history_manager.compare_reports(report_data)
            result['comparison'] = comparison

        # 4. Export in all requested formats
        export_formats = export_formats or ['json', 'html', 'markdown', 'csv', 'prometheus', 'interactive']

        print(f"📝 Exporting reports in {len(export_formats)} format(s)...")

        for format_type in export_formats:
            try:
                if format_type == 'csv':
                    filepath = self.export_formats.export_csv(
                        report_data,
                        str(self.output_dir / f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv")
                    )
                    result['files_generated'].append(('CSV', filepath))
                    print(f"  ✓ CSV: {filepath}")

                elif format_type == 'xml':
                    filepath = self.export_formats.export_xml(
                        report_data,
                        str(self.output_dir / f"report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xml")
                    )
                    result['files_generated'].append(('XML', filepath))
                    print(f"  ✓ XML: {filepath}")

                elif format_type == 'prometheus':
                    filepath = self.export_formats.export_prometheus_metrics(
                        report_data,
                        str(self.output_dir / f"metrics_{datetime.now().strftime('%Y%m%d_%H%M%S')}.prom")
                    )
                    result['files_generated'].append(('Prometheus', filepath))
                    print(f"  ✓ Prometheus Metrics: {filepath}")

                elif format_type == 'grafana':
                    filepath = self.export_formats.export_grafana_json(
                        report_data,
                        analytics_dict,
                        str(self.output_dir / f"grafana_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
                    )
                    result['files_generated'].append(('Grafana', filepath))
                    print(f"  ✓ Grafana Dashboard: {filepath}")

                elif format_type == 'markdown_enhanced':
                    filepath = self.export_formats.export_enhanced_markdown(
                        report_data,
                        analytics_dict,
                        str(self.output_dir / f"report_enhanced_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md")
                    )
                    result['files_generated'].append(('Enhanced Markdown', filepath))
                    print(f"  ✓ Enhanced Markdown: {filepath}")

                elif format_type == 'interactive':
                    filepath = self.html_generator.generate_interactive_html(
                        report_data,
                        analytics_dict,
                        str(self.output_dir / f"interactive_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html")
                    )
                    result['files_generated'].append(('Interactive HTML', filepath))
                    print(f"  ✓ Interactive HTML: {filepath}")

            except Exception as e:
                print(f"  ✗ Failed to export {format_type}: {e}")

        # 5. Add to history
        if self.history_manager:
            print("💾 Saving to report history...")
            self.history_manager.add_report(report_data, analytics_dict)

        # 6. Send notifications
        if send_notifications and self.notification_manager:
            print("📬 Sending notifications...")
            try:
                self.notification_manager.send_report_notification(
                    report_data.get('summary', {}),
                    notification_priority,
                    analytics_dict
                )
                result['notifications_sent'] = True
                print("  ✓ Notifications sent successfully")
            except Exception as e:
                print(f"  ✗ Failed to send notifications: {e}")

        return result

    def get_trend_analysis(self, days: int = 7) -> Dict:
        """
        Get trend analysis over specified period

        Args:
            days: Number of days to analyze

        Returns:
            Trend analysis data
        """
        if not self.history_manager:
            return {'error': 'History tracking is not enabled'}

        return self.history_manager.get_trend_analysis(days)

    def get_latest_comparison(self) -> Optional[ComparisonResult]:
        """Get comparison with the most recent previous report"""
        if not self.history_manager:
            return None

        latest = self.history_manager.get_latest_report()
        if not latest:
            return None

        return self.history_manager.compare_reports(latest)

    def export_history(self, filename: str = None) -> str:
        """
        Export complete report history

        Args:
            filename: Output filename

        Returns:
            Path to exported file
        """
        if not self.history_manager:
            raise RuntimeError("History tracking is not enabled")

        return self.history_manager.export_history(filename)

    def _analytics_to_dict(self, analytics: AnalyticsReport) -> Dict:
        """Convert analytics report to dictionary"""
        return {
            'timestamp': analytics.timestamp,
            'repository_dashboards': [
                {
                    'repository': d.repository,
                    'overall_health_score': d.overall_health_score,
                    'total_branches': d.total_branches,
                    'healthy_branches': d.healthy_branches,
                    'at_risk_branches': d.at_risk_branches,
                    'critical_branches': d.critical_branches,
                    'average_divergence': d.average_divergence,
                    'stale_branches': d.stale_branches,
                    'recommendations': d.recommendations,
                    'top_issues': d.top_issues,
                    'health_trend': d.health_trend
                }
                for d in analytics.repository_dashboards
            ],
            'branch_health': [
                {
                    'branch_name': b.branch_name,
                    'repository': b.repository,
                    'health_score': b.health_score,
                    'divergence_score': b.divergence_score,
                    'freshness_score': b.freshness_score,
                    'conflict_risk': b.conflict_risk,
                    'activity_level': b.activity_level,
                    'commits_ahead': b.commits_ahead,
                    'commits_behind': b.commits_behind,
                    'days_since_update': b.days_since_update,
                    'merge_recommendation': b.merge_recommendation,
                    'issues': b.issues,
                    'strengths': b.strengths
                }
                for b in analytics.branch_health
            ],
            'conflict_heatmap': {
                'matrix': analytics.conflict_heatmap.matrix,
                'high_risk_pairs': analytics.conflict_heatmap.high_risk_pairs,
                'recommendations': analytics.conflict_heatmap.recommendations
            },
            'merge_metrics': {
                'total_merges': analytics.merge_metrics.total_merges,
                'successful_merges': analytics.merge_metrics.successful_merges,
                'failed_merges': analytics.merge_metrics.failed_merges,
                'success_rate': analytics.merge_metrics.success_rate,
                'average_conflicts_per_merge': analytics.merge_metrics.average_conflicts_per_merge,
                'merge_strategy_performance': analytics.merge_metrics.merge_strategy_performance,
                'common_failure_patterns': analytics.merge_metrics.common_failure_patterns
            },
            'divergence_analysis': [
                {
                    'branch_name': d.branch_name,
                    'base_branch': d.base_branch,
                    'commits_ahead': d.commits_ahead,
                    'commits_behind': d.commits_behind,
                    'divergence_ratio': d.divergence_ratio,
                    'similarity_score': d.similarity_score,
                    'file_changes': d.file_changes,
                    'insertions': d.insertions,
                    'deletions': d.deletions,
                    'merge_complexity': d.merge_complexity,
                    'estimated_conflicts': d.estimated_conflicts
                }
                for d in analytics.divergence_analysis
            ],
            'key_insights': analytics.key_insights,
            'action_items': analytics.action_items,
            'trends': analytics.trends
        }

    def print_summary(self, result: Dict):
        """Print a beautiful summary of the generated report"""
        print("\n" + "="*70)
        print("🎉 NAVA OPS REPORTING REVOLUTION - GENERATION COMPLETE")
        print("="*70)

        if result.get('analytics'):
            print(f"\n📊 Analytics Generated: ✓")
            analytics = result['analytics']
            print(f"   • Repository Dashboards: {len(analytics.repository_dashboards)}")
            print(f"   • Branch Health Metrics: {len(analytics.branch_health)}")
            print(f"   • Key Insights: {len(analytics.key_insights)}")

        if result.get('insights'):
            insights = result['insights']
            print(f"\n💡 Smart Insights: {len(insights)}")
            critical = sum(1 for i in insights if i.priority == 'critical')
            high = sum(1 for i in insights if i.priority == 'high')
            if critical > 0:
                print(f"   • Critical: {critical}")
            if high > 0:
                print(f"   • High Priority: {high}")

        if result.get('comparison'):
            comp = result['comparison']
            print(f"\n📈 Report Comparison:")
            print(f"   • Improvements: {len(comp.improvements)}")
            print(f"   • Regressions: {len(comp.regressions)}")
            print(f"   • Anomalies: {len(comp.anomalies)}")

        if result.get('files_generated'):
            print(f"\n📝 Files Generated ({len(result['files_generated'])}):")
            for format_type, filepath in result['files_generated']:
                print(f"   • {format_type}: {filepath}")

        if result.get('notifications_sent'):
            print(f"\n📬 Notifications: Sent successfully ✓")

        print("\n" + "="*70)
        print("✨ Your next-generation report is ready!")
        print("="*70 + "\n")
