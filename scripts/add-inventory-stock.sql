-- ============================================================================
-- Add 28 units of stock for all Flora Distro products at all locations
-- ============================================================================

BEGIN;

-- Create inventory records for each product at each location
INSERT INTO inventory (
  id,
  product_id,
  location_id,
  vendor_id,
  quantity,
  low_stock_threshold,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  p.id,
  l.id,
  p.vendor_id,
  28.00,
  5.00,
  NOW(),
  NOW()
FROM products p
CROSS JOIN locations l
WHERE p.vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  AND l.vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
ON CONFLICT (product_id, location_id) DO NOTHING;

-- Report
SELECT 
  'Inventory Created' as status,
  COUNT(*) as total_records,
  SUM(quantity) as total_units,
  COUNT(DISTINCT product_id) as products,
  COUNT(DISTINCT location_id) as locations
FROM inventory
WHERE vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

COMMIT;

