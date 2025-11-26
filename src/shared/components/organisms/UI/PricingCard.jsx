/**
 * PricingCard Component
 * Displays subscription plan details with pricing and features
 */

import { useState } from 'react';
import { Check, Sparkles, Crown, Building2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const PricingCard = ({
  plan,
  billingCycle = 'monthly',
  currentPlanId,
  onSelectPlan,
  isLoading = false,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const isCurrent = currentPlanId === plan.id;
  const isPopular = plan.popular;

  const price = billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly;
  const monthlyPrice = billingCycle === 'yearly' ? plan.price.yearly / 12 : price;
  const savings = billingCycle === 'yearly'
    ? Math.round(((plan.price.monthly * 12 - plan.price.yearly) / (plan.price.monthly * 12)) * 100)
    : 0;

  const getPlanIcon = () => {
    switch (plan.id) {
      case 'free':
        return <Zap className="w-6 h-6" />;
      case 'starter':
        return <Sparkles className="w-6 h-6" />;
      case 'pro':
        return <Crown className="w-6 h-6" />;
      case 'enterprise':
        return <Building2 className="w-6 h-6" />;
      default:
        return <Zap className="w-6 h-6" />;
    }
  };

  const getButtonText = () => {
    if (isCurrent) return 'Current Plan';
    if (plan.contactSales) return 'Contact Sales';
    if (plan.id === 'free') return 'Get Started';
    if (currentPlanId === 'free') return 'Upgrade Now';
    return 'Select Plan';
  };

  const getButtonVariant = () => {
    if (isCurrent) return 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed';
    if (isPopular) return 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700';
    return 'bg-blue-600 text-white hover:bg-blue-700';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative flex flex-col rounded-2xl border-2 transition-all duration-300 ${
        isPopular
          ? 'border-blue-500 shadow-2xl scale-105'
          : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600'
      } ${isHovered ? 'shadow-xl' : 'shadow-lg'} bg-white dark:bg-gray-800 ${className}`}
    >
      {/* Popular Badge */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-4 py-1 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold shadow-lg">
            <Sparkles className="w-4 h-4" />
            Most Popular
          </span>
        </div>
      )}

      {/* Badge */}
      {plan.badge && !isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="px-3 py-1 rounded-full bg-green-500 text-white text-xs font-semibold shadow-md">
            {plan.badge}
          </span>
        </div>
      )}

      {/* Card Content */}
      <div className="flex-1 p-8">
        {/* Plan Icon and Name */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-xl ${
            isPopular
              ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
              : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
          }`}>
            {getPlanIcon()}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {plan.displayName}
            </h3>
            {isCurrent && (
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Active
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
          {plan.description}
        </p>

        {/* Pricing */}
        <div className="mb-6">
          {plan.price.custom ? (
            <div>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">
                Custom
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Contact us for pricing
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-gray-900 dark:text-white">
                  ${Math.round(monthlyPrice)}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  /month
                </span>
              </div>

              {billingCycle === 'yearly' && savings > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ${price}/year
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-semibold">
                    Save {savings}%
                  </span>
                </div>
              )}

              {plan.trialDays > 0 && !isCurrent && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 font-medium">
                  {plan.trialDays}-day free trial
                </p>
              )}
            </div>
          )}
        </div>

        {/* Features List */}
        <ul className="space-y-3 mb-8">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mt-0.5">
                <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA Button */}
      <div className="p-8 pt-0">
        <button
          onClick={() => !isCurrent && onSelectPlan(plan)}
          disabled={isCurrent || isLoading}
          className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 ${getButtonVariant()} ${
            isLoading ? 'opacity-50 cursor-wait' : ''
          }`}
        >
          {isLoading ? 'Processing...' : getButtonText()}
        </button>

        {plan.contactSales && (
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
            Custom pricing and features available
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default PricingCard;
