// NAVA OPS - Executive HQ Dashboard
// Premium world-class dashboard for business owners
// Complete business intelligence, analytics, and strategic insights

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import api from '@/services/api';
import { executiveAPI } from '@/services/executiveAPI';
import PageHeader from '@/components/UI/PageHeader';
import StatCard from '@/components/UI/StatCard';
import {
  RevenueTrendChart,
  BranchComparisonChart,
  TrendAreaChart,
  MultiLineChart,
  PieChartComponent
} from '@/components/UI/Charts';
import DateRangePicker from '@/components/UI/DateRangePicker';
import {
  Crown,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  MapPin,
  Users,
  AlertTriangle,
  Award,
  Activity,
  Calendar,
  Brain,
  FileText,
  Download,
  RefreshCw,
  Globe,
  BarChart3,
  PieChart,
  Zap,
  Shield,
  Briefcase,
  Heart,
  Star,
  ThumbsDown,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';

export default function ExecutiveHQ() {
  const { userProfile } = useAuth();
  const { addNotification } = useNotification();

  // State Management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Executive Data
  const [executiveOverview, setExecutiveOverview] = useState(null);
  const [healthIndex, setHealthIndex] = useState(null);
  const [geographicData, setGeographicData] = useState([]);
  const [leaderboards, setLeaderboards] = useState({ best: [], worst: [] });
  const [employeePerformance, setEmployeePerformance] = useState([]);
  const [executiveAlerts, setExecutiveAlerts] = useState([]);
  const [multiYearTrends, setMultiYearTrends] = useState([]);
  const [costVsRevenue, setCostVsRevenue] = useState([]);
  const [profitabilityMap, setProfitabilityMap] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [consolidatedReports, setConsolidatedReports] = useState([]);

  // Date range - default to last year for executive view
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setFullYear(start.getFullYear() - 1);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  });

  // Fetch all executive data
  const fetchExecutiveData = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      const days = Math.ceil((new Date(dateRange.endDate) - new Date(dateRange.startDate)) / (1000 * 60 * 60 * 24));

      // Fetch all executive-level data in parallel
      const [
        overview,
        health,
        geographic,
        leaderboardsData,
        employeeData,
        alerts,
        trends,
        costRevenue,
        profitability,
        recommendations,
        reports
      ] = await Promise.all([
        executiveAPI.getExecutiveOverview(days),
        executiveAPI.getHealthIndex(),
        executiveAPI.getGeographicDistribution(),
        executiveAPI.getBranchLeaderboards(days),
        executiveAPI.getEmployeePerformance(days),
        executiveAPI.getExecutiveAlerts(),
        executiveAPI.getMultiYearTrends(),
        executiveAPI.getCostVsRevenue(days),
        executiveAPI.getProfitabilityMap(days),
        executiveAPI.getAIRecommendations(),
        executiveAPI.getConsolidatedReports(days)
      ]);

      setExecutiveOverview(overview);
      setHealthIndex(health);
      setGeographicData(geographic);
      setLeaderboards(leaderboardsData);
      setEmployeePerformance(employeeData);
      setExecutiveAlerts(alerts);
      setMultiYearTrends(trends);
      setCostVsRevenue(costRevenue);
      setProfitabilityMap(profitability);
      setAiRecommendations(recommendations);
      setConsolidatedReports(reports);

      if (!showLoader) {
        addNotification({
          title: 'Success',
          message: 'Executive dashboard refreshed',
          type: 'success'
        });
      }
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to load executive data',
        type: 'error'
      });
      console.error('Executive HQ error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExecutiveData();
  }, [dateRange]);

  const handleRefresh = () => {
    fetchExecutiveData(false);
  };

  const handleDateRangeChange = ({ startDate, endDate }) => {
    setDateRange({ startDate, endDate });
  };

  // Export consolidated report
  const handleExportReport = async () => {
    try {
      await executiveAPI.exportConsolidatedReport(dateRange);
      addNotification({
        title: 'Success',
        message: 'Report exported successfully',
        type: 'success'
      });
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to export report',
        type: 'error'
      });
    }
  };

  // Health Index Badge
  const getHealthBadge = (score) => {
    if (score >= 90) return { text: 'Excellent', color: 'bg-green-500', textColor: 'text-green-500' };
    if (score >= 75) return { text: 'Good', color: 'bg-blue-500', textColor: 'text-blue-500' };
    if (score >= 60) return { text: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-500' };
    return { text: 'Needs Attention', color: 'bg-red-500', textColor: 'text-red-500' };
  };

  const healthBadge = healthIndex ? getHealthBadge(healthIndex.overallScore) : null;

  return (
    <div className="space-y-6 pb-8">
      {/* Premium Header */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  Executive HQ
                  <span className="px-3 py-1 text-xs font-semibold bg-yellow-400 text-yellow-900 rounded-full">
                    PREMIUM
                  </span>
                </h1>
                <p className="text-white/90 text-sm mt-1">
                  Complete business intelligence for {userProfile?.full_name || 'Executive Leadership'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DateRangePicker
                startDate={dateRange.startDate}
                endDate={dateRange.endDate}
                onDateChange={handleDateRangeChange}
              />
              <button
                onClick={handleExportReport}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm
                         text-white rounded-lg transition-all duration-200 border border-white/30"
              >
                <Download className="w-5 h-5" />
                <span>Export</span>
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100
                         text-indigo-600 rounded-lg transition-all duration-200 disabled:opacity-50 font-semibold"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Business Health Score */}
          {healthIndex && healthBadge && (
            <div className="mt-6 flex items-center gap-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className={`w-16 h-16 rounded-full ${healthBadge.color} flex items-center justify-center`}>
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Business Health Index</p>
                  <p className="text-3xl font-bold text-white">{healthIndex.overallScore}/100</p>
                  <p className={`text-sm font-semibold ${healthBadge.textColor}`}>{healthBadge.text}</p>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-4 gap-4">
                <div>
                  <p className="text-white/70 text-xs">Financial</p>
                  <p className="text-white font-bold text-lg">{healthIndex.financial}/100</p>
                </div>
                <div>
                  <p className="text-white/70 text-xs">Operational</p>
                  <p className="text-white font-bold text-lg">{healthIndex.operational}/100</p>
                </div>
                <div>
                  <p className="text-white/70 text-xs">Customer</p>
                  <p className="text-white font-bold text-lg">{healthIndex.customer}/100</p>
                </div>
                <div>
                  <p className="text-white/70 text-xs">Employee</p>
                  <p className="text-white font-bold text-lg">{healthIndex.employee}/100</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'performance', label: 'Performance', icon: TrendingUp },
            { id: 'geographic', label: 'Geographic', icon: Globe },
            { id: 'intelligence', label: 'AI Intelligence', icon: Brain }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold transition-all duration-200
                ${activeTab === tab.id
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && executiveOverview && (
        <div className="space-y-6">
          {/* Key Executive Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Revenue"
              value={`SAR ${executiveOverview.totalRevenue.toLocaleString()}`}
              subtitle="All branches combined"
              icon={DollarSign}
              color="green"
              trend={executiveOverview.revenueChange >= 0 ? 'up' : 'down'}
              trendValue={`${executiveOverview.revenueChange >= 0 ? '+' : ''}${executiveOverview.revenueChange.toFixed(1)}%`}
              loading={loading}
            />
            <StatCard
              title="Net Profit"
              value={`SAR ${executiveOverview.netProfit.toLocaleString()}`}
              subtitle={`${executiveOverview.profitMargin.toFixed(1)}% margin`}
              icon={Target}
              color="blue"
              trend={executiveOverview.profitChange >= 0 ? 'up' : 'down'}
              trendValue={`${executiveOverview.profitChange >= 0 ? '+' : ''}${executiveOverview.profitChange.toFixed(1)}%`}
              loading={loading}
            />
            <StatCard
              title="Active Branches"
              value={executiveOverview.activeBranches}
              subtitle={`${executiveOverview.totalBranches} total branches`}
              icon={MapPin}
              color="purple"
              trend="up"
              trendValue={`${executiveOverview.branchGrowth >= 0 ? '+' : ''}${executiveOverview.branchGrowth}`}
              loading={loading}
            />
            <StatCard
              title="Total Employees"
              value={executiveOverview.totalEmployees}
              subtitle={`${executiveOverview.employeeRetention.toFixed(1)}% retention`}
              icon={Users}
              color="orange"
              trend={executiveOverview.employeeGrowth >= 0 ? 'up' : 'down'}
              trendValue={`${executiveOverview.employeeGrowth >= 0 ? '+' : ''}${executiveOverview.employeeGrowth.toFixed(1)}%`}
              loading={loading}
            />
          </div>

          {/* Executive Alerts */}
          {executiveAlerts && executiveAlerts.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Executive Alerts ({executiveAlerts.length})
                </h3>
              </div>
              <div className="space-y-3">
                {executiveAlerts.slice(0, 5).map((alert, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-4 p-4 rounded-lg border-l-4 ${
                      alert.severity === 'critical'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                        : alert.severity === 'high'
                        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${
                          alert.severity === 'critical'
                            ? 'bg-red-500 text-white'
                            : alert.severity === 'high'
                            ? 'bg-orange-500 text-white'
                            : 'bg-yellow-500 text-white'
                        }`}>
                          {alert.severity}
                        </span>
                        <p className="font-semibold text-gray-900 dark:text-white">{alert.title}</p>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{alert.description}</p>
                      {alert.branch && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Branch: {alert.branch}
                        </p>
                      )}
                    </div>
                    <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 text-sm font-semibold">
                      Review →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Multi-Year Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                Multi-Year Revenue Trends
              </h3>
              <MultiLineChart
                data={multiYearTrends}
                lines={[
                  { key: 'year1', label: '2023', color: '#0088FF' },
                  { key: 'year2', label: '2024', color: '#10B981' },
                  { key: 'year3', label: '2025', color: '#8B5CF6' }
                ]}
                loading={loading}
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-green-500" />
                Cost vs Revenue Analysis
              </h3>
              <PieChartComponent
                data={costVsRevenue}
                loading={loading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Branch Leaderboards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <Award className="w-6 h-6 text-green-500" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Top Performing Branches
                </h3>
              </div>
              <div className="space-y-3">
                {leaderboards.best.map((branch, index) => (
                  <div
                    key={branch.id}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                    }`}>
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{branch.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{branch.city}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 dark:text-green-400">
                        SAR {branch.revenue.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                        <TrendingUp className="w-4 h-4" />
                        <span>{branch.growth}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Performers */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-6">
                <ThumbsDown className="w-6 h-6 text-red-500" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Needs Attention
                </h3>
              </div>
              <div className="space-y-3">
                {leaderboards.worst.map((branch, index) => (
                  <div
                    key={branch.id}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-200 dark:border-red-800"
                  >
                    <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{branch.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{branch.city}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600 dark:text-red-400">
                        SAR {branch.revenue.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                        <TrendingDown className="w-4 h-4" />
                        <span>{branch.decline}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Employee Performance Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-blue-500" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Employee Performance Summary
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Branch</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Performance</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Sales</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {employeePerformance.slice(0, 10).map((employee, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                            {employee.name.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{employee.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{employee.branch}</td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{employee.role}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                employee.performance >= 90 ? 'bg-green-500' :
                                employee.performance >= 75 ? 'bg-blue-500' :
                                employee.performance >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${employee.performance}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-10">
                            {employee.performance}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        SAR {employee.sales.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-semibold text-gray-900 dark:text-white">{employee.rating}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Profitability Map */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-500" />
              Branch Profitability Comparison
            </h3>
            <BranchComparisonChart data={profitabilityMap} loading={loading} />
          </div>
        </div>
      )}

      {/* Geographic Tab */}
      {activeTab === 'geographic' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <Globe className="w-6 h-6 text-blue-500" />
              Geographic Distribution of Branches
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {geographicData.map((region, index) => (
                <div
                  key={index}
                  className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">{region.city}</h4>
                    <MapPin className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Branches</span>
                      <span className="font-bold text-gray-900 dark:text-white">{region.branchCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Revenue</span>
                      <span className="font-bold text-green-600 dark:text-green-400">
                        SAR {region.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Market Share</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{region.marketShare}%</span>
                    </div>
                    <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-1 text-sm">
                        {region.growth >= 0 ? (
                          <ArrowUpRight className="w-4 h-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-500" />
                        )}
                        <span className={region.growth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          {region.growth >= 0 ? '+' : ''}{region.growth}% growth
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Intelligence Tab */}
      {activeTab === 'intelligence' && (
        <div className="space-y-6">
          {/* AI Recommendations */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl shadow-md p-6 border-2 border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  AI-Powered Strategic Recommendations
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Data-driven insights for executive decision making
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {aiRecommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${
                      recommendation.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30' :
                      recommendation.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                      'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      <Zap className={`w-6 h-6 ${
                        recommendation.priority === 'high' ? 'text-red-600' :
                        recommendation.priority === 'medium' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                          recommendation.priority === 'high' ? 'bg-red-500 text-white' :
                          recommendation.priority === 'medium' ? 'bg-yellow-500 text-white' :
                          'bg-blue-500 text-white'
                        }`}>
                          {recommendation.priority.toUpperCase()} PRIORITY
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {recommendation.category}
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {recommendation.title}
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 mb-3">
                        {recommendation.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <Target className="w-4 h-4" />
                          <span>Impact: {recommendation.impact}</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                          <Clock className="w-4 h-4" />
                          <span>Timeline: {recommendation.timeline}</span>
                        </div>
                      </div>
                      {recommendation.actions && recommendation.actions.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Recommended Actions:
                          </p>
                          <ul className="space-y-1">
                            {recommendation.actions.map((action, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Consolidated Reports Stack */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-indigo-500" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Consolidated Reports
                </h3>
              </div>
              <button
                onClick={handleExportReport}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-5 h-5" />
                Export All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {consolidatedReports.map((report, index) => (
                <div
                  key={index}
                  className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-750 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white">{report.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{report.date}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    {report.description}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-600">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {report.pages} pages
                    </span>
                    <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 text-sm font-semibold flex items-center gap-1">
                      View <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
