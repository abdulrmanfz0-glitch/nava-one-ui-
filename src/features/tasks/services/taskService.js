/**
 * Task Service
 * Handles all task-related API operations
 */

import { supabase } from '@/lib/supabase';

/**
 * Fetch all tasks
 */
export const fetchTasks = async ({ brandId = null, assignedTo = null } = {}) => {
  try {
    let query = supabase
      .from('tasks')
      .select(`
        *,
        assigned_user:user_profiles!assigned_to(full_name, email),
        created_by_user:user_profiles!created_by(full_name)
      `);

    if (brandId) {
      query = query.eq('brand_id', brandId);
    }

    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }
};

/**
 * Create a new task
 */
export const createTask = async (taskData) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }
};

/**
 * Update a task
 */
export const updateTask = async (taskId, taskData) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...taskData,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(`Failed to update task: ${error.message}`);
  }
};

/**
 * Delete a task
 */
export const deleteTask = async (taskId) => {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  } catch (error) {
    throw new Error(`Failed to delete task: ${error.message}`);
  }
};

/**
 * Subscribe to task changes
 */
export const subscribeToTaskChanges = (callback) => {
  const subscription = supabase
    .channel('tasks-changes')
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tasks'
      },
      callback
    )
    .subscribe();

  return () => subscription.unsubscribe();
};

/**
 * Export tasks
 */
export const exportTasks = async (tasks, format = 'excel') => {
  const { exportToExcel, exportToCSV, exportToPDF } = await import('@/utils/exportUtils');

  const exportData = tasks.map(task => ({
    'العنوان': task.title,
    'الحالة': task.status,
    'الأولوية': task.priority,
    'المكلف': task.assigned_user?.full_name || '-',
    'تاريخ الإنشاء': task.created_at,
    'تاريخ الاستحقاق': task.due_date
  }));

  switch (format) {
    case 'excel':
      exportToExcel(exportData, 'tasks');
      break;
    case 'csv':
      exportToCSV(exportData, 'tasks');
      break;
    case 'pdf':
      await exportToPDF('tasks', exportData);
      break;
  }
};
