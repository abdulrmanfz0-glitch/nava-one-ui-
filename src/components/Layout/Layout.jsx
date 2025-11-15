// src/components/Layout/Layout.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBrand } from '../../contexts/BrandContext';
import { Link, useLocation } from 'react-router-dom';
import BranchSwitcher from '../BranchSwitcher/BranchSwitcher';
import {
  LayoutDashboard,
  Store,
  FileText,
  Users,
  DollarSign,
  Settings,
  Bell,
  Crown,
  Menu,
  X,
  Building2
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, userProfile, logout, isAdmin } = useAuth();
  const { brand } = useBrand();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Brand Overview', href: '/brand-overview', icon: Building2 },
    { name: 'Executive HQ', href: '/executive-hq', icon: Crown, premium: true },
    { name: 'Branches', href: '/branches', icon: Store },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Financial', href: '/financial', icon: DollarSign },
    { name: 'Team', href: '/team', icon: Users },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Settings', href: '/settings', icon: Settings }
  ];

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 fixed w-full top-0 z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: Mobile Menu + Brand */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Brand Logo */}
              {brand?.brand_logo ? (
                <img
                  src={brand.brand_logo}
                  alt={brand.brand_name || 'Brand'}
                  className="h-10 w-10 rounded-lg object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              )}

              {/* Brand Name */}
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  {brand?.brand_name || 'NAVA Ops'}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Restaurant Management
                </p>
              </div>
            </div>

            {/* Center: Branch Switcher (on larger screens) */}
            <div className="hidden md:block">
              <BranchSwitcher />
            </div>

            {/* Right: User Info + Logout */}
            <div className="flex items-center gap-4">
              {/* Mobile Branch Switcher */}
              <div className="md:hidden">
                <BranchSwitcher />
              </div>

              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {userProfile?.full_name || user?.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {userProfile?.role || 'User'}
                </p>
              </div>

              <button
                onClick={logout}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 z-20 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <nav className="h-full overflow-y-auto py-4 px-3">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      active
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    } ${item.premium ? 'relative' : ''}`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1">{item.name}</span>
                    {item.premium && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full">
                        PRO
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="pt-16 lg:pl-64">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 lg:ml-64 mt-auto">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            © 2025 NAVA Ops. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
