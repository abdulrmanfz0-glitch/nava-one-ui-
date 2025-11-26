/**
 * useEmployeeForm Hook
 * Manages employee form state and submission
 */

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import {
  createEmployee,
  updateEmployee,
  deleteEmployee,
  toggleEmployeeStatus,
  resetEmployeePassword
} from '../services/employeeService';

export function useEmployeeForm(onSuccess) {
  const { userProfile } = useAuth();
  const { addNotification } = useNotification();

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'staff',
    department: '',
    status: 'active',
    join_date: '',
    salary: '',
    notes: '',
    brand_id: userProfile?.brand_id || '',
    permissions: [],
    address: '',
    emergency_contact: '',
    position: ''
  });

  const [editingEmployee, setEditingEmployee] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Set form data for editing
  const startEdit = (employee) => {
    setEditingEmployee(employee);
    setForm({
      full_name: employee.full_name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      role: employee.role || 'staff',
      department: employee.department || '',
      status: employee.status || 'active',
      join_date: employee.join_date || '',
      salary: employee.salary || '',
      notes: employee.notes || '',
      brand_id: employee.brand_id || '',
      permissions: employee.permissions || [],
      address: employee.address || '',
      emergency_contact: employee.emergency_contact || '',
      position: employee.position || ''
    });
  };

  // Reset form
  const resetForm = () => {
    setForm({
      full_name: '',
      email: '',
      phone: '',
      role: 'staff',
      department: '',
      status: 'active',
      join_date: '',
      salary: '',
      notes: '',
      brand_id: userProfile?.brand_id || '',
      permissions: [],
      address: '',
      emergency_contact: '',
      position: ''
    });
    setEditingEmployee(null);
  };

  // Submit form (create or update)
  const handleSubmit = async (e) => {
    e?.preventDefault();
    setSubmitting(true);

    try {
      if (editingEmployee) {
        // Update existing employee
        await updateEmployee(editingEmployee.id, form);

        addNotification({
          type: 'success',
          title: 'تم التحديث',
          message: 'تم تحديث بيانات الموظف بنجاح'
        });
      } else {
        // Create new employee
        const result = await createEmployee(form);

        addNotification({
          type: 'success',
          title: 'تم الإنشاء',
          message: `تم إنشاء حساب الموظف بنجاح. كلمة المرور المؤقتة: ${result.password}`
        });
      }

      resetForm();
      onSuccess?.();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في الحفظ',
        message: error.message || 'تعذر حفظ بيانات الموظف'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete employee
  const handleDelete = async (employeeId) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟')) return;

    try {
      await deleteEmployee(employeeId);

      addNotification({
        type: 'success',
        title: 'تم الحذف',
        message: 'تم حذف الموظف بنجاح'
      });

      onSuccess?.();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في الحذف',
        message: error.message || 'تعذر حذف الموظف'
      });
    }
  };

  // Toggle employee status
  const handleToggleStatus = async (employeeId, currentStatus) => {
    try {
      await toggleEmployeeStatus(employeeId, currentStatus);

      addNotification({
        type: 'success',
        title: 'تم التحديث',
        message: 'تم تغيير حالة الموظف بنجاح'
      });

      onSuccess?.();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في التحديث',
        message: error.message || 'تعذر تغيير حالة الموظف'
      });
    }
  };

  // Reset password
  const handleResetPassword = async (employeeEmail) => {
    if (!confirm(`هل تريد إعادة تعيين كلمة مرور ${employeeEmail}؟`)) return;

    try {
      await resetEmployeePassword(employeeEmail);

      addNotification({
        type: 'success',
        title: 'تم إرسال رابط التعيين',
        message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في التعيين',
        message: error.message || 'تعذر إرسال رابط إعادة التعيين'
      });
    }
  };

  return {
    form,
    setForm,
    editingEmployee,
    startEdit,
    resetForm,
    handleSubmit,
    handleDelete,
    handleToggleStatus,
    handleResetPassword,
    submitting
  };
}
