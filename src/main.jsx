// src/main.jsx
import React, { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LocaleProvider } from './contexts/LocaleContext';

// Error Boundary
import ErrorBoundary from './components/ErrorBoundary';

// Logger
import logger from './lib/logger';

// Performance monitoring
import { reportWebVitals } from './lib/performanceUtils';

// Initialize logger
logger.info('Application starting', {
  version: import.meta.env.VITE_APP_VERSION || '2.0.0',
  environment: import.meta.env.VITE_APP_ENV || 'development',
});

// Report Web Vitals (Core Web Vitals monitoring)
reportWebVitals((metric) => {
  logger.debug('Web Vital', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
  });
});

// Root component with all providers
const Root = () => {
  return (
    <StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <NotificationProvider>
            <LocaleProvider>
              <ThemeProvider>
                <AuthProvider>
                  <App />
                </AuthProvider>
              </ThemeProvider>
            </LocaleProvider>
          </NotificationProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </StrictMode>
  );
};

// Render the application
const rootElement = document.getElementById('root');

if (!rootElement) {
  logger.error('Root element not found', { selector: '#root' });
  throw new Error('Failed to find root element');
}

const root = ReactDOM.createRoot(rootElement);
root.render(<Root />);

// Log successful mount
logger.info('Application mounted successfully');

// Service Worker Registration (for PWA support)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        logger.info('Service Worker registered', {
          scope: registration.scope,
        });
      })
      .catch((error) => {
        logger.warn('Service Worker registration failed', {
          error: error.message,
        });
      });
  });
}

// Hot Module Replacement (HMR) for development
if (import.meta.hot) {
  import.meta.hot.accept();
  logger.debug('HMR enabled');
}
