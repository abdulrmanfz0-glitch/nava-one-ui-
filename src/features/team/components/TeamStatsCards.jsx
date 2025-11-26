/**
 * TeamStatsCards Component
 * Displays team statistics in card format
 */

import React from 'react';
import { Users, UserCheck, UserX, Shield } from 'lucide-react';
import StatCard from '@/shared/components/organisms/UI/StatCard';

export default function TeamStatsCards({ stats, loading }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="إجمالي الموظفين"
        value={stats.total}
        icon={Users}
        color="blue"
        loading={loading}
      />

      <StatCard
        title="الموظفون النشطون"
        value={stats.active}
        icon={UserCheck}
        color="green"
        loading={loading}
      />

      <StatCard
        title="الموظفون غير النشطين"
        value={stats.inactive}
        icon={UserX}
        color="red"
        loading={loading}
      />

      <StatCard
        title="المدراء"
        value={stats.byRole?.admin || 0}
        icon={Shield}
        color="purple"
        loading={loading}
      />
    </div>
  );
}
