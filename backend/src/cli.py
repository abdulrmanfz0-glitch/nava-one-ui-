"""
CLI Module

Interactive command-line interface for Nava Ops with rich formatting,
progress tracking, and interactive menus.

Features:
- Interactive menu system
- Progress bars and status indicators
- Colorized output
- Command history
- Auto-completion support
"""

import sys
import os
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

from .config import Config, RepositoryConfig, BranchConfig
from .orchestrator import MultibranchOrchestrator
from .reporting import Report


logger = logging.getLogger(__name__)


class Colors:
    """ANSI color codes for terminal output"""
    RESET = '\033[0m'
    BOLD = '\033[1m'
    DIM = '\033[2m'

    # Text colors
    BLACK = '\033[30m'
    RED = '\033[31m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    MAGENTA = '\033[35m'
    CYAN = '\033[36m'
    WHITE = '\033[37m'

    # Background colors
    BG_RED = '\033[41m'
    BG_GREEN = '\033[42m'
    BG_YELLOW = '\033[43m'
    BG_BLUE = '\033[44m'

    @classmethod
    def disable(cls):
        """Disable colors (for non-TTY environments)"""
        cls.RESET = ''
        cls.BOLD = ''
        cls.DIM = ''
        cls.BLACK = cls.RED = cls.GREEN = cls.YELLOW = ''
        cls.BLUE = cls.MAGENTA = cls.CYAN = cls.WHITE = ''
        cls.BG_RED = cls.BG_GREEN = cls.BG_YELLOW = cls.BG_BLUE = ''


class UI:
    """UI utilities for formatted output"""

    @staticmethod
    def header(text: str):
        """Print a header"""
        width = 70
        print(f"\n{Colors.BOLD}{Colors.CYAN}{'=' * width}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.CYAN}{text.center(width)}{Colors.RESET}")
        print(f"{Colors.BOLD}{Colors.CYAN}{'=' * width}{Colors.RESET}\n")

    @staticmethod
    def section(text: str):
        """Print a section header"""
        print(f"\n{Colors.BOLD}{Colors.BLUE}▶ {text}{Colors.RESET}")
        print(f"{Colors.DIM}{'─' * 60}{Colors.RESET}")

    @staticmethod
    def success(text: str):
        """Print success message"""
        print(f"{Colors.GREEN}✓ {text}{Colors.RESET}")

    @staticmethod
    def error(text: str):
        """Print error message"""
        print(f"{Colors.RED}✗ {text}{Colors.RESET}")

    @staticmethod
    def warning(text: str):
        """Print warning message"""
        print(f"{Colors.YELLOW}⚠ {text}{Colors.RESET}")

    @staticmethod
    def info(text: str):
        """Print info message"""
        print(f"{Colors.CYAN}ℹ {text}{Colors.RESET}")

    @staticmethod
    def menu_item(number: int, text: str, description: str = ""):
        """Print a menu item"""
        if description:
            print(f"  {Colors.BOLD}{number}.{Colors.RESET} {Colors.GREEN}{text}{Colors.RESET}")
            print(f"     {Colors.DIM}{description}{Colors.RESET}")
        else:
            print(f"  {Colors.BOLD}{number}.{Colors.RESET} {Colors.GREEN}{text}{Colors.RESET}")

    @staticmethod
    def prompt(text: str, default: Optional[str] = None) -> str:
        """Prompt user for input"""
        if default:
            prompt_text = f"{Colors.BOLD}{text}{Colors.RESET} [{Colors.DIM}{default}{Colors.RESET}]: "
        else:
            prompt_text = f"{Colors.BOLD}{text}{Colors.RESET}: "

        try:
            response = input(prompt_text).strip()
            return response if response else (default or "")
        except (KeyboardInterrupt, EOFError):
            print(f"\n{Colors.YELLOW}Operation cancelled{Colors.RESET}")
            sys.exit(0)

    @staticmethod
    def confirm(text: str, default: bool = False) -> bool:
        """Ask for yes/no confirmation"""
        default_str = "Y/n" if default else "y/N"
        response = UI.prompt(f"{text} ({default_str})", "y" if default else "n").lower()
        return response in ['y', 'yes', 'true', '1'] if response else default

    @staticmethod
    def progress_bar(current: int, total: int, prefix: str = "", width: int = 50):
        """Display a progress bar"""
        if total == 0:
            return

        percent = current / total
        filled = int(width * percent)
        bar = '█' * filled + '░' * (width - filled)

        print(f"\r{prefix} |{Colors.CYAN}{bar}{Colors.RESET}| {current}/{total} ({percent * 100:.1f}%)", end='', flush=True)

        if current == total:
            print()  # New line when complete


class NavaOpsCLI:
    """
    Main CLI interface for Nava Ops

    Provides interactive menus and commands for managing multi-branch operations.
    """

    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize CLI

        Args:
            config_path: Path to configuration file (optional)
        """
        self.config_path = config_path
        self.config: Optional[Config] = None
        self.orchestrator: Optional[MultibranchOrchestrator] = None

        # Disable colors if not in TTY
        if not sys.stdout.isatty():
            Colors.disable()

    def load_config(self, path: Optional[str] = None):
        """Load configuration from file"""
        config_file = path or self.config_path or "config.json"

        try:
            if os.path.exists(config_file):
                UI.info(f"Loading configuration from: {config_file}")
                self.config = Config.from_file(config_file)
                self.orchestrator = MultibranchOrchestrator(self.config)
                UI.success("Configuration loaded successfully")
                return True
            else:
                UI.warning(f"Configuration file not found: {config_file}")
                return False
        except Exception as e:
            UI.error(f"Failed to load configuration: {e}")
            return False

    def create_interactive_config(self) -> Config:
        """Create configuration interactively"""
        UI.section("Create New Configuration")

        repositories = []

        while True:
            UI.info("\nRepository Configuration")
            repo_path = UI.prompt("Repository path", os.getcwd())
            repo_name = UI.prompt("Repository name", os.path.basename(repo_path))
            default_remote = UI.prompt("Default remote", "origin")

            # Configure branches
            branches = []
            UI.info("\nBranch Configuration")

            while True:
                branch_name = UI.prompt("Branch name (or press Enter to finish)")
                if not branch_name:
                    break

                branch_remote = UI.prompt("Remote", default_remote)
                auto_fetch = UI.confirm("Auto-fetch enabled?", True)

                branches.append(BranchConfig(
                    name=branch_name,
                    remote=branch_remote,
                    auto_fetch=auto_fetch
                ))
                UI.success(f"Added branch: {branch_name}")

            if branches:
                repositories.append(RepositoryConfig(
                    path=repo_path,
                    name=repo_name,
                    default_remote=default_remote,
                    branches=branches
                ))
                UI.success(f"Added repository: {repo_name}")

            if not UI.confirm("\nAdd another repository?", False):
                break

        # Global configuration
        UI.section("Global Configuration")
        parallel = UI.confirm("Enable parallel operations?", True)
        max_workers = int(UI.prompt("Max workers", "4"))
        retry_attempts = int(UI.prompt("Retry attempts", "3"))

        config = Config(
            repositories=repositories,
            parallel_operations=parallel,
            max_workers=max_workers,
            retry_attempts=retry_attempts
        )

        # Save configuration
        if UI.confirm("\nSave configuration to file?", True):
            save_path = UI.prompt("Save path", "config.json")
            config.to_file(save_path)
            UI.success(f"Configuration saved to: {save_path}")
            self.config_path = save_path

        return config

    def display_report_summary(self, report: Report):
        """Display report summary"""
        UI.section("Operation Summary")

        summary = report.summary

        # Success rate color coding
        if summary.success_rate >= 90:
            rate_color = Colors.GREEN
        elif summary.success_rate >= 70:
            rate_color = Colors.YELLOW
        else:
            rate_color = Colors.RED

        print(f"  Total Operations:     {Colors.BOLD}{summary.total_operations}{Colors.RESET}")
        print(f"  Successful:           {Colors.GREEN}{summary.successful_operations}{Colors.RESET}")
        print(f"  Failed:               {Colors.RED}{summary.failed_operations}{Colors.RESET}")
        print(f"  Success Rate:         {rate_color}{summary.success_rate:.1f}%{Colors.RESET}")
        print(f"  Duration:             {Colors.CYAN}{summary.duration}{Colors.RESET}")

        if report.errors:
            UI.warning(f"\nErrors encountered: {len(report.errors)}")
            for error in report.errors[:5]:  # Show first 5 errors
                print(f"    {Colors.RED}• {error}{Colors.RESET}")
            if len(report.errors) > 5:
                print(f"    {Colors.DIM}... and {len(report.errors) - 5} more{Colors.RESET}")

    def main_menu(self):
        """Display and handle main menu"""
        while True:
            UI.header("NAVA OPS - Multi-Branch Git Operations")

            if self.config:
                UI.info(f"Config loaded: {len(self.config.repositories)} repositories")
            else:
                UI.warning("No configuration loaded")

            print()
            UI.menu_item(1, "Fetch All Branches", "Fetch updates from all remotes")
            UI.menu_item(2, "Sync All Branches", "Fetch and pull all branches")
            UI.menu_item(3, "Custom Workflow", "Execute custom operations")
            UI.menu_item(4, "Branch Status", "View status of all branches")
            UI.menu_item(5, "Configuration", "Load, create, or edit configuration")
            UI.menu_item(6, "Reports", "View and export reports")
            UI.menu_item(0, "Exit", "Exit Nava Ops")

            choice = UI.prompt("\nSelect an option", "0")

            if choice == "1":
                self.fetch_all()
            elif choice == "2":
                self.sync_all()
            elif choice == "3":
                self.custom_workflow_menu()
            elif choice == "4":
                self.branch_status()
            elif choice == "5":
                self.configuration_menu()
            elif choice == "6":
                self.reports_menu()
            elif choice == "0":
                UI.info("Goodbye!")
                break
            else:
                UI.error("Invalid option")

    def fetch_all(self):
        """Fetch all branches"""
        if not self.ensure_config():
            return

        UI.section("Fetch All Branches")

        if not UI.confirm("Proceed with fetch operation?", True):
            return

        try:
            UI.info("Starting fetch operation...")
            report = self.orchestrator.fetch_all_branches()

            self.display_report_summary(report)

            if UI.confirm("\nExport report?", True):
                self.export_report(report)

        except Exception as e:
            UI.error(f"Fetch operation failed: {e}")
            logger.exception("Fetch operation error")

    def sync_all(self):
        """Sync all branches (fetch + pull)"""
        if not self.ensure_config():
            return

        UI.section("Sync All Branches")
        UI.warning("This will fetch and pull all configured branches")

        if not UI.confirm("Proceed with sync operation?", False):
            return

        try:
            UI.info("Starting sync operation...")
            report = self.orchestrator.sync_all_branches()

            self.display_report_summary(report)

            if UI.confirm("\nExport report?", True):
                self.export_report(report)

        except Exception as e:
            UI.error(f"Sync operation failed: {e}")
            logger.exception("Sync operation error")

    def custom_workflow_menu(self):
        """Custom workflow menu"""
        if not self.ensure_config():
            return

        UI.section("Custom Workflow")

        # Select operations
        available_ops = ["fetch", "pull", "push", "merge", "create", "switch"]

        print("\nAvailable operations:")
        for i, op in enumerate(available_ops, 1):
            print(f"  {i}. {op}")

        ops_input = UI.prompt("\nEnter operation numbers (comma-separated)", "1,2")

        try:
            indices = [int(i.strip()) - 1 for i in ops_input.split(",")]
            operations = [available_ops[i] for i in indices if 0 <= i < len(available_ops)]
        except (ValueError, IndexError):
            UI.error("Invalid operation selection")
            return

        # Select repositories
        if len(self.config.repositories) > 1:
            print("\nRepositories:")
            for i, repo in enumerate(self.config.repositories, 1):
                print(f"  {i}. {repo.name} ({repo.path})")

            repo_input = UI.prompt("Select repositories (comma-separated, or 'all')", "all")

            if repo_input.lower() == "all":
                repositories = None
            else:
                try:
                    indices = [int(i.strip()) - 1 for i in repo_input.split(",")]
                    repositories = [self.config.repositories[i].name for i in indices
                                   if 0 <= i < len(self.config.repositories)]
                except (ValueError, IndexError):
                    UI.error("Invalid repository selection")
                    return
        else:
            repositories = None

        # Execute workflow
        UI.info(f"\nExecuting operations: {', '.join(operations)}")

        try:
            report = self.orchestrator.execute_workflow(
                operations=operations,
                repositories=repositories
            )

            self.display_report_summary(report)

            if UI.confirm("\nExport report?", True):
                self.export_report(report)

        except Exception as e:
            UI.error(f"Workflow failed: {e}")
            logger.exception("Custom workflow error")

    def branch_status(self):
        """Display branch status"""
        if not self.ensure_config():
            return

        UI.section("Branch Status")

        for repo_config in self.config.repositories:
            print(f"\n{Colors.BOLD}{Colors.BLUE}Repository: {repo_config.name}{Colors.RESET}")
            print(f"{Colors.DIM}Path: {repo_config.path}{Colors.RESET}\n")

            try:
                from .branch_ops import BranchOperations
                branch_ops = BranchOperations(repo_config, self.config.retry_attempts)

                for branch_config in repo_config.branches:
                    try:
                        status = branch_ops.get_branch_status(branch_config.name)

                        ahead = status.get('ahead', 0)
                        behind = status.get('behind', 0)

                        # Status indicator
                        if ahead == 0 and behind == 0:
                            indicator = f"{Colors.GREEN}✓{Colors.RESET}"
                        elif behind > 0:
                            indicator = f"{Colors.YELLOW}↓{Colors.RESET}"
                        elif ahead > 0:
                            indicator = f"{Colors.CYAN}↑{Colors.RESET}"
                        else:
                            indicator = f"{Colors.BLUE}•{Colors.RESET}"

                        print(f"  {indicator} {Colors.BOLD}{branch_config.name}{Colors.RESET}")

                        if ahead > 0:
                            print(f"     {Colors.CYAN}↑ {ahead} commit(s) ahead{Colors.RESET}")
                        if behind > 0:
                            print(f"     {Colors.YELLOW}↓ {behind} commit(s) behind{Colors.RESET}")
                        if ahead == 0 and behind == 0:
                            print(f"     {Colors.GREEN}Up to date{Colors.RESET}")

                        if 'last_commit' in status:
                            print(f"     {Colors.DIM}Last: {status['last_commit'][:60]}...{Colors.RESET}")

                        print()

                    except Exception as e:
                        UI.error(f"  Failed to get status for {branch_config.name}: {e}")

            except Exception as e:
                UI.error(f"Failed to access repository: {e}")

        UI.prompt("\nPress Enter to continue")

    def configuration_menu(self):
        """Configuration management menu"""
        UI.section("Configuration Management")

        print()
        UI.menu_item(1, "Load Configuration", "Load from file")
        UI.menu_item(2, "Create Configuration", "Interactive configuration creation")
        UI.menu_item(3, "View Configuration", "Display current configuration")
        UI.menu_item(4, "Save Configuration", "Save to file")
        UI.menu_item(0, "Back", "Return to main menu")

        choice = UI.prompt("\nSelect an option", "0")

        if choice == "1":
            path = UI.prompt("Configuration file path", "config.json")
            self.load_config(path)
        elif choice == "2":
            self.config = self.create_interactive_config()
            self.orchestrator = MultibranchOrchestrator(self.config)
        elif choice == "3":
            if self.config:
                print(f"\n{Colors.BOLD}Current Configuration:{Colors.RESET}")
                print(f"  Repositories: {len(self.config.repositories)}")
                for repo in self.config.repositories:
                    print(f"    • {repo.name}: {len(repo.branches)} branches")
                print(f"  Parallel operations: {self.config.parallel_operations}")
                print(f"  Max workers: {self.config.max_workers}")
                print(f"  Retry attempts: {self.config.retry_attempts}")
            else:
                UI.warning("No configuration loaded")
            UI.prompt("\nPress Enter to continue")
        elif choice == "4":
            if self.config:
                path = UI.prompt("Save path", "config.json")
                self.config.to_file(path)
                UI.success(f"Configuration saved to: {path}")
            else:
                UI.warning("No configuration to save")

    def reports_menu(self):
        """Reports menu"""
        UI.section("Reports Management")

        UI.info("Export latest report in different formats")

        # This would require storing the last report
        # For now, just show the concept
        UI.warning("No recent reports available")
        UI.info("Reports are generated after operations (fetch, sync, etc.)")

        UI.prompt("\nPress Enter to continue")

    def export_report(self, report: Report):
        """Export report in selected format"""
        print("\nExport formats:")
        UI.menu_item(1, "JSON", "Machine-readable format")
        UI.menu_item(2, "Markdown", "Human-readable documentation")
        UI.menu_item(3, "HTML", "Interactive web report")
        UI.menu_item(4, "All formats", "Export in all formats")

        choice = UI.prompt("Select format", "3")

        try:
            if choice == "1":
                path = self.orchestrator.report_generator.export_json(report)
                UI.success(f"JSON report: {path}")
            elif choice == "2":
                path = self.orchestrator.report_generator.export_markdown(report)
                UI.success(f"Markdown report: {path}")
            elif choice == "3":
                path = self.orchestrator.report_generator.export_html(report)
                UI.success(f"HTML report: {path}")
            elif choice == "4":
                json_path = self.orchestrator.report_generator.export_json(report)
                md_path = self.orchestrator.report_generator.export_markdown(report)
                html_path = self.orchestrator.report_generator.export_html(report)
                UI.success(f"Reports exported:")
                print(f"  • JSON: {json_path}")
                print(f"  • Markdown: {md_path}")
                print(f"  • HTML: {html_path}")
        except Exception as e:
            UI.error(f"Failed to export report: {e}")

    def ensure_config(self) -> bool:
        """Ensure configuration is loaded"""
        if not self.config:
            UI.error("No configuration loaded")
            if UI.confirm("Load configuration now?", True):
                return self.load_config()
            return False
        return True

    def run(self):
        """Run the CLI"""
        try:
            # Try to load default config
            if self.config_path and os.path.exists(self.config_path):
                self.load_config()

            # Show main menu
            self.main_menu()

        except KeyboardInterrupt:
            print(f"\n\n{Colors.YELLOW}Operation cancelled by user{Colors.RESET}")
            sys.exit(0)
        except Exception as e:
            UI.error(f"Unexpected error: {e}")
            logger.exception("CLI error")
            sys.exit(1)


def main():
    """CLI entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Nava Ops - Multi-Branch Git Operations",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument(
        '-c', '--config',
        help='Configuration file path',
        default='config.json'
    )

    parser.add_argument(
        '--no-color',
        action='store_true',
        help='Disable colored output'
    )

    args = parser.parse_args()

    if args.no_color:
        Colors.disable()

    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('nava-ops.log'),
            logging.StreamHandler()
        ]
    )

    cli = NavaOpsCLI(config_path=args.config)
    cli.run()


if __name__ == "__main__":
    main()
