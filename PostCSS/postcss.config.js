// postcss.config.js
export default {
  plugins: {
    'tailwindcss/nesting': {}, // يسمح بكتابة CSS متداخل
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {}), // ضغط CSS تلقائي عند البناء
  },
};
