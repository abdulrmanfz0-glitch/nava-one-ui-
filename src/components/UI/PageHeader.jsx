// NAVA OPS - Modern Page Header Component
// Clean page header with breadcrumbs and actions

import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  icon: Icon
}) {
  return (
    <div className="mb-8 animate-fade-in">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm mb-4">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-600" />
              )}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400
                           transition-colors duration-200 font-medium"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className={`
                  ${index === breadcrumbs.length - 1
                    ? 'text-gray-900 dark:text-white font-semibold'
                    : 'text-gray-600 dark:text-gray-400'}
                `}>
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          {Icon && (
            <div className="flex-shrink-0 p-3 rounded-2xl bg-primary-50 dark:bg-primary-950/30
                          text-primary-600 dark:text-primary-400 transition-all duration-300 hover:scale-105">
              <Icon className="w-7 h-7" strokeWidth={2} />
            </div>
          )}

          {/* Title & Subtitle */}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-base text-gray-600 dark:text-gray-400 max-w-3xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Bottom border */}
      <div className="mt-6 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-800 to-transparent" />
    </div>
  );
}
