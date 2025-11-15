// src/components/tasks/TasksManagement.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { supabase } from '@lib/supabase';
import { useAuth } from '@contexts/AuthContext';
import { useNotification } from '@contexts/NotificationContext';
import { exportUtils } from '@utils/exportUtils';
import { 
  Plus, Download, FileText, Search, Filter, Calendar, User, 
  Clock, AlertTriangle, CheckCircle, MoreVertical, Edit, Trash2,
  BarChart3, Users, Target, TrendingUp
} from 'lucide-react';

/**
 * نظام إدارة المهام والتذاكر المتكامل والمتقدم لـ NAVA
 */
export default function TasksManagement() {
  const { user, userProfile, hasPermission } = useAuth();
  const { addNotification } = useNotification();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [bulkActions, setBulkActions] = useState([]);
  
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    assigned_to: "",
    due_date: "",
    progress: 0,
    status: "todo",
    brand_id: userProfile?.brand_id || "",
    estimated_hours: "",
    tags: []
  });

  // فلاتر وفرز متقدمة
  const [filters, setFilters] = useState({
    search: "",
    priority: "all",
    assignee: "all",
    status: "all",
    brand: "all",
    tags: []
  });

  const [sortConfig, setSortConfig] = useState({
    field: "due_date",
    direction: "asc"
  });

  // إحصائيات متقدمة
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    overdue: 0,
    highPriority: 0
  });

  const priorityConfig = {
    high: { 
      label: "عالي", 
      color: "bg-red-50 text-red-700 border-red-200",
      icon: "🔴",
      level: 3
    },
    medium: { 
      label: "متوسط", 
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
      icon: "🟡",
      level: 2
    },
    low: { 
      label: "منخفض", 
      color: "bg-green-50 text-green-700 border-green-200",
      icon: "🟢",
      level: 1
    }
  };

  const statusConfig = {
    todo: { 
      label: "قيد الانتظار", 
      color: "bg-gray-50 text-gray-700 border-gray-200",
      icon: Clock,
      progress: 0
    },
    in_progress: { 
      label: "قيد التنفيذ", 
      color: "bg-blue-50 text-blue-700 border-blue-200",
      icon: TrendingUp,
      progress: 50
    },
    review: { 
      label: "قيد المراجعة", 
      color: "bg-purple-50 text-purple-700 border-purple-200",
      icon: Users,
      progress: 80
    },
    completed: { 
      label: "مكتمل", 
      color: "bg-green-50 text-green-700 border-green-200",
      icon: CheckCircle,
      progress: 100
    }
  };

  // جلب البيانات من Supabase مع تحديثات حية
  useEffect(() => {
    fetchTasks();
    fetchEmployees();
    fetchBrands();
    setupRealtimeSubscription();
  }, []);

  // تحديث الإحصائيات عند تغير المهام
  useEffect(() => {
    updateStats();
  }, [tasks]);

  const fetchTasks = async () => {
    try {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          assigned_user:user_profiles!assigned_to(id, full_name, email, avatar_url),
          created_by_user:user_profiles!created_by(id, full_name, email),
          brand:brands(id, name, logo_url)
        `);

      // تطبيق صلاحيات المستخدم
      if (userProfile?.role === 'ops' && userProfile?.brand_id) {
        query = query.eq('brand_id', userProfile.brand_id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في جلب البيانات',
        message: 'تعذر تحميل قائمة المهام'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      let query = supabase
        .from('user_profiles')
        .select('id, full_name, email, role, avatar_url, is_active')
        .eq('is_active', true);

      if (userProfile?.role === 'ops' && userProfile?.brand_id) {
        // جلب موظفي الفرع فقط
        query = query.eq('brand_id', userProfile.brand_id);
      }

      const { data, error } = await query.order('full_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      // Error fetching employees silently
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

  // تحديثات حية للمهام
  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('tasks-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks' 
        },
        (payload) => {
          fetchTasks(); // إعادة جلب البيانات للتأكد من التحديث
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  // إنشاء مهمة جديدة
  const createTask = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      addNotification({
        type: 'warning',
        title: 'بيانات ناقصة',
        message: 'يرجى إدخال عنوان المهمة'
      });
      return;
    }

    try {
      const newTask = {
        ...form,
        created_by: user.id,
        progress: Number(form.progress) || 0,
        due_date: form.due_date || null,
        assigned_to: form.assigned_to || null,
        estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null,
        tags: Array.isArray(form.tags) ? form.tags : []
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([newTask])
        .select(`
          *,
          assigned_user:user_profiles!assigned_to(id, full_name, email, avatar_url),
          brand:brands(id, name)
        `)
        .single();

      if (error) throw error;

      setTasks(prev => [data, ...prev]);
      resetForm();
      setShowTaskForm(false);
      
      addNotification({
        type: 'success',
        title: 'تم إنشاء المهمة',
        message: 'تم إنشاء المهمة بنجاح'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في الإنشاء',
        message: 'تعذر إنشاء المهمة'
      });
    }
  };

  // تحديث مهمة موجودة
  const updateTask = async (taskId, updates) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      ));

      addNotification({
        type: 'success',
        title: 'تم التحديث',
        message: 'تم تحديث المهمة بنجاح'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في التحديث',
        message: 'تعذر تحديث المهمة'
      });
    }
  };

  // حذف مهمة
  const deleteTask = async (taskId) => {
    if (!confirm('هل أنت متأكد من حذف هذه المهمة؟')) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== taskId));
      
      addNotification({
        type: 'success',
        title: 'تم الحذف',
        message: 'تم حذف المهمة بنجاح'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'خطأ في الحذف',
        message: 'تعذر حذف المهمة'
      });
    }
  };

  // إعادة تعيين النموذج
  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      priority: "medium",
      assigned_to: "",
      due_date: "",
      progress: 0,
      status: "todo",
      brand_id: userProfile?.brand_id || "",
      estimated_hours: "",
      tags: []
    });
    setEditingTask(null);
  };

  // تحميل مهمة للتعديل
  const loadTaskForEdit = (task) => {
    setForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      assigned_to: task.assigned_to || "",
      due_date: task.due_date || "",
      progress: task.progress,
      status: task.status,
      brand_id: task.brand_id || "",
      estimated_hours: task.estimated_hours || "",
      tags: task.tags || []
    });
    setEditingTask(task);
    setShowTaskForm(true);
  };

  // تحديث تقدم المهمة
  const updateTaskProgress = async (taskId, progress) => {
    const newProgress = Math.max(0, Math.min(100, progress));
    const status = newProgress === 100 ? 'completed' : 
                  newProgress > 0 ? 'in_progress' : 'todo';

    await updateTask(taskId, { 
      progress: newProgress,
      status: status
    });
  };

  // تحديث الإحصائيات
  const updateStats = useCallback(() => {
    const now = new Date();
    const newStats = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      overdue: tasks.filter(t => 
        t.due_date && new Date(t.due_date) < now && t.status !== 'completed'
      ).length,
      highPriority: tasks.filter(t => t.priority === 'high').length
    };
    setStats(newStats);
  }, [tasks]);

  // تصدير البيانات
  const handleExportCSV = () => {
    const rows = filteredTasks.map(task => ({
      'المعرف': task.id,
      'العنوان': task.title,
      'الوصف': task.description,
      'الأولوية': priorityConfig[task.priority]?.label || task.priority,
      'الحالة': statusConfig[task.status]?.label || task.status,
      'التقدم': `${task.progress}%`,
      'المسؤول': task.assigned_user?.full_name || 'غير معين',
      'الفرع': task.brand?.name || 'غير محدد',
      'تاريخ الاستحقاق': task.due_date ? formatDate(task.due_date) : '',
      'تاريخ الإنشاء': formatDate(task.created_at)
    }));
    
    exportUtils.exportToCSV(rows, `مهام_نافا_${formatDate(new Date())}`);
  };

  const handleExportPDF = () => {
    exportUtils.exportToPDF("#tasks-root", `تقرير_المهام_${formatDate(new Date())}`);
  };

  // تنسيق التاريخ
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  // حساب الوقت المتبقي
  const getTimeRemaining = (dueDate) => {
    if (!dueDate) return null;
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // تصفية وفرز المهام
  const filteredTasks = useMemo(() => {
    let data = [...tasks];

    // البحث
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();
      data = data.filter(task =>
        task.title?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // الفلترة
    if (filters.priority !== "all") {
      data = data.filter(task => task.priority === filters.priority);
    }

    if (filters.assignee !== "all") {
      data = data.filter(task => task.assigned_to === filters.assignee);
    }

    if (filters.status !== "all") {
      data = data.filter(task => task.status === filters.status);
    }

    if (filters.brand !== "all") {
      data = data.filter(task => task.brand_id === filters.brand);
    }

    // الفرز
    data.sort((a, b) => {
      let aValue = a[sortConfig.field];
      let bValue = b[sortConfig.field];

      if (sortConfig.field === 'due_date') {
        aValue = aValue ? new Date(aValue) : new Date(0);
        bValue = bValue ? new Date(bValue) : new Date(0);
      }

      if (sortConfig.field === 'priority') {
        aValue = priorityConfig[aValue]?.level || 0;
        bValue = priorityConfig[bValue]?.level || 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [tasks, filters, sortConfig]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل المهام...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" id="tasks-root">
      {/* البطاقة الرئيسية */}
      <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-200">
        
        {/* الهيدر المحسن */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">نظام المهام والتذاكر</h1>
            <p className="text-gray-600 mt-1">إدارة المهام التشغيلية ومتابعة التذاكر</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {hasPermission(['tasks:create']) && (
              <button
                className="btn-primary flex items-center gap-2"
                onClick={() => setShowTaskForm(true)}
              >
                <Plus size={18} />
                إضافة مهمة جديدة
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatCard 
            title="إجمالي المهام" 
            value={stats.total} 
            icon={BarChart3}
            color="blue"
          />
          <StatCard 
            title="مكتمل" 
            value={stats.completed} 
            icon={CheckCircle}
            color="green"
            percentage={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}
          />
          <StatCard 
            title="قيد التنفيذ" 
            value={stats.inProgress} 
            icon={TrendingUp}
            color="yellow"
          />
          <StatCard 
            title="متأخر" 
            value={stats.overdue} 
            icon={AlertTriangle}
            color="red"
          />
          <StatCard 
            title="عالية الأولوية" 
            value={stats.highPriority} 
            icon={Target}
            color="purple"
          />
        </div>

        {/* شريط الفلاتر المتقدم */}
        <AdvancedFilterBar
          filters={filters}
          setFilters={setFilters}
          sortConfig={sortConfig}
          setSortConfig={setSortConfig}
          employees={employees}
          brands={brands}
        />

        {/* قائمة المهام المحسنة */}
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <AdvancedTaskCard 
              key={task.id}
              task={task}
              priorityConfig={priorityConfig}
              statusConfig={statusConfig}
              onProgressChange={updateTaskProgress}
              onEdit={loadTaskForEdit}
              onDelete={deleteTask}
              formatDate={formatDate}
              getTimeRemaining={getTimeRemaining}
              canEdit={hasPermission(['tasks:edit'])}
              canDelete={hasPermission(['tasks:delete'])}
            />
          ))}

          {filteredTasks.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Filter size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg">لا توجد مهام مطابقة للفلاتر الحالية</p>
              <p className="text-sm mt-2">جرب تعديل شروط البحث أو أضف مهمة جديدة</p>
            </div>
          )}
        </div>
      </div>

      {/* نموذج إضافة/تعديل مهمة */}
      <TaskFormModal
        show={showTaskForm}
        onClose={() => {
          setShowTaskForm(false);
          resetForm();
        }}
        form={form}
        setForm={setForm}
        employees={employees}
        brands={brands}
        onSubmit={editingTask ? (e) => updateTask(editingTask.id, form) : createTask}
        editingTask={editingTask}
        userProfile={userProfile}
      />
    </div>
  );
}

// مكون البطاقة المتقدمة
function AdvancedTaskCard({ 
  task, 
  priorityConfig, 
  statusConfig, 
  onProgressChange, 
  onEdit, 
  onDelete,
  formatDate, 
  getTimeRemaining,
  canEdit,
  canDelete
}) {
  const [showMenu, setShowMenu] = useState(false);
  const StatusIcon = statusConfig[task.status]?.icon;
  const daysRemaining = getTimeRemaining(task.due_date);

  return (
    <div className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all bg-white group">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {StatusIcon && <StatusIcon size={16} className="text-gray-400" />}
            <h3 className="font-semibold text-gray-900 text-lg truncate">{task.title}</h3>
          </div>
          <p className="text-gray-600 text-sm line-clamp-2">{task.description}</p>
        </div>
        
        <div className="flex gap-2 ml-2">
          <span className={`px-3 py-1 text-sm rounded-full border ${priorityConfig[task.priority]?.color}`}>
            {priorityConfig[task.priority]?.icon} {priorityConfig[task.priority]?.label}
          </span>
          <span className={`px-3 py-1 text-sm rounded-full ${statusConfig[task.status]?.color}`}>
            {statusConfig[task.status]?.label}
          </span>
          
          {/* قائمة الإجراءات */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical size={16} />
            </button>
            
            {showMenu && (
              <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                {canEdit && (
                  <button
                    onClick={() => {
                      onEdit(task);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                  >
                    <Edit size={14} />
                    تعديل المهمة
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => {
                      onDelete(task.id);
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                  >
                    <Trash2 size={14} />
                    حذف المهمة
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {/* شريط التقدم المحسن */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">مستوى التقدم</span>
            <span className="font-medium">{task.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                task.progress >= 80 ? "bg-green-500" :
                task.progress >= 40 ? "bg-yellow-500" : "bg-primary-500"
              }`}
              style={{ width: `${task.progress}%` }}
            />
          </div>

          {/* أزرار التقدم السريع */}
          <div className="flex items-center gap-1 mt-2 text-xs">
            <span className="text-gray-600">تعديل سريع:</span>
            {[0, 25, 50, 75, 100].map((p) => (
              <button
                key={p}
                onClick={() => onProgressChange(task.id, p)}
                className={`px-2 py-1 border rounded hover:bg-gray-50 transition-colors ${
                  task.progress === p ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-gray-300'
                }`}
              >
                {p}%
              </button>
            ))}
          </div>
        </div>

        {/* معلومات إضافية محسنة */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between text-sm gap-3">
          <div className="flex items-center gap-4 text-gray-600 flex-wrap">
            {task.assigned_user && (
              <div className="flex items-center">
                <User size={14} className="ml-1" />
                <span className="font-medium text-gray-900">{task.assigned_user.full_name}</span>
              </div>
            )}
            
            {task.due_date && (
              <div className="flex items-center">
                <Calendar size={14} className="ml-1" />
                <span className={`font-medium ${
                  daysRemaining < 0 && task.status !== 'completed' 
                    ? 'text-red-600' 
                    : daysRemaining < 3 
                    ? 'text-yellow-600' 
                    : 'text-gray-900'
                }`}>
                  {formatDate(task.due_date)}
                  {daysRemaining !== null && (
                    <span className={`text-xs mr-1 ${
                      daysRemaining < 0 && task.status !== 'completed' 
                        ? 'text-red-500' 
                        : daysRemaining < 3 
                        ? 'text-yellow-500' 
                        : 'text-gray-500'
                    }`}>
                      ({daysRemaining > 0 ? `${daysRemaining} يوم` : daysRemaining < 0 ? 'متأخر' : 'اليوم'})
                    </span>
                  )}
                </span>
              </div>
            )}
            
            {task.estimated_hours && (
              <div className="flex items-center">
                <Clock size={14} className="ml-1" />
                <span>{task.estimated_hours} ساعة</span>
              </div>
            )}
          </div>
          
          <div className="text-gray-500 text-xs">
            أنشئ في {formatDate(task.created_at)}
            {task.created_by_user && ` بواسطة ${task.created_by_user.full_name}`}
          </div>
        </div>

        {/* الوسوم */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// مكون البطاقة الإحصائية
function StatCard({ title, value, icon: Icon, color, percentage }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700'
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
function AdvancedFilterBar({ filters, setFilters, sortConfig, setSortConfig, employees, brands }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-6">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="ابحث في المهام..."
          className="w-full pr-10 pl-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>
      
      <select
        className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        value={filters.priority}
        onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
      >
        <option value="all">كل الأولويات</option>
        <option value="high">عالي</option>
        <option value="medium">متوسط</option>
        <option value="low">منخفض</option>
      </select>

      <select
        className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        value={filters.assignee}
        onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
      >
        <option value="all">كل المسؤولين</option>
        {employees.map(emp => (
          <option key={emp.id} value={emp.id}>
            {emp.full_name}
          </option>
        ))}
      </select>

      <select
        className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        value={filters.status}
        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
      >
        <option value="all">كل الحالات</option>
        <option value="todo">قيد الانتظار</option>
        <option value="in_progress">قيد التنفيذ</option>
        <option value="review">قيد المراجعة</option>
        <option value="completed">مكتمل</option>
      </select>

      <select
        className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        value={filters.brand}
        onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
      >
        <option value="all">كل الفروع</option>
        {brands.map(brand => (
          <option key={brand.id} value={brand.id}>
            {brand.name}
          </option>
        ))}
      </select>

      <select
        className="px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        value={`${sortConfig.field}_${sortConfig.direction}`}
        onChange={(e) => {
          const [field, direction] = e.target.value.split('_');
          setSortConfig({ field, direction });
        }}
      >
        <option value="due_date_asc">الأقرب استحقاقاً</option>
        <option value="due_date_desc">الأبعد استحقاقاً</option>
        <option value="progress_desc">الأعلى تقدمًا</option>
        <option value="progress_asc">الأقل تقدمًا</option>
        <option value="priority_desc">الأعلى أولوية</option>
        <option value="created_at_desc">الأحدث</option>
      </select>
    </div>
  );
}

// مكون النموذج المحسن
function TaskFormModal({ show, onClose, form, setForm, employees, brands, onSubmit, editingTask, userProfile }) {
  if (!show) return null;

  const isOpsUser = userProfile?.role === 'ops';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm grid place-items-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingTask ? 'تعديل المهمة' : 'إضافة مهمة جديدة'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">عنوان المهمة *</label>
              <input
                type="text"
                className="w-full input-field"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
              <select
                className="w-full input-field"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="todo">قيد الانتظار</option>
                <option value="in_progress">قيد التنفيذ</option>
                <option value="review">قيد المراجعة</option>
                <option value="completed">مكتمل</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
            <textarea
              className="w-full input-field"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="وصف تفصيلي للمهمة..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الأولوية</label>
              <select
                className="w-full input-field"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="high">عالي</option>
                <option value="medium">متوسط</option>
                <option value="low">منخفض</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المسؤول</label>
              <select
                className="w-full input-field"
                value={form.assigned_to}
                onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
              >
                <option value="">اختر المسؤول</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">التقدم %</label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full input-field"
                value={form.progress}
                onChange={(e) => setForm({ ...form, progress: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الوقت المقدر (ساعات)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                className="w-full input-field"
                value={form.estimated_hours}
                onChange={(e) => setForm({ ...form, estimated_hours: e.target.value })}
                placeholder="مثال: 2.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الفرع</label>
              <select
                className="w-full input-field"
                value={form.brand_id}
                onChange={(e) => setForm({ ...form, brand_id: e.target.value })}
                disabled={isOpsUser} // تعطيل إذا كان مستخدم ops
              >
                <option value="">اختر الفرع</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              {isOpsUser && (
                <p className="text-xs text-gray-500 mt-1">محدد تلقائياً حسب فرعك</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الاستحقاق</label>
              <input
                type="date"
                className="w-full input-field"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الوسوم</label>
            <input
              type="text"
              className="w-full input-field"
              placeholder="أضف وسوماً مفصولة بفاصلة (مثال: عاجل, تسويق, تقنية)"
              value={form.tags.join(', ')}
              onChange={(e) => setForm({ 
                ...form, 
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
              })}
            />
            <p className="text-xs text-gray-500 mt-1">استخدم الوسوم لتنظيم وتصنيف المهام</p>
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
              {editingTask ? 'تحديث المهمة' : 'إنشاء المهمة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
