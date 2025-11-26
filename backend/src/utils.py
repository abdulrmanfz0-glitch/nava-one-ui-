"""
Utilities Module

This module provides common utility functions used across the system.
It includes Git command execution, retry logic, and validation utilities.

Key responsibilities:
- Execute Git commands safely with error handling
- Implement retry logic with exponential backoff
- Provide validation and helper functions
- Handle subprocess execution and output parsing
"""

import subprocess
import time
import logging
from typing import Tuple, Optional, List
from dataclasses import dataclass


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class CommandResult:
    """Result of a command execution"""
    success: bool
    stdout: str
    stderr: str
    returncode: int


class GitCommandError(Exception):
    """Custom exception for Git command errors"""
    pass


def execute_command(
    command: List[str],
    cwd: Optional[str] = None,
    timeout: int = 30
) -> CommandResult:
    """
    Execute a shell command and return the result

    Args:
        command: Command to execute as a list of strings
        cwd: Working directory for the command
        timeout: Command timeout in seconds

    Returns:
        CommandResult with execution details
    """
    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=timeout
        )

        return CommandResult(
            success=result.returncode == 0,
            stdout=result.stdout.strip(),
            stderr=result.stderr.strip(),
            returncode=result.returncode
        )
    except subprocess.TimeoutExpired:
        logger.error(f"Command timed out: {' '.join(command)}")
        return CommandResult(
            success=False,
            stdout="",
            stderr=f"Command timed out after {timeout} seconds",
            returncode=-1
        )
    except Exception as e:
        logger.error(f"Error executing command: {e}")
        return CommandResult(
            success=False,
            stdout="",
            stderr=str(e),
            returncode=-1
        )


def execute_git_command(
    args: List[str],
    repo_path: str,
    timeout: int = 30
) -> CommandResult:
    """
    Execute a Git command in a repository

    Args:
        args: Git command arguments (without 'git')
        repo_path: Path to the Git repository
        timeout: Command timeout in seconds

    Returns:
        CommandResult with execution details

    Raises:
        GitCommandError: If the command fails
    """
    command = ["git"] + args
    logger.debug(f"Executing: {' '.join(command)} in {repo_path}")

    result = execute_command(command, cwd=repo_path, timeout=timeout)

    if not result.success:
        error_msg = f"Git command failed: {' '.join(command)}\nError: {result.stderr}"
        logger.error(error_msg)

    return result


def retry_with_backoff(
    func,
    max_attempts: int = 3,
    initial_delay: float = 2.0,
    exponential_base: float = 2.0,
    *args,
    **kwargs
) -> CommandResult:
    """
    Retry a function with exponential backoff

    This is particularly useful for network operations that might fail temporarily.

    Args:
        func: Function to retry
        max_attempts: Maximum number of retry attempts
        initial_delay: Initial delay in seconds
        exponential_base: Base for exponential backoff calculation
        *args: Arguments to pass to the function
        **kwargs: Keyword arguments to pass to the function

    Returns:
        Result from the function

    Raises:
        Exception: If all retry attempts fail
    """
    delay = initial_delay

    for attempt in range(1, max_attempts + 1):
        try:
            result = func(*args, **kwargs)

            # If it's a CommandResult and successful, return it
            if isinstance(result, CommandResult) and result.success:
                if attempt > 1:
                    logger.info(f"Operation succeeded on attempt {attempt}")
                return result

            # If it's a CommandResult but failed, retry
            if isinstance(result, CommandResult):
                if attempt < max_attempts:
                    logger.warning(
                        f"Attempt {attempt} failed, retrying in {delay:.1f}s... "
                        f"Error: {result.stderr}"
                    )
                    time.sleep(delay)
                    delay *= exponential_base
                    continue
                else:
                    logger.error(f"All {max_attempts} attempts failed")
                    return result

            # For other return types, just return
            return result

        except Exception as e:
            if attempt < max_attempts:
                logger.warning(f"Attempt {attempt} raised exception, retrying in {delay:.1f}s...")
                time.sleep(delay)
                delay *= exponential_base
            else:
                logger.error(f"All {max_attempts} attempts failed with exception")
                raise

    # Should not reach here, but just in case
    raise RuntimeError("Retry logic failed unexpectedly")


def validate_branch_name(branch_name: str) -> bool:
    """
    Validate a Git branch name

    Args:
        branch_name: Branch name to validate

    Returns:
        True if valid, False otherwise
    """
    if not branch_name:
        return False

    # Check for invalid characters
    invalid_chars = [' ', '~', '^', ':', '?', '*', '[', '\\', '..']
    for char in invalid_chars:
        if char in branch_name:
            return False

    # Cannot start or end with slash
    if branch_name.startswith('/') or branch_name.endswith('/'):
        return False

    # Cannot end with .lock
    if branch_name.endswith('.lock'):
        return False

    return True


def parse_git_log(log_output: str) -> List[dict]:
    """
    Parse git log output into structured data

    Args:
        log_output: Output from git log command

    Returns:
        List of commit dictionaries
    """
    commits = []
    if not log_output:
        return commits

    # Split by commit delimiter
    commit_blocks = log_output.split('\n\n')

    for block in commit_blocks:
        if not block.strip():
            continue

        lines = block.split('\n')
        if len(lines) < 3:
            continue

        commit = {
            'hash': lines[0].replace('commit ', '').strip(),
            'author': lines[1].replace('Author: ', '').strip(),
            'date': lines[2].replace('Date: ', '').strip(),
            'message': '\n'.join(lines[3:]).strip()
        }
        commits.append(commit)

    return commits


def format_duration(seconds: float) -> str:
    """
    Format duration in seconds to human-readable string

    Args:
        seconds: Duration in seconds

    Returns:
        Formatted string (e.g., "2m 30s")
    """
    if seconds < 60:
        return f"{seconds:.1f}s"

    minutes = int(seconds // 60)
    remaining_seconds = int(seconds % 60)

    if minutes < 60:
        return f"{minutes}m {remaining_seconds}s"

    hours = minutes // 60
    remaining_minutes = minutes % 60
    return f"{hours}h {remaining_minutes}m {remaining_seconds}s"


def is_git_repository(path: str) -> bool:
    """
    Check if a path is a Git repository

    Args:
        path: Path to check

    Returns:
        True if it's a Git repository, False otherwise
    """
    result = execute_command(["git", "rev-parse", "--git-dir"], cwd=path)
    return result.success
