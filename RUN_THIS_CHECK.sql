-- ============================================================================
-- SIMPLE CHECK - Run each one separately in Supabase
-- ============================================================================

-- Query 1: Do you have ANY vendor_pricing_configs?
SELECT COUNT(*) as total_configs FROM vendor_pricing_configs;
-- Should show a number > 0

-- Query 2: What vendors exist?
SELECT id, email, store_name FROM vendors LIMIT 5;
-- Find your vendor ID (cd2e1122-d511-4edb-be5d-98ef274b4baf)

-- Query 3: Check YOUR pricing configs (use vendor_id from Query 2)
SELECT 
  id,
  is_active,
  display_unit,
  pricing_values->'3_5g' as eighth_tier_data
FROM vendor_pricing_configs 
WHERE vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
-- Should show if 3.5g tier has enabled: false

-- Query 4: Full data dump
SELECT 
  jsonb_pretty(pricing_values) as full_pricing
FROM vendor_pricing_configs 
WHERE vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
LIMIT 1;
-- Should show the complete pricing structure with enabled flags

