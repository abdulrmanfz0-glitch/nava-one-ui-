/**
 * useFeatureAccess Hook
 * Checks feature access and enforces limits based on subscription plan
 */

import { useCallback, useEffect, useState } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useNotification } from '@/contexts/NotificationContext';
import { FEATURE_FLAGS } from '@/utils/subscriptionPlans';

/**
 * Hook to check if a feature is accessible
 */
export const useFeatureAccess = (featureFlag) => {
  const { hasFeature, plan, loading } = useSubscription();
  const [isAccessible, setIsAccessible] = useState(false);

  useEffect(() => {
    if (!loading && plan) {
      setIsAccessible(hasFeature(featureFlag));
    }
  }, [featureFlag, hasFeature, plan, loading]);

  return {
    isAccessible,
    loading,
    plan
  };
};

/**
 * Hook to check and enforce usage limits
 */
export const useUsageLimit = (limitKey) => {
  const { getUsage, getLimit, trackUsage, plan } = useSubscription();
  const { showNotification } = useNotification();
  const [usageData, setUsageData] = useState(null);

  useEffect(() => {
    if (plan) {
      const data = getUsage(limitKey);
      setUsageData(data);
    }
  }, [limitKey, getUsage, plan]);

  const checkAndTrack = useCallback(async (incrementBy = 1) => {
    const limit = getLimit(limitKey);
    const current = usageData?.usage || 0;

    // Unlimited
    if (limit === -1) {
      await trackUsage(limitKey, incrementBy);
      return { allowed: true, unlimited: true };
    }

    // Check if would exceed limit
    if (current + incrementBy > limit) {
      showNotification({
        type: 'warning',
        title: 'Usage Limit Reached',
        message: `You've reached your ${limitKey} limit. Please upgrade your plan to continue.`,
        actionLabel: 'Upgrade Plan',
        actionUrl: '/subscriptions'
      });

      return { allowed: false, limit, usage: current, remaining: 0 };
    }

    // Track usage
    await trackUsage(limitKey, incrementBy);

    // Show warning if approaching limit (80%)
    const newUsage = current + incrementBy;
    const percentage = (newUsage / limit) * 100;

    if (percentage >= 80 && percentage < 100) {
      showNotification({
        type: 'info',
        title: 'Approaching Usage Limit',
        message: `You've used ${Math.round(percentage)}% of your ${limitKey} limit.`,
        actionLabel: 'View Usage',
        actionUrl: '/subscriptions'
      });
    }

    return {
      allowed: true,
      limit,
      usage: newUsage,
      remaining: limit - newUsage,
      percentage
    };
  }, [limitKey, getLimit, usageData, trackUsage, showNotification]);

  return {
    usage: usageData,
    checkAndTrack,
    isWithinLimit: usageData?.allowed || false,
    isUnlimited: usageData?.limit === -1
  };
};

/**
 * Hook to require a specific feature
 * Redirects to upgrade page if feature is not accessible
 */
export const useRequireFeature = (featureFlag, redirectPath = '/subscriptions') => {
  const { isAccessible, loading } = useFeatureAccess(featureFlag);
  const { showNotification } = useNotification();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!loading && !isAccessible) {
      showNotification({
        type: 'warning',
        title: 'Feature Not Available',
        message: 'This feature is not available in your current plan. Please upgrade to access it.',
        actionLabel: 'Upgrade Now',
        actionUrl: redirectPath
      });
      setShouldRedirect(true);
    }
  }, [loading, isAccessible, showNotification, redirectPath]);

  return {
    isAccessible,
    loading,
    shouldRedirect
  };
};

/**
 * Hook for feature-gated actions
 */
export const useFeatureGate = () => {
  const { hasFeature, canPerformAction, plan } = useSubscription();
  const { showNotification } = useNotification();

  const checkFeature = useCallback((featureFlag, options = {}) => {
    const {
      showNotificationOnFail = true,
      customMessage
    } = options;

    const hasAccess = hasFeature(featureFlag);

    if (!hasAccess && showNotificationOnFail) {
      showNotification({
        type: 'warning',
        title: 'Upgrade Required',
        message: customMessage || `This feature requires ${plan?.displayName || 'a higher'} plan or above.`,
        actionLabel: 'View Plans',
        actionUrl: '/subscriptions'
      });
    }

    return hasAccess;
  }, [hasFeature, showNotification, plan]);

  const checkAction = useCallback((action, options = {}) => {
    const {
      showNotificationOnFail = true,
      customMessage
    } = options;

    const canPerform = canPerformAction(action);

    if (!canPerform && showNotificationOnFail) {
      showNotification({
        type: 'warning',
        title: 'Limit Reached',
        message: customMessage || 'You have reached the limit for this action in your current plan.',
        actionLabel: 'Upgrade Plan',
        actionUrl: '/subscriptions'
      });
    }

    return canPerform;
  }, [canPerformAction, showNotification]);

  return {
    checkFeature,
    checkAction
  };
};

/**
 * Hook for subscription status checks
 */
export const useSubscriptionStatus = () => {
  const {
    subscription,
    isActive,
    isTrial,
    isCancelled,
    isPastDue,
    getTrialDaysRemaining,
    getDaysUntilEnd
  } = useSubscription();
  const { showNotification } = useNotification();

  // Show trial ending notification
  useEffect(() => {
    if (isTrial()) {
      const daysRemaining = getTrialDaysRemaining();

      if (daysRemaining <= 3 && daysRemaining > 0) {
        showNotification({
          type: 'info',
          title: 'Trial Ending Soon',
          message: `Your trial ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Upgrade to continue using premium features.`,
          actionLabel: 'Upgrade Now',
          actionUrl: '/subscriptions',
          persist: true
        });
      }
    }
  }, [isTrial, getTrialDaysRemaining, showNotification]);

  // Show past due notification
  useEffect(() => {
    if (isPastDue()) {
      showNotification({
        type: 'error',
        title: 'Payment Failed',
        message: 'Your last payment failed. Please update your payment method to avoid service interruption.',
        actionLabel: 'Update Payment',
        actionUrl: '/billing',
        persist: true
      });
    }
  }, [isPastDue, showNotification]);

  return {
    subscription,
    isActive: isActive(),
    isTrial: isTrial(),
    isCancelled: isCancelled(),
    isPastDue: isPastDue(),
    trialDaysRemaining: getTrialDaysRemaining(),
    daysUntilEnd: getDaysUntilEnd()
  };
};

export default useFeatureAccess;
