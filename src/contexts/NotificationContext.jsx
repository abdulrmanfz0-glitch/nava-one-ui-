// src/contexts/NotificationContext.jsx
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info,
  X,
  Bell
} from 'lucide-react';

// أنواع الإشعارات
const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error', 
  WARNING: 'warning',
  INFO: 'info'
};

// أيقونات الإشعارات
const NOTIFICATION_ICONS = {
  [NOTIFICATION_TYPES.SUCCESS]: CheckCircle,
  [NOTIFICATION_TYPES.ERROR]: XCircle,
  [NOTIFICATION_TYPES.WARNING]: AlertTriangle,
  [NOTIFICATION_TYPES.INFO]: Info
};

// ألوان الإشعارات
const NOTIFICATION_COLORS = {
  [NOTIFICATION_TYPES.SUCCESS]: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: 'text-green-500'
  },
  [NOTIFICATION_TYPES.ERROR]: {
    bg: 'bg-red-50',
    border: 'border-red-200', 
    text: 'text-red-800',
    icon: 'text-red-500'
  },
  [NOTIFICATION_TYPES.WARNING]: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: 'text-yellow-500'
  },
  [NOTIFICATION_TYPES.INFO]: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: 'text-blue-500'
  }
};

const NotificationContext = createContext();

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // إضافة إشعار جديد
  const addNotification = useCallback(({
    title,
    message,
    type = NOTIFICATION_TYPES.INFO,
    duration = 5000,
    action,
    persistent = false
  }) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      title,
      message,
      type,
      duration,
      action,
      persistent,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
    
    if (!persistent) {
      setUnreadCount(prev => prev + 1);
    }

    // إزالة تلقائية إذا لم يكن persistent
    if (!persistent && duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, []);

  // إزالة إشعار
  const removeNotification = useCallback((id) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification && !notification.read && !notification.persistent) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
      return prev.filter(notification => notification.id !== id);
    });
  }, []);

  // تحديد إشعار كمقروء
  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // تحديد كل الإشعارات كمقروءة
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  }, []);

  // مسح جميع الإشعارات
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // مسح الإشعارات المقروءة فقط
  const clearRead = useCallback(() => {
    setNotifications(prev => prev.filter(notification => !notification.read));
  }, []);

  // الحصول على إحصائيات الإشعارات
  const getNotificationStats = useCallback(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const read = total - unread;

    const byType = {
      [NOTIFICATION_TYPES.SUCCESS]: notifications.filter(n => n.type === NOTIFICATION_TYPES.SUCCESS).length,
      [NOTIFICATION_TYPES.ERROR]: notifications.filter(n => n.type === NOTIFICATION_TYPES.ERROR).length,
      [NOTIFICATION_TYPES.WARNING]: notifications.filter(n => n.type === NOTIFICATION_TYPES.WARNING).length,
      [NOTIFICATION_TYPES.INFO]: notifications.filter(n => n.type === NOTIFICATION_TYPES.INFO).length
    };

    return { total, unread, read, byType };
  }, [notifications]);

  // إشعارات سريعة - memoized
  const success = useCallback((title, message, options) =>
    addNotification({ title, message, type: NOTIFICATION_TYPES.SUCCESS, ...options }), [addNotification]);

  const error = useCallback((title, message, options) =>
    addNotification({ title, message, type: NOTIFICATION_TYPES.ERROR, ...options }), [addNotification]);

  const warning = useCallback((title, message, options) =>
    addNotification({ title, message, type: NOTIFICATION_TYPES.WARNING, ...options }), [addNotification]);

  const info = useCallback((title, message, options) =>
    addNotification({ title, message, type: NOTIFICATION_TYPES.INFO, ...options }), [addNotification]);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    clearRead,
    getNotificationStats,
    success,
    error,
    warning,
    info
  }), [notifications, unreadCount, addNotification, removeNotification, markAsRead, markAllAsRead, clearAll, clearRead, getNotificationStats, success, error, warning, info]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* حاوية الإشعارات العائمة */}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

// مكون حاوية الإشعارات
function NotificationContainer() {
  const { notifications, removeNotification, markAsRead } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 w-96 max-w-full">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
          onRead={() => markAsRead(notification.id)}
        />
      ))}
    </div>
  );
}

// مكون Toast للإشعارات
function NotificationToast({ notification, onClose, onRead }) {
  const {
    title,
    message,
    type,
    action,
    persistent,
    read
  } = notification;

  const Icon = NOTIFICATION_ICONS[type];
  const colors = NOTIFICATION_COLORS[type];

  const handleClick = () => {
    if (!read) {
      onRead();
    }
    if (action?.onClick) {
      action.onClick();
    }
  };

  return (
    <div 
      className={`
        relative transform transition-all duration-300 ease-in-out
        ${colors.bg} ${colors.border} border rounded-2xl shadow-lg
        hover:shadow-xl cursor-pointer group
        ${read ? 'opacity-80' : 'opacity-100'}
      `}
      onClick={handleClick}
    >
      <div className="p-4">
        {/* الهيدر */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <Icon className={`${colors.icon} flex-shrink-0`} size={20} />
            <h4 className={`font-semibold ${colors.text}`}>{title}</h4>
          </div>
          
          <div className="flex items-center gap-2">
            {/* علامة غير مقروء */}
            {!read && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className={`
                opacity-0 group-hover:opacity-100 transition-opacity duration-200
                p-1 rounded-full hover:bg-black/10
                ${colors.text}
              `}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* المحتوى */}
        <div className={`text-sm ${colors.text} ml-8`}>
          <p>{message}</p>
        </div>

        {/* الإجراءات */}
        {action && (
          <div className="mt-3 ml-8">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (action.onClick) {
                  action.onClick();
                }
                if (!read) {
                  onRead();
                }
              }}
              className={`
                text-sm font-medium px-3 py-1 rounded-lg transition-colors
                ${colors.text} hover:bg-black/10
              `}
            >
              {action.label}
            </button>
          </div>
        )}

        {/* شريط التقدم (لغير المستديمة) */}
        {!persistent && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-2xl overflow-hidden">
            <div 
              className={`
                h-full transition-all duration-1000 ease-linear
                ${type === NOTIFICATION_TYPES.SUCCESS ? 'bg-green-500' :
                  type === NOTIFICATION_TYPES.ERROR ? 'bg-red-500' :
                  type === NOTIFICATION_TYPES.WARNING ? 'bg-yellow-500' : 'bg-blue-500'}
              `}
              style={{ 
                width: '100%',
                animation: 'shrink 5s linear forwards'
              }}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// مكون بادج عداد الإشعارات
export function NotificationBadge({ className = '' }) {
  const { unreadCount } = useNotification();

  if (unreadCount === 0) return null;

  return (
    <span className={`
      absolute -top-2 -right-2 bg-red-500 text-white text-xs 
      rounded-full w-5 h-5 flex items-center justify-center 
      animate-pulse shadow-lg ${className}
    `}>
      {unreadCount > 99 ? '99+' : unreadCount}
    </span>
  );
}

// مكون زر الإشعارات للشريط العلوي
export function NotificationBell() {
  const { unreadCount, markAllAsRead } = useNotification();

  return (
    <div className="relative">
      <button
        onClick={markAllAsRead}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors relative"
        title="الإشعارات"
      >
        <Bell size={20} className="text-white" />
        <NotificationBadge />
      </button>
    </div>
  );
}

// تصدير أنواع الإشعارات للاستخدام الخارجي
export { NOTIFICATION_TYPES };

export default NotificationContext;