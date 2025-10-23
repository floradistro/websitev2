-- ============================================================================
-- MULTI-TIER DISTRIBUTION SYSTEM - AMAZON BUSINESS STYLE
-- Extends existing wholesale system with account tier levels
-- ============================================================================

-- ============================================================================
-- PHASE 1: ADD ACCOUNT TIER SYSTEM
-- ============================================================================

-- Add tier system to vendors table
ALTER TABLE public.vendors 
  ADD COLUMN IF NOT EXISTS account_tier INTEGER DEFAULT 3 CHECK (account_tier IN (1, 2, 3)),
  ADD COLUMN IF NOT EXISTS access_roles TEXT[] DEFAULT ARRAY['vendor'],
  ADD COLUMN IF NOT EXISTS can_access_distributor_pricing BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS distributor_access_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS distributor_access_approved_by UUID REFERENCES public.users(id);

CREATE INDEX IF NOT EXISTS vendors_account_tier_idx ON public.vendors(account_tier);
CREATE INDEX IF NOT EXISTS vendors_access_roles_idx ON public.vendors USING GIN(access_roles);

COMMENT ON COLUMN public.vendors.account_tier IS 'Tier level: 1=Distributor (highest), 2=Wholesale/Vendor, 3=Retail/Customer';
COMMENT ON COLUMN public.vendors.access_roles IS 'Array of roles this account has: [distributor, wholesaler, vendor, customer]';
COMMENT ON COLUMN public.vendors.can_access_distributor_pricing IS 'Whether this vendor can see and buy at distributor prices';

-- Add tier system to customers table
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS account_tier INTEGER DEFAULT 3 CHECK (account_tier IN (1, 2, 3)),
  ADD COLUMN IF NOT EXISTS access_roles TEXT[] DEFAULT ARRAY['customer'];

CREATE INDEX IF NOT EXISTS customers_account_tier_idx ON public.customers(account_tier);
CREATE INDEX IF NOT EXISTS customers_access_roles_idx ON public.customers USING GIN(access_roles);

COMMENT ON COLUMN public.customers.account_tier IS 'Tier level: 1=Distributor (highest), 2=Wholesale, 3=Retail';
COMMENT ON COLUMN public.customers.access_roles IS 'Array of roles this account has';


-- ============================================================================
-- PHASE 2: EXTEND PRICING BLUEPRINTS WITH TIER ASSIGNMENT
-- ============================================================================

-- Add tier assignment to pricing blueprints
ALTER TABLE public.pricing_tier_blueprints
  ADD COLUMN IF NOT EXISTS intended_for_tier INTEGER DEFAULT 3 CHECK (intended_for_tier IN (1, 2, 3)),
  ADD COLUMN IF NOT EXISTS minimum_access_tier INTEGER DEFAULT 3 CHECK (minimum_access_tier IN (1, 2, 3)),
  ADD COLUMN IF NOT EXISTS requires_distributor_access BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS pricing_blueprints_tier_idx ON public.pricing_tier_blueprints(intended_for_tier);
CREATE INDEX IF NOT EXISTS pricing_blueprints_min_tier_idx ON public.pricing_tier_blueprints(minimum_access_tier);

COMMENT ON COLUMN public.pricing_tier_blueprints.intended_for_tier IS 'Which tier this pricing is designed for: 1=Distributor, 2=Wholesale, 3=Retail';
COMMENT ON COLUMN public.pricing_tier_blueprints.minimum_access_tier IS 'Minimum tier level required to see this pricing (1=highest access)';
COMMENT ON COLUMN public.pricing_tier_blueprints.requires_distributor_access IS 'If true, requires explicit distributor access approval';

-- Update existing blueprints with tier assignments
UPDATE public.pricing_tier_blueprints 
SET 
  intended_for_tier = 3,
  minimum_access_tier = 3,
  requires_distributor_access = false
WHERE slug = 'retail-flower';

UPDATE public.pricing_tier_blueprints 
SET 
  intended_for_tier = 2,
  minimum_access_tier = 2,
  requires_distributor_access = false
WHERE slug IN ('wholesale-cost-plus', 'wholesale-tiered');


-- ============================================================================
-- PHASE 3: CREATE DISTRIBUTOR BULK PRICING BLUEPRINT
-- ============================================================================

INSERT INTO public.pricing_tier_blueprints (
  name, 
  slug, 
  description, 
  tier_type,
  price_breaks,
  intended_for_tier,
  minimum_access_tier,
  requires_distributor_access,
  is_active,
  is_default,
  display_order
) VALUES (
  'Distributor Bulk',
  'distributor-bulk',
  'Distributor-only bulk pricing (100+ lbs minimum, invite-only access)',
  'weight',
  '[
    {"break_id": "100lb", "label": "100-499 lbs", "qty": 100, "unit": "lb", "min_qty": 100, "max_qty": 499, "sort_order": 1},
    {"break_id": "500lb", "label": "500+ lbs", "qty": 500, "unit": "lb", "min_qty": 500, "max_qty": null, "sort_order": 2}
  ]'::jsonb,
  1,    -- intended_for_tier: Distributor
  1,    -- minimum_access_tier: Only Tier 1 can see
  true, -- requires_distributor_access
  true, -- is_active
  false, -- is_default (not default for new vendors)
  0     -- display_order (show first)
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_breaks = EXCLUDED.price_breaks,
  intended_for_tier = EXCLUDED.intended_for_tier,
  minimum_access_tier = EXCLUDED.minimum_access_tier,
  requires_distributor_access = EXCLUDED.requires_distributor_access,
  display_order = EXCLUDED.display_order;


-- ============================================================================
-- PHASE 4: PRODUCT TIER VISIBILITY
-- ============================================================================

-- Add tier visibility to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS minimum_tier_required INTEGER DEFAULT 3 CHECK (minimum_tier_required IN (1, 2, 3)),
  ADD COLUMN IF NOT EXISTS distributor_only BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS products_min_tier_idx ON public.products(minimum_tier_required);
CREATE INDEX IF NOT EXISTS products_distributor_only_idx ON public.products(distributor_only) WHERE distributor_only = true;

COMMENT ON COLUMN public.products.minimum_tier_required IS 'Minimum tier level required to see this product: 1=Distributor only, 2=Wholesale+, 3=Public';
COMMENT ON COLUMN public.products.distributor_only IS 'If true, product only visible to distributors (Tier 1)';

-- Update existing wholesale-only products to be Tier 2
UPDATE public.products
SET minimum_tier_required = 2
WHERE wholesale_only = true;

-- Update RLS policy for tier-based visibility
DROP POLICY IF EXISTS "Public can view published products" ON public.products;
DROP POLICY IF EXISTS "Tiered product visibility" ON public.products;

CREATE POLICY "Tiered product visibility"
  ON public.products FOR SELECT
  USING (
    status = 'published' 
    AND (
      -- Case 1: Public retail products (Tier 3) - everyone can see
      (minimum_tier_required = 3 AND NOT distributor_only AND NOT wholesale_only)
      OR
      -- Case 2: Distributor products (Tier 1 only)
      (
        (minimum_tier_required = 1 OR distributor_only = true)
        AND (
          -- Vendors with Tier 1 access
          auth.uid()::text IN (
            SELECT id::text FROM public.vendors 
            WHERE account_tier = 1 AND can_access_distributor_pricing = true
          )
          OR
          -- Customers with Tier 1 access
          auth.uid() IN (
            SELECT auth_user_id FROM public.customers 
            WHERE account_tier = 1
          )
        )
      )
      OR
      -- Case 3: Wholesale products (Tier 2+)
      (
        (minimum_tier_required = 2 OR wholesale_only = true)
        AND (
          -- Vendors with Tier 1 or 2 access
          auth.uid()::text IN (
            SELECT id::text FROM public.vendors 
            WHERE account_tier <= 2
          )
          OR
          -- Wholesale-approved customers
          auth.uid() IN (
            SELECT auth_user_id FROM public.customers 
            WHERE account_tier <= 2 OR is_wholesale_approved = true
          )
        )
      )
      OR
      -- Vendors can always see their own products
      vendor_id IN (
        SELECT id FROM public.vendors WHERE auth.uid()::text = id::text
      )
    )
  );


-- ============================================================================
-- PHASE 5: DISTRIBUTOR ACCESS REQUEST WORKFLOW
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.distributor_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Requestor (vendor or customer)
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
  
  -- Business information
  business_name TEXT NOT NULL,
  business_type TEXT, -- LLC, Corporation, Sole Proprietor, etc.
  business_address JSONB,
  license_number TEXT NOT NULL,
  license_expiry DATE NOT NULL,
  license_document_url TEXT, -- Supabase Storage URL
  tax_id TEXT NOT NULL,
  resale_certificate_url TEXT,
  
  -- Request details
  requested_tier INTEGER NOT NULL CHECK (requested_tier IN (1, 2)),
  current_tier INTEGER NOT NULL DEFAULT 3,
  justification TEXT,
  estimated_monthly_volume TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  
  -- Review
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.users(id),
  review_notes TEXT,
  rejection_reason TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (
    (vendor_id IS NOT NULL AND customer_id IS NULL) OR
    (vendor_id IS NULL AND customer_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS distributor_requests_vendor_idx ON public.distributor_access_requests(vendor_id);
CREATE INDEX IF NOT EXISTS distributor_requests_customer_idx ON public.distributor_access_requests(customer_id);
CREATE INDEX IF NOT EXISTS distributor_requests_status_idx ON public.distributor_access_requests(status);

COMMENT ON TABLE public.distributor_access_requests IS 'Requests for distributor or wholesale tier access approval';

-- Enable RLS
ALTER TABLE public.distributor_access_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests"
  ON public.distributor_access_requests FOR SELECT
  USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text)
    OR
    customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can create requests"
  ON public.distributor_access_requests FOR INSERT
  WITH CHECK (
    vendor_id IN (SELECT id FROM public.vendors WHERE auth.uid()::text = id::text)
    OR
    customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Service role full access to requests"
  ON public.distributor_access_requests FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- Trigger to auto-upgrade tier on approval
CREATE OR REPLACE FUNCTION approve_distributor_access()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Update vendor
    IF NEW.vendor_id IS NOT NULL THEN
      UPDATE public.vendors
      SET 
        account_tier = NEW.requested_tier,
        can_access_distributor_pricing = CASE WHEN NEW.requested_tier = 1 THEN true ELSE can_access_distributor_pricing END,
        distributor_access_approved_at = NOW(),
        distributor_access_approved_by = NEW.reviewed_by,
        distributor_license_number = NEW.license_number,
        distributor_license_expiry = NEW.license_expiry,
        access_roles = CASE 
          WHEN NEW.requested_tier = 1 THEN ARRAY['distributor', 'wholesaler', 'vendor']
          WHEN NEW.requested_tier = 2 THEN ARRAY['wholesaler', 'vendor']
          ELSE access_roles
        END
      WHERE id = NEW.vendor_id;
    END IF;
    
    -- Update customer
    IF NEW.customer_id IS NOT NULL THEN
      UPDATE public.customers
      SET 
        account_tier = NEW.requested_tier,
        is_wholesale_approved = true,
        wholesale_approved_at = NOW(),
        wholesale_approved_by = NEW.reviewed_by,
        wholesale_license_number = NEW.license_number,
        wholesale_license_expiry = NEW.license_expiry,
        wholesale_tax_id = NEW.tax_id,
        access_roles = CASE 
          WHEN NEW.requested_tier = 1 THEN ARRAY['distributor', 'wholesaler', 'customer']
          WHEN NEW.requested_tier = 2 THEN ARRAY['wholesaler', 'customer']
          ELSE access_roles
        END
      WHERE id = NEW.customer_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS approve_distributor_trigger ON public.distributor_access_requests;
CREATE TRIGGER approve_distributor_trigger
  AFTER UPDATE ON public.distributor_access_requests
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION approve_distributor_access();


-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's best tier (lowest number = highest privilege)
CREATE OR REPLACE FUNCTION get_user_best_tier(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_best_tier INTEGER := 3; -- Default to retail
  v_vendor_tier INTEGER;
  v_customer_tier INTEGER;
BEGIN
  -- Check vendors table
  SELECT account_tier INTO v_vendor_tier
  FROM public.vendors
  WHERE id::text = p_user_id::text
  LIMIT 1;
  
  -- Check customers table
  SELECT account_tier INTO v_customer_tier
  FROM public.customers
  WHERE auth_user_id = p_user_id
  LIMIT 1;
  
  -- Return lowest tier number (highest privilege)
  v_best_tier := LEAST(
    COALESCE(v_vendor_tier, 3),
    COALESCE(v_customer_tier, 3)
  );
  
  RETURN v_best_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_best_tier IS 'Returns the best tier level for a user (1=highest access, 3=lowest)';


-- Function to get user's accessible pricing blueprints
CREATE OR REPLACE FUNCTION get_user_accessible_blueprints(p_user_id UUID)
RETURNS TABLE (
  blueprint_id UUID,
  blueprint_name TEXT,
  blueprint_slug TEXT,
  tier_type TEXT,
  minimum_access_tier INTEGER,
  requires_approval BOOLEAN
) AS $$
DECLARE
  v_user_tier INTEGER;
BEGIN
  -- Get user's tier
  v_user_tier := get_user_best_tier(p_user_id);
  
  -- Return blueprints they can access
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.slug,
    b.tier_type,
    b.minimum_access_tier,
    b.requires_distributor_access
  FROM public.pricing_tier_blueprints b
  WHERE b.is_active = true
    AND b.minimum_access_tier >= v_user_tier
  ORDER BY b.display_order, b.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_accessible_blueprints IS 'Returns all pricing blueprints a user has access to based on their tier';


-- Function to check if user can access distributor pricing
CREATE OR REPLACE FUNCTION can_access_distributor_pricing(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.vendors 
    WHERE id::text = p_user_id::text 
      AND account_tier = 1 
      AND can_access_distributor_pricing = true
  ) OR EXISTS (
    SELECT 1 FROM public.customers 
    WHERE auth_user_id = p_user_id 
      AND account_tier = 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- UPDATE EXISTING DATA
-- ============================================================================

-- Set vendors with distributor type to Tier 1
UPDATE public.vendors
SET 
  account_tier = 1,
  access_roles = ARRAY['distributor', 'wholesaler', 'vendor'],
  can_access_distributor_pricing = true
WHERE vendor_type IN ('distributor', 'both');

-- Set standard vendors to Tier 2
UPDATE public.vendors
SET 
  account_tier = 2,
  access_roles = ARRAY['wholesaler', 'vendor']
WHERE vendor_type = 'standard' AND wholesale_enabled = true;

-- Set non-wholesale vendors to Tier 3
UPDATE public.vendors
SET 
  account_tier = 3,
  access_roles = ARRAY['vendor']
WHERE vendor_type = 'standard' AND (wholesale_enabled = false OR wholesale_enabled IS NULL);

-- Set wholesale-approved customers to Tier 2
UPDATE public.customers
SET 
  account_tier = 2,
  access_roles = ARRAY['wholesaler', 'customer']
WHERE is_wholesale_approved = true;

-- Set regular customers to Tier 3
UPDATE public.customers
SET 
  account_tier = 3,
  access_roles = ARRAY['customer']
WHERE is_wholesale_approved = false OR is_wholesale_approved IS NULL;


-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON public.distributor_access_requests TO authenticated, service_role;


-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

CREATE OR REPLACE VIEW public.vendor_tier_summary AS
SELECT 
  account_tier,
  CASE 
    WHEN account_tier = 1 THEN 'Distributor'
    WHEN account_tier = 2 THEN 'Wholesale/Vendor'
    WHEN account_tier = 3 THEN 'Retail Vendor'
  END as tier_name,
  COUNT(*) as vendor_count,
  COUNT(*) FILTER (WHERE can_access_distributor_pricing = true) as with_distributor_access,
  COUNT(*) FILTER (WHERE status = 'active') as active_count
FROM public.vendors
GROUP BY account_tier
ORDER BY account_tier;

COMMENT ON VIEW public.vendor_tier_summary IS 'Summary of vendors by tier level';


-- ============================================================================
-- COMPLETE ✅
-- ============================================================================

-- Display summary
DO $$
BEGIN
  RAISE NOTICE '✅ Multi-Tier Distribution System Installed!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tier Structure:';
  RAISE NOTICE '  - Tier 1 (Distributor): Lowest prices, highest minimums, invite-only';
  RAISE NOTICE '  - Tier 2 (Wholesale): Mid-tier pricing, business accounts';
  RAISE NOTICE '  - Tier 3 (Retail): Public pricing, low minimums';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Pricing Blueprints:';
  RAISE NOTICE '  - Distributor Bulk (Tier 1 only)';
  RAISE NOTICE '  - Wholesale Tiered (Tier 2+)';
  RAISE NOTICE '  - Retail Flower (Tier 3 - Public)';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Next Steps:';
  RAISE NOTICE '  1. Configure distributor pricing for your products';
  RAISE NOTICE '  2. Update frontend to show tier badges';
  RAISE NOTICE '  3. Add distributor access request UI';
END $$;

