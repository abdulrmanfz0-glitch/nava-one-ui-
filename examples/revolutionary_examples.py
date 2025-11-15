"""
Revolutionary Examples - Nava Ops v2.0

Demonstrates the next-generation reporting capabilities including:
- Advanced analytics with health scoring
- Interactive HTML reports with visualizations
- Enhanced notifications (Slack, Email, Teams, Discord)
- Report history and trend analysis
- Smart insights and recommendations
- Multiple export formats (CSV, XML, Prometheus, Grafana)
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src import (
    Config,
    MultibranchOrchestrator,
    AdvancedReportingHub,
    EnhancedNotificationConfig,
    EnhancedNotificationChannel,
    NotificationPriority
)


def example_1_advanced_analytics():
    """
    Example 1: Generate comprehensive analytics with health scoring

    Demonstrates:
    - Branch health scoring (0-100)
    - Repository health dashboards
    - Divergence metrics
    - Conflict prediction
    """
    print("\n" + "="*70)
    print("EXAMPLE 1: Advanced Analytics & Health Scoring")
    print("="*70 + "\n")

    # Create configuration
    config = Config.from_file("examples/config.json")

    # Run operations
    orchestrator = MultibranchOrchestrator(config)
    report = orchestrator.fetch_all_branches()

    # Create advanced reporting hub
    reporting_hub = AdvancedReportingHub(
        output_dir="./reports",
        enable_history=True,
        enable_insights=True
    )

    # Generate comprehensive report with analytics
    result = reporting_hub.generate_comprehensive_report(
        report_data=report.to_dict(),
        export_formats=['interactive', 'json'],  # Just interactive HTML for this example
        send_notifications=False
    )

    # Print analytics summary
    if result['analytics']:
        analytics = result['analytics']
        print(f"📊 Analytics Summary:")
        print(f"   • Repository Dashboards: {len(analytics.repository_dashboards)}")
        print(f"   • Branch Health Metrics: {len(analytics.branch_health)}")
        print(f"   • Key Insights: {len(analytics.key_insights)}")
        print(f"\n💡 Top 3 Insights:")
        for insight in analytics.key_insights[:3]:
            print(f"   • {insight}")

    # Print smart insights
    if result['insights']:
        print(f"\n🧠 Smart Insights Generated: {len(result['insights'])}")
        high_priority = [i for i in result['insights'] if i.priority in ['critical', 'high']]
        if high_priority:
            print(f"   • High Priority Items: {len(high_priority)}")
            print(f"\n   Top recommendation: {high_priority[0].title}")
            print(f"   → {high_priority[0].recommendation}")

    print(f"\n✅ Reports generated: {len(result['files_generated'])} files")
    for format_type, filepath in result['files_generated']:
        print(f"   • {format_type}: {filepath}")


def example_2_interactive_visualizations():
    """
    Example 2: Generate interactive HTML with Chart.js visualizations

    Demonstrates:
    - Success rate pie charts
    - Operations timeline
    - Branch health gauges
    - Repository comparison charts
    """
    print("\n" + "="*70)
    print("EXAMPLE 2: Interactive HTML Reports with Visualizations")
    print("="*70 + "\n")

    config = Config.from_file("examples/config.json")
    orchestrator = MultibranchOrchestrator(config)
    report = orchestrator.sync_all_branches()

    # Create reporting hub
    reporting_hub = AdvancedReportingHub(
        output_dir="./reports",
        enable_history=True,
        enable_insights=True
    )

    # Generate ONLY interactive HTML with visualizations
    result = reporting_hub.generate_comprehensive_report(
        report_data=report.to_dict(),
        export_formats=['interactive'],  # Interactive HTML with Chart.js
        send_notifications=False
    )

    reporting_hub.print_summary(result)

    print("\n🎨 Interactive HTML Features:")
    print("   • Success rate doughnut chart")
    print("   • Operations by type bar chart")
    print("   • Repository comparison chart")
    print("   • Branch health horizontal bar chart")
    print("   • Responsive design with hover effects")
    print("   • Beautiful gradient styling")
    print(f"\n👉 Open in browser: {result['files_generated'][0][1]}")


def example_3_multi_format_export():
    """
    Example 3: Export in multiple formats simultaneously

    Demonstrates:
    - CSV (for Excel/Pandas analysis)
    - XML (for enterprise integration)
    - Prometheus metrics (for monitoring)
    - Grafana dashboard JSON
    - Enhanced Markdown with Mermaid diagrams
    - Interactive HTML
    """
    print("\n" + "="*70)
    print("EXAMPLE 3: Multi-Format Export")
    print("="*70 + "\n")

    config = Config.from_file("examples/config.json")
    orchestrator = MultibranchOrchestrator(config)
    report = orchestrator.fetch_all_branches()

    # Create reporting hub
    reporting_hub = AdvancedReportingHub(
        output_dir="./reports/multi_format",
        enable_history=True
    )

    # Export in ALL formats
    result = reporting_hub.generate_comprehensive_report(
        report_data=report.to_dict(),
        export_formats=[
            'json',
            'csv',
            'xml',
            'prometheus',
            'grafana',
            'markdown_enhanced',
            'interactive'
        ],
        send_notifications=False
    )

    print(f"\n📦 Generated {len(result['files_generated'])} files in different formats:")
    print()
    for format_type, filepath in result['files_generated']:
        print(f"   📄 {format_type:20s} → {filepath}")

    print("\n💡 Use Cases:")
    print("   • CSV: Import into Excel or Pandas for analysis")
    print("   • XML: Integrate with enterprise systems")
    print("   • Prometheus: Scrape metrics for monitoring")
    print("   • Grafana: Import dashboard for visualization")
    print("   • Enhanced Markdown: Documentation with Mermaid diagrams")
    print("   • Interactive HTML: Beautiful web-based reports")


def example_4_slack_notifications():
    """
    Example 4: Send notifications to Slack

    Demonstrates:
    - Slack webhook integration
    - Rich message formatting
    - Success rate indicators
    - Key insights delivery
    """
    print("\n" + "="*70)
    print("EXAMPLE 4: Slack Notifications")
    print("="*70 + "\n")

    # Configure notifications (replace with your webhook URL)
    notification_config = EnhancedNotificationConfig(
        slack_webhook_url="https://hooks.slack.com/services/YOUR/WEBHOOK/URL",  # Replace!
        enabled_channels=[EnhancedNotificationChannel.SLACK],
        min_priority=NotificationPriority.MEDIUM
    )

    config = Config.from_file("examples/config.json")
    orchestrator = MultibranchOrchestrator(config)
    report = orchestrator.sync_all_branches()

    # Create reporting hub with notifications
    reporting_hub = AdvancedReportingHub(
        output_dir="./reports",
        notification_config=notification_config,
        enable_notifications=True,
        enable_insights=True
    )

    # Generate report and send Slack notification
    result = reporting_hub.generate_comprehensive_report(
        report_data=report.to_dict(),
        export_formats=['interactive'],
        send_notifications=True,  # Enable notifications
        notification_priority=NotificationPriority.HIGH
    )

    if result['notifications_sent']:
        print("✅ Slack notification sent successfully!")
        print("\n📱 Your Slack channel should now show:")
        print("   • Success rate with color coding")
        print("   • Total operations and branches")
        print("   • Duration")
        print("   • Top 3 key insights")
    else:
        print("ℹ️  Notification not sent (configure webhook URL first)")


def example_5_email_reports():
    """
    Example 5: Send HTML email reports via SMTP

    Demonstrates:
    - SMTP email delivery
    - Beautiful HTML email templates
    - Metrics cards
    - Key insights in email
    """
    print("\n" + "="*70)
    print("EXAMPLE 5: Email Notifications with HTML Templates")
    print("="*70 + "\n")

    # Configure email notifications (replace with your settings)
    notification_config = EnhancedNotificationConfig(
        smtp_host="smtp.gmail.com",  # Replace with your SMTP host
        smtp_port=587,
        smtp_username="your-email@gmail.com",  # Replace!
        smtp_password="your-app-password",  # Replace!
        smtp_from_email="your-email@gmail.com",  # Replace!
        smtp_to_emails=["recipient@example.com"],  # Replace!
        enabled_channels=[EnhancedNotificationChannel.EMAIL],
        min_priority=NotificationPriority.MEDIUM
    )

    config = Config.from_file("examples/config.json")
    orchestrator = MultibranchOrchestrator(config)
    report = orchestrator.fetch_all_branches()

    # Create reporting hub
    reporting_hub = AdvancedReportingHub(
        output_dir="./reports",
        notification_config=notification_config,
        enable_notifications=True,
        enable_insights=True
    )

    # Generate and send email
    result = reporting_hub.generate_comprehensive_report(
        report_data=report.to_dict(),
        export_formats=['interactive'],
        send_notifications=True,
        notification_priority=NotificationPriority.HIGH
    )

    if result['notifications_sent']:
        print("✅ Email sent successfully!")
        print("\n📧 Email includes:")
        print("   • Beautiful HTML template with gradients")
        print("   • Status with color coding")
        print("   • Metric cards (operations, branches, duration)")
        print("   • Top 5 key insights")
    else:
        print("ℹ️  Email not sent (configure SMTP settings first)")


def example_6_report_history_and_trends():
    """
    Example 6: Track report history and analyze trends

    Demonstrates:
    - Report history storage
    - Comparison with previous reports
    - Trend detection (improving/declining)
    - Anomaly detection
    """
    print("\n" + "="*70)
    print("EXAMPLE 6: Report History & Trend Analysis")
    print("="*70 + "\n")

    config = Config.from_file("examples/config.json")
    orchestrator = MultibranchOrchestrator(config)

    # Run multiple operations to build history
    print("🔄 Running multiple operations to build history...")

    reporting_hub = AdvancedReportingHub(
        output_dir="./reports",
        enable_history=True,
        enable_insights=True
    )

    # First report
    report1 = orchestrator.fetch_all_branches()
    result1 = reporting_hub.generate_comprehensive_report(
        report_data=report1.to_dict(),
        export_formats=['json'],
        compare_with_previous=False  # First report, nothing to compare
    )
    print("   ✓ Report 1 saved to history")

    # Second report
    report2 = orchestrator.sync_all_branches()
    result2 = reporting_hub.generate_comprehensive_report(
        report_data=report2.to_dict(),
        export_formats=['json'],
        compare_with_previous=True  # Compare with report 1
    )
    print("   ✓ Report 2 saved to history")

    # Analyze comparison
    if result2['comparison']:
        comp = result2['comparison']
        print(f"\n📊 Comparison Results:")
        print(f"   • Current: {comp.timestamp_current}")
        print(f"   • Previous: {comp.timestamp_previous}")
        print(f"   • Summary: {comp.summary}")

        if comp.improvements:
            print(f"\n✅ Improvements ({len(comp.improvements)}):")
            for improvement in comp.improvements:
                print(f"   • {improvement}")

        if comp.regressions:
            print(f"\n⚠️  Regressions ({len(comp.regressions)}):")
            for regression in comp.regressions:
                print(f"   • {regression}")

        if comp.anomalies:
            print(f"\n🔍 Anomalies Detected ({len(comp.anomalies)}):")
            for anomaly in comp.anomalies:
                print(f"   • {anomaly.description}")

    # Get trend analysis
    trends = reporting_hub.get_trend_analysis(days=7)
    print(f"\n📈 Trend Analysis (7 days):")
    print(f"   • Reports analyzed: {trends.get('report_count', 0)}")
    if trends.get('trends'):
        for trend in trends['trends']:
            print(f"   • {trend['metric']}: {trend['direction']}")


def example_7_smart_insights_and_recommendations():
    """
    Example 7: Generate smart insights and actionable recommendations

    Demonstrates:
    - AI-powered insights
    - Merge strategy recommendations
    - Branch cleanup suggestions
    - Performance optimization tips
    - Security audit insights
    """
    print("\n" + "="*70)
    print("EXAMPLE 7: Smart Insights & Recommendations")
    print("="*70 + "\n")

    config = Config.from_file("examples/config.json")
    orchestrator = MultibranchOrchestrator(config)
    report = orchestrator.sync_all_branches()

    # Create reporting hub with insights enabled
    reporting_hub = AdvancedReportingHub(
        output_dir="./reports",
        enable_history=True,
        enable_insights=True  # Enable smart insights engine
    )

    # Generate comprehensive report
    result = reporting_hub.generate_comprehensive_report(
        report_data=report.to_dict(),
        export_formats=['interactive', 'json']
    )

    # Display insights by category
    if result['insights']:
        insights = result['insights']

        print(f"🧠 Total Insights Generated: {len(insights)}")

        # Group by category
        by_category = {}
        for insight in insights:
            if insight.category not in by_category:
                by_category[insight.category] = []
            by_category[insight.category].append(insight)

        for category, category_insights in by_category.items():
            print(f"\n📋 {category.upper()} ({len(category_insights)} insights):")
            for insight in category_insights[:2]:  # Top 2 per category
                print(f"\n   🔹 {insight.title} [{insight.priority.upper()}]")
                print(f"      {insight.description}")
                print(f"      💡 Recommendation: {insight.recommendation[:100]}...")
                print(f"      Impact: {insight.impact} | Effort: {insight.effort}")

    # Display recommendations
    if result.get('recommendations'):
        print(f"\n\n🎯 TOP RECOMMENDATIONS:")
        for i, rec in enumerate(result['recommendations'], 1):
            print(f"\n{i}. {rec.title} [{rec.priority.upper()}]")
            print(f"   Rationale: {rec.rationale}")
            print(f"   Expected Benefit: {rec.expected_benefit}")
            print(f"   Action Steps:")
            for step in rec.action_steps[:3]:  # Top 3 steps
                print(f"      • {step}")


def example_8_complete_revolution():
    """
    Example 8: The Complete Revolutionary Experience

    Demonstrates ALL features in one powerful workflow:
    - Advanced analytics
    - All export formats
    - Interactive visualizations
    - Notifications (console)
    - Report history
    - Trend analysis
    - Smart insights
    """
    print("\n" + "="*70)
    print("EXAMPLE 8: THE COMPLETE NAVA OPS REVOLUTION")
    print("="*70 + "\n")

    # Configure everything
    notification_config = EnhancedNotificationConfig(
        enabled_channels=[EnhancedNotificationChannel.CONSOLE],  # Console for demo
        min_priority=NotificationPriority.LOW
    )

    config = Config.from_file("examples/config.json")
    orchestrator = MultibranchOrchestrator(config)

    # Create the ultimate reporting hub
    reporting_hub = AdvancedReportingHub(
        output_dir="./reports/revolution",
        history_dir="./reports/history",
        notification_config=notification_config,
        enable_history=True,
        enable_notifications=True,
        enable_insights=True
    )

    print("🚀 Executing comprehensive Git operations...")
    report = orchestrator.sync_all_branches()

    print("\n🎨 Generating revolutionary reports...")
    result = reporting_hub.generate_comprehensive_report(
        report_data=report.to_dict(),
        export_formats=[
            'json',
            'csv',
            'xml',
            'prometheus',
            'grafana',
            'markdown_enhanced',
            'interactive'
        ],
        send_notifications=True,
        notification_priority=NotificationPriority.HIGH,
        compare_with_previous=True
    )

    # Print beautiful summary
    reporting_hub.print_summary(result)

    print("\n🎉 REVOLUTION COMPLETE!")
    print("="*70)


def main():
    """Run all examples"""
    examples = [
        example_1_advanced_analytics,
        example_2_interactive_visualizations,
        example_3_multi_format_export,
        example_4_slack_notifications,
        example_5_email_reports,
        example_6_report_history_and_trends,
        example_7_smart_insights_and_recommendations,
        example_8_complete_revolution
    ]

    print("\n" + "="*70)
    print("🚀 NAVA OPS v2.0 - REVOLUTIONARY EXAMPLES")
    print("="*70)
    print("\nAvailable Examples:")
    for i, example in enumerate(examples, 1):
        print(f"{i}. {example.__doc__.split('Demonstrates:')[0].strip()}")

    print("\n0. Run all examples")
    print("="*70)

    try:
        choice = input("\nSelect an example (0-8): ").strip()

        if choice == '0':
            for example in examples:
                example()
        elif choice.isdigit() and 1 <= int(choice) <= len(examples):
            examples[int(choice) - 1]()
        else:
            print("Invalid choice. Please run again.")
    except KeyboardInterrupt:
        print("\n\nExamples interrupted by user.")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
