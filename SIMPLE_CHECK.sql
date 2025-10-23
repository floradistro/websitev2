-- Step 1: Get vendor ID
SELECT id, email, store_name FROM vendors WHERE email = 'darioncdjr@gmail.com';

-- Step 2: Check all vendor_pricing_configs (replace with actual vendor_id from Step 1)
SELECT 
  id,
  vendor_id,
  blueprint_id,
  is_active,
  display_unit,
  created_at,
  pricing_values
FROM vendor_pricing_configs 
WHERE vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
ORDER BY created_at DESC;

-- Step 3: Pretty print the pricing_values
SELECT 
  jsonb_pretty(pricing_values) as pricing_data
FROM vendor_pricing_configs 
WHERE vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
LIMIT 3;

