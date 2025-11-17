// NAVA OPS - Staff Command Center
// Central hub for staff management and operations

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import PageHeader from '@/components/UI/PageHeader';
import StaffPerformanceHub from './StaffPerformanceHub';
import {
  Users,
  UserPlus,
  UserCheck,
  UserMinus,
  Settings,
  Calendar,
  Clock,
  TrendingUp,
  Award,
  Target,
  BarChart3,
  FileText,
  Bell,
  Shield
} from 'lucide-react';

export default function StaffCommandCenter() {
  const { userProfile } = useAuth();
  const { addNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('performance');

  // Tab configuration
  const tabs = [
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'management', label: 'Management', icon: Users },
    { id: 'scheduling', label: 'Scheduling', icon: Calendar },
    { id: 'reports', label: 'Reports', icon: FileText }
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  Staff Command Center
                </h1>
                <p className="text-white/90 text-sm mt-1">
                  Comprehensive staff management and operations control
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-semibold transition-all duration-200
                ${activeTab === tab.id
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <StaffPerformanceHub />
      )}

      {/* Management Tab */}
      {activeTab === 'management' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-indigo-500" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Staff Management
                </h3>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                <UserPlus className="w-5 h-5" />
                Add Employee
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3 mb-3">
                  <UserCheck className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Active Staff</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Currently working</p>
              </div>

              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Total Employees</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">All branches</p>
              </div>

              <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-3 mb-3">
                  <Award className="w-8 h-8 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Top Performers</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">90%+ performance</p>
              </div>
            </div>

            <div className="mt-6 text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Staff management features coming soon</p>
            </div>
          </div>
        </div>
      )}

      {/* Scheduling Tab */}
      {activeTab === 'scheduling' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-indigo-500" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Staff Scheduling
                </h3>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                <Calendar className="w-5 h-5" />
                Create Schedule
              </button>
            </div>

            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Scheduling features coming soon</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Manage shifts, time-off requests, and work schedules
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-indigo-500" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Staff Reports
                </h3>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                <FileText className="w-5 h-5" />
                Generate Report
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: 'Performance Report', icon: TrendingUp, color: 'green' },
                { title: 'Attendance Report', icon: Clock, color: 'blue' },
                { title: 'Payroll Report', icon: Target, color: 'purple' }
              ].map((report, index) => (
                <div
                  key={index}
                  className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-750 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 bg-${report.color}-100 dark:bg-${report.color}-900/30 rounded-lg`}>
                      <report.icon className={`w-5 h-5 text-${report.color}-600 dark:text-${report.color}-400`} />
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{report.title}</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    Generate detailed {report.title.toLowerCase()} for analysis
                  </p>
                  <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 text-sm font-semibold">
                    Generate →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
