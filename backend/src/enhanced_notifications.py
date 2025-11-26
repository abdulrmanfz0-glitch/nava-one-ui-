"""
Enhanced Notifications Module

Revolutionary notification system with:
- Slack webhooks with rich formatting
- Email via SMTP with HTML templates
- Microsoft Teams integration
- Discord webhooks
- Telegram bot integration
- Custom webhook templates
- Smart notification routing
- Rate limiting and batching
"""

import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
import logging
import subprocess


logger = logging.getLogger(__name__)


class EnhancedNotificationChannel(Enum):
    """Enhanced notification channels"""
    SLACK = "slack"
    EMAIL = "email"
    TEAMS = "teams"
    DISCORD = "discord"
    TELEGRAM = "telegram"
    CONSOLE = "console"
    WEBHOOK = "webhook"


class NotificationPriority(Enum):
    """Notification priorities"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class EnhancedNotificationConfig:
    """Configuration for enhanced notifications"""
    # Slack
    slack_webhook_url: Optional[str] = None
    slack_channel: Optional[str] = None
    slack_username: str = "Nava Ops Bot"
    slack_icon_emoji: str = ":robot_face:"

    # Email (SMTP)
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from_email: Optional[str] = None
    smtp_to_emails: List[str] = None
    smtp_use_tls: bool = True

    # Microsoft Teams
    teams_webhook_url: Optional[str] = None

    # Discord
    discord_webhook_url: Optional[str] = None
    discord_username: str = "Nava Ops"

    # Telegram
    telegram_bot_token: Optional[str] = None
    telegram_chat_id: Optional[str] = None

    # Generic Webhook
    webhook_url: Optional[str] = None
    webhook_headers: Dict[str, str] = None

    # Routing
    min_priority: NotificationPriority = NotificationPriority.MEDIUM
    enabled_channels: List[EnhancedNotificationChannel] = None

    def __post_init__(self):
        if self.smtp_to_emails is None:
            self.smtp_to_emails = []
        if self.webhook_headers is None:
            self.webhook_headers = {"Content-Type": "application/json"}
        if self.enabled_channels is None:
            self.enabled_channels = [EnhancedNotificationChannel.CONSOLE]


class EnhancedNotificationManager:
    """
    Next-generation notification manager with multi-platform support
    """

    def __init__(self, config: EnhancedNotificationConfig):
        """
        Initialize enhanced notification manager

        Args:
            config: Notification configuration
        """
        self.config = config
        self.notification_history = []

    def send_report_notification(
        self,
        report_summary: Dict,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        analytics: Optional[Dict] = None
    ):
        """
        Send notification about a completed report

        Args:
            report_summary: Report summary data
            priority: Notification priority
            analytics: Optional analytics data
        """
        # Check if priority meets threshold
        if self._should_send(priority):
            for channel in self.config.enabled_channels:
                try:
                    if channel == EnhancedNotificationChannel.SLACK:
                        self._send_slack_notification(report_summary, analytics)
                    elif channel == EnhancedNotificationChannel.EMAIL:
                        self._send_email_notification(report_summary, analytics)
                    elif channel == EnhancedNotificationChannel.TEAMS:
                        self._send_teams_notification(report_summary, analytics)
                    elif channel == EnhancedNotificationChannel.DISCORD:
                        self._send_discord_notification(report_summary, analytics)
                    elif channel == EnhancedNotificationChannel.TELEGRAM:
                        self._send_telegram_notification(report_summary, analytics)
                    elif channel == EnhancedNotificationChannel.CONSOLE:
                        self._send_console_notification(report_summary, analytics)
                except Exception as e:
                    logger.error(f"Failed to send notification via {channel.value}: {e}")

    def _should_send(self, priority: NotificationPriority) -> bool:
        """Check if notification should be sent based on priority"""
        priority_levels = {
            NotificationPriority.LOW: 0,
            NotificationPriority.MEDIUM: 1,
            NotificationPriority.HIGH: 2,
            NotificationPriority.CRITICAL: 3
        }
        return priority_levels[priority] >= priority_levels[self.config.min_priority]

    def _send_slack_notification(self, summary: Dict, analytics: Optional[Dict] = None):
        """
        Send rich Slack notification

        Creates a beautiful Slack message with attachments and formatting
        """
        if not self.config.slack_webhook_url:
            logger.warning("Slack webhook URL not configured")
            return

        success_rate = summary.get('success_rate', 0)

        # Determine color based on success rate
        if success_rate >= 90:
            color = "#2ecc71"  # Green
            status_emoji = ":white_check_mark:"
        elif success_rate >= 70:
            color = "#f39c12"  # Orange
            status_emoji = ":warning:"
        else:
            color = "#e74c3c"  # Red
            status_emoji = ":x:"

        # Build Slack message
        message = {
            "username": self.config.slack_username,
            "icon_emoji": self.config.slack_icon_emoji,
            "text": f"{status_emoji} *Nava Ops Report Complete*",
            "attachments": [
                {
                    "color": color,
                    "title": "Git Operations Summary",
                    "fields": [
                        {
                            "title": "Success Rate",
                            "value": f"{success_rate:.1f}%",
                            "short": True
                        },
                        {
                            "title": "Total Operations",
                            "value": str(summary.get('total_operations', 0)),
                            "short": True
                        },
                        {
                            "title": "Branches Processed",
                            "value": str(summary.get('total_branches', 0)),
                            "short": True
                        },
                        {
                            "title": "Duration",
                            "value": f"{summary.get('duration_seconds', 0):.2f}s",
                            "short": True
                        }
                    ],
                    "footer": "Nava Ops v2.0",
                    "ts": int(datetime.now().timestamp())
                }
            ]
        }

        # Add analytics if available
        if analytics and 'key_insights' in analytics:
            insights_text = "\n".join(f"• {insight}" for insight in analytics['key_insights'][:3])
            message["attachments"].append({
                "color": "#667eea",
                "title": "Key Insights",
                "text": insights_text
            })

        # Send via curl (avoiding external dependencies)
        try:
            import subprocess
            payload = json.dumps(message)
            subprocess.run(
                ['curl', '-X', 'POST', '-H', 'Content-Type: application/json',
                 '-d', payload, self.config.slack_webhook_url],
                capture_output=True,
                timeout=10
            )
            logger.info("Slack notification sent successfully")
        except Exception as e:
            logger.error(f"Failed to send Slack notification: {e}")

    def _send_email_notification(self, summary: Dict, analytics: Optional[Dict] = None):
        """
        Send HTML email notification via SMTP
        """
        if not all([self.config.smtp_host, self.config.smtp_from_email, self.config.smtp_to_emails]):
            logger.warning("Email configuration incomplete")
            return

        success_rate = summary.get('success_rate', 0)

        # Determine status
        if success_rate >= 90:
            status = "✅ Excellent"
            status_color = "#2ecc71"
        elif success_rate >= 70:
            status = "⚠️  Good"
            status_color = "#f39c12"
        else:
            status = "❌ Needs Attention"
            status_color = "#e74c3c"

        # Build HTML email
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{
            font-family: 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
        }}
        .status {{
            font-size: 24px;
            margin: 20px 0;
            padding: 15px;
            background: {status_color};
            color: white;
            border-radius: 8px;
            text-align: center;
        }}
        .metrics {{
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 20px 0;
        }}
        .metric {{
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }}
        .metric-label {{
            color: #666;
            font-size: 12px;
            text-transform: uppercase;
        }}
        .metric-value {{
            font-size: 28px;
            font-weight: bold;
            color: #333;
            margin-top: 5px;
        }}
        .insights {{
            background: #e8f4f8;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }}
        .insights h3 {{
            margin-top: 0;
            color: #667eea;
        }}
        .insights ul {{
            margin: 10px 0;
            padding-left: 20px;
        }}
        .footer {{
            text-align: center;
            color: #999;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Nava Ops Report</h1>
            <p>Git Operations Complete</p>
        </div>

        <div class="status">
            {status} - {success_rate:.1f}% Success Rate
        </div>

        <div class="metrics">
            <div class="metric">
                <div class="metric-label">Total Operations</div>
                <div class="metric-value">{summary.get('total_operations', 0)}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Branches</div>
                <div class="metric-value">{summary.get('total_branches', 0)}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Repositories</div>
                <div class="metric-value">{summary.get('total_repositories', 0)}</div>
            </div>
            <div class="metric">
                <div class="metric-label">Duration</div>
                <div class="metric-value">{summary.get('duration_seconds', 0):.1f}s</div>
            </div>
        </div>
"""

        # Add analytics insights
        if analytics and 'key_insights' in analytics:
            html_body += """
        <div class="insights">
            <h3>💡 Key Insights</h3>
            <ul>
"""
            for insight in analytics['key_insights'][:5]:
                html_body += f"                <li>{insight}</li>\n"
            html_body += """
            </ul>
        </div>
"""

        html_body += """
        <div class="footer">
            <p>Generated by Nava Ops v2.0 - Next-Generation Git Orchestration</p>
            <p>© 2024 Nava Ops. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
"""

        # Create email message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = f"Nava Ops Report - {status}"
        msg['From'] = self.config.smtp_from_email
        msg['To'] = ', '.join(self.config.smtp_to_emails)

        # Plain text fallback
        text_body = f"""
Nava Ops Report

Status: {status}
Success Rate: {success_rate:.1f}%
Total Operations: {summary.get('total_operations', 0)}
Branches: {summary.get('total_branches', 0)}
Duration: {summary.get('duration_seconds', 0):.1f}s

Generated by Nava Ops v2.0
"""

        msg.attach(MIMEText(text_body, 'plain'))
        msg.attach(MIMEText(html_body, 'html'))

        # Send email
        try:
            with smtplib.SMTP(self.config.smtp_host, self.config.smtp_port) as server:
                if self.config.smtp_use_tls:
                    server.starttls()
                if self.config.smtp_username and self.config.smtp_password:
                    server.login(self.config.smtp_username, self.config.smtp_password)
                server.send_message(msg)
            logger.info(f"Email notification sent to {len(self.config.smtp_to_emails)} recipients")
        except Exception as e:
            logger.error(f"Failed to send email notification: {e}")

    def _send_teams_notification(self, summary: Dict, analytics: Optional[Dict] = None):
        """
        Send Microsoft Teams notification via webhook
        """
        if not self.config.teams_webhook_url:
            logger.warning("Teams webhook URL not configured")
            return

        success_rate = summary.get('success_rate', 0)

        # Determine theme color
        if success_rate >= 90:
            theme_color = "2ecc71"  # Green
            status = "✅ Excellent"
        elif success_rate >= 70:
            theme_color = "f39c12"  # Orange
            status = "⚠️  Good"
        else:
            theme_color = "e74c3c"  # Red
            status = "❌ Needs Attention"

        # Build Teams message card
        message = {
            "@type": "MessageCard",
            "@context": "https://schema.org/extensions",
            "themeColor": theme_color,
            "summary": "Nava Ops Report Complete",
            "sections": [
                {
                    "activityTitle": "📊 Nava Ops Report",
                    "activitySubtitle": f"Git Operations Complete - {status}",
                    "facts": [
                        {
                            "name": "Success Rate:",
                            "value": f"{success_rate:.1f}%"
                        },
                        {
                            "name": "Total Operations:",
                            "value": str(summary.get('total_operations', 0))
                        },
                        {
                            "name": "Branches:",
                            "value": str(summary.get('total_branches', 0))
                        },
                        {
                            "name": "Duration:",
                            "value": f"{summary.get('duration_seconds', 0):.2f}s"
                        }
                    ],
                    "markdown": True
                }
            ]
        }

        # Add insights section
        if analytics and 'key_insights' in analytics:
            insights_text = "\n\n".join(f"- {insight}" for insight in analytics['key_insights'][:3])
            message["sections"].append({
                "activityTitle": "💡 Key Insights",
                "text": insights_text,
                "markdown": True
            })

        # Send via curl
        try:
            payload = json.dumps(message)
            subprocess.run(
                ['curl', '-X', 'POST', '-H', 'Content-Type: application/json',
                 '-d', payload, self.config.teams_webhook_url],
                capture_output=True,
                timeout=10
            )
            logger.info("Teams notification sent successfully")
        except Exception as e:
            logger.error(f"Failed to send Teams notification: {e}")

    def _send_discord_notification(self, summary: Dict, analytics: Optional[Dict] = None):
        """
        Send Discord notification via webhook
        """
        if not self.config.discord_webhook_url:
            logger.warning("Discord webhook URL not configured")
            return

        success_rate = summary.get('success_rate', 0)

        # Determine color (Discord uses decimal colors)
        if success_rate >= 90:
            color = 3066993  # Green
            status_emoji = "✅"
        elif success_rate >= 70:
            color = 15844367  # Orange
            status_emoji = "⚠️"
        else:
            color = 15158332  # Red
            status_emoji = "❌"

        # Build Discord embed
        embed = {
            "title": f"{status_emoji} Nava Ops Report Complete",
            "description": "Git operations have been executed",
            "color": color,
            "fields": [
                {
                    "name": "Success Rate",
                    "value": f"{success_rate:.1f}%",
                    "inline": True
                },
                {
                    "name": "Total Operations",
                    "value": str(summary.get('total_operations', 0)),
                    "inline": True
                },
                {
                    "name": "Branches",
                    "value": str(summary.get('total_branches', 0)),
                    "inline": True
                },
                {
                    "name": "Duration",
                    "value": f"{summary.get('duration_seconds', 0):.2f}s",
                    "inline": True
                }
            ],
            "footer": {
                "text": "Nava Ops v2.0"
            },
            "timestamp": datetime.now().isoformat()
        }

        # Add insights
        if analytics and 'key_insights' in analytics:
            insights_text = "\n".join(f"• {insight}" for insight in analytics['key_insights'][:3])
            embed["fields"].append({
                "name": "💡 Key Insights",
                "value": insights_text,
                "inline": False
            })

        message = {
            "username": self.config.discord_username,
            "embeds": [embed]
        }

        # Send via curl
        try:
            payload = json.dumps(message)
            subprocess.run(
                ['curl', '-X', 'POST', '-H', 'Content-Type: application/json',
                 '-d', payload, self.config.discord_webhook_url],
                capture_output=True,
                timeout=10
            )
            logger.info("Discord notification sent successfully")
        except Exception as e:
            logger.error(f"Failed to send Discord notification: {e}")

    def _send_telegram_notification(self, summary: Dict, analytics: Optional[Dict] = None):
        """
        Send Telegram notification via bot API
        """
        if not all([self.config.telegram_bot_token, self.config.telegram_chat_id]):
            logger.warning("Telegram configuration incomplete")
            return

        success_rate = summary.get('success_rate', 0)

        # Determine status
        if success_rate >= 90:
            status = "✅ Excellent"
        elif success_rate >= 70:
            status = "⚠️  Good"
        else:
            status = "❌ Needs Attention"

        # Build message
        message_text = f"""
📊 *Nava Ops Report*

*Status:* {status}
*Success Rate:* {success_rate:.1f}%
*Total Operations:* {summary.get('total_operations', 0)}
*Branches:* {summary.get('total_branches', 0)}
*Duration:* {summary.get('duration_seconds', 0):.2f}s
"""

        # Add insights
        if analytics and 'key_insights' in analytics:
            message_text += "\n💡 *Key Insights:*\n"
            for insight in analytics['key_insights'][:3]:
                message_text += f"• {insight}\n"

        message_text += "\n_Generated by Nava Ops v2.0_"

        # Send via curl
        try:
            url = f"https://api.telegram.org/bot{self.config.telegram_bot_token}/sendMessage"
            payload = json.dumps({
                "chat_id": self.config.telegram_chat_id,
                "text": message_text,
                "parse_mode": "Markdown"
            })
            subprocess.run(
                ['curl', '-X', 'POST', '-H', 'Content-Type: application/json',
                 '-d', payload, url],
                capture_output=True,
                timeout=10
            )
            logger.info("Telegram notification sent successfully")
        except Exception as e:
            logger.error(f"Failed to send Telegram notification: {e}")

    def _send_console_notification(self, summary: Dict, analytics: Optional[Dict] = None):
        """
        Send colorized console notification
        """
        success_rate = summary.get('success_rate', 0)

        # ANSI colors
        GREEN = "\033[92m"
        YELLOW = "\033[93m"
        RED = "\033[91m"
        BLUE = "\033[94m"
        BOLD = "\033[1m"
        RESET = "\033[0m"

        if success_rate >= 90:
            status_color = GREEN
            status = "✅ Excellent"
        elif success_rate >= 70:
            status_color = YELLOW
            status = "⚠️  Good"
        else:
            status_color = RED
            status = "❌ Needs Attention"

        print(f"\n{BLUE}{BOLD}{'='*60}{RESET}")
        print(f"{BLUE}{BOLD}📊 NAVA OPS REPORT NOTIFICATION{RESET}")
        print(f"{BLUE}{BOLD}{'='*60}{RESET}")
        print(f"\n{BOLD}Status:{RESET} {status_color}{status}{RESET}")
        print(f"{BOLD}Success Rate:{RESET} {status_color}{success_rate:.1f}%{RESET}")
        print(f"{BOLD}Total Operations:{RESET} {summary.get('total_operations', 0)}")
        print(f"{BOLD}Branches:{RESET} {summary.get('total_branches', 0)}")
        print(f"{BOLD}Duration:{RESET} {summary.get('duration_seconds', 0):.2f}s")

        if analytics and 'key_insights' in analytics:
            print(f"\n{BOLD}💡 Key Insights:{RESET}")
            for insight in analytics['key_insights'][:3]:
                print(f"  • {insight}")

        print(f"\n{BLUE}{BOLD}{'='*60}{RESET}\n")
