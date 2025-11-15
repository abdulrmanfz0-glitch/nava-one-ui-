/**
 * Subscriptions Page
 * Main subscription management page with plan selection and comparison
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Zap
} from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useNotification } from '@/contexts/NotificationContext';
import { SUBSCRIPTION_PLANS, BILLING_CYCLES } from '@/utils/subscriptionPlans';
import PricingCard from '@/components/UI/PricingCard';
import paymentService from '@/services/paymentIntegration';
import { useAuth } from '@/contexts/AuthContext';

const Subscriptions = () => {
  const { user } = useAuth();
  const {
    subscription,
    plan,
    usage,
    loading,
    isActive,
    isTrial,
    isCancelled,
    isPastDue,
    getTrialDaysRemaining,
    getDaysUntilEnd,
    getPlanName,
    refresh
  } = useSubscription();
  const { showNotification } = useNotification();

  const [billingCycle, setBillingCycle] = useState('monthly');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  // Get all plans as array
  const plans = Object.values(SUBSCRIPTION_PLANS);

  /**
   * Handle plan selection
   */
  const handleSelectPlan = async (planObj) => {
    if (planObj.contactSales) {
      window.location.href = 'mailto:sales@navaops.com?subject=Enterprise Plan Inquiry';
      return;
    }

    setSelectedPlan(planObj);

    try {
      setIsProcessing(true);

      // Initialize payment service
      await paymentService.initialize('stripe', {
        stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_demo'
      });

      // Start checkout
      await paymentService.checkout({
        planId: planObj.id,
        billingCycle,
        userId: user.id,
        email: user.email
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Checkout Failed',
        message: error.message || 'Failed to start checkout process. Please try again.'
      });
      setIsProcessing(false);
    }
  };

  /**
   * Get status badge
   */
  const getStatusBadge = () => {
    if (!subscription) return null;

    const badges = {
      active: {
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        icon: CheckCircle2,
        text: 'Active'
      },
      trial: {
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        icon: Clock,
        text: `Trial (${getTrialDaysRemaining()} days left)`
      },
      cancelled: {
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        icon: AlertCircle,
        text: `Cancelled (ends in ${getDaysUntilEnd()} days)`
      },
      past_due: {
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        icon: AlertCircle,
        text: 'Payment Failed'
      }
    };

    const status = isPastDue() ? 'past_due' : isCancelled() ? 'cancelled' : isTrial() ? 'trial' : 'active';
    const badge = badges[status];
    const Icon = badge.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${badge.color}`}>
        <Icon className="w-4 h-4" />
        <span className="font-medium text-sm">{badge.text}</span>
      </div>
    );
  };

  /**
   * Render usage summary
   */
  const renderUsageSummary = () => {
    if (!usage || Object.keys(usage).length === 0) return null;

    const usageItems = [
      { key: 'branches', label: 'Branches', icon: '🏢' },
      { key: 'team_members', label: 'Team Members', icon: '👥' },
      { key: 'data_points', label: 'Orders', icon: '📊' },
      { key: 'reports', label: 'Reports', icon: '📄' }
    ];

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Current Usage
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {usageItems.map(({ key, label, icon }) => {
            const usageData = usage[key];
            if (!usageData) return null;

            const percentage = usageData.limit === -1 ? 0 : (usageData.usage / usageData.limit) * 100;
            const isUnlimited = usageData.limit === -1;

            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {icon} {label}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {isUnlimited ? 'Unlimited' : `${usageData.usage} / ${usageData.limit}`}
                  </span>
                </div>
                {!isUnlimited && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        percentage >= 90 ? 'bg-red-500' :
                        percentage >= 70 ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Choose Your Plan
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Unlock powerful features and scale your business with the right plan
            </p>
          </motion.div>
        </div>

        {/* Current Subscription Status */}
        {subscription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Current Plan: {getPlanName()}
                </h2>
                <div className="flex items-center gap-3">
                  {getStatusBadge()}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => window.location.href = '/billing'}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Billing</span>
                </button>
                {(isActive() || isTrial()) && !isCancelled() && (
                  <button
                    onClick={() => setShowComparison(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    <TrendingUp className="w-4 h-4" />
                    <span>Upgrade</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Usage Summary */}
        {renderUsageSummary()}

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-12 mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2 inline-flex gap-2">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>Yearly</span>
              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {plans.map((planObj) => (
            <PricingCard
              key={planObj.id}
              plan={planObj}
              billingCycle={billingCycle}
              currentPlanId={subscription?.plan_id}
              onSelectPlan={handleSelectPlan}
              isLoading={isProcessing && selectedPlan?.id === planObj.id}
            />
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <div className="flex-shrink-0">
              <Shield className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Secure Payments
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Bank-level encryption
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <div className="flex-shrink-0">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Cancel Anytime
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No long-term contracts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <div className="flex-shrink-0">
              <Zap className="w-10 h-10 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                Instant Activation
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Start using immediately
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'Can I change plans later?',
                a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades and at the end of your billing period for downgrades.'
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards (Visa, Mastercard, American Express) and support payments through Stripe and Paddle.'
              },
              {
                q: 'Do you offer refunds?',
                a: 'We offer a 14-day money-back guarantee for all paid plans. If you\'re not satisfied, contact us for a full refund.'
              },
              {
                q: 'What happens when I reach my usage limits?',
                a: 'You\'ll receive notifications when approaching your limits. You can either upgrade your plan or wait for the next billing cycle to reset your usage.'
              }
            ].map((faq, index) => (
              <details
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 group"
              >
                <summary className="font-semibold text-gray-900 dark:text-white cursor-pointer list-none flex items-center justify-between">
                  <span>{faq.q}</span>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform" />
                </summary>
                <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;
