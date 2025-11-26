// NAVA OPS - Modern Chart Components
// Clean, minimalistic charts using Recharts

import React, { memo } from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Modern color palette aligned with design system
const CHART_COLORS = {
  primary: '#0088FF',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  indigo: '#6366F1',
  pink: '#EC4899',
  teal: '#14B8A6'
};

const COLOR_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.purple,
  CHART_COLORS.indigo,
  CHART_COLORS.danger,
  CHART_COLORS.pink,
  CHART_COLORS.teal
];

 claude/ui-design-overhaul-011CV5xogYtprfQkRSM6J4Sx
// Modern Custom Tooltip with refined styling
const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }) => {

// Custom Tooltip - Memoized
const CustomTooltip = memo(({ active, payload, label, prefix = '', suffix = '' }) => {
 main
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 p-4 animate-fade-in">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2 pb-2 border-b border-gray-100 dark:border-gray-800">
          {label}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {entry.name}
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {prefix}{entry.value.toLocaleString()}{suffix}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
});

 claude/ui-design-overhaul-011CV5xogYtprfQkRSM6J4Sx
// Modern Loading State
const ChartLoading = () => (
  <div className="w-full h-80 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl">
    <div className="text-center space-y-3">
      <div className="loading-spinner w-8 h-8 mx-auto" />
      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Loading chart data...</p>
    </div>
  </div>
);

// Revenue Trend Line Chart with modern styling
export function RevenueTrendChart({ data, loading = false }) {
  if (loading) return <ChartLoading />;

// Revenue Trend Line Chart - Memoized
export const RevenueTrendChart = memo(({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-750 rounded-lg animate-pulse">
        <div className="text-gray-400">Loading chart...</div>
      </div>
    );
  }
 main

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="currentColor"
          className="text-gray-200 dark:text-gray-800"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          stroke="currentColor"
          className="text-gray-500 dark:text-gray-400"
          style={{ fontSize: '12px', fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="currentColor"
          className="text-gray-500 dark:text-gray-400"
          style={{ fontSize: '12px', fontWeight: 500 }}
          tickFormatter={(value) => `$${value.toLocaleString()}`}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip prefix="$" />} cursor={{ stroke: '#E5E7EB', strokeWidth: 1 }} />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="circle"
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke={CHART_COLORS.primary}
          strokeWidth={3}
          dot={{ fill: CHART_COLORS.primary, r: 5, strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 7, strokeWidth: 0 }}
          name="Revenue"
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

 claude/ui-design-overhaul-011CV5xogYtprfQkRSM6J4Sx
// Orders Bar Chart with rounded corners
export function OrdersBarChart({ data, loading = false }) {
  if (loading) return <ChartLoading />;

// Orders Bar Chart - Memoized
export const OrdersBarChart = memo(({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-750 rounded-lg animate-pulse">
        <div className="text-gray-400">Loading chart...</div>
      </div>
    );
  }
 main

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="currentColor"
          className="text-gray-200 dark:text-gray-800"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          stroke="currentColor"
          className="text-gray-500 dark:text-gray-400"
          style={{ fontSize: '12px', fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="currentColor"
          className="text-gray-500 dark:text-gray-400"
          style={{ fontSize: '12px', fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 136, 255, 0.1)' }} />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="circle"
        />
        <Bar
          dataKey="orders"
          fill={CHART_COLORS.success}
          radius={[12, 12, 0, 0]}
          name="Orders"
          maxBarSize={60}
        />
      </BarChart>
    </ResponsiveContainer>
  );
});

 claude/ui-design-overhaul-011CV5xogYtprfQkRSM6J4Sx
// Modern Area Chart with gradient fills
export function TrendAreaChart({ data, dataKeys = [], colors = [], loading = false }) {
  if (loading) return <ChartLoading />;

// Area Chart for Trends - Memoized
export const TrendAreaChart = memo(({ data, dataKeys = [], colors = [], loading = false }) => {
  if (loading) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-750 rounded-lg animate-pulse">
        <div className="text-gray-400">Loading chart...</div>
      </div>
    );
  }
 main

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <defs>
          {dataKeys.map((key, index) => (
            <linearGradient key={key} id={`gradient${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors[index] || COLOR_PALETTE[index]} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={colors[index] || COLOR_PALETTE[index]} stopOpacity={0.05}/>
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="currentColor"
          className="text-gray-200 dark:text-gray-800"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          stroke="currentColor"
          className="text-gray-500 dark:text-gray-400"
          style={{ fontSize: '12px', fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="currentColor"
          className="text-gray-500 dark:text-gray-400"
          style={{ fontSize: '12px', fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="circle"
        />
        {dataKeys.map((key, index) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[index] || COLOR_PALETTE[index]}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#gradient${key})`}
            name={key.charAt(0).toUpperCase() + key.slice(1)}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
});

 claude/ui-design-overhaul-011CV5xogYtprfQkRSM6J4Sx
// Branch Comparison Chart with modern horizontal bars
export function BranchComparisonChart({ data, loading = false }) {
  if (loading) return <ChartLoading />;

// Branch Comparison Chart - Memoized
export const BranchComparisonChart = memo(({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-750 rounded-lg animate-pulse">
        <div className="text-gray-400">Loading chart...</div>
      </div>
    );
  }
 main

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="currentColor"
          className="text-gray-200 dark:text-gray-800"
          horizontal={false}
        />
        <XAxis
          type="number"
          stroke="currentColor"
          className="text-gray-500 dark:text-gray-400"
          style={{ fontSize: '12px', fontWeight: 500 }}
          tickFormatter={(value) => `$${value.toLocaleString()}`}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          stroke="currentColor"
          className="text-gray-500 dark:text-gray-400"
          style={{ fontSize: '12px', fontWeight: 500 }}
          width={100}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip prefix="$" />} cursor={{ fill: 'rgba(0, 136, 255, 0.1)' }} />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="circle"
        />
        <Bar
          dataKey="revenue"
          fill={CHART_COLORS.primary}
          radius={[0, 12, 12, 0]}
          name="Revenue"
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
});

 claude/ui-design-overhaul-011CV5xogYtprfQkRSM6J4Sx
// Modern Pie Chart with clean design
export function CategoryPieChart({ data, loading = false }) {
  if (loading) return <ChartLoading />;

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Hide labels for small slices


// Pie Chart for Category Distribution - Memoized
export const CategoryPieChart = memo(({ data, loading = false }) => {
  if (loading) {
 main
    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={110}
          innerRadius={60}
          fill="#8884d8"
          dataKey="value"
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLOR_PALETTE[index % COLOR_PALETTE.length]}
              stroke="none"
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
});

 claude/ui-design-overhaul-011CV5xogYtprfQkRSM6J4Sx
// Multi-Line Chart for modern comparisons
export function MultiLineChart({ data, lines = [], loading = false }) {
  if (loading) return <ChartLoading />;

// Multi-Line Chart for Comparison - Memoized
export const MultiLineChart = memo(({ data, lines = [], loading = false }) => {
  if (loading) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-750 rounded-lg animate-pulse">
        <div className="text-gray-400">Loading chart...</div>
      </div>
    );
  }
 main

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="currentColor"
          className="text-gray-200 dark:text-gray-800"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          stroke="currentColor"
          className="text-gray-500 dark:text-gray-400"
          style={{ fontSize: '12px', fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="currentColor"
          className="text-gray-500 dark:text-gray-400"
          style={{ fontSize: '12px', fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E5E7EB', strokeWidth: 1 }} />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="circle"
        />
        {lines.map((line, index) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            stroke={line.color || COLOR_PALETTE[index]}
            strokeWidth={2.5}
            dot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            name={line.label}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
});

 claude/ui-design-overhaul-011CV5xogYtprfQkRSM6J4Sx
// Modern Stacked Bar Chart
export function StackedBarChart({ data, bars = [], loading = false }) {
  if (loading) return <ChartLoading />;

// Stacked Bar Chart - Memoized
export const StackedBarChart = memo(({ data, bars = [], loading = false }) => {
  if (loading) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-750 rounded-lg animate-pulse">
        <div className="text-gray-400">Loading chart...</div>
      </div>
    );
  }
 main

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="currentColor"
          className="text-gray-200 dark:text-gray-800"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          stroke="currentColor"
          className="text-gray-500 dark:text-gray-400"
          style={{ fontSize: '12px', fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="currentColor"
          className="text-gray-500 dark:text-gray-400"
          style={{ fontSize: '12px', fontWeight: 500 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip prefix="$" />} cursor={{ fill: 'rgba(0, 136, 255, 0.1)' }} />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="circle"
        />
        {bars.map((bar, index) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            stackId="a"
            fill={bar.color || COLOR_PALETTE[index]}
            name={bar.label}
            radius={index === bars.length - 1 ? [12, 12, 0, 0] : [0, 0, 0, 0]}
            maxBarSize={60}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
});

// Pie Chart Component (Enhanced version for Executive Dashboard)
export function PieChartComponent({ data, loading = false }) {
  if (loading) {
    return (
      <div className="w-full h-80 flex items-center justify-center bg-gray-50 dark:bg-gray-750 rounded-lg animate-pulse">
        <div className="text-gray-400">Loading chart...</div>
      </div>
    );
  }

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || COLOR_PALETTE[index % COLOR_PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {payload[0].name}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-semibold">
                      SAR {payload[0].value.toLocaleString()}
                    </span>
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export { CHART_COLORS, COLOR_PALETTE };
