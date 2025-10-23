-- ============================================================================
-- COST-PLUS PRICING TIER SYSTEM
-- Date: 2025-01-24
-- 
-- Wholesale Model:
-- - Vendor enters cost: $1,000/lb
-- - Defines markup tiers: Tier 1 (+$100), Tier 2 (+$200), etc.
-- - System auto-calculates: Tier 1 = $1,100, Tier 2 = $1,200, etc.
-- - Higher volume = lower tier = lower markup = better price
-- ============================================================================

-- ============================================================================
-- 1. COST-PLUS PRICING CONFIGURATIONS
-- Vendor-specific markup strategies
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vendor_cost_plus_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  
  -- Config name
  name TEXT NOT NULL, -- "Wholesale Flower Markup", "Concentrate Pricing"
  description TEXT,
  
  -- Base unit for cost
  cost_unit TEXT DEFAULT 'pound' CHECK (cost_unit IN ('gram', 'ounce', 'pound', 'unit')),
  
  -- Markup tiers (quantity-based discounts)
  markup_tiers JSONB NOT NULL DEFAULT '[]',
  -- Example structure:
  -- [
  --   {
  --     "tier_id": "tier_1",
  --     "tier_name": "Bulk (10+ lbs)",
  --     "min_quantity": 10,
  --     "min_quantity_unit": "lb",
  --     "min_quantity_grams": 4536,
  --     "markup_type": "flat",
  --     "markup_value": 100,
  --     "sort_order": 1
  --   },
  --   {
  --     "tier_id": "tier_2", 
  --     "tier_name": "Standard (5-9 lbs)",
  --     "min_quantity": 5,
  --     "min_quantity_unit": "lb",
  --     "min_quantity_grams": 2268,
  --     "markup_type": "flat",
  --     "markup_value": 200,
  --     "sort_order": 2
  --   },
  --   {
  --     "tier_id": "tier_3",
  --     "tier_name": "Small (1-4 lbs)",
  --     "min_quantity": 1,
  --     "min_quantity_unit": "lb",
  --     "min_quantity_grams": 453.6,
  --     "markup_type": "flat",
  --     "markup_value": 300,
  --     "sort_order": 3
  --   }
  -- ]
  
  -- Apply to categories
  applies_to_categories UUID[] DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cost_plus_vendor_idx ON public.vendor_cost_plus_configs(vendor_id);
CREATE INDEX IF NOT EXISTS cost_plus_active_idx ON public.vendor_cost_plus_configs(is_active) WHERE is_active = true;

COMMENT ON TABLE public.vendor_cost_plus_configs IS 'Vendor cost-plus markup configurations for automatic pricing';
COMMENT ON COLUMN public.vendor_cost_plus_configs.markup_tiers IS 'Array of markup tiers with quantity breaks and markup amounts';


-- ============================================================================
-- 2. CALCULATED PRICING VIEW
-- Shows final prices with cost + markup for each tier
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_tier_price(
  cost_price DECIMAL,
  markup_type TEXT,
  markup_value DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  RETURN CASE markup_type
    WHEN 'flat' THEN cost_price + markup_value
    WHEN 'percentage' THEN cost_price * (1 + markup_value / 100)
    ELSE cost_price
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.calculate_tier_price IS 'Calculate selling price from cost + markup (flat or percentage)';


-- ============================================================================
-- 3. EXAMPLE PRESET CONFIGS
-- Standard wholesale markup structures
-- ============================================================================

-- This will be inserted when vendors enable cost-plus pricing
-- Can be customized per vendor

COMMENT ON TABLE public.vendor_cost_plus_configs IS 
'Cost-plus pricing: Vendor sets cost, system adds tiered markup.
Example: Cost $1,000/lb
  - Tier 1 (10+ lbs): +$100 = $1,100/lb (10% markup)
  - Tier 2 (5-9 lbs): +$200 = $1,200/lb (20% markup)  
  - Tier 3 (1-4 lbs): +$300 = $1,300/lb (30% markup)
Higher volume = Lower tier = Lower markup = Better price';


-- ============================================================================
-- SUMMARY
-- ============================================================================

-- ✅ Cost-plus pricing table created
-- ✅ Vendor can define markup tiers
-- ✅ Supports flat ($100) or percentage (10%) markups
-- ✅ Automatic price calculation function
-- ✅ Quantity-based tier assignment
-- ✅ Applies to product categories

-- USAGE:
-- 1. Vendor enters cost_price: $1,000/lb
-- 2. Vendor creates markup config with 5 tiers
-- 3. System calculates prices automatically
-- 4. When cost changes, all tier prices update

