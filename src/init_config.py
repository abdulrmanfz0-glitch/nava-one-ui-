"""
Configuration Initialization Module

This module provides CLI commands to initialize and validate configuration files.
Run with: python -m src.init_config [options]
"""

import os
import sys
import argparse
from pathlib import Path
from typing import Optional

from .config import Config, normalize_path


def create_config(output_path: str, interactive: bool = False) -> None:
    """
    Create a new configuration file

    Args:
        output_path: Path where to create the config
        interactive: Whether to prompt for user input
    """
    print(f"🔧 Creating configuration file: {output_path}")

    if os.path.exists(output_path):
        response = input(f"⚠️  File {output_path} already exists. Overwrite? [y/N]: ")
        if response.lower() != 'y':
            print("❌ Aborted.")
            sys.exit(0)

    if interactive:
        config = create_interactive_config()
    else:
        config = Config.create_sample_config(output_path)

    print(f"✅ Configuration file created: {output_path}")
    print(f"\n📝 Next steps:")
    print(f"  1. Edit {output_path} with your repository paths")
    print(f"  2. Validate the config: python -m src.init_config --validate {output_path}")
    print(f"  3. Run operations: python src/api.py")


def create_interactive_config() -> Config:
    """
    Create configuration interactively by prompting the user

    Returns:
        Config instance created from user input
    """
    print("\n🎯 Interactive Configuration Setup")
    print("=" * 50)

    # Repository configuration
    repositories = []
    while True:
        print(f"\n📂 Repository #{len(repositories) + 1}")

        repo_path = input("  Repository path [.]: ").strip() or "."
        repo_path = normalize_path(repo_path)

        repo_name = input(f"  Repository name [{Path(repo_path).name}]: ").strip()
        repo_name = repo_name or Path(repo_path).name

        default_remote = input("  Default remote [origin]: ").strip() or "origin"

        # Branches
        branches = []
        print("\n  Branches (enter empty name to finish):")
        while True:
            branch_name = input(f"    Branch #{len(branches) + 1} name: ").strip()
            if not branch_name:
                break

            branch_remote = input(f"      Remote [{default_remote}]: ").strip() or default_remote
            auto_fetch = input(f"      Auto-fetch? [Y/n]: ").strip().lower() != 'n'
            merge_strategy = input(f"      Merge strategy (merge/rebase/squash) [merge]: ").strip() or "merge"

            from .config import BranchConfig
            branches.append(BranchConfig(
                name=branch_name,
                remote=branch_remote,
                auto_fetch=auto_fetch,
                merge_strategy=merge_strategy
            ))

        if not branches:
            print("  ⚠️  No branches specified, adding default 'main' branch")
            from .config import BranchConfig
            branches.append(BranchConfig(name="main"))

        from .config import RepositoryConfig
        repositories.append(RepositoryConfig(
            path=repo_path,
            name=repo_name,
            branches=branches,
            default_remote=default_remote
        ))

        add_more = input("\n➕ Add another repository? [y/N]: ").strip().lower() == 'y'
        if not add_more:
            break

    # Reporting configuration
    print("\n📊 Reporting Configuration")
    output_format = input("  Output format (json/markdown/html) [html]: ").strip() or "html"
    output_dir = input("  Output directory [./reports]: ").strip() or "./reports"
    include_commits = input("  Include commits? [Y/n]: ").strip().lower() != 'n'
    include_diff_stats = input("  Include diff stats? [Y/n]: ").strip().lower() != 'n'
    max_commits = input("  Max commits to include [50]: ").strip()
    max_commits = int(max_commits) if max_commits.isdigit() else 50

    from .config import ReportingConfig
    reporting = ReportingConfig(
        output_format=output_format,
        output_dir=output_dir,
        include_commits=include_commits,
        include_diff_stats=include_diff_stats,
        max_commits=max_commits
    )

    # Advanced options
    print("\n⚙️  Advanced Options")
    parallel_ops = input("  Enable parallel operations? [Y/n]: ").strip().lower() != 'n'
    max_workers = input("  Max parallel workers [4]: ").strip()
    max_workers = int(max_workers) if max_workers.isdigit() else 4
    retry_attempts = input("  Retry attempts [3]: ").strip()
    retry_attempts = int(retry_attempts) if retry_attempts.isdigit() else 3

    return Config(
        repositories=repositories,
        reporting=reporting,
        parallel_operations=parallel_ops,
        max_workers=max_workers,
        retry_attempts=retry_attempts,
        retry_delay=2.0
    )


def validate_config(config_path: str) -> bool:
    """
    Validate a configuration file

    Args:
        config_path: Path to the config file to validate

    Returns:
        True if valid, False otherwise
    """
    print(f"🔍 Validating configuration: {config_path}")

    try:
        # Try to load the config
        config = Config.from_file(config_path)

        # Validate
        errors = config.validate()

        if errors:
            print("\n❌ Validation failed with errors:")
            for i, error in enumerate(errors, 1):
                print(f"  {i}. {error}")
            return False
        else:
            print("\n✅ Configuration is valid!")

            # Print summary
            print(f"\n📋 Configuration Summary:")
            print(f"  • Repositories: {len(config.repositories)}")
            for repo in config.repositories:
                print(f"    - {repo.name}: {len(repo.branches)} branches")
            print(f"  • Output format: {config.reporting.output_format}")
            print(f"  • Output directory: {config.reporting.output_dir}")
            print(f"  • Parallel operations: {config.parallel_operations}")
            print(f"  • Max workers: {config.max_workers}")

            return True

    except FileNotFoundError as e:
        print(f"\n❌ Error: {e}")
        return False
    except ValueError as e:
        print(f"\n❌ Error: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Unexpected error: {type(e).__name__}: {e}")
        return False


def show_config(config_path: str) -> None:
    """
    Display configuration file contents in a readable format

    Args:
        config_path: Path to the config file
    """
    try:
        config = Config.from_file(config_path)

        print(f"\n📄 Configuration: {config_path}")
        print("=" * 70)

        print("\n📂 REPOSITORIES:")
        for i, repo in enumerate(config.repositories, 1):
            print(f"\n  {i}. {repo.name}")
            print(f"     Path: {repo.path}")
            print(f"     Remote: {repo.default_remote}")
            print(f"     Branches:")
            for branch in repo.branches:
                print(f"       • {branch.name} ({branch.remote}) - "
                      f"{'auto-fetch' if branch.auto_fetch else 'manual'}, "
                      f"{branch.merge_strategy}")

        print(f"\n📊 REPORTING:")
        print(f"  • Format: {config.reporting.output_format}")
        print(f"  • Directory: {config.reporting.output_dir}")
        print(f"  • Include commits: {config.reporting.include_commits}")
        print(f"  • Include diff stats: {config.reporting.include_diff_stats}")
        print(f"  • Max commits: {config.reporting.max_commits}")

        print(f"\n⚙️  OPERATIONS:")
        print(f"  • Parallel: {config.parallel_operations}")
        print(f"  • Max workers: {config.max_workers}")
        print(f"  • Retry attempts: {config.retry_attempts}")
        print(f"  • Retry delay: {config.retry_delay}s")

        print("\n" + "=" * 70)

    except Exception as e:
        print(f"\n❌ Error reading config: {e}")
        sys.exit(1)


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="Nava Ops Configuration Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Create a sample config
  python -m src.init_config

  # Create config interactively
  python -m src.init_config --interactive

  # Create config at specific path
  python -m src.init_config --output my_config.json

  # Validate existing config
  python -m src.init_config --validate examples/config.json

  # Show config contents
  python -m src.init_config --show examples/config.json
        """
    )

    parser.add_argument(
        '--output', '-o',
        default='examples/config.json',
        help='Output path for configuration file (default: examples/config.json)'
    )

    parser.add_argument(
        '--interactive', '-i',
        action='store_true',
        help='Create configuration interactively'
    )

    parser.add_argument(
        '--validate', '-v',
        metavar='CONFIG_FILE',
        help='Validate a configuration file'
    )

    parser.add_argument(
        '--show', '-s',
        metavar='CONFIG_FILE',
        help='Show configuration file contents'
    )

    args = parser.parse_args()

    print("🚀 Nava Ops Configuration Tool\n")

    # Handle different modes
    if args.validate:
        success = validate_config(args.validate)
        sys.exit(0 if success else 1)

    elif args.show:
        show_config(args.show)
        sys.exit(0)

    else:
        # Create mode (default)
        create_config(args.output, args.interactive)
        sys.exit(0)


if __name__ == '__main__':
    main()
