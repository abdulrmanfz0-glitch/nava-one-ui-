// NAVA OPS - Enterprise Dashboard
// Professional SaaS Analytics Dashboard with real-time insights

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBrand } from '@/contexts/BrandContext';
import { useNotification } from '@/contexts/NotificationContext';
import api from '@/services/api';
import PageHeader from '@/components/UI/PageHeader';
import StatCard, { StatCardSkeleton } from '@/components/UI/StatCard';
import { RevenueTrendChart, OrdersBarChart, BranchComparisonChart } from '@/components/UI/Charts';
import DateRangePicker from '@/components/UI/DateRangePicker';
import EmptyState from '@/components/UI/EmptyState';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Store,
  AlertCircle,
  Users,
  Activity,
  BarChart3,
  RefreshCw,
  Download,
  Calendar,
  Eye,
  Zap,
  Brain
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { brand } = useBrand();
  const { addNotification } = useNotification();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState(null);
  const [revenueTrends, setRevenueTrends] = useState([]);
  const [branchComparison, setBranchComparison] = useState([]);
  const [insights, setInsights] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branches, setBranches] = useState([]);

  // Date range (default: last 30 days)
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  });

  // Calculate days between dates - Memoized
  const days = useMemo(() => {
    const diffTime = Math.abs(new Date(dateRange.endDate) - new Date(dateRange.startDate));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [dateRange.startDate, dateRange.endDate]);

  // Fetch dashboard data - Memoized callback
  const fetchDashboardData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      // Fetch all data in parallel
      const [overviewData, trendsData, branchesData, insightsData, branchCompData] = await Promise.all([
        api.analytics.getDashboardOverview(selectedBranch, days),
        api.analytics.getRevenueTrends(selectedBranch, days),
        api.branches.getAll(),
        api.insights.getAll({ limit: 5, status: 'new' }),
        api.analytics.getBranchComparison(days)
      ]);

      setOverview(overviewData.overview);
      setRevenueTrends(trendsData);
      setBranches(branchesData);
      setInsights(insightsData);
      setBranchComparison(branchCompData);

      if (!showLoader) {
        addNotification({
          title: 'Success',
          message: 'Dashboard refreshed successfully',
          type: 'success'
        });
      }
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to load dashboard data',
        type: 'error'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedBranch, days, addNotification]);

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, [selectedBranch, dateRange]);

  // Manual refresh - Memoized callback
  const handleRefresh = useCallback(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  // Handle branch selection - Memoized callback
  const handleBranchChange = useCallback((e) => {
    setSelectedBranch(e.target.value || null);
  }, []);

  // Handle date range change - Memoized callback
  const handleDateRangeChange = useCallback(({ startDate, endDate }) => {
    setDateRange({ startDate, endDate });
  }, []);

  return (
    <div className="space-y-6">
      {/* Brand Identity Banner */}
      {brand && (
        <div
          className="rounded-xl shadow-md p-6 text-white"
          style={{
            background: `linear-gradient(135deg, ${brand.primary_color} 0%, ${brand.secondary_color} 100%)`
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {brand.logo_url && (
                <img
                  src={brand.logo_url}
                  alt={brand.name}
                  className="w-16 h-16 rounded-lg bg-white/20 p-2 object-contain"
                />
              )}
              <div>
                <h2 className="text-2xl font-bold">{brand.name}</h2>
                {brand.description && (
                  <p className="text-white/90 mt-1">{brand.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-white/80">
                  {brand.headquarters_city && (
                    <span className="flex items-center gap-1">
                      <Store className="w-4 h-4" />
                      {brand.headquarters_city}, {brand.country}
                    </span>
                  )}
                  {overview && (
                    <span className="flex items-center gap-1">
                      <Activity className="w-4 h-4" />
                      {overview.totalBranches} Branch{overview.totalBranches !== 1 ? 'es' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/brand-settings'}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors duration-200"
            >
              Edit Brand
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${userProfile?.full_name || 'User'}! Here's your business overview.`}
        icon={BarChart3}
        actions={
          <>
            <DateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onDateChange={handleDateRangeChange}
            />
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700
                       text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </>
        }
      />

      {/* Branch Filter */}
      <div className="flex items-center gap-4">
        <select
          value={selectedBranch || ''}
          onChange={handleBranchChange}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Branches</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name} {branch.code ? `(${branch.code})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* AI Intelligence Hub Card */}
      <div
        onClick={() => navigate('/ai-hub')}
        className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-md p-6
                   cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
      >
        <div className="flex items-center gap-4 text-white">
          <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
            <Brain className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1">AI Intelligence Hub</h3>
            <p className="text-white/90 text-sm">Your smart assistant for insights and predictions</p>
          </div>
          <div className="text-white/80">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Revenue"
              value={`SAR ${overview?.totalRevenue?.toLocaleString() || 0}`}
              subtitle={`Last ${days} days`}
              icon={DollarSign}
              color="green"
              trend="up"
              trendValue="+12.5%"
            />
            <StatCard
              title="Total Orders"
              value={overview?.totalOrders?.toLocaleString() || 0}
              subtitle={`Last ${days} days`}
              icon={ShoppingCart}
              color="blue"
              trend="up"
              trendValue="+8.3%"
            />
            <StatCard
              title="Active Branches"
              value={`${overview?.activeBranches || 0} / ${overview?.totalBranches || 0}`}
              subtitle="Branch locations"
              icon={Store}
              color="purple"
              trend="neutral"
              trendValue="Stable"
            />
            <StatCard
              title="Avg Order Value"
              value={`SAR ${overview?.averageOrderValue?.toFixed(2) || 0}`}
              subtitle="Per transaction"
              icon={TrendingUp}
              color="orange"
              trend="up"
              trendValue="+4.2%"
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Revenue Trends
            </h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View Details
            </button>
          </div>
          <RevenueTrendChart data={revenueTrends} loading={loading} />
        </div>

        {/* Branch Comparison */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Branch Performance
            </h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Compare All
            </button>
          </div>
          <BranchComparisonChart data={branchComparison.slice(0, 5)} loading={loading} />
        </div>
      </div>

      {/* Insights and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insights */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                AI Insights & Recommendations
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {insights.length} new
              </span>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : insights.length === 0 ? (
              <EmptyState
                icon={Zap}
                title="No Insights Yet"
                message="AI insights will appear here as your data grows."
              />
            ) : (
              <div className="space-y-4">
                {insights.slice(0, 5).map((insight) => (
                  <div
                    key={insight.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg
                             hover:border-blue-300 dark:hover:border-blue-600 transition-colors duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        p-2 rounded-lg
                        ${insight.severity === 'critical' ? 'bg-red-100 text-red-600 dark:bg-red-900/20' : ''}
                        ${insight.severity === 'warning' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20' : ''}
                        ${insight.severity === 'info' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20' : ''}
                      `}>
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                          {insight.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {insight.description}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                            {insight.insight_type}
                          </span>
                          {insight.confidence_score && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {(insight.confidence_score * 100).toFixed(0)}% confidence
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & Stats */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600
                               hover:from-blue-600 hover:to-blue-700 text-white rounded-lg
                               transition-all duration-200 transform hover:scale-105">
                <Download className="w-5 h-5" />
                <span className="font-medium">Generate Report</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-gray-700
                               hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg
                               transition-colors duration-200">
                <Store className="w-5 h-5" />
                <span className="font-medium">Add Branch</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-gray-700
                               hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg
                               transition-colors duration-200">
                <Users className="w-5 h-5" />
                <span className="font-medium">Invite Team Member</span>
              </button>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              System Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Data Sync</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">● Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">API Status</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">● Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Last Updated</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Just now</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[
              { action: 'New order received', branch: 'Downtown Branch', time: '2 minutes ago', icon: ShoppingCart, color: 'blue' },
              { action: 'Monthly report generated', branch: 'All Branches', time: '1 hour ago', icon: Download, color: 'green' },
              { action: 'Inventory alert', branch: 'Westside Branch', time: '3 hours ago', icon: AlertCircle, color: 'orange' },
              { action: 'Team member joined', branch: 'System', time: '5 hours ago', icon: Users, color: 'purple' }
            ].map((activity, index) => {
              const colorClasses = {
                blue: { bg: 'bg-blue-100 dark:bg-blue-900/20', icon: 'text-blue-600 dark:text-blue-400' },
                green: { bg: 'bg-green-100 dark:bg-green-900/20', icon: 'text-green-600 dark:text-green-400' },
                orange: { bg: 'bg-orange-100 dark:bg-orange-900/20', icon: 'text-orange-600 dark:text-orange-400' },
                purple: { bg: 'bg-purple-100 dark:bg-purple-900/20', icon: 'text-purple-600 dark:text-purple-400' }
              };
              const colors = colorClasses[activity.color] || colorClasses.blue;

              return (
                <div key={index} className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-750 rounded-lg transition-colors duration-200">
                  <div className={`p-2 rounded-lg ${colors.bg}`}>
                    <activity.icon className={`w-5 h-5 ${colors.icon}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{activity.action}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{activity.branch}</p>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{activity.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
