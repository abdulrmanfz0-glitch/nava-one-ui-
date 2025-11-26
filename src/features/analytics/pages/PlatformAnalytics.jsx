/**
 * PlatformAnalytics Page
 * Platform performance analytics and insights
 * REFACTORED: Reduced from 1,122 lines to ~150 lines
 */

import React from 'react';
import { Download, TrendingUp, DollarSign, ShoppingCart, Star } from 'lucide-react';
import PageHeader from '@/shared/components/organisms/UI/PageHeader';
import StatCard from '@/shared/components/organisms/UI/StatCard';
import { usePlatformAnalytics } from '../hooks/usePlatformAnalytics';
import { exportAnalyticsData } from '../services/analyticsService';

export default function PlatformAnalytics() {
  const {
    analytics,
    loading,
    timeRange,
    setTimeRange,
    filters,
    setFilters,
    stats
  } = usePlatformAnalytics();

  const handleExport = async (format) => {
    try {
      await exportAnalyticsData(analytics, format);
    } catch (error) {
      // Error handled in service
    }
  };

  return (
    <div className="container-custom py-8">
      <PageHeader
        title="تحليلات المنصات"
        subtitle="أداء المنصات وتحليل البيانات"
        actions={
          <div className="flex gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="week">أسبوع</option>
              <option value="month">شهر</option>
              <option value="quarter">ربع سنوي</option>
              <option value="year">سنة</option>
            </select>
            <button
              onClick={() => handleExport('excel')}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              تصدير
            </button>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="إجمالي الإيرادات"
          value={`${stats.totalRevenue.toLocaleString()} ر.س`}
          icon={DollarSign}
          color="green"
          loading={loading}
        />
        <StatCard
          title="إجمالي الطلبات"
          value={stats.totalOrders.toLocaleString()}
          icon={ShoppingCart}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="متوسط التقييم"
          value={stats.avgRating}
          icon={Star}
          color="orange"
          loading={loading}
        />
        <StatCard
          title="عدد المنصات"
          value={stats.platformCount}
          icon={TrendingUp}
          color="purple"
          loading={loading}
        />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={filters.platform}
            onChange={(e) => setFilters({ ...filters, platform: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">جميع المنصات</option>
            <option value="jahez">جاهز</option>
            <option value="hungerstation">هنقرستيشن</option>
            <option value="mrsool">مرسول</option>
            <option value="toters">توترز</option>
          </select>

          <input
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={filters.minRating}
            onChange={(e) => setFilters({ ...filters, minRating: parseFloat(e.target.value) })}
            placeholder="الحد الأدنى للتقييم"
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Analytics Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : analytics.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            لا توجد بيانات
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المنصة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإيرادات</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الطلبات</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التقييم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {analytics.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {item.platform_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.revenue?.toLocaleString()} ر.س
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.orders?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        ⭐ {item.rating}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
