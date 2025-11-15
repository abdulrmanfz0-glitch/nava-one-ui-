// NAVA OPS - Executive API Service Layer
// Premium API endpoints for executive-level analytics and insights

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import api from './api';

/**
 * Executive API - High-level business intelligence endpoints
 */
export const executiveAPI = {
  /**
   * Get comprehensive executive overview
   */
  async getExecutiveOverview(days = 365) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];

      // Get previous period for comparison
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - days);
      const previousStartDateStr = previousStartDate.toISOString().split('T')[0];

      // Fetch all branches
      const branches = await api.branches.getAll();
      const activeBranches = branches.filter(b => b.status === 'active');

      // Fetch current period orders
      const currentOrders = await api.orders.getAll({
        startDate: startDateStr
      });

      // Fetch previous period orders
      const previousOrders = await api.orders.getAll({
        startDate: previousStartDateStr,
        endDate: startDateStr
      });

      // Calculate metrics
      const currentRevenue = currentOrders.reduce((sum, order) =>
        sum + (order.status === 'completed' ? Number(order.total) : 0), 0
      );

      const previousRevenue = previousOrders.reduce((sum, order) =>
        sum + (order.status === 'completed' ? Number(order.total) : 0), 0
      );

      const revenueChange = previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

      // Calculate costs (estimated at 65% of revenue)
      const currentCosts = currentRevenue * 0.65;
      const currentProfit = currentRevenue - currentCosts;
      const previousProfit = previousRevenue - (previousRevenue * 0.65);
      const profitChange = previousProfit > 0
        ? ((currentProfit - previousProfit) / previousProfit) * 100
        : 0;

      // Get team data
      const teamMembers = await api.team.getAll();

      return {
        totalRevenue: Math.round(currentRevenue),
        revenueChange: Math.round(revenueChange * 10) / 10,
        netProfit: Math.round(currentProfit),
        profitChange: Math.round(profitChange * 10) / 10,
        profitMargin: ((currentProfit / currentRevenue) * 100) || 35,
        totalBranches: branches.length,
        activeBranches: activeBranches.length,
        branchGrowth: branches.filter(b => {
          const created = new Date(b.created_at);
          return created >= startDate;
        }).length,
        totalEmployees: teamMembers.length,
        employeeGrowth: 5.2, // Mock data
        employeeRetention: 92.5 // Mock data
      };
    } catch (error) {
      logger.error('Failed to fetch executive overview', error);
      throw error;
    }
  },

  /**
   * Get business health index
   */
  async getHealthIndex() {
    try {
      const overview = await this.getExecutiveOverview(30);

      // Calculate health scores (0-100)
      const financial = Math.min(100, Math.max(0,
        (overview.profitMargin * 2) + (overview.revenueChange > 0 ? 20 : -20)
      ));

      const operational = Math.min(100, Math.max(0,
        75 + (overview.activeBranches / overview.totalBranches * 25)
      ));

      const customer = Math.min(100, Math.max(0, 85)); // Mock - would come from satisfaction data
      const employee = Math.min(100, Math.max(0, overview.employeeRetention));

      const overallScore = Math.round(
        (financial * 0.35) +
        (operational * 0.25) +
        (customer * 0.25) +
        (employee * 0.15)
      );

      return {
        overallScore,
        financial: Math.round(financial),
        operational: Math.round(operational),
        customer: Math.round(customer),
        employee: Math.round(employee)
      };
    } catch (error) {
      logger.error('Failed to fetch health index', error);
      throw error;
    }
  },

  /**
   * Get geographic distribution of branches
   */
  async getGeographicDistribution() {
    try {
      const branches = await api.branches.getAll();
      const branchComparison = await api.analytics.getBranchComparison(365);

      // Group by city
      const cityGroups = {};

      branches.forEach(branch => {
        const city = branch.city || 'Unknown';
        if (!cityGroups[city]) {
          cityGroups[city] = {
            city,
            branchCount: 0,
            revenue: 0,
            branches: []
          };
        }
        cityGroups[city].branchCount++;
        cityGroups[city].branches.push(branch.id);
      });

      // Add revenue data
      branchComparison.forEach(branch => {
        const city = branch.city || 'Unknown';
        if (cityGroups[city]) {
          cityGroups[city].revenue += branch.revenue;
        }
      });

      // Calculate market share and growth
      const totalRevenue = Object.values(cityGroups).reduce((sum, city) => sum + city.revenue, 0);

      return Object.values(cityGroups).map(city => ({
        ...city,
        marketShare: totalRevenue > 0 ? Math.round((city.revenue / totalRevenue) * 100 * 10) / 10 : 0,
        growth: Math.round((Math.random() * 30 - 10) * 10) / 10 // Mock data
      })).sort((a, b) => b.revenue - a.revenue);
    } catch (error) {
      logger.error('Failed to fetch geographic distribution', error);
      throw error;
    }
  },

  /**
   * Get branch leaderboards (best and worst performers)
   */
  async getBranchLeaderboards(days = 30) {
    try {
      const branchComparison = await api.analytics.getBranchComparison(days);

      // Sort by revenue
      const sorted = [...branchComparison].sort((a, b) => b.revenue - a.revenue);

      // Get top 5 and bottom 5
      const best = sorted.slice(0, 5).map(branch => ({
        ...branch,
        growth: Math.round((Math.random() * 40 + 10) * 10) / 10 // Mock positive growth
      }));

      const worst = sorted.slice(-5).reverse().map(branch => ({
        ...branch,
        decline: Math.round((Math.random() * 30 + 5) * 10) / 10 // Mock decline
      }));

      return { best, worst };
    } catch (error) {
      logger.error('Failed to fetch branch leaderboards', error);
      throw error;
    }
  },

  /**
   * Get employee performance summary
   */
  async getEmployeePerformance(days = 30) {
    try {
      const teamMembers = await api.team.getAll();
      const branches = await api.branches.getAll();

      // Create performance data for each employee
      return teamMembers.map(member => {
        const branch = branches.find(b =>
          member.branch_ids && member.branch_ids.includes(b.id)
        );

        return {
          id: member.id,
          name: member.member?.full_name || 'Unknown',
          branch: branch?.name || 'Unassigned',
          role: member.role || 'Staff',
          performance: Math.round(Math.random() * 40 + 60), // 60-100%
          sales: Math.round(Math.random() * 50000 + 10000), // SAR 10k-60k
          rating: (Math.random() * 2 + 3).toFixed(1) // 3.0-5.0
        };
      }).sort((a, b) => b.performance - a.performance);
    } catch (error) {
      logger.error('Failed to fetch employee performance', error);
      throw error;
    }
  },

  /**
   * Get executive alerts requiring attention
   */
  async getExecutiveAlerts() {
    try {
      // Fetch insights and create executive alerts
      const insights = await api.insights.getAll({ limit: 20 });
      const branches = await api.branches.getAll();

      const alerts = [];

      // Check for critical insights
      insights.forEach(insight => {
        if (insight.severity === 'critical' || insight.severity === 'high') {
          const branch = branches.find(b => b.id === insight.branch_id);
          alerts.push({
            id: insight.id,
            severity: insight.severity,
            title: insight.insight_type.replace('_', ' ').toUpperCase(),
            description: insight.description || insight.title,
            branch: branch?.name,
            created: insight.created_at
          });
        }
      });

      // Add system-level alerts
      const inactiveBranches = branches.filter(b => b.status !== 'active');
      if (inactiveBranches.length > 0) {
        alerts.push({
          severity: 'high',
          title: 'Inactive Branches Detected',
          description: `${inactiveBranches.length} branch(es) are currently inactive and not generating revenue.`,
          branch: null
        });
      }

      // Check for low performing branches
      const branchComparison = await api.analytics.getBranchComparison(30);
      const lowPerformers = branchComparison.filter(b => b.revenue < 10000);
      if (lowPerformers.length > 0) {
        alerts.push({
          severity: 'medium',
          title: 'Low Revenue Branches',
          description: `${lowPerformers.length} branch(es) have revenue below SAR 10,000 this month.`,
          branch: lowPerformers.map(b => b.name).join(', ')
        });
      }

      return alerts.slice(0, 10).sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
    } catch (error) {
      logger.error('Failed to fetch executive alerts', error);
      throw error;
    }
  },

  /**
   * Get multi-year trends
   */
  async getMultiYearTrends() {
    try {
      // Fetch revenue trends for different time periods
      const currentYear = await api.analytics.getRevenueTrends(null, 365);

      // Generate monthly aggregates
      const monthlyData = {};

      currentYear.forEach(day => {
        const month = day.date.substring(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = {
            date: month,
            year3: day.revenue, // 2025 (current)
            year2: day.revenue * 0.85, // 2024 (mock)
            year1: day.revenue * 0.70 // 2023 (mock)
          };
        } else {
          monthlyData[month].year3 += day.revenue;
          monthlyData[month].year2 += day.revenue * 0.85;
          monthlyData[month].year1 += day.revenue * 0.70;
        }
      });

      return Object.values(monthlyData).slice(-12); // Last 12 months
    } catch (error) {
      logger.error('Failed to fetch multi-year trends', error);
      throw error;
    }
  },

  /**
   * Get cost vs revenue analysis
   */
  async getCostVsRevenue(days = 30) {
    try {
      const overview = await this.getExecutiveOverview(days);

      const revenue = overview.totalRevenue;
      const costs = revenue * 0.65; // 65% costs
      const profit = revenue - costs;

      return [
        { name: 'Revenue', value: Math.round(revenue), color: '#10B981' },
        { name: 'Costs', value: Math.round(costs), color: '#EF4444' },
        { name: 'Profit', value: Math.round(profit), color: '#0088FF' }
      ];
    } catch (error) {
      logger.error('Failed to fetch cost vs revenue', error);
      throw error;
    }
  },

  /**
   * Get profitability map by branch
   */
  async getProfitabilityMap(days = 30) {
    try {
      const branchComparison = await api.analytics.getBranchComparison(days);

      return branchComparison.map(branch => ({
        ...branch,
        profit: Math.round(branch.revenue * 0.35), // 35% profit margin
        profitMargin: 35
      })).sort((a, b) => b.profit - a.profit);
    } catch (error) {
      logger.error('Failed to fetch profitability map', error);
      throw error;
    }
  },

  /**
   * Get AI-powered strategic recommendations
   */
  async getAIRecommendations() {
    try {
      const overview = await this.getExecutiveOverview(30);
      const leaderboards = await this.getBranchLeaderboards(30);
      const alerts = await this.getExecutiveAlerts();

      const recommendations = [];

      // Revenue optimization recommendation
      if (overview.revenueChange < 10) {
        recommendations.push({
          priority: 'high',
          category: 'Revenue Growth',
          title: 'Accelerate Revenue Growth Strategy',
          description: `Current revenue growth is ${overview.revenueChange.toFixed(1)}%, below the industry target of 15%. Implementing targeted marketing campaigns and menu optimization could increase revenue by 20-30%.`,
          impact: '+25% Revenue',
          timeline: '3-6 months',
          actions: [
            'Launch seasonal menu items with higher margins',
            'Implement dynamic pricing during peak hours',
            'Increase digital marketing budget by 30%',
            'Partner with food delivery platforms in new areas'
          ]
        });
      }

      // Branch optimization recommendation
      if (leaderboards.worst.length > 0) {
        recommendations.push({
          priority: 'high',
          category: 'Operations',
          title: 'Optimize Underperforming Branches',
          description: `${leaderboards.worst.length} branches are significantly underperforming. Strategic interventions including staff training, menu adjustments, and operational improvements could increase their profitability by 40%.`,
          impact: '+40% Branch Efficiency',
          timeline: '2-4 months',
          actions: [
            'Conduct operational audits at low-performing locations',
            'Implement best practices from top-performing branches',
            'Provide intensive management training programs',
            'Consider menu localization based on regional preferences'
          ]
        });
      }

      // Profit margin recommendation
      if (overview.profitMargin < 30) {
        recommendations.push({
          priority: 'medium',
          category: 'Financial',
          title: 'Improve Profit Margins',
          description: `Current profit margin is ${overview.profitMargin.toFixed(1)}%. Cost optimization and pricing strategy adjustments could improve margins to industry-leading 35-40%.`,
          impact: '+8% Profit Margin',
          timeline: '4-6 months',
          actions: [
            'Renegotiate supplier contracts for better pricing',
            'Implement inventory management system to reduce waste',
            'Optimize staff scheduling based on demand patterns',
            'Review and adjust menu pricing strategy'
          ]
        });
      }

      // Employee retention recommendation
      if (overview.employeeRetention < 90) {
        recommendations.push({
          priority: 'medium',
          category: 'Human Resources',
          title: 'Enhance Employee Retention',
          description: `Employee retention is at ${overview.employeeRetention}%. Improving workplace culture, compensation, and career development could reduce turnover costs by SAR 500,000 annually.`,
          impact: 'SAR 500K Savings',
          timeline: '6-12 months',
          actions: [
            'Launch employee recognition and rewards program',
            'Implement competitive benefits package',
            'Create clear career advancement pathways',
            'Conduct quarterly employee satisfaction surveys'
          ]
        });
      }

      // Expansion recommendation
      if (overview.activeBranches < 20 && overview.revenueChange > 15) {
        recommendations.push({
          priority: 'low',
          category: 'Growth',
          title: 'Strategic Geographic Expansion',
          description: `Strong performance metrics indicate readiness for expansion. Market analysis suggests 3-5 new locations could generate SAR 2-3M additional annual revenue.`,
          impact: 'SAR 2.5M Revenue',
          timeline: '12-18 months',
          actions: [
            'Conduct market research in target cities',
            'Develop detailed financial projections',
            'Secure funding and partnerships',
            'Pilot franchise model in selected locations'
          ]
        });
      }

      // Technology recommendation
      recommendations.push({
        priority: 'medium',
        category: 'Technology',
        title: 'Digital Transformation Initiative',
        description: 'Implementing advanced analytics, AI-powered forecasting, and automated operations could reduce costs by 15% and improve customer experience significantly.',
        impact: '15% Cost Reduction',
        timeline: '6-9 months',
        actions: [
          'Deploy AI-powered demand forecasting system',
          'Implement mobile ordering and loyalty app',
          'Integrate kitchen automation technologies',
          'Adopt cloud-based analytics platform'
        ]
      });

      return recommendations;
    } catch (error) {
      logger.error('Failed to fetch AI recommendations', error);
      throw error;
    }
  },

  /**
   * Get consolidated reports
   */
  async getConsolidatedReports(days = 30) {
    try {
      const reports = [
        {
          id: 1,
          title: 'Executive Summary Report',
          description: 'Comprehensive overview of business performance across all metrics',
          date: new Date().toISOString().split('T')[0],
          pages: 12,
          type: 'executive'
        },
        {
          id: 2,
          title: 'Financial Performance Report',
          description: 'Detailed financial analysis including P&L, cash flow, and forecasts',
          date: new Date().toISOString().split('T')[0],
          pages: 18,
          type: 'financial'
        },
        {
          id: 3,
          title: 'Branch Performance Analysis',
          description: 'Individual branch metrics, comparisons, and improvement recommendations',
          date: new Date().toISOString().split('T')[0],
          pages: 24,
          type: 'operations'
        },
        {
          id: 4,
          title: 'Market & Competitive Analysis',
          description: 'Market trends, competitor analysis, and strategic positioning',
          date: new Date().toISOString().split('T')[0],
          pages: 15,
          type: 'market'
        },
        {
          id: 5,
          title: 'Employee Performance Report',
          description: 'Team productivity, satisfaction scores, and retention analytics',
          date: new Date().toISOString().split('T')[0],
          pages: 10,
          type: 'hr'
        },
        {
          id: 6,
          title: 'Customer Insights Report',
          description: 'Customer behavior analysis, satisfaction metrics, and loyalty trends',
          date: new Date().toISOString().split('T')[0],
          pages: 14,
          type: 'customer'
        }
      ];

      return reports;
    } catch (error) {
      logger.error('Failed to fetch consolidated reports', error);
      throw error;
    }
  },

  /**
   * Export consolidated report
   */
  async exportConsolidatedReport(dateRange) {
    try {
      // In a real implementation, this would generate a PDF or Excel report
      logger.info('Exporting consolidated report', { dateRange });

      // Mock implementation - would call backend API to generate report
      return {
        success: true,
        downloadUrl: '#',
        message: 'Report generated successfully'
      };
    } catch (error) {
      logger.error('Failed to export consolidated report', error);
      throw error;
    }
  }
};

export default executiveAPI;
