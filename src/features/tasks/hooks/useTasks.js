/**
 * useTasks Hook
 * Manages task data and operations
 */

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { fetchTasks, subscribeToTaskChanges } from '../services/taskService';

export function useTasks() {
  const { user, userProfile } = useAuth();
  const { addNotification } = useNotification();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    assigned: 'all'
  });

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToTaskChanges(() => {
      loadTasks(false);
    });

    return () => unsubscribe();
  }, []);

  const loadTasks = async (showLoading = true) => {
    if (showLoading) setLoading(true);

    try {
      const options = {};
      if (userProfile?.role === 'ops' && userProfile?.brand_id) {
        options.brandId = userProfile.brand_id;
      }

      const data = await fetchTasks(options);
      setTasks(data);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في جلب المهام',
        message: error.message
      });
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filters.status !== 'all' && task.status !== filters.status) {
        return false;
      }
      if (filters.priority !== 'all' && task.priority !== filters.priority) {
        return false;
      }
      if (filters.assigned === 'my' && task.assigned_to !== user?.id) {
        return false;
      }
      return true;
    });
  }, [tasks, filters, user]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;

    return { total, pending, inProgress, completed };
  }, [tasks]);

  return {
    tasks: filteredTasks,
    loading,
    filters,
    setFilters,
    stats,
    reload: loadTasks
  };
}
