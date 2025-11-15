// src/App.jsx
import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BrandProvider } from './contexts/BrandContext';
import { BranchSelectionProvider } from './contexts/BranchSelectionContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import Layout from './components/Layout/Layout';
import LoadingSpinner from './components/UI/LoadingSpinner';
import OfflineIndicator from './components/UI/OfflineIndicator';
import ErrorBoundary from './components/ErrorBoundary';
import { logger, PerformanceLogger } from './lib/logger';

logger.info('Application started', {
  version: import.meta.env.VITE_APP_VERSION,
  environment: import.meta.env.VITE_ENVIRONMENT,
  devMode: import.meta.env.DEV
});

// Lazy loading للمكونات لتحسين الأداء
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const BrandOverview = lazy(() => import('./pages/BrandOverview'));
const BranchesManagement = lazy(() => import('./pages/BranchesManagement'));
const ReportsAnalytics = lazy(() => import('./pages/ReportsAnalyticsNew'));
const ExecutiveDashboard = lazy(() => import('./pages/ExecutiveDashboard'));
const TeamManagement = lazy(() => import('./pages/TeamManagement'));
const FinancialReports = lazy(() => import('./pages/FinancialReports'));
const FinancialIntelligence = lazy(() => import('./pages/FinancialIntelligence'));
const MenuIntelligence = lazy(() => import('./pages/MenuIntelligence'));
const Settings = lazy(() => import('./pages/Settings'));
const NotificationsCenter = lazy(() => import('./pages/NotificationsCenter'));
const ExecutiveHQ = lazy(() => import('./pages/ExecutiveHQ'));
const GitOperations = lazy(() => import('./GitOperations'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const Billing = lazy(() => import('./pages/Billing'));
const BrandSettings = lazy(() => import('./pages/BrandSettings'));
const AIHub = lazy(() => import('./pages/AIHub'));

// حارس متقدم للمسارات الخاصة
function RequireAuth({ children, requiredPermissions = [] }) {
  const { connectionStatus, user, hasPermission, isAuthenticated } = useAuth();
  const location = useLocation();

  // أثناء التحقق من الجلسة
  if (connectionStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">Checking session...</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Loading your data securely</p>
        </div>
      </div>
    );
  }

  // التحقق من الاتصال بالإنترنت
  if (!navigator.onLine) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md mx-4">
          <div className="w-20 h-20 bg-warning-100 dark:bg-warning-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا يوجد اتصال بالإنترنت</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">يجب أن تكون متصلاً بالإنترنت للوصول إلى المنصة</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  // لو غير مسجل دخول -> رجّعه للّوجن
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // التحقق من الصلاحيات إذا كانت مطلوبة
  if (requiredPermissions.length > 0 && !hasPermission(requiredPermissions)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md mx-4">
          <div className="w-20 h-20 bg-error-100 dark:bg-error-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-9V4m0 2h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">غير مصرح بالوصول</h3>
          <p className="text-gray-600 dark:text-gray-300">ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة</p>
          <button 
            onClick={() => window.history.back()}
            className="mt-4 bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
          >
            العودة
          </button>
        </div>
      </div>
    );
  }

  // كل شيء جيد -> اعرض الصفحة
  return children;
}

// مكون تحميل عالمي
function GlobalLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 rounded-full animate-spin-slow"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-primary-500 rounded-full animate-spin"></div>
        </div>
        <p className="mt-6 text-gray-600 dark:text-gray-300 text-lg font-medium">جاري تحميل NAVA</p>
        <p className="text-primary-500 text-sm mt-2">منصة إدارة المطاعم المتكاملة</p>
      </div>
    </div>
  );
}

export default function App() {
  // Performance tracking for app initialization
  useEffect(() => {
    PerformanceLogger.start('app-init')
    return () => {
      PerformanceLogger.end('app-init', 3000)
    }
  }, [])

  return (
    <ErrorBoundary
      errorMessage="A critical error occurred in the application. Please refresh the page."
      onError={(error, errorInfo) => {
        logger.fatal('Critical Application Error', { errorInfo }, error)
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          <BrandProvider>
            <BranchSelectionProvider>
              <NotificationProvider>
                <SubscriptionProvider>
                  <BrowserRouter>
                  <div className="App">
                    <OfflineIndicator />
                    <Suspense fallback={<GlobalLoading />}>
                  <Routes>
                  {/* صفحة تسجيل الدخول */}
                  <Route path="/login" element={<Login />} />

                  {/* المسارات الرئيسية مع Layout */}
                  <Route path="/" element={
                    <RequireAuth>
                      <Layout>
                        <Dashboard />
                      </Layout>
                    </RequireAuth>
                  } />

                  {/* Brand Overview - Brand-level metrics */}
                  <Route path="/brand-overview" element={
                    <RequireAuth>
                      <Layout>
                        <BrandOverview />
                      </Layout>
                    </RequireAuth>
                  } />

                  {/* إدارة الفروع */}
                  <Route path="/branches" element={
                    <RequireAuth requiredPermissions={['restaurants:view']}>
                      <Layout>
                        <BranchesManagement />
                      </Layout>
                    </RequireAuth>
                  } />

                  {/* Keep old route for backwards compatibility */}
                  <Route path="/restaurants" element={
                    <RequireAuth requiredPermissions={['restaurants:view']}>
                      <Layout>
                        <BranchesManagement />
                      </Layout>
                    </RequireAuth>
                  } />

                  {/* التقارير والتحليلات */}
                  <Route path="/reports" element={
                    <RequireAuth requiredPermissions={['reports:view']}>
                      <Layout>
                        <ReportsAnalytics />
                      </Layout>
                    </RequireAuth>
                  } />

                  {/* Executive Dashboard */}
                  <Route path="/executive" element={
                    <RequireAuth requiredPermissions={['reports:view']}>
                      <Layout>
                        <ExecutiveDashboard />
                      </Layout>
                    </RequireAuth>
                  } />

                  {/* إدارة الفريق */}
                  <Route path="/team" element={
                    <RequireAuth requiredPermissions={['team:manage']}>
                      <Layout>
                        <TeamManagement />
                      </Layout>
                    </RequireAuth>
                  } />

                  {/* التقارير المالية */}
                  <Route path="/financial" element={
                    <RequireAuth requiredPermissions={['financial:view']}>
                      <Layout>
                        <FinancialReports />
                      </Layout>
                    </RequireAuth>
                  } />

                  {/* Executive HQ Dashboard - Premium Feature */}
                  <Route path="/executive-hq" element={
                    <RequireAuth>
                      <Layout>
                        <ExecutiveHQ />
                      </Layout>
                    </RequireAuth>
                  } />

                  {/* Financial Intelligence - Advanced Analytics */}
                  <Route path="/financial-intelligence" element={
                    <RequireAuth requiredPermissions={['financial:view']}>
                      <Layout>
                        <FinancialIntelligence />
                      </Layout>
                    </RequireAuth>
                  } />

                  {/* Menu Intelligence - Menu Performance Analysis */}
                  <Route path="/menu-intelligence" element={
                    <RequireAuth requiredPermissions={['reports:view']}>
                      <Layout>
                        <MenuIntelligence />
                      </Layout>
                    </RequireAuth>
                  } />

                  {/* AI Intelligence Hub - Smart Assistant */}
                  <Route path="/ai-hub" element={
                    <RequireAuth>
                      <Layout>
                        <AIHub />
                      </Layout>
                    </RequireAuth>
                  } />

                  {/* مركز الإشعارات */}
                  <Route path="/notifications" element={
                    <RequireAuth>
                      <Layout>
                        <NotificationsCenter />
                      </Layout>
                    </RequireAuth>
                  } />

                  {/* الإعدادات */}
                  <Route path="/settings" element={
                    <RequireAuth>
                      <Layout>
                        <Settings />
                      </Layout>
                    </RequireAuth>
                  } />

                  {/* Brand Settings */}
                  <Route path="/brand-settings" element={
                    <RequireAuth>
                      <Layout>
                        <BrandSettings />
                      </Layout>
                    </RequireAuth>
                  } />

                  {/* Git Operations Dashboard */}
                  <Route path="/git-ops" element={
                    <RequireAuth>
                      <GitOperations />
                    </RequireAuth>
                  } />

                  {/* Subscription Management */}
                  <Route path="/subscriptions" element={
                    <RequireAuth>
                      <Layout>
                        <Subscriptions />
                      </Layout>
                    </RequireAuth>
                  } />

                  {/* Billing */}
                  <Route path="/billing" element={
                    <RequireAuth>
                      <Layout>
                        <Billing />
                      </Layout>
                    </RequireAuth>
                  } />

                  {/* صفحة 404 مخصصة */}
                  <Route path="*" element={
                    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                      <div className="text-center">
                        <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-600 mb-4">404</h1>
                        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">الصفحة غير موجودة</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8">عذراً، الصفحة التي تبحث عنها غير موجودة.</p>
                        <Navigate to="/" replace>
                          <button className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg transition-colors duration-200">
                            العودة للرئيسية
                          </button>
                        </Navigate>
                      </div>
                    </div>
                  } />
                </Routes>
                </Suspense>
              </div>
              </BrowserRouter>
            </SubscriptionProvider>
          </NotificationProvider>
        </BranchSelectionProvider>
        </BrandProvider>
      </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}