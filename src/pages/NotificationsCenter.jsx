// NAVA OPS - Notifications Center
// Real-time notifications and alerts management

import React, { useState, useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import api from '@/services/api';
import PageHeader from '@/components/UI/PageHeader';
import EmptyState from '@/components/UI/EmptyState';
import { Bell, Check, X, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';

export default function NotificationsCenter() {
  const { addNotification } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await api.notifications.getAll({
        isRead: filter === 'unread' ? false : filter === 'read' ? true : undefined
      });
      setNotifications(data);
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to load notifications',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.notifications.markAsRead(id);
      fetchNotifications();
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to mark as read',
        type: 'error'
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      addNotification({
        title: 'Success',
        message: 'All notifications marked as read',
        type: 'success'
      });
      fetchNotifications();
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to mark all as read',
        type: 'error'
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.notifications.delete(id);
      addNotification({
        title: 'Success',
        message: 'Notification deleted',
        type: 'success'
      });
      fetchNotifications();
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to delete notification',
        type: 'error'
      });
    }
  };

  const getNotificationIcon = (type, priority) => {
    if (priority === 'urgent') return <AlertTriangle className="w-5 h-5 text-red-600" />;
    if (type === 'alert') return <AlertCircle className="w-5 h-5 text-orange-600" />;
    if (type === 'insight') return <Info className="w-5 h-5 text-blue-600" />;
    return <CheckCircle className="w-5 h-5 text-green-600" />;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={`You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        icon={Bell}
        actions={
          unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700
                       text-white rounded-lg transition-colors duration-200"
            >
              <Check className="w-5 h-5" />
              <span>Mark All as Read</span>
            </button>
          )
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-2">
        {['all', 'unread', 'read'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors duration-200 ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No Notifications"
            message="You're all caught up! Check back later for new updates."
          />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors duration-200 ${
                  !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type, notification.priority)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!notification.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                          title="Delete"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
