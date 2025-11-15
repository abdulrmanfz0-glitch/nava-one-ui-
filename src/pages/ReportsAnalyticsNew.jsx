// NAVA OPS - Enterprise Reports & Analytics Hub
// Comprehensive reporting platform with AI insights and advanced analytics

import React, { useState, useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import PageHeader from '@/components/UI/PageHeader';
import {
  BarChart3, Download, Calendar, TrendingUp, FileText, DollarSign,
  Users, Package, Target, AlertTriangle, Crown, Layers, GitCompare,
  Clock, Settings, Play, Eye, ChevronRight, Sparkles
} from 'lucide-react';
import { reportEngine } from '@/lib/reportEngine';
import { REPORT_TYPES, REPORT_CATEGORIES, getReportsByCategory } from '@/lib/reportTypes';
import { exportReport } from '@/lib/exportEngine';
import ReportFilters from '@/components/Reports/ReportFilters';
import FinancialOverview from '@/components/Reports/FinancialOverview';
import MenuEngineering from '@/components/Reports/MenuEngineering';
import ChannelPerformanceReport from '@/components/Reports/ChannelPerformanceReport';

export default function ReportsAnalyticsNew() {
  const { addNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('builder');
  const [selectedReportType, setSelectedReportType] = useState(null);
  const [filters, setFilters] = useState({
    period: 'LAST_30_DAYS',
    branchId: null,
    category: null
  });
  const [generatedReport, setGeneratedReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recentReports, setRecentReports] = useState([]);

  useEffect(() => {
    // Load recent reports from localStorage
    const saved = localStorage.getItem('nava_recent_reports');
    if (saved) {
      setRecentReports(JSON.parse(saved));
    }
  }, []);

  const handleGenerateReport = async () => {
    if (!selectedReportType) {
      addNotification({
        title: 'Warning',
        message: 'Please select a report type',
        type: 'warning'
      });
      return;
    }

    try {
      setIsGenerating(true);
      addNotification({
        title: 'Info',
        message: 'Generating report with AI insights...',
        type: 'info'
      });

      // Generate report using the engine
      const report = await reportEngine.generateReport(selectedReportType, filters);
      setGeneratedReport(report);

      // Save to recent reports
      const recent = [
        { ...report, timestamp: new Date().toISOString() },
        ...recentReports.slice(0, 9)
      ];
      setRecentReports(recent);
      localStorage.setItem('nava_recent_reports', JSON.stringify(recent));

      // Switch to view tab
      setActiveTab('view');

      addNotification({
        title: 'Success',
        message: 'Report generated successfully with AI insights',
        type: 'success'
      });
    } catch (error) {
      console.error('Report generation failed:', error);
      addNotification({
        title: 'Error',
        message: `Failed to generate report: ${error.message}`,
        type: 'error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async (format) => {
    if (!generatedReport) return;

    try {
      addNotification({
        title: 'Info',
        message: `Exporting report as ${format.toUpperCase()}...`,
        type: 'info'
      });

      const filename = `${generatedReport.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${format}`;
      await exportReport(generatedReport, format, filename);

      addNotification({
        title: 'Success',
        message: 'Report exported successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Export failed:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to export report',
        type: 'error'
      });
    }
  };

  const handleViewReport = (report) => {
    setGeneratedReport(report);
    setActiveTab('view');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enterprise Reports & Analytics"
        subtitle="AI-powered reporting with advanced insights and analytics"
        icon={BarChart3}
        badge={{
          text: 'AI-Powered',
          icon: Sparkles,
          color: 'purple'
        }}
      />

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px">
            <TabButton
              active={activeTab === 'builder'}
              onClick={() => setActiveTab('builder')}
              icon={Settings}
              label="Report Builder"
            />
            <TabButton
              active={activeTab === 'view'}
              onClick={() => setActiveTab('view')}
              icon={Eye}
              label="View Report"
              disabled={!generatedReport}
            />
            <TabButton
              active={activeTab === 'templates'}
              onClick={() => setActiveTab('templates')}
              icon={FileText}
              label="Templates"
            />
            <TabButton
              active={activeTab === 'history'}
              onClick={() => setActiveTab('history')}
              icon={Clock}
              label="History"
            />
          </nav>
        </div>

        <div className="p-6">
          {/* Report Builder Tab */}
          {activeTab === 'builder' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Report Type Selection */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Select Report Type
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(REPORT_CATEGORIES).map(([key, category]) => {
                        const reports = getReportsByCategory(category);
                        if (reports.length === 0) return null;

                        return (
                          <div key={key}>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase">
                              {category.replace('_', ' ')} Reports
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {reports.map(report => (
                                <ReportTypeCard
                                  key={report.id}
                                  report={report}
                                  selected={selectedReportType === report.id}
                                  onClick={() => setSelectedReportType(report.id)}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Filters & Actions */}
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 sticky top-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Report Configuration
                    </h3>

                    {selectedReportType && (
                      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                          Selected Report
                        </div>
                        <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                          {REPORT_TYPES[selectedReportType.toUpperCase()]?.name}
                        </div>
                        <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                          {REPORT_TYPES[selectedReportType.toUpperCase()]?.description}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleGenerateReport}
                      disabled={!selectedReportType || isGenerating}
                      className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400
                               text-white rounded-lg transition-colors duration-200 flex items-center
                               justify-center gap-2 font-medium disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5" />
                          Generate Report
                        </>
                      )}
                    </button>

                    {selectedReportType && REPORT_TYPES[selectedReportType.toUpperCase()]?.aiInsights && (
                      <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-2 text-sm text-purple-900 dark:text-purple-200">
                          <Sparkles className="w-4 h-4" />
                          <span className="font-medium">AI Insights Enabled</span>
                        </div>
                        <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                          This report includes automated insights and recommendations
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Filters */}
              <ReportFilters
                filters={filters}
                onFilterChange={setFilters}
                onApply={() => {}}
              />
            </div>
          )}

          {/* View Report Tab */}
          {activeTab === 'view' && generatedReport && (
            <div className="space-y-6">
              {/* Report Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {generatedReport.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">{generatedReport.subtitle}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>Generated: {new Date(generatedReport.generatedAt).toLocaleString()}</span>
                    <span>•</span>
                    <span>Report ID: {generatedReport.id}</span>
                    <span>•</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded">
                      {generatedReport.metadata.confidence} confidence
                    </span>
                  </div>
                </div>

                {/* Export Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg
                             transition-colors duration-200 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                  <button
                    onClick={() => handleExport('excel')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg
                             transition-colors duration-200 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Excel
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                             transition-colors duration-200 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                </div>
              </div>

              {/* Report Content */}
              {generatedReport.type === 'financial_overview' && (
                <FinancialOverview reportData={generatedReport} />
              )}
              {generatedReport.type === 'menu_engineering' && (
                <MenuEngineering reportData={generatedReport} />
              )}
              {generatedReport.type === 'channel_performance' && (
                <ChannelPerformanceReport reportData={generatedReport} />
              )}

              {/* Default Report View for other types */}
              {!['financial_overview', 'menu_engineering', 'channel_performance'].includes(generatedReport.type) && (
                <div className="space-y-6">
                  {generatedReport.executiveSummary && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Executive Summary
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {generatedReport.executiveSummary}
                      </p>
                    </div>
                  )}

                  {generatedReport.insights && generatedReport.insights.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        AI-Generated Insights
                      </h3>
                      <div className="space-y-3">
                        {generatedReport.insights.map((insight, index) => (
                          <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {insight.title}
                            </h4>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {insight.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Report Templates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Daily Flash Report', category: 'executive', icon: Crown },
                  { name: 'Weekly Performance', category: 'performance', icon: TrendingUp },
                  { name: 'Monthly Financial', category: 'financial', icon: DollarSign },
                  { name: 'Branch Comparison', category: 'comparative', icon: GitCompare },
                  { name: 'Customer Insights', category: 'customer', icon: Users },
                  { name: 'Anomaly Detection', category: 'anomaly', icon: AlertTriangle }
                ].map((template, index) => (
                  <button
                    key={index}
                    className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl
                             hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left"
                  >
                    <template.icon className="w-8 h-8 text-blue-600 mb-3" />
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {template.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {template.category} report template
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Reports
              </h3>
              {recentReports.length > 0 ? (
                <div className="space-y-3">
                  {recentReports.map((report, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-center justify-between
                               hover:shadow-md transition-shadow duration-200 cursor-pointer"
                      onClick={() => handleViewReport(report)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {report.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(report.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No recent reports</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors
        ${active
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );
}

function ReportTypeCard({ report, selected, onClick }) {
  const iconMap = {
    DollarSign, TrendingUp, Users, Package, Target, AlertTriangle, Crown, Layers, GitCompare, FileText
  };
  const Icon = iconMap[report.icon] || FileText;

  const colorClasses = {
    green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-300',
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-300',
    red: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-300',
    purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-300',
    orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-300',
    cyan: 'bg-cyan-100 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 border-cyan-300',
    teal: 'bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border-teal-300',
    pink: 'bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 border-pink-300',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-300',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-300',
    violet: 'bg-violet-100 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-300',
    lime: 'bg-lime-100 dark:bg-lime-900/20 text-lime-600 dark:text-lime-400 border-lime-300',
    gold: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-300',
    gray: 'bg-gray-100 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400 border-gray-300'
  };

  return (
    <button
      onClick={onClick}
      className={`
        p-4 rounded-lg border-2 transition-all duration-200 text-left
        ${selected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-105'
          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:shadow-md'
        }
      `}
    >
      <div className={`inline-flex p-2 rounded-lg mb-2 ${colorClasses[report.color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
        {report.name}
      </h4>
      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
        {report.description}
      </p>
      {report.aiInsights && (
        <div className="mt-2 flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
          <Sparkles className="w-3 h-3" />
          AI Insights
        </div>
      )}
    </button>
  );
}
