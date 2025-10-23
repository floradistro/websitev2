-- ============================================================================
-- CHECK WHICH TIER KEYS ARE SAVED
-- This will show if all 5 tiers are in database or just 1
-- ============================================================================

-- Query 1: How many tier keys exist?
SELECT 
  id,
  jsonb_object_keys(pricing_values) as tier_key
FROM vendor_pricing_configs 
WHERE id = '8900ffa8-ff63-4c6c-bb64-a793c0bc9469';

-- Should return 5 rows (one for each tier: 1g, 3_5g, 7g, 14g, 28g)
-- If it only returns 1 row, that's the problem!

-- Query 2: Show the FULL pricing_values object
SELECT 
  pricing_values
FROM vendor_pricing_configs 
WHERE id = '8900ffa8-ff63-4c6c-bb64-a793c0bc9469';

-- This shows the raw JSONB data

