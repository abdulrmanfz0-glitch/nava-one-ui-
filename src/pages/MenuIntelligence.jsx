// NAVA OPS - Menu Intelligence
 claude/fix-intelligence-pages-errors-011CV5xYn7LzULNSSchNhaby
// Strategic menu performance analysis & optimization recommendations

// Strategic menu performance analysis with engineering matrix
 main

import React, { useState, useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import api from '@/services/api';
import PageHeader from '@/components/UI/PageHeader';
 claude/fix-intelligence-pages-errors-011CV5xYn7LzULNSSchNhaby
import { UtensilsCrossed, TrendingUp, TrendingDown, Star, AlertTriangle, CheckCircle } from 'lucide-react';

// Menu Engineering Matrix Component
function MenuEngineering() {
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branches, setBranches] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [selectedBranch]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const branchesData = await api.branches.getAll();
      setBranches(branchesData);

      // Generate sample menu items with performance metrics
      const sampleMenuItems = [
        {
          id: 1,

import StatCard from '@/components/UI/StatCard';
import DateRangePicker from '@/components/UI/DateRangePicker';
import EmptyState from '@/components/UI/EmptyState';
import {
  UtensilsCrossed,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Lightbulb,
  Star,
  AlertTriangle,
  Package,
  BarChart3
} from 'lucide-react';

export default function MenuIntelligence() {
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [menuData, setMenuData] = useState({
    items: [],
    totalRevenue: 0,
    totalOrders: 0,
    avgMargin: 0
  });

  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  });

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      const days = Math.ceil((new Date(dateRange.endDate) - new Date(dateRange.startDate)) / (1000 * 60 * 60 * 24));

      const overview = await api.analytics.getDashboardOverview(null, days);

      // Generate menu items with performance metrics
      const menuItems = [
        {
 main
          name: 'Classic Burger',
          category: 'Burgers',
          orders: 1250,
          revenue: 31250,
          cost: 18750,
          margin: 0.40,
          popularity: 0.28,
          profitability: 0.40,
          trend: '+15%',
 claude/fix-intelligence-pages-errors-011CV5xYn7LzULNSSchNhaby
          classification: 'Star',
          image: '🍔'
        },
        {
          id: 2,
          name: 'Margherita Pizza',
          category: 'Pizza',
          orders: 980,
          revenue: 29400,
          cost: 14700,
          margin: 0.50,
          popularity: 0.22,
          profitability: 0.50,
          trend: '+8%',
          classification: 'Star',
          image: '🍕'
        },
        {
          id: 3,
          name: 'Caesar Salad',
          category: 'Salads',
          orders: 1120,
          revenue: 22400,
          cost: 11200,
          margin: 0.50,
          popularity: 0.25,
          profitability: 0.50,
          trend: '+12%',
          classification: 'Star',
          image: '🥗'
        },
        {
          id: 4,
          name: 'Chicken Wings',
          category: 'Appetizers',
          orders: 875,
          revenue: 21875,
          cost: 15312,
          margin: 0.30,
          popularity: 0.20,
          profitability: 0.30,
          trend: '-3%',
          classification: 'Plow Horse',
          image: '🍗'
        },
        {
          id: 5,
          name: 'Specialty Steak',
          category: 'Mains',
          orders: 245,
          revenue: 18375,
          cost: 9187,
          margin: 0.50,
          popularity: 0.05,
          profitability: 0.50,
          trend: '-8%',
          classification: 'Puzzle',
          image: '🥩'
        }
      ];

      setMenuItems(sampleMenuItems);
    } catch (error) {
      console.error('Failed to fetch menu data:', error);

          image: '🍔'
        },
        {
          name: 'Cheese Pizza',
          category: 'Pizza',
          orders: 980,
          revenue: 34300,
          cost: 17150,
          margin: 0.50,
          popularity: 0.22,
          profitability: 0.50,
          trend: '+22%',
          image: '🍕'
        },
        {
          name: 'Caesar Salad',
          category: 'Salads',
          orders: 450,
          revenue: 5850,
          cost: 3510,
          margin: 0.40,
          popularity: 0.10,
          profitability: 0.40,
          trend: '-8%',
          image: '🥗'
        },
        {
          name: 'Chicken Wings',
          category: 'Appetizers',
          orders: 820,
          revenue: 16400,
          cost: 11480,
          margin: 0.30,
          popularity: 0.18,
          profitability: 0.30,
          trend: '+5%',
          image: '🍗'
        },
        {
          name: 'Veggie Burger',
          category: 'Burgers',
          orders: 320,
          revenue: 8320,
          cost: 3328,
          margin: 0.60,
          popularity: 0.07,
          profitability: 0.60,
          trend: '+35%',
          image: '🥙'
        },
        {
          name: 'French Fries',
          category: 'Sides',
          orders: 1450,
          revenue: 7250,
          cost: 5075,
          margin: 0.30,
          popularity: 0.32,
          profitability: 0.30,
          trend: '+3%',
          image: '🍟'
        },
        {
          name: 'Grilled Chicken',
          category: 'Mains',
          orders: 680,
          revenue: 20400,
          cost: 10200,
          margin: 0.50,
          popularity: 0.15,
          profitability: 0.50,
          trend: '+12%',
          image: '🍗'
        },
        {
          name: 'Margherita Pizza',
          category: 'Pizza',
          orders: 540,
          revenue: 18900,
          cost: 9450,
          margin: 0.50,
          popularity: 0.12,
          profitability: 0.50,
          trend: '+8%',
          image: '🍕'
        }
      ];

      // Calculate averages
      const avgPopularity = menuItems.reduce((sum, item) => sum + item.popularity, 0) / menuItems.length;
      const avgProfitability = menuItems.reduce((sum, item) => sum + item.profitability, 0) / menuItems.length;

      // Classify items
      const itemsWithClass = menuItems.map(item => {
        const highPopularity = item.popularity >= avgPopularity;
        const highProfitability = item.profitability >= avgProfitability;

        let classification;
        if (highPopularity && highProfitability) {
          classification = { type: 'star', label: 'Star', color: 'green', icon: '⭐', bgClass: 'bg-green-100 dark:bg-green-900/20', textClass: 'text-green-700 dark:text-green-400', borderClass: 'border-green-200 dark:border-green-800' };
        } else if (!highPopularity && highProfitability) {
          classification = { type: 'puzzle', label: 'Puzzle', color: 'blue', icon: '🧩', bgClass: 'bg-blue-100 dark:bg-blue-900/20', textClass: 'text-blue-700 dark:text-blue-400', borderClass: 'border-blue-200 dark:border-blue-800' };
        } else if (highPopularity && !highProfitability) {
          classification = { type: 'plow', label: 'Plow Horse', color: 'yellow', icon: '🐴', bgClass: 'bg-yellow-100 dark:bg-yellow-900/20', textClass: 'text-yellow-700 dark:text-yellow-400', borderClass: 'border-yellow-200 dark:border-yellow-800' };
        } else {
          classification = { type: 'dog', label: 'Dog', color: 'red', icon: '🐕', bgClass: 'bg-red-100 dark:bg-red-900/20', textClass: 'text-red-700 dark:text-red-400', borderClass: 'border-red-200 dark:border-red-800' };
        }

        return { ...item, classification };
      });

      setMenuData({
        items: itemsWithClass,
        totalRevenue: menuItems.reduce((sum, item) => sum + item.revenue, 0),
        totalOrders: menuItems.reduce((sum, item) => sum + item.orders, 0),
        avgMargin: avgProfitability
      });
    } catch (error) {
      console.error('Menu data error:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to load menu intelligence data',
        type: 'error'
      });
 main
    } finally {
      setLoading(false);
    }
  };

 claude/fix-intelligence-pages-errors-011CV5xYn7LzULNSSchNhaby
  // Classify items into BCG matrix categories
  const getClassification = (item) => {
    const avgPopularity = 0.20;
    const avgProfitability = 0.40;

    if (item.popularity > avgPopularity && item.profitability > avgProfitability) {
      return { type: 'Star', color: 'green', icon: Star, recommendation: 'Maintain quality and promote heavily' };
    } else if (item.popularity > avgPopularity && item.profitability <= avgProfitability) {
      return { type: 'Plow Horse', color: 'blue', icon: TrendingUp, recommendation: 'Increase prices or reduce costs' };
    } else if (item.popularity <= avgPopularity && item.profitability > avgProfitability) {
      return { type: 'Puzzle', color: 'yellow', icon: AlertTriangle, recommendation: 'Increase marketing and visibility' };
    } else {
      return { type: 'Dog', color: 'red', icon: TrendingDown, recommendation: 'Consider removing or replacing' };
    }
  };

  if (!selectedBranch && branches.length > 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="text-6xl mb-4">🍽️</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Select a Branch
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Please select a branch to view menu performance analysis
        </p>
        <select
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Choose a branch...</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name} {branch.code ? `(${branch.code})` : ''}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Branch Selector */}
      {branches.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Selected Branch
          </label>
          <select
            value={selectedBranch || ''}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full md:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Branches</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name} {branch.code ? `(${branch.code})` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium opacity-90">Stars</span>
            <Star className="w-6 h-6" />
          </div>
          <div className="text-3xl font-bold mb-1">
            {menuItems.filter(item => getClassification(item).type === 'Star').length}
          </div>
          <div className="text-sm opacity-90">High profit & popularity</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium opacity-90">Plow Horses</span>
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="text-3xl font-bold mb-1">
            {menuItems.filter(item => getClassification(item).type === 'Plow Horse').length}
          </div>
          <div className="text-sm opacity-90">Popular but low margin</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium opacity-90">Puzzles</span>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="text-3xl font-bold mb-1">
            {menuItems.filter(item => getClassification(item).type === 'Puzzle').length}
          </div>
          <div className="text-sm opacity-90">High profit, low popularity</div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium opacity-90">Dogs</span>
            <TrendingDown className="w-6 h-6" />
          </div>
          <div className="text-3xl font-bold mb-1">
            {menuItems.filter(item => getClassification(item).type === 'Dog').length}
          </div>
          <div className="text-sm opacity-90">Consider removing</div>
        </div>
      </div>

      {/* Menu Items Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Menu Performance Analysis

  useEffect(() => {
    fetchMenuData();
  }, [dateRange]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Count items by classification
  const classificationCounts = menuData.items.reduce((acc, item) => {
    acc[item.classification.type] = (acc[item.classification.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu Intelligence"
        subtitle="Strategic menu performance analysis with engineering matrix"
        icon={UtensilsCrossed}
        actions={
          <DateRangePicker
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onDateChange={({ startDate, endDate }) => setDateRange({ startDate, endDate })}
          />
        }
      />

      {/* Menu Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Menu Items"
          value={menuData.items.length}
          subtitle="Active items"
          icon={Package}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(menuData.totalRevenue)}
          subtitle="From menu sales"
          icon={DollarSign}
          color="green"
          loading={loading}
        />
        <StatCard
          title="Avg Profit Margin"
          value={`${(menuData.avgMargin * 100).toFixed(1)}%`}
          subtitle="Average across menu"
          icon={Target}
          color="purple"
          loading={loading}
        />
        <StatCard
          title="Total Orders"
          value={menuData.totalOrders.toLocaleString()}
          subtitle="Menu item orders"
          icon={BarChart3}
          color="orange"
          loading={loading}
        />
      </div>

      {/* Menu Classification Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Menu Engineering Classification
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-700 dark:text-green-400">Stars ⭐</span>
              <span className="text-2xl font-bold text-green-700 dark:text-green-400">{classificationCounts.star || 0}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">High popularity & profit</p>
          </div>
          <div className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Puzzles 🧩</span>
              <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">{classificationCounts.puzzle || 0}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">High profit, low popularity</p>
          </div>
          <div className="border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Plow Horses 🐴</span>
              <span className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{classificationCounts.plow || 0}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">High popularity, low profit</p>
          </div>
          <div className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-700 dark:text-red-400">Dogs 🐕</span>
              <span className="text-2xl font-bold text-red-700 dark:text-red-400">{classificationCounts.dog || 0}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Low popularity & profit</p>
          </div>
        </div>
      </div>

      {/* Menu Engineering Matrix Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Menu Performance Matrix
 main
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
 claude/fix-intelligence-pages-errors-011CV5xYn7LzULNSSchNhaby
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Margin
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Trend
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Classification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recommendation
                </th>

            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700 dark:text-gray-300">Item</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Orders</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Revenue</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Margin</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Trend</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Classification</th>
 main
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
 claude/fix-intelligence-pages-errors-011CV5xYn7LzULNSSchNhaby
                  <td colSpan="8" className="px-6 py-12 text-center">

                  <td colSpan="6" className="py-12 text-center">
 main
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-500"></div>
                    </div>
                  </td>
                </tr>
 claude/fix-intelligence-pages-errors-011CV5xYn7LzULNSSchNhaby
              ) : menuItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No menu items found
                  </td>
                </tr>
              ) : (
                menuItems.map((item) => {
                  const classification = getClassification(item);
                  const ClassIcon = classification.icon;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{item.image}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                        {item.orders.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                        SAR {item.revenue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                        {(item.margin * 100).toFixed(0)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={`font-medium ${item.trend.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {item.trend}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium
                          ${classification.color === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : ''}
                          ${classification.color === 'blue' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : ''}
                          ${classification.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' : ''}
                          ${classification.color === 'red' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' : ''}
                        `}>
                          <ClassIcon className="w-4 h-4" />
                          {classification.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {classification.recommendation}
                      </td>
                    </tr>
                  );
                })

              ) : menuData.items.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12">
                    <EmptyState
                      icon={UtensilsCrossed}
                      title="No Menu Data"
                      message="Menu performance data will appear here."
                    />
                  </td>
                </tr>
              ) : (
                menuData.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.image}</span>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{item.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-4 px-4 font-semibold text-gray-900 dark:text-white">
                      {item.orders.toLocaleString()}
                    </td>
                    <td className="text-right py-4 px-4 font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(item.revenue)}
                    </td>
                    <td className="text-right py-4 px-4 font-semibold text-gray-900 dark:text-white">
                      {(item.margin * 100).toFixed(0)}%
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className={`inline-flex items-center gap-1 font-medium ${item.trend.includes('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {item.trend.includes('+') ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {item.trend}
                      </span>
                    </td>
                    <td className="text-center py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${item.classification.bgClass} ${item.classification.textClass} ${item.classification.borderClass}`}>
                        <span>{item.classification.icon}</span>
                        <span>{item.classification.label}</span>
                      </span>
                    </td>
                  </tr>
                ))
 main
              )}
            </tbody>
          </table>
        </div>
      </div>

 claude/fix-intelligence-pages-errors-011CV5xYn7LzULNSSchNhaby
      {/* Menu Engineering Matrix Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Menu Engineering Matrix Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/10 rounded">
            <h4 className="font-semibold text-green-700 dark:text-green-400 mb-1 flex items-center gap-2">
              <Star className="w-5 h-5" />
              Stars
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              High profitability and high popularity. These are your best performers - promote them heavily and maintain consistent quality.
            </p>
          </div>
          <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10 rounded">
            <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Plow Horses
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              High popularity but low profitability. Consider increasing prices slightly or reducing portion costs to improve margins.
            </p>
          </div>
          <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10 rounded">
            <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Puzzles
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              High profitability but low popularity. Increase marketing efforts, improve placement on menu, or bundle with popular items.
            </p>
          </div>
          <div className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10 rounded">
            <h4 className="font-semibold text-red-700 dark:text-red-400 mb-1 flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Dogs
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Low profitability and low popularity. Consider removing from menu or completely redesigning the dish.
            </p>

      {/* Strategic Recommendations */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Strategic Recommendations
        </h3>
        <div className="space-y-3">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⭐</span>
              <div className="flex-1">
                <div className="font-semibold text-green-700 dark:text-green-400 mb-1">Stars - Promote Heavily</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  High popularity & profitability. Feature prominently on menu, marketing materials, and digital channels. These are your winning items.
                </div>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🧩</span>
              <div className="flex-1">
                <div className="font-semibold text-blue-700 dark:text-blue-400 mb-1">Puzzles - Increase Visibility</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  High profit but low popularity. Boost marketing, improve positioning on menu, train staff to recommend these items, or consider price adjustments.
                </div>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🐴</span>
              <div className="flex-1">
                <div className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Plow Horses - Optimize Costs</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Popular but lower profit. Focus on cost reduction through better sourcing, portion control, or consider modest price increases without affecting volume.
                </div>
              </div>
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🐕</span>
              <div className="flex-1">
                <div className="font-semibold text-red-700 dark:text-red-400 mb-1">Dogs - Consider Removal</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Low popularity & profit. Evaluate if these items serve a strategic purpose. If not, consider removing them to simplify operations and reduce inventory costs.
                </div>
              </div>
            </div>
 main
          </div>
        </div>
      </div>
    </div>
  );
}
 claude/fix-intelligence-pages-errors-011CV5xYn7LzULNSSchNhaby

// Main Menu Intelligence Component
export default function MenuIntelligence() {
  return (
    <div className="space-y-6">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6">
        <PageHeader
          title="Menu Intelligence"
          subtitle="Strategic menu performance analysis & optimization recommendations"
          icon={UtensilsCrossed}
          className="text-white"
        />
      </div>

      {/* Menu Engineering Content */}
      <MenuEngineering />
    </div>
  );
}

 main
