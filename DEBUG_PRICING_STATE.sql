-- ============================================================================
-- DEBUG PRICING STATE - Run this to see current state
-- ============================================================================

-- Check 1: Does vendor_pricing_configs have the columns?
SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'vendor_pricing_configs'
  AND column_name IN ('display_unit', 'custom_price_breaks', 'pricing_values')
ORDER BY column_name;

-- Check 2: Current state of pricing configs
SELECT 
  id,
  vendor_id,
  blueprint_id,
  pricing_values,
  display_unit,
  custom_price_breaks,
  is_active,
  created_at
FROM public.vendor_pricing_configs
WHERE vendor_id IN (
  SELECT id FROM public.vendors WHERE email = 'darioncdjr@gmail.com'
)
ORDER BY created_at DESC;

-- Check 3: Are pricing_values properly structured?
SELECT 
  id,
  jsonb_pretty(pricing_values) as pricing_structure
FROM public.vendor_pricing_configs
WHERE vendor_id IN (
  SELECT id FROM public.vendors WHERE email = 'darioncdjr@gmail.com'
)
LIMIT 3;

-- Check 4: Which blueprints are being used?
SELECT 
  vpc.id as config_id,
  ptb.name as blueprint_name,
  ptb.slug,
  vpc.is_active,
  vpc.display_unit,
  jsonb_array_length(ptb.price_breaks) as num_breaks
FROM public.vendor_pricing_configs vpc
JOIN public.pricing_tier_blueprints ptb ON vpc.blueprint_id = ptb.id
WHERE vpc.vendor_id IN (
  SELECT id FROM public.vendors WHERE email = 'darioncdjr@gmail.com'
);

-- Expected Results:
-- ✅ display_unit column exists
-- ✅ custom_price_breaks column exists  
-- ✅ pricing_values is JSONB with structure: {"1g": {"price": "15", "enabled": true}}
-- ✅ At least one config exists

