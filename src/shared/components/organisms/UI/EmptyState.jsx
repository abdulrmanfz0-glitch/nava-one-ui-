// NAVA OPS - Empty State Component
// Professional empty state for when no data is available

import React from 'react';
import { Package } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Package,
  title = 'No Data',
  message = 'There is no data to display at the moment.',
  action,
  actionLabel
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
        {message}
      </p>

      {action && actionLabel && (
        <button
          onClick={action}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                   transition-colors duration-200 font-medium"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
