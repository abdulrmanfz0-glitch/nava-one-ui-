/**
 * Subscription Service
 * Handles all subscription-related operations including plan management,
 * billing, usage tracking, and feature access control
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { APIError } from './api';
import {
  SUBSCRIPTION_PLANS,
  PLAN_IDS,
  PLAN_STATUS,
  GRACE_PERIOD_DAYS,
  getPlanById,
  hasFeature,
  getLimit,
  isUnlimited,
  isWithinLimit,
  comparePlans
} from '@/utils/subscriptionPlans';

/**
 * Generic API request wrapper
 */
async function apiRequest(fn, errorMessage = 'API request failed') {
  try {
    const { data, error } = await fn();

    if (error) {
      logger.error(errorMessage, error);
      throw new APIError(error.message || errorMessage, error.code || 'API_ERROR', error);
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    logger.error(errorMessage, error);
    throw new APIError(error.message || errorMessage, 'UNKNOWN_ERROR', { originalError: error });
  }
}

// ============================================================================
// SUBSCRIPTION PLANS API
// ============================================================================

export const subscriptionPlansAPI = {
  /**
   * Get all available subscription plans
   */
  async getAll() {
    return apiRequest(
      () => supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true }),
      'Failed to fetch subscription plans'
    );
  },

  /**
   * Get a specific plan by ID
   */
  async getById(planId) {
    return apiRequest(
      () => supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single(),
      `Failed to fetch plan ${planId}`
    );
  },

  /**
   * Get plan from local config (faster, no DB call)
   */
  getLocalPlan(planId) {
    return getPlanById(planId);
  }
};

// ============================================================================
// USER SUBSCRIPTIONS API
// ============================================================================

export const userSubscriptionsAPI = {
  /**
   * Get current user's active subscription
   */
  async getCurrent(userId) {
    const subscriptions = await apiRequest(
      () => supabase
        .from('user_subscriptions')
        .select('*, plan:plan_id(*)')
        .eq('user_id', userId)
        .in('status', ['active', 'trial', 'past_due'])
        .order('created_at', { ascending: false })
        .limit(1),
      'Failed to fetch current subscription'
    );

    return subscriptions?.[0] || null;
  },

  /**
   * Get subscription with full details
   */
  async getById(subscriptionId) {
    return apiRequest(
      () => supabase
        .from('user_subscriptions')
        .select('*, plan:plan_id(*)')
        .eq('id', subscriptionId)
        .single(),
      `Failed to fetch subscription ${subscriptionId}`
    );
  },

  /**
   * Create a new subscription
   */
  async create(subscriptionData) {
    const {
      userId,
      planId,
      billingCycle = 'monthly',
      paymentProcessor,
      externalSubscriptionId,
      externalCustomerId,
      startTrial = false
    } = subscriptionData;

    const plan = await subscriptionPlansAPI.getById(planId);
    const now = new Date();
    const periodEnd = new Date(now);

    if (startTrial) {
      periodEnd.setDate(periodEnd.getDate() + plan.trial_days);
    } else {
      if (billingCycle === 'yearly') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + 1);
      }
    }

    const amount = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;

    const subscription = {
      user_id: userId,
      plan_id: planId,
      status: startTrial ? 'trial' : 'active',
      billing_cycle: billingCycle,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      trial_start_date: startTrial ? now.toISOString() : null,
      trial_end_date: startTrial ? periodEnd.toISOString() : null,
      payment_processor: paymentProcessor,
      external_subscription_id: externalSubscriptionId,
      external_customer_id: externalCustomerId,
      amount,
      currency: plan.currency,
      seats_total: 1,
      seats_used: 1,
      auto_renew: true,
      cancel_at_period_end: false
    };

    const created = await apiRequest(
      () => supabase
        .from('user_subscriptions')
        .insert([subscription])
        .select()
        .single(),
      'Failed to create subscription'
    );

    // Log subscription event
    await subscriptionEventsAPI.log(userId, created.id, 'created', {
      plan_id: planId,
      billing_cycle: billingCycle,
      is_trial: startTrial
    });

    return created;
  },

  /**
   * Update subscription
   */
  async update(subscriptionId, updates) {
    return apiRequest(
      () => supabase
        .from('user_subscriptions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', subscriptionId)
        .select()
        .single(),
      `Failed to update subscription ${subscriptionId}`
    );
  },

  /**
   * Cancel subscription
   */
  async cancel(subscriptionId, cancelAtPeriodEnd = true) {
    const subscription = await this.getById(subscriptionId);

    const updates = {
      cancel_at_period_end: cancelAtPeriodEnd,
      cancelled_at: new Date().toISOString()
    };

    if (!cancelAtPeriodEnd) {
      updates.status = 'cancelled';
    }

    const updated = await this.update(subscriptionId, updates);

    // Log event
    await subscriptionEventsAPI.log(subscription.user_id, subscriptionId, 'cancelled', {
      cancel_at_period_end: cancelAtPeriodEnd,
      cancelled_at: updates.cancelled_at
    });

    return updated;
  },

  /**
   * Reactivate cancelled subscription
   */
  async reactivate(subscriptionId) {
    const subscription = await this.getById(subscriptionId);

    const updates = {
      status: 'active',
      cancel_at_period_end: false,
      cancelled_at: null
    };

    const updated = await this.update(subscriptionId, updates);

    // Log event
    await subscriptionEventsAPI.log(subscription.user_id, subscriptionId, 'reactivated', {
      reactivated_at: new Date().toISOString()
    });

    return updated;
  },

  /**
   * Upgrade or downgrade subscription
   */
  async changePlan(subscriptionId, newPlanId, billingCycle = null) {
    const subscription = await this.getById(subscriptionId);
    const oldPlan = subscription.plan;
    const newPlan = await subscriptionPlansAPI.getById(newPlanId);

    const changeType = comparePlans(oldPlan.id, newPlanId);
    const finalBillingCycle = billingCycle || subscription.billing_cycle;
    const amount = finalBillingCycle === 'yearly' ? newPlan.price_yearly : newPlan.price_monthly;

    const updates = {
      plan_id: newPlanId,
      billing_cycle: finalBillingCycle,
      amount,
      currency: newPlan.currency
    };

    // For upgrades, apply immediately
    // For downgrades, apply at period end
    if (changeType === 'downgrade') {
      updates.metadata = {
        ...subscription.metadata,
        pending_plan_change: {
          new_plan_id: newPlanId,
          billing_cycle: finalBillingCycle,
          scheduled_for: subscription.current_period_end
        }
      };
    }

    const updated = await this.update(subscriptionId, updates);

    // Log event
    await subscriptionEventsAPI.log(subscription.user_id, subscriptionId,
      changeType === 'upgrade' ? 'upgraded' : 'downgraded', {
      old_plan_id: oldPlan.id,
      new_plan_id: newPlanId,
      billing_cycle: finalBillingCycle,
      change_type: changeType
    });

    return updated;
  },

  /**
   * Update seat count
   */
  async updateSeats(subscriptionId, seatsTotal) {
    const subscription = await this.getById(subscriptionId);

    if (seatsTotal < subscription.seats_used) {
      throw new APIError(
        `Cannot reduce seats below current usage (${subscription.seats_used})`,
        'SEATS_IN_USE'
      );
    }

    return this.update(subscriptionId, { seats_total: seatsTotal });
  },

  /**
   * Check subscription status and handle grace period/expiration
   */
  async checkAndUpdateStatus(subscriptionId) {
    const subscription = await this.getById(subscriptionId);
    const now = new Date();
    const periodEnd = new Date(subscription.current_period_end);

    // Check if period has ended
    if (now > periodEnd) {
      // If auto-renew is enabled and payment is successful, renew
      if (subscription.auto_renew && !subscription.cancel_at_period_end) {
        // In production, this would trigger payment processing
        // For now, we'll set to past_due to require manual intervention
        return this.update(subscriptionId, {
          status: 'past_due',
          grace_period_end: new Date(now.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000).toISOString()
        });
      } else {
        // Cancel or expire subscription
        return this.update(subscriptionId, {
          status: subscription.cancel_at_period_end ? 'cancelled' : 'expired'
        });
      }
    }

    // Check grace period expiration
    if (subscription.status === 'past_due' && subscription.grace_period_end) {
      const gracePeriodEnd = new Date(subscription.grace_period_end);
      if (now > gracePeriodEnd) {
        return this.update(subscriptionId, { status: 'suspended' });
      }
    }

    return subscription;
  }
};

// ============================================================================
// FEATURE USAGE API
// ============================================================================

export const featureUsageAPI = {
  /**
   * Get current usage for a feature
   */
  async getCurrent(userId, featureKey) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const logs = await apiRequest(
      () => supabase
        .from('feature_usage_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('feature_key', featureKey)
        .gte('period_start', periodStart.toISOString())
        .lte('period_end', periodEnd.toISOString())
        .single(),
      `Failed to fetch usage for ${featureKey}`
    );

    return logs || null;
  },

  /**
   * Track feature usage
   */
  async track(userId, featureKey, incrementBy = 1) {
    const subscription = await userSubscriptionsAPI.getCurrent(userId);
    if (!subscription) {
      throw new APIError('No active subscription found', 'NO_SUBSCRIPTION');
    }

    const plan = getPlanById(subscription.plan_id);
    const limit = getLimit(subscription.plan_id, featureKey);

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Try to get existing log
    const existing = await this.getCurrent(userId, featureKey);

    if (existing) {
      const newCount = existing.usage_count + incrementBy;
      const isOverLimit = !isUnlimited(limit) && newCount >= limit;

      return apiRequest(
        () => supabase
          .from('feature_usage_logs')
          .update({
            usage_count: newCount,
            is_over_limit: isOverLimit,
            last_checked_at: now.toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single(),
        `Failed to update usage for ${featureKey}`
      );
    } else {
      // Create new log
      const isOverLimit = !isUnlimited(limit) && incrementBy >= limit;

      return apiRequest(
        () => supabase
          .from('feature_usage_logs')
          .insert([{
            user_id: userId,
            feature_key: featureKey,
            usage_count: incrementBy,
            limit_value: limit,
            period_start: periodStart.toISOString(),
            period_end: periodEnd.toISOString(),
            period_type: 'monthly',
            is_over_limit: isOverLimit
          }])
          .select()
          .single(),
        `Failed to create usage log for ${featureKey}`
      );
    }
  },

  /**
   * Check if feature usage is within limits
   */
  async checkLimit(userId, featureKey) {
    const subscription = await userSubscriptionsAPI.getCurrent(userId);
    if (!subscription) {
      return { allowed: false, reason: 'No active subscription' };
    }

    const limit = getLimit(subscription.plan_id, featureKey);

    // Unlimited
    if (isUnlimited(limit)) {
      return { allowed: true, limit: -1, usage: 0, remaining: -1 };
    }

    const usage = await this.getCurrent(userId, featureKey);
    const currentUsage = usage?.usage_count || 0;

    return {
      allowed: currentUsage < limit,
      limit,
      usage: currentUsage,
      remaining: Math.max(0, limit - currentUsage),
      percentage: (currentUsage / limit) * 100
    };
  },

  /**
   * Get all usage stats for user
   */
  async getAllUsage(userId) {
    const subscription = await userSubscriptionsAPI.getCurrent(userId);
    if (!subscription) {
      return {};
    }

    const plan = getPlanById(subscription.plan_id);
    const featureKeys = ['branches', 'team_members', 'data_points', 'reports', 'api_calls', 'exports'];

    const usage = {};

    for (const key of featureKeys) {
      usage[key] = await this.checkLimit(userId, key);
    }

    return usage;
  }
};

// ============================================================================
// INVOICES API
// ============================================================================

export const invoicesAPI = {
  /**
   * Get all invoices for user
   */
  async getAll(userId, filters = {}) {
    let query = supabase
      .from('subscription_invoices')
      .select('*')
      .eq('user_id', userId)
      .order('invoice_date', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.limit) query = query.limit(filters.limit);

    return apiRequest(() => query, 'Failed to fetch invoices');
  },

  /**
   * Get invoice by ID
   */
  async getById(invoiceId) {
    return apiRequest(
      () => supabase
        .from('subscription_invoices')
        .select('*')
        .eq('id', invoiceId)
        .single(),
      `Failed to fetch invoice ${invoiceId}`
    );
  },

  /**
   * Create invoice
   */
  async create(invoiceData) {
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    const invoice = {
      ...invoiceData,
      invoice_number: invoiceNumber,
      invoice_date: new Date().toISOString()
    };

    return apiRequest(
      () => supabase
        .from('subscription_invoices')
        .insert([invoice])
        .select()
        .single(),
      'Failed to create invoice'
    );
  },

  /**
   * Update invoice status
   */
  async updateStatus(invoiceId, status, paidDate = null) {
    const updates = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'paid' && paidDate) {
      updates.paid_date = paidDate;
    }

    return apiRequest(
      () => supabase
        .from('subscription_invoices')
        .update(updates)
        .eq('id', invoiceId)
        .select()
        .single(),
      `Failed to update invoice ${invoiceId}`
    );
  }
};

// ============================================================================
// PAYMENT METHODS API
// ============================================================================

export const paymentMethodsAPI = {
  /**
   * Get all payment methods for user
   */
  async getAll(userId) {
    return apiRequest(
      () => supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('is_default', { ascending: false }),
      'Failed to fetch payment methods'
    );
  },

  /**
   * Add payment method
   */
  async add(paymentMethodData) {
    // If this is set as default, unset other defaults
    if (paymentMethodData.is_default) {
      await apiRequest(
        () => supabase
          .from('payment_methods')
          .update({ is_default: false })
          .eq('user_id', paymentMethodData.user_id),
        'Failed to update default payment methods'
      );
    }

    return apiRequest(
      () => supabase
        .from('payment_methods')
        .insert([paymentMethodData])
        .select()
        .single(),
      'Failed to add payment method'
    );
  },

  /**
   * Set default payment method
   */
  async setDefault(paymentMethodId, userId) {
    // Unset all defaults
    await apiRequest(
      () => supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', userId),
      'Failed to update default payment methods'
    );

    // Set new default
    return apiRequest(
      () => supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', paymentMethodId)
        .select()
        .single(),
      `Failed to set default payment method ${paymentMethodId}`
    );
  },

  /**
   * Remove payment method
   */
  async remove(paymentMethodId) {
    return apiRequest(
      () => supabase
        .from('payment_methods')
        .update({ is_active: false })
        .eq('id', paymentMethodId)
        .select()
        .single(),
      `Failed to remove payment method ${paymentMethodId}`
    );
  }
};

// ============================================================================
// LICENSE KEYS API
// ============================================================================

export const licenseKeysAPI = {
  /**
   * Generate a new license key
   */
  generateKey() {
    const segments = [];
    for (let i = 0; i < 4; i++) {
      const segment = Math.random().toString(36).substring(2, 8).toUpperCase();
      segments.push(segment);
    }
    return segments.join('-');
  },

  /**
   * Hash license key for storage
   */
  async hashKey(key) {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Create license key
   */
  async create(userId, subscriptionId, planId, validUntil = null) {
    const key = this.generateKey();
    const keyHash = await this.hashKey(key);
    const plan = getPlanById(planId);

    const licenseData = {
      user_id: userId,
      subscription_id: subscriptionId,
      key,
      key_hash: keyHash,
      status: 'active',
      max_activations: 1,
      current_activations: 0,
      valid_from: new Date().toISOString(),
      valid_until: validUntil,
      plan_id: planId,
      allowed_features: plan.featureFlags
    };

    const created = await apiRequest(
      () => supabase
        .from('license_keys')
        .insert([licenseData])
        .select()
        .single(),
      'Failed to create license key'
    );

    return { ...created, key }; // Return the plain key once
  },

  /**
   * Validate license key
   */
  async validate(key) {
    const keyHash = await this.hashKey(key);

    const license = await apiRequest(
      () => supabase
        .from('license_keys')
        .select('*, subscription:subscription_id(*)')
        .eq('key_hash', keyHash)
        .eq('status', 'active')
        .single(),
      'Failed to validate license key'
    );

    if (!license) {
      return { valid: false, reason: 'Invalid or inactive license key' };
    }

    // Check validity period
    const now = new Date();
    if (license.valid_until && new Date(license.valid_until) < now) {
      return { valid: false, reason: 'License key has expired' };
    }

    // Check activation limit
    if (license.current_activations >= license.max_activations) {
      return { valid: false, reason: 'Maximum activations reached' };
    }

    return {
      valid: true,
      license,
      planId: license.plan_id,
      features: license.allowed_features
    };
  },

  /**
   * Activate license key
   */
  async activate(key, deviceInfo = {}) {
    const validation = await this.validate(key);

    if (!validation.valid) {
      throw new APIError(validation.reason, 'INVALID_LICENSE');
    }

    const license = validation.license;
    const activationMetadata = license.activation_metadata || [];
    activationMetadata.push({
      activated_at: new Date().toISOString(),
      device_info: deviceInfo
    });

    return apiRequest(
      () => supabase
        .from('license_keys')
        .update({
          current_activations: license.current_activations + 1,
          activation_metadata: activationMetadata
        })
        .eq('id', license.id)
        .select()
        .single(),
      'Failed to activate license key'
    );
  },

  /**
   * Revoke license key
   */
  async revoke(licenseId) {
    return apiRequest(
      () => supabase
        .from('license_keys')
        .update({ status: 'revoked' })
        .eq('id', licenseId)
        .select()
        .single(),
      `Failed to revoke license ${licenseId}`
    );
  },

  /**
   * Get user's license keys
   */
  async getAll(userId) {
    return apiRequest(
      () => supabase
        .from('license_keys')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      'Failed to fetch license keys'
    );
  }
};

// ============================================================================
// SUBSCRIPTION EVENTS API
// ============================================================================

export const subscriptionEventsAPI = {
  /**
   * Log subscription event
   */
  async log(userId, subscriptionId, eventType, eventData = {}) {
    return apiRequest(
      () => supabase
        .from('subscription_events')
        .insert([{
          user_id: userId,
          subscription_id: subscriptionId,
          event_type: eventType,
          event_data: eventData,
          triggered_by: 'system'
        }])
        .select()
        .single(),
      'Failed to log subscription event'
    );
  },

  /**
   * Get events for subscription
   */
  async getAll(userId, filters = {}) {
    let query = supabase
      .from('subscription_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters.eventType) query = query.eq('event_type', filters.eventType);
    if (filters.limit) query = query.limit(filters.limit);

    return apiRequest(() => query, 'Failed to fetch subscription events');
  }
};

// ============================================================================
// BILLING NOTIFICATIONS API
// ============================================================================

export const billingNotificationsAPI = {
  /**
   * Create billing notification
   */
  async create(notificationData) {
    return apiRequest(
      () => supabase
        .from('billing_notifications')
        .insert([notificationData])
        .select()
        .single(),
      'Failed to create billing notification'
    );
  },

  /**
   * Get all notifications for user
   */
  async getAll(userId, filters = {}) {
    let query = supabase
      .from('billing_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.type) query = query.eq('type', filters.type);
    if (filters.limit) query = query.limit(filters.limit);

    return apiRequest(() => query, 'Failed to fetch billing notifications');
  },

  /**
   * Mark as read
   */
  async markAsRead(notificationId) {
    return apiRequest(
      () => supabase
        .from('billing_notifications')
        .update({
          status: 'read',
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .select()
        .single(),
      `Failed to mark notification ${notificationId} as read`
    );
  },

  /**
   * Send trial ending notification
   */
  async sendTrialEndingNotification(userId, subscriptionId, daysRemaining) {
    return this.create({
      user_id: userId,
      subscription_id: subscriptionId,
      type: 'trial_ending',
      title: 'Trial Ending Soon',
      message: `Your trial period ends in ${daysRemaining} days. Upgrade to continue using premium features.`,
      priority: 'high',
      action_url: '/subscriptions',
      action_label: 'Upgrade Now'
    });
  },

  /**
   * Send payment failed notification
   */
  async sendPaymentFailedNotification(userId, subscriptionId, reason) {
    return this.create({
      user_id: userId,
      subscription_id: subscriptionId,
      type: 'payment_failed',
      title: 'Payment Failed',
      message: `Your recent payment failed: ${reason}. Please update your payment method to avoid service interruption.`,
      priority: 'critical',
      action_url: '/billing',
      action_label: 'Update Payment'
    });
  },

  /**
   * Send usage limit notification
   */
  async sendUsageLimitNotification(userId, featureKey, percentage) {
    return this.create({
      user_id: userId,
      type: 'usage_limit',
      title: 'Usage Limit Warning',
      message: `You've used ${percentage}% of your ${featureKey} limit. Consider upgrading your plan for more capacity.`,
      priority: percentage >= 100 ? 'high' : 'normal',
      action_url: '/subscriptions',
      action_label: 'View Plans'
    });
  }
};

// ============================================================================
// BRANCH-BASED PRICING API
// ============================================================================

export const branchBasedPricingAPI = {
  /**
   * Get pricing breakdown for user's brand based on branch count
   */
  async getUserPricing(userId) {
    return apiRequest(
      async () => {
        const { data, error } = await supabase
          .rpc('get_user_subscription_cost', { user_uuid: userId });

        if (error) throw error;

        return { data: data?.[0] || null, error: null };
      },
      'Failed to fetch user pricing'
    );
  },

  /**
   * Get pricing breakdown for a brand
   */
  async getBrandPricing(brandId) {
    return apiRequest(
      async () => {
        const { data, error } = await supabase
          .rpc('get_brand_pricing', { brand_uuid: brandId });

        if (error) throw error;

        return { data: data?.[0] || null, error: null };
      },
      'Failed to fetch brand pricing'
    );
  },

  /**
   * Calculate monthly price based on branch count (client-side)
   */
  calculateMonthlyPrice(branchCount) {
    const BASE_PRICE = 299;
    const ADDITIONAL_BRANCH_PRICE = 99;

    if (branchCount < 1) branchCount = 1;
    const additionalBranches = Math.max(0, branchCount - 1);

    return BASE_PRICE + (additionalBranches * ADDITIONAL_BRANCH_PRICE);
  },

  /**
   * Calculate yearly price with discount (client-side)
   */
  calculateYearlyPrice(branchCount, discountPercent = 17) {
    const monthlyPrice = this.calculateMonthlyPrice(branchCount);
    const yearlyPrice = monthlyPrice * 12;
    const discountAmount = (yearlyPrice * discountPercent) / 100;

    return yearlyPrice - discountAmount;
  },

  /**
   * Get pricing breakdown (client-side calculation)
   */
  getPricingBreakdown(branchCount) {
    const BASE_PRICE = 299;
    const ADDITIONAL_BRANCH_PRICE = 99;
    const additionalBranches = Math.max(0, branchCount - 1);
    const monthlyTotal = this.calculateMonthlyPrice(branchCount);
    const yearlyTotal = this.calculateYearlyPrice(branchCount);
    const yearlySavings = (monthlyTotal * 12) - yearlyTotal;

    return {
      branchCount,
      basePrice: BASE_PRICE,
      additionalBranches,
      additionalBranchCost: additionalBranches * ADDITIONAL_BRANCH_PRICE,
      monthly: {
        total: monthlyTotal,
        perBranch: monthlyTotal / branchCount,
        currency: 'SAR',
      },
      yearly: {
        total: yearlyTotal,
        savings: yearlySavings,
        savingsPercent: 17,
        perMonth: yearlyTotal / 12,
        currency: 'SAR',
      },
    };
  }
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  plans: subscriptionPlansAPI,
  subscriptions: userSubscriptionsAPI,
  usage: featureUsageAPI,
  invoices: invoicesAPI,
  paymentMethods: paymentMethodsAPI,
  licenseKeys: licenseKeysAPI,
  events: subscriptionEventsAPI,
  notifications: billingNotificationsAPI,
  branchPricing: branchBasedPricingAPI
};
