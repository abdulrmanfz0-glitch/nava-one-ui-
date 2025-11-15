/**
 * Subscription Context
 * Provides subscription data and methods throughout the application
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import subscriptionService from '@/services/subscriptionService';
import { getPlanById, hasFeature as checkFeature, getLimit as getPlanLimit } from '@/utils/subscriptionPlans';
import { logger } from '@/lib/logger';

const SubscriptionContext = createContext(null);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [plan, setPlan] = useState(null);
  const [usage, setUsage] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Load subscription data
   */
  const loadSubscription = useCallback(async () => {
    if (!user?.id) {
      setSubscription(null);
      setPlan(null);
      setUsage({});
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get current subscription
      const currentSub = await subscriptionService.subscriptions.getCurrent(user.id);

      if (currentSub) {
        setSubscription(currentSub);

        // Get plan details from local config for instant access
        const planDetails = getPlanById(currentSub.plan_id);
        setPlan(planDetails);

        // Load usage data
        const usageData = await subscriptionService.usage.getAllUsage(user.id);
        setUsage(usageData);
      } else {
        // No subscription - default to free plan
        const freePlan = getPlanById('free');
        setSubscription({
          plan_id: 'free',
          status: 'active',
          billing_cycle: 'monthly'
        });
        setPlan(freePlan);
        setUsage({});
      }
    } catch (err) {
      logger.error('Failed to load subscription', err);
      setError(err.message);

      // Fallback to free plan on error
      const freePlan = getPlanById('free');
      setSubscription({
        plan_id: 'free',
        status: 'active',
        billing_cycle: 'monthly'
      });
      setPlan(freePlan);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Refresh subscription data
   */
  const refresh = useCallback(async () => {
    await loadSubscription();
  }, [loadSubscription]);

  /**
   * Check if a feature is available
   */
  const hasFeature = useCallback((featureFlag) => {
    if (!plan) return false;
    return checkFeature(plan.id, featureFlag);
  }, [plan]);

  /**
   * Get limit for a feature
   */
  const getLimit = useCallback((limitKey) => {
    if (!plan) return 0;
    return getPlanLimit(plan.id, limitKey);
  }, [plan]);

  /**
   * Check if usage is within limits
   */
  const isWithinLimit = useCallback((limitKey) => {
    if (!plan) return false;

    const limit = getPlanLimit(plan.id, limitKey);
    if (limit === -1) return true; // Unlimited

    const usageData = usage[limitKey];
    if (!usageData) return true; // No usage recorded yet

    return usageData.allowed;
  }, [plan, usage]);

  /**
   * Get usage for a specific feature
   */
  const getUsage = useCallback((limitKey) => {
    return usage[limitKey] || {
      allowed: true,
      limit: 0,
      usage: 0,
      remaining: 0,
      percentage: 0
    };
  }, [usage]);

  /**
   * Track usage for a feature
   */
  const trackUsage = useCallback(async (featureKey, incrementBy = 1) => {
    if (!user?.id) return;

    try {
      await subscriptionService.usage.track(user.id, featureKey, incrementBy);
      // Refresh usage data
      const usageData = await subscriptionService.usage.getAllUsage(user.id);
      setUsage(usageData);
    } catch (err) {
      logger.error(`Failed to track usage for ${featureKey}`, err);
    }
  }, [user]);

  /**
   * Upgrade to a new plan
   */
  const upgradePlan = useCallback(async (newPlanId, billingCycle = 'monthly') => {
    if (!user?.id || !subscription) {
      throw new Error('No active subscription to upgrade');
    }

    try {
      const updated = await subscriptionService.subscriptions.changePlan(
        subscription.id,
        newPlanId,
        billingCycle
      );

      await refresh();
      return updated;
    } catch (err) {
      logger.error('Failed to upgrade plan', err);
      throw err;
    }
  }, [user, subscription, refresh]);

  /**
   * Cancel subscription
   */
  const cancelSubscription = useCallback(async (cancelAtPeriodEnd = true) => {
    if (!subscription?.id) {
      throw new Error('No active subscription to cancel');
    }

    try {
      const cancelled = await subscriptionService.subscriptions.cancel(
        subscription.id,
        cancelAtPeriodEnd
      );

      await refresh();
      return cancelled;
    } catch (err) {
      logger.error('Failed to cancel subscription', err);
      throw err;
    }
  }, [subscription, refresh]);

  /**
   * Reactivate subscription
   */
  const reactivateSubscription = useCallback(async () => {
    if (!subscription?.id) {
      throw new Error('No subscription to reactivate');
    }

    try {
      const reactivated = await subscriptionService.subscriptions.reactivate(subscription.id);
      await refresh();
      return reactivated;
    } catch (err) {
      logger.error('Failed to reactivate subscription', err);
      throw err;
    }
  }, [subscription, refresh]);

  /**
   * Check if subscription is active
   */
  const isActive = useCallback(() => {
    if (!subscription) return false;
    return ['active', 'trial'].includes(subscription.status);
  }, [subscription]);

  /**
   * Check if in trial period
   */
  const isTrial = useCallback(() => {
    return subscription?.status === 'trial';
  }, [subscription]);

  /**
   * Check if subscription is cancelled
   */
  const isCancelled = useCallback(() => {
    return subscription?.status === 'cancelled';
  }, [subscription]);

  /**
   * Check if subscription is past due
   */
  const isPastDue = useCallback(() => {
    return subscription?.status === 'past_due';
  }, [subscription]);

  /**
   * Get days remaining in trial
   */
  const getTrialDaysRemaining = useCallback(() => {
    if (!subscription?.trial_end_date) return 0;

    const now = new Date();
    const trialEnd = new Date(subscription.trial_end_date);
    const diffTime = trialEnd - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }, [subscription]);

  /**
   * Get days until subscription ends
   */
  const getDaysUntilEnd = useCallback(() => {
    if (!subscription?.current_period_end) return 0;

    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);
    const diffTime = periodEnd - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }, [subscription]);

  /**
   * Check if user can perform an action based on limits
   */
  const canPerformAction = useCallback((action) => {
    const actionLimitMap = {
      'create_branch': 'branches',
      'invite_member': 'team_members',
      'create_order': 'data_points',
      'generate_report': 'reports',
      'export_data': 'exports',
      'api_call': 'api_calls'
    };

    const limitKey = actionLimitMap[action];
    if (!limitKey) return true;

    return isWithinLimit(limitKey);
  }, [isWithinLimit]);

  /**
   * Get formatted plan name
   */
  const getPlanName = useCallback(() => {
    return plan?.displayName || 'Free';
  }, [plan]);

  /**
   * Check if user is on free plan
   */
  const isFreePlan = useCallback(() => {
    return subscription?.plan_id === 'free';
  }, [subscription]);

  /**
   * Check if upgrade is available
   */
  const canUpgrade = useCallback(() => {
    if (!subscription) return true;
    return subscription.plan_id !== 'enterprise';
  }, [subscription]);

  // Load subscription on mount and when user changes
  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  // Check subscription status periodically (every 5 minutes)
  useEffect(() => {
    if (!subscription?.id) return;

    const interval = setInterval(async () => {
      try {
        await subscriptionService.subscriptions.checkAndUpdateStatus(subscription.id);
        await refresh();
      } catch (err) {
        logger.error('Failed to check subscription status', err);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [subscription, refresh]);

  const value = {
    // State
    subscription,
    plan,
    usage,
    loading,
    error,

    // Actions
    refresh,
    upgradePlan,
    cancelSubscription,
    reactivateSubscription,
    trackUsage,

    // Checks
    hasFeature,
    getLimit,
    isWithinLimit,
    getUsage,
    canPerformAction,

    // Status checks
    isActive,
    isTrial,
    isCancelled,
    isPastDue,
    isFreePlan,
    canUpgrade,

    // Utilities
    getTrialDaysRemaining,
    getDaysUntilEnd,
    getPlanName
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionContext;
