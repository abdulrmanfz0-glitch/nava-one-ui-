// NAVA OPS - Staff Performance Hub
// Comprehensive staff performance tracking and analytics

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { executiveAPI } from '@/services/executiveAPI';
import PageHeader from '@/components/UI/PageHeader';
import StatCard from '@/components/UI/StatCard';
import DateRangePicker from '@/components/UI/DateRangePicker';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Award,
  Star,
  Target,
  Activity,
  Clock,
  DollarSign,
  UserCheck,
  UserMinus,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export default function StaffPerformanceHub() {
  const { userProfile } = useAuth();
  const { addNotification } = useNotification();

  // State Management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [employeePerformance, setEmployeePerformance] = useState([]);
  const [performanceStats, setPerformanceStats] = useState(null);

  // Date range - default to last 30 days
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  });

  // Fetch employee performance data
  const fetchPerformanceData = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      const days = Math.ceil((new Date(dateRange.endDate) - new Date(dateRange.startDate)) / (1000 * 60 * 60 * 24));

      const data = await executiveAPI.getEmployeePerformance(days);
      setEmployeePerformance(data);

      // Calculate performance stats
      const stats = calculatePerformanceStats(data);
      setPerformanceStats(stats);

      if (!showLoader) {
        addNotification({
          title: 'Success',
          message: 'Performance data refreshed',
          type: 'success'
        });
      }
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to load performance data',
        type: 'error'
      });
      console.error('Staff performance error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Calculate performance statistics
  const calculatePerformanceStats = (data) => {
    if (!data || data.length === 0) {
      return {
        totalEmployees: 0,
        avgPerformance: 0,
        topPerformers: 0,
        needsImprovement: 0,
        totalSales: 0,
        avgRating: 0
      };
    }

    const totalEmployees = data.length;
    const avgPerformance = data.reduce((sum, emp) => sum + emp.performance, 0) / totalEmployees;
    const topPerformers = data.filter(emp => emp.performance >= 90).length;
    const needsImprovement = data.filter(emp => emp.performance < 60).length;
    const totalSales = data.reduce((sum, emp) => sum + emp.sales, 0);
    const avgRating = data.reduce((sum, emp) => sum + parseFloat(emp.rating), 0) / totalEmployees;

    return {
      totalEmployees,
      avgPerformance: Math.round(avgPerformance),
      topPerformers,
      needsImprovement,
      totalSales,
      avgRating: avgRating.toFixed(1)
    };
  };

  useEffect(() => {
    fetchPerformanceData();
  }, [dateRange]);

  const handleRefresh = () => {
    fetchPerformanceData(false);
  };

  const handleDateRangeChange = ({ startDate, endDate }) => {
    setDateRange({ startDate, endDate });
  };

  // Get performance badge
  const getPerformanceBadge = (score) => {
    if (score >= 90) return { text: 'Excellent', color: 'bg-green-500', textColor: 'text-green-600' };
    if (score >= 75) return { text: 'Good', color: 'bg-blue-500', textColor: 'text-blue-600' };
    if (score >= 60) return { text: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
    return { text: 'Needs Attention', color: 'bg-red-500', textColor: 'text-red-600' };
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  Staff Performance Hub
                </h1>
                <p className="text-white/90 text-sm mt-1">
                  Track and analyze employee performance across all branches
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
        </div>
      </div>

      {/* Performance Statistics */}
      {performanceStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Employees"
            value={performanceStats.totalEmployees}
            subtitle="Active staff members"
            icon={Users}
            color="blue"
            loading={loading}
          />
          <StatCard
            title="Average Performance"
            value={`${performanceStats.avgPerformance}%`}
            subtitle="Overall performance score"
            icon={Activity}
            color="green"
            loading={loading}
          />
          <StatCard
            title="Top Performers"
            value={performanceStats.topPerformers}
            subtitle="90%+ performance score"
            icon={Award}
            color="purple"
            loading={loading}
          />
          <StatCard
            title="Needs Improvement"
            value={performanceStats.needsImprovement}
            subtitle="Below 60% performance"
            icon={AlertCircle}
            color="orange"
            loading={loading}
          />
        </div>
      )}

      {/* Employee Performance Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Employee Performance Details
          </h3>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-500"></div>
          </div>
        ) : employeePerformance.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No employee data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Employee</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Branch</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Performance</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Sales</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Rating</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {employeePerformance.map((employee, index) => {
                  const badge = getPerformanceBadge(employee.performance);
                  return (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                            {employee.name.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{employee.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{employee.branch}</td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{employee.role}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden min-w-[100px]">
                            <div
                              className={`h-full ${
                                employee.performance >= 90 ? 'bg-green-500' :
                                employee.performance >= 75 ? 'bg-blue-500' :
                                employee.performance >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${employee.performance}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-12">
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
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${badge.color} text-white`}>
                          {badge.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
