/**
 * AI Intelligence Context
 * Manages AI analysis state and provides AI intelligence functionality
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { aiIntelligenceAPI } from '@/services/aiIntelligence';
import { logger } from '@/lib/logger';

const AIContext = createContext(null);

export function AIProvider({ children }) {
  // State
  const [analysisData, setAnalysisData] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [forecasts, setForecasts] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [healthScores, setHealthScores] = useState(null);
  const [performanceScores, setPerformanceScores] = useState(null);
  const [clusters, setClusters] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  /**
   * Run comprehensive AI analysis
   */
  const runAnalysis = useCallback(async (data, options = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      logger.info('Running comprehensive AI analysis');
      const results = await aiIntelligenceAPI.getComprehensiveAnalysis(data, options);

      setAnalysisData(results);
      setPredictions(results.predictions);
      setAnomalies(results.anomalies);
      setRecommendations(results.recommendations);
      setForecasts(results.forecasts);
      setAlerts(results.alerts);
      setHealthScores(results.healthScores);
      setPerformanceScores(results.scores);
      setClusters(results.clusters);
      setLastUpdate(new Date());

      return results;
    } catch (err) {
      logger.error('AI analysis failed', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get quick insights summary
   */
  const getInsightsSummary = useCallback(async (data) => {
    try {
      return await aiIntelligenceAPI.getInsightsSummary(data);
    } catch (err) {
      logger.error('Insights summary failed', err);
      throw err;
    }
  }, []);

  /**
   * Update predictions
   */
  const updatePredictions = useCallback(async (data, daysAhead = 30) => {
    setIsLoading(true);
    try {
      const results = await aiIntelligenceAPI.getPredictions(data, daysAhead);
      setPredictions(results);
      return results;
    } catch (err) {
      logger.error('Prediction update failed', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update anomalies
   */
  const updateAnomalies = useCallback(async (data) => {
    setIsLoading(true);
    try {
      const results = await aiIntelligenceAPI.detectAnomalies(data);
      setAnomalies(results);
      return results;
    } catch (err) {
      logger.error('Anomaly detection failed', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update recommendations
   */
  const updateRecommendations = useCallback(async (data, limit = null) => {
    setIsLoading(true);
    try {
      const results = await aiIntelligenceAPI.getRecommendations(data, limit);
      setRecommendations(results);
      return results;
    } catch (err) {
      logger.error('Recommendation update failed', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update forecasts
   */
  const updateForecasts = useCallback(async (historicalData) => {
    setIsLoading(true);
    try {
      const results = await aiIntelligenceAPI.getForecastSummary(historicalData);
      setForecasts(results);
      return results;
    } catch (err) {
      logger.error('Forecast update failed', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update alerts
   */
  const updateAlerts = useCallback(async (data, config = {}) => {
    setIsLoading(true);
    try {
      const results = await aiIntelligenceAPI.generateAlerts(data, config);
      setAlerts(results);
      return results;
    } catch (err) {
      logger.error('Alert update failed', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update health scores
   */
  const updateHealthScores = useCallback(async (branches, options = {}) => {
    setIsLoading(true);
    try {
      const results = await aiIntelligenceAPI.getBranchHealthSummary(branches, options);
      setHealthScores(results);
      return results;
    } catch (err) {
      logger.error('Health score update failed', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update performance scores
   */
  const updatePerformanceScores = useCallback(async (data, industry = 'default') => {
    setIsLoading(true);
    try {
      const results = await aiIntelligenceAPI.generatePerformanceScore(data, industry);
      setPerformanceScores(results);
      return results;
    } catch (err) {
      logger.error('Performance score update failed', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Run What-If scenario
   */
  const runScenario = useCallback(async (scenarioType, currentData, scenarioData) => {
    try {
      switch (scenarioType) {
        case 'price_change':
          return await aiIntelligenceAPI.simulatePriceChange(currentData, scenarioData);
        case 'marketing_campaign':
          return await aiIntelligenceAPI.simulateMarketingCampaign(currentData, scenarioData);
        case 'cost_reduction':
          return await aiIntelligenceAPI.simulateCostReduction(currentData, scenarioData);
        case 'new_branch':
          return await aiIntelligenceAPI.simulateNewBranch(currentData, scenarioData);
        case 'staff_optimization':
          return await aiIntelligenceAPI.simulateStaffOptimization(currentData, scenarioData);
        default:
          throw new Error(`Unknown scenario type: ${scenarioType}`);
      }
    } catch (err) {
      logger.error('Scenario simulation failed', err);
      throw err;
    }
  }, []);

  /**
   * Compare multiple scenarios
   */
  const compareScenarios = useCallback(async (scenarios) => {
    try {
      return await aiIntelligenceAPI.compareScenarios(scenarios);
    } catch (err) {
      logger.error('Scenario comparison failed', err);
      throw err;
    }
  }, []);

  /**
   * Clear all AI data
   */
  const clearAIData = useCallback(() => {
    setAnalysisData(null);
    setPredictions(null);
    setAnomalies(null);
    setRecommendations(null);
    setForecasts(null);
    setAlerts(null);
    setHealthScores(null);
    setPerformanceScores(null);
    setClusters(null);
    setError(null);
    setLastUpdate(null);
  }, []);

  const value = {
    // State
    analysisData,
    predictions,
    anomalies,
    recommendations,
    forecasts,
    alerts,
    healthScores,
    performanceScores,
    clusters,
    isLoading,
    error,
    lastUpdate,

    // Methods
    runAnalysis,
    getInsightsSummary,
    updatePredictions,
    updateAnomalies,
    updateRecommendations,
    updateForecasts,
    updateAlerts,
    updateHealthScores,
    updatePerformanceScores,
    runScenario,
    compareScenarios,
    clearAIData,

    // Direct API access
    api: aiIntelligenceAPI
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

/**
 * Hook to use AI Intelligence context
 */
export function useAI() {
  const context = useContext(AIContext);

  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }

  return context;
}

export default AIContext;
