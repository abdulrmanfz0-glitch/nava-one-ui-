// src/components/team/TeamManagement.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@lib/supabase';
import { useAuth } from '@contexts/AuthContext';
import { useNotification } from '@contexts/NotificationContext';
import { exportUtils } from '@utils/exportUtils';
import { 
  Plus, Edit2, Trash2, Mail, Phone, Calendar, UserPlus, Search, Filter, 
  Download, FileText, Eye, MoreVertical, UserCheck, UserX, Shield,
  BarChart3, Users, Target, TrendingUp, Send, Key, Clock
} from 'lucide-react';

export default function TeamManagement() {
  const { user, userProfile, hasPermission } = useAuth();
  const { addNotification } = useNotification();
  const [employees, setEmployees] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(null);
  
  // فلاتر متقدمة
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    status: 'all',
    brand: 'all',
    department: 'all'
  });

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

  const roleConfig = {
    admin: { 
      label: 'مدير النظام', 
      color: 'bg-purple-100 text-purple-700 border-purple-300',
      level: 5,
      icon: Shield,
      permissions: ['all']
    },
    ops: { 
      label: 'مشرف تشغيلي', 
      color: 'bg-blue-100 text-blue-700 border-blue-300',
      level: 4,
      icon: Target,
      permissions: ['restaurants:manage', 'team:view', 'reports:view', 'tasks:manage']
    },
    manager: { 
      label: 'مدير فرع', 
      color: 'bg-green-100 text-green-700 border-green-300',
      level: 3,
      icon: Users,
      permissions: ['restaurants:view', 'team:view', 'reports:view', 'tasks:manage']
    },
    accountant: { 
      label: 'محاسب', 
      color: 'bg-amber-100 text-amber-700 border-amber-300',
      level: 2,
      icon: BarChart3,
      permissions: ['financial:view', 'reports:view']
    },
    analyst: { 
      label: 'محلل بيانات', 
      color: 'bg-indigo-100 text-indigo-700 border-indigo-300',
      level: 2,
      icon: TrendingUp,
      permissions: ['reports:view', 'analytics:view']
    },
    staff: { 
      label: 'موظف', 
      color: 'bg-gray-100 text-gray-700 border-gray-300',
      level: 1,
      icon: UserCheck,
      permissions: ['dashboard:view']
    }
  };

  const departmentConfig = {
    management: 'الإدارة',
    operations: 'التشغيل',
    finance: 'المالية',
    marketing: 'التسويق',
    hr: 'الموارد البشرية',
    it: 'تقنية المعلومات',
    sales: 'المبيعات',
    support: 'الدعم'
  };

  // جلب بيانات الموظفين مع تحديثات حية
  useEffect(() => {
    fetchEmployees();
    fetchBrands();
    setupRealtimeSubscription();
  }, []);

  const fetchEmployees = async () => {
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

      // تطبيق صلاحيات المستخدم
      if (userProfile?.role === 'ops' && userProfile?.brand_id) {
        query = query.eq('brand_id', userProfile.brand_id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في جلب البيانات',
        message: 'تعذر تحميل قائمة الموظفين'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, logo_url')
        .order('name');

      if (error) throw error;
      setBrands(data || []);
    } catch (error) {
      // Error fetching brands silently
    }
  };

  // تحديثات حية للموظفين
  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('employees-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_profiles' 
        },
        (payload) => {
          fetchEmployees();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  // إنشاء أو تحديث موظف
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingEmployee) {
        // تحديث موظف موجود
        const { error } = await supabase
          .from('user_profiles')
          .update({
            ...form,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingEmployee.id);

        if (error) throw error;

        addNotification({
          type: 'success',
          title: 'تم التحديث',
          message: 'تم تحديث بيانات الموظف بنجاح'
        });
      } else {
        // إنشاء موظف جديد
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: form.email,
          password: generateTemporaryPassword(),
          options: {
            data: {
              full_name: form.full_name,
              role: form.role,
              brand_id: form.brand_id
            }
          }
        });

        if (authError) throw authError;

        // تحديث الملف الشخصي
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            full_name: form.full_name,
            phone: form.phone,
            role: form.role,
            department: form.department,
            status: form.status,
            join_date: form.join_date,
            salary: form.salary ? Number(form.salary) : null,
            notes: form.notes,
            brand_id: form.brand_id,
            address: form.address,
            emergency_contact: form.emergency_contact,
            position: form.position,
            permissions: form.permissions
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;

        addNotification({
          type: 'success',
          title: 'تم الإنشاء',
          message: 'تم إنشاء حساب الموظف بنجاح'
        });
      }

      await fetchEmployees();
      resetForm();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في الحفظ',
        message: 'تعذر حفظ بيانات الموظف'
      });
    }
  };

  // توليد كلمة مرور مؤقتة
  const generateTemporaryPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // إعادة تعيين كلمة المرور
  const resetPassword = async (employeeId, employeeEmail) => {
    if (!confirm(`هل تريد إعادة تعيين كلمة مرور ${employeeEmail}؟`)) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(employeeEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      addNotification({
        type: 'success',
        title: 'تم إرسال رابط التعيين',
        message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في التعيين',
        message: 'تعذر إرسال رابط إعادة التعيين'
      });
    }
  };

  // تغيير حالة الموظف
  const toggleEmployeeStatus = async (employeeId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', employeeId);

      if (error) throw error;

      addNotification({
        type: 'success',
        title: 'تم تغيير الحالة',
        message: `تم ${newStatus === 'active' ? 'تفعيل' : 'تعطيل'} حساب الموظف`
      });

      await fetchEmployees();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في التحديث',
        message: 'تعذر تغيير حالة الموظف'
      });
    }
  };

  // تحرير موظف
  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setForm({
      full_name: employee.full_name || '',
      email: employee.auth_user?.email || '',
      phone: employee.phone || '',
      role: employee.role || 'staff',
      department: employee.department || '',
      status: employee.status || 'active',
      join_date: employee.join_date || '',
      salary: employee.salary || '',
      notes: employee.notes || '',
      brand_id: employee.brand_id || userProfile?.brand_id || '',
      permissions: employee.permissions || [],
      address: employee.address || '',
      emergency_contact: employee.emergency_contact || '',
      position: employee.position || ''
    });
    setShowEmployeeForm(true);
  };

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
    setShowEmployeeForm(false);
  };

  // تصدير البيانات
  const handleExportCSV = () => {
    const rows = filteredEmployees.map(employee => ({
      'المعرف': employee.id,
      'الاسم': employee.full_name,
      'البريد الإلكتروني': employee.auth_user?.email,
      'الهاتف': employee.phone,
      'الدور': roleConfig[employee.role]?.label,
      'القسم': departmentConfig[employee.department] || employee.department,
      'الفرع': employee.brand?.name,
      'الحالة': employee.status === 'active' ? 'نشط' : 'غير نشط',
      'تاريخ الانضمام': employee.join_date ? formatDate(employee.join_date) : '',
      'آخر دخول': employee.auth_user?.last_sign_in_at ? formatDateTime(employee.auth_user.last_sign_in_at) : '',
      'عدد المهام': employee.tasks?.[0]?.count || 0
    }));
    
    exportUtils.exportToCSV(rows, `موظفين_نافا_${formatDate(new Date())}`);
  };

  const handleExportPDF = () => {
    exportUtils.exportToPDF("#team-root", `تقرير_الموظفين_${formatDate(new Date())}`);
  };

  // تنسيق التاريخ
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // حساب مدة العمل
  const getWorkDuration = (joinDate) => {
    if (!joinDate) return '-';
    
    const join = new Date(joinDate);
    const now = new Date();
    const diffTime = Math.abs(now - join);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    
    if (years > 0) {
      return `${years} سنة و ${months} شهر`;
    } else {
      return `${months} شهر`;
    }
  };

  // تصفية البيانات
  const filteredEmployees = useMemo(() => {
    let data = [...employees];

    // البحث
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();
      data = data.filter(employee =>
        employee.full_name?.toLowerCase().includes(query) ||
        employee.auth_user?.email?.toLowerCase().includes(query) ||
        employee.department?.toLowerCase().includes(query) ||
        employee.position?.toLowerCase().includes(query)
      );
    }

    // الفلترة
    if (filters.role !== 'all') {
      data = data.filter(employee => employee.role === filters.role);
    }

    if (filters.status !== 'all') {
      data = data.filter(employee => employee.status === filters.status);
    }

    if (filters.brand !== 'all') {
      data = data.filter(employee => employee.brand_id === filters.brand);
    }

    if (filters.department !== 'all') {
      data = data.filter(employee => employee.department === filters.department);
    }

    return data;
  }, [employees, filters]);

  // إحصائيات الفريق
  const teamStats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.status === 'active').length;
    const admins = employees.filter(e => e.role === 'admin' || e.role === 'ops').length;
    const newThisMonth = employees.filter(e => {
      const joinDate = new Date(e.join_date);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return joinDate > monthAgo;
    }).length;

    return { total, active, admins, newThisMonth };
  }, [employees]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل بيانات الفريق...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" id="team-root">
      {/* البطاقة الرئيسية */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-200">
        
        {/* الهيدر المحسن */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إدارة الفريق والموظفين</h1>
            <p className="text-gray-600 mt-1">إدارة أعضاء الفريق، الصلاحيات، وتقارير الأداء</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {hasPermission(['team:create']) && (
              <button
                className="btn-primary flex items-center gap-2"
                onClick={() => setShowEmployeeForm(true)}
              >
                <UserPlus size={18} />
                إضافة موظف جديد
              </button>
            )}
            <button
              onClick={handleExportCSV}
              className="btn-success flex items-center gap-2"
            >
              <Download size={18} />
              تصدير CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="btn-secondary flex items-center gap-2"
            >
              <FileText size={18} />
              تصدير PDF
            </button>
          </div>
        </div>

        {/* إحصائيات محسنة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard 
            title="إجمالي الموظفين" 
            value={teamStats.total} 
            icon={Users}
            color="blue"
          />
          <StatCard 
            title="موظفين نشطين" 
            value={teamStats.active} 
            icon={UserCheck}
            color="green"
            percentage={teamStats.total > 0 ? (teamStats.active / teamStats.total) * 100 : 0}
          />
          <StatCard 
            title="المشرفون" 
            value={teamStats.admins} 
            icon={Shield}
            color="purple"
          />
          <StatCard 
            title="جدد هذا الشهر" 
            value={teamStats.newThisMonth} 
            icon={TrendingUp}
            color="amber"
          />
        </div>

        {/* شريط الفلاتر المتقدم */}
        <AdvancedFilterBar
          filters={filters}
          setFilters={setFilters}
          employees={employees}
          brands={brands}
        />

        {/* جدول الموظفين المحسن */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الموظف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  المسمى والفرع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الدور والصلاحيات
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة والنشاط
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <EmployeeTableRow 
                  key={employee.id}
                  employee={employee}
                  roleConfig={roleConfig}
                  departmentConfig={departmentConfig}
                  formatDate={formatDate}
                  formatDateTime={formatDateTime}
                  getWorkDuration={getWorkDuration}
                  onEdit={handleEdit}
                  onToggleStatus={toggleEmployeeStatus}
                  onResetPassword={resetPassword}
                  onViewDetails={setShowEmployeeDetails}
                  hasPermission={hasPermission}
                  currentUserId={user?.id}
                />
              ))}
              
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Users size={48} className="text-gray-300 mb-4" />
                      <p className="text-lg">لا يوجد موظفون مطابقون للبحث</p>
                      <p className="text-sm mt-2">جرب تعديل شروط البحث أو أضف موظفاً جديداً</p>
                      {hasPermission(['team:create']) && (
                        <button
                          className="btn-primary mt-4"
                          onClick={() => setShowEmployeeForm(true)}
                        >
                          إضافة أول موظف
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة إضافة/تعديل موظف */}
      <EmployeeFormModal
        show={showEmployeeForm}
        onClose={resetForm}
        form={form}
        setForm={setForm}
        editingEmployee={editingEmployee}
        onSubmit={handleSubmit}
        roleConfig={roleConfig}
        departmentConfig={departmentConfig}
        brands={brands}
        userProfile={userProfile}
      />

      {/* نافذة تفاصيل الموظف */}
      <EmployeeDetailsModal
        show={!!showEmployeeDetails}
        employee={showEmployeeDetails}
        onClose={() => setShowEmployeeDetails(null)}
        roleConfig={roleConfig}
        departmentConfig={departmentConfig}
        formatDate={formatDate}
        formatDateTime={formatDateTime}
        getWorkDuration={getWorkDuration}
      />
    </div>
  );
}

// مكون صف الموظف المنفصل
function EmployeeTableRow({ 
  employee, 
  roleConfig, 
  departmentConfig, 
  formatDate, 
  formatDateTime, 
  getWorkDuration,
  onEdit, 
  onToggleStatus, 
  onResetPassword,
  onViewDetails,
  hasPermission,
  currentUserId
}) {
  const [showMenu, setShowMenu] = useState(false);
  const RoleIcon = roleConfig[employee.role]?.icon;

  return (
    <tr key={employee.id} className="hover:bg-gray-50 transition-colors group">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <img
            src={employee.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.full_name || 'User')}&background=1E40AF&color=fff`}
            alt={employee.full_name}
            className="w-12 h-12 rounded-full ml-3"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onViewDetails(employee)}
                className="text-sm font-medium text-gray-900 hover:text-primary-600 transition-colors text-right"
              >
                {employee.full_name}
              </button>
              {employee.auth_user?.email_confirmed_at ? (
                <span className="text-green-500 text-xs" title="البريد الإلكتروني مفعل">
                  ✓
                </span>
              ) : (
                <span className="text-yellow-500 text-xs" title="بانتظار تفعيل البريد">
                  ⏳
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {employee.auth_user?.email}
            </div>
            {employee.phone && (
              <div className="text-xs text-gray-500 flex items-center mt-1">
                <Phone size={12} className="ml-1" />
                {employee.phone}
              </div>
            )}
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {employee.position || 'بدون مسمى'}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {departmentConfig[employee.department] || employee.department || 'لا يوجد قسم'}
        </div>
        {employee.brand && (
          <div className="text-xs text-primary-600 font-medium mt-1">
            {employee.brand.name}
          </div>
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2 mb-2">
          {RoleIcon && <RoleIcon size={16} className="text-gray-400" />}
          <span className={`px-3 py-1 text-xs rounded-full border ${roleConfig[employee.role]?.color || roleConfig.staff.color}`}>
            {roleConfig[employee.role]?.label || employee.role}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {employee.permissions?.length > 0 
            ? `${employee.permissions.length} صلاحية` 
            : 'صلاحيات أساسية'
          }
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col gap-2">
          <span className={`px-3 py-1 text-xs rounded-full w-fit ${
            employee.status === 'active' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {employee.status === 'active' ? 'نشط' : 'غير نشط'}
          </span>
          
          <div className="text-xs text-gray-500">
            <div className="flex items-center">
              <Clock size={12} className="ml-1" />
              {getWorkDuration(employee.join_date)}
            </div>
            {employee.auth_user?.last_sign_in_at && (
              <div className="mt-1">
                آخر دخول: {formatDateTime(employee.auth_user.last_sign_in_at)}
              </div>
            )}
          </div>

          {employee.tasks && (
            <div className="text-xs text-gray-500">
              المهام: {employee.tasks[0]?.count || 0}
            </div>
          )}
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewDetails(employee)}
            className="text-gray-600 hover:text-gray-800 p-2 rounded hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
            title="عرض التفاصيل"
          >
            <Eye size={16} />
          </button>

          {/* قائمة الإجراءات */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-gray-600 hover:text-gray-800 p-2 rounded hover:bg-gray-100 transition-colors"
              title="المزيد"
            >
              <MoreVertical size={16} />
            </button>
            
            {showMenu && (
              <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                {hasPermission(['team:edit']) && employee.id !== currentUserId && (
                  <button
                    onClick={() => {
                      onEdit(employee);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                  >
                    <Edit2 size={14} />
                    تعديل البيانات
                  </button>
                )}
                
                {hasPermission(['team:edit']) && employee.id !== currentUserId && (
                  <button
                    onClick={() => {
                      onToggleStatus(employee.id, employee.status);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {employee.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                    {employee.status === 'active' ? 'تعطيل' : 'تفعيل'}
                  </button>
                )}
                
                {hasPermission(['auth:manage']) && (
                  <button
                    onClick={() => {
                      onResetPassword(employee.id, employee.auth_user?.email);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Key size={14} />
                    إعادة تعيين كلمة المرور
                  </button>
                )}
                
                {hasPermission(['team:delete']) && employee.id !== currentUserId && (
                  <button
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من حذف ${employee.full_name}؟`)) {
                        // سيتم تنفيذ الحذف من خلال تغيير الحالة
                        onToggleStatus(employee.id, 'active');
                      }
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                  >
                    <Trash2 size={14} />
                    حذف الموظف
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

// مكون البطاقة الإحصائية
function StatCard({ title, value, icon: Icon, color, percentage }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700'
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-2xl font-bold mt-1">{value}</div>
          {percentage !== undefined && (
            <div className="text-xs mt-1 opacity-75">
              {percentage.toFixed(1)}%
            </div>
          )}
        </div>
        <Icon size={24} className="opacity-50" />
      </div>
    </div>
  );
}

// مكون شريط الفلاتر المتقدم
function AdvancedFilterBar({ filters, setFilters, employees, brands }) {
  const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="ابحث عن موظف..."
          className="w-full pr-10 pl-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>
      
      <select
        className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        value={filters.role}
        onChange={(e) => setFilters({ ...filters, role: e.target.value })}
      >
        <option value="all">جميع الأدوار</option>
        <option value="admin">مدير النظام</option>
        <option value="ops">مشرف تشغيلي</option>
        <option value="manager">مدير فرع</option>
        <option value="accountant">محاسب</option>
        <option value="analyst">محلل بيانات</option>
        <option value="staff">موظف</option>
      </select>

      <select
        className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        value={filters.status}
        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
      >
        <option value="all">جميع الحالات</option>
        <option value="active">نشط</option>
        <option value="inactive">غير نشط</option>
      </select>

      <select
        className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        value={filters.brand}
        onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
      >
        <option value="all">جميع الفروع</option>
        {brands.map(brand => (
          <option key={brand.id} value={brand.id}>
            {brand.name}
          </option>
        ))}
      </select>

      <select
        className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        value={filters.department}
        onChange={(e) => setFilters({ ...filters, department: e.target.value })}
      >
        <option value="all">جميع الأقسام</option>
        {departments.map(dept => (
          <option key={dept} value={dept}>
            {dept}
          </option>
        ))}
      </select>
    </div>
  );
}

// مكون النموذج المحسن
function EmployeeFormModal({ 
  show, 
  onClose, 
  form, 
  setForm, 
  editingEmployee, 
  onSubmit, 
  roleConfig, 
  departmentConfig, 
  brands,
  userProfile 
}) {
  if (!show) return null;

  const isOpsUser = userProfile?.role === 'ops';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm grid place-items-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingEmployee ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          {/* المعلومات الأساسية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل *</label>
              <input
                type="text"
                className="w-full input-field"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني *</label>
              <input
                type="email"
                className="w-full input-field"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                disabled={!!editingEmployee}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
              <input
                type="tel"
                className="w-full input-field"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+966 5X XXX XXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المسمى الوظيفي</label>
              <input
                type="text"
                className="w-full input-field"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="مثل: مدير مبيعات، محاسب أول..."
              />
            </div>
          </div>

          {/* المعلومات الوظيفية */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الدور *</label>
              <select
                className="w-full input-field"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                required
              >
                <option value="staff">موظف</option>
                <option value="analyst">محلل بيانات</option>
                <option value="accountant">محاسب</option>
                <option value="manager">مدير فرع</option>
                {userProfile?.role === 'admin' && (
                  <>
                    <option value="ops">مشرف تشغيلي</option>
                    <option value="admin">مدير النظام</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">القسم</label>
              <select
                className="w-full input-field"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              >
                <option value="">اختر القسم</option>
                {Object.entries(departmentConfig).map(([key, value]) => (
                  <option key={key} value={key}>{value}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
              <select
                className="w-full input-field"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الفرع</label>
              <select
                className="w-full input-field"
                value={form.brand_id}
                onChange={(e) => setForm({ ...form, brand_id: e.target.value })}
                disabled={isOpsUser}
              >
                <option value="">اختر الفرع</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
              {isOpsUser && (
                <p className="text-xs text-gray-500 mt-1">محدد تلقائياً حسب فرعك</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الانضمام</label>
              <input
                type="date"
                className="w-full input-field"
                value={form.join_date}
                onChange={(e) => setForm({ ...form, join_date: e.target.value })}
              />
            </div>
          </div>

          {/* المعلومات المالية والإضافية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الراتب الشهري</label>
              <input
                type="number"
                className="w-full input-field"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                placeholder="الراتب بالريال السعودي"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">جهة الاتصال في الطوارئ</label>
              <input
                type="text"
                className="w-full input-field"
                value={form.emergency_contact}
                onChange={(e) => setForm({ ...form, emergency_contact: e.target.value })}
                placeholder="الاسم ورقم الهاتف"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">العنوان</label>
            <textarea
              className="w-full input-field"
              rows={2}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="العنوان التفصيلي"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
            <textarea
              className="w-full input-field"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="ملاحظات إضافية عن الموظف..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="btn-primary px-6 py-2"
            >
              {editingEmployee ? 'تحديث البيانات' : 'إضافة الموظف'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// مكون تفاصيل الموظف
function EmployeeDetailsModal({ show, employee, onClose, roleConfig, departmentConfig, formatDate, formatDateTime, getWorkDuration }) {
  if (!show || !employee) return null;

  const RoleIcon = roleConfig[employee.role]?.icon;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm grid place-items-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">تفاصيل الموظف</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* الصورة والمعلومات الأساسية */}
          <div className="flex items-center gap-4">
            <img
              src={employee.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.full_name || 'User')}&background=1E40AF&color=fff&size=100`}
              alt={employee.full_name}
              className="w-20 h-20 rounded-full"
            />
            <div className="flex-1">
              <h4 className="text-xl font-bold text-gray-900">{employee.full_name}</h4>
              <div className="flex items-center gap-2 mt-1">
                {RoleIcon && <RoleIcon size={16} className="text-gray-400" />}
                <span className={`px-3 py-1 text-sm rounded-full border ${roleConfig[employee.role]?.color}`}>
                  {roleConfig[employee.role]?.label}
                </span>
                <span className={`px-3 py-1 text-sm rounded-full ${
                  employee.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {employee.status === 'active' ? 'نشط' : 'غير نشط'}
                </span>
              </div>
            </div>
          </div>

          {/* الشبكة التفصيلية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* المعلومات الشخصية */}
            <div className="space-y-4">
              <h5 className="font-semibold text-gray-900 border-b pb-2">المعلومات الشخصية</h5>
              
              <div>
                <label className="text-sm text-gray-600">البريد الإلكتروني</label>
                <p className="text-gray-900">{employee.auth_user?.email}</p>
              </div>
              
              {employee.phone && (
                <div>
                  <label className="text-sm text-gray-600">رقم الهاتف</label>
                  <p className="text-gray-900">{employee.phone}</p>
                </div>
              )}
              
              {employee.address && (
                <div>
                  <label className="text-sm text-gray-600">العنوان</label>
                  <p className="text-gray-900">{employee.address}</p>
                </div>
              )}
              
              {employee.emergency_contact && (
                <div>
                  <label className="text-sm text-gray-600">الاتصال في الطوارئ</label>
                  <p className="text-gray-900">{employee.emergency_contact}</p>
                </div>
              )}
            </div>

            {/* المعلومات الوظيفية */}
            <div className="space-y-4">
              <h5 className="font-semibold text-gray-900 border-b pb-2">المعلومات الوظيفية</h5>
              
              {employee.position && (
                <div>
                  <label className="text-sm text-gray-600">المسمى الوظيفي</label>
                  <p className="text-gray-900">{employee.position}</p>
                </div>
              )}
              
              {employee.department && (
                <div>
                  <label className="text-sm text-gray-600">القسم</label>
                  <p className="text-gray-900">{departmentConfig[employee.department] || employee.department}</p>
                </div>
              )}
              
              {employee.brand && (
                <div>
                  <label className="text-sm text-gray-600">الفرع</label>
                  <p className="text-gray-900">{employee.brand.name}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm text-gray-600">مدة العمل</label>
                <p className="text-gray-900">{getWorkDuration(employee.join_date)}</p>
              </div>
              
              {employee.join_date && (
                <div>
                  <label className="text-sm text-gray-600">تاريخ الانضمام</label>
                  <p className="text-gray-900">{formatDate(employee.join_date)}</p>
                </div>
              )}
            </div>
          </div>

          {/* النشاط والإحصائيات */}
          <div className="space-y-4">
            <h5 className="font-semibold text-gray-900 border-b pb-2">النشاط والإحصائيات</h5>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="text-sm text-gray-600">آخر دخول</label>
                <p className="text-gray-900 text-sm">
                  {employee.auth_user?.last_sign_in_at 
                    ? formatDateTime(employee.auth_user.last_sign_in_at)
                    : 'لم يسجل دخول بعد'
                  }
                </p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="text-sm text-gray-600">تفعيل البريد</label>
                <p className="text-gray-900 text-sm">
                  {employee.auth_user?.email_confirmed_at ? 'مفعل' : 'بانتظار التفعيل'}
                </p>
              </div>
            </div>

            {employee.tasks && (
              <div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
                <h6 className="font-semibold text-primary-700 mb-2">إحصائيات المهام</h6>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-primary-600">إجمالي المهام:</span>
                    <span className="font-medium mr-2">{employee.tasks[0]?.count || 0}</span>
                  </div>
                  <div>
                    <span className="text-primary-600">المهام المكتملة:</span>
                    <span className="font-medium mr-2">{employee.completed_tasks[0]?.count || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {employee.notes && (
            <div className="space-y-2">
              <h5 className="font-semibold text-gray-900 border-b pb-2">ملاحظات</h5>
              <p className="text-gray-700 text-sm leading-relaxed">{employee.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}