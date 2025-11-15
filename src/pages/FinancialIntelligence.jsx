// NAVA OPS - Financial Intelligence
 claude/fix-intelligence-pages-errors-011CV5xYn7LzULNSSchNhaby
// Comprehensive financial analytics dashboard with advanced insights

// Advanced financial analytics with AI insights and predictions
 main

import React, { useState, useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import api from '@/services/api';
import PageHeader from '@/components/UI/PageHeader';
import StatCard from '@/components/UI/StatCard';
import { RevenueTrendChart, MultiLineChart } from '@/components/UI/Charts';
import DateRangePicker from '@/components/UI/DateRangePicker';
 claude/fix-intelligence-pages-errors-011CV5xYn7LzULNSSchNhaby
import { DollarSign, Wallet, CreditCard, Target, AlertCircle, TrendingUp, PieChart } from 'lucide-react';

// Financial Overview Tab Component
function FinancialOverview({ financialData, loading }) {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`SAR ${financialData.totalRevenue.toLocaleString()}`}

import EmptyState from '@/components/UI/EmptyState';
import {
  DollarSign,
  Wallet,
  CreditCard,
  Target,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  PieChart,
  BarChart3
} from 'lucide-react';

export default function FinancialIntelligence() {
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    trends: [],
    platformBreakdown: []
  });

  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 90);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  });

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const days = Math.ceil((new Date(dateRange.endDate) - new Date(dateRange.startDate)) / (1000 * 60 * 60 * 24));

      const [overview, trends] = await Promise.all([
        api.analytics.getDashboardOverview(null, days),
        api.analytics.getRevenueTrends(null, days)
      ]);

      // Calculate financial metrics
      const totalRevenue = overview.overview.totalRevenue || 0;
      const totalExpenses = totalRevenue * 0.65; // 65% estimated expenses
      const netProfit = totalRevenue * 0.35; // 35% profit margin

      setFinancialData({
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: 35,
        avgOrderValue: overview.overview.averageOrderValue || 0,
        totalOrders: overview.overview.totalOrders || 0,
        trends,
        platformBreakdown: [
          { name: 'Direct Orders', revenue: totalRevenue * 0.45, orders: Math.floor(overview.overview.totalOrders * 0.40), percentage: 45, icon: '🛍️' },
          { name: 'Delivery Apps', revenue: totalRevenue * 0.35, orders: Math.floor(overview.overview.totalOrders * 0.35), percentage: 35, icon: '🚴' },
          { name: 'Online Orders', revenue: totalRevenue * 0.20, orders: Math.floor(overview.overview.totalOrders * 0.25), percentage: 20, icon: '💻' }
        ]
      });
    } catch (error) {
      console.error('Financial data error:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to load financial intelligence data',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [dateRange]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Intelligence"
        subtitle="AI-powered financial analytics, predictions, and strategic insights"
        icon={DollarSign}
        actions={
          <DateRangePicker
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onDateChange={({ startDate, endDate }) => setDateRange({ startDate, endDate })}
          />
        }
      />

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(financialData.totalRevenue)}
 main
          subtitle="Gross income"
          icon={DollarSign}
          color="green"
          trend="up"
 claude/fix-intelligence-pages-errors-011CV5xYn7LzULNSSchNhaby
          trendValue="+12.5%"

          trendValue="+15.3%"
          loading={loading}
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(financialData.totalExpenses)}
          subtitle="Operating costs"
          icon={CreditCard}
          color="red"
          trend="down"
          trendValue="-5.2%"
 main
          loading={loading}
        />
        <StatCard
          title="Net Profit"
 claude/fix-intelligence-pages-errors-011CV5xYn7LzULNSSchNhaby
          value={`SAR ${financialData.netProfit.toLocaleString()}`}

          value={formatCurrency(financialData.netProfit)}
 main
          subtitle="After expenses"
          icon={Wallet}
          color="blue"
          trend="up"
 claude/fix-intelligence-pages-errors-011CV5xYn7LzULNSSchNhaby
          trendValue="+8.3%"

          trendValue="+22.8%"
 main
          loading={loading}
        />
        <StatCard
          title="Profit Margin"
          value={`${financialData.profitMargin}%`}
          subtitle="Net margin"
          icon={Target}
          color="purple"
          trend="up"
 claude/fix-intelligence-pages-errors-011CV5xYn7LzULNSSchNhaby
          trendValue="+2.1%"
          loading={loading}
        />
        <StatCard
          title="Total Expenses"
          value={`SAR ${financialData.totalExpenses.toLocaleString()}`}
          subtitle="Operating costs"
          icon={CreditCard}
          color="red"
          trend="down"
          trendValue="-5.2%"

          trendValue="+2.5%"
 main
          loading={loading}
        />
      </div>

 claude/fix-intelligence-pages-errors-011CV5xYn7LzULNSSchNhaby
      {/* Revenue Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-blue-500" />
          Revenue Distribution
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {financialData.platformBreakdown?.map((platform, idx) => (
            <div key={idx} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{platform.name}</span>
                <span className="text-2xl">{platform.icon || '📱'}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                SAR {platform.revenue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {platform.orders} orders • {platform.percentage}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Order Value</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            SAR {(financialData.avgOrderValue || 0).toFixed(2)}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cost Ratio</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {((financialData.totalExpenses / financialData.totalRevenue) * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">ROI</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {((financialData.netProfit / financialData.totalExpenses) * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Growth Rate</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            +12.5%
          </div>
        </div>
      </div>
    </div>
  );
}

// Business Health Tab Component
function BusinessHealth({ financialData, loading }) {
  const healthMetrics = [
    {
      title: 'Cash Flow Health',
      score: 85,
      status: 'Excellent',
      color: 'green',
      description: 'Strong positive cash flow with consistent revenue streams'
    },
    {
      title: 'Profitability Index',
      score: 78,
      status: 'Good',
      color: 'blue',
      description: 'Healthy profit margins across all branches'
    },
    {
      title: 'Cost Efficiency',
      score: 72,
      status: 'Good',
      color: 'blue',
      description: 'Operating costs within optimal range'
    },
    {
      title: 'Revenue Stability',
      score: 91,
      status: 'Excellent',
      color: 'green',
      description: 'Consistent revenue with minimal volatility'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Health Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {healthMetrics.map((metric, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{metric.title}</h4>
              <span className={`px-3 py-1 rounded-full text-sm font-medium
                ${metric.color === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : ''}
                ${metric.color === 'blue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : ''}
              `}>
                {metric.status}
              </span>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{metric.score}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">/ 100</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500
                    ${metric.color === 'green' ? 'bg-green-500' : 'bg-blue-500'}
                  `}
                  style={{ width: `${metric.score}%` }}
                ></div>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{metric.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Advanced Analytics Tab Component
function AdvancedAnalytics({ trends, loading }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trends */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Trends</h3>
          <RevenueTrendChart data={trends} loading={loading} />
        </div>

        {/* Profit Forecast */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profit Forecast</h3>

      {/* Revenue Breakdown by Platform */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <PieChart className="w-5 h-5 text-blue-500" />
          Revenue by Platform
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {financialData.platformBreakdown.map((platform, idx) => (
            <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">{platform.name}</span>
                <span className="text-2xl">{platform.icon}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {formatCurrency(platform.revenue)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {platform.orders.toLocaleString()} orders • {platform.percentage}%
              </div>
              <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 rounded-full h-2 transition-all duration-300"
                  style={{ width: `${platform.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-500" />
            Revenue Trends
          </h3>
          <RevenueTrendChart data={financialData.trends} loading={loading} />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            Profit Forecast
          </h3>
 main
          <MultiLineChart
            data={[
              { date: 'Week 1', actual: 45000, forecast: 47000 },
              { date: 'Week 2', actual: 52000, forecast: 54000 },
              { date: 'Week 3', forecast: 58000 },
              { date: 'Week 4', forecast: 61000 }
            ]}
            lines={[
              { key: 'actual', label: 'Actual', color: '#0088FF' },
              { key: 'forecast', label: 'Forecast', color: '#10B981' }
            ]}
            loading={loading}
          />
        </div>
      </div>

 claude/fix-intelligence-pages-errors-011CV5xYn7LzULNSSchNhaby
      {/* Strategic Insights */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          Strategic Insights

      {/* Financial Performance Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-orange-500" />
          Key Performance Indicators
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Order Value</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(financialData.avgOrderValue)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Operating Costs</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(financialData.totalExpenses)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cost Ratio</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {financialData.totalRevenue > 0 ? ((financialData.totalExpenses / financialData.totalRevenue) * 100).toFixed(1) : 0}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">ROI</div>
            <div className="text-2xl font-bold text-green-500 dark:text-green-400">
              {financialData.totalExpenses > 0 ? ((financialData.netProfit / financialData.totalExpenses) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* AI-Powered Financial Insights */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          AI Financial Insights
 main
        </h3>
        <div className="space-y-4">
          {[
            {
              title: 'Revenue Growth Opportunity',
 claude/fix-intelligence-pages-errors-011CV5xYn7LzULNSSchNhaby
              description: 'Your revenue has grown 15% this quarter. Consider expanding to new locations.',
              severity: 'info',
              metric: '+15% growth'
            },
            {
              title: 'Cost Optimization',
              description: 'Operating costs are slightly above industry average. Review supplier contracts.',
              severity: 'warning',
              metric: '5% above avg'
            },
            {
              title: 'Peak Performance',
              description: 'Profit margins are at an all-time high. Maintain current operational efficiency.',
              severity: 'success',
              metric: 'Best in class'
            }
          ].map((insight, index) => (
            <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">{insight.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{insight.description}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ml-4
                  ${insight.severity === 'info' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : ''}
                  ${insight.severity === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' : ''}
                  ${insight.severity === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : ''}
                `}>
                  {insight.metric}
                </span>
              </div>
            </div>
          ))}

              description: 'Your revenue has grown 15% this quarter. Consider expanding to new locations or increasing marketing spend to capitalize on this momentum.',
              severity: 'info',
              metric: '+15% growth',
              icon: TrendingUp,
              color: 'blue'
            },
            {
              title: 'Cost Optimization Alert',
              description: 'Operating costs are 5% above industry average. Review supplier contracts and operational efficiency to improve margins.',
              severity: 'warning',
              metric: '5% above avg',
              icon: AlertCircle,
              color: 'yellow'
            },
            {
              title: 'Profit Margin Excellence',
              description: 'Your profit margin of 35% is significantly higher than the industry standard of 25%. This indicates excellent cost management.',
              severity: 'success',
              metric: '35% margin',
              icon: Target,
              color: 'green'
            }
          ].map((insight, index) => {
            const colorClasses = {
              blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400', icon: 'text-blue-600 dark:text-blue-400' },
              yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-700 dark:text-yellow-400', icon: 'text-yellow-600 dark:text-yellow-400' },
              green: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-400', icon: 'text-green-600 dark:text-green-400' }
            };
            const colors = colorClasses[insight.color];

            return (
              <div key={index} className={`p-4 border rounded-lg ${colors.bg} ${colors.border}`}>
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${colors.icon}`}>
                    <insight.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium mb-1 ${colors.text}`}>{insight.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{insight.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors.text} ${colors.bg}`}>
                    {insight.metric}
                  </span>
                </div>
              </div>
            );
          })}
 main
        </div>
      </div>
    </div>
  );
}
 claude/fix-intelligence-pages-errors-011CV5xYn7LzULNSSchNhaby

// Main Financial Intelligence Component
export default function FinancialIntelligence() {
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [financialData, setFinancialData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    avgOrderValue: 0,
    platformBreakdown: [],
    trends: []
  });

  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 90);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  });

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const days = Math.ceil((new Date(dateRange.endDate) - new Date(dateRange.startDate)) / (1000 * 60 * 60 * 24));
      const [overview, trends] = await Promise.all([
        api.analytics.getDashboardOverview(null, days),
        api.analytics.getRevenueTrends(null, days)
      ]);

      setFinancialData({
        totalRevenue: overview.overview.totalRevenue || 0,
        totalExpenses: (overview.overview.totalRevenue || 0) * 0.65,
        netProfit: (overview.overview.totalRevenue || 0) * 0.35,
        profitMargin: 35,
        avgOrderValue: overview.overview.averageOrderValue || 0,
        platformBreakdown: [
          { name: 'Direct Sales', revenue: (overview.overview.totalRevenue || 0) * 0.45, orders: Math.floor((overview.overview.totalOrders || 0) * 0.45), percentage: 45, icon: '🏪' },
          { name: 'Online Orders', revenue: (overview.overview.totalRevenue || 0) * 0.35, orders: Math.floor((overview.overview.totalOrders || 0) * 0.35), percentage: 35, icon: '💻' },
          { name: 'Delivery Apps', revenue: (overview.overview.totalRevenue || 0) * 0.20, orders: Math.floor((overview.overview.totalOrders || 0) * 0.20), percentage: 20, icon: '🚚' }
        ],
        trends
      });
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to load financial intelligence data',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [dateRange]);

  const tabs = [
    { id: 'overview', label: 'Financial Overview', icon: '💵' },
    { id: 'health', label: 'Business Health', icon: '💚' },
    { id: 'analytics', label: 'Advanced Analytics', icon: '📊' }
  ];

  return (
    <div className="space-y-6">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6">
        <PageHeader
          title="Financial Intelligence"
          subtitle="Revenue analytics, profit optimization & strategic forecasts"
          icon={DollarSign}
          actions={
            <DateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onDateChange={({ startDate, endDate }) => setDateRange({ startDate, endDate })}
            />
          }
          className="text-white"
        />

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-6 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2
                ${activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'bg-blue-600/50 text-white hover:bg-blue-600/70'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'overview' && <FinancialOverview financialData={financialData} loading={loading} />}
      {activeTab === 'health' && <BusinessHealth financialData={financialData} loading={loading} />}
      {activeTab === 'analytics' && <AdvancedAnalytics trends={financialData.trends} loading={loading} />}
    </div>
  );
}

 main
