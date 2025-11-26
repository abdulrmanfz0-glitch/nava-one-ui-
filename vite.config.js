import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // تحميل متغيرات البيئة
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react({
        // تحسينات إضافية لـ React
        jsxRuntime: 'automatic'
      }),

      // PWA - تطبيق ويب تقدمي
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        manifest: {
          name: 'NAVA - منصة إدارة المطاعم',
          short_name: 'NAVA',
          description: 'منصة متكاملة لإدارة وتشغيل المطاعم',
          theme_color: '#0088FF',
          background_color: '#ffffff',
          display: 'standalone',
          lang: 'ar',
          dir: 'rtl',
          icons: [
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      }),

      // تحليل الحزم (في وضع التطوير فقط)
      mode === 'analyze' && visualizer({
        filename: './dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true
      })
    ].filter(Boolean),

    // إعدادات الخادم للتطوير
    server: {
      port: 3000,
      host: true, // السماح بالوصول من الأجهزة الأخرى على الشبكة
      open: true, // فتح المتصفح تلقائياً
      cors: true,
      hmr: {
        overlay: true // عرض الأخطاء في المتصفح
      },
      proxy: {
        // proxy للطلبات API إذا لزم الأمر
        '/api': {
          target: env.VITE_SUPABASE_URL,
          changeOrigin: true,
          secure: false
        }
      }
    },

    // إعدادات البناء
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production', // عدم إنشاء sourcemaps في الإنتاج
      minify: 'esbuild',
      target: 'esnext',
      
      // تحسين تقسيم الحزم
      rollupOptions: {
        output: {
          manualChunks: {
            // فصل المكتبات الكبيرة إلى chunks منفصلة
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': ['@headlessui/react', '@heroicons/react'],
            'vendor-utils': ['date-fns', 'lodash', 'axios'],
            'vendor-charts': ['recharts', 'chart.js']
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: ({ name }) => {
            if (/\.(gif|jpe?g|png|svg)$/.test(name ?? '')) {
              return 'assets/images/[name]-[hash][extname]'
            }
            if (/\.css$/.test(name ?? '')) {
              return 'assets/css/[name]-[hash][extname]'
            }
            return 'assets/[name]-[hash][extname]'
          }
        }
      },
      
      // تحسينات الأداء
      chunkSizeWarningLimit: 1000,
      reportCompressedSize: false
    },

    // إعدادات المسارات
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@contexts': path.resolve(__dirname, './src/contexts'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@lib': path.resolve(__dirname, './src/lib'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@features': path.resolve(__dirname, './src/features'),
        '@shared': path.resolve(__dirname, './src/shared'),
        '@services': path.resolve(__dirname, './src/services')
      }
    },

    // إعدادات CSS
    css: {
      modules: {
        localsConvention: 'camelCase'
      },
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@assets/styles/variables.scss";`
        }
      }
    },

    // إعدادات التحسين
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@supabase/supabase-js'
      ],
      exclude: ['@vite/client', '@vite/env']
    },

    // إعدادات خاصة بالوضع
    define: {
      __APP_ENV__: JSON.stringify(env.VITE_APP_ENV),
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION),
      __BUILD_DATE__: JSON.stringify(new Date().toISOString())
    }
  }
})