/**
 * Subscription Plans Configuration
 * Defines all subscription tiers, features, and limits
 */

export const PLAN_IDS = {
  FREE: 'free',
  STARTER: 'starter',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
};

export const PLAN_STATUS = {
  ACTIVE: 'active',
  TRIAL: 'trial',
  PAST_DUE: 'past_due',
  CANCELLED: 'cancelled',
  SUSPENDED: 'suspended',
  EXPIRED: 'expired'
};

export const BILLING_CYCLES = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  LIFETIME: 'lifetime'
};

export const FEATURE_FLAGS = {
  // Core Features
  MULTI_BRANCH: 'multi_branch',
  TEAM_COLLABORATION: 'team_collaboration',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  CUSTOM_REPORTS: 'custom_reports',
  AI_INSIGHTS: 'ai_insights',
  EXPORT_DATA: 'export_data',

  // Advanced Features
  API_ACCESS: 'api_access',
  WEBHOOKS: 'webhooks',
  WHITE_LABEL: 'white_label',
  CUSTOM_INTEGRATIONS: 'custom_integrations',
  PRIORITY_SUPPORT: 'priority_support',
  DEDICATED_ACCOUNT_MANAGER: 'dedicated_account_manager',

  // Analytics Features
  REALTIME_ANALYTICS: 'realtime_analytics',
  PREDICTIVE_ANALYTICS: 'predictive_analytics',
  COMPETITOR_ANALYSIS: 'competitor_analysis',
  CUSTOM_DASHBOARDS: 'custom_dashboards',

  // Data Features
  UNLIMITED_HISTORY: 'unlimited_history',
  ADVANCED_FILTERS: 'advanced_filters',
  BULK_OPERATIONS: 'bulk_operations',
  AUTOMATED_WORKFLOWS: 'automated_workflows',
};

// Subscription Plans Definition
export const SUBSCRIPTION_PLANS = {
  [PLAN_IDS.FREE]: {
    id: PLAN_IDS.FREE,
    name: 'Free',
    displayName: 'Free Tier',
    description: 'Perfect for trying out the platform',
    price: {
      monthly: 0,
      yearly: 0,
      currency: 'USD'
    },
    limits: {
      branches: 1,
      teamMembers: 1,
      dataPoints: 1000, // Orders/month
      analyticsHistory: 30, // days
      reports: 5, // reports/month
      customDashboards: 0,
      apiCalls: 0, // per month
      storage: 100, // MB
      exports: 5, // exports/month
    },
    features: [
      'Single branch location',
      'Basic analytics (30 days)',
      '1,000 orders/month',
      'Standard reports',
      '5 exports per month',
      'Community support',
      'Mobile app access'
    ],
    featureFlags: {
      [FEATURE_FLAGS.MULTI_BRANCH]: false,
      [FEATURE_FLAGS.TEAM_COLLABORATION]: false,
      [FEATURE_FLAGS.ADVANCED_ANALYTICS]: false,
      [FEATURE_FLAGS.CUSTOM_REPORTS]: false,
      [FEATURE_FLAGS.AI_INSIGHTS]: false,
      [FEATURE_FLAGS.EXPORT_DATA]: true,
      [FEATURE_FLAGS.API_ACCESS]: false,
      [FEATURE_FLAGS.WEBHOOKS]: false,
      [FEATURE_FLAGS.WHITE_LABEL]: false,
      [FEATURE_FLAGS.CUSTOM_INTEGRATIONS]: false,
      [FEATURE_FLAGS.PRIORITY_SUPPORT]: false,
      [FEATURE_FLAGS.DEDICATED_ACCOUNT_MANAGER]: false,
      [FEATURE_FLAGS.REALTIME_ANALYTICS]: false,
      [FEATURE_FLAGS.PREDICTIVE_ANALYTICS]: false,
      [FEATURE_FLAGS.COMPETITOR_ANALYSIS]: false,
      [FEATURE_FLAGS.CUSTOM_DASHBOARDS]: false,
      [FEATURE_FLAGS.UNLIMITED_HISTORY]: false,
      [FEATURE_FLAGS.ADVANCED_FILTERS]: false,
      [FEATURE_FLAGS.BULK_OPERATIONS]: false,
      [FEATURE_FLAGS.AUTOMATED_WORKFLOWS]: false,
    },
    badge: null,
    popular: false,
    trialDays: 14
  },

  [PLAN_IDS.STARTER]: {
    id: PLAN_IDS.STARTER,
    name: 'Starter',
    displayName: 'Starter Plan',
    description: 'Great for small businesses and growing teams',
    price: {
      monthly: 29,
      yearly: 290, // ~17% discount
      currency: 'USD'
    },
    paddlePriceIds: {
      monthly: 'pri_starter_monthly_01', // Replace with actual Paddle price IDs
      yearly: 'pri_starter_yearly_01'
    },
    stripePriceIds: {
      monthly: 'price_starter_monthly', // Replace with actual Stripe price IDs
      yearly: 'price_starter_yearly'
    },
    limits: {
      branches: 5,
      teamMembers: 5,
      dataPoints: 10000, // Orders/month
      analyticsHistory: 90, // days
      reports: 50, // reports/month
      customDashboards: 3,
      apiCalls: 10000, // per month
      storage: 1000, // MB (1GB)
      exports: 100, // exports/month
    },
    features: [
      'Up to 5 branch locations',
      '5 team member seats',
      '10,000 orders/month',
      'Advanced analytics (90 days)',
      '50 custom reports/month',
      '3 custom dashboards',
      'Unlimited exports',
      'AI-powered insights',
      'Email support',
      'API access (10K calls/month)',
      'Mobile & web apps'
    ],
    featureFlags: {
      [FEATURE_FLAGS.MULTI_BRANCH]: true,
      [FEATURE_FLAGS.TEAM_COLLABORATION]: true,
      [FEATURE_FLAGS.ADVANCED_ANALYTICS]: true,
      [FEATURE_FLAGS.CUSTOM_REPORTS]: true,
      [FEATURE_FLAGS.AI_INSIGHTS]: true,
      [FEATURE_FLAGS.EXPORT_DATA]: true,
      [FEATURE_FLAGS.API_ACCESS]: true,
      [FEATURE_FLAGS.WEBHOOKS]: false,
      [FEATURE_FLAGS.WHITE_LABEL]: false,
      [FEATURE_FLAGS.CUSTOM_INTEGRATIONS]: false,
      [FEATURE_FLAGS.PRIORITY_SUPPORT]: false,
      [FEATURE_FLAGS.DEDICATED_ACCOUNT_MANAGER]: false,
      [FEATURE_FLAGS.REALTIME_ANALYTICS]: true,
      [FEATURE_FLAGS.PREDICTIVE_ANALYTICS]: false,
      [FEATURE_FLAGS.COMPETITOR_ANALYSIS]: false,
      [FEATURE_FLAGS.CUSTOM_DASHBOARDS]: true,
      [FEATURE_FLAGS.UNLIMITED_HISTORY]: false,
      [FEATURE_FLAGS.ADVANCED_FILTERS]: true,
      [FEATURE_FLAGS.BULK_OPERATIONS]: true,
      [FEATURE_FLAGS.AUTOMATED_WORKFLOWS]: false,
    },
    badge: null,
    popular: true,
    trialDays: 14
  },

  [PLAN_IDS.PRO]: {
    id: PLAN_IDS.PRO,
    name: 'Pro',
    displayName: 'Professional Plan',
    description: 'For established businesses that need advanced features',
    price: {
      monthly: 99,
      yearly: 990, // ~17% discount
      currency: 'USD'
    },
    paddlePriceIds: {
      monthly: 'pri_pro_monthly_01',
      yearly: 'pri_pro_yearly_01'
    },
    stripePriceIds: {
      monthly: 'price_pro_monthly',
      yearly: 'price_pro_yearly'
    },
    limits: {
      branches: 25,
      teamMembers: 25,
      dataPoints: 100000, // Orders/month
      analyticsHistory: 365, // days
      reports: -1, // unlimited
      customDashboards: 15,
      apiCalls: 100000, // per month
      storage: 10000, // MB (10GB)
      exports: -1, // unlimited
    },
    features: [
      'Up to 25 branch locations',
      '25 team member seats',
      '100,000 orders/month',
      'Advanced analytics (1 year)',
      'Unlimited custom reports',
      '15 custom dashboards',
      'Unlimited exports',
      'Advanced AI insights',
      'Predictive analytics',
      'Real-time analytics',
      'Priority email & chat support',
      'API access (100K calls/month)',
      'Webhooks integration',
      'Custom integrations',
      'Bulk operations',
      'Advanced filters',
      'Mobile & web apps'
    ],
    featureFlags: {
      [FEATURE_FLAGS.MULTI_BRANCH]: true,
      [FEATURE_FLAGS.TEAM_COLLABORATION]: true,
      [FEATURE_FLAGS.ADVANCED_ANALYTICS]: true,
      [FEATURE_FLAGS.CUSTOM_REPORTS]: true,
      [FEATURE_FLAGS.AI_INSIGHTS]: true,
      [FEATURE_FLAGS.EXPORT_DATA]: true,
      [FEATURE_FLAGS.API_ACCESS]: true,
      [FEATURE_FLAGS.WEBHOOKS]: true,
      [FEATURE_FLAGS.WHITE_LABEL]: false,
      [FEATURE_FLAGS.CUSTOM_INTEGRATIONS]: true,
      [FEATURE_FLAGS.PRIORITY_SUPPORT]: true,
      [FEATURE_FLAGS.DEDICATED_ACCOUNT_MANAGER]: false,
      [FEATURE_FLAGS.REALTIME_ANALYTICS]: true,
      [FEATURE_FLAGS.PREDICTIVE_ANALYTICS]: true,
      [FEATURE_FLAGS.COMPETITOR_ANALYSIS]: true,
      [FEATURE_FLAGS.CUSTOM_DASHBOARDS]: true,
      [FEATURE_FLAGS.UNLIMITED_HISTORY]: true,
      [FEATURE_FLAGS.ADVANCED_FILTERS]: true,
      [FEATURE_FLAGS.BULK_OPERATIONS]: true,
      [FEATURE_FLAGS.AUTOMATED_WORKFLOWS]: true,
    },
    badge: 'Most Popular',
    popular: true,
    trialDays: 14
  },

  [PLAN_IDS.ENTERPRISE]: {
    id: PLAN_IDS.ENTERPRISE,
    name: 'Enterprise',
    displayName: 'Enterprise Plan',
    description: 'Custom solutions for large organizations',
    price: {
      monthly: 499,
      yearly: 4990, // ~17% discount
      currency: 'USD',
      custom: true // Can be customized
    },
    paddlePriceIds: {
      monthly: 'pri_enterprise_monthly_01',
      yearly: 'pri_enterprise_yearly_01'
    },
    stripePriceIds: {
      monthly: 'price_enterprise_monthly',
      yearly: 'price_enterprise_yearly'
    },
    limits: {
      branches: -1, // unlimited
      teamMembers: -1, // unlimited
      dataPoints: -1, // unlimited
      analyticsHistory: -1, // unlimited
      reports: -1, // unlimited
      customDashboards: -1, // unlimited
      apiCalls: -1, // unlimited
      storage: -1, // unlimited
      exports: -1, // unlimited
    },
    features: [
      'Unlimited branch locations',
      'Unlimited team members',
      'Unlimited orders',
      'Unlimited analytics history',
      'Unlimited custom reports',
      'Unlimited custom dashboards',
      'Unlimited exports',
      'Advanced AI & ML insights',
      'Predictive analytics',
      'Real-time analytics',
      'Competitor analysis',
      'White-label options',
      '24/7 priority support',
      'Dedicated account manager',
      'Unlimited API access',
      'Custom webhooks',
      'Custom integrations',
      'SSO/SAML authentication',
      'Advanced security features',
      'Service Level Agreement (SLA)',
      'On-premise deployment option',
      'Custom training sessions',
      'Automated workflows',
      'Mobile & web apps'
    ],
    featureFlags: {
      [FEATURE_FLAGS.MULTI_BRANCH]: true,
      [FEATURE_FLAGS.TEAM_COLLABORATION]: true,
      [FEATURE_FLAGS.ADVANCED_ANALYTICS]: true,
      [FEATURE_FLAGS.CUSTOM_REPORTS]: true,
      [FEATURE_FLAGS.AI_INSIGHTS]: true,
      [FEATURE_FLAGS.EXPORT_DATA]: true,
      [FEATURE_FLAGS.API_ACCESS]: true,
      [FEATURE_FLAGS.WEBHOOKS]: true,
      [FEATURE_FLAGS.WHITE_LABEL]: true,
      [FEATURE_FLAGS.CUSTOM_INTEGRATIONS]: true,
      [FEATURE_FLAGS.PRIORITY_SUPPORT]: true,
      [FEATURE_FLAGS.DEDICATED_ACCOUNT_MANAGER]: true,
      [FEATURE_FLAGS.REALTIME_ANALYTICS]: true,
      [FEATURE_FLAGS.PREDICTIVE_ANALYTICS]: true,
      [FEATURE_FLAGS.COMPETITOR_ANALYSIS]: true,
      [FEATURE_FLAGS.CUSTOM_DASHBOARDS]: true,
      [FEATURE_FLAGS.UNLIMITED_HISTORY]: true,
      [FEATURE_FLAGS.ADVANCED_FILTERS]: true,
      [FEATURE_FLAGS.BULK_OPERATIONS]: true,
      [FEATURE_FLAGS.AUTOMATED_WORKFLOWS]: true,
    },
    badge: 'Best Value',
    popular: false,
    trialDays: 30,
    contactSales: true
  }
};

// Helper function to get plan by ID
export const getPlanById = (planId) => {
  return SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS[PLAN_IDS.FREE];
};

// Helper function to check if feature is available in plan
export const hasFeature = (planId, featureFlag) => {
  const plan = getPlanById(planId);
  return plan.featureFlags[featureFlag] === true;
};

// Helper function to get limit value
export const getLimit = (planId, limitKey) => {
  const plan = getPlanById(planId);
  return plan.limits[limitKey] || 0;
};

// Helper function to check if limit is unlimited
export const isUnlimited = (limit) => {
  return limit === -1;
};

// Helper function to check if usage is within limit
export const isWithinLimit = (usage, limit) => {
  if (isUnlimited(limit)) return true;
  return usage < limit;
};

// Helper function to get usage percentage
export const getUsagePercentage = (usage, limit) => {
  if (isUnlimited(limit)) return 0;
  if (limit === 0) return 100;
  return Math.min((usage / limit) * 100, 100);
};

// Helper function to compare plans (for upgrade/downgrade logic)
export const comparePlans = (currentPlanId, targetPlanId) => {
  const planOrder = [PLAN_IDS.FREE, PLAN_IDS.STARTER, PLAN_IDS.PRO, PLAN_IDS.ENTERPRISE];
  const currentIndex = planOrder.indexOf(currentPlanId);
  const targetIndex = planOrder.indexOf(targetPlanId);

  if (targetIndex > currentIndex) return 'upgrade';
  if (targetIndex < currentIndex) return 'downgrade';
  return 'same';
};

// Grace period configuration (days)
export const GRACE_PERIOD_DAYS = 7;

// Trial period configuration
export const DEFAULT_TRIAL_DAYS = 14;

// Usage tracking intervals
export const USAGE_TRACKING = {
  CHECK_INTERVAL: 'daily', // daily, weekly, monthly
  ALERT_THRESHOLD: 80, // Alert when usage reaches 80%
  HARD_LIMIT_THRESHOLD: 100 // Block when usage reaches 100%
};

export default SUBSCRIPTION_PLANS;
