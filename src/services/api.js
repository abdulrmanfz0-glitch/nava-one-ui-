// NAVA OPS - Comprehensive API Service Layer
// Centralized API client with error handling, caching, and retry logic

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

/**
 * API Error class for better error handling
 */
export class APIError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Generic API request wrapper with error handling
 */
async function apiRequest(fn, errorMessage = 'API request failed') {
  try {
    const { data, error } = await fn();

    if (error) {
      logger.error(errorMessage, error);
      throw new APIError(error.message || errorMessage, error.code || 'API_ERROR', error);
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    logger.error(errorMessage, error);
    throw new APIError(error.message || errorMessage, 'UNKNOWN_ERROR', { originalError: error });
  }
}

// ============================================================================
// BRAND API
// ============================================================================

export const brandAPI = {
  /**
   * Get the user's brand
   */
  async get() {
  const { data: { user } } = await supabase.auth.getUser();

  return apiRequest(
    () => supabase
      .from('brands')
      .select('*')
      .eq('user_id', user.id)
      .single(),
    'Failed to fetch brand'
  );
}


  /**
   * Create a new brand (first-time setup)
   */
  async create(brandData) {
    return apiRequest(
      () => supabase
        .from('brands')
        .insert([brandData])
        .select()
        .single(),
      'Failed to create brand'
    );
  },

  /**
   * Update brand information
   */
  async update(brandData) {
    const { id, ...updates } = brandData;
    return apiRequest(
      () => supabase
        .from('brands')
        .update(updates)
        .eq('id', id)
        .select()
        .single(),
      'Failed to update brand'
    );
  },

  /**
   * Get brand statistics
   */
  async getStatistics() {
    const brand = await this.get();
    if (!brand) return null;

    return apiRequest(
      () => supabase.rpc('calculate_brand_stats', { brand_uuid: brand.id }),
      'Failed to fetch brand statistics'
    );
  },

  /**
   * Check if user has a brand
   */
  async hasBrand() {
    try {
      const { count } = await apiRequest(
        () => supabase
          .from('brands')
          .select('id', { count: 'exact', head: true }),
        'Failed to check brand existence'
      );
      return count > 0;
    } catch (error) {
      return false;
    }
  }
};

// ============================================================================
// BRANCHES API
// ============================================================================

export const branchesAPI = {
  /**
   * Get all branches for the current user's brand
   */
 async getAll(brandId = null) {
  if (!brandId) {
    const brand = await brandAPI.get();
    if (!brand) return [];
    brandId = brand.id;
  }

  return apiRequest(
    () => supabase
      .from('branches')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false }),
    'Failed to fetch branches'
  );
}



  /**
   * Get a single branch by ID
   */
  async getById(id) {
    return apiRequest(
      () => supabase
        .from('branches')
        .select('*')
        .eq('id', id)
        .single(),
      `Failed to fetch branch ${id}`
    );
  },

  /**
   * Create a new branch (requires brand_id)
   */
  async create(branchData) {
    // Ensure brand_id is present
    if (!branchData.brand_id) {
      const brand = await brandAPI.get();
      if (!brand) {
        throw new APIError('No brand found. Please set up your brand first.', 'NO_BRAND');
      }
      branchData.brand_id = brand.id;
    }

    return apiRequest(
      () => supabase
        .from('branches')
        .insert([branchData])
        .select()
        .single(),
      'Failed to create branch'
    );
  },

  /**
   * Update a branch
   */
  async update(id, branchData) {
    return apiRequest(
      () => supabase
        .from('branches')
        .update(branchData)
        .eq('id', id)
        .select()
        .single(),
      `Failed to update branch ${id}`
    );
  },

  /**
   * Delete a branch
   */
  async delete(id) {
    return apiRequest(
      () => supabase
        .from('branches')
        .delete()
        .eq('id', id),
      `Failed to delete branch ${id}`
    );
  },

  /**
   * Get branch statistics
   */
  async getStatistics(branchId) {
    return apiRequest(
      () => supabase.rpc('calculate_branch_stats', { branch_uuid: branchId }),
      `Failed to fetch branch statistics for ${branchId}`
    );
  },

  /**
   * Get branch performance data
   */
  async getPerformance(branchId, startDate, endDate) {
    let query = supabase
      .from('performance_entries')
      .select('*')
      .eq('branch_id', branchId)
      .order('entry_date', { ascending: false });

    if (startDate) query = query.gte('entry_date', startDate);
    if (endDate) query = query.lte('entry_date', endDate);

    return apiRequest(
      () => query,
      `Failed to fetch performance data for branch ${branchId}`
    );
  }
};

// ============================================================================
// ORDERS API
// ============================================================================

export const ordersAPI = {
  /**
   * Get all orders with optional filters
   */
  async getAll(filters = {}) {
    let query = supabase
      .from('orders')
      .select('*, order_items(*), branches(name)')
      .order('order_date', { ascending: false })
      .order('order_time', { ascending: false });

    if (filters.branchId) query = query.eq('branch_id', filters.branchId);
    if (filters.startDate) query = query.gte('order_date', filters.startDate);
    if (filters.endDate) query = query.lte('order_date', filters.endDate);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.limit) query = query.limit(filters.limit);

    return apiRequest(() => query, 'Failed to fetch orders');
  },

  /**
   * Get a single order by ID
   */
  async getById(id) {
    return apiRequest(
      () => supabase
        .from('orders')
        .select('*, order_items(*, products(name, sku)), branches(name, code)')
        .eq('id', id)
        .single(),
      `Failed to fetch order ${id}`
    );
  },

  /**
   * Create a new order
   */
  async create(orderData) {
    const { items, ...order } = orderData;

    // Start a transaction-like operation
    const newOrder = await apiRequest(
      () => supabase
        .from('orders')
        .insert([order])
        .select()
        .single(),
      'Failed to create order'
    );

    // Add order items
    if (items && items.length > 0) {
      const orderItems = items.map(item => ({
        ...item,
        order_id: newOrder.id
      }));

      await apiRequest(
        () => supabase
          .from('order_items')
          .insert(orderItems),
        'Failed to create order items'
      );
    }

    return newOrder;
  },

  /**
   * Update order status
   */
  async updateStatus(id, status) {
    return apiRequest(
      () => supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single(),
      `Failed to update order status for ${id}`
    );
  },

  /**
   * Delete an order
   */
  async delete(id) {
    return apiRequest(
      () => supabase
        .from('orders')
        .delete()
        .eq('id', id),
      `Failed to delete order ${id}`
    );
  },

  /**
   * Get order statistics
   */
  async getStatistics(filters = {}) {
    let query = supabase
      .from('orders')
      .select('total, order_date, branch_id, status');

    if (filters.branchId) query = query.eq('branch_id', filters.branchId);
    if (filters.startDate) query = query.gte('order_date', filters.startDate);
    if (filters.endDate) query = query.lte('order_date', filters.endDate);

    const orders = await apiRequest(() => query, 'Failed to fetch order statistics');

    // Calculate statistics
    const stats = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + Number(order.total), 0),
      averageOrderValue: 0,
      completedOrders: orders.filter(o => o.status === 'completed').length,
      pendingOrders: orders.filter(o => o.status === 'pending').length,
      cancelledOrders: orders.filter(o => o.status === 'cancelled').length
    };

    stats.averageOrderValue = stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;

    return stats;
  }
};

// ============================================================================
// METRICS API
// ============================================================================

export const metricsAPI = {
  /**
   * Get all metrics with filters
   */
  async getAll(filters = {}) {
    let query = supabase
      .from('metrics')
      .select('*, branches(name)')
      .order('metric_date', { ascending: false });

    if (filters.branchId) query = query.eq('branch_id', filters.branchId);
    if (filters.metricName) query = query.eq('metric_name', filters.metricName);
    if (filters.metricCategory) query = query.eq('metric_category', filters.metricCategory);
    if (filters.startDate) query = query.gte('metric_date', filters.startDate);
    if (filters.endDate) query = query.lte('metric_date', filters.endDate);

    return apiRequest(() => query, 'Failed to fetch metrics');
  },

  /**
   * Create a new metric entry
   */
  async create(metricData) {
    return apiRequest(
      () => supabase
        .from('metrics')
        .insert([metricData])
        .select()
        .single(),
      'Failed to create metric'
    );
  },

  /**
   * Bulk create metrics
   */
  async createBulk(metricsArray) {
    return apiRequest(
      () => supabase
        .from('metrics')
        .insert(metricsArray)
        .select(),
      'Failed to create bulk metrics'
    );
  },

  /**
   * Get metric trends over time
   */
  async getTrends(metricName, branchId = null, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('metrics')
      .select('metric_date, metric_value')
      .eq('metric_name', metricName)
      .gte('metric_date', startDate.toISOString().split('T')[0])
      .order('metric_date', { ascending: true });

    if (branchId) query = query.eq('branch_id', branchId);

    return apiRequest(() => query, `Failed to fetch trends for metric ${metricName}`);
  }
};

// ============================================================================
// INSIGHTS API
// ============================================================================

export const insightsAPI = {
  /**
   * Get all insights for the user
   */
  async getAll(filters = {}) {
    let query = supabase
      .from('insights')
      .select('*, branches(name)')
      .order('created_at', { ascending: false });

    if (filters.branchId) query = query.eq('branch_id', filters.branchId);
    if (filters.type) query = query.eq('insight_type', filters.type);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.severity) query = query.eq('severity', filters.severity);
    if (filters.limit) query = query.limit(filters.limit);

    return apiRequest(() => query, 'Failed to fetch insights');
  },

  /**
   * Get unread insights count
   */
  async getUnreadCount() {
    const data = await apiRequest(
      () => supabase
        .from('insights')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'new'),
      'Failed to fetch unread insights count'
    );
    return data?.count || 0;
  },

  /**
   * Create a new insight
   */
  async create(insightData) {
    return apiRequest(
      () => supabase
        .from('insights')
        .insert([insightData])
        .select()
        .single(),
      'Failed to create insight'
    );
  },

  /**
   * Update insight status
   */
  async updateStatus(id, status) {
    const updates = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'acknowledged') {
      updates.acknowledged_at = new Date().toISOString();
    } else if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }

    return apiRequest(
      () => supabase
        .from('insights')
        .update(updates)
        .eq('id', id)
        .select()
        .single(),
      `Failed to update insight ${id}`
    );
  },

  /**
   * Delete an insight
   */
  async delete(id) {
    return apiRequest(
      () => supabase
        .from('insights')
        .delete()
        .eq('id', id),
      `Failed to delete insight ${id}`
    );
  }
};

// ============================================================================
// REPORTS API
// ============================================================================

export const reportsAPI = {
  /**
   * Get all reports
   */
  async getAll(filters = {}) {
    let query = supabase
      .from('reports')
      .select('*, branches(name)')
      .order('created_at', { ascending: false });

    if (filters.branchId) query = query.eq('branch_id', filters.branchId);
    if (filters.type) query = query.eq('report_type', filters.type);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.limit) query = query.limit(filters.limit);

    return apiRequest(() => query, 'Failed to fetch reports');
  },

  /**
   * Get a single report
   */
  async getById(id) {
    return apiRequest(
      () => supabase
        .from('reports')
        .select('*, branches(name)')
        .eq('id', id)
        .single(),
      `Failed to fetch report ${id}`
    );
  },

  /**
   * Create a new report
   */
  async create(reportData) {
    return apiRequest(
      () => supabase
        .from('reports')
        .insert([reportData])
        .select()
        .single(),
      'Failed to create report'
    );
  },

  /**
   * Update report status
   */
  async updateStatus(id, status, fileUrl = null, errorMessage = null) {
    const updates = {
      status,
      updated_at: new Date().toISOString()
    };

    if (fileUrl) updates.file_url = fileUrl;
    if (errorMessage) updates.error_message = errorMessage;

    return apiRequest(
      () => supabase
        .from('reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single(),
      `Failed to update report ${id}`
    );
  },

  /**
   * Delete a report
   */
  async delete(id) {
    return apiRequest(
      () => supabase
        .from('reports')
        .delete()
        .eq('id', id),
      `Failed to delete report ${id}`
    );
  }
};

// ============================================================================
// NOTIFICATIONS API
// ============================================================================

export const notificationsAPI = {
  /**
   * Get all notifications
   */
  async getAll(filters = {}) {
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.isRead !== undefined) query = query.eq('is_read', filters.isRead);
    if (filters.type) query = query.eq('type', filters.type);
    if (filters.limit) query = query.limit(filters.limit);

    return apiRequest(() => query, 'Failed to fetch notifications');
  },

  /**
   * Get unread count
   */
  async getUnreadCount() {
    const { count } = await apiRequest(
      () => supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false),
      'Failed to fetch unread notifications count'
    );
    return count || 0;
  },

  /**
   * Mark notification as read
   */
  async markAsRead(id) {
    return apiRequest(
      () => supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single(),
      `Failed to mark notification ${id} as read`
    );
  },

  /**
   * Mark all as read
   */
  async markAllAsRead() {
    return apiRequest(
      () => supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('is_read', false),
      'Failed to mark all notifications as read'
    );
  },

  /**
   * Delete a notification
   */
  async delete(id) {
    return apiRequest(
      () => supabase
        .from('notifications')
        .delete()
        .eq('id', id),
      `Failed to delete notification ${id}`
    );
  },

  /**
   * Create a notification
   */
  async create(notificationData) {
    return apiRequest(
      () => supabase
        .from('notifications')
        .insert([notificationData])
        .select()
        .single(),
      'Failed to create notification'
    );
  }
};

// ============================================================================
// ANALYTICS API (Aggregated Data)
// ============================================================================

export const analyticsAPI = {
  /**
   * Get dashboard overview statistics
   */
  async getDashboardOverview(branchId = null, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Get orders data
    const ordersStats = await ordersAPI.getStatistics({
      branchId,
      startDate: startDateStr
    });

    // Get branches count
    const branches = await branchesAPI.getAll();
    const filteredBranches = branchId ? branches.filter(b => b.id === branchId) : branches;

    // Get recent insights
    const insights = await insightsAPI.getAll({ limit: 5, status: 'new' });

    // Get unread notifications
    const unreadNotifications = await notificationsAPI.getUnreadCount();

    return {
      overview: {
        totalBranches: filteredBranches.length,
        activeBranches: filteredBranches.filter(b => b.status === 'active').length,
        totalRevenue: ordersStats.totalRevenue,
        totalOrders: ordersStats.totalOrders,
        averageOrderValue: ordersStats.averageOrderValue,
        period: `${days} days`
      },
      insights: insights.slice(0, 5),
      unreadNotifications
    };
  },

  /**
   * Get revenue trends
   */
  async getRevenueTrends(branchId = null, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('orders')
      .select('order_date, total')
      .eq('status', 'completed')
      .gte('order_date', startDate.toISOString().split('T')[0])
      .order('order_date', { ascending: true });

    if (branchId) query = query.eq('branch_id', branchId);

    const orders = await apiRequest(() => query, 'Failed to fetch revenue trends');

    // Group by date
    const trendsByDate = {};
    orders.forEach(order => {
      if (!trendsByDate[order.order_date]) {
        trendsByDate[order.order_date] = 0;
      }
      trendsByDate[order.order_date] += Number(order.total);
    });

    return Object.entries(trendsByDate).map(([date, revenue]) => ({
      date,
      revenue: Math.round(revenue * 100) / 100
    }));
  },

  /**
   * Get branch comparison data
   */
  async getBranchComparison(days = 30) {
    const branches = await branchesAPI.getAll();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const comparisonData = await Promise.all(
      branches.map(async (branch) => {
        const stats = await ordersAPI.getStatistics({
          branchId: branch.id,
          startDate: startDateStr
        });

        return {
          id: branch.id,
          name: branch.name,
          code: branch.code,
          city: branch.city,
          status: branch.status,
          revenue: stats.totalRevenue,
          orders: stats.totalOrders,
          averageOrderValue: stats.averageOrderValue
        };
      })
    );

    return comparisonData.sort((a, b) => b.revenue - a.revenue);
  },

  /**
   * Get top performing products/categories
   */
  async getTopPerformers(branchId = null, days = 30, limit = 10) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('order_items')
      .select('product_name, quantity, subtotal, orders!inner(branch_id, order_date)')
      .gte('orders.order_date', startDate.toISOString().split('T')[0]);

    if (branchId) query = query.eq('orders.branch_id', branchId);

    const items = await apiRequest(() => query, 'Failed to fetch top performers');

    // Group by product
    const productStats = {};
    items.forEach(item => {
      if (!productStats[item.product_name]) {
        productStats[item.product_name] = {
          name: item.product_name,
          quantity: 0,
          revenue: 0
        };
      }
      productStats[item.product_name].quantity += item.quantity;
      productStats[item.product_name].revenue += Number(item.subtotal);
    });

    return Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }
};

// ============================================================================
// TEAM MEMBERS API
// ============================================================================

export const teamAPI = {
  /**
   * Get all team members
   */
  async getAll() {
    return apiRequest(
      () => supabase
        .from('team_members')
        .select('*, member:member_id(email, full_name, role, avatar_url)')
        .order('created_at', { ascending: false }),
      'Failed to fetch team members'
    );
  },

  /**
   * Invite a team member
   */
  async invite(memberData) {
    return apiRequest(
      () => supabase
        .from('team_members')
        .insert([memberData])
        .select()
        .single(),
      'Failed to invite team member'
    );
  },

  /**
   * Update team member permissions
   */
  async updatePermissions(id, role, permissions, branchIds) {
    return apiRequest(
      () => supabase
        .from('team_members')
        .update({ role, permissions, branch_ids: branchIds, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single(),
      `Failed to update team member ${id}`
    );
  },

  /**
   * Remove team member
   */
  async remove(id) {
    return apiRequest(
      () => supabase
        .from('team_members')
        .delete()
        .eq('id', id),
      `Failed to remove team member ${id}`
    );
  }
};

// ============================================================================
// USER ACTIVITIES API
// ============================================================================

export const activitiesAPI = {
  /**
   * Get user activities
   */
  async getAll(filters = {}) {
    let query = supabase
      .from('user_activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.type) query = query.eq('activity_type', filters.type);
    if (filters.limit) query = query.limit(filters.limit);

    return apiRequest(() => query, 'Failed to fetch user activities');
  },

  /**
   * Log an activity
   */
  async log(activityType, description, metadata = {}) {
    return apiRequest(
      () => supabase
        .from('user_activities')
        .insert([{
          activity_type: activityType,
          activity_description: description,
          metadata,
          ip_address: null, // Will be filled by server if available
          user_agent: navigator.userAgent
        }])
        .select()
        .single(),
      'Failed to log activity'
    );
  }
};

// ============================================================================
// SUBSCRIPTIONS API
// ============================================================================

import subscriptionService from './subscriptionService';

export const subscriptionsAPI = subscriptionService;

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  brand: brandAPI,
  branches: branchesAPI,
  orders: ordersAPI,
  metrics: metricsAPI,
  insights: insightsAPI,
  reports: reportsAPI,
  notifications: notificationsAPI,
  analytics: analyticsAPI,
  team: teamAPI,
  activities: activitiesAPI,
  subscriptions: subscriptionsAPI
};
