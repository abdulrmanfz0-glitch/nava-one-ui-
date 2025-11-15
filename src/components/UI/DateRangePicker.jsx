// NAVA OPS - Date Range Picker Component
// Professional date range picker for filtering data

import React, { useState } from 'react';
import { Calendar, X } from 'lucide-react';

export default function DateRangePicker({
  startDate,
  endDate,
  onDateChange,
  presets = true
}) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const handlePreset = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);

    onDateChange({
      startDate: formatDate(start),
      endDate: formatDate(end)
    });
    setIsOpen(false);
  };

  const presetOptions = [
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 60 Days', days: 60 },
    { label: 'Last 90 Days', days: 90 },
    { label: 'Last 6 Months', days: 180 },
    { label: 'Last Year', days: 365 }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800
                 border border-gray-300 dark:border-gray-600 rounded-lg
                 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200
                 text-gray-700 dark:text-gray-200"
      >
        <Calendar className="w-5 h-5" />
        <span className="text-sm font-medium">
          {startDate && endDate
            ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
            : 'Select Date Range'}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 z-50 bg-white dark:bg-gray-800
                        border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl
                        w-80 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Select Date Range
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Custom Date Inputs */}
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate || ''}
                  onChange={(e) => onDateChange({ startDate: e.target.value, endDate })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate || ''}
                  onChange={(e) => onDateChange({ startDate, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Presets */}
            {presets && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mb-3">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quick Select
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {presetOptions.map((preset) => (
                    <button
                      key={preset.days}
                      onClick={() => handlePreset(preset.days)}
                      className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700
                               hover:bg-gray-200 dark:hover:bg-gray-600
                               text-gray-700 dark:text-gray-200 rounded-md
                               transition-colors duration-200"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Clear Button */}
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  onDateChange({ startDate: null, endDate: null });
                  setIsOpen(false);
                }}
                className="w-full mt-3 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600
                         text-gray-700 dark:text-gray-200 rounded-md
                         hover:bg-gray-50 dark:hover:bg-gray-700
                         transition-colors duration-200"
              >
                Clear Selection
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
