/**
 * Billing Page
 * Manage billing information, payment methods, and invoice history
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Download,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  Star,
  FileText,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useNotification } from '@/contexts/NotificationContext';
import subscriptionService from '@/services/subscriptionService';
import { format } from 'date-fns';

const Billing = () => {
  const { user } = useAuth();
  const {
    subscription,
    plan,
    cancelSubscription,
    reactivateSubscription,
    isCancelled,
    getDaysUntilEnd
  } = useSubscription();
  const { showNotification } = useNotification();

  const [invoices, setInvoices] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  /**
   * Load billing data
   */
  useEffect(() => {
    const loadBillingData = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);

        // Load invoices
        const invoiceData = await subscriptionService.invoices.getAll(user.id);
        setInvoices(invoiceData);

        // Load payment methods
        const paymentMethodsData = await subscriptionService.paymentMethods.getAll(user.id);
        setPaymentMethods(paymentMethodsData);
      } catch (error) {
        showNotification({
          type: 'error',
          title: 'Failed to Load Billing Data',
          message: error.message
        });
      } finally {
        setLoading(false);
      }
    };

    loadBillingData();
  }, [user]);

  /**
   * Handle cancel subscription
   */
  const handleCancelSubscription = async () => {
    try {
      setIsCancelling(true);
      await cancelSubscription(true);

      showNotification({
        type: 'success',
        title: 'Subscription Cancelled',
        message: `Your subscription will remain active until ${format(new Date(subscription.current_period_end), 'MMM dd, yyyy')}.`
      });

      setShowCancelDialog(false);
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Cancellation Failed',
        message: error.message
      });
    } finally {
      setIsCancelling(false);
    }
  };

  /**
   * Handle reactivate subscription
   */
  const handleReactivateSubscription = async () => {
    try {
      await reactivateSubscription();

      showNotification({
        type: 'success',
        title: 'Subscription Reactivated',
        message: 'Your subscription has been reactivated successfully.'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Reactivation Failed',
        message: error.message
      });
    }
  };

  /**
   * Get invoice status badge
   */
  const getInvoiceStatusBadge = (status) => {
    const badges = {
      paid: {
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        icon: CheckCircle,
        text: 'Paid'
      },
      pending: {
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        icon: Clock,
        text: 'Pending'
      },
      failed: {
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        icon: XCircle,
        text: 'Failed'
      },
      refunded: {
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
        icon: AlertCircle,
        text: 'Refunded'
      }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  /**
   * Render subscription overview
   */
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Current Subscription */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Current Subscription
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Plan</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {plan?.displayName || 'Free'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Amount</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${subscription?.amount || 0}
              <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                /{subscription?.billing_cycle || 'month'}
              </span>
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
              {subscription?.status || 'Active'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Next Billing Date</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {subscription?.current_period_end
                ? format(new Date(subscription.current_period_end), 'MMM dd, yyyy')
                : 'N/A'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => window.location.href = '/subscriptions'}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Change Plan
          </button>

          {subscription && !isCancelled() && (
            <button
              onClick={() => setShowCancelDialog(true)}
              className="px-4 py-2 rounded-lg border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
            >
              Cancel Subscription
            </button>
          )}

          {isCancelled() && (
            <button
              onClick={handleReactivateSubscription}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              Reactivate Subscription
            </button>
          )}
        </div>

        {/* Cancellation Notice */}
        {isCancelled() && (
          <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                  Subscription Cancelled
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  Your subscription will remain active until {format(new Date(subscription.current_period_end), 'MMMM dd, yyyy')} ({getDaysUntilEnd()} days remaining).
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Methods */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Payment Methods
          </h2>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            Add Payment Method
          </button>
        </div>

        {paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No payment methods added yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <CreditCard className="w-8 h-8 text-gray-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {method.brand} •••• {method.last4}
                      </p>
                      {method.is_default && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium">
                          <Star className="w-3 h-3" />
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Expires {method.exp_month}/{method.exp_year}
                    </p>
                  </div>
                </div>
                <button className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  /**
   * Render invoice history
   */
  const renderInvoices = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Invoice History
      </h2>

      {invoices.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">No invoices yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                  Invoice
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                  Amount
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                  Status
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-4 px-4">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {invoice.invoice_number}
                    </p>
                  </td>
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                    {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      ${invoice.total.toFixed(2)}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    {getInvoiceStatusBadge(invoice.status)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      onClick={() => {
                        // Download invoice
                        showNotification({
                          type: 'info',
                          title: 'Download Started',
                          message: 'Your invoice is being downloaded...'
                        });
                      }}
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Billing & Invoices
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your subscription, payment methods, and billing history
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === 'invoices'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Invoices
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'invoices' && renderInvoices()}

        {/* Cancel Confirmation Dialog */}
        {showCancelDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Cancel Subscription?
                </h2>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your subscription will remain active until the end of your current billing period ({format(new Date(subscription.current_period_end), 'MMMM dd, yyyy')}). After that, you'll be downgraded to the Free plan.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelDialog(false)}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Billing;
