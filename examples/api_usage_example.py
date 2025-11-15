#!/usr/bin/env python3
"""
Nava Ops API Usage Examples

This script demonstrates how to interact with the Nava Ops REST API
for Git orchestration operations.

Prerequisites:
- The API server must be running (python -m src.api or uvicorn src.api:app)
- Python 3.8+ with urllib and json (standard library)
"""

import json
import urllib.request
import urllib.error
from typing import Dict, Any, List


class NavaOpsAPIClient:
    """Simple API client for Nava Ops"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        """
        Initialize API client

        Args:
            base_url: Base URL of the API server
        """
        self.base_url = base_url.rstrip('/')

    def _request(self, method: str, endpoint: str, data: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Make an HTTP request to the API

        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint
            data: Request body data (for POST requests)

        Returns:
            Response data as dictionary
        """
        url = f"{self.base_url}{endpoint}"

        # Prepare request
        headers = {'Content-Type': 'application/json'}
        request_data = None

        if data:
            request_data = json.dumps(data).encode('utf-8')

        req = urllib.request.Request(
            url,
            data=request_data,
            headers=headers,
            method=method
        )

        try:
            with urllib.request.urlopen(req, timeout=30) as response:
                response_data = response.read().decode('utf-8')
                return json.loads(response_data)
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8')
            print(f"HTTP Error {e.code}: {error_body}")
            raise
        except urllib.error.URLError as e:
            print(f"URL Error: {e.reason}")
            raise

    def configure(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Configure the orchestrator"""
        return self._request('POST', '/api/config', config)

    def get_config(self) -> Dict[str, Any]:
        """Get current configuration"""
        return self._request('GET', '/api/config')

    def list_branches(self) -> List[Dict[str, Any]]:
        """List all branches"""
        return self._request('GET', '/api/branches')

    def execute_workflow(self, operations: List[str], repositories: List[str] = None, branches: List[str] = None) -> Dict[str, Any]:
        """Execute a workflow"""
        data = {
            'operations': operations,
            'repositories': repositories,
            'branches': branches
        }
        return self._request('POST', '/api/workflow', data)

    def sync_all(self) -> Dict[str, Any]:
        """Sync all branches (fetch + pull)"""
        return self._request('POST', '/api/workflow/sync')

    def merge_branches(self, repository_path: str, source_branch: str, target_branch: str, strategy: str = 'merge') -> Dict[str, Any]:
        """Merge branches"""
        data = {
            'repository_path': repository_path,
            'source_branch': source_branch,
            'target_branch': target_branch,
            'strategy': strategy
        }
        return self._request('POST', '/api/merge', data)

    def configure_notifications(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Configure notifications"""
        return self._request('POST', '/api/notifications/config', config)

    def health_check(self) -> Dict[str, Any]:
        """Check API health"""
        return self._request('GET', '/api/health')


# =============================================================================
# Example Usage
# =============================================================================

def example_1_health_check():
    """Example 1: Check API health"""
    print("\n" + "=" * 60)
    print("Example 1: API Health Check")
    print("=" * 60)

    client = NavaOpsAPIClient()

    health = client.health_check()
    print(f"\nAPI Status: {health['status']}")
    print(f"Orchestrator Configured: {health['orchestrator_configured']}")
    print(f"Notifications Configured: {health['notifications_configured']}")


def example_2_configure_orchestrator():
    """Example 2: Configure the orchestrator"""
    print("\n" + "=" * 60)
    print("Example 2: Configure Orchestrator")
    print("=" * 60)

    client = NavaOpsAPIClient()

    # Configuration
    config = {
        "repositories": [
            {
                "path": "/home/user/nava-ops",
                "name": "nava-ops",
                "branches": [
                    {
                        "name": "main",
                        "remote": "origin",
                        "auto_fetch": True,
                        "auto_pull": False,
                        "merge_strategy": "merge"
                    },
                    {
                        "name": "develop",
                        "remote": "origin",
                        "auto_fetch": True,
                        "auto_pull": False,
                        "merge_strategy": "merge"
                    }
                ]
            }
        ],
        "reporting": {
            "output_format": "html",
            "output_dir": "./reports",
            "include_commits": False,
            "max_commits": 10
        },
        "parallel_operations": True,
        "max_workers": 4,
        "retry_attempts": 3,
        "retry_delay": 2
    }

    result = client.configure(config)
    print(f"\nConfiguration Status: {result['status']}")
    print(f"Message: {result['message']}")
    print(f"Repositories: {result['repositories']}")
    print(f"Total Branches: {result['total_branches']}")


def example_3_list_branches():
    """Example 3: List all branches"""
    print("\n" + "=" * 60)
    print("Example 3: List All Branches")
    print("=" * 60)

    client = NavaOpsAPIClient()

    branches = client.list_branches()

    for repo_status in branches:
        print(f"\nRepository: {repo_status['repository']}")
        print(f"Current Branch: {repo_status['current_branch']}")
        print(f"Uncommitted Changes: {repo_status['has_uncommitted_changes']}")
        print(f"\nBranches ({len(repo_status['branches'])}):")

        for branch in repo_status['branches']:
            marker = "*" if branch['is_current'] else " "
            print(f"  {marker} {branch['name']}")
            if branch['last_commit']:
                print(f"    Last Commit: {branch['last_commit']}")
                print(f"    Author: {branch['last_commit_author']}")
                print(f"    Date: {branch['last_commit_date']}")


def example_4_fetch_all():
    """Example 4: Fetch all branches"""
    print("\n" + "=" * 60)
    print("Example 4: Fetch All Branches")
    print("=" * 60)

    client = NavaOpsAPIClient()

    result = client.execute_workflow(['fetch'])

    print(f"\nWorkflow Status: {result['status']}")
    print(f"\nSummary:")
    print(f"  Total Operations: {result['summary']['total_operations']}")
    print(f"  Successful: {result['summary']['successful_operations']}")
    print(f"  Failed: {result['summary']['failed_operations']}")
    print(f"  Success Rate: {result['summary']['success_rate']:.1f}%")
    print(f"  Duration: {result['summary']['duration_seconds']:.2f}s")

    print("\nOperations:")
    for op in result['operations']:
        status_icon = "✅" if op['status'] == "success" else "❌"
        print(f"  {status_icon} {op['repository']}/{op['branch']} - {op['operation']}: {op['message']}")


def example_5_sync_all():
    """Example 5: Sync all branches (fetch + pull)"""
    print("\n" + "=" * 60)
    print("Example 5: Sync All Branches")
    print("=" * 60)

    client = NavaOpsAPIClient()

    result = client.sync_all()

    print(f"\nSync Status: {result['status']}")
    print(f"\nSummary:")
    print(f"  Total Operations: {result['summary']['total_operations']}")
    print(f"  Successful: {result['summary']['successful_operations']}")
    print(f"  Failed: {result['summary']['failed_operations']}")
    print(f"  Success Rate: {result['summary']['success_rate']:.1f}%")
    print(f"  Duration: {result['summary']['duration_seconds']:.2f}s")


def example_6_configure_notifications():
    """Example 6: Configure notifications"""
    print("\n" + "=" * 60)
    print("Example 6: Configure Notifications")
    print("=" * 60)

    client = NavaOpsAPIClient()

    notification_config = {
        "console_enabled": True,
        "slack_enabled": False,
        "email_enabled": False,
        "slack_webhook_url": None,
        "email_smtp_host": None,
        "email_smtp_port": 587,
        "email_from": None,
        "email_to": []
    }

    result = client.configure_notifications(notification_config)

    print(f"\nConfiguration Status: {result['status']}")
    print(f"Message: {result['message']}")
    print(f"\nEnabled Channels:")
    for channel, enabled in result['enabled_channels'].items():
        status = "✅" if enabled else "❌"
        print(f"  {status} {channel.capitalize()}")


def example_7_merge_branches():
    """Example 7: Merge branches"""
    print("\n" + "=" * 60)
    print("Example 7: Merge Branches")
    print("=" * 60)
    print("\n⚠️  This example is commented out to prevent accidental merges")
    print("Uncomment the code below to test merge functionality")

    # Uncomment to test (adjust paths and branch names accordingly)
    # client = NavaOpsAPIClient()
    #
    # result = client.merge_branches(
    #     repository_path="/path/to/your/repo",
    #     source_branch="feature-branch",
    #     target_branch="develop",
    #     strategy="merge"
    # )
    #
    # print(f"\nMerge Status: {result['status']}")
    # print(f"Message: {result['message']}")


# =============================================================================
# Main Execution
# =============================================================================

def main():
    """Run all examples"""
    print("\n" + "=" * 60)
    print("NAVA OPS API USAGE EXAMPLES")
    print("=" * 60)
    print("\nThese examples demonstrate how to use the Nava Ops REST API")
    print("Make sure the API server is running before executing these examples")

    try:
        # Run examples
        example_1_health_check()
        example_2_configure_orchestrator()
        example_3_list_branches()
        example_4_fetch_all()
        # example_5_sync_all()  # Uncomment to test sync
        example_6_configure_notifications()
        example_7_merge_branches()

        print("\n" + "=" * 60)
        print("All examples completed successfully!")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nMake sure the API server is running:")
        print("  python -m uvicorn src.api:app --reload")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
