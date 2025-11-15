-- Migration: Convert Existing Branches to Brand-Branch Architecture
-- This migration creates a default brand for each user and associates their existing branches with it

-- ============================================================================
-- 1. CREATE DEFAULT BRAND FOR EACH USER WITH BRANCHES
-- ============================================================================

DO $$
DECLARE
  user_record RECORD;
  new_brand_id UUID;
  user_email_local TEXT;
  brand_name TEXT;
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

    RAISE NOTICE 'Created brand % (ID: %) for user % with % branches',
      brand_name,
      new_brand_id,
      user_record.user_id,
      (SELECT COUNT(*) FROM branches WHERE brand_id = new_brand_id);
  END LOOP;
END $$;

-- ============================================================================
-- 2. MAKE BRAND_ID REQUIRED IN BRANCHES TABLE
-- ============================================================================

-- Now that all branches have a brand_id, make it NOT NULL
ALTER TABLE branches
ALTER COLUMN brand_id SET NOT NULL;

-- ============================================================================
-- 3. VERIFY DATA INTEGRITY
-- ============================================================================

-- Check that all branches now have a brand
DO $$
DECLARE
  orphan_count INT;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM branches
  WHERE brand_id IS NULL;

  IF orphan_count > 0 THEN
    RAISE EXCEPTION 'Data migration failed: % branches without brand_id', orphan_count;
  ELSE
    RAISE NOTICE 'Data migration successful: All branches now belong to a brand';
  END IF;
END $$;

-- Check that each user has exactly one brand
DO $$
DECLARE
  multi_brand_users INT;
BEGIN
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

-- ============================================================================
-- 4. UPDATE USER PROFILES WITH BRAND INFORMATION
-- ============================================================================

-- Add brand-related metadata to user profiles (optional, for quick access)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS has_brand BOOLEAN DEFAULT FALSE;

-- Update has_brand flag
UPDATE user_profiles up
SET has_brand = TRUE
WHERE EXISTS (
  SELECT 1 FROM brands b WHERE b.user_id = up.id
);

-- Create index for quick brand lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_has_brand ON user_profiles(has_brand) WHERE has_brand = TRUE;

-- ============================================================================
-- 5. MIGRATION SUMMARY
-- ============================================================================

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
END $$;
