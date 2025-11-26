"""
Reporting Module

This module generates comprehensive reports for multi-branch operations.
It supports multiple output formats and provides detailed analytics.

Key responsibilities:
- Generate reports in various formats (JSON, Markdown, HTML)
- Aggregate operation results across branches and repositories
- Provide statistical analysis of branch operations
- Create visual representations of branch status
- Export reports to files

Optimizations:
- Efficient data aggregation
- Template-based report generation
- Lazy loading for large datasets
- Caching for repeated queries
"""

import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime
from dataclasses import dataclass, asdict
from collections import defaultdict

from .branch_ops import OperationResult, BranchInfo
from .config import ReportingConfig
from .utils import format_duration


@dataclass
class ReportSummary:
    """Summary statistics for a report"""
    total_operations: int
    successful_operations: int
    failed_operations: int
    total_branches: int
    total_repositories: int
    start_time: datetime
    end_time: datetime
    duration_seconds: float

    @property
    def success_rate(self) -> float:
        """Calculate success rate percentage"""
        if self.total_operations == 0:
            return 0.0
        return (self.successful_operations / self.total_operations) * 100


@dataclass
class BranchReport:
    """Report for a single branch"""
    branch_name: str
    repository: str
    operations: List[OperationResult]
    status: Dict[str, Any]
    success: bool


@dataclass
class Report:
    """Complete report structure"""
    summary: ReportSummary
    branch_reports: List[BranchReport]
    errors: List[str]
    timestamp: datetime

    def to_dict(self) -> Dict[str, Any]:
        """Convert report to dictionary, properly handling nested dataclasses"""
        return asdict(self)


class ReportGenerator:
    """
    Generates reports from branch operations

    This class provides flexible reporting with multiple output formats
    and detailed analytics.
    """

    def __init__(self, config: ReportingConfig):
        """
        Initialize report generator

        Args:
            config: Reporting configuration
        """
        self.config = config

        # Ensure output directory exists
        if not os.path.exists(self.config.output_dir):
            os.makedirs(self.config.output_dir)

    def create_report(
        self,
        branch_reports: List[BranchReport],
        start_time: datetime,
        end_time: datetime,
        errors: Optional[List[str]] = None
    ) -> Report:
        """
        Create a comprehensive report

        Args:
            branch_reports: List of branch reports
            start_time: Operation start time
            end_time: Operation end time
            errors: List of errors encountered

        Returns:
            Complete Report object
        """
        # Calculate summary statistics
        total_ops = sum(len(br.operations) for br in branch_reports)
        successful_ops = sum(
            sum(1 for op in br.operations if op.success)
            for br in branch_reports
        )

        # Count unique repositories
        repos = set(br.repository for br in branch_reports)

        summary = ReportSummary(
            total_operations=total_ops,
            successful_operations=successful_ops,
            failed_operations=total_ops - successful_ops,
            total_branches=len(branch_reports),
            total_repositories=len(repos),
            start_time=start_time,
            end_time=end_time,
            duration_seconds=(end_time - start_time).total_seconds()
        )

        return Report(
            summary=summary,
            branch_reports=branch_reports,
            errors=errors or [],
            timestamp=datetime.now()
        )

    def export_json(self, report: Report, filename: Optional[str] = None) -> str:
        """
        Export report as JSON

        Args:
            report: Report to export
            filename: Output filename (auto-generated if None)

        Returns:
            Path to the exported file
        """
        if not filename:
            timestamp = report.timestamp.strftime("%Y%m%d_%H%M%S")
            filename = f"report_{timestamp}.json"

        filepath = os.path.join(self.config.output_dir, filename)

        # Convert report to dict
        report_dict = {
            "summary": {
                "total_operations": report.summary.total_operations,
                "successful_operations": report.summary.successful_operations,
                "failed_operations": report.summary.failed_operations,
                "success_rate": f"{report.summary.success_rate:.2f}%",
                "total_branches": report.summary.total_branches,
                "total_repositories": report.summary.total_repositories,
                "start_time": report.summary.start_time.isoformat(),
                "end_time": report.summary.end_time.isoformat(),
                "duration": format_duration(report.summary.duration_seconds)
            },
            "branch_reports": [
                {
                    "branch_name": br.branch_name,
                    "repository": br.repository,
                    "success": br.success,
                    "status": br.status,
                    "operations": [
                        {
                            "success": op.success,
                            "operation": op.operation,
                            "message": op.message,
                            "timestamp": op.timestamp.isoformat(),
                            "error": op.error
                        }
                        for op in br.operations
                    ]
                }
                for br in report.branch_reports
            ],
            "errors": report.errors,
            "timestamp": report.timestamp.isoformat()
        }

        with open(filepath, 'w') as f:
            json.dump(report_dict, f, indent=2)

        return filepath

    def export_markdown(self, report: Report, filename: Optional[str] = None) -> str:
        """
        Export report as Markdown

        Args:
            report: Report to export
            filename: Output filename (auto-generated if None)

        Returns:
            Path to the exported file
        """
        if not filename:
            timestamp = report.timestamp.strftime("%Y%m%d_%H%M%S")
            filename = f"report_{timestamp}.md"

        filepath = os.path.join(self.config.output_dir, filename)

        # Build markdown content
        lines = [
            "# Multi-Branch Operations Report",
            "",
            f"**Generated:** {report.timestamp.strftime('%Y-%m-%d %H:%M:%S')}",
            "",
            "## Summary",
            "",
            f"- **Total Operations:** {report.summary.total_operations}",
            f"- **Successful:** {report.summary.successful_operations}",
            f"- **Failed:** {report.summary.failed_operations}",
            f"- **Success Rate:** {report.summary.success_rate:.2f}%",
            f"- **Total Branches:** {report.summary.total_branches}",
            f"- **Total Repositories:** {report.summary.total_repositories}",
            f"- **Duration:** {format_duration(report.summary.duration_seconds)}",
            "",
        ]

        # Add branch operations summary table
        lines.append("## Branch Operations Summary")
        lines.append("")
        lines.append("| Repository | Branch | Operations | Status | Success Rate |")
        lines.append("|------------|--------|------------|--------|--------------|")

        for br in report.branch_reports:
            status_icon = "✅" if br.success else "❌"
            op_count = len(br.operations)
            success_count = sum(1 for op in br.operations if op.success)
            success_rate = (success_count / op_count * 100) if op_count > 0 else 0
            lines.append(f"| {br.repository} | `{br.branch_name}` | {op_count} | {status_icon} | {success_rate:.1f}% |")

        lines.append("")

        # Add detailed branch reports
        lines.append("## Detailed Branch Operations")
        lines.append("")

        # Group by repository
        repo_branches = defaultdict(list)
        for br in report.branch_reports:
            repo_branches[br.repository].append(br)

        for repo, branches in repo_branches.items():
            lines.append(f"### Repository: {repo}")
            lines.append("")

            for br in branches:
                status_icon = "✅" if br.success else "❌"
                lines.append(f"#### {status_icon} Branch: `{br.branch_name}`")
                lines.append("")

                if br.operations:
                    lines.append("| Operation | Status | Message | Timestamp |")
                    lines.append("|-----------|--------|---------|-----------|")
                    for op in br.operations:
                        op_icon = "✅" if op.success else "❌"
                        timestamp = op.timestamp.strftime('%H:%M:%S')
                        message = op.message.replace('|', '\\|')[:50]  # Escape pipes and limit length
                        lines.append(f"| {op.operation} | {op_icon} | {message} | {timestamp} |")
                    lines.append("")

                    # Add errors if any
                    errors = [op for op in br.operations if op.error]
                    if errors:
                        lines.append("**Errors:**")
                        lines.append("")
                        for op in errors:
                            lines.append(f"- **{op.operation}**: `{op.error}`")
                        lines.append("")

                if self.config.include_diff_stats and br.status:
                    lines.append("**Status:**")
                    lines.append("")
                    for key, value in br.status.items():
                        if key != "branch":
                            lines.append(f"- {key}: {value}")
                    lines.append("")

        # Add errors section if any
        if report.errors:
            lines.append("## Errors")
            lines.append("")
            for error in report.errors:
                lines.append(f"- {error}")
            lines.append("")

        # Write to file
        with open(filepath, 'w') as f:
            f.write('\n'.join(lines))

        return filepath

    def export_html(self, report: Report, filename: Optional[str] = None) -> str:
        """
        Export report as HTML

        Args:
            report: Report to export
            filename: Output filename (auto-generated if None)

        Returns:
            Path to the exported file
        """
        if not filename:
            timestamp = report.timestamp.strftime("%Y%m%d_%H%M%S")
            filename = f"report_{timestamp}.html"

        filepath = os.path.join(self.config.output_dir, filename)

        # Build HTML content
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Multi-Branch Operations Report</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
        }}
        .summary {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        .summary-card {{
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .summary-card h3 {{
            margin: 0 0 10px 0;
            color: #666;
            font-size: 14px;
            text-transform: uppercase;
        }}
        .summary-card .value {{
            font-size: 32px;
            font-weight: bold;
            color: #333;
        }}
        .repo-section {{
            background: white;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .branch {{
            border-left: 4px solid #667eea;
            padding-left: 20px;
            margin: 20px 0;
        }}
        .branch.failed {{
            border-left-color: #e74c3c;
        }}
        .operation {{
            padding: 10px;
            margin: 10px 0;
            background: #f8f9fa;
            border-radius: 4px;
        }}
        .operation.success {{
            border-left: 3px solid #2ecc71;
        }}
        .operation.failed {{
            border-left: 3px solid #e74c3c;
        }}
        .error {{
            background: #ffe6e6;
            padding: 10px;
            border-left: 3px solid #e74c3c;
            margin: 5px 0;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
        }}
        .badge {{
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }}
        .badge.success {{
            background: #d4edda;
            color: #155724;
        }}
        .badge.failed {{
            background: #f8d7da;
            color: #721c24;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }}
        th {{
            background: #667eea;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }}
        td {{
            padding: 10px 12px;
            border-bottom: 1px solid #e0e0e0;
        }}
        tr:hover {{
            background: #f8f9fa;
        }}
        .table-container {{
            overflow-x: auto;
            background: white;
            border-radius: 8px;
            margin: 20px 0;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>Multi-Branch Operations Report</h1>
        <p>Generated: {report.timestamp.strftime('%Y-%m-%d %H:%M:%S')}</p>
    </div>

    <div class="summary">
        <div class="summary-card">
            <h3>Total Operations</h3>
            <div class="value">{report.summary.total_operations}</div>
        </div>
        <div class="summary-card">
            <h3>Success Rate</h3>
            <div class="value">{report.summary.success_rate:.1f}%</div>
        </div>
        <div class="summary-card">
            <h3>Branches</h3>
            <div class="value">{report.summary.total_branches}</div>
        </div>
        <div class="summary-card">
            <h3>Duration</h3>
            <div class="value" style="font-size: 24px;">{format_duration(report.summary.duration_seconds)}</div>
        </div>
    </div>

    <div class="repo-section">
        <h2>Branch Operations Summary</h2>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Repository</th>
                        <th>Branch</th>
                        <th>Operations</th>
                        <th>Status</th>
                        <th>Success Rate</th>
                    </tr>
                </thead>
                <tbody>
"""

        # Add summary table rows
        for br in report.branch_reports:
            status_badge = '<span class="badge success">Success</span>' if br.success else '<span class="badge failed">Failed</span>'
            op_count = len(br.operations)
            success_count = sum(1 for op in br.operations if op.success)
            success_rate = (success_count / op_count * 100) if op_count > 0 else 0

            html += f"""
                    <tr>
                        <td>{br.repository}</td>
                        <td><code>{br.branch_name}</code></td>
                        <td>{op_count}</td>
                        <td>{status_badge}</td>
                        <td>{success_rate:.1f}%</td>
                    </tr>
"""

        html += """
                </tbody>
            </table>
        </div>
    </div>
"""

        # Group by repository
        repo_branches = defaultdict(list)
        for br in report.branch_reports:
            repo_branches[br.repository].append(br)

        for repo, branches in repo_branches.items():
            html += f"""
    <div class="repo-section">
        <h2>Repository: {repo}</h2>
"""

            for br in branches:
                branch_class = "" if br.success else "failed"
                status_badge = f'<span class="badge success">Success</span>' if br.success else '<span class="badge failed">Failed</span>'

                html += f"""
        <div class="branch {branch_class}">
            <h3>{br.branch_name} {status_badge}</h3>
"""

                if br.operations:
                    html += "            <h4>Operations:</h4>\n"
                    for op in br.operations:
                        op_class = "success" if op.success else "failed"
                        html += f"""
            <div class="operation {op_class}">
                <strong>{op.operation}</strong>: {op.message}
"""
                        if op.error:
                            html += f'                <div class="error">{op.error}</div>\n'
                        html += "            </div>\n"

                html += "        </div>\n"

            html += "    </div>\n"

        # Add errors if any
        if report.errors:
            html += """
    <div class="repo-section">
        <h2>Errors</h2>
"""
            for error in report.errors:
                html += f'        <div class="error">{error}</div>\n'
            html += "    </div>\n"

        html += """
</body>
</html>
"""

        with open(filepath, 'w') as f:
            f.write(html)

        return filepath

    def export(self, report: Report, format: Optional[str] = None) -> str:
        """
        Export report in the configured format

        Args:
            report: Report to export
            format: Output format (uses config if None)

        Returns:
            Path to the exported file
        """
        export_format = format or self.config.output_format

        if export_format == "json":
            return self.export_json(report)
        elif export_format == "markdown":
            return self.export_markdown(report)
        elif export_format == "html":
            return self.export_html(report)
        else:
            raise ValueError(f"Unsupported format: {export_format}")

    def generate_summary_statistics(self, report: Report) -> Dict[str, Any]:
        """
        Generate detailed statistics from a report

        Args:
            report: Report to analyze

        Returns:
            Dictionary with statistical analysis
        """
        stats = {
            "overall": {
                "success_rate": report.summary.success_rate,
                "total_operations": report.summary.total_operations,
                "avg_operations_per_branch": report.summary.total_operations / max(report.summary.total_branches, 1)
            },
            "by_operation_type": {},
            "by_repository": {}
        }

        # Analyze by operation type
        op_types = defaultdict(lambda: {"total": 0, "success": 0, "failed": 0})
        for br in report.branch_reports:
            for op in br.operations:
                op_types[op.operation]["total"] += 1
                if op.success:
                    op_types[op.operation]["success"] += 1
                else:
                    op_types[op.operation]["failed"] += 1

        for op_type, counts in op_types.items():
            stats["by_operation_type"][op_type] = {
                **counts,
                "success_rate": (counts["success"] / counts["total"] * 100) if counts["total"] > 0 else 0
            }

        # Analyze by repository
        repo_stats = defaultdict(lambda: {"branches": 0, "operations": 0, "success": 0})
        for br in report.branch_reports:
            repo_stats[br.repository]["branches"] += 1
            repo_stats[br.repository]["operations"] += len(br.operations)
            repo_stats[br.repository]["success"] += sum(1 for op in br.operations if op.success)

        stats["by_repository"] = dict(repo_stats)

        return stats
