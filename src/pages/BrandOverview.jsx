import React, { useState, useEffect } from 'react';
import { useBrand } from '../contexts/BrandContext';
import { useBranchSelection } from '../contexts/BranchSelectionContext';
import api from '../services/api';
import { calculateMonthlyPrice, getPricingBreakdown, formatPrice } from '../utils/branchBasedPricing';
import PageHeader from '../components/UI/PageHeader';
import StatCard from '../components/UI/StatCard';
import DataTable from '../components/UI/DataTable';
import {
  Building2,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  MapPin,
  Users,
  Calendar,
  CreditCard
} from 'lucide-react';

/**
 * BrandOverview Page
 * Shows brand-level metrics aggregated across all branches
 * Displays subscription pricing based on branch count
 */
const BrandOverview = () => {
  const { brand } = useBrand();
  const { branches, branchCount, loading: branchesLoading } = useBranchSelection();

  const [loading, setLoading] = useState(true);
  const [brandMetrics, setBrandMetrics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    growthRate: 0,
  });
  const [branchPerformance, setBranchPerformance] = useState([]);
  const [pricingInfo, setPricingInfo] = useState(null);

  useEffect(() => {
    if (brand && branches.length > 0) {
      fetchBrandMetrics();
    }
  }, [brand, branches]);

  useEffect(() => {
    if (branchCount > 0) {
      const pricing = getPricingBreakdown(branchCount);
      setPricingInfo(pricing);
    }
  }, [branchCount]);

  const fetchBrandMetrics = async () => {
    try {
      setLoading(true);

      // Fetch metrics for each branch and aggregate
      const branchMetricsPromises = branches.map(branch =>
        api.branches.getStatistics(branch.id, {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        }).catch(err => {
          console.error(`Error fetching stats for branch ${branch.id}:`, err);
          return null;
        })
      );

      const allBranchMetrics = await Promise.all(branchMetricsPromises);

      // Aggregate metrics across all branches
      let totalRevenue = 0;
      let totalOrders = 0;
      let branchPerformanceData = [];

      allBranchMetrics.forEach((metrics, index) => {
        if (metrics) {
          totalRevenue += metrics.revenue || 0;
          totalOrders += metrics.orders || 0;

          branchPerformanceData.push({
            id: branches[index].id,
            name: branches[index].branch_name,
            location: branches[index].branch_location,
            revenue: metrics.revenue || 0,
            orders: metrics.orders || 0,
            averageOrder: metrics.orders > 0 ? (metrics.revenue / metrics.orders) : 0,
            growth: metrics.growth || 0,
          });
        }
      });

      // Sort branches by revenue (descending)
      branchPerformanceData.sort((a, b) => b.revenue - a.revenue);

      setBrandMetrics({
        totalRevenue,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        growthRate: branchPerformanceData.length > 0
          ? branchPerformanceData.reduce((sum, b) => sum + b.growth, 0) / branchPerformanceData.length
          : 0,
      });

      setBranchPerformance(branchPerformanceData);
    } catch (error) {
      console.error('Error fetching brand metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const branchColumns = [
    {
      key: 'name',
      label: 'Branch Name',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{value}</div>
            {row.location && (
              <div className="text-sm text-gray-500 dark:text-gray-400">{row.location}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'revenue',
      label: 'Revenue',
      render: (value) => (
        <span className="font-semibold text-green-600 dark:text-green-400">
          {formatPrice(value)}
        </span>
      ),
    },
    {
      key: 'orders',
      label: 'Orders',
      render: (value) => (
        <span className="text-gray-900 dark:text-white">{value.toLocaleString()}</span>
      ),
    },
    {
      key: 'averageOrder',
      label: 'Avg Order',
      render: (value) => (
        <span className="text-gray-900 dark:text-white">{formatPrice(value)}</span>
      ),
    },
    {
      key: 'growth',
      label: 'Growth',
      render: (value) => (
        <span className={value >= 0 ? 'text-green-600' : 'text-red-600'}>
          {value >= 0 ? '+' : ''}{value.toFixed(1)}%
        </span>
      ),
    },
  ];

  if (branchesLoading || loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Brand Overview"
          subtitle="Aggregate metrics across all locations"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <StatCard key={i} loading />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brand Overview"
        subtitle={`${brand?.brand_name || 'Your Brand'} - Aggregate metrics across all locations`}
      />

      {/* Brand Info Card */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {brand?.brand_logo ? (
              <img
                src={brand.brand_logo}
                alt={brand.brand_name}
                className="h-16 w-16 rounded-lg object-cover bg-white"
              />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-white/20 flex items-center justify-center">
                <Building2 className="w-8 h-8" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold">{brand?.brand_name || 'Your Brand'}</h2>
              <p className="text-indigo-100 flex items-center gap-2 mt-1">
                <MapPin className="w-4 h-4" />
                {branchCount} {branchCount === 1 ? 'Location' : 'Locations'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-indigo-100">Brand Owner</p>
            <p className="text-lg font-semibold">{brand?.brand_owner_user || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Subscription Pricing Card */}
      {pricingInfo && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Subscription Pricing
              </h3>
            </div>
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium rounded-full">
              Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Base Price</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {formatPrice(pricingInfo.basePrice)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Includes 1st branch</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Additional Branches</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {pricingInfo.additionalBranches}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                × 99 SAR = {formatPrice(pricingInfo.additionalBranchCost)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Monthly Total</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {formatPrice(pricingInfo.monthly.total)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">per month</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Yearly (17% off)</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatPrice(pricingInfo.yearly.total)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Save {formatPrice(pricingInfo.yearly.savings)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Branches"
          value={branchCount}
          icon={Building2}
          trend={null}
          color="blue"
        />
        <StatCard
          title="Total Revenue"
          value={formatPrice(brandMetrics.totalRevenue)}
          icon={DollarSign}
          trend={brandMetrics.growthRate >= 0 ? `+${brandMetrics.growthRate.toFixed(1)}%` : `${brandMetrics.growthRate.toFixed(1)}%`}
          trendUp={brandMetrics.growthRate >= 0}
          color="green"
        />
        <StatCard
          title="Total Orders"
          value={brandMetrics.totalOrders.toLocaleString()}
          icon={ShoppingCart}
          trend="Last 30 days"
          color="purple"
        />
        <StatCard
          title="Avg Order Value"
          value={formatPrice(brandMetrics.averageOrderValue)}
          icon={TrendingUp}
          trend="Across all branches"
          color="orange"
        />
      </div>

      {/* Branch Performance Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Branch Performance
            </h3>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Last 30 days
          </span>
        </div>

        {branchPerformance.length > 0 ? (
          <DataTable
            data={branchPerformance}
            columns={branchColumns}
            emptyMessage="No branch data available"
          />
        ) : (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No branch data available</p>
          </div>
        )}
      </div>

      {/* Brand Info Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brand Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Brand Information
          </h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Brand ID</dt>
              <dd className="text-sm font-mono text-gray-900 dark:text-white">{brand?.id}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Created</dt>
              <dd className="text-sm text-gray-900 dark:text-white">
                {brand?.created_at ? new Date(brand.created_at).toLocaleDateString() : 'N/A'}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Last Updated</dt>
              <dd className="text-sm text-gray-900 dark:text-white">
                {brand?.updated_at ? new Date(brand.updated_at).toLocaleDateString() : 'N/A'}
              </dd>
            </div>
          </dl>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <a
              href="/branches"
              className="block w-full px-4 py-3 text-left bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                <span className="font-medium">Manage Branches</span>
              </div>
            </a>
            <a
              href="/brand-settings"
              className="block w-full px-4 py-3 text-left bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                <span className="font-medium">Brand Settings</span>
              </div>
            </a>
            <a
              href="/subscriptions"
              className="block w-full px-4 py-3 text-left bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <span className="font-medium">Manage Subscription</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandOverview;
