// src/contexts/LocaleContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import logger from '../lib/logger';

const LocaleContext = createContext();

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

// Translation keys for Arabic and English
const translations = {
  ar: {
    // Common
    'common.app_name': 'نافا للعمليات',
    'common.welcome': 'مرحباً',
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجح',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.view': 'عرض',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.export': 'تصدير',
    'common.import': 'استيراد',
    'common.refresh': 'تحديث',
    'common.close': 'إغلاق',
    'common.yes': 'نعم',
    'common.no': 'لا',
    'common.confirm': 'تأكيد',

    // Navigation
    'nav.dashboard': 'لوحة التحكم',
    'nav.restaurants': 'المطاعم',
    'nav.reports': 'التقارير',
    'nav.analytics': 'التحليلات',
    'nav.team': 'الفريق',
    'nav.settings': 'الإعدادات',
    'nav.notifications': 'الإشعارات',
    'nav.logout': 'تسجيل الخروج',

    // Dashboard
    'dashboard.title': 'لوحة التحكم',
    'dashboard.overview': 'نظرة عامة',
    'dashboard.revenue': 'الإيرادات',
    'dashboard.orders': 'الطلبات',
    'dashboard.performance': 'الأداء',
    'dashboard.insights': 'رؤى ذكية',

    // Authentication
    'auth.login': 'تسجيل الدخول',
    'auth.logout': 'تسجيل الخروج',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.remember_me': 'تذكرني',
    'auth.forgot_password': 'نسيت كلمة المرور؟',
    'auth.sign_in': 'تسجيل الدخول',
    'auth.sign_up': 'إنشاء حساب',
    'auth.welcome_back': 'مرحباً بعودتك',
    'auth.session_expired': 'انتهت الجلسة',

    // Restaurants
    'restaurants.title': 'المطاعم',
    'restaurants.add': 'إضافة مطعم',
    'restaurants.edit': 'تعديل المطعم',
    'restaurants.delete': 'حذف المطعم',
    'restaurants.name': 'اسم المطعم',
    'restaurants.location': 'الموقع',
    'restaurants.status': 'الحالة',
    'restaurants.active': 'نشط',
    'restaurants.inactive': 'غير نشط',

    // Reports
    'reports.title': 'التقارير',
    'reports.generate': 'إنشاء تقرير',
    'reports.financial': 'التقارير المالية',
    'reports.operations': 'التقارير التشغيلية',
    'reports.export_pdf': 'تصدير PDF',
    'reports.export_excel': 'تصدير Excel',

    // Team
    'team.title': 'إدارة الفريق',
    'team.add_member': 'إضافة عضو',
    'team.role': 'الدور',
    'team.permissions': 'الصلاحيات',
    'team.admin': 'مدير',
    'team.ops': 'عمليات',
    'team.viewer': 'مشاهد',

    // Notifications
    'notifications.title': 'الإشعارات',
    'notifications.mark_read': 'تحديد كمقروء',
    'notifications.mark_all_read': 'تحديد الكل كمقروء',
    'notifications.clear_all': 'مسح الكل',
    'notifications.no_notifications': 'لا توجد إشعارات',

    // Settings
    'settings.title': 'الإعدادات',
    'settings.profile': 'الملف الشخصي',
    'settings.preferences': 'التفضيلات',
    'settings.language': 'اللغة',
    'settings.theme': 'المظهر',
    'settings.security': 'الأمان',

    // Errors
    'error.generic': 'حدث خطأ غير متوقع',
    'error.network': 'خطأ في الاتصال بالشبكة',
    'error.unauthorized': 'غير مصرح',
    'error.forbidden': 'ممنوع',
    'error.not_found': 'غير موجود',
    'error.server': 'خطأ في الخادم',

    // Success messages
    'success.saved': 'تم الحفظ بنجاح',
    'success.deleted': 'تم الحذف بنجاح',
    'success.updated': 'تم التحديث بنجاح',
    'success.created': 'تم الإنشاء بنجاح',
  },

  en: {
    // Common
    'common.app_name': 'Nava Ops',
    'common.welcome': 'Welcome',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.refresh': 'Refresh',
    'common.close': 'Close',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.confirm': 'Confirm',

    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.restaurants': 'Restaurants',
    'nav.reports': 'Reports',
    'nav.analytics': 'Analytics',
    'nav.team': 'Team',
    'nav.settings': 'Settings',
    'nav.notifications': 'Notifications',
    'nav.logout': 'Logout',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.overview': 'Overview',
    'dashboard.revenue': 'Revenue',
    'dashboard.orders': 'Orders',
    'dashboard.performance': 'Performance',
    'dashboard.insights': 'Smart Insights',

    // Authentication
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.remember_me': 'Remember me',
    'auth.forgot_password': 'Forgot password?',
    'auth.sign_in': 'Sign In',
    'auth.sign_up': 'Sign Up',
    'auth.welcome_back': 'Welcome back',
    'auth.session_expired': 'Session expired',

    // Restaurants
    'restaurants.title': 'Restaurants',
    'restaurants.add': 'Add Restaurant',
    'restaurants.edit': 'Edit Restaurant',
    'restaurants.delete': 'Delete Restaurant',
    'restaurants.name': 'Restaurant Name',
    'restaurants.location': 'Location',
    'restaurants.status': 'Status',
    'restaurants.active': 'Active',
    'restaurants.inactive': 'Inactive',

    // Reports
    'reports.title': 'Reports',
    'reports.generate': 'Generate Report',
    'reports.financial': 'Financial Reports',
    'reports.operations': 'Operations Reports',
    'reports.export_pdf': 'Export PDF',
    'reports.export_excel': 'Export Excel',

    // Team
    'team.title': 'Team Management',
    'team.add_member': 'Add Member',
    'team.role': 'Role',
    'team.permissions': 'Permissions',
    'team.admin': 'Admin',
    'team.ops': 'Operations',
    'team.viewer': 'Viewer',

    // Notifications
    'notifications.title': 'Notifications',
    'notifications.mark_read': 'Mark as read',
    'notifications.mark_all_read': 'Mark all as read',
    'notifications.clear_all': 'Clear all',
    'notifications.no_notifications': 'No notifications',

    // Settings
    'settings.title': 'Settings',
    'settings.profile': 'Profile',
    'settings.preferences': 'Preferences',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.security': 'Security',

    // Errors
    'error.generic': 'An unexpected error occurred',
    'error.network': 'Network connection error',
    'error.unauthorized': 'Unauthorized',
    'error.forbidden': 'Forbidden',
    'error.not_found': 'Not found',
    'error.server': 'Server error',

    // Success messages
    'success.saved': 'Saved successfully',
    'success.deleted': 'Deleted successfully',
    'success.updated': 'Updated successfully',
    'success.created': 'Created successfully',
  }
};

export function LocaleProvider({ children }) {
  // Get initial locale from localStorage or use default from env
  const getInitialLocale = () => {
    try {
      const stored = localStorage.getItem('nava_locale');
      if (stored && ['ar', 'en'].includes(stored)) {
        return stored;
      }
    } catch (e) {
      logger.warn('Failed to get locale from localStorage', { error: e.message });
    }
    return import.meta.env.VITE_DEFAULT_LANGUAGE || 'ar';
  };

  const [locale, setLocaleState] = useState(getInitialLocale());
  const [direction, setDirection] = useState(locale === 'ar' ? 'rtl' : 'ltr');

  // Update direction and document attributes when locale changes
  useEffect(() => {
    const newDirection = locale === 'ar' ? 'rtl' : 'ltr';
    setDirection(newDirection);

    // Update document attributes
    document.documentElement.lang = locale;
    document.documentElement.dir = newDirection;

    // Add direction class to body for CSS targeting
    document.body.className = document.body.className.replace(/\b(rtl|ltr)\b/g, '');
    document.body.classList.add(newDirection);

    // Store preference
    try {
      localStorage.setItem('nava_locale', locale);
    } catch (e) {
      logger.warn('Failed to save locale to localStorage', { error: e.message });
    }

    logger.info('Locale changed', { locale, direction: newDirection });
  }, [locale]);

  // Translation function
  const t = useCallback((key, params = {}) => {
    const currentTranslations = translations[locale] || translations.en;
    let text = currentTranslations[key] || key;

    // Replace parameters (e.g., {name} in text)
    Object.keys(params).forEach(param => {
      const regex = new RegExp(`{${param}}`, 'g');
      text = text.replace(regex, params[param]);
    });

    return text;
  }, [locale]);

  // Change locale
  const setLocale = useCallback((newLocale) => {
    if (['ar', 'en'].includes(newLocale)) {
      setLocaleState(newLocale);
      logger.info('Locale set to:', { locale: newLocale });
    } else {
      logger.warn('Attempted to set invalid locale:', { locale: newLocale });
    }
  }, []);

  // Toggle locale between Arabic and English
  const toggleLocale = useCallback(() => {
    setLocale(locale === 'ar' ? 'en' : 'ar');
  }, [locale, setLocale]);

  // Check if current locale is RTL
  const isRTL = useCallback(() => {
    return direction === 'rtl';
  }, [direction]);

  // Format number according to locale
  const formatNumber = useCallback((number, options = {}) => {
    try {
      return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', options).format(number);
    } catch (e) {
      logger.error('Number formatting failed', { number, locale, error: e.message });
      return number.toString();
    }
  }, [locale]);

  // Format currency according to locale
  const formatCurrency = useCallback((amount, currency = 'SAR') => {
    try {
      return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
        style: 'currency',
        currency,
      }).format(amount);
    } catch (e) {
      logger.error('Currency formatting failed', { amount, currency, locale, error: e.message });
      return `${currency} ${amount}`;
    }
  }, [locale]);

  // Format date according to locale
  const formatDate = useCallback((date, options = {}) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        ...options,
      }).format(dateObj);
    } catch (e) {
      logger.error('Date formatting failed', { date, locale, error: e.message });
      return date.toString();
    }
  }, [locale]);

  // Format relative time (e.g., "2 days ago")
  const formatRelativeTime = useCallback((date) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      const now = new Date();
      const diffInSeconds = Math.floor((now - dateObj) / 1000);

      if (diffInSeconds < 60) {
        return t('time.just_now');
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return locale === 'ar' ? `منذ ${minutes} دقيقة` : `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return locale === 'ar' ? `منذ ${hours} ساعة` : `${hours} hour${hours > 1 ? 's' : ''} ago`;
      } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return locale === 'ar' ? `منذ ${days} يوم` : `${days} day${days > 1 ? 's' : ''} ago`;
      } else {
        return formatDate(dateObj);
      }
    } catch (e) {
      logger.error('Relative time formatting failed', { date, error: e.message });
      return date.toString();
    }
  }, [locale, formatDate, t]);

  const value = useMemo(() => ({
    locale,
    direction,
    setLocale,
    toggleLocale,
    isRTL,
    t,
    formatNumber,
    formatCurrency,
    formatDate,
    formatRelativeTime,
    // Available locales
    availableLocales: ['ar', 'en'],
    // Locale names
    localeNames: {
      ar: 'العربية',
      en: 'English',
    },
  }), [locale, direction, setLocale, toggleLocale, isRTL, t, formatNumber, formatCurrency, formatDate, formatRelativeTime]);

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export default LocaleContext;
