/**
 * Payment Integration Service
 * Provides unified interface for Stripe and Paddle payment processors
 */

import { logger } from '@/lib/logger';
import subscriptionService from './subscriptionService';

// Payment processor types
export const PAYMENT_PROCESSORS = {
  STRIPE: 'stripe',
  PADDLE: 'paddle',
  MANUAL: 'manual'
};

// ============================================================================
// STRIPE INTEGRATION
// ============================================================================

export class StripePaymentService {
  constructor() {
    this.stripe = null;
    this.initialized = false;
  }

  /**
   * Initialize Stripe
   */
  async initialize(publishableKey) {
    if (this.initialized) return;

    try {
      // Load Stripe.js
      if (!window.Stripe) {
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.async = true;
        document.body.appendChild(script);

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      this.stripe = window.Stripe(publishableKey);
      this.initialized = true;
      logger.info('Stripe initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Stripe', error);
      throw error;
    }
  }

  /**
   * Create checkout session
   */
  async createCheckoutSession({ planId, billingCycle, userId, successUrl, cancelUrl }) {
    try {
      // In production, this would call your backend API to create a Stripe checkout session
      // Backend endpoint: POST /api/stripe/create-checkout-session

      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planId,
          billingCycle,
          userId,
          successUrl,
          cancelUrl
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe checkout
      const { error } = await this.stripe.redirectToCheckout({ sessionId });

      if (error) {
        throw error;
      }
    } catch (error) {
      logger.error('Stripe checkout session creation failed', error);
      throw error;
    }
  }

  /**
   * Create portal session (for managing subscription)
   */
  async createPortalSession({ customerId, returnUrl }) {
    try {
      // Backend endpoint: POST /api/stripe/create-portal-session
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customerId,
          returnUrl
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      logger.error('Stripe portal session creation failed', error);
      throw error;
    }
  }

  /**
   * Handle webhook events (backend only)
   * This is a reference implementation for your backend
   */
  static async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await StripePaymentService.handleCheckoutCompleted(event.data.object);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          await StripePaymentService.handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await StripePaymentService.handleSubscriptionDeleted(event.data.object);
          break;

        case 'invoice.payment_succeeded':
          await StripePaymentService.handleInvoicePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await StripePaymentService.handleInvoicePaymentFailed(event.data.object);
          break;

        default:
          logger.info(`Unhandled Stripe event type: ${event.type}`);
      }
    } catch (error) {
      logger.error('Stripe webhook handling failed', error);
      throw error;
    }
  }

  /**
   * Handle checkout completed
   */
  static async handleCheckoutCompleted(session) {
    const { customer, subscription, client_reference_id: userId } = session;

    // Create subscription in database
    // This would be implemented in your backend
    logger.info('Checkout completed', { customer, subscription, userId });
  }

  /**
   * Handle subscription updated
   */
  static async handleSubscriptionUpdated(subscription) {
    const { id, customer, status, items, current_period_end } = subscription;

    // Update subscription in database
    logger.info('Subscription updated', { id, customer, status });
  }

  /**
   * Handle subscription deleted
   */
  static async handleSubscriptionDeleted(subscription) {
    const { id, customer } = subscription;

    // Mark subscription as cancelled in database
    logger.info('Subscription deleted', { id, customer });
  }

  /**
   * Handle invoice payment succeeded
   */
  static async handleInvoicePaymentSucceeded(invoice) {
    const { id, customer, subscription, amount_paid } = invoice;

    // Update invoice status and extend subscription period
    logger.info('Invoice payment succeeded', { id, customer, subscription, amount_paid });
  }

  /**
   * Handle invoice payment failed
   */
  static async handleInvoicePaymentFailed(invoice) {
    const { id, customer, subscription, attempt_count } = invoice;

    // Update subscription status to past_due
    // Send notification to user
    logger.error('Invoice payment failed', { id, customer, subscription, attempt_count });
  }
}

// ============================================================================
// PADDLE INTEGRATION
// ============================================================================

export class PaddlePaymentService {
  constructor() {
    this.paddle = null;
    this.initialized = false;
  }

  /**
   * Initialize Paddle
   */
  async initialize(vendorId, environment = 'sandbox') {
    if (this.initialized) return;

    try {
      // Load Paddle.js
      if (!window.Paddle) {
        const script = document.createElement('script');
        script.src = 'https://cdn.paddle.com/paddle/paddle.js';
        script.async = true;
        document.body.appendChild(script);

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
        });
      }

      this.paddle = window.Paddle;
      this.paddle.Environment.set(environment);
      this.paddle.Setup({ vendor: vendorId });
      this.initialized = true;
      logger.info('Paddle initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Paddle', error);
      throw error;
    }
  }

  /**
   * Open checkout
   */
  async openCheckout({ productId, email, passthrough, successCallback, closeCallback }) {
    if (!this.initialized) {
      throw new Error('Paddle not initialized');
    }

    try {
      this.paddle.Checkout.open({
        product: productId,
        email,
        passthrough: JSON.stringify(passthrough),
        successCallback: (data) => {
          logger.info('Paddle checkout success', data);
          if (successCallback) successCallback(data);
        },
        closeCallback: (data) => {
          logger.info('Paddle checkout closed', data);
          if (closeCallback) closeCallback(data);
        }
      });
    } catch (error) {
      logger.error('Paddle checkout failed', error);
      throw error;
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription({ subscriptionId, priceId, quantity, billImmediately = false }) {
    try {
      // Backend endpoint: POST /api/paddle/update-subscription
      const response = await fetch('/api/paddle/update-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscriptionId,
          priceId,
          quantity,
          billImmediately
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update subscription');
      }

      return await response.json();
    } catch (error) {
      logger.error('Paddle subscription update failed', error);
      throw error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription({ subscriptionId }) {
    try {
      // Backend endpoint: POST /api/paddle/cancel-subscription
      const response = await fetch('/api/paddle/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscriptionId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      return await response.json();
    } catch (error) {
      logger.error('Paddle subscription cancellation failed', error);
      throw error;
    }
  }

  /**
   * Handle webhook events (backend only)
   */
  static async handleWebhook(event) {
    try {
      const alertName = event.alert_name;

      switch (alertName) {
        case 'subscription_created':
          await PaddlePaymentService.handleSubscriptionCreated(event);
          break;

        case 'subscription_updated':
          await PaddlePaymentService.handleSubscriptionUpdated(event);
          break;

        case 'subscription_cancelled':
          await PaddlePaymentService.handleSubscriptionCancelled(event);
          break;

        case 'subscription_payment_succeeded':
          await PaddlePaymentService.handlePaymentSucceeded(event);
          break;

        case 'subscription_payment_failed':
          await PaddlePaymentService.handlePaymentFailed(event);
          break;

        default:
          logger.info(`Unhandled Paddle event: ${alertName}`);
      }
    } catch (error) {
      logger.error('Paddle webhook handling failed', error);
      throw error;
    }
  }

  /**
   * Handle subscription created
   */
  static async handleSubscriptionCreated(event) {
    logger.info('Paddle subscription created', event);
  }

  /**
   * Handle subscription updated
   */
  static async handleSubscriptionUpdated(event) {
    logger.info('Paddle subscription updated', event);
  }

  /**
   * Handle subscription cancelled
   */
  static async handleSubscriptionCancelled(event) {
    logger.info('Paddle subscription cancelled', event);
  }

  /**
   * Handle payment succeeded
   */
  static async handlePaymentSucceeded(event) {
    logger.info('Paddle payment succeeded', event);
  }

  /**
   * Handle payment failed
   */
  static async handlePaymentFailed(event) {
    logger.error('Paddle payment failed', event);
  }
}

// ============================================================================
// UNIFIED PAYMENT SERVICE
// ============================================================================

export class PaymentService {
  constructor() {
    this.stripe = new StripePaymentService();
    this.paddle = new PaddlePaymentService();
    this.activeProcessor = null;
  }

  /**
   * Initialize payment processor
   */
  async initialize(processor = PAYMENT_PROCESSORS.STRIPE, config = {}) {
    try {
      if (processor === PAYMENT_PROCESSORS.STRIPE) {
        await this.stripe.initialize(config.stripePublishableKey);
        this.activeProcessor = PAYMENT_PROCESSORS.STRIPE;
      } else if (processor === PAYMENT_PROCESSORS.PADDLE) {
        await this.paddle.initialize(config.paddleVendorId, config.paddleEnvironment);
        this.activeProcessor = PAYMENT_PROCESSORS.PADDLE;
      }

      logger.info(`Payment processor ${processor} initialized`);
    } catch (error) {
      logger.error(`Failed to initialize payment processor ${processor}`, error);
      throw error;
    }
  }

  /**
   * Start checkout flow
   */
  async checkout({ planId, billingCycle, userId, email }) {
    const processor = this.activeProcessor || PAYMENT_PROCESSORS.STRIPE;

    try {
      if (processor === PAYMENT_PROCESSORS.STRIPE) {
        await this.stripe.createCheckoutSession({
          planId,
          billingCycle,
          userId,
          successUrl: `${window.location.origin}/subscriptions/success`,
          cancelUrl: `${window.location.origin}/subscriptions`
        });
      } else if (processor === PAYMENT_PROCESSORS.PADDLE) {
        // Get product ID based on plan and billing cycle
        const plan = await subscriptionService.plans.getById(planId);
        const productId = billingCycle === 'yearly'
          ? plan.paddle_price_id_yearly
          : plan.paddle_price_id_monthly;

        await this.paddle.openCheckout({
          productId,
          email,
          passthrough: { userId, planId, billingCycle },
          successCallback: () => {
            window.location.href = '/subscriptions/success';
          }
        });
      }
    } catch (error) {
      logger.error('Checkout flow failed', error);
      throw error;
    }
  }

  /**
   * Open subscription management portal
   */
  async openManagementPortal({ customerId, subscriptionId }) {
    const processor = this.activeProcessor || PAYMENT_PROCESSORS.STRIPE;

    try {
      if (processor === PAYMENT_PROCESSORS.STRIPE) {
        await this.stripe.createPortalSession({
          customerId,
          returnUrl: `${window.location.origin}/billing`
        });
      } else if (processor === PAYMENT_PROCESSORS.PADDLE) {
        // Paddle Update URL (would be provided by Paddle)
        const updateUrl = `https://checkout.paddle.com/subscription/${subscriptionId}`;
        window.open(updateUrl, '_blank');
      }
    } catch (error) {
      logger.error('Failed to open management portal', error);
      throw error;
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();

export default paymentService;
