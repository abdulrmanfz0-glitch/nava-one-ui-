"""
Nava Ops - Next-Generation Git Orchestration & Reporting System

A revolutionary, modular Python system for managing Git operations across
multiple branches and repositories with advanced analytics, interactive
visualizations, and intelligent insights.

🚀 Version 2.0 - Reporting Revolution Edition
"""

__version__ = "2.0.0"

# Core modules
from .config import Config
from .branch_ops import BranchOperations
from .reporting import ReportGenerator
from .orchestrator import MultibranchOrchestrator

# Advanced modules
from .cli import NavaOpsCLI
from .conflict_resolution import (
    ConflictDetector,
    ConflictResolver,
    ResolutionStrategy,
    preview_merge_conflicts,
    resolve_merge_conflicts
)
from .branch_comparison import (
    BranchAnalyzer,
    BranchComparison,
    BranchDivergence,
    compare_branches,
    analyze_branch_divergence
)
from .advanced_ops import AdvancedGitOperations
from .hooks import (
    HookManager,
    HookEvent,
    register_hook,
    trigger_hook,
    get_hook_manager
)
from .notifications import (
    NotificationManager,
    NotificationLevel,
    NotificationChannel,
    send_notification,
    get_notifier
)

# Revolutionary v2.0 modules - Next-Generation Reporting
from .analytics import (
    AdvancedAnalyticsEngine,
    AnalyticsReport,
    BranchHealthMetrics,
    RepositoryHealthDashboard,
    ConflictHeatmap,
    MergeSuccessMetrics,
    DivergenceMetrics
)
from .export_formats import EnhancedExportFormats
from .interactive_html import InteractiveHTMLGenerator
from .enhanced_notifications import (
    EnhancedNotificationManager,
    EnhancedNotificationConfig,
    EnhancedNotificationChannel,
    NotificationPriority
)
from .report_history import (
    ReportHistoryManager,
    HistoricalTrend,
    Anomaly,
    ComparisonResult
)
from .smart_insights import (
    SmartInsightsEngine,
    Insight,
    SmartRecommendation
)
from .advanced_reporting import AdvancedReportingHub

__all__ = [
    # Core
    "Config",
    "BranchOperations",
    "ReportGenerator",
    "MultibranchOrchestrator",
    # CLI
    "NavaOpsCLI",
    # Conflict Resolution
    "ConflictDetector",
    "ConflictResolver",
    "ResolutionStrategy",
    "preview_merge_conflicts",
    "resolve_merge_conflicts",
    # Branch Comparison
    "BranchAnalyzer",
    "BranchComparison",
    "BranchDivergence",
    "compare_branches",
    "analyze_branch_divergence",
    # Advanced Operations
    "AdvancedGitOperations",
    # Hooks
    "HookManager",
    "HookEvent",
    "register_hook",
    "trigger_hook",
    "get_hook_manager",
    # Notifications
    "NotificationManager",
    "NotificationLevel",
    "NotificationChannel",
    "send_notification",
    "get_notifier",
    # Revolutionary v2.0 - Advanced Analytics
    "AdvancedAnalyticsEngine",
    "AnalyticsReport",
    "BranchHealthMetrics",
    "RepositoryHealthDashboard",
    "ConflictHeatmap",
    "MergeSuccessMetrics",
    "DivergenceMetrics",
    # Enhanced Export Formats
    "EnhancedExportFormats",
    "InteractiveHTMLGenerator",
    # Enhanced Notifications
    "EnhancedNotificationManager",
    "EnhancedNotificationConfig",
    "EnhancedNotificationChannel",
    "NotificationPriority",
    # Report History & Trends
    "ReportHistoryManager",
    "HistoricalTrend",
    "Anomaly",
    "ComparisonResult",
    # Smart Insights
    "SmartInsightsEngine",
    "Insight",
    "SmartRecommendation",
    # Advanced Reporting Hub (Unified Interface)
    "AdvancedReportingHub",
]
