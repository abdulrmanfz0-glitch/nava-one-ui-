"""
Advanced Examples for Nava Ops

Demonstrates advanced features including:
- Conflict detection and resolution
- Branch comparison and analysis
- Cherry-pick operations
- Stash management
- Tag operations
- Smart merge workflows
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src import Config, MultibranchOrchestrator
from src.config import RepositoryConfig, BranchConfig, ReportingConfig
from src.conflict_resolution import (
    ConflictDetector, ConflictResolver, ResolutionStrategy,
    preview_merge_conflicts
)
from src.branch_comparison import BranchAnalyzer, compare_branches
from src.advanced_ops import AdvancedGitOperations


def example_1_conflict_detection():
    """Example 1: Detect and analyze merge conflicts before merging"""
    print("\n=== Example 1: Conflict Detection ===\n")

    repo_config = RepositoryConfig(
        path="/path/to/your/repo",
        name="my-project",
        branches=[
            BranchConfig(name="main"),
            BranchConfig(name="feature-branch"),
        ]
    )

    # Create conflict detector
    detector = ConflictDetector(repo_config)

    # Check for conflicts before merging
    conflict_info = detector.check_for_conflicts(
        source_branch="feature-branch",
        target_branch="main"
    )

    print(f"Has conflicts: {conflict_info.has_conflicts}")
    print(f"Total conflicts: {conflict_info.total_conflicts}")
    print(f"Affected files: {len(conflict_info.conflicted_files)}")

    print("\nResolution Suggestions:")
    for suggestion in conflict_info.resolution_suggestions:
        print(f"  • {suggestion}")

    # Show details of conflicted files
    if conflict_info.conflicted_files:
        print("\nConflicted Files:")
        for cf in conflict_info.conflicted_files:
            print(f"\n  File: {cf.path}")
            print(f"  Conflict markers: {cf.conflict_markers}")
            print(f"  Can auto-resolve: {cf.can_auto_resolve}")
            print(f"  Preview: {cf.conflict_preview[:200]}...")


def example_2_conflict_resolution():
    """Example 2: Resolve conflicts with different strategies"""
    print("\n=== Example 2: Conflict Resolution ===\n")

    repo_config = RepositoryConfig(
        path="/path/to/your/repo",
        name="my-project",
        branches=[BranchConfig(name="main")]
    )

    # Create conflict resolver
    resolver = ConflictResolver(repo_config)

    # Strategy 1: Resolve with "ours" (keep our version)
    print("1. Resolving with 'ours' strategy...")
    result = resolver.resolve_conflicts(ResolutionStrategy.OURS)

    print(f"   Success: {result.success}")
    print(f"   Files resolved: {len(result.files_resolved)}")
    print(f"   Files remaining: {len(result.files_remaining)}")

    # Strategy 2: Smart auto-resolution
    print("\n2. Attempting smart auto-resolution...")
    result = resolver.smart_resolve()

    print(f"   Success: {result.success}")
    print(f"   Strategy: {result.strategy_used.value}")
    print(f"   Message: {result.message}")


def example_3_branch_comparison():
    """Example 3: Compare branches and analyze divergence"""
    print("\n=== Example 3: Branch Comparison ===\n")

    repo_config = RepositoryConfig(
        path="/path/to/your/repo",
        name="my-project",
        branches=[]
    )

    # Create branch analyzer
    analyzer = BranchAnalyzer(repo_config)

    # Compare two branches
    comparison = analyzer.compare_branches(
        branch_a="main",
        branch_b="develop",
        include_files=True
    )

    print(f"Branch A: {comparison.branch_a}")
    print(f"Branch B: {comparison.branch_b}")
    print(f"\nDivergence Analysis:")
    print(f"  Ahead: {comparison.divergence.ahead} commits")
    print(f"  Behind: {comparison.divergence.behind} commits")
    print(f"  Files diverged: {comparison.divergence.files_diverged}")
    print(f"  Conflict potential: {comparison.divergence.conflict_potential}")
    print(f"  Can fast-forward: {comparison.divergence.can_fast_forward}")

    print(f"\nFile Changes:")
    print(f"  Total files: {comparison.total_files_changed}")
    print(f"  Insertions: +{comparison.total_insertions}")
    print(f"  Deletions: -{comparison.total_deletions}")

    print(f"\nSimilarity Score: {comparison.similarity_score:.2f}")
    print(f"\nRecommendation:")
    print(f"  {comparison.merge_recommendation}")

    # Show unique commits
    if comparison.divergence.unique_commits_a:
        print(f"\nUnique commits in {comparison.branch_a}:")
        for commit in comparison.divergence.unique_commits_a[:5]:
            print(f"  • {commit.short_hash}: {commit.message[:60]}")


def example_4_cherry_pick_workflow():
    """Example 4: Cherry-pick commits across branches"""
    print("\n=== Example 4: Cherry-Pick Workflow ===\n")

    repo_config = RepositoryConfig(
        path="/path/to/your/repo",
        name="my-project",
        branches=[
            BranchConfig(name="main"),
            BranchConfig(name="hotfix"),
        ]
    )

    # Create advanced operations handler
    advanced_ops = AdvancedGitOperations(repo_config)

    # Cherry-pick a single commit
    print("1. Cherry-picking specific commit to hotfix branch...")
    result = advanced_ops.cherry_pick_commit(
        commit_hash="abc123def456",
        branch_name="hotfix"
    )

    print(f"   Success: {result.success}")
    print(f"   Message: {result.message}")

    # Cherry-pick a range of commits
    print("\n2. Cherry-picking commit range...")
    results = advanced_ops.cherry_pick_range(
        start_commit="abc123",
        end_commit="def456",
        branch_name="main"
    )

    for result in results:
        print(f"   Operation: {result.operation}")
        print(f"   Success: {result.success}")


def example_5_stash_management():
    """Example 5: Manage stashes for work-in-progress"""
    print("\n=== Example 5: Stash Management ===\n")

    repo_config = RepositoryConfig(
        path="/path/to/your/repo",
        name="my-project",
        branches=[BranchConfig(name="main")]
    )

    advanced_ops = AdvancedGitOperations(repo_config)

    # Save current work to stash
    print("1. Saving work to stash...")
    result = advanced_ops.stash_save(
        message="WIP: implementing new feature",
        include_untracked=True
    )
    print(f"   {result.message}")

    # List all stashes
    print("\n2. Listing stashes...")
    stashes = advanced_ops.stash_list()
    for stash in stashes:
        print(f"   {stash.name}: {stash.message} ({stash.timestamp})")

    # Apply stash later
    print("\n3. Applying stash...")
    result = advanced_ops.stash_apply(index=0)
    print(f"   {result.message}")


def example_6_tag_operations():
    """Example 6: Manage git tags for versioning"""
    print("\n=== Example 6: Tag Operations ===\n")

    repo_config = RepositoryConfig(
        path="/path/to/your/repo",
        name="my-project",
        branches=[BranchConfig(name="main")]
    )

    advanced_ops = AdvancedGitOperations(repo_config)

    # Create annotated tag
    print("1. Creating release tag...")
    result = advanced_ops.create_tag(
        tag_name="v1.2.0",
        message="Release version 1.2.0 - Added advanced features"
    )
    print(f"   {result.message}")

    # List all tags
    print("\n2. Listing tags...")
    tags = advanced_ops.list_tags(pattern="v1.*")
    for tag in tags:
        print(f"   {tag.name} ({tag.type}): {tag.commit_hash}")

    # Push tag to remote
    print("\n3. Pushing tag to remote...")
    result = advanced_ops.push_tag("v1.2.0", remote="origin")
    print(f"   {result.message}")


def example_7_smart_merge_workflow():
    """Example 7: Smart merge workflow with conflict prevention"""
    print("\n=== Example 7: Smart Merge Workflow ===\n")

    config = Config(
        repositories=[
            RepositoryConfig(
                path="/path/to/your/repo",
                name="my-project",
                branches=[
                    BranchConfig(name="main"),
                    BranchConfig(name="develop"),
                    BranchConfig(name="feature-branch"),
                ]
            )
        ],
        reporting=ReportingConfig(output_format="html")
    )

    repo_config = config.repositories[0]

    # Step 1: Analyze branch relationship
    print("Step 1: Analyzing branches...")
    analyzer = BranchAnalyzer(repo_config)

    comparison = analyzer.compare_branches("feature-branch", "develop")

    print(f"  Conflict potential: {comparison.divergence.conflict_potential}")
    print(f"  Recommendation: {comparison.merge_recommendation}")

    # Step 2: Preview conflicts
    print("\nStep 2: Previewing conflicts...")
    conflict_info = preview_merge_conflicts(
        repo_config,
        source_branch="feature-branch",
        target_branch="develop"
    )

    if conflict_info.has_conflicts:
        print(f"  ⚠ Found {conflict_info.total_conflicts} potential conflicts")
        print("  Suggestions:")
        for suggestion in conflict_info.resolution_suggestions:
            print(f"    • {suggestion}")
    else:
        print("  ✓ No conflicts detected - safe to merge")

    # Step 3: Execute merge with orchestrator
    print("\nStep 3: Executing merge workflow...")
    orchestrator = MultibranchOrchestrator(config)

    # Custom merge workflow
    from src.branch_ops import BranchOperations

    def safe_merge_workflow(branch_ops: BranchOperations, branch_config: BranchConfig):
        """
        Safe merge workflow with conflict detection
        """
        results = []

        # Fetch latest
        results.append(branch_ops.fetch_branch(branch_config.name))

        # Check for conflicts first (would need to be implemented)
        # If no conflicts, proceed with merge
        results.append(branch_ops.merge_branch(
            source_branch="develop",
            target_branch=branch_config.name,
            strategy="merge"
        ))

        return results

    report = orchestrator.custom_workflow(
        safe_merge_workflow,
        branches=["feature-branch"]
    )

    print(f"\nWorkflow completed:")
    print(f"  Success rate: {report.summary.success_rate:.1f}%")
    print(f"  Duration: {report.summary.duration}")


def example_8_multi_repo_sync_with_analysis():
    """Example 8: Sync multiple repos with branch analysis"""
    print("\n=== Example 8: Multi-Repo Sync with Analysis ===\n")

    config = Config(
        repositories=[
            RepositoryConfig(
                path="/path/to/frontend",
                name="frontend",
                branches=[
                    BranchConfig(name="main"),
                    BranchConfig(name="staging"),
                ]
            ),
            RepositoryConfig(
                path="/path/to/backend",
                name="backend",
                branches=[
                    BranchConfig(name="main"),
                    BranchConfig(name="staging"),
                ]
            ),
            RepositoryConfig(
                path="/path/to/api",
                name="api",
                branches=[
                    BranchConfig(name="main"),
                    BranchConfig(name="staging"),
                ]
            )
        ],
        parallel_operations=True,
        max_workers=3,
        reporting=ReportingConfig(
            output_format="html",
            output_dir="./reports"
        )
    )

    # Analyze each repository's branch status
    print("Analyzing repository branches...")
    for repo_config in config.repositories:
        print(f"\n{repo_config.name}:")

        analyzer = BranchAnalyzer(repo_config)

        # Compare main vs staging
        comparison = analyzer.compare_branches("main", "staging")

        print(f"  main vs staging:")
        print(f"    Ahead: {comparison.divergence.ahead}")
        print(f"    Behind: {comparison.divergence.behind}")
        print(f"    Similarity: {comparison.similarity_score:.2%}")

    # Execute sync workflow
    print("\nExecuting sync workflow across all repositories...")
    orchestrator = MultibranchOrchestrator(config)

    report = orchestrator.sync_all_branches()

    print(f"\nSync completed:")
    print(f"  Total operations: {report.summary.total_operations}")
    print(f"  Success rate: {report.summary.success_rate:.1f}%")
    print(f"  Duration: {report.summary.duration}")

    # Export comprehensive report
    html_report = orchestrator.report_generator.export_html(report)
    print(f"\nDetailed report: {html_report}")


def example_9_release_workflow():
    """Example 9: Complete release workflow with tags and merges"""
    print("\n=== Example 9: Release Workflow ===\n")

    repo_config = RepositoryConfig(
        path="/path/to/your/repo",
        name="my-project",
        branches=[
            BranchConfig(name="main"),
            BranchConfig(name="develop"),
            BranchConfig(name="release/v1.2.0"),
        ]
    )

    advanced_ops = AdvancedGitOperations(repo_config)

    # Step 1: Create release branch from develop
    print("Step 1: Creating release branch...")
    # (Would use branch creation from branch_ops)

    # Step 2: Merge release into main
    print("Step 2: Merging release into main...")
    # (Would use merge operations)

    # Step 3: Create release tag
    print("Step 3: Creating release tag...")
    result = advanced_ops.create_tag(
        tag_name="v1.2.0",
        message="Release 1.2.0\n\nFeatures:\n- Feature A\n- Feature B\n\nFixes:\n- Bug fix 1"
    )
    print(f"   {result.message}")

    # Step 4: Merge back to develop
    print("Step 4: Merging back to develop...")
    # (Would use merge operations)

    # Step 5: Push everything
    print("Step 5: Pushing changes and tags...")
    result = advanced_ops.push_tag("v1.2.0", remote="origin")
    print(f"   {result.message}")

    print("\n✓ Release workflow completed!")


def example_10_conflict_prevention_workflow():
    """Example 10: Proactive conflict prevention"""
    print("\n=== Example 10: Proactive Conflict Prevention ===\n")

    repo_config = RepositoryConfig(
        path="/path/to/your/repo",
        name="my-project",
        branches=[
            BranchConfig(name="main"),
            BranchConfig(name="feature-1"),
            BranchConfig(name="feature-2"),
        ]
    )

    print("Checking all feature branches for conflicts with main...\n")

    detector = ConflictDetector(repo_config)
    analyzer = BranchAnalyzer(repo_config)

    feature_branches = ["feature-1", "feature-2"]

    for feature in feature_branches:
        print(f"Analyzing {feature}:")

        # Check divergence
        divergence = analyzer.analyze_divergence(feature, "main")

        print(f"  Commits ahead: {divergence.ahead}")
        print(f"  Commits behind: {divergence.behind}")
        print(f"  Conflict potential: {divergence.conflict_potential}")

        # Preview conflicts
        conflict_info = detector.check_for_conflicts(feature, "main")

        if conflict_info.has_conflicts:
            print(f"  ⚠ WARNING: {conflict_info.total_conflicts} potential conflicts")
            print(f"  Recommendations:")
            for suggestion in conflict_info.resolution_suggestions[:3]:
                print(f"    • {suggestion}")
        else:
            print("  ✓ Safe to merge")

        print()


if __name__ == "__main__":
    print("Nava Ops - Advanced Examples")
    print("=" * 60)

    print("\nAvailable examples:")
    print("  1. Conflict Detection")
    print("  2. Conflict Resolution")
    print("  3. Branch Comparison")
    print("  4. Cherry-Pick Workflow")
    print("  5. Stash Management")
    print("  6. Tag Operations")
    print("  7. Smart Merge Workflow")
    print("  8. Multi-Repo Sync with Analysis")
    print("  9. Release Workflow")
    print(" 10. Conflict Prevention Workflow")

    print("\nNote: Update repository paths before running examples")
    print("\nUncomment the example you want to run:")

    # Uncomment to run:
    # example_1_conflict_detection()
    # example_2_conflict_resolution()
    # example_3_branch_comparison()
    # example_4_cherry_pick_workflow()
    # example_5_stash_management()
    # example_6_tag_operations()
    # example_7_smart_merge_workflow()
    # example_8_multi_repo_sync_with_analysis()
    # example_9_release_workflow()
    # example_10_conflict_prevention_workflow()
