/**
 * Advisor Metrics Service
 * Aggregates and formats business metrics for the AI Business Advisor
 */

import { brandAPI, branchesAPI, ordersAPI } from './api';
import { logger } from '@/lib/logger';
import {
  generatePredictionSummary,
  detectAllAnomalies,
  getTopRecommendations,
  getAIInsightsSummary,
  calculateBranchHealthScore,
} from '@/lib/aiIntelligence';

/**
 * Get comprehensive business metrics for AI context
 * @param {Object} options - Options for fetching metrics
 * @returns {Promise<Object>} - Formatted metrics object
 */
export async function getBusinessMetricsForAdvisor(options = {}) {
  const {
    branchId = null,
    includePredictions = true,
    includeAnomalies = true,
    includeRecommendations = true,
    timeframe = 'current', // 'current', 'week', 'month'
  } = options;

  try {
    logger.info('Fetching business metrics for AI advisor', options);

    const metrics = {
      brand: null,
      branch: null,
      statistics: null,
      performance: null,
      recentOrders: null,
      insights: null,
      aiAnalysis: null,
      timestamp: new Date().toISOString(),
    };

    // 1. Get brand information
    try {
      metrics.brand = await brandAPI.get();
    } catch (error) {
      logger.warn('Could not fetch brand data', error);
    }

    // 2. Get branch information and statistics
    if (branchId) {
      try {
        metrics.branch = await branchesAPI.getById(branchId);
        metrics.statistics = await branchesAPI.getStatistics(branchId);
      } catch (error) {
        logger.warn('Could not fetch branch data', error);
      }

      // 3. Get performance data based on timeframe
      try {
        const { startDate, endDate } = getDateRange(timeframe);
        metrics.performance = await branchesAPI.getPerformance(
          branchId,
          startDate,
          endDate
        );
      } catch (error) {
        logger.warn('Could not fetch performance data', error);
      }

      // 4. Get recent orders for context
      try {
        const { startDate } = getDateRange('week');
        metrics.recentOrders = await ordersAPI.getAll({
          branchId,
          startDate,
          limit: 50,
        });
      } catch (error) {
        logger.warn('Could not fetch recent orders', error);
      }
    } else if (metrics.brand) {
      // Get brand-level statistics if no specific branch
      try {
        metrics.statistics = await brandAPI.getStatistics();
      } catch (error) {
        logger.warn('Could not fetch brand statistics', error);
      }
    }

    // 5. Generate AI-powered insights
    if (metrics.statistics || metrics.performance) {
      const dataForAI = prepareDataForAIAnalysis(metrics);

      if (includePredictions || includeAnomalies || includeRecommendations) {
        try {
          metrics.aiAnalysis = {
            predictions: includePredictions
              ? generatePredictionSummary(dataForAI)
              : null,
            anomalies: includeAnomalies
              ? detectAllAnomalies(dataForAI)
              : null,
            recommendations: includeRecommendations
              ? getTopRecommendations(dataForAI, 5)
              : null,
            healthScore: metrics.branch
              ? calculateBranchHealthScore(dataForAI)
              : null,
            summary: getAIInsightsSummary(dataForAI),
          };
        } catch (error) {
          logger.warn('Could not generate AI analysis', error);
        }
      }
    }

    // 6. Format insights in a human-readable way
    metrics.insights = formatInsightsForAdvisor(metrics);

    logger.info('Successfully fetched business metrics for advisor');
    return metrics;
  } catch (error) {
    logger.error('Failed to fetch business metrics for advisor', error);
    return {
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Prepare data for AI intelligence analysis
 */
function prepareDataForAIAnalysis(metrics) {
  const data = {
    revenue: [],
    orders: [],
    performance: [],
    categories: [],
    branches: [],
  };

  // Extract performance data
  if (metrics.performance && Array.isArray(metrics.performance)) {
    data.performance = metrics.performance.map((entry) => ({
      date: entry.entry_date,
      revenue: entry.total_sales || entry.revenue || 0,
      orders: entry.total_orders || 0,
      costs: entry.total_costs || entry.food_cost || 0,
      profit: (entry.total_sales || 0) - (entry.total_costs || 0),
    }));

    // Extract revenue series
    data.revenue = data.performance.map((p) => p.revenue);
    data.orders = data.performance.map((p) => p.orders);
  }

  // Extract statistics
  if (metrics.statistics) {
    data.totalRevenue = metrics.statistics.total_revenue || 0;
    data.totalOrders = metrics.statistics.total_orders || 0;
    data.averageOrderValue = metrics.statistics.avg_order_value || 0;
    data.totalCosts = metrics.statistics.total_costs || 0;
  }

  // Extract recent orders
  if (metrics.recentOrders && Array.isArray(metrics.recentOrders)) {
    data.recentOrderCount = metrics.recentOrders.length;
    data.recentOrdersValue = metrics.recentOrders.reduce(
      (sum, order) => sum + (order.total || 0),
      0
    );
  }

  return data;
}

/**
 * Format insights in a human-readable format for the AI advisor
 */
function formatInsightsForAdvisor(metrics) {
  const insights = {
    quickSummary: '',
    keyMetrics: {},
    trends: [],
    concerns: [],
    opportunities: [],
  };

  // Format key metrics
  if (metrics.statistics) {
    insights.keyMetrics = {
      revenue: formatCurrency(metrics.statistics.total_revenue || 0),
      orders: formatNumber(metrics.statistics.total_orders || 0),
      averageOrderValue: formatCurrency(metrics.statistics.avg_order_value || 0),
      costs: formatCurrency(metrics.statistics.total_costs || 0),
      profit: formatCurrency(
        (metrics.statistics.total_revenue || 0) - (metrics.statistics.total_costs || 0)
      ),
    };
  }

  // Extract trends from AI analysis
  if (metrics.aiAnalysis) {
    if (metrics.aiAnalysis.predictions?.revenue) {
      insights.trends.push({
        type: 'revenue',
        direction: metrics.aiAnalysis.predictions.revenue.trend,
        change: metrics.aiAnalysis.predictions.revenue.changePercent,
        description: `Revenue trend is ${metrics.aiAnalysis.predictions.revenue.trend}`,
      });
    }

    // Extract concerns from anomalies
    if (metrics.aiAnalysis.anomalies?.anomalies?.length > 0) {
      insights.concerns = metrics.aiAnalysis.anomalies.anomalies
        .slice(0, 3)
        .map((a) => ({
          type: a.type,
          severity: a.severity,
          description: a.description,
        }));
    }

    // Extract opportunities from recommendations
    if (metrics.aiAnalysis.recommendations?.recommendations?.length > 0) {
      insights.opportunities = metrics.aiAnalysis.recommendations.recommendations
        .slice(0, 3)
        .map((r) => ({
          priority: r.priority,
          category: r.category,
          action: r.action,
          impact: r.impact,
        }));
    }

    // Build quick summary
    if (metrics.aiAnalysis.summary) {
      const { overallHealth, criticalAlerts, trendDirection } =
        metrics.aiAnalysis.summary;
      insights.quickSummary = `Overall health: ${overallHealth}. Trend: ${trendDirection}. ${
        criticalAlerts > 0 ? `${criticalAlerts} critical alerts.` : 'No critical alerts.'
      }`;
    }
  }

  // Build a natural language summary
  if (metrics.statistics) {
    const revenue = metrics.statistics.total_revenue || 0;
    const orders = metrics.statistics.total_orders || 0;
    insights.quickSummary =
      `Current performance: ${formatCurrency(revenue)} revenue from ${formatNumber(orders)} orders` +
      (insights.quickSummary ? `. ${insights.quickSummary}` : '');
  }

  return insights;
}

/**
 * Get date range based on timeframe
 */
function getDateRange(timeframe) {
  const endDate = new Date();
  let startDate = new Date();

  switch (timeframe) {
    case 'week':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      // Current - last 7 days
      startDate.setDate(endDate.getDate() - 7);
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

/**
 * Format currency
 */
function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format number
 */
function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(value);
}

export default {
  getBusinessMetricsForAdvisor,
};
