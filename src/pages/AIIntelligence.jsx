/**
 * AI Intelligence Dashboard
 * Comprehensive AI-powered analytics and insights page
 */

import { useState, useEffect } from 'react';
import { useAI } from '@/contexts/AIContext';
import { PageHeader } from '@/components/UI/PageHeader';
import { LoadingSpinner } from '@/components/UI/LoadingSpinner';
import { StatCard } from '@/components/UI/StatCard';
import { LineChart, BarChart, PieChart } from '@/components/UI/Charts';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Target,
  Activity,
  Calendar,
  Award,
  BarChart3,
  Zap
} from 'lucide-react';

export default function AIIntelligence() {
  const {
    analysisData,
    predictions,
    anomalies,
    recommendations,
    forecasts,
    alerts,
    healthScores,
    performanceScores,
    isLoading,
    error,
    runAnalysis,
    getInsightsSummary
  } = useAI();

  const [activeTab, setActiveTab] = useState('overview');
  const [insightsSummary, setInsightsSummary] = useState(null);

  // Load initial data
  useEffect(() => {
    loadAIData();
  }, []);

  const loadAIData = async () => {
    try {
      // In a real app, fetch actual data from your API
      const mockData = {
        revenue: generateMockRevenueData(),
        orders: generateMockOrdersData(),
        costs: generateMockCostsData(),
        categories: generateMockCategoriesData(),
        branches: generateMockBranchesData(),
        customers: generateMockCustomersData()
      };

      await runAnalysis(mockData, {
        enablePredictions: true,
        enableAnomalies: true,
        enableRecommendations: true,
        enableForecasts: true,
        enableAlerts: true,
        enableScoring: true
      });

      const summary = await getInsightsSummary(mockData);
      setInsightsSummary(summary);
    } catch (err) {
      console.error('Failed to load AI data:', err);
    }
  };

  if (isLoading && !analysisData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Analyzing your data with AI...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading AI analysis: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="AI Intelligence"
        description="AI-powered insights, predictions, and recommendations"
        icon={Brain}
      />

      {/* Quick Insights Summary */}
      {insightsSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Overall Health"
            value={insightsSummary.overallHealth}
            icon={Activity}
            trend={insightsSummary.trendDirection === 'increasing' ? 'up' : 'down'}
            color={
              insightsSummary.overallHealth === 'excellent'
                ? 'green'
                : insightsSummary.overallHealth === 'good'
                ? 'blue'
                : 'yellow'
            }
          />
          <StatCard
            title="Active Alerts"
            value={insightsSummary.criticalAlerts}
            icon={AlertTriangle}
            color={insightsSummary.criticalAlerts > 0 ? 'red' : 'green'}
          />
          <StatCard
            title="Recommendations"
            value={insightsSummary.topRecommendations?.length || 0}
            icon={Lightbulb}
            color="purple"
          />
          <StatCard
            title="Trend Direction"
            value={insightsSummary.trendDirection}
            icon={insightsSummary.trendDirection === 'increasing' ? TrendingUp : TrendingDown}
            color={insightsSummary.trendDirection === 'increasing' ? 'green' : 'red'}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'predictions', label: 'Predictions', icon: TrendingUp },
            { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
            { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
            { id: 'forecasts', label: 'Forecasts', icon: Calendar },
            { id: 'scores', label: 'Performance Scores', icon: Award }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && <OverviewTab analysisData={analysisData} />}
        {activeTab === 'predictions' && <PredictionsTab predictions={predictions} />}
        {activeTab === 'anomalies' && <AnomaliesTab anomalies={anomalies} />}
        {activeTab === 'recommendations' && (
          <RecommendationsTab recommendations={recommendations} />
        )}
        {activeTab === 'forecasts' && <ForecastsTab forecasts={forecasts} />}
        {activeTab === 'scores' && <ScoresTab scores={performanceScores} />}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ analysisData }) {
  if (!analysisData) {
    return <div className="text-center py-8 text-gray-500">No analysis data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
          <div className="space-y-3">
            {analysisData.predictions?.revenue && (
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Revenue Trend</p>
                  <p className="text-sm text-gray-600">
                    {analysisData.predictions.revenue.trend} (
                    {analysisData.predictions.revenue.changePercent.toFixed(1)}%)
                  </p>
                </div>
              </div>
            )}
            {analysisData.anomalies?.summary && (
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium">Anomalies Detected</p>
                  <p className="text-sm text-gray-600">
                    {analysisData.anomalies.summary.total} anomalies found
                  </p>
                </div>
              </div>
            )}
            {analysisData.recommendations?.summary && (
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium">Action Items</p>
                  <p className="text-sm text-gray-600">
                    {analysisData.recommendations.summary.total} recommendations available
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Health Score */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">System Health</h3>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {analysisData.scores?.overallScore || 'N/A'}
              </div>
              <div className="text-gray-600">Overall Performance Score</div>
              {analysisData.scores?.grade && (
                <div className="mt-2 inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  Grade: {analysisData.scores.grade}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {analysisData.predictions?.revenue && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Prediction (30 Days)</h3>
          <div className="h-64">
            <LineChart
              data={analysisData.predictions.revenue.predictions.map((p) => ({
                name: `Day ${p.day}`,
                value: p.value,
                upperBound: p.upperBound,
                lowerBound: p.lowerBound
              }))}
              xKey="name"
              yKey="value"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Predictions Tab Component
function PredictionsTab({ predictions }) {
  if (!predictions) {
    return <div className="text-center py-8 text-gray-500">No predictions available</div>;
  }

  return (
    <div className="space-y-6">
      {predictions.revenue && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Revenue Predictions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600">Current Value</div>
              <div className="text-2xl font-bold text-blue-600">
                ${predictions.revenue.currentValue?.toFixed(2) || 0}
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600">Predicted Value</div>
              <div className="text-2xl font-bold text-green-600">
                ${predictions.revenue.predictedValue?.toFixed(2) || 0}
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600">Change</div>
              <div className="text-2xl font-bold text-purple-600">
                {predictions.revenue.changePercent?.toFixed(1) || 0}%
              </div>
            </div>
          </div>
          <div className="h-64">
            <LineChart
              data={predictions.revenue.predictions.map((p) => ({
                day: `Day ${p.day}`,
                value: p.value,
                confidence: p.confidence
              }))}
              xKey="day"
              yKey="value"
            />
          </div>
        </div>
      )}

      {predictions.costs && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Cost Predictions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Current Cost</div>
              <div className="text-2xl font-bold">${predictions.costs.currentCost.toFixed(2)}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Projected Cost</div>
              <div className="text-2xl font-bold">
                ${predictions.costs.projectedCost.toFixed(2)}
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600">Potential Savings</div>
              <div className="text-2xl font-bold text-green-600">
                ${predictions.costs.potentialSavings.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Anomalies Tab Component
function AnomaliesTab({ anomalies }) {
  if (!anomalies || !anomalies.summary) {
    return <div className="text-center py-8 text-gray-500">No anomalies detected</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Total Anomalies"
          value={anomalies.summary.total}
          icon={AlertTriangle}
          color="yellow"
        />
        <StatCard
          title="Critical"
          value={anomalies.summary.critical}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Warnings"
          value={anomalies.summary.warning}
          icon={AlertTriangle}
          color="orange"
        />
      </div>

      {anomalies.revenue?.anomalies && anomalies.revenue.anomalies.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Anomalies</h3>
          <div className="space-y-3">
            {anomalies.revenue.anomalies.map((anomaly, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  anomaly.severity === 'critical'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium capitalize">{anomaly.type}</div>
                    <div className="text-sm text-gray-600">
                      Value: ${anomaly.value.toFixed(2)} (Expected: ${anomaly.expected.toFixed(2)})
                    </div>
                    {anomaly.date && (
                      <div className="text-xs text-gray-500 mt-1">Date: {anomaly.date}</div>
                    )}
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      anomaly.severity === 'critical'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {anomaly.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Recommendations Tab Component
function RecommendationsTab({ recommendations }) {
  if (!recommendations || !recommendations.recommendations) {
    return <div className="text-center py-8 text-gray-500">No recommendations available</div>;
  }

  const priorityColors = {
    critical: 'red',
    high: 'orange',
    medium: 'yellow',
    low: 'blue'
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total"
          value={recommendations.summary.total}
          icon={Lightbulb}
          color="blue"
        />
        <StatCard
          title="Critical"
          value={recommendations.summary.critical}
          icon={Zap}
          color="red"
        />
        <StatCard title="High Priority" value={recommendations.summary.high} color="orange" />
        <StatCard title="Medium Priority" value={recommendations.summary.medium} color="yellow" />
      </div>

      <div className="space-y-4">
        {recommendations.recommendations.map((rec) => (
          <div key={rec.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold">{rec.title}</h3>
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full bg-${priorityColors[rec.priority]}-100 text-${priorityColors[rec.priority]}-800`}
              >
                {rec.priority}
              </span>
            </div>
            <p className="text-gray-600 mb-4">{rec.description}</p>
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Recommended Actions:</div>
              <ul className="space-y-1">
                {rec.actions.map((action, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
            {rec.potentialImpact && (
              <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                <span className="font-medium text-green-800">Potential Impact: </span>
                <span className="text-green-700">{rec.potentialImpact}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Forecasts Tab Component
function ForecastsTab({ forecasts }) {
  if (!forecasts || !forecasts.forecasts) {
    return <div className="text-center py-8 text-gray-500">No forecasts available</div>;
  }

  return (
    <div className="space-y-6">
      {Object.entries(forecasts.forecasts).map(([key, forecast]) => (
        <div key={key} className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">{forecast.label}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600">Total Projected</div>
              <div className="text-2xl font-bold text-blue-600">
                ${forecast.summary.totalProjected.toFixed(2)}
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600">Daily Average</div>
              <div className="text-2xl font-bold text-purple-600">
                ${forecast.summary.averageDaily.toFixed(2)}
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600">Trend</div>
              <div className="text-2xl font-bold text-green-600 capitalize">
                {forecast.summary.trend}
              </div>
            </div>
          </div>
          <div className="h-64">
            <LineChart
              data={forecast.forecast.slice(0, 30).map((f) => ({
                date: f.date,
                value: f.value,
                upper: f.upperBound,
                lower: f.lowerBound
              }))}
              xKey="date"
              yKey="value"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Scores Tab Component
function ScoresTab({ scores }) {
  if (!scores) {
    return <div className="text-center py-8 text-gray-500">No performance scores available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center mb-6">
          <div className="text-6xl font-bold text-blue-600 mb-2">{scores.overallScore}</div>
          <div className="text-xl text-gray-600">Overall Performance Score</div>
          <div className="mt-2 inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-lg font-medium">
            Grade: {scores.grade}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {scores.components &&
          Object.entries(scores.components).map(([key, component]) => (
            <div key={key} className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-800 mb-1">{component.score}</div>
                <div className="text-sm text-gray-600 capitalize">{key}</div>
                <div className="mt-2 inline-block px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                  {component.grade}
                </div>
              </div>
            </div>
          ))}
      </div>

      {scores.strengths && scores.strengths.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-green-600">Top Strengths</h3>
          <div className="space-y-2">
            {scores.strengths.map((strength, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded">
                <span className="text-gray-700 capitalize">
                  {strength.metric || strength.category}
                </span>
                <span className="font-bold text-green-600">{strength.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {scores.weaknesses && scores.weaknesses.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-red-600">Areas for Improvement</h3>
          <div className="space-y-2">
            {scores.weaknesses.map((weakness, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded">
                <span className="text-gray-700 capitalize">
                  {weakness.metric || weakness.category}
                </span>
                <span className="font-bold text-red-600">{weakness.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Mock data generators for demo purposes
function generateMockRevenueData() {
  const data = [];
  const baseRevenue = 5000;
  for (let i = 0; i < 30; i++) {
    data.push({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      revenue: baseRevenue + Math.random() * 2000 + i * 50
    });
  }
  return data;
}

function generateMockOrdersData() {
  const data = [];
  const baseOrders = 100;
  for (let i = 0; i < 30; i++) {
    data.push({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      orders: Math.floor(baseOrders + Math.random() * 50 + i * 2)
    });
  }
  return data;
}

function generateMockCostsData() {
  const data = [];
  const baseCost = 1500;
  for (let i = 0; i < 30; i++) {
    data.push({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      cost: baseCost + Math.random() * 500
    });
  }
  return data;
}

function generateMockCategoriesData() {
  return [
    { id: 1, name: 'Appetizers', revenue: 1200, orders: 45 },
    { id: 2, name: 'Main Courses', revenue: 3500, orders: 120 },
    { id: 3, name: 'Desserts', revenue: 800, orders: 60 },
    { id: 4, name: 'Beverages', revenue: 600, orders: 80 }
  ];
}

function generateMockBranchesData() {
  return [
    {
      id: 1,
      name: 'Downtown Branch',
      revenue: 8000,
      history: generateMockRevenueData()
    },
    {
      id: 2,
      name: 'Mall Branch',
      revenue: 6500,
      history: generateMockRevenueData()
    }
  ];
}

function generateMockCustomersData() {
  return [
    { id: 1, name: 'Customer 1', totalSpent: 500, orderCount: 10 },
    { id: 2, name: 'Customer 2', totalSpent: 1200, orderCount: 25 },
    { id: 3, name: 'Customer 3', totalSpent: 300, orderCount: 5 }
  ];
}
