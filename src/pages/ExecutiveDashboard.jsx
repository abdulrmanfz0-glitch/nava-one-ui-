// NAVA OPS - Executive Overview Dashboard
// High-level KPI dashboard for executives with real-time insights

import React, { useState, useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import api from '@/services/api';
import PageHeader from '@/components/UI/PageHeader';
import StatCard from '@/components/UI/StatCard';
import { RevenueTrendChart } from '@/components/UI/Charts';
import {
  Crown, DollarSign, TrendingUp, Users, Building, ShoppingCart,
  AlertTriangle, CheckCircle, Clock, Target, Zap, BarChart3,
  ArrowUp, ArrowDown, Activity, Globe
} from 'lucide-react';
import aiEngine from '@/lib/aiEngine';

export default function ExecutiveDashboard() {
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [overview, trends, branches, topPerformers] = await Promise.all([
        api.analytics.getDashboardOverview(null, parseInt(selectedPeriod)),
        api.analytics.getRevenueTrends(null, parseInt(selectedPeriod)),
        api.analytics.getBranchComparison(parseInt(selectedPeriod)),
        api.analytics.getTopPerformers(null, parseInt(selectedPeriod), 5)
      ]);

      // Generate AI forecast
      let forecast = null;
      if (trends.length >= 7) {
        forecast = aiEngine.forecastRevenue(trends, 7);
      }

      setDashboardData({
        overview,
        trends,
        branches,
        topPerformers,
        forecast
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to load dashboard data',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const { overview, trends, branches, topPerformers, forecast } = dashboardData;

  // Calculate growth rates
  const revenueGrowth = trends.length >= 2
    ? ((trends[trends.length - 1].revenue - trends[0].revenue) / trends[0].revenue * 100).toFixed(1)
    : 0;

  // Performance score (0-100)
  const performanceScore = Math.min(100, Math.round(
    (overview.overview.totalRevenue / 1000000) * 20 +
    (overview.overview.totalOrders / 1000) * 20 +
    (branches.filter(b => b.status === 'active').length / branches.length) * 20
  ));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Overview"
        subtitle="Real-time business intelligence and key performance indicators"
        icon={Crown}
        badge={{
          text: 'Live Data',
          icon: Activity,
          color: 'green'
        }}
        actions={
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
        }
      />

      {/* Performance Score Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Target className="w-8 h-8" />
              </div>
              <div>
                <div className="text-sm opacity-90">Overall Performance</div>
                <div className="text-4xl font-bold">{performanceScore}%</div>
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="bg-white rounded-full h-3 transition-all duration-500"
                style={{ width: `${performanceScore}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 rounded-lg">
              <DollarSign className="w-12 h-12" />
            </div>
            <div>
              <div className="text-sm opacity-90">Total Revenue</div>
              <div className="text-3xl font-bold">
                SAR {overview.overview.totalRevenue.toLocaleString()}
              </div>
              <div className="flex items-center gap-1 text-sm mt-1">
                {revenueGrowth > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                <span>{Math.abs(revenueGrowth)}% vs last period</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 rounded-lg">
              <Building className="w-12 h-12" />
            </div>
            <div>
              <div className="text-sm opacity-90">Active Branches</div>
              <div className="text-3xl font-bold">
                {overview.overview.activeBranches} / {overview.overview.totalBranches}
              </div>
              <div className="text-sm mt-1">
                {Math.round((overview.overview.activeBranches / overview.overview.totalBranches) * 100)}% operational
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Orders"
          value={overview.overview.totalOrders.toLocaleString()}
          subtitle={`${selectedPeriod} days`}
          icon={ShoppingCart}
          color="blue"
          trend="up"
          trendValue="+12.5%"
          loading={false}
        />
        <StatCard
          title="Avg Order Value"
          value={`SAR ${overview.overview.averageOrderValue.toFixed(2)}`}
          subtitle="Per transaction"
          icon={TrendingUp}
          color="green"
          trend="up"
          trendValue="+8.3%"
          loading={false}
        />
        <StatCard
          title="Active Branches"
          value={overview.overview.activeBranches}
          subtitle="Operational units"
          icon={Building}
          color="purple"
          loading={false}
        />
        <StatCard
          title="Critical Alerts"
          value={overview.insights?.length || 0}
          subtitle="Require attention"
          icon={AlertTriangle}
          color="orange"
          loading={false}
        />
      </div>

      {/* Charts & Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trends */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Revenue Trends & Forecast
            </h3>
            {forecast && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400
                           rounded-full text-sm font-medium flex items-center gap-1">
                <Zap className="w-4 h-4" />
                AI Forecast
              </span>
            )}
          </div>
          <RevenueTrendChart data={trends} loading={false} />

          {forecast && forecast.success && (
            <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    7-Day Forecast: {forecast.trend.charAt(0).toUpperCase() + forecast.trend.slice(1)} Trend
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Predicted revenue for next week: SAR {Math.round(forecast.predictions[6].predictedRevenue).toLocaleString()}
                    <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                      ({forecast.confidence} confidence)
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Stats
            </h3>
            <div className="space-y-4">
              <QuickStat
                label="Daily Avg Revenue"
                value={`SAR ${Math.round(overview.overview.totalRevenue / parseInt(selectedPeriod)).toLocaleString()}`}
                icon={DollarSign}
                color="green"
              />
              <QuickStat
                label="Daily Avg Orders"
                value={Math.round(overview.overview.totalOrders / parseInt(selectedPeriod))}
                icon={ShoppingCart}
                color="blue"
              />
              <QuickStat
                label="Revenue per Branch"
                value={`SAR ${Math.round(overview.overview.totalRevenue / overview.overview.activeBranches).toLocaleString()}`}
                icon={Building}
                color="purple"
              />
              <QuickStat
                label="Orders per Branch"
                value={Math.round(overview.overview.totalOrders / overview.overview.activeBranches)}
                icon={Target}
                color="orange"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Branch Performance & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Branches */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            Top Performing Branches
          </h3>
          <div className="space-y-3">
            {branches.slice(0, 5).map((branch, index) => (
              <BranchRankCard key={branch.id} branch={branch} rank={index + 1} />
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Top Performing Products
          </h3>
          <div className="space-y-3">
            {topPerformers.map((product, index) => (
              <ProductRankCard key={index} product={product} rank={index + 1} />
            ))}
          </div>
        </div>
      </div>

      {/* Critical Insights */}
      {overview.insights && overview.insights.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Critical Insights & Alerts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {overview.insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuickStat({ label, value, icon: Icon, color }) {
  const colorClasses = {
    green: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20'
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      </div>
      <span className="text-sm font-bold text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

function BranchRankCard({ branch, rank }) {
  const medals = ['🥇', '🥈', '🥉'];
  const medal = rank <= 3 ? medals[rank - 1] : `#${rank}`;

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg
                  hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-3">
        <div className="text-2xl w-8">{medal}</div>
        <div>
          <div className="font-semibold text-gray-900 dark:text-white">{branch.name}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{branch.city}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-bold text-gray-900 dark:text-white">
          SAR {branch.revenue.toLocaleString()}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {branch.orders} orders
        </div>
      </div>
    </div>
  );
}

function ProductRankCard({ product, rank }) {
  const medals = ['🥇', '🥈', '🥉'];
  const medal = rank <= 3 ? medals[rank - 1] : `#${rank}`;

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="text-2xl w-8">{medal}</div>
        <div>
          <div className="font-semibold text-gray-900 dark:text-white">{product.name}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {product.quantity} sold
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-bold text-gray-900 dark:text-white">
          SAR {Math.round(product.revenue).toLocaleString()}
        </div>
      </div>
    </div>
  );
}

function InsightCard({ insight }) {
  const severityIcons = {
    high: AlertTriangle,
    warning: AlertTriangle,
    medium: Clock,
    info: CheckCircle
  };

  const severityColors = {
    high: 'border-red-500 bg-red-50 dark:bg-red-900/10',
    warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10',
    medium: 'border-blue-500 bg-blue-50 dark:bg-blue-900/10',
    info: 'border-green-500 bg-green-50 dark:bg-green-900/10'
  };

  const Icon = severityIcons[insight.severity] || CheckCircle;

  return (
    <div className={`p-4 rounded-lg border-l-4 ${severityColors[insight.severity] || severityColors.info}`}>
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
            {insight.insight_title || insight.title}
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {insight.insight_description || insight.description}
          </p>
        </div>
      </div>
    </div>
  );
}
