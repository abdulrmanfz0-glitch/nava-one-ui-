-- NAVA OPS SaaS Analytics Platform - Core Database Schema
-- Migration 001: Core tables for multi-tenant SaaS analytics platform

-- ============================================================================
-- USERS AND AUTHENTICATION
-- ============================================================================

-- User profiles with subscription info
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  company_name TEXT,

  -- Role and permissions
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'analyst', 'viewer')),
  is_active BOOLEAN DEFAULT true,
  is_owner BOOLEAN DEFAULT false,

  -- Subscription info
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'trial', 'suspended', 'cancelled')),
  subscription_started_at TIMESTAMPTZ,
  subscription_expires_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,

  -- Limits based on subscription
  max_branches INTEGER DEFAULT 1,
  max_team_members INTEGER DEFAULT 1,
  max_data_points INTEGER DEFAULT 1000,

  -- Metadata
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log for audit trail
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'login', 'logout', 'data_change', 'report_generated', etc.
  activity_description TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_type ON user_activities(activity_type);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at DESC);

-- ============================================================================
-- BRANCHES (Business Locations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Branch details
  name TEXT NOT NULL,
  code TEXT, -- Unique branch code (e.g., "BR001")
  type TEXT DEFAULT 'retail' CHECK (type IN ('retail', 'restaurant', 'cafe', 'warehouse', 'office', 'other')),

  -- Location
  city TEXT,
  region TEXT,
  country TEXT DEFAULT 'Saudi Arabia',
  address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timezone TEXT DEFAULT 'Asia/Riyadh',

  -- Contact
  phone TEXT,
  email TEXT,
  manager_name TEXT,
  manager_phone TEXT,

  -- Status and metadata
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'closed')),
  opening_date DATE,
  closing_date DATE,

  -- Business hours (JSONB for flexibility)
  business_hours JSONB DEFAULT '{}', -- {"monday": {"open": "09:00", "close": "22:00"}, ...}

  -- Settings
  currency TEXT DEFAULT 'SAR',
  settings JSONB DEFAULT '{}',

  -- Analytics metadata
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(15, 2) DEFAULT 0,
  last_order_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_branches_user_id ON branches(user_id);
CREATE INDEX idx_branches_status ON branches(status);
CREATE INDEX idx_branches_type ON branches(type);
CREATE INDEX idx_branches_code ON branches(code);

-- ============================================================================
-- CATEGORIES AND PRODUCTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,
  parent_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

  -- Display
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_branch_id ON categories(branch_id);
CREATE INDEX idx_categories_parent ON categories(parent_category_id);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

  -- Product details
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,

  -- Pricing
  price DECIMAL(10, 2),
  cost DECIMAL(10, 2),

  -- Stock
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_branch_id ON products(branch_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);

-- ============================================================================
-- ORDERS AND TRANSACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,

  -- Order details
  order_number TEXT UNIQUE,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  order_time TIME NOT NULL DEFAULT CURRENT_TIME,

  -- Customer info (optional)
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,

  -- Financial
  subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
  tax DECIMAL(15, 2) DEFAULT 0,
  discount DECIMAL(15, 2) DEFAULT 0,
  total DECIMAL(15, 2) NOT NULL,

  -- Payment
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'online', 'wallet', 'other')),
  payment_status TEXT DEFAULT 'completed' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),

  -- Order status
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),

  -- Metadata
  notes TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_branch_id ON orders(branch_id);
CREATE INDEX idx_orders_order_date ON orders(order_date DESC);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,

  -- Item details
  product_name TEXT NOT NULL, -- Store name in case product is deleted
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(15, 2) NOT NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- ============================================================================
-- BUSINESS METRICS (Custom Data Points)
-- ============================================================================

CREATE TABLE IF NOT EXISTS metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,

  -- Metric details
  metric_name TEXT NOT NULL,
  metric_type TEXT CHECK (metric_type IN ('revenue', 'count', 'percentage', 'duration', 'custom')),
  metric_category TEXT, -- 'sales', 'operations', 'customer', 'staff', etc.

  -- Value
  metric_value DECIMAL(15, 2) NOT NULL,
  metric_unit TEXT, -- 'SAR', 'orders', '%', 'hours', etc.

  -- Time
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metric_time TIME,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metrics_user_id ON metrics(user_id);
CREATE INDEX idx_metrics_branch_id ON metrics(branch_id);
CREATE INDEX idx_metrics_date ON metrics(metric_date DESC);
CREATE INDEX idx_metrics_name ON metrics(metric_name);

-- ============================================================================
-- PERFORMANCE ENTRIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS performance_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,

  -- Time period
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  period_type TEXT DEFAULT 'daily' CHECK (period_type IN ('hourly', 'daily', 'weekly', 'monthly')),

  -- Performance metrics
  total_revenue DECIMAL(15, 2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  average_order_value DECIMAL(10, 2) DEFAULT 0,

  -- Additional metrics
  customer_count INTEGER DEFAULT 0,
  staff_count INTEGER DEFAULT 0,
  operating_hours DECIMAL(5, 2) DEFAULT 0,

  -- Calculated fields
  revenue_per_hour DECIMAL(10, 2) DEFAULT 0,
  orders_per_hour DECIMAL(10, 2) DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one entry per branch per date per period
  UNIQUE(branch_id, entry_date, period_type)
);

CREATE INDEX idx_performance_user_id ON performance_entries(user_id);
CREATE INDEX idx_performance_branch_id ON performance_entries(branch_id);
CREATE INDEX idx_performance_date ON performance_entries(entry_date DESC);

-- ============================================================================
-- AI INSIGHTS AND ALERTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,

  -- Insight details
  insight_type TEXT NOT NULL CHECK (insight_type IN ('trend', 'anomaly', 'prediction', 'recommendation', 'alert')),
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),

  title TEXT NOT NULL,
  description TEXT,

  -- AI generated data
  confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
  impact_score DECIMAL(3, 2),

  -- Actions
  recommended_actions JSONB DEFAULT '[]',

  -- Status
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'resolved', 'dismissed')),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_insights_user_id ON insights(user_id);
CREATE INDEX idx_insights_branch_id ON insights(branch_id);
CREATE INDEX idx_insights_type ON insights(insight_type);
CREATE INDEX idx_insights_status ON insights(status);
CREATE INDEX idx_insights_created_at ON insights(created_at DESC);

-- ============================================================================
-- REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,

  -- Report details
  report_name TEXT NOT NULL,
  report_type TEXT CHECK (report_type IN ('financial', 'sales', 'inventory', 'performance', 'custom')),
  report_format TEXT DEFAULT 'pdf' CHECK (report_format IN ('pdf', 'excel', 'csv', 'json')),

  -- Date range
  start_date DATE,
  end_date DATE,

  -- File info
  file_url TEXT,
  file_size INTEGER,

  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),

  -- Metadata
  parameters JSONB DEFAULT '{}',
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX idx_reports_user_id ON reports(user_id);
CREATE INDEX idx_reports_branch_id ON reports(branch_id);
CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Notification details
  type TEXT NOT NULL CHECK (type IN ('alert', 'insight', 'report', 'system', 'subscription')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  title TEXT NOT NULL,
  message TEXT,

  -- Action
  action_url TEXT,
  action_label TEXT,

  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================================
-- TEAM MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Access control
  role TEXT DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'analyst', 'viewer')),
  permissions JSONB DEFAULT '[]', -- Array of specific permissions

  -- Branch access
  branch_ids JSONB DEFAULT '[]', -- Array of branch UUIDs they can access

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(owner_id, member_id)
);

CREATE INDEX idx_team_members_owner_id ON team_members(owner_id);
CREATE INDEX idx_team_members_member_id ON team_members(member_id);
CREATE INDEX idx_team_members_status ON team_members(status);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_updated_at BEFORE UPDATE ON performance_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insights_updated_at BEFORE UPDATE ON insights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- User profiles: Users can read/update their own profile
CREATE POLICY user_profiles_select ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY user_profiles_update ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Branches: Users can manage their own branches
CREATE POLICY branches_select ON branches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY branches_insert ON branches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY branches_update ON branches FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY branches_delete ON branches FOR DELETE USING (auth.uid() = user_id);

-- Categories: Users can manage their own categories
CREATE POLICY categories_select ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY categories_insert ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY categories_update ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY categories_delete ON categories FOR DELETE USING (auth.uid() = user_id);

-- Products: Users can manage their own products
CREATE POLICY products_select ON products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY products_insert ON products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY products_update ON products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY products_delete ON products FOR DELETE USING (auth.uid() = user_id);

-- Orders: Users can manage their own orders
CREATE POLICY orders_select ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY orders_insert ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY orders_update ON orders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY orders_delete ON orders FOR DELETE USING (auth.uid() = user_id);

-- Order items: Users can access items from their orders
CREATE POLICY order_items_select ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY order_items_insert ON order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- Metrics: Users can manage their own metrics
CREATE POLICY metrics_select ON metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY metrics_insert ON metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY metrics_update ON metrics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY metrics_delete ON metrics FOR DELETE USING (auth.uid() = user_id);

-- Performance: Users can manage their own performance data
CREATE POLICY performance_select ON performance_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY performance_insert ON performance_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY performance_update ON performance_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY performance_delete ON performance_entries FOR DELETE USING (auth.uid() = user_id);

-- Insights: Users can access their own insights
CREATE POLICY insights_select ON insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY insights_insert ON insights FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY insights_update ON insights FOR UPDATE USING (auth.uid() = user_id);

-- Reports: Users can access their own reports
CREATE POLICY reports_select ON reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY reports_insert ON reports FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications: Users can access their own notifications
CREATE POLICY notifications_select ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY notifications_update ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY notifications_delete ON notifications FOR DELETE USING (auth.uid() = user_id);

-- User activities: Users can read their own activity log
CREATE POLICY user_activities_select ON user_activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY user_activities_insert ON user_activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Team members: Complex RLS for team access
CREATE POLICY team_members_owner_select ON team_members FOR SELECT USING (auth.uid() = owner_id OR auth.uid() = member_id);
CREATE POLICY team_members_owner_manage ON team_members FOR ALL USING (auth.uid() = owner_id);

-- ============================================================================
-- FUNCTIONS AND VIEWS
-- ============================================================================

-- Function to calculate branch statistics
CREATE OR REPLACE FUNCTION calculate_branch_stats(branch_uuid UUID)
RETURNS TABLE (
  total_revenue DECIMAL,
  total_orders INTEGER,
  avg_order_value DECIMAL,
  last_30_days_revenue DECIMAL,
  growth_rate DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    SUM(o.total) as total_revenue,
    COUNT(o.id)::INTEGER as total_orders,
    AVG(o.total) as avg_order_value,
    SUM(CASE WHEN o.order_date >= CURRENT_DATE - INTERVAL '30 days' THEN o.total ELSE 0 END) as last_30_days_revenue,
    CASE
      WHEN SUM(CASE WHEN o.order_date >= CURRENT_DATE - INTERVAL '60 days' AND o.order_date < CURRENT_DATE - INTERVAL '30 days' THEN o.total ELSE 0 END) > 0
      THEN ((SUM(CASE WHEN o.order_date >= CURRENT_DATE - INTERVAL '30 days' THEN o.total ELSE 0 END) -
             SUM(CASE WHEN o.order_date >= CURRENT_DATE - INTERVAL '60 days' AND o.order_date < CURRENT_DATE - INTERVAL '30 days' THEN o.total ELSE 0 END)) /
            SUM(CASE WHEN o.order_date >= CURRENT_DATE - INTERVAL '60 days' AND o.order_date < CURRENT_DATE - INTERVAL '30 days' THEN o.total ELSE 0 END) * 100)
      ELSE 0
    END as growth_rate
  FROM orders o
  WHERE o.branch_id = branch_uuid AND o.status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- View for daily analytics summary
CREATE OR REPLACE VIEW daily_analytics AS
SELECT
  b.id as branch_id,
  b.name as branch_name,
  o.order_date,
  COUNT(o.id) as order_count,
  SUM(o.total) as total_revenue,
  AVG(o.total) as avg_order_value,
  SUM(o.tax) as total_tax,
  SUM(o.discount) as total_discount
FROM branches b
LEFT JOIN orders o ON b.id = o.branch_id
WHERE o.status = 'completed'
GROUP BY b.id, b.name, o.order_date;

-- ============================================================================
-- SAMPLE DATA FOR TESTING (Optional - Comment out for production)
-- ============================================================================

-- Insert test user profile (will be created by auth system)
-- This is just for reference of the structure

COMMENT ON TABLE user_profiles IS 'User profiles with subscription and role management';
COMMENT ON TABLE branches IS 'Business branches/locations for multi-branch analytics';
COMMENT ON TABLE orders IS 'Transaction orders with financial data';
COMMENT ON TABLE insights IS 'AI-generated insights, predictions, and alerts';
COMMENT ON TABLE metrics IS 'Custom business metrics and KPIs';
COMMENT ON TABLE performance_entries IS 'Aggregated performance data by time period';
COMMENT ON TABLE reports IS 'Generated reports with file storage';
COMMENT ON TABLE notifications IS 'User notifications and alerts';
COMMENT ON TABLE team_members IS 'Team collaboration and access control';
