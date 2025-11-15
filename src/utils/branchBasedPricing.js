/**
 * Branch-Based Subscription Pricing
 * Saudi Arabia (SAR) pricing model
 * Base: 299 SAR/month (includes 1 branch)
 * Additional branches: +99 SAR/month each
 */

export const PRICING_CONFIG = {
  currency: 'SAR',
  basePriceMonthly: 299, // Includes first branch
  additionalBranchPrice: 99, // Per additional branch per month
  minBranches: 1,
  maxBranches: -1, // Unlimited
};

/**
 * Calculate monthly subscription cost based on number of branches
 * @param {number} branchCount - Number of branches
 * @returns {number} - Monthly cost in SAR
 */
export const calculateMonthlyPrice = (branchCount) => {
  if (branchCount < PRICING_CONFIG.minBranches) {
    return PRICING_CONFIG.basePriceMonthly;
  }

  const additionalBranches = Math.max(0, branchCount - 1);
  return PRICING_CONFIG.basePriceMonthly + (additionalBranches * PRICING_CONFIG.additionalBranchPrice);
};

/**
 * Calculate yearly subscription cost with discount
 * @param {number} branchCount - Number of branches
 * @param {number} discountPercent - Yearly discount percentage (default 17%)
 * @returns {number} - Yearly cost in SAR
 */
export const calculateYearlyPrice = (branchCount, discountPercent = 17) => {
  const monthlyPrice = calculateMonthlyPrice(branchCount);
  const yearlyPrice = monthlyPrice * 12;
  const discountAmount = (yearlyPrice * discountPercent) / 100;
  return yearlyPrice - discountAmount;
};

/**
 * Get pricing breakdown for display
 * @param {number} branchCount - Number of branches
 * @returns {object} - Pricing details
 */
export const getPricingBreakdown = (branchCount) => {
  const additionalBranches = Math.max(0, branchCount - 1);
  const monthlyTotal = calculateMonthlyPrice(branchCount);
  const yearlyTotal = calculateYearlyPrice(branchCount);
  const yearlySavings = (monthlyTotal * 12) - yearlyTotal;

  return {
    branchCount,
    basePrice: PRICING_CONFIG.basePriceMonthly,
    additionalBranches,
    additionalBranchCost: additionalBranches * PRICING_CONFIG.additionalBranchPrice,
    monthly: {
      total: monthlyTotal,
      perBranch: monthlyTotal / branchCount,
      currency: PRICING_CONFIG.currency,
    },
    yearly: {
      total: yearlyTotal,
      savings: yearlySavings,
      savingsPercent: 17,
      perMonth: yearlyTotal / 12,
      currency: PRICING_CONFIG.currency,
    },
  };
};

/**
 * Format price for display
 * @param {number} amount - Amount in SAR
 * @param {boolean} includeCurrency - Include currency symbol
 * @returns {string} - Formatted price string
 */
export const formatPrice = (amount, includeCurrency = true) => {
  const formatted = new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  return includeCurrency ? `${formatted} ${PRICING_CONFIG.currency}` : formatted;
};

/**
 * Pricing tiers for display (examples)
 */
export const PRICING_EXAMPLES = [
  {
    branches: 1,
    label: 'Single Branch',
    description: 'Perfect for starting out',
    monthlyPrice: calculateMonthlyPrice(1),
    popular: false,
  },
  {
    branches: 3,
    label: 'Growing Business',
    description: 'For expanding operations',
    monthlyPrice: calculateMonthlyPrice(3),
    popular: true,
  },
  {
    branches: 5,
    label: 'Multi-Location',
    description: 'For established chains',
    monthlyPrice: calculateMonthlyPrice(5),
    popular: false,
  },
  {
    branches: 10,
    label: 'Enterprise',
    description: 'For large franchises',
    monthlyPrice: calculateMonthlyPrice(10),
    popular: false,
  },
];

/**
 * Features included in all subscriptions
 */
export const INCLUDED_FEATURES = [
  'Real-time Analytics Dashboard',
  'Order Management System',
  'Menu Intelligence',
  'Financial Reports',
  'AI-Powered Insights',
  'Team Management',
  'Custom Branding',
  'Mobile & Web Access',
  'API Access',
  'Priority Support',
  'Data Export',
  'Webhooks Integration',
  'Custom Integrations',
  'Unlimited Analytics History',
  'Unlimited Team Members',
  'Unlimited Orders',
  'Advanced Security',
];

/**
 * Calculate cost difference when adding/removing branches
 * @param {number} currentBranches - Current number of branches
 * @param {number} newBranches - New number of branches
 * @returns {object} - Cost difference details
 */
export const calculatePriceDifference = (currentBranches, newBranches) => {
  const currentPrice = calculateMonthlyPrice(currentBranches);
  const newPrice = calculateMonthlyPrice(newBranches);
  const difference = newPrice - currentPrice;
  const branchDifference = newBranches - currentBranches;

  return {
    currentPrice,
    newPrice,
    difference,
    branchDifference,
    isIncrease: difference > 0,
    isDecrease: difference < 0,
    percentChange: currentPrice > 0 ? (difference / currentPrice) * 100 : 0,
  };
};

/**
 * Validate branch count against pricing rules
 * @param {number} branchCount - Number of branches to validate
 * @returns {object} - Validation result
 */
export const validateBranchCount = (branchCount) => {
  const isValid = branchCount >= PRICING_CONFIG.minBranches &&
                  (PRICING_CONFIG.maxBranches === -1 || branchCount <= PRICING_CONFIG.maxBranches);

  return {
    isValid,
    branchCount,
    minBranches: PRICING_CONFIG.minBranches,
    maxBranches: PRICING_CONFIG.maxBranches,
    error: !isValid ? `Branch count must be at least ${PRICING_CONFIG.minBranches}` : null,
  };
};

export default {
  PRICING_CONFIG,
  calculateMonthlyPrice,
  calculateYearlyPrice,
  getPricingBreakdown,
  formatPrice,
  PRICING_EXAMPLES,
  INCLUDED_FEATURES,
  calculatePriceDifference,
  validateBranchCount,
};
