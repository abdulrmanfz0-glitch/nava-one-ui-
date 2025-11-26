# NAVA One UI - Backend

This directory contains Python backend utilities for Git operations, analytics, and reporting.

## Structure

```
backend/
└── src/
    ├── __init__.py
    ├── __main__.py
    ├── api.py                      # API endpoints
    ├── cli.py                      # CLI commands
    ├── config.py                   # Configuration
    ├── analytics.py                # Analytics engine
    ├── advanced_ops.py             # Advanced operations
    ├── advanced_reporting.py       # Advanced reporting
    ├── branch_comparison.py        # Branch comparison tools
    ├── branch_ops.py               # Branch operations
    ├── conflict_resolution.py      # Conflict resolution
    ├── enhanced_notifications.py   # Notification system
    ├── export_formats.py           # Export utilities
    ├── hooks.py                    # Git hooks
    ├── init_config.py              # Initialization
    ├── interactive_html.py         # HTML generation
    ├── notifications.py            # Notifications
    ├── orchestrator.py             # Operation orchestration
    ├── report_history.py           # Report history
    ├── reporting.py                # Reporting engine
    ├── smart_insights.py           # AI insights
    └── utils.py                    # Utilities
```

## Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Usage

See ARCHITECTURE.md in the root directory for detailed documentation.
