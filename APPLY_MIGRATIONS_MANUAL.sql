-- ============================================================================
-- NAVA OPS: Brand Architecture Migration
-- ============================================================================
-- INSTRUCTIONS:
-- 1. Go to https://app.supabase.com
-- 2. Select your project
-- 3. Navigate to SQL Editor
-- 4. Copy this ENTIRE file and paste it into the SQL Editor
-- 5. Click "Run" to execute all migrations
-- ============================================================================

-- ============================================================================
-- MIGRATION 1: Add Brand Entity
-- ============================================================================

-- CREATE BRAND TABLE
CREATE TABLE IF NOT EXISTS brands (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Brand Identity
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  description TEXT,
  logo_url TEXT,

  -- Brand Colors & Theme
  primary_color VARCHAR(7) DEFAULT '#3B82F6',
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
  industry VARCHAR(100),
  tax_id VARCHAR(100),
  registration_number VARCHAR(100),

  -- Operational Settings
  currency VARCHAR(3) DEFAULT 'SAR',
  timezone VARCHAR(50) DEFAULT 'Asia/Riyadh',
  language VARCHAR(10) DEFAULT 'en',

  -- Brand Settings (JSONB for flexibility)
  settings JSONB DEFAULT '{}',

  -- Status & Metadata
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_brand UNIQUE (user_id)
);

-- Add indexes
CREATE INDEX idx_brands_user_id ON brands(user_id);
CREATE INDEX idx_brands_status ON brands(status);

-- Add trigger for updated_at
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- UPDATE BRANCHES TABLE
ALTER TABLE branches
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE CASCADE;

-- Create index for brand_id
CREATE INDEX IF NOT EXISTS idx_branches_brand_id ON branches(brand_id);

-- ROW LEVEL SECURITY FOR BRANDS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS brands_select_own ON brands;
DROP POLICY IF EXISTS brands_insert_own ON brands;
DROP POLICY IF EXISTS brands_update_own ON brands;
DROP POLICY IF EXISTS brands_delete_own ON brands;

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

-- Policy: Users can delete their own brand
CREATE POLICY brands_delete_own ON brands
  FOR DELETE
  USING (auth.uid() = user_id);

-- UPDATE BRANCHES RLS POLICIES
DROP POLICY IF EXISTS branches_select ON branches;
DROP POLICY IF EXISTS branches_insert ON branches;
DROP POLICY IF EXISTS branches_update ON branches;
DROP POLICY IF EXISTS branches_delete ON branches;
DROP POLICY IF EXISTS branches_select_own ON branches;
DROP POLICY IF EXISTS branches_insert_own ON branches;
DROP POLICY IF EXISTS branches_update_own ON branches;
DROP POLICY IF EXISTS branches_delete_own ON branches;

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

-- HELPER FUNCTIONS
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

-- ADD COMMENTS
COMMENT ON TABLE brands IS 'Stores brand identity and settings for single-brand multi-branch architecture';
COMMENT ON COLUMN brands.user_id IS 'Each user has exactly one brand (enforced by unique constraint)';
COMMENT ON COLUMN brands.settings IS 'Flexible JSONB field for brand-specific configuration';
COMMENT ON COLUMN branches.brand_id IS 'References the parent brand - all branches belong to one brand';

-- GRANT PERMISSIONS
GRANT SELECT, INSERT, UPDATE, DELETE ON brands TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON branches TO authenticated;

-- ============================================================================
-- MIGRATION 2: Migrate Existing Data to Brands
-- ============================================================================

DO $$
DECLARE
  user_record RECORD;
  new_brand_id UUID;
  user_email_local TEXT;
  brand_name TEXT;
  branches_updated INTEGER := 0;
BEGIN
  -- Loop through each user who has branches
  FOR user_record IN
    SELECT DISTINCT b.user_id, up.email, up.full_name
    FROM branches b
    INNER JOIN user_profiles up ON up.id = b.user_id
    WHERE b.brand_id IS NULL
  LOOP
    -- Extract local part of email for brand name
    user_email_local := SPLIT_PART(user_record.email, '@', 1);

    -- Determine brand name (prefer full_name, fallback to email-based name)
    IF user_record.full_name IS NOT NULL AND user_record.full_name != '' THEN
      brand_name := user_record.full_name || '''s Brand';
    ELSE
      brand_name := INITCAP(REPLACE(user_email_local, '.', ' ')) || '''s Brand';
    END IF;

    -- Create a default brand for this user
    INSERT INTO brands (
      user_id,
      name,
      legal_name,
      description,
      status,
      country,
      currency,
      timezone,
      language,
      primary_color,
      secondary_color,
      accent_color,
      settings
    )
    VALUES (
      user_record.user_id,
      brand_name,
      brand_name,
      'Default brand created during migration',
      'active',
      'Saudi Arabia',
      'SAR',
      'Asia/Riyadh',
      'en',
      '#3B82F6',
      '#10B981',
      '#F59E0B',
      '{
        "invoice_prefix": "INV",
        "order_prefix": "ORD",
        "fiscal_year_start": "01-01",
        "date_format": "DD/MM/YYYY",
        "time_format": "24h"
      }'::jsonb
    )
    RETURNING id INTO new_brand_id;

    -- Update all branches for this user to belong to the new brand
    UPDATE branches
    SET brand_id = new_brand_id,
        updated_at = NOW()
    WHERE user_id = user_record.user_id
      AND brand_id IS NULL;

    GET DIAGNOSTICS branches_updated = ROW_COUNT;

    RAISE NOTICE 'Created brand % (ID: %) for user % with % branches',
      brand_name,
      new_brand_id,
      user_record.user_id,
      branches_updated;
  END LOOP;
END $$;

-- MAKE BRAND_ID REQUIRED
DO $$
BEGIN
  -- Only add NOT NULL constraint if no branches have NULL brand_id
  IF NOT EXISTS (SELECT 1 FROM branches WHERE brand_id IS NULL) THEN
    ALTER TABLE branches ALTER COLUMN brand_id SET NOT NULL;
    RAISE NOTICE 'brand_id column set to NOT NULL';
  ELSE
    RAISE WARNING 'Some branches still have NULL brand_id - skipping NOT NULL constraint';
  END IF;
END $$;

-- VERIFY DATA INTEGRITY
DO $$
DECLARE
  orphan_count INT;
  multi_brand_users INT;
BEGIN
  -- Check branches without brand
  SELECT COUNT(*) INTO orphan_count
  FROM branches
  WHERE brand_id IS NULL;

  IF orphan_count > 0 THEN
    RAISE WARNING 'Data migration incomplete: % branches without brand_id', orphan_count;
  ELSE
    RAISE NOTICE 'Data migration successful: All branches now belong to a brand';
  END IF;

  -- Check for multi-brand users
  SELECT COUNT(*) INTO multi_brand_users
  FROM (
    SELECT user_id
    FROM brands
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) AS duplicates;

  IF multi_brand_users > 0 THEN
    RAISE WARNING '% users have multiple brands - this should be reviewed', multi_brand_users;
  ELSE
    RAISE NOTICE 'Verification successful: All users have exactly one brand';
  END IF;
END $$;

-- UPDATE USER PROFILES
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS has_brand BOOLEAN DEFAULT FALSE;

UPDATE user_profiles up
SET has_brand = TRUE
WHERE EXISTS (
  SELECT 1 FROM brands b WHERE b.user_id = up.id
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_has_brand ON user_profiles(has_brand) WHERE has_brand = TRUE;

-- MIGRATION SUMMARY
DO $$
DECLARE
  total_brands INT;
  total_branches INT;
  total_users INT;
BEGIN
  SELECT COUNT(*) INTO total_brands FROM brands;
  SELECT COUNT(*) INTO total_branches FROM branches;
  SELECT COUNT(DISTINCT user_id) INTO total_users FROM brands;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'BRAND MIGRATION SUMMARY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total brands created: %', total_brands;
  RAISE NOTICE 'Total branches migrated: %', total_branches;
  RAISE NOTICE 'Total users with brands: %', total_users;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'You can now access Brand Settings at: /brand-settings';
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
