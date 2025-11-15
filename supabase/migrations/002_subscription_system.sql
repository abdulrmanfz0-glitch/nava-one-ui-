-- Subscription System Migration
-- This migration adds comprehensive SaaS subscription functionality

-- ============================================================================
-- 1. SUBSCRIPTION PLANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,

    -- Pricing
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',

    -- Payment processor IDs
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,
    paddle_price_id_monthly TEXT,
    paddle_price_id_yearly TEXT,

    -- Limits
    limit_branches INTEGER NOT NULL DEFAULT 1,
    limit_team_members INTEGER NOT NULL DEFAULT 1,
    limit_data_points INTEGER NOT NULL DEFAULT 1000,
    limit_analytics_history INTEGER NOT NULL DEFAULT 30,
    limit_reports INTEGER NOT NULL DEFAULT 5,
    limit_custom_dashboards INTEGER NOT NULL DEFAULT 0,
    limit_api_calls INTEGER NOT NULL DEFAULT 0,
    limit_storage INTEGER NOT NULL DEFAULT 100,
    limit_exports INTEGER NOT NULL DEFAULT 5,

    -- Configuration
    trial_days INTEGER NOT NULL DEFAULT 14,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_popular BOOLEAN NOT NULL DEFAULT false,
    badge TEXT,
    contact_sales BOOLEAN NOT NULL DEFAULT false,

    -- Metadata
    features JSONB DEFAULT '[]'::jsonb,
    feature_flags JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. USER SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL REFERENCES subscription_plans(id),

    -- Status
    status TEXT NOT NULL DEFAULT 'active', -- active, trial, past_due, cancelled, suspended, expired
    billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- monthly, yearly, lifetime

    -- Dates
    trial_start_date TIMESTAMPTZ,
    trial_end_date TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL,
    cancelled_at TIMESTAMPTZ,
    grace_period_end TIMESTAMPTZ,

    -- Payment info
    payment_processor TEXT, -- stripe, paddle, manual
    external_subscription_id TEXT, -- Stripe/Paddle subscription ID
    external_customer_id TEXT, -- Stripe/Paddle customer ID

    -- Pricing
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',

    -- Seats & Usage
    seats_total INTEGER NOT NULL DEFAULT 1,
    seats_used INTEGER NOT NULL DEFAULT 1,

    -- Auto-renewal
    auto_renew BOOLEAN NOT NULL DEFAULT true,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id) -- One active subscription per user
);

-- ============================================================================
-- 3. SUBSCRIPTION INVOICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES user_subscriptions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

    -- Invoice details
    invoice_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed, refunded, void

    -- Amounts
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',

    -- Dates
    invoice_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    due_date TIMESTAMPTZ,
    paid_date TIMESTAMPTZ,

    -- Payment
    payment_processor TEXT,
    external_invoice_id TEXT,
    payment_method_last4 TEXT,
    payment_method_brand TEXT,

    -- Items
    line_items JSONB DEFAULT '[]'::jsonb,

    -- URLs
    invoice_pdf_url TEXT,
    hosted_invoice_url TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. PAYMENT METHODS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

    -- Method details
    type TEXT NOT NULL, -- card, paypal, bank_account
    is_default BOOLEAN NOT NULL DEFAULT false,

    -- Card details (encrypted/tokenized)
    brand TEXT, -- visa, mastercard, amex
    last4 TEXT,
    exp_month INTEGER,
    exp_year INTEGER,

    -- Payment processor
    payment_processor TEXT NOT NULL, -- stripe, paddle
    external_payment_method_id TEXT NOT NULL,

    -- Billing details
    billing_email TEXT,
    billing_name TEXT,
    billing_address JSONB,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. FEATURE USAGE LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS feature_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

    -- Usage tracking
    feature_key TEXT NOT NULL, -- branches, team_members, data_points, etc.
    usage_count INTEGER NOT NULL DEFAULT 0,
    limit_value INTEGER NOT NULL,

    -- Period
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    period_type TEXT NOT NULL DEFAULT 'monthly', -- daily, weekly, monthly

    -- Status
    is_over_limit BOOLEAN NOT NULL DEFAULT false,
    last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id, feature_key, period_start)
);

-- ============================================================================
-- 6. LICENSE KEYS TABLE (for offline mode)
-- ============================================================================
CREATE TABLE IF NOT EXISTS license_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,

    -- Key details
    key TEXT NOT NULL UNIQUE,
    key_hash TEXT NOT NULL UNIQUE,

    -- Status
    status TEXT NOT NULL DEFAULT 'active', -- active, expired, revoked, suspended

    -- Activation
    max_activations INTEGER NOT NULL DEFAULT 1,
    current_activations INTEGER NOT NULL DEFAULT 0,
    activation_metadata JSONB DEFAULT '[]'::jsonb,

    -- Validity
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,

    -- Scope
    plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
    allowed_features JSONB DEFAULT '{}'::jsonb,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. SUBSCRIPTION EVENTS TABLE (audit log)
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscription_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,

    -- Event details
    event_type TEXT NOT NULL, -- created, upgraded, downgraded, cancelled, renewed, payment_failed, etc.
    event_data JSONB DEFAULT '{}'::jsonb,

    -- Context
    triggered_by TEXT, -- user, system, webhook
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 8. BILLING NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS billing_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,

    -- Notification details
    type TEXT NOT NULL, -- trial_ending, payment_failed, subscription_cancelled, usage_limit, etc.
    status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed, read

    -- Content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    action_label TEXT,

    -- Priority
    priority TEXT NOT NULL DEFAULT 'normal', -- low, normal, high, critical

    -- Delivery
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 9. INSERT DEFAULT SUBSCRIPTION PLANS
-- ============================================================================
INSERT INTO subscription_plans (
    id, name, display_name, description,
    price_monthly, price_yearly,
    limit_branches, limit_team_members, limit_data_points,
    limit_analytics_history, limit_reports, limit_custom_dashboards,
    limit_api_calls, limit_storage, limit_exports,
    trial_days, is_popular, badge
) VALUES
-- Free Plan
(
    'free', 'Free', 'Free Tier', 'Perfect for trying out the platform',
    0, 0,
    1, 1, 1000,
    30, 5, 0,
    0, 100, 5,
    14, false, NULL
),
-- Starter Plan
(
    'starter', 'Starter', 'Starter Plan', 'Great for small businesses and growing teams',
    29, 290,
    5, 5, 10000,
    90, 50, 3,
    10000, 1000, 100,
    14, true, NULL
),
-- Pro Plan
(
    'pro', 'Pro', 'Professional Plan', 'For established businesses that need advanced features',
    99, 990,
    25, 25, 100000,
    365, -1, 15,
    100000, 10000, -1,
    14, true, 'Most Popular'
),
-- Enterprise Plan
(
    'enterprise', 'Enterprise', 'Enterprise Plan', 'Custom solutions for large organizations',
    499, 4990,
    -1, -1, -1,
    -1, -1, -1,
    -1, -1, -1,
    30, false, 'Best Value'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 10. INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period_end ON user_subscriptions(current_period_end);

CREATE INDEX IF NOT EXISTS idx_subscription_invoices_user_id ON subscription_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_subscription_id ON subscription_invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_status ON subscription_invoices(status);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_invoice_date ON subscription_invoices(invoice_date);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(user_id, is_default);

CREATE INDEX IF NOT EXISTS idx_feature_usage_logs_user_id ON feature_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_logs_period ON feature_usage_logs(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_license_keys_user_id ON license_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_license_keys_key_hash ON license_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_license_keys_status ON license_keys(status);

CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at);

CREATE INDEX IF NOT EXISTS idx_billing_notifications_user_id ON billing_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_notifications_status ON billing_notifications(status);

-- ============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_notifications ENABLE ROW LEVEL SECURITY;

-- Subscription Plans (public read, admin write)
CREATE POLICY "Anyone can view subscription plans" ON subscription_plans
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify subscription plans" ON subscription_plans
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- User Subscriptions (users can view their own)
CREATE POLICY "Users can view their own subscription" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" ON user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Subscription Invoices (users can view their own)
CREATE POLICY "Users can view their own invoices" ON subscription_invoices
    FOR SELECT USING (auth.uid() = user_id);

-- Payment Methods (users can manage their own)
CREATE POLICY "Users can view their own payment methods" ON payment_methods
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment methods" ON payment_methods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods" ON payment_methods
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods" ON payment_methods
    FOR DELETE USING (auth.uid() = user_id);

-- Feature Usage Logs (users can view their own)
CREATE POLICY "Users can view their own usage logs" ON feature_usage_logs
    FOR SELECT USING (auth.uid() = user_id);

-- License Keys (users can view their own)
CREATE POLICY "Users can view their own license keys" ON license_keys
    FOR SELECT USING (auth.uid() = user_id);

-- Subscription Events (users can view their own)
CREATE POLICY "Users can view their own subscription events" ON subscription_events
    FOR SELECT USING (auth.uid() = user_id);

-- Billing Notifications (users can view their own)
CREATE POLICY "Users can view their own billing notifications" ON billing_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own billing notifications" ON billing_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 12. TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_invoices_updated_at BEFORE UPDATE ON subscription_invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_usage_logs_updated_at BEFORE UPDATE ON feature_usage_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_license_keys_updated_at BEFORE UPDATE ON license_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_notifications_updated_at BEFORE UPDATE ON billing_notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 13. HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is within limits
CREATE OR REPLACE FUNCTION check_feature_limit(
    p_user_id UUID,
    p_feature_key TEXT,
    p_current_usage INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_limit INTEGER;
    v_plan_id TEXT;
BEGIN
    -- Get user's current plan
    SELECT plan_id INTO v_plan_id
    FROM user_subscriptions
    WHERE user_id = p_user_id AND status IN ('active', 'trial')
    LIMIT 1;

    -- Get limit for feature
    v_limit := CASE p_feature_key
        WHEN 'branches' THEN (SELECT limit_branches FROM subscription_plans WHERE id = v_plan_id)
        WHEN 'team_members' THEN (SELECT limit_team_members FROM subscription_plans WHERE id = v_plan_id)
        WHEN 'data_points' THEN (SELECT limit_data_points FROM subscription_plans WHERE id = v_plan_id)
        WHEN 'reports' THEN (SELECT limit_reports FROM subscription_plans WHERE id = v_plan_id)
        WHEN 'api_calls' THEN (SELECT limit_api_calls FROM subscription_plans WHERE id = v_plan_id)
        ELSE 0
    END;

    -- -1 means unlimited
    IF v_limit = -1 THEN
        RETURN TRUE;
    END IF;

    RETURN p_current_usage < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log subscription events
CREATE OR REPLACE FUNCTION log_subscription_event(
    p_user_id UUID,
    p_subscription_id UUID,
    p_event_type TEXT,
    p_event_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO subscription_events (user_id, subscription_id, event_type, event_data, triggered_by)
    VALUES (p_user_id, p_subscription_id, p_event_type, p_event_data, 'system')
    RETURNING id INTO v_event_id;

    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
