-- Migration: Add Brand Entity for Single-Brand Multi-Branch Architecture
-- This migration introduces a brand table that serves as the parent entity for branches
-- Each user will have ONE brand with multiple branches under it

-- ============================================================================
-- 1. CREATE BRAND TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS brands (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Brand Identity
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255), -- Legal business name
  description TEXT,
  logo_url TEXT, -- Brand logo/image URL

  -- Brand Colors & Theme
  primary_color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code
  secondary_color VARCHAR(7) DEFAULT '#10B981',
  accent_color VARCHAR(7) DEFAULT '#F59E0B',

  -- Contact & Location
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),

  -- Business Information
  country VARCHAR(100) DEFAULT 'Saudi Arabia',
  headquarters_city VARCHAR(100),
  headquarters_address TEXT,

  -- Business Details
  industry VARCHAR(100), -- e.g., retail, restaurant, hospitality, etc.
  tax_id VARCHAR(100), -- Tax/VAT registration number
  registration_number VARCHAR(100), -- Business registration number

  -- Operational Settings
  currency VARCHAR(3) DEFAULT 'SAR',
  timezone VARCHAR(50) DEFAULT 'Asia/Riyadh',
  language VARCHAR(10) DEFAULT 'en',

  -- Brand Settings (JSONB for flexibility)
  settings JSONB DEFAULT '{}',
  -- Example settings:
  -- {
  --   "invoice_prefix": "INV",
  --   "order_prefix": "ORD",
  --   "fiscal_year_start": "01-01",
  --   "date_format": "DD/MM/YYYY",
  --   "time_format": "24h"
  -- }

  -- Status & Metadata
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_brand UNIQUE (user_id) -- Enforce single brand per user
);

-- Add index for faster queries
CREATE INDEX idx_brands_user_id ON brands(user_id);
CREATE INDEX idx_brands_status ON brands(status);

-- Add trigger for updated_at
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. UPDATE BRANCHES TABLE TO REFERENCE BRAND
-- ============================================================================

-- Add brand_id column to branches table
ALTER TABLE branches
ADD COLUMN brand_id UUID REFERENCES brands(id) ON DELETE CASCADE;

-- Create index for brand_id
CREATE INDEX idx_branches_brand_id ON branches(brand_id);

-- Note: We'll keep user_id temporarily for the data migration
-- After migration, we can optionally remove it or keep it for redundancy

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES FOR BRANDS
-- ============================================================================

-- Enable RLS on brands table
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own brand
CREATE POLICY brands_select_own ON brands
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own brand (only if they don't have one)
CREATE POLICY brands_insert_own ON brands
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (SELECT 1 FROM brands WHERE user_id = auth.uid())
  );

-- Policy: Users can update their own brand
CREATE POLICY brands_update_own ON brands
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own brand (this will cascade to branches)
CREATE POLICY brands_delete_own ON brands
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. UPDATE BRANCHES RLS POLICIES TO WORK WITH BRAND
-- ============================================================================

-- Drop existing branch policies
DROP POLICY IF EXISTS branches_select ON branches;
DROP POLICY IF EXISTS branches_insert ON branches;
DROP POLICY IF EXISTS branches_update ON branches;
DROP POLICY IF EXISTS branches_delete ON branches;

-- New Policy: Users can view branches of their brand
CREATE POLICY branches_select_own ON branches
  FOR SELECT
  USING (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );

-- New Policy: Users can insert branches to their brand
CREATE POLICY branches_insert_own ON branches
  FOR INSERT
  WITH CHECK (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );

-- New Policy: Users can update branches of their brand
CREATE POLICY branches_update_own ON branches
  FOR UPDATE
  USING (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  )
  WITH CHECK (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );

-- New Policy: Users can delete branches of their brand
CREATE POLICY branches_delete_own ON branches
  FOR DELETE
  USING (
    brand_id IN (SELECT id FROM brands WHERE user_id = auth.uid())
  );

-- ============================================================================
-- 5. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to get brand by user
CREATE OR REPLACE FUNCTION get_user_brand(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  logo_url TEXT,
  primary_color VARCHAR,
  settings JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT b.id, b.name, b.logo_url, b.primary_color, b.settings
  FROM brands b
  WHERE b.user_id = user_uuid AND b.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get brand statistics
CREATE OR REPLACE FUNCTION calculate_brand_stats(brand_uuid UUID)
RETURNS TABLE (
  total_branches BIGINT,
  active_branches BIGINT,
  total_revenue NUMERIC,
  total_orders BIGINT,
  avg_order_value NUMERIC,
  last_30_days_revenue NUMERIC,
  growth_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH current_stats AS (
    SELECT
      COUNT(DISTINCT br.id) as branches_count,
      COUNT(DISTINCT CASE WHEN br.status = 'active' THEN br.id END) as active_count,
      COALESCE(SUM(o.total_amount), 0) as revenue,
      COUNT(o.id) as orders_count
    FROM branches br
    LEFT JOIN orders o ON o.branch_id = br.id
    WHERE br.brand_id = brand_uuid
  ),
  last_30_days AS (
    SELECT COALESCE(SUM(o.total_amount), 0) as recent_revenue
    FROM orders o
    INNER JOIN branches br ON br.id = o.branch_id
    WHERE br.brand_id = brand_uuid
      AND o.created_at >= NOW() - INTERVAL '30 days'
  ),
  previous_30_days AS (
    SELECT COALESCE(SUM(o.total_amount), 0) as prev_revenue
    FROM orders o
    INNER JOIN branches br ON br.id = o.branch_id
    WHERE br.brand_id = brand_uuid
      AND o.created_at >= NOW() - INTERVAL '60 days'
      AND o.created_at < NOW() - INTERVAL '30 days'
  )
  SELECT
    cs.branches_count,
    cs.active_count,
    cs.revenue,
    cs.orders_count,
    CASE WHEN cs.orders_count > 0
      THEN ROUND(cs.revenue / cs.orders_count, 2)
      ELSE 0
    END as avg_value,
    l30.recent_revenue,
    CASE WHEN p30.prev_revenue > 0
      THEN ROUND(((l30.recent_revenue - p30.prev_revenue) / p30.prev_revenue * 100), 2)
      ELSE 0
    END as growth
  FROM current_stats cs
  CROSS JOIN last_30_days l30
  CROSS JOIN previous_30_days p30;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE brands IS 'Stores brand identity and settings for single-brand multi-branch architecture';
COMMENT ON COLUMN brands.user_id IS 'Each user has exactly one brand (enforced by unique constraint)';
COMMENT ON COLUMN brands.settings IS 'Flexible JSONB field for brand-specific configuration';
COMMENT ON COLUMN branches.brand_id IS 'References the parent brand - all branches belong to one brand';

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON brands TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON branches TO authenticated;
