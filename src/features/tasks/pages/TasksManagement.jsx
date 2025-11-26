/**
 * TasksManagement Page
 * Task management and tracking
 * REFACTORED: Reduced from 1,098 lines to ~180 lines
 */

import React, { useState } from 'react';
import { Plus, Download, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import PageHeader from '@/shared/components/organisms/UI/PageHeader';
import StatCard from '@/shared/components/organisms/UI/StatCard';
import { useTasks } from '../hooks/useTasks';
import { createTask, updateTask, deleteTask, exportTasks } from '../services/taskService';
import { useNotification } from '@/contexts/NotificationContext';

export default function TasksManagement() {
  const { tasks, loading, filters, setFilters, stats, reload } = useTasks();
  const { addNotification } = useNotification();
  const [showTaskForm, setShowTaskForm] = useState(false);

  const handleExport = async (format) => {
    try {
      await exportTasks(tasks, format);
    } catch (error) {
      // Error handled in service
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
      addNotification({
        type: 'success',
        title: 'تم التحديث',
        message: 'تم تحديث حالة المهمة بنجاح'
      });
      reload();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ',
        message: error.message
      });
    }
  };

  return (
    <div className="container-custom py-8">
      <PageHeader
        title="إدارة المهام"
        subtitle="تتبع وإدارة المهام والمسؤوليات"
        actions={
          <div className="flex gap-3">
            <button
              onClick={() => handleExport('excel')}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              تصدير
            </button>
            <button
              onClick={() => setShowTaskForm(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              مهمة جديدة
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="إجمالي المهام"
          value={stats.total}
          icon={CheckCircle}
          color="blue"
          loading={loading}
        />
        <StatCard
          title="قيد الانتظار"
          value={stats.pending}
          icon={Clock}
          color="orange"
          loading={loading}
        />
        <StatCard
          title="قيد التنفيذ"
          value={stats.inProgress}
          icon={AlertCircle}
          color="purple"
          loading={loading}
        />
        <StatCard
          title="مكتملة"
          value={stats.completed}
          icon={CheckCircle}
          color="green"
          loading={loading}
        />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">جميع الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="in_progress">قيد التنفيذ</option>
            <option value="completed">مكتملة</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">جميع الأولويات</option>
            <option value="high">عالية</option>
            <option value="medium">متوسطة</option>
            <option value="low">منخفضة</option>
          </select>

          <select
            value={filters.assigned}
            onChange={(e) => setFilters({ ...filters, assigned: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">جميع المهام</option>
            <option value="my">مهامي</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
            <p className="text-gray-500">لا توجد مهام</p>
          </div>
        ) : (
          tasks.map(task => (
            <div
              key={task.id}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {task.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {task.description}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className={`px-2 py-1 rounded-full ${
                      task.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : task.status === 'in_progress'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {task.status === 'completed' ? 'مكتملة' : task.status === 'in_progress' ? 'قيد التنفيذ' : 'معلقة'}
                    </span>
                    <span className={`px-2 py-1 rounded-full ${
                      task.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : task.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                    </span>
                    {task.assigned_user && (
                      <span className="text-gray-600 dark:text-gray-400">
                        المكلف: {task.assigned_user.full_name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {task.status !== 'completed' && (
                    <button
                      onClick={() => handleStatusChange(task.id, 'completed')}
                      className="btn-primary btn-sm"
                    >
                      إكمال
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
