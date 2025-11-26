/**
 * Analytics Service
 * Handles platform analytics data operations
 */

import { supabase } from '@/lib/supabase';

/**
 * Fetch platform analytics data
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Analytics data
 */
export const fetchPlatformAnalytics = async ({ brandId = null, timeRange = 'month' } = {}) => {
  try {
    let query = supabase
      .from('platform_analytics')
      .select('*');

    if (brandId) {
      query = query.eq('brand_id', brandId);
    }

    // Apply time range filter
    const now = new Date();
    let startDate;
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarter':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    query = query.gte('created_at', startDate.toISOString());

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch analytics: ${error.message}`);
  }
};

/**
 * Subscribe to analytics changes
 */
export const subscribeToAnalyticsChanges = (callback) => {
  const subscription = supabase
    .channel('analytics-changes')
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'platform_analytics'
      },
      callback
    )
    .subscribe();

  return () => subscription.unsubscribe();
};

/**
 * Export analytics data
 */
export const exportAnalyticsData = async (data, format = 'excel') => {
  const { exportToExcel, exportToCSV, exportToPDF } = await import('@/utils/exportUtils');

  const exportData = data.map(item => ({
    'المنصة': item.platform_name,
    'الإيرادات': item.revenue,
    'الطلبات': item.orders,
    'التقييم': item.rating,
    'التاريخ': item.created_at
  }));

  switch (format) {
    case 'excel':
      exportToExcel(exportData, 'platform_analytics');
      break;
    case 'csv':
      exportToCSV(exportData, 'platform_analytics');
      break;
    case 'pdf':
      await exportToPDF('platform_analytics', exportData);
      break;
  }
};
