"""
Example Usage of Nava Ops Multi-Branch Operations

This example demonstrates how to use the Nava Ops system for
managing multi-branch operations across repositories.
"""

import sys
import os

# Add parent directory to path to import modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src import Config, MultibranchOrchestrator
from src.config import RepositoryConfig, BranchConfig, ReportingConfig


def example_1_basic_fetch():
    """Example 1: Basic fetch operation across multiple branches"""
    print("\n=== Example 1: Basic Fetch Operation ===\n")

    # Create configuration
    config = Config(
        repositories=[
            RepositoryConfig(
                path="/path/to/your/repo",
                name="my-project",
                branches=[
                    BranchConfig(name="main", remote="origin"),
                    BranchConfig(name="develop", remote="origin"),
                    BranchConfig(name="feature-branch", remote="origin"),
                ]
            )
        ],
        reporting=ReportingConfig(
            output_format="markdown",
            output_dir="./reports"
        ),
        parallel_operations=True,
        max_workers=4
    )

    # Create orchestrator
    orchestrator = MultibranchOrchestrator(config)

    # Execute fetch operation
    report = orchestrator.fetch_all_branches()

    # Export report
    report_path = orchestrator.report_generator.export(report)
    print(f"Report generated: {report_path}")
    print(f"Success rate: {report.summary.success_rate:.1f}%")


def example_2_sync_workflow():
    """Example 2: Sync workflow (fetch + pull)"""
    print("\n=== Example 2: Sync Workflow ===\n")

    config = Config(
        repositories=[
            RepositoryConfig(
                path="/path/to/repo1",
                name="frontend",
                branches=[
                    BranchConfig(name="main"),
                    BranchConfig(name="staging"),
                ]
            ),
            RepositoryConfig(
                path="/path/to/repo2",
                name="backend",
                branches=[
                    BranchConfig(name="main"),
                    BranchConfig(name="staging"),
                ]
            )
        ],
        parallel_operations=True,
        max_workers=4
    )

    orchestrator = MultibranchOrchestrator(config)

    # Sync all branches (fetch + pull)
    report = orchestrator.sync_all_branches()

    # Generate statistics
    stats = orchestrator.report_generator.generate_summary_statistics(report)

    print(f"\nTotal operations: {report.summary.total_operations}")
    print(f"Success rate: {report.summary.success_rate:.1f}%")
    print(f"\nOperations by type:")
    for op_type, op_stats in stats["by_operation_type"].items():
        print(f"  {op_type}: {op_stats['success']}/{op_stats['total']} succeeded")


def example_3_custom_workflow():
    """Example 3: Custom workflow with specific operations"""
    print("\n=== Example 3: Custom Workflow ===\n")

    config = Config(
        repositories=[
            RepositoryConfig(
                path="/path/to/repo",
                name="my-project",
                branches=[
                    BranchConfig(name="main"),
                    BranchConfig(name="develop"),
                ]
            )
        ]
    )

    orchestrator = MultibranchOrchestrator(config)

    # Execute custom sequence of operations
    report = orchestrator.execute_workflow(
        operations=["fetch", "pull"],
        branches=["develop"]  # Only operate on develop branch
    )

    # Export as HTML
    config.reporting.output_format = "html"
    report_path = orchestrator.report_generator.export(report, format="html")
    print(f"HTML report generated: {report_path}")


def example_4_advanced_custom_workflow():
    """Example 4: Advanced custom workflow with custom function"""
    print("\n=== Example 4: Advanced Custom Workflow ===\n")

    from src.branch_ops import BranchOperations, OperationResult
    from src.config import BranchConfig

    config = Config(
        repositories=[
            RepositoryConfig(
                path="/path/to/repo",
                name="my-project",
                branches=[
                    BranchConfig(name="feature-1"),
                    BranchConfig(name="feature-2"),
                ]
            )
        ]
    )

    def my_custom_workflow(branch_ops: BranchOperations, branch_config: BranchConfig):
        """
        Custom workflow: fetch, create backup, then pull
        """
        results = []

        # Fetch first
        results.append(branch_ops.fetch_branch(branch_config.name))

        # Create a backup branch
        backup_name = f"{branch_config.name}-backup"
        results.append(branch_ops.create_branch(backup_name, branch_config.name))

        # Pull updates
        results.append(branch_ops.pull_branch(branch_config.name))

        return results

    orchestrator = MultibranchOrchestrator(config)

    # Execute custom workflow
    report = orchestrator.custom_workflow(my_custom_workflow)

    print(f"Custom workflow completed")
    print(f"Total operations: {report.summary.total_operations}")
    print(f"Success rate: {report.summary.success_rate:.1f}%")


def example_5_load_from_file():
    """Example 5: Load configuration from file"""
    print("\n=== Example 5: Load Configuration from File ===\n")

    # Load configuration from JSON file
    config = Config.from_file("config.json")

    orchestrator = MultibranchOrchestrator(config)

    # Execute workflow
    report = orchestrator.sync_all_branches()

    # Export in multiple formats
    json_path = orchestrator.report_generator.export_json(report)
    md_path = orchestrator.report_generator.export_markdown(report)
    html_path = orchestrator.report_generator.export_html(report)

    print(f"Reports generated:")
    print(f"  - JSON: {json_path}")
    print(f"  - Markdown: {md_path}")
    print(f"  - HTML: {html_path}")


def example_6_error_handling():
    """Example 6: Handling errors and retries"""
    print("\n=== Example 6: Error Handling ===\n")

    config = Config(
        repositories=[
            RepositoryConfig(
                path="/path/to/repo",
                name="my-project",
                branches=[
                    BranchConfig(name="main"),
                    BranchConfig(name="develop"),
                ]
            )
        ],
        retry_attempts=4,  # Retry up to 4 times
        retry_delay=2.0    # Start with 2 second delay
    )

    orchestrator = MultibranchOrchestrator(config)

    # Execute operation (will retry on network failures)
    report = orchestrator.execute_workflow(
        operations=["fetch", "pull"]
    )

    # Check for errors
    if report.errors:
        print("Errors encountered:")
        for error in report.errors:
            print(f"  - {error}")

    # Check individual branch results
    for branch_report in report.branch_reports:
        if not branch_report.success:
            print(f"\nBranch {branch_report.branch_name} had failures:")
            for op in branch_report.operations:
                if not op.success:
                    print(f"  - {op.operation}: {op.error}")


if __name__ == "__main__":
    print("Nava Ops - Multi-Branch Operations Examples")
    print("=" * 50)

    # Note: These examples use placeholder paths
    # Update the paths to match your actual repositories before running

    print("\nThese are example functions. Uncomment the one you want to run.")
    print("Make sure to update repository paths first!\n")

    # Uncomment the example you want to run:
    # example_1_basic_fetch()
    # example_2_sync_workflow()
    # example_3_custom_workflow()
    # example_4_advanced_custom_workflow()
    # example_5_load_from_file()
    # example_6_error_handling()
