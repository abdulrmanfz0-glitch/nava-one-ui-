/**
 * usePlatformAnalytics Hook
 * Manages platform analytics data and filtering
 */

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import {
  fetchPlatformAnalytics,
  subscribeToAnalyticsChanges
} from '../services/analyticsService';

export function usePlatformAnalytics() {
  const { userProfile } = useAuth();
  const { addNotification } = useNotification();

  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');
  const [filters, setFilters] = useState({
    platform: 'all',
    minRating: 0
  });

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  useEffect(() => {
    const unsubscribe = subscribeToAnalyticsChanges(() => {
      loadAnalytics(false);
    });

    return () => unsubscribe();
  }, []);

  const loadAnalytics = async (showLoading = true) => {
    if (showLoading) setLoading(true);

    try {
      const brandFilter = userProfile?.role === 'ops' && userProfile?.brand_id
        ? { brandId: userProfile.brand_id }
        : {};

      const data = await fetchPlatformAnalytics({ ...brandFilter, timeRange });
      setAnalytics(data);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في جلب البيانات',
        message: error.message
      });
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const filteredAnalytics = useMemo(() => {
    return analytics.filter(item => {
      if (filters.platform !== 'all' && item.platform_name !== filters.platform) {
        return false;
      }
      if (item.rating < filters.minRating) {
        return false;
      }
      return true;
    });
  }, [analytics, filters]);

  const stats = useMemo(() => {
    const totalRevenue = filteredAnalytics.reduce((sum, item) => sum + (item.revenue || 0), 0);
    const totalOrders = filteredAnalytics.reduce((sum, item) => sum + (item.orders || 0), 0);
    const avgRating = filteredAnalytics.length > 0
      ? filteredAnalytics.reduce((sum, item) => sum + (item.rating || 0), 0) / filteredAnalytics.length
      : 0;

    return {
      totalRevenue,
      totalOrders,
      avgRating: avgRating.toFixed(2),
      platformCount: filteredAnalytics.length
    };
  }, [filteredAnalytics]);

  return {
    analytics: filteredAnalytics,
    loading,
    timeRange,
    setTimeRange,
    filters,
    setFilters,
    stats,
    reload: loadAnalytics
  };
}
