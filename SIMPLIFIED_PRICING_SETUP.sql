-- ============================================================================
-- SIMPLIFIED PRICING BLUEPRINTS - RUN THIS IN SUPABASE SQL EDITOR
-- This removes confusing templates and keeps only the essentials
-- ============================================================================

-- Step 1: Delete old complex/confusing blueprints
DELETE FROM public.pricing_tier_blueprints 
WHERE slug IN (
  'wholesale-tiers',
  'medical-patient', 
  'staff-discount',
  'retail-concentrates'
);

-- Step 2: Update/Create Simple Retail Flower Blueprint
INSERT INTO public.pricing_tier_blueprints (
  name, 
  slug, 
  description, 
  tier_type,
  price_breaks,
  is_active,
  is_default,
  display_order
) VALUES (
  'Retail Flower',
  'retail-flower',
  'Standard retail gram-based pricing (1g, 3.5g, 7g, 14g, 28g)',
  'weight',
  '[
    {"break_id": "1g", "label": "1 gram", "qty": 1, "unit": "g", "sort_order": 1},
    {"break_id": "3_5g", "label": "3.5g (Eighth)", "qty": 3.5, "unit": "g", "sort_order": 2},
    {"break_id": "7g", "label": "7g (Quarter)", "qty": 7, "unit": "g", "sort_order": 3},
    {"break_id": "14g", "label": "14g (Half Oz)", "qty": 14, "unit": "g", "sort_order": 4},
    {"break_id": "28g", "label": "28g (Ounce)", "qty": 28, "unit": "g", "sort_order": 5}
  ]'::jsonb,
  true,
  true,
  1
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_breaks = EXCLUDED.price_breaks,
  is_active = EXCLUDED.is_active,
  is_default = EXCLUDED.is_default,
  display_order = EXCLUDED.display_order;

-- Step 3: Create Wholesale Flat Rate Blueprint
INSERT INTO public.pricing_tier_blueprints (
  name, 
  slug, 
  description, 
  tier_type,
  price_breaks,
  is_active,
  is_default,
  display_order
) VALUES (
  'Wholesale Cost Plus',
  'wholesale-cost-plus',
  'Simple cost-plus pricing per pound (flat rate markup)',
  'weight',
  '[
    {"break_id": "per_lb", "label": "Per Pound", "qty": 1, "unit": "lb", "sort_order": 1}
  ]'::jsonb,
  true,
  false,
  2
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_breaks = EXCLUDED.price_breaks,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order;

-- Step 4: Create Wholesale Tiered Blueprint (for vendors who want multiple tiers)
INSERT INTO public.pricing_tier_blueprints (
  name, 
  slug, 
  description, 
  tier_type,
  price_breaks,
  is_active,
  is_default,
  display_order
) VALUES (
  'Wholesale Tiered',
  'wholesale-tiered',
  'Multi-tier wholesale pricing (configure your own quantity breaks)',
  'weight',
  '[
    {"break_id": "tier_1", "label": "Tier 1 (1-9 lbs)", "qty": 1, "unit": "lb", "min_qty": 1, "max_qty": 9, "sort_order": 1},
    {"break_id": "tier_2", "label": "Tier 2 (10+ lbs)", "qty": 10, "unit": "lb", "min_qty": 10, "max_qty": null, "sort_order": 2}
  ]'::jsonb,
  true,
  false,
  3
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_breaks = EXCLUDED.price_breaks,
  is_active = EXCLUDED.is_active,
  display_order = EXCLUDED.display_order;

-- Done! You should now have 3 simple, clear blueprints:
-- 1. Retail Flower (1g, 3.5g, 7g, 14g, 28g)
-- 2. Wholesale Cost Plus (flat per-pound rate)
-- 3. Wholesale Tiered (customizable tiers)

SELECT 
  name,
  slug,
  tier_type,
  jsonb_array_length(price_breaks) as num_breaks,
  is_active,
  is_default
FROM public.pricing_tier_blueprints
WHERE slug IN ('retail-flower', 'wholesale-cost-plus', 'wholesale-tiered')
ORDER BY display_order;

