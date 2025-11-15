"""
Enhanced Export Formats for Nava Ops

Provides multiple export formats for reports:
- CSV (for data analysis in Excel/Pandas)
- XML (for enterprise system integration)
- Prometheus Metrics (for monitoring)
- Grafana JSON (for dashboard integration)
- Enhanced Markdown with Mermaid diagrams
"""

import csv
import json
import xml.etree.ElementTree as ET
from typing import Dict, List, Any
from datetime import datetime
from io import StringIO


class EnhancedExportFormats:
    """
    Enhanced export format generators for Nava Ops reports
    """

    @staticmethod
    def export_csv(report: Dict, filename: str = None) -> str:
        """
        Export report as CSV for data analysis

        Creates multiple CSV sections:
        1. Summary statistics
        2. Branch operations
        3. Error log
        """
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"nava_ops_report_{timestamp}.csv"

        output = StringIO()
        writer = csv.writer(output)

        # Summary section
        writer.writerow(["=== NAVA OPS REPORT SUMMARY ==="])
        writer.writerow(["Metric", "Value"])
        summary = report.get('summary', {})
        writer.writerow(["Total Operations", summary.get('total_operations', 0)])
        writer.writerow(["Successful Operations", summary.get('successful_operations', 0)])
        writer.writerow(["Failed Operations", summary.get('failed_operations', 0)])
        writer.writerow(["Success Rate", f"{summary.get('success_rate', 0):.2f}%"])
        writer.writerow(["Total Branches", summary.get('total_branches', 0)])
        writer.writerow(["Total Repositories", summary.get('total_repositories', 0)])
        writer.writerow(["Start Time", summary.get('start_time', '')])
        writer.writerow(["End Time", summary.get('end_time', '')])
        writer.writerow(["Duration", f"{summary.get('duration_seconds', 0):.2f}s"])
        writer.writerow([])

        # Branch operations section
        writer.writerow(["=== BRANCH OPERATIONS ==="])
        writer.writerow([
            "Repository", "Branch", "Operation", "Success", "Message", "Timestamp", "Error"
        ])

        for branch_report in report.get('branch_reports', []):
            repo = branch_report.get('repository', 'unknown')
            branch = branch_report.get('branch_name', 'unknown')

            for operation in branch_report.get('operations', []):
                writer.writerow([
                    repo,
                    branch,
                    operation.get('operation', 'unknown'),
                    "Yes" if operation.get('success', False) else "No",
                    operation.get('message', ''),
                    operation.get('timestamp', ''),
                    operation.get('error', '')
                ])

        writer.writerow([])

        # Errors section
        if report.get('errors'):
            writer.writerow(["=== ERRORS ==="])
            writer.writerow(["Error Message"])
            for error in report.get('errors', []):
                writer.writerow([error])

        # Write to file
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            f.write(output.getvalue())

        return filename

    @staticmethod
    def export_xml(report: Dict, filename: str = None) -> str:
        """
        Export report as XML for enterprise system integration
        """
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"nava_ops_report_{timestamp}.xml"

        # Create root element
        root = ET.Element("NavaOpsReport")
        root.set("version", "2.0")
        root.set("generated", datetime.now().isoformat())

        # Summary section
        summary = report.get('summary', {})
        summary_elem = ET.SubElement(root, "Summary")

        for key, value in summary.items():
            elem = ET.SubElement(summary_elem, key)
            elem.text = str(value)

        # Branch reports section
        branch_reports_elem = ET.SubElement(root, "BranchReports")

        for branch_report in report.get('branch_reports', []):
            branch_elem = ET.SubElement(branch_reports_elem, "Branch")
            branch_elem.set("name", branch_report.get('branch_name', 'unknown'))
            branch_elem.set("repository", branch_report.get('repository', 'unknown'))
            branch_elem.set("success", str(branch_report.get('success', False)))

            # Status
            status = branch_report.get('status', {})
            if status:
                status_elem = ET.SubElement(branch_elem, "Status")
                for key, value in status.items():
                    if isinstance(value, dict):
                        sub_elem = ET.SubElement(status_elem, key)
                        for sub_key, sub_value in value.items():
                            sub_sub_elem = ET.SubElement(sub_elem, sub_key)
                            sub_sub_elem.text = str(sub_value)
                    else:
                        elem = ET.SubElement(status_elem, key)
                        elem.text = str(value)

            # Operations
            operations_elem = ET.SubElement(branch_elem, "Operations")
            for operation in branch_report.get('operations', []):
                op_elem = ET.SubElement(operations_elem, "Operation")
                op_elem.set("type", operation.get('operation', 'unknown'))
                op_elem.set("success", str(operation.get('success', False)))
                op_elem.set("timestamp", operation.get('timestamp', ''))

                message_elem = ET.SubElement(op_elem, "Message")
                message_elem.text = operation.get('message', '')

                if operation.get('error'):
                    error_elem = ET.SubElement(op_elem, "Error")
                    error_elem.text = operation.get('error', '')

        # Errors section
        if report.get('errors'):
            errors_elem = ET.SubElement(root, "Errors")
            for error in report.get('errors', []):
                error_elem = ET.SubElement(errors_elem, "Error")
                error_elem.text = error

        # Write to file with pretty formatting
        tree = ET.ElementTree(root)
        ET.indent(tree, space="  ")
        tree.write(filename, encoding='utf-8', xml_declaration=True)

        return filename

    @staticmethod
    def export_prometheus_metrics(report: Dict, filename: str = None) -> str:
        """
        Export report as Prometheus metrics format

        Generates time-series metrics compatible with Prometheus scraping
        """
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"nava_ops_metrics_{timestamp}.prom"

        lines = []
        summary = report.get('summary', {})

        # Timestamp for all metrics (current time in milliseconds)
        timestamp_ms = int(datetime.now().timestamp() * 1000)

        # Total operations metric
        lines.append("# HELP nava_ops_total_operations Total number of Git operations executed")
        lines.append("# TYPE nava_ops_total_operations counter")
        lines.append(f"nava_ops_total_operations {summary.get('total_operations', 0)} {timestamp_ms}")
        lines.append("")

        # Successful operations metric
        lines.append("# HELP nava_ops_successful_operations Number of successful Git operations")
        lines.append("# TYPE nava_ops_successful_operations counter")
        lines.append(f"nava_ops_successful_operations {summary.get('successful_operations', 0)} {timestamp_ms}")
        lines.append("")

        # Failed operations metric
        lines.append("# HELP nava_ops_failed_operations Number of failed Git operations")
        lines.append("# TYPE nava_ops_failed_operations counter")
        lines.append(f"nava_ops_failed_operations {summary.get('failed_operations', 0)} {timestamp_ms}")
        lines.append("")

        # Success rate gauge
        lines.append("# HELP nava_ops_success_rate Success rate of Git operations (0-100)")
        lines.append("# TYPE nava_ops_success_rate gauge")
        lines.append(f"nava_ops_success_rate {summary.get('success_rate', 0):.2f} {timestamp_ms}")
        lines.append("")

        # Duration metric
        lines.append("# HELP nava_ops_duration_seconds Duration of operation in seconds")
        lines.append("# TYPE nava_ops_duration_seconds gauge")
        lines.append(f"nava_ops_duration_seconds {summary.get('duration_seconds', 0):.2f} {timestamp_ms}")
        lines.append("")

        # Per-repository metrics
        lines.append("# HELP nava_ops_repository_branches Number of branches per repository")
        lines.append("# TYPE nava_ops_repository_branches gauge")

        repos = {}
        for branch_report in report.get('branch_reports', []):
            repo = branch_report.get('repository', 'unknown')
            repos[repo] = repos.get(repo, 0) + 1

        for repo, count in repos.items():
            lines.append(f'nava_ops_repository_branches{{repository="{repo}"}} {count} {timestamp_ms}')
        lines.append("")

        # Per-operation type success metrics
        lines.append("# HELP nava_ops_operation_success Success count by operation type")
        lines.append("# TYPE nava_ops_operation_success counter")

        operation_stats = {}
        for branch_report in report.get('branch_reports', []):
            for operation in branch_report.get('operations', []):
                op_type = operation.get('operation', 'unknown')
                success = operation.get('success', False)

                if op_type not in operation_stats:
                    operation_stats[op_type] = {'success': 0, 'failed': 0}

                if success:
                    operation_stats[op_type]['success'] += 1
                else:
                    operation_stats[op_type]['failed'] += 1

        for op_type, stats in operation_stats.items():
            lines.append(
                f'nava_ops_operation_success{{operation="{op_type}",result="success"}} '
                f'{stats["success"]} {timestamp_ms}'
            )
            lines.append(
                f'nava_ops_operation_success{{operation="{op_type}",result="failed"}} '
                f'{stats["failed"]} {timestamp_ms}'
            )
        lines.append("")

        # Write to file
        with open(filename, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))

        return filename

    @staticmethod
    def export_grafana_json(report: Dict, analytics: Dict = None, filename: str = None) -> str:
        """
        Export report as Grafana-compatible JSON dashboard

        Creates a ready-to-import Grafana dashboard
        """
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"nava_ops_grafana_{timestamp}.json"

        summary = report.get('summary', {})

        dashboard = {
            "dashboard": {
                "title": "Nava Ops - Git Operations Dashboard",
                "tags": ["nava-ops", "git", "devops"],
                "timezone": "browser",
                "schemaVersion": 16,
                "version": 0,
                "refresh": "30s",
                "panels": [
                    {
                        "id": 1,
                        "title": "Success Rate",
                        "type": "gauge",
                        "targets": [],
                        "gridPos": {"h": 8, "w": 6, "x": 0, "y": 0},
                        "options": {
                            "showThresholdLabels": False,
                            "showThresholdMarkers": True
                        },
                        "fieldConfig": {
                            "defaults": {
                                "unit": "percent",
                                "min": 0,
                                "max": 100,
                                "thresholds": {
                                    "mode": "absolute",
                                    "steps": [
                                        {"value": 0, "color": "red"},
                                        {"value": 70, "color": "yellow"},
                                        {"value": 90, "color": "green"}
                                    ]
                                }
                            }
                        },
                        "datasource": None
                    },
                    {
                        "id": 2,
                        "title": "Total Operations",
                        "type": "stat",
                        "targets": [],
                        "gridPos": {"h": 4, "w": 6, "x": 6, "y": 0},
                        "options": {
                            "graphMode": "none",
                            "colorMode": "value"
                        },
                        "datasource": None
                    },
                    {
                        "id": 3,
                        "title": "Operations by Type",
                        "type": "piechart",
                        "targets": [],
                        "gridPos": {"h": 8, "w": 6, "x": 12, "y": 0},
                        "datasource": None
                    },
                    {
                        "id": 4,
                        "title": "Branch Status Overview",
                        "type": "table",
                        "targets": [],
                        "gridPos": {"h": 8, "w": 6, "x": 18, "y": 0},
                        "datasource": None
                    }
                ],
                "time": {
                    "from": "now-6h",
                    "to": "now"
                },
                "timepicker": {
                    "refresh_intervals": ["5s", "10s", "30s", "1m", "5m"]
                }
            },
            "folderId": 0,
            "overwrite": False,
            "inputs": [],
            "meta": {
                "type": "db",
                "canSave": True,
                "canEdit": True,
                "canAdmin": True,
                "canStar": True,
                "slug": "nava-ops-dashboard",
                "expires": "0001-01-01T00:00:00Z",
                "created": datetime.now().isoformat(),
                "updated": datetime.now().isoformat()
            }
        }

        # Add data for panels
        dashboard["dashboard"]["annotations"] = {
            "list": [{
                "name": "Nava Ops Events",
                "datasource": "-- Grafana --",
                "enable": True,
                "hide": False,
                "iconColor": "rgba(0, 211, 255, 1)",
                "type": "dashboard"
            }]
        }

        # Write to file
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(dashboard, f, indent=2)

        return filename

    @staticmethod
    def export_enhanced_markdown(report: Dict, analytics: Dict = None, filename: str = None) -> str:
        """
        Export enhanced markdown with Mermaid diagrams and rich formatting
        """
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"nava_ops_report_{timestamp}.md"

        lines = []
        summary = report.get('summary', {})

        # Header with emoji
        lines.append("# 📊 Nava Ops - Git Operations Report")
        lines.append("")
        lines.append(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        lines.append("")

        # Executive Summary with badges
        lines.append("## 🎯 Executive Summary")
        lines.append("")

        success_rate = summary.get('success_rate', 0)
        if success_rate >= 90:
            badge = "🟢 Excellent"
        elif success_rate >= 70:
            badge = "🟡 Good"
        else:
            badge = "🔴 Needs Attention"

        lines.append(f"**Overall Status:** {badge} ({success_rate:.1f}% success rate)")
        lines.append("")

        # Key metrics table
        lines.append("| Metric | Value |")
        lines.append("|--------|-------|")
        lines.append(f"| Total Operations | {summary.get('total_operations', 0)} |")
        lines.append(f"| Successful | ✅ {summary.get('successful_operations', 0)} |")
        lines.append(f"| Failed | ❌ {summary.get('failed_operations', 0)} |")
        lines.append(f"| Branches Processed | {summary.get('total_branches', 0)} |")
        lines.append(f"| Repositories | {summary.get('total_repositories', 0)} |")
        lines.append(f"| Duration | ⏱️  {summary.get('duration_seconds', 0):.2f}s |")
        lines.append("")

        # Mermaid diagram for operation flow
        lines.append("## 🔄 Operation Flow")
        lines.append("")
        lines.append("```mermaid")
        lines.append("graph LR")
        lines.append("    A[Start] --> B[Fetch Branches]")
        lines.append("    B --> C[Pull Updates]")
        lines.append("    C --> D[Process Operations]")
        lines.append("    D --> E{Success?}")
        lines.append("    E -->|Yes| F[✅ Complete]")
        lines.append("    E -->|No| G[❌ Error Handling]")
        lines.append("    G --> H[Retry Logic]")
        lines.append("    H --> D")
        lines.append("```")
        lines.append("")

        # Repository breakdown
        lines.append("## 📁 Repository Breakdown")
        lines.append("")

        repos = {}
        for branch_report in report.get('branch_reports', []):
            repo = branch_report.get('repository', 'unknown')
            if repo not in repos:
                repos[repo] = {
                    'branches': [],
                    'success': 0,
                    'failed': 0,
                    'operations': []
                }
            repos[repo]['branches'].append(branch_report.get('branch_name', 'unknown'))
            if branch_report.get('success', False):
                repos[repo]['success'] += 1
            else:
                repos[repo]['failed'] += 1
            repos[repo]['operations'].extend(branch_report.get('operations', []))

        for repo, data in repos.items():
            lines.append(f"### 📦 {repo}")
            lines.append("")
            lines.append(f"- **Branches:** {len(data['branches'])}")
            lines.append(f"- **Successful:** ✅ {data['success']}")
            lines.append(f"- **Failed:** ❌ {data['failed']}")
            lines.append("")

            # Branch status table
            lines.append("| Branch | Status | Operations |")
            lines.append("|--------|--------|------------|")

            for branch_name in data['branches']:
                branch_data = next(
                    (b for b in report.get('branch_reports', [])
                     if b.get('branch_name') == branch_name and b.get('repository') == repo),
                    None
                )
                if branch_data:
                    status = "✅ Success" if branch_data.get('success', False) else "❌ Failed"
                    op_count = len(branch_data.get('operations', []))
                    lines.append(f"| `{branch_name}` | {status} | {op_count} |")

            lines.append("")

        # Analytics section (if provided)
        if analytics:
            lines.append("## 📈 Advanced Analytics")
            lines.append("")

            if 'branch_health' in analytics:
                lines.append("### 🏥 Branch Health Scores")
                lines.append("")
                lines.append("| Branch | Health Score | Risk | Recommendation |")
                lines.append("|--------|--------------|------|----------------|")

                for health in analytics['branch_health'][:10]:  # Top 10
                    score = health.get('health_score', 0)
                    risk = health.get('conflict_risk', 'unknown')
                    rec = health.get('merge_recommendation', 'review')

                    # Health icon
                    if score >= 80:
                        health_icon = "🟢"
                    elif score >= 60:
                        health_icon = "🟡"
                    else:
                        health_icon = "🔴"

                    lines.append(
                        f"| `{health.get('branch_name', 'unknown')}` | "
                        f"{health_icon} {score:.1f} | {risk} | {rec} |"
                    )

                lines.append("")

            if 'key_insights' in analytics:
                lines.append("### 💡 Key Insights")
                lines.append("")
                for insight in analytics['key_insights']:
                    lines.append(f"- {insight}")
                lines.append("")

            if 'action_items' in analytics:
                lines.append("### ✅ Action Items")
                lines.append("")
                for i, action in enumerate(analytics['action_items'], 1):
                    lines.append(f"{i}. {action}")
                lines.append("")

        # Error section
        if report.get('errors'):
            lines.append("## ⚠️ Errors & Issues")
            lines.append("")
            for error in report.get('errors', []):
                lines.append(f"- ❌ {error}")
            lines.append("")

        # Footer
        lines.append("---")
        lines.append("")
        lines.append("*Generated by Nava Ops v2.0 - Next-Generation Git Orchestration*")
        lines.append("")

        # Write to file
        with open(filename, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))

        return filename
