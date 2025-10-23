-- Run this RIGHT NOW to see if the disabled tier was saved
SELECT 
  jsonb_pretty(pricing_values) as full_data
FROM vendor_pricing_configs 
WHERE id = '8900ffa8-ff63-4c6c-bb64-a793c0bc9469';
-- This is the Retail Flower config ID

-- Should show something like:
-- {
--   "1g": {"price": "14.99", "enabled": true},
--   "3_5g": {"price": "39.99", "enabled": false},   ← DISABLED
--   "7g": {"price": "69.99", "enabled": true},
--   "14g": {"price": "109.99", "enabled": true},
--   "28g": {"price": "199.99", "enabled": true}
-- }

