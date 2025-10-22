-- ============================================================================
-- VENDOR PRICING TIER SYSTEM
-- Platform defines pricing blueprints, vendors configure their prices
-- ============================================================================

-- ============================================================================
-- PRICING TIER BLUEPRINTS (Platform-Defined)
-- Similar to field_groups - admin defines the structure
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pricing_tier_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  name TEXT UNIQUE NOT NULL, -- "Retail Cannabis Flower", "Wholesale Tiers", "Medical Patient"
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  
  -- Tier configuration (weight-based, quantity-based, etc.)
  tier_type TEXT DEFAULT 'weight' CHECK (tier_type IN ('weight', 'quantity', 'percentage', 'flat', 'custom')),
  
  -- Price breaks definition
  price_breaks JSONB NOT NULL DEFAULT '[]',
  -- Example for weight-based:
  -- [
  --   {"break_id": "1g", "label": "1 gram", "qty": 1, "unit": "g", "sort_order": 1},
  --   {"break_id": "3_5g", "label": "Eighth (3.5g)", "qty": 3.5, "unit": "g", "sort_order": 2},
  --   {"break_id": "7g", "label": "Quarter (7g)", "qty": 7, "unit": "g", "sort_order": 3},
  --   {"break_id": "14g", "label": "Half (14g)", "qty": 14, "unit": "g", "sort_order": 4},
  --   {"break_id": "28g", "label": "Ounce (28g)", "qty": 28, "unit": "g", "sort_order": 5}
  -- ]
  --
  -- Example for quantity-based:
  -- [
  --   {"break_id": "tier_1", "label": "Wholesale Tier 1", "min_qty": 10, "max_qty": 49, "sort_order": 1},
  --   {"break_id": "tier_2", "label": "Wholesale Tier 2", "min_qty": 50, "max_qty": 99, "sort_order": 2},
  --   {"break_id": "tier_3", "label": "Bulk", "min_qty": 100, "max_qty": null, "sort_order": 3}
  -- ]
  
  -- Display & Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- Default blueprint for new vendors
  display_order INTEGER DEFAULT 0,
  
  -- Category assignment (optional - some blueprints only for certain categories)
  applicable_to_categories UUID[] DEFAULT '{}', -- Empty = all categories
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS pricing_blueprints_slug_idx ON public.pricing_tier_blueprints(slug);
CREATE INDEX IF NOT EXISTS pricing_blueprints_active_idx ON public.pricing_tier_blueprints(is_active);
CREATE INDEX IF NOT EXISTS pricing_blueprints_default_idx ON public.pricing_tier_blueprints(is_default);

COMMENT ON TABLE public.pricing_tier_blueprints IS 'Platform-defined pricing structures that vendors can configure';
COMMENT ON COLUMN public.pricing_tier_blueprints.price_breaks IS 'Array of price break definitions with IDs, labels, quantities';


-- ============================================================================
-- VENDOR PRICING CONFIGURATIONS
-- Each vendor sets their prices for each blueprint
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vendor_pricing_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  blueprint_id UUID NOT NULL REFERENCES public.pricing_tier_blueprints(id) ON DELETE CASCADE,
  
  -- Vendor's pricing for this blueprint
  pricing_values JSONB NOT NULL DEFAULT '{}',
  -- Example (keyed by break_id from blueprint):
  -- {
  --   "1g": {"price": "15.00", "enabled": true},
  --   "3_5g": {"price": "45.00", "enabled": true},
  --   "7g": {"price": "80.00", "enabled": true},
  --   "14g": {"price": "150.00", "enabled": true},
  --   "28g": {"price": "280.00", "enabled": true}
  -- }
  --
  -- For quantity-based:
  -- {
  --   "tier_1": {"price": "35.00", "discount_percent": "15", "enabled": true},
  --   "tier_2": {"price": "30.00", "discount_percent": "25", "enabled": true},
  --   "tier_3": {"price": "25.00", "discount_percent": "35", "enabled": true}
  -- }
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Notes
  notes TEXT, -- Vendor can add notes about their pricing strategy
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(vendor_id, blueprint_id)
);

CREATE INDEX IF NOT EXISTS vendor_pricing_vendor_idx ON public.vendor_pricing_configs(vendor_id);
CREATE INDEX IF NOT EXISTS vendor_pricing_blueprint_idx ON public.vendor_pricing_configs(blueprint_id);
CREATE INDEX IF NOT EXISTS vendor_pricing_active_idx ON public.vendor_pricing_configs(is_active);

COMMENT ON TABLE public.vendor_pricing_configs IS 'Vendor-specific pricing for each blueprint';
COMMENT ON COLUMN public.vendor_pricing_configs.pricing_values IS 'Vendor prices keyed by break_id from blueprint';


-- ============================================================================
-- PRODUCT PRICING TIER ASSIGNMENTS
-- Assign pricing blueprint to products (with optional overrides)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_pricing_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  blueprint_id UUID NOT NULL REFERENCES public.pricing_tier_blueprints(id) ON DELETE CASCADE,
  
  -- Optional: Product-specific price overrides
  price_overrides JSONB DEFAULT '{}',
  -- If set, these override the vendor's default config for this specific product
  -- Same structure as pricing_values
  -- Example: {"1g": {"price": "17.00"}} - only override 1g, rest use vendor config
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES public.users(id),
  
  UNIQUE(product_id, blueprint_id)
);

CREATE INDEX IF NOT EXISTS product_pricing_product_idx ON public.product_pricing_assignments(product_id);
CREATE INDEX IF NOT EXISTS product_pricing_blueprint_idx ON public.product_pricing_assignments(blueprint_id);
CREATE INDEX IF NOT EXISTS product_pricing_active_idx ON public.product_pricing_assignments(is_active);

COMMENT ON TABLE public.product_pricing_assignments IS 'Assign pricing blueprints to products with optional overrides';


-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get vendor's configured pricing for a blueprint
CREATE OR REPLACE FUNCTION public.get_vendor_pricing(
  p_vendor_id UUID,
  p_blueprint_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_pricing JSONB;
BEGIN
  SELECT pricing_values INTO v_pricing
  FROM public.vendor_pricing_configs
  WHERE vendor_id = p_vendor_id
    AND blueprint_id = p_blueprint_id
    AND is_active = true;
    
  RETURN COALESCE(v_pricing, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Get product's full pricing (vendor config + product overrides)
CREATE OR REPLACE FUNCTION public.get_product_pricing(
  p_product_id UUID,
  p_blueprint_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_vendor_id UUID;
  v_vendor_pricing JSONB;
  v_product_overrides JSONB;
  v_final_pricing JSONB;
BEGIN
  -- Get vendor_id from product
  SELECT vendor_id INTO v_vendor_id
  FROM public.products
  WHERE id = p_product_id;
  
  -- Get vendor's base pricing
  v_vendor_pricing := public.get_vendor_pricing(v_vendor_id, p_blueprint_id);
  
  -- Get product-specific overrides
  SELECT price_overrides INTO v_product_overrides
  FROM public.product_pricing_assignments
  WHERE product_id = p_product_id
    AND blueprint_id = p_blueprint_id
    AND is_active = true;
  
  -- Merge: vendor pricing + product overrides
  v_final_pricing := v_vendor_pricing || COALESCE(v_product_overrides, '{}'::JSONB);
  
  RETURN v_final_pricing;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Get all pricing for a product (all assigned blueprints)
CREATE OR REPLACE FUNCTION public.get_product_all_pricing(p_product_id UUID)
RETURNS TABLE (
  blueprint_id UUID,
  blueprint_name TEXT,
  blueprint_slug TEXT,
  tier_type TEXT,
  price_breaks JSONB,
  pricing JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.slug,
    b.tier_type,
    b.price_breaks,
    public.get_product_pricing(p_product_id, b.id) as pricing
  FROM public.pricing_tier_blueprints b
  JOIN public.product_pricing_assignments pa ON pa.blueprint_id = b.id
  WHERE pa.product_id = p_product_id
    AND pa.is_active = true
    AND b.is_active = true
  ORDER BY b.display_order, b.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- Vendor pricing comparison view (for market research)
CREATE OR REPLACE VIEW public.vendor_pricing_comparison AS
SELECT 
  b.name as blueprint_name,
  b.slug as blueprint_slug,
  b.tier_type,
  v.id as vendor_id,
  v.store_name as vendor_name,
  v.slug as vendor_slug,
  vpc.pricing_values,
  vpc.is_active,
  vpc.updated_at
FROM public.pricing_tier_blueprints b
JOIN public.vendor_pricing_configs vpc ON vpc.blueprint_id = b.id
JOIN public.vendors v ON v.id = vpc.vendor_id
WHERE b.is_active = true
  AND vpc.is_active = true
ORDER BY b.display_order, v.store_name;

COMMENT ON VIEW public.vendor_pricing_comparison IS 'Compare pricing across vendors for each blueprint';


-- Product pricing overview
CREATE OR REPLACE VIEW public.product_pricing_overview AS
SELECT 
  p.id as product_id,
  p.name as product_name,
  p.slug as product_slug,
  p.vendor_id,
  v.store_name as vendor_name,
  b.id as blueprint_id,
  b.name as blueprint_name,
  b.tier_type,
  public.get_product_pricing(p.id, b.id) as pricing
FROM public.products p
LEFT JOIN public.vendors v ON v.id = p.vendor_id
JOIN public.product_pricing_assignments pa ON pa.product_id = p.id
JOIN public.pricing_tier_blueprints b ON b.id = pa.blueprint_id
WHERE pa.is_active = true
  AND b.is_active = true;

COMMENT ON VIEW public.product_pricing_overview IS 'All products with their configured pricing';


-- ============================================================================
-- DEFAULT PRICING BLUEPRINTS (Cannabis Industry)
-- ============================================================================

-- Blueprint 1: Retail Cannabis Flower (Weight-based)
INSERT INTO public.pricing_tier_blueprints (name, slug, description, tier_type, price_breaks, is_default, display_order) VALUES
('Retail Cannabis Flower', 'retail-flower', 'Standard weight-based pricing for flower products', 'weight', '[
  {"break_id": "1g", "label": "1 gram", "qty": 1, "unit": "g", "sort_order": 1},
  {"break_id": "3_5g", "label": "Eighth (3.5g)", "qty": 3.5, "unit": "g", "sort_order": 2},
  {"break_id": "7g", "label": "Quarter (7g)", "qty": 7, "unit": "g", "sort_order": 3},
  {"break_id": "14g", "label": "Half Ounce (14g)", "qty": 14, "unit": "g", "sort_order": 4},
  {"break_id": "28g", "label": "Ounce (28g)", "qty": 28, "unit": "g", "sort_order": 5}
]'::JSONB, true, 1)
ON CONFLICT (slug) DO NOTHING;

-- Blueprint 2: Wholesale Quantity Tiers
INSERT INTO public.pricing_tier_blueprints (name, slug, description, tier_type, price_breaks, is_default, display_order) VALUES
('Wholesale Tiers', 'wholesale-tiers', 'Quantity-based wholesale pricing', 'quantity', '[
  {"break_id": "retail", "label": "Retail (1-9 units)", "min_qty": 1, "max_qty": 9, "sort_order": 1},
  {"break_id": "tier_1", "label": "Wholesale Tier 1 (10-49 units)", "min_qty": 10, "max_qty": 49, "discount_expected": 15, "sort_order": 2},
  {"break_id": "tier_2", "label": "Wholesale Tier 2 (50-99 units)", "min_qty": 50, "max_qty": 99, "discount_expected": 25, "sort_order": 3},
  {"break_id": "tier_3", "label": "Bulk (100+ units)", "min_qty": 100, "max_qty": null, "discount_expected": 35, "sort_order": 4}
]'::JSONB, false, 2)
ON CONFLICT (slug) DO NOTHING;

-- Blueprint 3: Medical Patient Pricing
INSERT INTO public.pricing_tier_blueprints (name, slug, description, tier_type, price_breaks, is_default, display_order) VALUES
('Medical Patient Discount', 'medical-patient', 'Discounted pricing for medical cardholders', 'percentage', '[
  {"break_id": "medical", "label": "Medical Patient Price", "discount_percent": 20, "sort_order": 1}
]'::JSONB, false, 3)
ON CONFLICT (slug) DO NOTHING;

-- Blueprint 4: Staff/Employee Pricing
INSERT INTO public.pricing_tier_blueprints (name, slug, description, tier_type, price_breaks, is_default, display_order) VALUES
('Staff Discount', 'staff-discount', 'Employee/staff discount pricing', 'percentage', '[
  {"break_id": "staff", "label": "Staff Price", "discount_percent": 30, "sort_order": 1}
]'::JSONB, false, 4)
ON CONFLICT (slug) DO NOTHING;

-- Blueprint 5: Concentrates (Weight-based, smaller quantities)
INSERT INTO public.pricing_tier_blueprints (name, slug, description, tier_type, price_breaks, is_default, display_order) VALUES
('Retail Concentrates', 'retail-concentrates', 'Weight-based pricing for concentrates', 'weight', '[
  {"break_id": "0_5g", "label": "Half Gram (0.5g)", "qty": 0.5, "unit": "g", "sort_order": 1},
  {"break_id": "1g", "label": "1 Gram", "qty": 1, "unit": "g", "sort_order": 2},
  {"break_id": "2g", "label": "2 Grams", "qty": 2, "unit": "g", "sort_order": 3},
  {"break_id": "3_5g", "label": "Eighth (3.5g)", "qty": 3.5, "unit": "g", "sort_order": 4}
]'::JSONB, false, 5)
ON CONFLICT (slug) DO NOTHING;


-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.pricing_tier_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_pricing_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_pricing_assignments ENABLE ROW LEVEL SECURITY;

-- Anyone can view active blueprints
CREATE POLICY "Anyone can view active blueprints"
  ON public.pricing_tier_blueprints FOR SELECT
  USING (is_active = true);

-- Service role full access to blueprints
CREATE POLICY "Service role full access to blueprints"
  ON public.pricing_tier_blueprints FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Vendors can view their own pricing configs
CREATE POLICY "Vendors can view own pricing configs"
  ON public.vendor_pricing_configs FOR SELECT
  USING (
    vendor_id IN (
      SELECT vendor_id FROM public.users 
      WHERE id = auth.uid()
      AND vendor_id IS NOT NULL
    )
  );

-- Vendors can update their own pricing configs
CREATE POLICY "Vendors can update own pricing configs"
  ON public.vendor_pricing_configs FOR UPDATE
  USING (
    vendor_id IN (
      SELECT vendor_id FROM public.users 
      WHERE id = auth.uid()
      AND vendor_id IS NOT NULL
    )
  );

-- Vendors can insert their own pricing configs
CREATE POLICY "Vendors can insert own pricing configs"
  ON public.vendor_pricing_configs FOR INSERT
  WITH CHECK (
    vendor_id IN (
      SELECT vendor_id FROM public.users 
      WHERE id = auth.uid()
      AND vendor_id IS NOT NULL
    )
  );

-- Service role full access to vendor pricing configs
CREATE POLICY "Service role full access to vendor pricing"
  ON public.vendor_pricing_configs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Anyone can view product pricing assignments
CREATE POLICY "Anyone can view product pricing"
  ON public.product_pricing_assignments FOR SELECT
  USING (is_active = true);

-- Service role full access to product pricing assignments
CREATE POLICY "Service role full access to product pricing"
  ON public.product_pricing_assignments FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');


-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL ON public.pricing_tier_blueprints TO authenticated, service_role;
GRANT ALL ON public.vendor_pricing_configs TO authenticated, service_role;
GRANT ALL ON public.product_pricing_assignments TO authenticated, service_role;
GRANT SELECT ON public.vendor_pricing_comparison TO authenticated, service_role;
GRANT SELECT ON public.product_pricing_overview TO authenticated, service_role;


-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamps
CREATE OR REPLACE FUNCTION update_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pricing_blueprints_updated_at
  BEFORE UPDATE ON public.pricing_tier_blueprints
  FOR EACH ROW
  EXECUTE FUNCTION update_pricing_updated_at();

CREATE TRIGGER vendor_pricing_configs_updated_at
  BEFORE UPDATE ON public.vendor_pricing_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_pricing_updated_at();


-- ============================================================================
-- MIGRATION HELPER: Convert existing _product_price_tiers to new system
-- ============================================================================

COMMENT ON TABLE public.pricing_tier_blueprints IS 
'MIGRATION NOTE: Existing products with meta_data._product_price_tiers can be automatically assigned to retail-flower blueprint. 
Run migration script to populate vendor_pricing_configs and product_pricing_assignments from existing data.';

-- ============================================================================
-- COMPLETE ✅
-- ============================================================================

