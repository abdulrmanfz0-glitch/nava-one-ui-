#!/usr/bin/env python3
"""
Automated test runner for all Nava Ops examples
This script runs all examples non-interactively and reports errors
"""

import sys
import os
import traceback
from pathlib import Path

# Add src to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src import (
    Config,
    MultibranchOrchestrator,
    AdvancedReportingHub,
    EnhancedNotificationConfig,
    EnhancedNotificationChannel,
    NotificationPriority
)

# Test results
results = {
    "passed": [],
    "failed": [],
    "errors": []
}

def log_result(name, success, error=None):
    """Log test result"""
    if success:
        results["passed"].append(name)
        print(f"✅ {name}")
    else:
        results["failed"].append(name)
        results["errors"].append({
            "example": name,
            "error": str(error),
            "traceback": traceback.format_exc() if error else None
        })
        print(f"❌ {name}")
        if error:
            print(f"   Error: {error}")
            print(f"   {traceback.format_exc()}")


def create_test_reports_dir():
    """Create test reports directory"""
    Path("./test_reports").mkdir(exist_ok=True)


def example_1_advanced_analytics():
    """Test Example 1: Advanced Analytics & Health Scoring"""
    print("\n" + "="*70)
    print("EXAMPLE 1: Advanced Analytics & Health Scoring")
    print("="*70 + "\n")

    try:
        # Create configuration
        config = Config.from_file("examples/test_config.json")

        # Run operations (using status instead of fetch to avoid network issues)
        orchestrator = MultibranchOrchestrator(config)

        # Create a simple report for testing
        from src.reporting import Report, ReportSummary, BranchReport
        from datetime import datetime

        start_time = datetime.now()

        # Get branch info
        branch_reports = []
        for repo_config in config.repositories:
            from src.branch_ops import BranchOperations
            branch_ops = BranchOperations(repo_config)
            branches = branch_ops.list_branches()

            for branch in branches[:1]:  # Just test with one branch
                from src.branch_ops import OperationResult
                operation = OperationResult(
                    operation="status",
                    success=True,
                    message="Branch status checked",
                    branch_name=branch.name
                )

                branch_report = BranchReport(
                    branch_name=branch.name,
                    repository=repo_config.name,
                    operations=[operation],
                    status={"current": branch.current, "remote": branch.remote},
                    success=True
                )
                branch_reports.append(branch_report)

        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        summary = ReportSummary(
            total_operations=len(branch_reports),
            successful_operations=len([r for r in branch_reports if r.success]),
            failed_operations=len([r for r in branch_reports if not r.success]),
            total_branches=len(branch_reports),
            total_repositories=len(config.repositories),
            start_time=start_time,
            end_time=end_time,
            duration_seconds=duration
        )

        report = Report(
            summary=summary,
            branch_reports=branch_reports,
            errors=[],
            timestamp=start_time.isoformat()
        )

        # Create advanced reporting hub
        reporting_hub = AdvancedReportingHub(
            output_dir="./test_reports",
            enable_history=True,
            enable_insights=True
        )

        # Generate comprehensive report with analytics
        result = reporting_hub.generate_comprehensive_report(
            report_data=report.__dict__,
            export_formats=['json'],  # Just JSON for testing
            send_notifications=False
        )

        # Verify results
        if result['analytics']:
            analytics = result['analytics']
            print(f"📊 Analytics Summary:")
            print(f"   • Repository Dashboards: {len(analytics.repository_dashboards)}")
            print(f"   • Branch Health Metrics: {len(analytics.branch_health)}")
            print(f"   • Key Insights: {len(analytics.key_insights)}")

        if result['insights']:
            print(f"\n🧠 Smart Insights Generated: {len(result['insights'])}")

        print(f"\n✅ Reports generated: {len(result['files_generated'])} files")

        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        traceback.print_exc()
        return False


def example_2_interactive_visualizations():
    """Test Example 2: Interactive HTML Reports"""
    print("\n" + "="*70)
    print("EXAMPLE 2: Interactive HTML Reports with Visualizations")
    print("="*70 + "\n")

    try:
        # Create configuration
        config = Config.from_file("examples/test_config.json")

        # Create simple test report
        from src.reporting import Report, ReportSummary, BranchReport
        from datetime import datetime

        start_time = datetime.now()

        from src.branch_ops import OperationResult
        operation = OperationResult(
            operation="status",
            success=True,
            message="Test report",
            branch_name="claude/nava-ops-error-fixes-011CV3jfj8vfaz6BPZzj5VTf"
        )

        branch_report = BranchReport(
            branch_name="claude/nava-ops-error-fixes-011CV3jfj8vfaz6BPZzj5VTf",
            repository="nava-ops",
            operations=[operation],
            status={"current": True},
            success=True
        )

        end_time = datetime.now()

        summary = ReportSummary(
            total_operations=1,
            successful_operations=1,
            failed_operations=0,
            total_branches=1,
            total_repositories=1,
            start_time=start_time,
            end_time=end_time,
            duration_seconds=0.5
        )

        report = Report(
            summary=summary,
            branch_reports=[branch_report],
            errors=[],
            timestamp=start_time.isoformat()
        )

        # Create reporting hub
        reporting_hub = AdvancedReportingHub(
            output_dir="./test_reports",
            enable_history=False,
            enable_insights=False
        )

        # Generate interactive HTML
        result = reporting_hub.generate_comprehensive_report(
            report_data=report.__dict__,
            export_formats=['interactive'],
            send_notifications=False
        )

        print(f"✅ Interactive HTML generated: {len(result['files_generated'])} files")
        for format_type, filepath in result['files_generated']:
            print(f"   • {format_type}: {filepath}")

        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        traceback.print_exc()
        return False


def example_3_multi_format_export():
    """Test Example 3: Multiple Export Formats"""
    print("\n" + "="*70)
    print("EXAMPLE 3: Multiple Export Formats")
    print("="*70 + "\n")

    try:
        from src.export_formats import EnhancedExportFormats
        from datetime import datetime

        # Create test report data
        report_data = {
            "summary": {
                "total_operations": 5,
                "successful_operations": 4,
                "failed_operations": 1,
                "success_rate": 80.0,
                "total_branches": 3,
                "total_repositories": 1,
                "start_time": datetime.now().isoformat(),
                "end_time": datetime.now().isoformat(),
                "duration_seconds": 10.5
            },
            "branch_reports": [
                {
                    "repository": "nava-ops",
                    "branch_name": "main",
                    "operations": [
                        {
                            "operation": "fetch",
                            "success": True,
                            "message": "Fetch completed",
                            "timestamp": datetime.now().isoformat()
                        }
                    ]
                }
            ]
        }

        # Test CSV export
        csv_file = EnhancedExportFormats.export_csv(
            report_data,
            filename="./test_reports/test_report.csv"
        )
        print(f"✅ CSV exported: {csv_file}")

        # Test XML export
        xml_file = EnhancedExportFormats.export_xml(
            report_data,
            filename="./test_reports/test_report.xml"
        )
        print(f"✅ XML exported: {xml_file}")

        # Test Prometheus export
        prom_file = EnhancedExportFormats.export_prometheus_metrics(
            report_data,
            filename="./test_reports/test_report.prom"
        )
        print(f"✅ Prometheus metrics generated: {prom_file}")

        # Test Markdown export
        md_file = EnhancedExportFormats.export_enhanced_markdown(
            report_data,
            filename="./test_reports/test_report.md"
        )
        print(f"✅ Markdown exported: {md_file}")

        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        traceback.print_exc()
        return False


def example_4_notifications():
    """Test Example 4: Notification System"""
    print("\n" + "="*70)
    print("EXAMPLE 4: Enhanced Notifications")
    print("="*70 + "\n")

    try:
        from src.enhanced_notifications import (
            EnhancedNotificationManager,
            EnhancedNotificationConfig,
            EnhancedNotificationChannel,
            NotificationPriority
        )

        # Create notification config (console only for testing)
        config = EnhancedNotificationConfig()

        # Create notification manager
        manager = EnhancedNotificationManager(config)

        # Create a simple test report for notification
        test_report = {
            "summary": {
                "total_operations": 1,
                "successful_operations": 1,
                "success_rate": 100.0
            }
        }

        # Send test notification
        manager.send_report_notification(
            report_summary=test_report["summary"],
            priority=NotificationPriority.MEDIUM,
            analytics=None
        )

        print("✅ Notification system tested successfully")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        traceback.print_exc()
        return False


def example_5_report_history():
    """Test Example 5: Report History"""
    print("\n" + "="*70)
    print("EXAMPLE 5: Report History & Trends")
    print("="*70 + "\n")

    try:
        from src.report_history import ReportHistoryManager
        from datetime import datetime

        # Create history manager
        history = ReportHistoryManager(history_dir="./test_reports/history")

        # Create test report
        test_report = {
            "summary": {
                "total_operations": 5,
                "successful_operations": 4,
                "failed_operations": 1,
                "success_rate": 80.0,
                "total_branches": 3,
                "total_repositories": 1,
                "start_time": datetime.now().isoformat(),
                "end_time": datetime.now().isoformat(),
                "duration_seconds": 10.5
            },
            "branch_reports": [],
            "timestamp": datetime.now().isoformat()
        }

        # Add report to history
        history.add_report(test_report, analytics=None)
        print("✅ Report added to history")

        # Get all reports from history
        all_reports = history.history
        print(f"✅ Total reports in history: {len(all_reports)}")

        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        traceback.print_exc()
        return False


def example_6_smart_insights():
    """Test Example 6: Smart Insights"""
    print("\n" + "="*70)
    print("EXAMPLE 6: Smart Insights & Recommendations")
    print("="*70 + "\n")

    try:
        from src.smart_insights import SmartInsightsEngine
        from datetime import datetime

        # Create test report
        test_report = {
            "summary": {
                "total_operations": 10,
                "successful_operations": 7,
                "failed_operations": 3,
                "success_rate": 70.0,
                "total_branches": 5,
                "total_repositories": 2,
                "start_time": datetime.now().isoformat(),
                "end_time": datetime.now().isoformat(),
                "duration_seconds": 25.5
            },
            "branch_reports": []
        }

        # Generate insights
        engine = SmartInsightsEngine()
        insights = engine.analyze_and_generate_insights(
            report=test_report,
            analytics=None,
            history=None
        )

        print(f"✅ Generated {len(insights)} smart insights")
        for insight in insights[:3]:
            print(f"   • {insight.title} (Priority: {insight.priority})")

        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        traceback.print_exc()
        return False


def example_7_conflict_detection():
    """Test Example 7: Conflict Detection"""
    print("\n" + "="*70)
    print("EXAMPLE 7: Conflict Detection")
    print("="*70 + "\n")

    try:
        from src.conflict_resolution import ConflictDetector
        from src.config import RepositoryConfig, BranchConfig

        # Create repo config
        repo_config = RepositoryConfig(
            path="/home/user/nava-ops",
            name="nava-ops",
            default_remote="origin",
            branches=[
                BranchConfig(
                    name="claude/nava-ops-error-fixes-011CV3jfj8vfaz6BPZzj5VTf",
                    remote="origin"
                )
            ]
        )

        # Create detector
        detector = ConflictDetector(repo_config)

        # Detect current conflicts (should be none in clean repo)
        conflict_info = detector.detect_current_conflicts()
        print(f"✅ Conflict detection working: Has conflicts = {conflict_info.has_conflicts}")

        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        traceback.print_exc()
        return False


def example_8_branch_comparison():
    """Test Example 8: Branch Comparison"""
    print("\n" + "="*70)
    print("EXAMPLE 8: Branch Comparison & Divergence Analysis")
    print("="*70 + "\n")

    try:
        from src.branch_comparison import BranchAnalyzer

        # Create analyzer
        analyzer = BranchAnalyzer("/home/user/nava-ops")

        # Get current branch
        from src.utils import execute_command
        result = execute_command(
            ["git", "branch", "--show-current"],
            cwd="/home/user/nava-ops"
        )

        if result.success and result.stdout.strip():
            current_branch = result.stdout.strip()
            print(f"✅ Branch analyzer created for {current_branch}")
        else:
            print("✅ Branch analyzer created (no current branch)")

        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        traceback.print_exc()
        return False


def main():
    """Run all examples"""
    print("="*70)
    print("NAVA OPS - AUTOMATED EXAMPLE TESTING")
    print("="*70)

    # Create reports directory
    create_test_reports_dir()

    # Define all examples
    examples = [
        ("Example 1: Advanced Analytics", example_1_advanced_analytics),
        ("Example 2: Interactive Visualizations", example_2_interactive_visualizations),
        ("Example 3: Multi-Format Export", example_3_multi_format_export),
        ("Example 4: Notifications", example_4_notifications),
        ("Example 5: Report History", example_5_report_history),
        ("Example 6: Smart Insights", example_6_smart_insights),
        ("Example 7: Conflict Detection", example_7_conflict_detection),
        ("Example 8: Branch Comparison", example_8_branch_comparison),
    ]

    # Run all examples
    for name, example_func in examples:
        try:
            success = example_func()
            log_result(name, success)
        except Exception as e:
            log_result(name, False, e)

    # Print summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    print(f"\n✅ Passed: {len(results['passed'])}")
    print(f"❌ Failed: {len(results['failed'])}")

    if results['failed']:
        print("\nFailed Examples:")
        for error in results['errors']:
            print(f"\n❌ {error['example']}")
            print(f"   Error: {error['error']}")

    return len(results['failed']) == 0


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
