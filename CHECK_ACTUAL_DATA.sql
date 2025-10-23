-- ============================================================================
-- CHECK WHAT'S ACTUALLY IN THE DATABASE
-- ============================================================================

-- Step 1: Find the vendor ID
SELECT id, email, store_name 
FROM vendors 
WHERE email = 'darioncdjr@gmail.com';

-- Step 2: Find all pricing configs for this vendor (using the ID from Step 1)
SELECT 
  vpc.id,
  vpc.vendor_id,
  vpc.blueprint_id,
  vpc.is_active,
  vpc.display_unit,
  ptb.name as blueprint_name,
  ptb.slug as blueprint_slug,
  jsonb_pretty(vpc.pricing_values) as pricing_structure
FROM vendor_pricing_configs vpc
JOIN pricing_tier_blueprints ptb ON vpc.blueprint_id = ptb.id
WHERE vpc.vendor_id = (SELECT id FROM vendors WHERE email = 'darioncdjr@gmail.com')
ORDER BY ptb.slug;

-- This will show ALL pricing configs with their actual data
-- Look for the row where blueprint_slug = 'retail-flower'
-- Check the pricing_structure column - should show enabled: false for 3_5g

