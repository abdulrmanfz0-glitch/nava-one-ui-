/**
 * AI Intelligence Service
 * API wrapper for AI Intelligence Layer functionality
 */

import { logger } from '@/lib/logger';
import * as AI from '@/lib/aiIntelligence';

/**
 * AI Intelligence API Service
 */
export const aiIntelligenceAPI = {
  /**
   * Get comprehensive AI analysis for all data
   */
  async getComprehensiveAnalysis(data, options = {}) {
    try {
      logger.info('Running comprehensive AI analysis');
      const startTime = performance.now();

      const results = AI.runComprehensiveAnalysis(data, options);

      const duration = performance.now() - startTime;
      logger.info(`AI analysis completed in ${duration.toFixed(2)}ms`);

      return results;
    } catch (error) {
      logger.error('Comprehensive AI analysis failed', error);
      throw error;
    }
  },

  /**
   * Get AI insights summary
   */
  async getInsightsSummary(data) {
    try {
      return AI.getAIInsightsSummary(data);
    } catch (error) {
      logger.error('AI insights summary failed', error);
      throw error;
    }
  },

  /**
   * Get predictions for revenue, performance, and costs
   */
  async getPredictions(data, daysAhead = 30) {
    try {
      logger.info(`Generating predictions for ${daysAhead} days`);

      const predictions = {
        revenue: null,
        performance: null,
        costs: null,
        categories: null
      };

      if (data.revenue) {
        predictions.revenue = AI.predictRevenueTrend(data.revenue, daysAhead);
      }

      if (data.orders) {
        predictions.performance = AI.predictPerformance(data.orders, 'orders', daysAhead);
      }

      if (data.costs) {
        predictions.costs = AI.predictCostTrend(data.costs, daysAhead);
      }

      if (data.categories) {
        predictions.categories = AI.predictCategoryPerformance(data.categories, daysAhead);
      }

      return predictions;
    } catch (error) {
      logger.error('Prediction generation failed', error);
      throw error;
    }
  },

  /**
   * Detect anomalies in data
   */
  async detectAnomalies(data) {
    try {
      logger.info('Running anomaly detection');
      return AI.detectAllAnomalies(data);
    } catch (error) {
      logger.error('Anomaly detection failed', error);
      throw error;
    }
  },

  /**
   * Generate recommendations
   */
  async getRecommendations(data, limit = null) {
    try {
      logger.info('Generating AI recommendations');

      if (limit) {
        return AI.getTopRecommendations(data, limit);
      }

      return AI.generateAllRecommendations(data);
    } catch (error) {
      logger.error('Recommendation generation failed', error);
      throw error;
    }
  },

  /**
   * Calculate branch health scores
   */
  async getBranchHealthScores(branches, options = {}) {
    try {
      logger.info(`Calculating health scores for ${branches.length} branches`);

      if (branches.length === 1) {
        return AI.calculateBranchHealthScore(branches[0], options);
      }

      return AI.calculateMultipleBranchScores(branches, options);
    } catch (error) {
      logger.error('Health score calculation failed', error);
      throw error;
    }
  },

  /**
   * Get branch health summary
   */
  async getBranchHealthSummary(branches, options = {}) {
    try {
      return AI.getBranchHealthSummary(branches, options);
    } catch (error) {
      logger.error('Health summary calculation failed', error);
      throw error;
    }
  },

  /**
   * Cluster categories by performance
   */
  async clusterCategories(categories, options = {}) {
    try {
      logger.info(`Clustering ${categories.length} categories`);
      return AI.clusterCategories(categories, options);
    } catch (error) {
      logger.error('Category clustering failed', error);
      throw error;
    }
  },

  /**
   * Cluster branches by performance
   */
  async clusterBranches(branches, options = {}) {
    try {
      logger.info(`Clustering ${branches.length} branches`);
      return AI.clusterBranches(branches, options);
    } catch (error) {
      logger.error('Branch clustering failed', error);
      throw error;
    }
  },

  /**
   * Cluster customers by behavior
   */
  async clusterCustomers(customers, options = {}) {
    try {
      logger.info(`Clustering ${customers.length} customers`);
      return AI.clusterCustomers(customers, options);
    } catch (error) {
      logger.error('Customer clustering failed', error);
      throw error;
    }
  },

  /**
   * Explain performance changes
   */
  async explainPerformance(currentData, previousData, options = {}) {
    try {
      return AI.generatePerformanceExplanation(currentData, previousData, options);
    } catch (error) {
      logger.error('Performance explanation failed', error);
      throw error;
    }
  },

  /**
   * Explain performance trend
   */
  async explainTrend(historicalData, metric = 'revenue') {
    try {
      return AI.explainPerformanceTrend(historicalData, metric);
    } catch (error) {
      logger.error('Trend explanation failed', error);
      throw error;
    }
  },

  /**
   * Explain anomaly
   */
  async explainAnomaly(anomaly, historicalData) {
    try {
      return AI.explainAnomaly(anomaly, historicalData);
    } catch (error) {
      logger.error('Anomaly explanation failed', error);
      throw error;
    }
  },

  /**
   * Explain branch comparison
   */
  async explainBranchComparison(branch, allBranches) {
    try {
      return AI.explainBranchComparison(branch, allBranches);
    } catch (error) {
      logger.error('Branch comparison explanation failed', error);
      throw error;
    }
  },

  /**
   * Generate forecasts for 30/60/90 days
   */
  async generateForecasts(historicalData, metric = 'revenue') {
    try {
      logger.info(`Generating multi-period forecast for ${metric}`);
      return AI.generateMultiPeriodForecast(historicalData, metric);
    } catch (error) {
      logger.error('Forecast generation failed', error);
      throw error;
    }
  },

  /**
   * Generate revenue forecast
   */
  async generateRevenueForecast(historicalData, options = {}) {
    try {
      return AI.generateRevenueForecast(historicalData, options);
    } catch (error) {
      logger.error('Revenue forecast failed', error);
      throw error;
    }
  },

  /**
   * Generate comprehensive forecast summary
   */
  async getForecastSummary(historicalData) {
    try {
      return AI.generateForecastSummary(historicalData);
    } catch (error) {
      logger.error('Forecast summary failed', error);
      throw error;
    }
  },

  /**
   * Simulate price change scenario
   */
  async simulatePriceChange(currentData, priceChangePercent) {
    try {
      logger.info(`Simulating ${priceChangePercent}% price change`);
      return AI.simulatePriceChange(currentData, priceChangePercent);
    } catch (error) {
      logger.error('Price change simulation failed', error);
      throw error;
    }
  },

  /**
   * Simulate marketing campaign
   */
  async simulateMarketingCampaign(currentData, campaignData) {
    try {
      logger.info('Simulating marketing campaign');
      return AI.simulateMarketingCampaign(currentData, campaignData);
    } catch (error) {
      logger.error('Marketing campaign simulation failed', error);
      throw error;
    }
  },

  /**
   * Simulate cost reduction
   */
  async simulateCostReduction(currentData, costReductionData) {
    try {
      logger.info('Simulating cost reduction');
      return AI.simulateCostReduction(currentData, costReductionData);
    } catch (error) {
      logger.error('Cost reduction simulation failed', error);
      throw error;
    }
  },

  /**
   * Simulate new branch opening
   */
  async simulateNewBranch(existingBranchesData, newBranchData) {
    try {
      logger.info('Simulating new branch opening');
      return AI.simulateNewBranch(existingBranchesData, newBranchData);
    } catch (error) {
      logger.error('New branch simulation failed', error);
      throw error;
    }
  },

  /**
   * Simulate staff optimization
   */
  async simulateStaffOptimization(currentData, optimizationData) {
    try {
      logger.info('Simulating staff optimization');
      return AI.simulateStaffOptimization(currentData, optimizationData);
    } catch (error) {
      logger.error('Staff optimization simulation failed', error);
      throw error;
    }
  },

  /**
   * Compare multiple scenarios
   */
  async compareScenarios(scenarios) {
    try {
      logger.info(`Comparing ${scenarios.length} scenarios`);
      return AI.compareScenarios(scenarios);
    } catch (error) {
      logger.error('Scenario comparison failed', error);
      throw error;
    }
  },

  /**
   * Generate smart alerts
   */
  async generateAlerts(data, config = {}) {
    try {
      logger.info('Generating smart alerts');
      return AI.generateAllAlerts(data, config);
    } catch (error) {
      logger.error('Alert generation failed', error);
      throw error;
    }
  },

  /**
   * Filter alerts by severity
   */
  filterAlerts(alerts, minSeverity) {
    try {
      return AI.filterAlertsBySeverity(alerts, minSeverity);
    } catch (error) {
      logger.error('Alert filtering failed', error);
      throw error;
    }
  },

  /**
   * Get active alerts
   */
  getActiveAlerts(allAlerts, resolvedAlertIds = []) {
    try {
      return AI.getActiveAlerts(allAlerts, resolvedAlertIds);
    } catch (error) {
      logger.error('Active alerts retrieval failed', error);
      throw error;
    }
  },

  /**
   * Generate performance score
   */
  async generatePerformanceScore(data, industry = 'default') {
    try {
      logger.info(`Generating performance score for ${industry} industry`);
      return AI.generatePerformanceScore(data, industry);
    } catch (error) {
      logger.error('Performance score generation failed', error);
      throw error;
    }
  },

  /**
   * Score revenue performance
   */
  async scoreRevenue(data, industry = 'default') {
    try {
      return AI.scoreRevenuePerformance(data, industry);
    } catch (error) {
      logger.error('Revenue scoring failed', error);
      throw error;
    }
  },

  /**
   * Score operational performance
   */
  async scoreOperational(data, industry = 'default') {
    try {
      return AI.scoreOperationalPerformance(data, industry);
    } catch (error) {
      logger.error('Operational scoring failed', error);
      throw error;
    }
  },

  /**
   * Score financial performance
   */
  async scoreFinancial(data, industry = 'default') {
    try {
      return AI.scoreFinancialPerformance(data, industry);
    } catch (error) {
      logger.error('Financial scoring failed', error);
      throw error;
    }
  },

  /**
   * Score customer satisfaction
   */
  async scoreCustomer(data, industry = 'default') {
    try {
      return AI.scoreCustomerSatisfaction(data, industry);
    } catch (error) {
      logger.error('Customer satisfaction scoring failed', error);
      throw error;
    }
  },

  /**
   * Benchmark against peers
   */
  async benchmarkAgainstPeers(myData, peerData) {
    try {
      logger.info('Benchmarking against peers');
      return AI.benchmarkAgainstPeers(myData, peerData);
    } catch (error) {
      logger.error('Peer benchmarking failed', error);
      throw error;
    }
  },

  /**
   * Get industry benchmarks
   */
  getIndustryBenchmarks(industry = 'default') {
    try {
      return AI.getIndustryBenchmarks(industry);
    } catch (error) {
      logger.error('Industry benchmark retrieval failed', error);
      throw error;
    }
  }
};

export default aiIntelligenceAPI;
