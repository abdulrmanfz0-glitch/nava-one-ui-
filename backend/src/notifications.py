"""
Notifications Module

Multi-channel notification system for operation alerts.

Features:
- Multiple notification channels (console, file, webhook, Slack, email)
- Configurable notification levels
- Template-based messages
- Batch notifications
- Async delivery
- Slack integration with rich formatting
- Email integration with SMTP support
"""

import logging
import json
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import os
import urllib.request
import urllib.error
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


logger = logging.getLogger(__name__)


class NotificationLevel(Enum):
    """Notification severity levels"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    SUCCESS = "success"


class NotificationChannel(Enum):
    """Available notification channels"""
    CONSOLE = "console"
    FILE = "file"
    WEBHOOK = "webhook"
    EMAIL = "email"
    SLACK = "slack"


@dataclass
class NotificationConfig:
    """Configuration for notification manager"""
    console_enabled: bool = True
    file_enabled: bool = False
    slack_enabled: bool = False
    email_enabled: bool = False

    # File configuration
    file_path: str = "nava-ops-notifications.log"

    # Slack configuration
    slack_webhook_url: Optional[str] = None

    # Email configuration
    email_smtp_host: Optional[str] = None
    email_smtp_port: int = 587
    email_from: Optional[str] = None
    email_to: List[str] = field(default_factory=list)
    email_username: Optional[str] = None
    email_password: Optional[str] = None
    email_use_tls: bool = True


@dataclass
class Notification:
    """Represents a notification message"""
    level: NotificationLevel
    title: str
    message: str
    timestamp: datetime
    repository: Optional[str] = None
    branch: Optional[str] = None
    operation: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class NotificationManager:
    """
    Manages notifications across multiple channels
    """

    def __init__(self, config: Optional[NotificationConfig] = None):
        """
        Initialize notification manager

        Args:
            config: Notification configuration (default: console only)
        """
        self.config = config or NotificationConfig()
        self.notifications: List[Notification] = []

        # Determine enabled channels
        self.channels = []
        if self.config.console_enabled:
            self.channels.append(NotificationChannel.CONSOLE)
        if self.config.file_enabled:
            self.channels.append(NotificationChannel.FILE)
        if self.config.slack_enabled:
            self.channels.append(NotificationChannel.SLACK)
        if self.config.email_enabled:
            self.channels.append(NotificationChannel.EMAIL)

        self.handlers = {
            NotificationChannel.CONSOLE: self._handle_console,
            NotificationChannel.FILE: self._handle_file,
            NotificationChannel.WEBHOOK: self._handle_webhook,
            NotificationChannel.EMAIL: self._handle_email,
            NotificationChannel.SLACK: self._handle_slack,
        }

    def send(
        self,
        level: NotificationLevel,
        title: str,
        message: str,
        repository: Optional[str] = None,
        branch: Optional[str] = None,
        operation: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Send a notification

        Args:
            level: Notification level
            title: Notification title
            message: Notification message
            repository: Optional repository name
            branch: Optional branch name
            operation: Optional operation name
            metadata: Optional metadata dict
        """
        notification = Notification(
            level=level,
            title=title,
            message=message,
            timestamp=datetime.now(),
            repository=repository,
            branch=branch,
            operation=operation,
            metadata=metadata or {}
        )

        self.notifications.append(notification)

        # Send to all enabled channels
        for channel in self.channels:
            try:
                handler = self.handlers.get(channel)
                if handler:
                    handler(notification)
            except Exception as e:
                logger.error(f"Failed to send notification via {channel.value}: {e}")

    def info(self, title: str, message: str, **kwargs):
        """Send info notification"""
        self.send(NotificationLevel.INFO, title, message, **kwargs)

    def warning(self, title: str, message: str, **kwargs):
        """Send warning notification"""
        self.send(NotificationLevel.WARNING, title, message, **kwargs)

    def error(self, title: str, message: str, **kwargs):
        """Send error notification"""
        self.send(NotificationLevel.ERROR, title, message, **kwargs)

    def success(self, title: str, message: str, **kwargs):
        """Send success notification"""
        self.send(NotificationLevel.SUCCESS, title, message, **kwargs)

    def _handle_console(self, notification: Notification):
        """Handle console notifications"""
        # ANSI color codes
        colors = {
            NotificationLevel.INFO: "\033[36m",      # Cyan
            NotificationLevel.WARNING: "\033[33m",   # Yellow
            NotificationLevel.ERROR: "\033[31m",     # Red
            NotificationLevel.SUCCESS: "\033[32m",   # Green
        }
        reset = "\033[0m"

        color = colors.get(notification.level, "")
        icon = {
            NotificationLevel.INFO: "ℹ",
            NotificationLevel.WARNING: "⚠",
            NotificationLevel.ERROR: "✗",
            NotificationLevel.SUCCESS: "✓",
        }.get(notification.level, "•")

        print(f"{color}{icon} [{notification.level.value.upper()}] {notification.title}{reset}")
        print(f"  {notification.message}")

        if notification.repository:
            print(f"  Repository: {notification.repository}")
        if notification.branch:
            print(f"  Branch: {notification.branch}")

        print()  # Empty line

    def _handle_file(self, notification: Notification):
        """Handle file-based notifications"""
        try:
            log_entry = {
                "timestamp": notification.timestamp.isoformat(),
                "level": notification.level.value,
                "title": notification.title,
                "message": notification.message,
                "repository": notification.repository,
                "branch": notification.branch,
                "operation": notification.operation,
                "metadata": notification.metadata
            }

            # Append to log file
            with open(self.config.file_path, 'a') as f:
                f.write(json.dumps(log_entry) + '\n')

        except Exception as e:
            logger.error(f"Failed to write notification to file: {e}")

    def _handle_webhook(self, notification: Notification):
        """Handle generic webhook notifications"""
        # Kept for backward compatibility
        logger.debug("Generic webhook handler - use Slack handler for Slack webhooks")

    def _handle_slack(self, notification: Notification):
        """Handle Slack notifications with rich formatting"""
        if not self.config.slack_webhook_url:
            logger.debug("Slack webhook URL not configured, skipping Slack notification")
            return

        try:
            # Emoji mapping for levels
            emoji_map = {
                NotificationLevel.INFO: ":information_source:",
                NotificationLevel.WARNING: ":warning:",
                NotificationLevel.ERROR: ":x:",
                NotificationLevel.SUCCESS: ":white_check_mark:",
            }

            # Color mapping for Slack attachments
            color_map = {
                NotificationLevel.INFO: "#36a64f",      # Green
                NotificationLevel.WARNING: "#ff9900",   # Orange
                NotificationLevel.ERROR: "#ff0000",     # Red
                NotificationLevel.SUCCESS: "#00ff00",   # Bright green
            }

            # Build fields for attachment
            fields = []
            if notification.repository:
                fields.append({
                    "title": "Repository",
                    "value": notification.repository,
                    "short": True
                })
            if notification.branch:
                fields.append({
                    "title": "Branch",
                    "value": notification.branch,
                    "short": True
                })
            if notification.operation:
                fields.append({
                    "title": "Operation",
                    "value": notification.operation,
                    "short": True
                })

            # Prepare Slack payload
            payload = {
                "text": f"{emoji_map.get(notification.level, ':bell:')} *{notification.title}*",
                "attachments": [
                    {
                        "color": color_map.get(notification.level, "#808080"),
                        "text": notification.message,
                        "fields": fields,
                        "footer": "Nava Ops",
                        "ts": int(notification.timestamp.timestamp())
                    }
                ]
            }

            # Send to Slack
            data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(
                self.config.slack_webhook_url,
                data=data,
                headers={'Content-Type': 'application/json'}
            )

            with urllib.request.urlopen(req, timeout=10) as response:
                if response.status == 200:
                    logger.info("Slack notification sent successfully")
                else:
                    logger.warning(f"Slack notification returned status {response.status}")

        except urllib.error.URLError as e:
            logger.error(f"Failed to send Slack notification (network error): {e}")
        except Exception as e:
            logger.error(f"Failed to send Slack notification: {e}")

    def _handle_email(self, notification: Notification):
        """Handle email notifications via SMTP"""
        if not self.config.email_smtp_host or not self.config.email_from or not self.config.email_to:
            logger.debug("Email not fully configured, skipping email notification")
            return

        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"[Nava Ops] {notification.title}"
            msg['From'] = self.config.email_from
            msg['To'] = ', '.join(self.config.email_to)

            # Create both plain text and HTML versions
            text_content = f"""
{notification.title}

{notification.message}

Level: {notification.level.value.upper()}
Timestamp: {notification.timestamp.strftime('%Y-%m-%d %H:%M:%S')}
"""

            if notification.repository:
                text_content += f"Repository: {notification.repository}\n"
            if notification.branch:
                text_content += f"Branch: {notification.branch}\n"
            if notification.operation:
                text_content += f"Operation: {notification.operation}\n"

            text_content += "\n---\nSent by Nava Ops Notification System"

            # HTML version
            level_colors = {
                NotificationLevel.INFO: "#17a2b8",
                NotificationLevel.WARNING: "#ffc107",
                NotificationLevel.ERROR: "#dc3545",
                NotificationLevel.SUCCESS: "#28a745",
            }

            html_content = f"""
            <html>
              <head></head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: {level_colors.get(notification.level, '#6c757d')}; color: white; padding: 15px; border-radius: 5px 5px 0 0;">
                    <h2 style="margin: 0;">{notification.title}</h2>
                  </div>
                  <div style="background: #f8f9fa; padding: 20px; border: 1px solid #dee2e6; border-top: none;">
                    <p style="font-size: 16px;">{notification.message}</p>
                    <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
                    <table style="width: 100%; font-size: 14px;">
                      <tr>
                        <td style="padding: 5px; font-weight: bold;">Level:</td>
                        <td style="padding: 5px;">{notification.level.value.upper()}</td>
                      </tr>
                      <tr>
                        <td style="padding: 5px; font-weight: bold;">Timestamp:</td>
                        <td style="padding: 5px;">{notification.timestamp.strftime('%Y-%m-%d %H:%M:%S')}</td>
                      </tr>
"""

            if notification.repository:
                html_content += f"""
                      <tr>
                        <td style="padding: 5px; font-weight: bold;">Repository:</td>
                        <td style="padding: 5px;">{notification.repository}</td>
                      </tr>
"""

            if notification.branch:
                html_content += f"""
                      <tr>
                        <td style="padding: 5px; font-weight: bold;">Branch:</td>
                        <td style="padding: 5px;">{notification.branch}</td>
                      </tr>
"""

            if notification.operation:
                html_content += f"""
                      <tr>
                        <td style="padding: 5px; font-weight: bold;">Operation:</td>
                        <td style="padding: 5px;">{notification.operation}</td>
                      </tr>
"""

            html_content += """
                    </table>
                  </div>
                  <div style="background: #e9ecef; padding: 10px; text-align: center; font-size: 12px; color: #6c757d; border-radius: 0 0 5px 5px;">
                    Sent by Nava Ops Notification System
                  </div>
                </div>
              </body>
            </html>
            """

            # Attach parts
            part1 = MIMEText(text_content, 'plain')
            part2 = MIMEText(html_content, 'html')
            msg.attach(part1)
            msg.attach(part2)

            # Send email
            with smtplib.SMTP(self.config.email_smtp_host, self.config.email_smtp_port) as server:
                if self.config.email_use_tls:
                    server.starttls()

                if self.config.email_username and self.config.email_password:
                    server.login(self.config.email_username, self.config.email_password)

                server.send_message(msg)
                logger.info(f"Email notification sent to {', '.join(self.config.email_to)}")

        except smtplib.SMTPException as e:
            logger.error(f"Failed to send email notification (SMTP error): {e}")
        except Exception as e:
            logger.error(f"Failed to send email notification: {e}")

    def notify(self, title: str, message: str, level: NotificationLevel = NotificationLevel.INFO, **kwargs):
        """
        Send a simple notification (convenience method)

        Args:
            title: Notification title
            message: Notification message
            level: Notification level (default: INFO)
            **kwargs: Additional arguments for send()
        """
        self.send(level, title, message, **kwargs)

    def configure_file(self, file_path: str):
        """Configure file notification channel"""
        self.config.file_path = file_path
        self.config.file_enabled = True
        if NotificationChannel.FILE not in self.channels:
            self.channels.append(NotificationChannel.FILE)

    def configure_slack(self, webhook_url: str):
        """Configure Slack notification channel"""
        self.config.slack_webhook_url = webhook_url
        self.config.slack_enabled = True
        if NotificationChannel.SLACK not in self.channels:
            self.channels.append(NotificationChannel.SLACK)

    def configure_email(self, smtp_host: str, smtp_port: int,
                       from_addr: str, to_addrs: List[str],
                       username: Optional[str] = None,
                       password: Optional[str] = None,
                       use_tls: bool = True):
        """Configure email notification channel"""
        self.config.email_smtp_host = smtp_host
        self.config.email_smtp_port = smtp_port
        self.config.email_from = from_addr
        self.config.email_to = to_addrs
        self.config.email_username = username
        self.config.email_password = password
        self.config.email_use_tls = use_tls
        self.config.email_enabled = True
        if NotificationChannel.EMAIL not in self.channels:
            self.channels.append(NotificationChannel.EMAIL)

    def get_notifications(
        self,
        level: Optional[NotificationLevel] = None,
        limit: Optional[int] = None
    ) -> List[Notification]:
        """
        Get notifications

        Args:
            level: Filter by notification level
            limit: Maximum number to return

        Returns:
            List of notifications
        """
        notifications = self.notifications

        if level:
            notifications = [n for n in notifications if n.level == level]

        if limit:
            notifications = notifications[-limit:]

        return notifications

    def clear_notifications(self):
        """Clear all stored notifications"""
        self.notifications = []
        logger.info("Cleared all notifications")


# Global notification manager
_global_notifier = NotificationManager()


def send_notification(
    level: NotificationLevel,
    title: str,
    message: str,
    **kwargs
):
    """Send a global notification"""
    _global_notifier.send(level, title, message, **kwargs)


def info(title: str, message: str, **kwargs):
    """Send info notification"""
    _global_notifier.info(title, message, **kwargs)


def warning(title: str, message: str, **kwargs):
    """Send warning notification"""
    _global_notifier.warning(title, message, **kwargs)


def error(title: str, message: str, **kwargs):
    """Send error notification"""
    _global_notifier.error(title, message, **kwargs)


def success(title: str, message: str, **kwargs):
    """Send success notification"""
    _global_notifier.success(title, message, **kwargs)


def get_notifier() -> NotificationManager:
    """Get the global notification manager"""
    return _global_notifier


# Integration with operations

def notify_operation_start(repository: str, branch: str, operation: str):
    """Notify when operation starts"""
    info(
        title=f"Operation Started: {operation}",
        message=f"Starting {operation} on {repository}/{branch}",
        repository=repository,
        branch=branch,
        operation=operation
    )


def notify_operation_success(repository: str, branch: str, operation: str):
    """Notify when operation succeeds"""
    success(
        title=f"Operation Successful: {operation}",
        message=f"Completed {operation} on {repository}/{branch}",
        repository=repository,
        branch=branch,
        operation=operation
    )


def notify_operation_error(repository: str, branch: str, operation: str, error_msg: str):
    """Notify when operation fails"""
    error(
        title=f"Operation Failed: {operation}",
        message=f"Failed {operation} on {repository}/{branch}: {error_msg}",
        repository=repository,
        branch=branch,
        operation=operation,
        metadata={"error": error_msg}
    )
