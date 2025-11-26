"""
Report History & Comparison Module

Features:
- Store report history in JSON database
- Compare current vs previous reports
- Trend detection over time
- Anomaly detection
- Historical analytics
- Performance tracking
"""

import json
import os
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from pathlib import Path


class DateTimeEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles datetime objects"""
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


@dataclass
class HistoricalTrend:
    """Represents a trend over time"""
    metric_name: str
    direction: str  # improving, declining, stable
    change_percent: float
    current_value: float
    previous_value: float
    confidence: str  # low, medium, high


@dataclass
class Anomaly:
    """Detected anomaly in report data"""
    metric_name: str
    current_value: float
    expected_range: Tuple[float, float]
    severity: str  # low, medium, high
    description: str


@dataclass
class ComparisonResult:
    """Result of comparing two reports"""
    timestamp_current: str
    timestamp_previous: str
    trends: List[HistoricalTrend]
    anomalies: List[Anomaly]
    improvements: List[str]
    regressions: List[str]
    summary: str


class ReportHistoryManager:
    """
    Manages report history and provides comparison & trend analysis
    """

    def __init__(self, history_dir: str = "./reports/history"):
        """
        Initialize report history manager

        Args:
            history_dir: Directory to store report history
        """
        self.history_dir = Path(history_dir)
        self.history_dir.mkdir(parents=True, exist_ok=True)
        self.history_file = self.history_dir / "report_history.json"
        self.history = self._load_history()

    def _load_history(self) -> List[Dict]:
        """Load report history from file"""
        if self.history_file.exists():
            try:
                with open(self.history_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading history: {e}")
                return []
        return []

    def _save_history(self):
        """Save report history to file"""
        try:
            with open(self.history_file, 'w') as f:
                json.dump(self.history, f, indent=2, cls=DateTimeEncoder)
        except Exception as e:
            print(f"Error saving history: {e}")

    def add_report(self, report: Dict, analytics: Optional[Dict] = None):
        """
        Add a report to history

        Args:
            report: Report data
            analytics: Optional analytics data
        """
        history_entry = {
            'timestamp': datetime.now().isoformat(),
            'summary': report.get('summary', {}),
            'analytics': analytics or {},
            'branch_count': len(report.get('branch_reports', [])),
            'error_count': len(report.get('errors', []))
        }

        self.history.append(history_entry)

        # Keep only last 100 reports
        if len(self.history) > 100:
            self.history = self.history[-100:]

        self._save_history()

    def get_latest_report(self) -> Optional[Dict]:
        """Get the most recent report from history"""
        if self.history:
            return self.history[-1]
        return None

    def get_report_by_timestamp(self, timestamp: str) -> Optional[Dict]:
        """Get a specific report by timestamp"""
        for report in self.history:
            if report.get('timestamp') == timestamp:
                return report
        return None

    def get_reports_in_range(
        self,
        start_time: datetime,
        end_time: datetime
    ) -> List[Dict]:
        """Get all reports within a time range"""
        filtered = []
        for report in self.history:
            try:
                report_time = datetime.fromisoformat(report.get('timestamp', ''))
                if start_time <= report_time <= end_time:
                    filtered.append(report)
            except:
                continue
        return filtered

    def compare_reports(
        self,
        current_report: Dict,
        previous_report: Optional[Dict] = None
    ) -> ComparisonResult:
        """
        Compare current report with previous report

        Args:
            current_report: Current report data
            previous_report: Previous report (uses latest from history if None)

        Returns:
            Comparison result with trends and anomalies
        """
        if previous_report is None:
            if len(self.history) >= 2:
                previous_report = self.history[-2]
            else:
                previous_report = self.history[-1] if self.history else None

        if previous_report is None:
            return ComparisonResult(
                timestamp_current=datetime.now().isoformat(),
                timestamp_previous="N/A",
                trends=[],
                anomalies=[],
                improvements=[],
                regressions=[],
                summary="No previous report available for comparison"
            )

        # Extract summaries
        current_summary = current_report.get('summary', {})
        previous_summary = previous_report.get('summary', {})

        # Detect trends
        trends = []
        improvements = []
        regressions = []

        # Success rate trend
        current_success = current_summary.get('success_rate', 0)
        previous_success = previous_summary.get('success_rate', 0)

        if previous_success > 0:
            success_change = ((current_success - previous_success) / previous_success) * 100

            if abs(success_change) > 1:  # Significant change
                direction = "improving" if success_change > 0 else "declining"
                confidence = "high" if abs(success_change) > 10 else "medium"

                trends.append(HistoricalTrend(
                    metric_name="Success Rate",
                    direction=direction,
                    change_percent=success_change,
                    current_value=current_success,
                    previous_value=previous_success,
                    confidence=confidence
                ))

                if success_change > 0:
                    improvements.append(
                        f"Success rate improved by {success_change:.1f}% "
                        f"({previous_success:.1f}% → {current_success:.1f}%)"
                    )
                else:
                    regressions.append(
                        f"Success rate declined by {abs(success_change):.1f}% "
                        f"({previous_success:.1f}% → {current_success:.1f}%)"
                    )

        # Duration trend
        current_duration = current_summary.get('duration_seconds', 0)
        previous_duration = previous_summary.get('duration_seconds', 0)

        if previous_duration > 0:
            duration_change = ((current_duration - previous_duration) / previous_duration) * 100

            if abs(duration_change) > 5:  # Significant change
                direction = "declining" if duration_change > 0 else "improving"
                confidence = "high" if abs(duration_change) > 20 else "medium"

                trends.append(HistoricalTrend(
                    metric_name="Execution Duration",
                    direction=direction,
                    change_percent=duration_change,
                    current_value=current_duration,
                    previous_value=previous_duration,
                    confidence=confidence
                ))

                if duration_change < 0:
                    improvements.append(
                        f"Execution time improved by {abs(duration_change):.1f}% "
                        f"({previous_duration:.1f}s → {current_duration:.1f}s)"
                    )
                else:
                    regressions.append(
                        f"Execution time increased by {duration_change:.1f}% "
                        f"({previous_duration:.1f}s → {current_duration:.1f}s)"
                    )

        # Operations count trend
        current_ops = current_summary.get('total_operations', 0)
        previous_ops = previous_summary.get('total_operations', 0)

        if previous_ops > 0:
            ops_change = ((current_ops - previous_ops) / previous_ops) * 100

            if abs(ops_change) > 10:
                direction = "stable"  # More ops isn't necessarily better or worse
                trends.append(HistoricalTrend(
                    metric_name="Total Operations",
                    direction=direction,
                    change_percent=ops_change,
                    current_value=current_ops,
                    previous_value=previous_ops,
                    confidence="medium"
                ))

        # Detect anomalies
        anomalies = self._detect_anomalies(current_summary)

        # Generate summary
        summary_parts = []
        if improvements:
            summary_parts.append(f"{len(improvements)} improvement(s)")
        if regressions:
            summary_parts.append(f"{len(regressions)} regression(s)")
        if anomalies:
            summary_parts.append(f"{len(anomalies)} anomaly(ies)")

        if summary_parts:
            summary = f"Detected: {', '.join(summary_parts)}"
        else:
            summary = "No significant changes detected"

        return ComparisonResult(
            timestamp_current=current_report.get('timestamp', datetime.now().isoformat()),
            timestamp_previous=previous_report.get('timestamp', 'N/A'),
            trends=trends,
            anomalies=anomalies,
            improvements=improvements,
            regressions=regressions,
            summary=summary
        )

    def _detect_anomalies(self, current_summary: Dict) -> List[Anomaly]:
        """
        Detect anomalies based on historical data

        Uses statistical analysis to identify unusual values
        """
        anomalies = []

        if len(self.history) < 5:  # Need enough history
            return anomalies

        # Calculate historical statistics
        historical_success_rates = []
        historical_durations = []

        for report in self.history[-10:]:  # Last 10 reports
            summary = report.get('summary', {})
            historical_success_rates.append(summary.get('success_rate', 0))
            historical_durations.append(summary.get('duration_seconds', 0))

        # Success rate anomaly
        if historical_success_rates:
            avg_success = sum(historical_success_rates) / len(historical_success_rates)
            std_success = (
                sum((x - avg_success) ** 2 for x in historical_success_rates) /
                len(historical_success_rates)
            ) ** 0.5

            current_success = current_summary.get('success_rate', 0)

            # Check if current value is outside 2 standard deviations
            if std_success > 0:
                z_score = abs(current_success - avg_success) / std_success

                if z_score > 2:  # Significant anomaly
                    severity = "high" if z_score > 3 else "medium"
                    anomalies.append(Anomaly(
                        metric_name="Success Rate",
                        current_value=current_success,
                        expected_range=(avg_success - 2*std_success, avg_success + 2*std_success),
                        severity=severity,
                        description=f"Success rate {current_success:.1f}% is unusual "
                                  f"(expected {avg_success:.1f}% ± {2*std_success:.1f}%)"
                    ))

        # Duration anomaly
        if historical_durations:
            avg_duration = sum(historical_durations) / len(historical_durations)
            std_duration = (
                sum((x - avg_duration) ** 2 for x in historical_durations) /
                len(historical_durations)
            ) ** 0.5

            current_duration = current_summary.get('duration_seconds', 0)

            if std_duration > 0:
                z_score = abs(current_duration - avg_duration) / std_duration

                if z_score > 2:
                    severity = "high" if z_score > 3 else "medium"
                    anomalies.append(Anomaly(
                        metric_name="Execution Duration",
                        current_value=current_duration,
                        expected_range=(avg_duration - 2*std_duration, avg_duration + 2*std_duration),
                        severity=severity,
                        description=f"Duration {current_duration:.1f}s is unusual "
                                  f"(expected {avg_duration:.1f}s ± {2*std_duration:.1f}s)"
                    ))

        return anomalies

    def get_trend_analysis(self, days: int = 7) -> Dict:
        """
        Analyze trends over the specified number of days

        Args:
            days: Number of days to analyze

        Returns:
            Trend analysis summary
        """
        cutoff_time = datetime.now() - timedelta(days=days)
        recent_reports = self.get_reports_in_range(cutoff_time, datetime.now())

        if len(recent_reports) < 2:
            return {
                'period_days': days,
                'report_count': len(recent_reports),
                'trends': [],
                'summary': "Insufficient data for trend analysis"
            }

        # Extract metrics over time
        success_rates = []
        durations = []
        operation_counts = []

        for report in recent_reports:
            summary = report.get('summary', {})
            success_rates.append(summary.get('success_rate', 0))
            durations.append(summary.get('duration_seconds', 0))
            operation_counts.append(summary.get('total_operations', 0))

        # Calculate trends
        trends = []

        # Success rate trend
        if success_rates:
            avg_first_half = sum(success_rates[:len(success_rates)//2]) / (len(success_rates)//2)
            avg_second_half = sum(success_rates[len(success_rates)//2:]) / (len(success_rates) - len(success_rates)//2)

            if avg_first_half > 0:
                trend_direction = "improving" if avg_second_half > avg_first_half else "declining" if avg_second_half < avg_first_half else "stable"
                trends.append({
                    'metric': 'Success Rate',
                    'direction': trend_direction,
                    'average': sum(success_rates) / len(success_rates),
                    'recent_average': avg_second_half,
                    'previous_average': avg_first_half
                })

        # Duration trend
        if durations:
            avg_first_half = sum(durations[:len(durations)//2]) / (len(durations)//2)
            avg_second_half = sum(durations[len(durations)//2:]) / (len(durations) - len(durations)//2)

            trend_direction = "improving" if avg_second_half < avg_first_half else "declining" if avg_second_half > avg_first_half else "stable"
            trends.append({
                'metric': 'Execution Duration',
                'direction': trend_direction,
                'average': sum(durations) / len(durations),
                'recent_average': avg_second_half,
                'previous_average': avg_first_half
            })

        return {
            'period_days': days,
            'report_count': len(recent_reports),
            'trends': trends,
            'success_rate_range': (min(success_rates), max(success_rates)) if success_rates else (0, 0),
            'duration_range': (min(durations), max(durations)) if durations else (0, 0),
            'summary': f"Analyzed {len(recent_reports)} reports over {days} days"
        }

    def export_history(self, filename: str = None) -> str:
        """
        Export complete history to JSON file

        Args:
            filename: Output filename (auto-generated if None)

        Returns:
            Path to exported file
        """
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"nava_ops_history_export_{timestamp}.json"

        with open(filename, 'w') as f:
            json.dump({
                'export_timestamp': datetime.now().isoformat(),
                'report_count': len(self.history),
                'reports': self.history
            }, f, indent=2, cls=DateTimeEncoder)

        return filename
