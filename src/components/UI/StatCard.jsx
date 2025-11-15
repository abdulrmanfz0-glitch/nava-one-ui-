// NAVA OPS - Modern Stat Card Component
// Minimalistic KPI card with smooth animations

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'blue',
  loading = false,
  onClick
}) {
  // Modern color system with softer gradients
  const colorClasses = {
    blue: {
      gradient: 'from-primary-500 to-primary-600',
      bg: 'bg-primary-50 dark:bg-primary-950/30',
      text: 'text-primary-600 dark:text-primary-400',
      icon: 'text-primary-600 dark:text-primary-400'
    },
    green: {
      gradient: 'from-success-500 to-success-600',
      bg: 'bg-success-50 dark:bg-success-950/30',
      text: 'text-success-600 dark:text-success-400',
      icon: 'text-success-600 dark:text-success-400'
    },
    purple: {
      gradient: 'from-secondary-500 to-secondary-600',
      bg: 'bg-secondary-50 dark:bg-secondary-950/30',
      text: 'text-secondary-600 dark:text-secondary-400',
      icon: 'text-secondary-600 dark:text-secondary-400'
    },
    orange: {
      gradient: 'from-warning-500 to-warning-600',
      bg: 'bg-warning-50 dark:bg-warning-950/30',
      text: 'text-warning-600 dark:text-warning-400',
      icon: 'text-warning-600 dark:text-warning-400'
    },
    red: {
      gradient: 'from-error-500 to-error-600',
      bg: 'bg-error-50 dark:bg-error-950/30',
      text: 'text-error-600 dark:text-error-400',
      icon: 'text-error-600 dark:text-error-400'
    },
    indigo: {
      gradient: 'from-indigo-500 to-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-950/30',
      text: 'text-indigo-600 dark:text-indigo-400',
      icon: 'text-indigo-600 dark:text-indigo-400'
    },
    pink: {
      gradient: 'from-pink-500 to-pink-600',
      bg: 'bg-pink-50 dark:bg-pink-950/30',
      text: 'text-pink-600 dark:text-pink-400',
      icon: 'text-pink-600 dark:text-pink-400'
    }
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-950/30';
    if (trend === 'down') return 'text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-950/30';
    return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50';
  };

  if (loading) {
    return (
      <div className="card p-6 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
          </div>
          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
      </div>
    );
  }

  const currentColor = colorClasses[color] || colorClasses.blue;

  return (
    <div
      onClick={onClick}
      className={`
        group relative overflow-hidden
        bg-white dark:bg-gray-900
        rounded-2xl border border-gray-200 dark:border-gray-800
        shadow-sm hover:shadow-md
        transition-all duration-300 ease-out
        ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:border-primary-300 dark:hover:border-primary-700' : ''}
      `}
    >
      {/* Background gradient on hover */}
      <div className={`
        absolute inset-0 opacity-0 group-hover:opacity-5
        bg-gradient-to-br ${currentColor.gradient}
        transition-opacity duration-300
      `} />

      <div className="relative p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title */}
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 truncate">
              {title}
            </p>

            {/* Value */}
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">
              {value}
            </h3>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                {subtitle}
              </p>
            )}
          </div>

          {/* Icon */}
          {Icon && (
            <div className={`
              p-3 rounded-xl transition-all duration-300
              ${currentColor.bg}
              ${currentColor.icon}
              group-hover:scale-110
            `}>
              <Icon className="w-6 h-6" strokeWidth={2} />
            </div>
          )}
        </div>

        {/* Trend indicator */}
        {(trend || trendValue) && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className={`
                inline-flex items-center gap-1
                px-2 py-1 rounded-lg
                text-sm font-medium
                ${getTrendColor()}
                transition-colors duration-200
              `}>
                {getTrendIcon()}
                <span>{trendValue}</span>
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                vs last period
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Modern skeleton version for loading states
export function StatCardSkeleton() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/2"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-lg w-3/4"></div>
        </div>
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/3"></div>
    </div>
  );
}
