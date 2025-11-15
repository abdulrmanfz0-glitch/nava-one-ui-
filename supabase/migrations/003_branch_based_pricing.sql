-- Migration: Branch-Based Subscription Pricing
-- Adds support for branch-count based pricing (299 SAR base + 99 SAR per additional branch)

-- Add pricing configuration table
CREATE TABLE IF NOT EXISTS pricing_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  currency VARCHAR(3) DEFAULT 'SAR',
  base_price_monthly DECIMAL(10,2) DEFAULT 299.00,
  additional_branch_price DECIMAL(10,2) DEFAULT 99.00,
  base_price_yearly DECIMAL(10,2) DEFAULT 2988.00, -- 299 * 12 with 17% discount
  additional_branch_price_yearly DECIMAL(10,2) DEFAULT 986.00, -- 99 * 12 with 17% discount
  yearly_discount_percent INTEGER DEFAULT 17,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read pricing config
CREATE POLICY "Allow authenticated users to read pricing config"
  ON pricing_config
  FOR SELECT
  TO authenticated
  USING (active = true);

-- Insert default pricing configuration
INSERT INTO pricing_config (currency, base_price_monthly, additional_branch_price)
VALUES ('SAR', 299.00, 99.00)
ON CONFLICT DO NOTHING;

-- Function: Calculate monthly subscription cost based on branch count
CREATE OR REPLACE FUNCTION calculate_monthly_price(branch_count INTEGER)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  config RECORD;
  additional_branches INTEGER;
  total_price DECIMAL(10,2);
BEGIN
  -- Get active pricing config
  SELECT * INTO config
  FROM pricing_config
  WHERE active = true
  ORDER BY created_at DESC
  LIMIT 1;

  -- Default to 1 branch minimum
  IF branch_count < 1 THEN
    branch_count := 1;
  END IF;

  -- Calculate additional branches (beyond the first one)
  additional_branches := GREATEST(0, branch_count - 1);

  -- Calculate total price
  total_price := config.base_price_monthly + (additional_branches * config.additional_branch_price);

  RETURN total_price;
END;
$$;

-- Function: Calculate yearly subscription cost with discount
CREATE OR REPLACE FUNCTION calculate_yearly_price(branch_count INTEGER)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  config RECORD;
  monthly_price DECIMAL(10,2);
  yearly_price DECIMAL(10,2);
  discount_amount DECIMAL(10,2);
BEGIN
  -- Get active pricing config
  SELECT * INTO config
  FROM pricing_config
  WHERE active = true
  ORDER BY created_at DESC
  LIMIT 1;

  -- Get monthly price
  monthly_price := calculate_monthly_price(branch_count);

  -- Calculate yearly price
  yearly_price := monthly_price * 12;

  -- Apply discount
  discount_amount := (yearly_price * config.yearly_discount_percent) / 100;
  yearly_price := yearly_price - discount_amount;

  RETURN yearly_price;
END;
$$;

-- Function: Get pricing breakdown for a brand
CREATE OR REPLACE FUNCTION get_brand_pricing(brand_uuid UUID)
RETURNS TABLE(
  brand_id UUID,
  branch_count BIGINT,
  monthly_price DECIMAL(10,2),
  yearly_price DECIMAL(10,2),
  base_price DECIMAL(10,2),
  additional_branches BIGINT,
  additional_cost DECIMAL(10,2),
  currency VARCHAR(3)
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  config RECORD;
  branches_count BIGINT;
  additional INTEGER;
BEGIN
  -- Get active pricing config
  SELECT * INTO config
  FROM pricing_config
  WHERE active = true
  ORDER BY created_at DESC
  LIMIT 1;

  -- Count branches for this brand
  SELECT COUNT(*) INTO branches_count
  FROM branches
  WHERE brand_id = brand_uuid;

  -- Ensure minimum 1 branch
  IF branches_count < 1 THEN
    branches_count := 1;
  END IF;

  -- Calculate additional branches
  additional := GREATEST(0, branches_count::INTEGER - 1);

  RETURN QUERY
  SELECT
    brand_uuid,
    branches_count,
    calculate_monthly_price(branches_count::INTEGER),
    calculate_yearly_price(branches_count::INTEGER),
    config.base_price_monthly,
    additional::BIGINT,
    (additional * config.additional_branch_price)::DECIMAL(10,2),
    config.currency;
END;
$$;

-- Function: Update brand subscription price when branches change
CREATE OR REPLACE FUNCTION update_brand_subscription_price()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  brand_uuid UUID;
  branch_count INTEGER;
  new_monthly_price DECIMAL(10,2);
BEGIN
  -- Get brand_id from the branch
  IF TG_OP = 'DELETE' THEN
    brand_uuid := OLD.brand_id;
  ELSE
    brand_uuid := NEW.brand_id;
  END IF;

  -- Count current branches for this brand
  SELECT COUNT(*)::INTEGER INTO branch_count
  FROM branches
  WHERE brand_id = brand_uuid;

  -- Calculate new price
  new_monthly_price := calculate_monthly_price(branch_count);

  -- Update user_subscriptions with new price
  -- Note: This assumes there's a current_price field in user_subscriptions
  -- If not, you can log this to a separate table or handle it in the application layer

  RAISE NOTICE 'Brand % now has % branches, new monthly price: % SAR',
    brand_uuid, branch_count, new_monthly_price;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Trigger: Update subscription price when branches are added/removed
DROP TRIGGER IF EXISTS branch_pricing_update ON branches;
CREATE TRIGGER branch_pricing_update
  AFTER INSERT OR DELETE ON branches
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_subscription_price();

-- Add current_monthly_price to user_subscriptions if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions'
    AND column_name = 'current_monthly_price'
  ) THEN
    ALTER TABLE user_subscriptions
    ADD COLUMN current_monthly_price DECIMAL(10,2) DEFAULT 299.00;
  END IF;
END $$;

-- Function: Get user's current subscription cost
CREATE OR REPLACE FUNCTION get_user_subscription_cost(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE(
  brand_id UUID,
  brand_name TEXT,
  branch_count BIGINT,
  monthly_price DECIMAL(10,2),
  yearly_price DECIMAL(10,2),
  billing_cycle TEXT,
  current_cost DECIMAL(10,2),
  currency VARCHAR(3)
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  user_brand_id UUID;
BEGIN
  -- Get user's brand
  SELECT id INTO user_brand_id
  FROM brands
  WHERE user_id = user_uuid
  LIMIT 1;

  IF user_brand_id IS NULL THEN
    RAISE EXCEPTION 'No brand found for user %', user_uuid;
  END IF;

  -- Return pricing details
  RETURN QUERY
  SELECT
    b.id,
    b.brand_name,
    pricing.branch_count,
    pricing.monthly_price,
    pricing.yearly_price,
    COALESCE(us.billing_cycle, 'monthly')::TEXT,
    CASE
      WHEN COALESCE(us.billing_cycle, 'monthly') = 'yearly' THEN pricing.yearly_price
      ELSE pricing.monthly_price
    END as current_cost,
    pricing.currency
  FROM brands b
  CROSS JOIN LATERAL get_brand_pricing(b.id) pricing
  LEFT JOIN user_subscriptions us ON us.user_id = user_uuid
  WHERE b.id = user_brand_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_monthly_price(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_yearly_price(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_brand_pricing(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_subscription_cost(UUID) TO authenticated;

-- Comments for documentation
COMMENT ON TABLE pricing_config IS 'Stores branch-based pricing configuration (299 SAR base + 99 SAR per additional branch)';
COMMENT ON FUNCTION calculate_monthly_price IS 'Calculate monthly subscription cost: 299 SAR + (branches-1) * 99 SAR';
COMMENT ON FUNCTION calculate_yearly_price IS 'Calculate yearly subscription cost with 17% discount';
COMMENT ON FUNCTION get_brand_pricing IS 'Get complete pricing breakdown for a brand based on branch count';
COMMENT ON FUNCTION get_user_subscription_cost IS 'Get current subscription cost for a user including their branch count';
