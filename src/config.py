"""
Configuration Module

This module handles all configuration management for the multi-branch operations system.
It provides centralized configuration with validation and defaults.

Key responsibilities:
- Load and validate configuration from various sources (files, environment, defaults)
- Provide configuration access throughout the application
- Support for multiple repository configurations
- Cross-platform path handling
- Environment variable substitution
"""

import os
import sys
import json
import codecs
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict
from pathlib import Path


# ============================================================================
# Utility Functions
# ============================================================================

def normalize_path(path_str: str) -> str:
    """
    Normalize path for cross-platform compatibility

    Args:
        path_str: Path string to normalize

    Returns:
        Normalized path string
    """
    if not path_str:
        return path_str

    # Handle environment variable expansion
    path_str = os.path.expandvars(path_str)

    # Handle home directory expansion
    path_str = os.path.expanduser(path_str)

    # Convert to absolute path if relative
    path = Path(path_str)
    if not path.is_absolute():
        path = Path.cwd() / path

    # Normalize path separators and resolve .. and .
    return str(path.resolve())


def substitute_env_vars(value: Any) -> Any:
    """
    Recursively substitute environment variables in configuration values

    Supports ${VAR_NAME} and $VAR_NAME syntax

    Args:
        value: Configuration value (can be str, dict, list, etc.)

    Returns:
        Value with environment variables substituted
    """
    if isinstance(value, str):
        return os.path.expandvars(value)
    elif isinstance(value, dict):
        return {k: substitute_env_vars(v) for k, v in value.items()}
    elif isinstance(value, list):
        return [substitute_env_vars(item) for item in value]
    else:
        return value


def detect_bom(file_path: str) -> str:
    """
    Detect BOM (Byte Order Mark) in file

    Args:
        file_path: Path to the file

    Returns:
        Encoding name (utf-8, utf-8-sig, utf-16, utf-32)
    """
    with open(file_path, 'rb') as f:
        raw = f.read(4)

    # Check for BOM
    if raw.startswith(codecs.BOM_UTF32_LE) or raw.startswith(codecs.BOM_UTF32_BE):
        return 'utf-32'
    elif raw.startswith(codecs.BOM_UTF16_LE) or raw.startswith(codecs.BOM_UTF16_BE):
        return 'utf-16'
    elif raw.startswith(codecs.BOM_UTF8):
        return 'utf-8-sig'
    else:
        return 'utf-8'


# ============================================================================
# Configuration Dataclasses
# ============================================================================

@dataclass
class BranchConfig:
    """Configuration for a single branch"""
    name: str
    remote: str = "origin"
    auto_fetch: bool = True
    merge_strategy: str = "merge"  # merge, rebase, or squash
    is_default: bool = False  # whether this is the default branch


@dataclass
class RepositoryConfig:
    """Configuration for a single repository"""
    path: str
    name: str
    branches: List[BranchConfig] = field(default_factory=list)
    default_remote: str = "origin"


@dataclass
class ReportingConfig:
    """Configuration for reporting"""
    output_format: str = "json"  # json, markdown, html
    output_dir: str = "./reports"
    include_commits: bool = True
    include_diff_stats: bool = True
    max_commits: int = 50


@dataclass
class Config:
    """
    Main configuration class for the entire system

    This centralizes all configuration needs and provides a single source of truth.
    """
    repositories: List[RepositoryConfig] = field(default_factory=list)
    reporting: ReportingConfig = field(default_factory=ReportingConfig)
    parallel_operations: bool = True
    max_workers: int = 4
    retry_attempts: int = 3
    retry_delay: float = 2.0

    @classmethod
    def from_file(cls, config_path: str, substitute_vars: bool = True) -> 'Config':
        """
        Load configuration from a JSON file with cross-platform support

        Args:
            config_path: Path to the configuration file
            substitute_vars: Whether to substitute environment variables

        Returns:
            Config instance

        Raises:
            FileNotFoundError: If config file doesn't exist
            ValueError: If config file is empty or contains invalid JSON
        """
        # Normalize path for cross-platform compatibility
        config_path = normalize_path(config_path)

        if not os.path.exists(config_path):
            raise FileNotFoundError(
                f"Configuration file not found: {config_path}\n"
                f"Searched in: {os.path.abspath(config_path)}\n"
                f"Current directory: {os.getcwd()}\n"
                f"To create a sample config:\n"
                f"  python -m src.init_config"
            )

        # Check if file is empty
        if os.path.getsize(config_path) == 0:
            raise ValueError(
                f"Configuration file is empty: {config_path}\n"
                f"The file exists but contains no data. This may happen if:\n"
                f"  1. The file wasn't properly pulled from git\n"
                f"  2. The file got corrupted\n"
                f"To fix this:\n"
                f"  - Try: git checkout HEAD -- {config_path}\n"
                f"  - Or pull the latest changes: git pull\n"
                f"  - Or create a sample config:\n"
                f"    python -m src.init_config"
            )

        try:
            # Detect and handle BOM for cross-platform compatibility
            encoding = detect_bom(config_path)

            with open(config_path, 'r', encoding=encoding) as f:
                content = f.read().strip()
                if not content:
                    raise ValueError(f"Configuration file is empty: {config_path}")

                # Substitute environment variables if requested
                if substitute_vars:
                    # This allows using ${VAR} or $VAR in config files
                    import re
                    def replace_env(match):
                        var_name = match.group(1) or match.group(2)
                        return os.getenv(var_name, match.group(0))

                    content = re.sub(r'\$\{(\w+)\}|\$(\w+)', replace_env, content)

                data = json.loads(content)

        except json.JSONDecodeError as e:
            # Provide helpful error message with line and column info
            raise ValueError(
                f"Invalid JSON in configuration file: {config_path}\n"
                f"Error at line {e.lineno}, column {e.colno}: {e.msg}\n"
                f"JSON parsing failed. Please check:\n"
                f"  1. All brackets {{}} and [] are properly closed\n"
                f"  2. Strings are in double quotes\n"
                f"  3. No trailing commas\n"
                f"  4. File encoding is UTF-8\n"
                f"To restore from git:\n"
                f"  git checkout HEAD -- {config_path}"
            ) from e
        except Exception as e:
            raise ValueError(
                f"Error loading configuration file: {config_path}\n"
                f"Error: {str(e)}\n"
                f"File encoding: {encoding}\n"
                f"Platform: {sys.platform}"
            ) from e

        # Substitute environment variables in the data structure
        if substitute_vars:
            data = substitute_env_vars(data)

        return cls.from_dict(data)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Config':
        """
        Create Config from dictionary

        Args:
            data: Dictionary with configuration data

        Returns:
            Config instance
        """
        # Define valid fields for BranchConfig to filter out unknown fields
        valid_branch_fields = {'name', 'remote', 'auto_fetch', 'merge_strategy', 'is_default'}

        # Parse repositories
        repos = []
        for repo_data in data.get('repositories', []):
            branches = []
            for branch_data in repo_data.get('branches', []):
                # Filter out unknown fields from branch config
                filtered_branch_data = {
                    k: v for k, v in branch_data.items()
                    if k in valid_branch_fields
                }
                branches.append(BranchConfig(**filtered_branch_data))

            repos.append(RepositoryConfig(
                path=repo_data['path'],
                name=repo_data['name'],
                branches=branches,
                default_remote=repo_data.get('default_remote', 'origin')
            ))

        # Parse reporting config
        valid_reporting_fields = {'output_format', 'output_dir', 'include_commits', 'include_diff_stats', 'max_commits'}
        reporting_data = data.get('reporting', {})
        if reporting_data:
            # Filter out unknown fields from reporting config
            filtered_reporting_data = {
                k: v for k, v in reporting_data.items()
                if k in valid_reporting_fields
            }
            reporting = ReportingConfig(**filtered_reporting_data)
        else:
            reporting = ReportingConfig()

        return cls(
            repositories=repos,
            reporting=reporting,
            parallel_operations=data.get('parallel_operations', True),
            max_workers=data.get('max_workers', 4),
            retry_attempts=data.get('retry_attempts', 3),
            retry_delay=data.get('retry_delay', 2.0)
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary"""
        return asdict(self)

    def to_file(self, config_path: str) -> None:
        """
        Save configuration to a JSON file

        Args:
            config_path: Path where to save the configuration
        """
        with open(config_path, 'w') as f:
            json.dump(self.to_dict(), f, indent=2)

    def validate(self) -> List[str]:
        """
        Validate configuration

        Returns:
            List of validation errors (empty if valid)
        """
        errors = []

        if not self.repositories:
            errors.append("At least one repository must be configured")

        for repo in self.repositories:
            if not os.path.exists(repo.path):
                errors.append(f"Repository path does not exist: {repo.path}")

        if self.max_workers < 1:
            errors.append("max_workers must be at least 1")

        if self.retry_attempts < 0:
            errors.append("retry_attempts cannot be negative")

        return errors

    @classmethod
    def create_sample_config(cls, output_path: str) -> 'Config':
        """
        Create a sample configuration file

        Args:
            output_path: Path where to save the sample configuration

        Returns:
            The created Config instance
        """
        sample_config = cls(
            repositories=[
                RepositoryConfig(
                    path="/path/to/your/repository",
                    name="my-project",
                    default_remote="origin",
                    branches=[
                        BranchConfig(name="main", remote="origin", auto_fetch=True, merge_strategy="merge"),
                        BranchConfig(name="develop", remote="origin", auto_fetch=True, merge_strategy="merge"),
                        BranchConfig(name="staging", remote="origin", auto_fetch=True, merge_strategy="rebase"),
                    ]
                ),
                RepositoryConfig(
                    path="/path/to/another/repository",
                    name="another-project",
                    default_remote="origin",
                    branches=[
                        BranchConfig(name="main", remote="origin", auto_fetch=True, merge_strategy="merge"),
                    ]
                )
            ],
            reporting=ReportingConfig(
                output_format="html",
                output_dir="./reports",
                include_commits=True,
                include_diff_stats=True,
                max_commits=50
            ),
            parallel_operations=True,
            max_workers=4,
            retry_attempts=3,
            retry_delay=2.0
        )

        sample_config.to_file(output_path)
        return sample_config


def create_default_config(repo_path: str = ".") -> Config:
    """
    Create a default configuration

    Args:
        repo_path: Path to the repository

    Returns:
        Default Config instance
    """
    return Config(
        repositories=[
            RepositoryConfig(
                path=repo_path,
                name=os.path.basename(os.path.abspath(repo_path)),
                branches=[
                    BranchConfig(name="main"),
                    BranchConfig(name="develop"),
                ]
            )
        ]
    )
