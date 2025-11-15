// NAVA OPS - Reports & Analytics
// Comprehensive reporting system with export capabilities

import React, { useState, useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import api from '@/services/api';
import PageHeader from '@/components/UI/PageHeader';
import StatCard from '@/components/UI/StatCard';
import DataTable from '@/components/UI/DataTable';
import DateRangePicker from '@/components/UI/DateRangePicker';
import { FileText, Download, Calendar, TrendingUp, BarChart3, PieChart } from 'lucide-react';

export default function ReportsAnalytics() {
  const { addNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [selectedType, setSelectedType] = useState('all');

  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  });

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await api.reports.getAll({ type: selectedType !== 'all' ? selectedType : undefined });
      setReports(data);
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to load reports',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedType]);

  const handleGenerateReport = async (type) => {
    try {
      addNotification({
        title: 'Info',
        message: 'Generating report...',
        type: 'info'
      });
      await api.reports.create({
        report_name: `${type} Report`,
        report_type: type,
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        status: 'pending'
      });
      addNotification({
        title: 'Success',
        message: 'Report generation started',
        type: 'success'
      });
      fetchReports();
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to generate report',
        type: 'error'
      });
    }
  };

  const columns = [
    {
      header: 'Report Name',
      key: 'report_name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{row.report_name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{row.report_type}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Date Range',
      key: 'start_date',
      render: (row) => (
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {row.start_date && row.end_date
            ? `${new Date(row.start_date).toLocaleDateString()} - ${new Date(row.end_date).toLocaleDateString()}`
            : 'N/A'}
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      sortable: true,
      render: (row) => {
        const statusColors = {
          completed: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
          pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
          generating: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
          failed: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
        };
        return (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[row.status]}`}>
            {row.status}
          </span>
        );
      }
    },
    {
      header: 'Created',
      key: 'created_at',
      sortable: true,
      render: (row) => new Date(row.created_at).toLocaleDateString()
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Generate comprehensive reports and analyze your business data"
        icon={BarChart3}
        actions={
          <DateRangePicker
            startDate={dateRange.startDate}
            endDate={dateRange.endDate}
            onDateChange={({ startDate, endDate }) => setDateRange({ startDate, endDate })}
          />
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Reports" value={reports.length} icon={FileText} color="blue" />
        <StatCard title="Completed" value={reports.filter(r => r.status === 'completed').length} icon={TrendingUp} color="green" />
        <StatCard title="Pending" value={reports.filter(r => r.status === 'pending').length} icon={Calendar} color="orange" />
        <StatCard title="This Month" value={reports.filter(r => new Date(r.created_at) > new Date(new Date().setDate(1))).length} icon={BarChart3} color="purple" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Generate New Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { type: 'financial', label: 'Financial Report', icon: TrendingUp, color: 'green' },
            { type: 'sales', label: 'Sales Report', icon: BarChart3, color: 'blue' },
            { type: 'inventory', label: 'Inventory Report', icon: PieChart, color: 'purple' },
            { type: 'performance', label: 'Performance Report', icon: FileText, color: 'orange' }
          ].map((report) => (
            <button
              key={report.type}
              onClick={() => handleGenerateReport(report.type)}
              className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 dark:border-gray-700
                         hover:border-blue-500 rounded-xl transition-all duration-200 hover:scale-105"
            >
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <report.icon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              </div>
              <span className="font-medium text-gray-900 dark:text-white">{report.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reports History</h3>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">All Types</option>
              <option value="financial">Financial</option>
              <option value="sales">Sales</option>
              <option value="inventory">Inventory</option>
              <option value="performance">Performance</option>
            </select>
          </div>
        </div>
        <DataTable data={reports} columns={columns} loading={loading} searchable />
      </div>
    </div>
  );
}
