/**
 * useEmployees Hook
 * Manages employee data fetching, filtering, and realtime updates
 */

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import {
  fetchEmployees,
  fetchBrands,
  subscribeToEmployeeChanges
} from '../services/employeeService';

export function useEmployees() {
  const { userProfile } = useAuth();
  const { addNotification } = useNotification();

  const [employees, setEmployees] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    status: 'all',
    brand: 'all',
    department: 'all'
  });

  // Load employees and brands
  useEffect(() => {
    loadData();
  }, []);

  // Setup realtime subscription
  useEffect(() => {
    const unsubscribe = subscribeToEmployeeChanges(() => {
      loadData(false); // Reload without showing loading state
    });

    return () => unsubscribe();
  }, []);

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);

    try {
      // Determine brand filter based on user role
      const brandFilter = userProfile?.role === 'ops' && userProfile?.brand_id
        ? { brandId: userProfile.brand_id }
        : {};

      const [employeesData, brandsData] = await Promise.all([
        fetchEmployees(brandFilter),
        fetchBrands()
      ]);

      setEmployees(employeesData);
      setBrands(brandsData);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في جلب البيانات',
        message: error.message || 'تعذر تحميل قائمة الموظفين'
      });
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Filtered employees based on current filters
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          emp.full_name?.toLowerCase().includes(searchLower) ||
          emp.email?.toLowerCase().includes(searchLower) ||
          emp.phone?.includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Role filter
      if (filters.role !== 'all' && emp.role !== filters.role) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all' && emp.status !== filters.status) {
        return false;
      }

      // Brand filter
      if (filters.brand !== 'all' && emp.brand_id !== filters.brand) {
        return false;
      }

      // Department filter
      if (filters.department !== 'all' && emp.department !== filters.department) {
        return false;
      }

      return true;
    });
  }, [employees, filters]);

  // Statistics
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(emp => emp.status === 'active').length;
    const inactive = total - active;

    const byRole = employees.reduce((acc, emp) => {
      acc[emp.role] = (acc[emp.role] || 0) + 1;
      return acc;
    }, {});

    const byDepartment = employees.reduce((acc, emp) => {
      if (emp.department) {
        acc[emp.department] = (acc[emp.department] || 0) + 1;
      }
      return acc;
    }, {});

    return {
      total,
      active,
      inactive,
      byRole,
      byDepartment,
      filtered: filteredEmployees.length
    };
  }, [employees, filteredEmployees]);

  return {
    employees: filteredEmployees,
    allEmployees: employees,
    brands,
    loading,
    filters,
    setFilters,
    stats,
    reload: loadData
  };
}
