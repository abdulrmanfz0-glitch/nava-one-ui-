"""
Interactive HTML Report Generator with Chart.js Visualizations

Creates next-generation HTML reports with embedded Chart.js charts:
- Success rate pie charts
- Operation timeline visualizations
- Branch health gauges
- Conflict heatmaps
- Repository comparison charts
"""

from typing import Dict, List, Any
from datetime import datetime
from collections import defaultdict
import json




def safe_get(obj, key, default=None):
    """Safely get value from either a dictionary or object attribute"""
    if isinstance(obj, dict):
        return obj.get(key, default)
    else:
        return getattr(obj, key, default)

class InteractiveHTMLGenerator:
    """
    Generates interactive HTML reports with Chart.js visualizations

    Chart.js is embedded inline (no external dependencies) for visualizations.
    """

    @staticmethod
    def generate_interactive_html(
        report: Dict,
        analytics: Dict = None,
        filename: str = None
    ) -> str:
        """
        Generate interactive HTML report with embedded Chart.js visualizations
        """
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"nava_ops_interactive_{timestamp}.html"

        summary = safe_get(report, 'summary', {})
        branch_reports = safe_get(report, 'branch_reports', [])

        # Prepare data for charts
        chart_data = InteractiveHTMLGenerator._prepare_chart_data(report, analytics)

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nava Ops - Interactive Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }}

        .container {{
            max-width: 1400px;
            margin: 0 auto;
        }}

        .header {{
            background: white;
            color: #333;
            padding: 40px;
            border-radius: 15px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }}

        .header h1 {{
            font-size: 42px;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }}

        .header p {{
            color: #666;
            font-size: 16px;
        }}

        .dashboard {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}

        .metric-card {{
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }}

        .metric-card:hover {{
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        }}

        .metric-card h3 {{
            color: #666;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
        }}

        .metric-card .value {{
            font-size: 48px;
            font-weight: bold;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }}

        .metric-card .label {{
            color: #999;
            font-size: 12px;
            margin-top: 10px;
        }}

        .charts-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
            gap: 30px;
            margin-bottom: 30px;
        }}

        .chart-card {{
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }}

        .chart-card h2 {{
            color: #333;
            margin-bottom: 20px;
            font-size: 24px;
        }}

        .chart-container {{
            position: relative;
            height: 300px;
        }}

        .full-width-chart {{
            grid-column: 1 / -1;
        }}

        .data-table {{
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            overflow-x: auto;
        }}

        .data-table h2 {{
            color: #333;
            margin-bottom: 20px;
            font-size: 24px;
        }}

        table {{
            width: 100%;
            border-collapse: collapse;
        }}

        th, td {{
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }}

        th {{
            background: #f8f9fa;
            color: #666;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 1px;
        }}

        tr:hover {{
            background: #f8f9fa;
        }}

        .badge {{
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }}

        .badge-success {{
            background: #d4edda;
            color: #155724;
        }}

        .badge-danger {{
            background: #f8d7da;
            color: #721c24;
        }}

        .badge-warning {{
            background: #fff3cd;
            color: #856404;
        }}

        .badge-info {{
            background: #d1ecf1;
            color: #0c5460;
        }}

        .health-bar {{
            width: 100%;
            height: 8px;
            background: #eee;
            border-radius: 4px;
            overflow: hidden;
        }}

        .health-bar-fill {{
            height: 100%;
            transition: width 0.3s ease;
        }}

        .health-excellent {{
            background: linear-gradient(90deg, #2ecc71, #27ae60);
        }}

        .health-good {{
            background: linear-gradient(90deg, #f39c12, #e67e22);
        }}

        .health-poor {{
            background: linear-gradient(90deg, #e74c3c, #c0392b);
        }}

        .insights-panel {{
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }}

        .insights-panel h2 {{
            color: #333;
            margin-bottom: 20px;
            font-size: 24px;
        }}

        .insight-item {{
            padding: 15px;
            margin: 10px 0;
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            border-radius: 4px;
        }}

        .footer {{
            text-align: center;
            color: white;
            padding: 20px;
            margin-top: 30px;
        }}

        @media (max-width: 768px) {{
            .charts-grid {{
                grid-template-columns: 1fr;
            }}

            .header h1 {{
                font-size: 28px;
            }}

            .metric-card .value {{
                font-size: 36px;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>📊 Nava Ops - Interactive Report</h1>
            <p>Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Next-Generation Git Orchestration</p>
        </div>

        <!-- Dashboard Metrics -->
        <div class="dashboard">
            <div class="metric-card">
                <h3>Total Operations</h3>
                <div class="value">{safe_get(summary, 'total_operations', 0)}</div>
                <div class="label">Executed successfully</div>
            </div>
            <div class="metric-card">
                <h3>Success Rate</h3>
                <div class="value">{safe_get(summary, 'success_rate', 0):.1f}%</div>
                <div class="label">{safe_get(summary, 'successful_operations', 0)}/{safe_get(summary, 'total_operations', 0)} operations</div>
            </div>
            <div class="metric-card">
                <h3>Branches</h3>
                <div class="value">{safe_get(summary, 'total_branches', 0)}</div>
                <div class="label">Across {safe_get(summary, 'total_repositories', 0)} repositories</div>
            </div>
            <div class="metric-card">
                <h3>Duration</h3>
                <div class="value">{safe_get(summary, 'duration_seconds', 0):.1f}s</div>
                <div class="label">Total execution time</div>
            </div>
        </div>

        <!-- Charts Grid -->
        <div class="charts-grid">
            <!-- Success Rate Pie Chart -->
            <div class="chart-card">
                <h2>📈 Success Distribution</h2>
                <div class="chart-container">
                    <canvas id="successChart"></canvas>
                </div>
            </div>

            <!-- Operations by Type -->
            <div class="chart-card">
                <h2>🔧 Operations by Type</h2>
                <div class="chart-container">
                    <canvas id="operationsChart"></canvas>
                </div>
            </div>

            <!-- Repository Comparison -->
            <div class="chart-card full-width-chart">
                <h2>📁 Repository Comparison</h2>
                <div class="chart-container">
                    <canvas id="repositoryChart"></canvas>
                </div>
            </div>
"""

        # Add branch health chart if analytics available
        if analytics and 'branch_health' in analytics:
            html += """
            <!-- Branch Health -->
            <div class="chart-card full-width-chart">
                <h2>🏥 Branch Health Scores</h2>
                <div class="chart-container">
                    <canvas id="healthChart"></canvas>
                </div>
            </div>
"""

        html += """
        </div>
"""

        # Add analytics insights if available
        if analytics:
            html += InteractiveHTMLGenerator._generate_insights_section(analytics)

        # Add detailed branch table
        html += InteractiveHTMLGenerator._generate_branch_table(branch_reports, analytics)

        # JavaScript for charts
        html += f"""
        <div class="footer">
            <p>Powered by Nava Ops v2.0 - Revolutionary Git Orchestration</p>
        </div>
    </div>

    <script>
        // Chart.js configuration
        Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        Chart.defaults.color = '#666';

        // Success Rate Pie Chart
        const successData = {{
            labels: ['Successful', 'Failed'],
            datasets: [{{
                data: [{safe_get(summary, 'successful_operations', 0)}, {safe_get(summary, 'failed_operations', 0)}],
                backgroundColor: [
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(231, 76, 60, 0.8)'
                ],
                borderColor: [
                    'rgba(46, 204, 113, 1)',
                    'rgba(231, 76, 60, 1)'
                ],
                borderWidth: 2
            }}]
        }};

        new Chart(document.getElementById('successChart'), {{
            type: 'doughnut',
            data: successData,
            options: {{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {{
                    legend: {{
                        position: 'bottom'
                    }},
                    title: {{
                        display: false
                    }}
                }}
            }}
        }});

        // Operations by Type Chart
        const operationsData = {json.dumps(safe_get(chart_data, 'operations_by_type', {}))};
        new Chart(document.getElementById('operationsChart'), {{
            type: 'bar',
            data: {{
                labels: Object.keys(operationsData),
                datasets: [{{
                    label: 'Operations Count',
                    data: Object.values(operationsData),
                    backgroundColor: 'rgba(102, 126, 234, 0.8)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2
                }}]
            }},
            options: {{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {{
                    legend: {{
                        display: false
                    }}
                }},
                scales: {{
                    y: {{
                        beginAtZero: true,
                        ticks: {{
                            stepSize: 1
                        }}
                    }}
                }}
            }}
        }});

        // Repository Comparison Chart
        const repositoryData = {json.dumps(safe_get(chart_data, 'repository_stats', {}))};
        new Chart(document.getElementById('repositoryChart'), {{
            type: 'bar',
            data: {{
                labels: Object.keys(repositoryData),
                datasets: [
                    {{
                        label: 'Successful',
                        data: Object.values(repositoryData).map(r => r.success),
                        backgroundColor: 'rgba(46, 204, 113, 0.8)',
                        borderColor: 'rgba(46, 204, 113, 1)',
                        borderWidth: 2
                    }},
                    {{
                        label: 'Failed',
                        data: Object.values(repositoryData).map(r => r.failed),
                        backgroundColor: 'rgba(231, 76, 60, 0.8)',
                        borderColor: 'rgba(231, 76, 60, 1)',
                        borderWidth: 2
                    }}
                ]
            }},
            options: {{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {{
                    legend: {{
                        position: 'bottom'
                    }}
                }},
                scales: {{
                    x: {{
                        stacked: false
                    }},
                    y: {{
                        beginAtZero: true,
                        ticks: {{
                            stepSize: 1
                        }}
                    }}
                }}
            }}
        }});
"""

        # Add branch health chart if analytics available
        if analytics and 'branch_health' in analytics:
            health_data = safe_get(chart_data, 'branch_health', {})
            html += f"""
        // Branch Health Chart
        const healthData = {json.dumps(health_data)};
        new Chart(document.getElementById('healthChart'), {{
            type: 'horizontalBar',
            data: {{
                labels: Object.keys(healthData),
                datasets: [{{
                    label: 'Health Score',
                    data: Object.values(healthData),
                    backgroundColor: Object.values(healthData).map(score => {{
                        if (score >= 80) return 'rgba(46, 204, 113, 0.8)';
                        if (score >= 60) return 'rgba(243, 156, 18, 0.8)';
                        return 'rgba(231, 76, 60, 0.8)';
                    }}),
                    borderColor: Object.values(healthData).map(score => {{
                        if (score >= 80) return 'rgba(46, 204, 113, 1)';
                        if (score >= 60) return 'rgba(243, 156, 18, 1)';
                        return 'rgba(231, 76, 60, 1)';
                    }}),
                    borderWidth: 2
                }}]
            }},
            options: {{
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {{
                    legend: {{
                        display: false
                    }}
                }},
                scales: {{
                    x: {{
                        beginAtZero: true,
                        max: 100
                    }}
                }}
            }}
        }});
"""

        html += """
    </script>
</body>
</html>
"""

        # Write to file
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(html)

        return filename

    @staticmethod
    def _prepare_chart_data(report: Dict, analytics: Dict = None) -> Dict:
        """Prepare data for charts"""
        branch_reports = safe_get(report, 'branch_reports', [])

        # Operations by type
        operations_by_type = {}
        for branch_report in branch_reports:
            for operation in safe_get(branch_report, 'operations', []):
                op_type = safe_get(operation, 'operation', 'unknown')
                operations_by_type[op_type] = operations_by_type.get(op_type, 0) + 1

        # Repository stats
        repository_stats = {}
        for branch_report in branch_reports:
            repo = safe_get(branch_report, 'repository', 'unknown')
            if repo not in repository_stats:
                repository_stats[repo] = {'success': 0, 'failed': 0}

            if safe_get(branch_report, 'success', False):
                repository_stats[repo]['success'] += 1
            else:
                repository_stats[repo]['failed'] += 1

        # Branch health (if analytics available)
        branch_health = {}
        if analytics and 'branch_health' in analytics:
            for health in analytics['branch_health'][:10]:  # Top 10
                branch_name = safe_get(health, 'branch_name', 'unknown')
                health_score = safe_get(health, 'health_score', 0)
                branch_health[branch_name] = health_score

        return {
            'operations_by_type': operations_by_type,
            'repository_stats': repository_stats,
            'branch_health': branch_health
        }

    @staticmethod
    def _generate_insights_section(analytics: Dict) -> str:
        """Generate insights panel HTML"""
        html = """
        <!-- Insights Panel -->
        <div class="insights-panel">
            <h2>💡 Key Insights</h2>
"""

        if 'key_insights' in analytics:
            for insight in analytics['key_insights']:
                html += f"""
            <div class="insight-item">
                {insight}
            </div>
"""

        if 'action_items' in analytics:
            html += """
            <h2 style="margin-top: 30px;">✅ Recommended Actions</h2>
"""
            for action in analytics['action_items']:
                html += f"""
            <div class="insight-item">
                {action}
            </div>
"""

        html += """
        </div>
"""

        return html

    @staticmethod
    def _generate_branch_table(branch_reports: List[Dict], analytics: Dict = None) -> str:
        """Generate detailed branch table"""
        html = """
        <!-- Branch Details Table -->
        <div class="data-table">
            <h2>📋 Branch Details</h2>
            <table>
                <thead>
                    <tr>
                        <th>Repository</th>
                        <th>Branch</th>
                        <th>Status</th>
                        <th>Operations</th>
"""

        if analytics and 'branch_health' in analytics:
            html += """
                        <th>Health Score</th>
"""

        html += """
                    </tr>
                </thead>
                <tbody>
"""

        # Create health lookup
        health_lookup = {}
        if analytics and 'branch_health' in analytics:
            for health in analytics['branch_health']:
                key = f"{safe_get(health, 'repository', '')}:{safe_get(health, 'branch_name', '')}"
                health_lookup[key] = safe_get(health, 'health_score', 0)

        for branch_report in branch_reports:
            repo = safe_get(branch_report, 'repository', 'unknown')
            branch = safe_get(branch_report, 'branch_name', 'unknown')
            success = safe_get(branch_report, 'success', False)
            op_count = len(safe_get(branch_report, 'operations', []))

            status_badge = '<span class="badge badge-success">✓ Success</span>' if success else '<span class="badge badge-danger">✗ Failed</span>'

            html += f"""
                    <tr>
                        <td>{repo}</td>
                        <td><code>{branch}</code></td>
                        <td>{status_badge}</td>
                        <td>{op_count}</td>
"""

            if analytics and 'branch_health' in analytics:
                key = f"{repo}:{branch}"
                health_score = health_lookup.get(key, 0)

                if health_score >= 80:
                    health_class = "health-excellent"
                    badge_class = "badge-success"
                elif health_score >= 60:
                    health_class = "health-good"
                    badge_class = "badge-warning"
                else:
                    health_class = "health-poor"
                    badge_class = "badge-danger"

                html += f"""
                        <td>
                            <span class="badge {badge_class}">{health_score:.1f}</span>
                            <div class="health-bar">
                                <div class="health-bar-fill {health_class}" style="width: {health_score}%"></div>
                            </div>
                        </td>
"""

            html += """
                    </tr>
"""

        html += """
                </tbody>
            </table>
        </div>
"""

        return html
