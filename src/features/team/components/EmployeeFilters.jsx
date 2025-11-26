/**
 * EmployeeFilters Component
 * Advanced filtering controls for employee list
 */

import React from 'react';
import { Search, Filter } from 'lucide-react';

export default function EmployeeFilters({ filters, setFilters, brands }) {
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث بالاسم، البريد، أو الهاتف..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Role Filter */}
        <select
          value={filters.role}
          onChange={(e) => handleFilterChange('role', e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">جميع الأدوار</option>
          <option value="admin">مدير النظام</option>
          <option value="ops">مشرف تشغيلي</option>
          <option value="manager">مدير فرع</option>
          <option value="accountant">محاسب</option>
          <option value="analyst">محلل بيانات</option>
          <option value="staff">موظف</option>
        </select>

        {/* Status Filter */}
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">جميع الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">غير نشط</option>
        </select>

        {/* Brand Filter */}
        <select
          value={filters.brand}
          onChange={(e) => handleFilterChange('brand', e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">جميع العلامات التجارية</option>
          {brands.map(brand => (
            <option key={brand.id} value={brand.id}>{brand.name}</option>
          ))}
        </select>

        {/* Department Filter */}
        <select
          value={filters.department}
          onChange={(e) => handleFilterChange('department', e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg
                   bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                   focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">جميع الأقسام</option>
          <option value="management">الإدارة</option>
          <option value="operations">التشغيل</option>
          <option value="finance">المالية</option>
          <option value="marketing">التسويق</option>
          <option value="hr">الموارد البشرية</option>
          <option value="it">تقنية المعلومات</option>
          <option value="sales">المبيعات</option>
          <option value="support">الدعم</option>
        </select>
      </div>
    </div>
  );
}
