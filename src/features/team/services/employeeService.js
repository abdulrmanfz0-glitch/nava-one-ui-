/**
 * Employee Service
 * Handles all employee-related API calls and data operations
 */

import { supabase } from '@/lib/supabase';

/**
 * Fetch all employees with related data
 * @param {Object} options - Query options
 * @param {string} options.brandId - Filter by brand ID
 * @returns {Promise<Array>} List of employees
 */
export const fetchEmployees = async ({ brandId = null } = {}) => {
  try {
    let query = supabase
      .from('user_profiles')
      .select(`
        *,
        auth_user:auth.users(email, last_sign_in_at, email_confirmed_at),
        brand:brands(id, name, logo_url),
        tasks:tasks(count),
        completed_tasks:tasks!completed(count)
      `);

    if (brandId) {
      query = query.eq('brand_id', brandId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch employees: ${error.message}`);
  }
};

/**
 * Fetch all brands
 * @returns {Promise<Array>} List of brands
 */
export const fetchBrands = async () => {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('id, name, logo_url')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    throw new Error(`Failed to fetch brands: ${error.message}`);
  }
};

/**
 * Create a new employee
 * @param {Object} employeeData - Employee data
 * @returns {Promise<Object>} Created employee
 */
export const createEmployee = async (employeeData) => {
  try {
    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: employeeData.email,
      password: temporaryPassword,
      options: {
        data: {
          full_name: employeeData.full_name,
          role: employeeData.role,
          brand_id: employeeData.brand_id
        }
      }
    });

    if (authError) throw authError;

    // Update user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        full_name: employeeData.full_name,
        phone: employeeData.phone,
        role: employeeData.role,
        department: employeeData.department,
        status: employeeData.status,
        join_date: employeeData.join_date,
        salary: employeeData.salary ? Number(employeeData.salary) : null,
        notes: employeeData.notes,
        brand_id: employeeData.brand_id,
        address: employeeData.address,
        emergency_contact: employeeData.emergency_contact,
        position: employeeData.position,
        permissions: employeeData.permissions
      })
      .eq('id', authData.user.id);

    if (profileError) throw profileError;

    return { user: authData.user, password: temporaryPassword };
  } catch (error) {
    throw new Error(`Failed to create employee: ${error.message}`);
  }
};

/**
 * Update an existing employee
 * @param {string} employeeId - Employee ID
 * @param {Object} employeeData - Updated employee data
 * @returns {Promise<Object>} Updated employee
 */
export const updateEmployee = async (employeeId, employeeData) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...employeeData,
        updated_at: new Date().toISOString()
      })
      .eq('id', employeeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(`Failed to update employee: ${error.message}`);
  }
};

/**
 * Delete an employee
 * @param {string} employeeId - Employee ID
 * @returns {Promise<void>}
 */
export const deleteEmployee = async (employeeId) => {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', employeeId);

    if (error) throw error;
  } catch (error) {
    throw new Error(`Failed to delete employee: ${error.message}`);
  }
};

/**
 * Toggle employee status (active/inactive)
 * @param {string} employeeId - Employee ID
 * @param {string} currentStatus - Current status
 * @returns {Promise<Object>} Updated employee
 */
export const toggleEmployeeStatus = async (employeeId, currentStatus) => {
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', employeeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(`Failed to toggle employee status: ${error.message}`);
  }
};

/**
 * Send password reset email
 * @param {string} email - Employee email
 * @returns {Promise<void>}
 */
export const resetEmployeePassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  } catch (error) {
    throw new Error(`Failed to reset password: ${error.message}`);
  }
};

/**
 * Subscribe to realtime employee changes
 * @param {Function} callback - Callback function when data changes
 * @returns {Function} Unsubscribe function
 */
export const subscribeToEmployeeChanges = (callback) => {
  const subscription = supabase
    .channel('employees-changes')
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_profiles'
      },
      callback
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

/**
 * Generate a temporary password
 * @returns {string} Generated password
 */
const generateTemporaryPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

/**
 * Export employees data
 * @param {Array} employees - Employees to export
 * @param {string} format - Export format ('csv', 'excel', 'pdf')
 * @returns {Promise<void>}
 */
export const exportEmployees = async (employees, format = 'excel') => {
  const { exportToExcel, exportToCSV, exportToPDF } = await import('@/utils/exportUtils');

  const exportData = employees.map(emp => ({
    'الاسم': emp.full_name,
    'البريد الإلكتروني': emp.email,
    'الهاتف': emp.phone,
    'الدور': emp.role,
    'القسم': emp.department,
    'الحالة': emp.status,
    'تاريخ الانضمام': emp.join_date,
    'العلامة التجارية': emp.brand?.name || ''
  }));

  switch (format) {
    case 'excel':
      exportToExcel(exportData, 'employees');
      break;
    case 'csv':
      exportToCSV(exportData, 'employees');
      break;
    case 'pdf':
      await exportToPDF('employees', exportData);
      break;
    default:
      throw new Error('Unsupported export format');
  }
};
