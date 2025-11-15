// NAVA OPS - Branches Management
// Professional multi-branch management with comparison and analytics

import React, { useState, useEffect } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import api from '@/services/api';
import PageHeader from '@/components/UI/PageHeader';
import DataTable from '@/components/UI/DataTable';
import StatCard from '@/components/UI/StatCard';
import Modal, { ConfirmDialog } from '@/components/UI/Modal';
import EmptyState from '@/components/UI/EmptyState';
import { BranchComparisonChart, MultiLineChart } from '@/components/UI/Charts';
import {
  Store,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Mail,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Calendar,
  BarChart3,
  Eye
} from 'lucide-react';

export default function BranchesManagement() {
  const { addNotification } = useNotification();

  // State
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'retail',
    city: '',
    region: '',
    address: '',
    phone: '',
    email: '',
    manager_name: '',
    status: 'active'
  });

  // Fetch branches
  const fetchBranches = async () => {
    try {
      setLoading(true);
      const data = await api.branches.getAll();
      setBranches(data);
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to load branches',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (selectedBranch) {
        await api.branches.update(selectedBranch.id, formData);
        addNotification({
          title: 'Success',
          message: 'Branch updated successfully',
          type: 'success'
        });
      } else {
        await api.branches.create(formData);
        addNotification({
          title: 'Success',
          message: 'Branch created successfully',
          type: 'success'
        });
      }

      setShowModal(false);
      resetForm();
      fetchBranches();
    } catch (error) {
      addNotification({
        title: 'Error',
        message: `Failed to ${selectedBranch ? 'update' : 'create'} branch`,
        type: 'error'
      });
    }
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await api.branches.delete(selectedBranch.id);
      addNotification({
        title: 'Success',
        message: 'Branch deleted successfully',
        type: 'success'
      });
      setShowDeleteDialog(false);
      setSelectedBranch(null);
      fetchBranches();
    } catch (error) {
      addNotification({
        title: 'Error',
        message: 'Failed to delete branch',
        type: 'error'
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      type: 'retail',
      city: '',
      region: '',
      address: '',
      phone: '',
      email: '',
      manager_name: '',
      status: 'active'
    });
    setSelectedBranch(null);
  };

  // Open edit modal
  const handleEdit = (branch) => {
    setSelectedBranch(branch);
    setFormData({
      name: branch.name || '',
      code: branch.code || '',
      type: branch.type || 'retail',
      city: branch.city || '',
      region: branch.region || '',
      address: branch.address || '',
      phone: branch.phone || '',
      email: branch.email || '',
      manager_name: branch.manager_name || '',
      status: branch.status || 'active'
    });
    setShowModal(true);
  };

  // Open delete dialog
  const handleDeleteClick = (branch) => {
    setSelectedBranch(branch);
    setShowDeleteDialog(true);
  };

  // Table columns
  const columns = [
    {
      header: 'Branch Name',
      key: 'name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold">
            {row.name.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{row.name}</div>
            {row.code && <div className="text-sm text-gray-500 dark:text-gray-400">{row.code}</div>}
          </div>
        </div>
      )
    },
    {
      header: 'Type',
      key: 'type',
      sortable: true,
      render: (row) => (
        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm capitalize">
          {row.type}
        </span>
      )
    },
    {
      header: 'Location',
      key: 'city',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <MapPin className="w-4 h-4" />
          <span>{row.city || 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Contact',
      key: 'phone',
      render: (row) => (
        <div className="text-sm">
          {row.phone && (
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Phone className="w-4 h-4" />
              <span>{row.phone}</span>
            </div>
          )}
          {row.email && (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <Mail className="w-4 h-4" />
              <span>{row.email}</span>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      sortable: true,
      render: (row) => {
        const statusColors = {
          active: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
          inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400',
          maintenance: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
          closed: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
        };
        return (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[row.status] || statusColors.inactive}`}>
            {row.status}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(row)}
            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  // Calculate stats
  const stats = {
    total: branches.length,
    active: branches.filter(b => b.status === 'active').length,
    totalRevenue: branches.reduce((sum, b) => sum + (b.total_revenue || 0), 0),
    totalOrders: branches.reduce((sum, b) => sum + (b.total_orders || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Branches Management"
        subtitle="Manage your business locations and compare performance across branches"
        icon={Store}
        actions={
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700
                     text-white rounded-lg transition-colors duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>Add Branch</span>
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Branches"
          value={stats.total}
          subtitle="All locations"
          icon={Store}
          color="blue"
        />
        <StatCard
          title="Active Branches"
          value={stats.active}
          subtitle="Currently operating"
          icon={Activity}
          color="green"
        />
        <StatCard
          title="Total Revenue"
          value={`SAR ${stats.totalRevenue.toLocaleString()}`}
          subtitle="All branches"
          icon={DollarSign}
          color="purple"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString()}
          subtitle="All branches"
          icon={ShoppingCart}
          color="orange"
        />
      </div>

      {/* Branches Table */}
      {branches.length === 0 && !loading ? (
        <EmptyState
          icon={Store}
          title="No Branches Yet"
          message="Start by adding your first business location to track performance and analytics."
          action={() => setShowModal(true)}
          actionLabel="Add First Branch"
        />
      ) : (
        <DataTable
          data={branches}
          columns={columns}
          loading={loading}
          searchable
          exportable
          onExport={() => showNotification('Export feature coming soon!', 'info')}
          onRowClick={(row) => handleEdit(row)}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={selectedBranch ? 'Edit Branch' : 'Add New Branch'}
        size="lg"
        footer={
          <>
            <button
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700
                       transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                       transition-colors duration-200"
            >
              {selectedBranch ? 'Update Branch' : 'Create Branch'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Branch Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Branch Code
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="BR001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="retail">Retail</option>
                <option value="restaurant">Restaurant</option>
                <option value="cafe">Cafe</option>
                <option value="warehouse">Warehouse</option>
                <option value="office">Office</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Region
              </label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Manager Name
              </label>
              <input
                type="text"
                value={formData.manager_name}
                onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedBranch(null);
        }}
        onConfirm={handleDelete}
        title="Delete Branch"
        message={`Are you sure you want to delete "${selectedBranch?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
