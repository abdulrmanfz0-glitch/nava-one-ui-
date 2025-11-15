#!/usr/bin/env python3
"""
Comprehensive test script to identify all errors in Nava Ops
"""

import sys
import os
import json
import traceback
from pathlib import Path

# Add src to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Test results storage
test_results = {
    "passed": [],
    "failed": [],
    "errors": []
}


def log_test(name, status, error=None):
    """Log test result"""
    if status == "passed":
        test_results["passed"].append(name)
        print(f"✅ {name}")
    else:
        test_results["failed"].append(name)
        test_results["errors"].append({
            "test": name,
            "error": str(error),
            "traceback": traceback.format_exc() if error else None
        })
        print(f"❌ {name}")
        if error:
            print(f"   Error: {error}")


def test_imports():
    """Test all module imports"""
    print("\n" + "="*70)
    print("TEST 1: Module Imports")
    print("="*70)

    modules_to_test = [
        "src.config",
        "src.utils",
        "src.branch_ops",
        "src.orchestrator",
        "src.reporting",
        "src.analytics",
        "src.export_formats",
        "src.interactive_html",
        "src.smart_insights",
        "src.advanced_reporting",
        "src.report_history",
        "src.conflict_resolution",
        "src.branch_comparison",
        "src.advanced_ops",
        "src.hooks",
        "src.notifications",
        "src.enhanced_notifications",
        "src.cli",
    ]

    for module in modules_to_test:
        try:
            __import__(module)
            log_test(f"Import {module}", "passed")
        except Exception as e:
            log_test(f"Import {module}", "failed", e)


def test_config_parsing():
    """Test configuration parsing"""
    print("\n" + "="*70)
    print("TEST 2: Configuration Parsing")
    print("="*70)

    from src.config import Config, RepositoryConfig, BranchConfig, ReportingConfig

    # Test 1: Create config from dict
    try:
        config_dict = {
            "repositories": [
                {
                    "path": "/home/user/nava-ops",
                    "name": "nava-ops",
                    "default_remote": "origin",
                    "branches": [
                        {
                            "name": "claude/nava-ops-error-fixes-011CV3jfj8vfaz6BPZzj5VTf",
                            "remote": "origin",
                            "auto_fetch": True,
                            "merge_strategy": "merge"
                        }
                    ]
                }
            ],
            "reporting": {
                "output_format": "html",
                "output_dir": "./reports",
                "include_commits": True,
                "max_commits": 50
            },
            "parallel_operations": True,
            "max_workers": 4,
            "retry_attempts": 3,
            "retry_delay": 2.0
        }
        config = Config.from_dict(config_dict)
        log_test("Config.from_dict", "passed")
    except Exception as e:
        log_test("Config.from_dict", "failed", e)

    # Test 2: BranchConfig creation
    try:
        branch_config = BranchConfig(
            name="main",
            remote="origin",
            auto_fetch=True,
            merge_strategy="merge"
        )
        log_test("BranchConfig creation", "passed")
    except Exception as e:
        log_test("BranchConfig creation", "failed", e)

    # Test 3: RepositoryConfig creation
    try:
        repo_config = RepositoryConfig(
            path="/home/user/nava-ops",
            name="nava-ops",
            default_remote="origin",
            branches=[branch_config]
        )
        log_test("RepositoryConfig creation", "passed")
    except Exception as e:
        log_test("RepositoryConfig creation", "failed", e)

    # Test 4: ReportingConfig creation
    try:
        reporting_config = ReportingConfig(
            output_format="html",
            output_dir="./reports",
            include_commits=True,
            max_commits=50
        )
        log_test("ReportingConfig creation", "passed")
    except Exception as e:
        log_test("ReportingConfig creation", "failed", e)

    # Test 5: Config.to_dict
    try:
        config_dict_out = config.to_dict()
        log_test("Config.to_dict", "passed")
    except Exception as e:
        log_test("Config.to_dict", "failed", e)


def test_utils():
    """Test utility functions"""
    print("\n" + "="*70)
    print("TEST 3: Utility Functions")
    print("="*70)

    from src.utils import (
        execute_git_command,
        validate_branch_name,
        is_git_repository,
        format_duration
    )

    # Test 1: validate_branch_name
    try:
        result = validate_branch_name("main")
        assert result == True
        result = validate_branch_name("feature/test")
        assert result == True
        result = validate_branch_name("invalid..name")
        assert result == False
        log_test("validate_branch_name", "passed")
    except Exception as e:
        log_test("validate_branch_name", "failed", e)

    # Test 2: is_git_repository
    try:
        result = is_git_repository("/home/user/nava-ops")
        assert result == True
        log_test("is_git_repository", "passed")
    except Exception as e:
        log_test("is_git_repository", "failed", e)

    # Test 3: format_duration
    try:
        result = format_duration(65.5)
        assert "1m" in result
        log_test("format_duration", "passed")
    except Exception as e:
        log_test("format_duration", "failed", e)

    # Test 4: execute_git_command
    try:
        result = execute_git_command(
            ["git", "status"],
            cwd="/home/user/nava-ops"
        )
        assert result.success or result.returncode == 0
        log_test("execute_git_command", "passed")
    except Exception as e:
        log_test("execute_git_command", "failed", e)


def test_branch_operations():
    """Test branch operations"""
    print("\n" + "="*70)
    print("TEST 4: Branch Operations")
    print("="*70)

    from src.branch_ops import BranchOperations, BranchInfo, OperationResult
    from src.config import RepositoryConfig, BranchConfig

    # Test 1: BranchOperations creation
    try:
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
        branch_ops = BranchOperations(repo_config)
        log_test("BranchOperations creation", "passed")
    except Exception as e:
        log_test("BranchOperations creation", "failed", e)

    # Test 2: List branches
    try:
        branches = branch_ops.list_branches()
        assert isinstance(branches, list)
        log_test("BranchOperations.list_branches", "passed")
    except Exception as e:
        log_test("BranchOperations.list_branches", "failed", e)


def test_reporting():
    """Test reporting modules"""
    print("\n" + "="*70)
    print("TEST 5: Reporting Modules")
    print("="*70)

    from src.reporting import ReportGenerator, Report, BranchReport, ReportSummary
    from src.config import ReportingConfig

    # Test 1: Create dummy report
    try:
        summary = ReportSummary(
            total_operations=5,
            successful_operations=4,
            failed_operations=1,
            total_repositories=1,
            total_branches=3,
            duration_seconds=10.5
        )

        branch_report = BranchReport(
            repository="nava-ops",
            branch="main",
            operation="fetch",
            success=True,
            message="Fetch completed"
        )

        report = Report(
            summary=summary,
            branch_reports=[branch_report],
            timestamp="2025-11-12T10:00:00"
        )
        log_test("Report creation", "passed")
    except Exception as e:
        log_test("Report creation", "failed", e)

    # Test 2: ReportGenerator
    try:
        reporting_config = ReportingConfig(
            output_format="json",
            output_dir="./reports",
            include_commits=False
        )
        generator = ReportGenerator(reporting_config)
        log_test("ReportGenerator creation", "passed")
    except Exception as e:
        log_test("ReportGenerator creation", "failed", e)


def test_analytics():
    """Test analytics module"""
    print("\n" + "="*70)
    print("TEST 6: Analytics Module")
    print("="*70)

    from src.analytics import (
        AdvancedAnalyticsEngine,
        BranchHealthMetrics,
        RepositoryHealthDashboard
    )

    # Test 1: Create analytics engine
    try:
        engine = AdvancedAnalyticsEngine()
        log_test("AdvancedAnalyticsEngine creation", "passed")
    except Exception as e:
        log_test("AdvancedAnalyticsEngine creation", "failed", e)


def test_export_formats():
    """Test export formats"""
    print("\n" + "="*70)
    print("TEST 7: Export Formats")
    print("="*70)

    from src.export_formats import EnhancedExportFormats
    from src.analytics import AnalyticsReport

    # Test with dummy data
    try:
        dummy_report = {
            "summary": {
                "total_operations": 5,
                "successful_operations": 4,
                "failed_operations": 1
            },
            "branch_reports": []
        }

        # Test CSV export
        csv_output = EnhancedExportFormats.to_csv(dummy_report)
        assert len(csv_output) > 0
        log_test("EnhancedExportFormats.to_csv", "passed")
    except Exception as e:
        log_test("EnhancedExportFormats.to_csv", "failed", e)

    # Test XML export
    try:
        xml_output = EnhancedExportFormats.to_xml(dummy_report)
        assert len(xml_output) > 0
        log_test("EnhancedExportFormats.to_xml", "passed")
    except Exception as e:
        log_test("EnhancedExportFormats.to_xml", "failed", e)


def test_notifications():
    """Test notification modules"""
    print("\n" + "="*70)
    print("TEST 8: Notification Modules")
    print("="*70)

    from src.notifications import NotificationManager, NotificationConfig, NotificationLevel, NotificationChannel

    # Test 1: NotificationManager creation
    try:
        config = NotificationConfig(
            enabled=True,
            channels=[NotificationChannel.CONSOLE],
            min_level=NotificationLevel.INFO
        )
        manager = NotificationManager(config)
        log_test("NotificationManager creation", "passed")
    except Exception as e:
        log_test("NotificationManager creation", "failed", e)

    # Test 2: Enhanced notifications
    try:
        from src.enhanced_notifications import (
            EnhancedNotificationManager,
            EnhancedNotificationConfig,
            EnhancedNotificationChannel
        )

        config = EnhancedNotificationConfig(
            enabled=True,
            channels=[EnhancedNotificationChannel.CONSOLE]
        )
        manager = EnhancedNotificationManager(config)
        log_test("EnhancedNotificationManager creation", "passed")
    except Exception as e:
        log_test("EnhancedNotificationManager creation", "failed", e)


def test_advanced_reporting():
    """Test advanced reporting hub"""
    print("\n" + "="*70)
    print("TEST 9: Advanced Reporting Hub")
    print("="*70)

    from src.advanced_reporting import AdvancedReportingHub

    # Test 1: Create hub
    try:
        hub = AdvancedReportingHub(
            output_dir="./reports",
            enable_history=True,
            enable_insights=True
        )
        log_test("AdvancedReportingHub creation", "passed")
    except Exception as e:
        log_test("AdvancedReportingHub creation", "failed", e)


def test_smart_insights():
    """Test smart insights"""
    print("\n" + "="*70)
    print("TEST 10: Smart Insights")
    print("="*70)

    from src.smart_insights import SmartInsightsEngine, Insight

    # Test 1: Create engine
    try:
        engine = SmartInsightsEngine()
        log_test("SmartInsightsEngine creation", "passed")
    except Exception as e:
        log_test("SmartInsightsEngine creation", "failed", e)


def test_conflict_resolution():
    """Test conflict resolution"""
    print("\n" + "="*70)
    print("TEST 11: Conflict Resolution")
    print("="*70)

    from src.conflict_resolution import ConflictDetector, ConflictResolver, ResolutionStrategy

    # Test 1: Create detector
    try:
        detector = ConflictDetector("/home/user/nava-ops")
        log_test("ConflictDetector creation", "passed")
    except Exception as e:
        log_test("ConflictDetector creation", "failed", e)


def print_summary():
    """Print test summary"""
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    print(f"\n✅ Passed: {len(test_results['passed'])}")
    print(f"❌ Failed: {len(test_results['failed'])}")

    if test_results['failed']:
        print("\nFailed Tests:")
        for error in test_results['errors']:
            print(f"\n❌ {error['test']}")
            print(f"   Error: {error['error']}")
            if error['traceback']:
                print(f"   Traceback:\n{error['traceback']}")

    # Save results to file
    with open("test_results.json", "w") as f:
        json.dump(test_results, f, indent=2)
    print(f"\n📄 Detailed results saved to: test_results.json")

    return len(test_results['failed']) == 0


def main():
    """Run all tests"""
    print("="*70)
    print("NAVA OPS - COMPREHENSIVE ERROR DETECTION")
    print("="*70)

    test_imports()
    test_config_parsing()
    test_utils()
    test_branch_operations()
    test_reporting()
    test_analytics()
    test_export_formats()
    test_notifications()
    test_advanced_reporting()
    test_smart_insights()
    test_conflict_resolution()

    success = print_summary()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
