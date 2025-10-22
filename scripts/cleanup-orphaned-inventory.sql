-- ============================================================================
-- CLEANUP ORPHANED INVENTORY RECORDS
-- Run this in Supabase SQL Editor to fix data integrity issues
-- ============================================================================

-- Step 1: Check how many orphaned records exist
SELECT 
  'Orphaned Inventory (null product_id)' as issue,
  COUNT(*) as count
FROM inventory
WHERE product_id IS NULL;

-- Step 2: Preview orphaned records before deletion
SELECT 
  id,
  product_id,
  location_id,
  vendor_id,
  quantity,
  created_at,
  updated_at
FROM inventory
WHERE product_id IS NULL
ORDER BY created_at DESC
LIMIT 10;

-- Step 3: DELETE orphaned inventory records
-- UNCOMMENT BELOW TO EXECUTE:
-- DELETE FROM inventory WHERE product_id IS NULL;

-- Step 4: Verify cleanup
SELECT 
  'Total Inventory Records' as metric,
  COUNT(*) as count
FROM inventory
UNION ALL
SELECT 
  'Valid Records (with product_id)',
  COUNT(*)
FROM inventory
WHERE product_id IS NOT NULL
UNION ALL
SELECT 
  'Orphaned Records (null product_id)',
  COUNT(*)
FROM inventory
WHERE product_id IS NULL;

-- ============================================================================
-- After running this, restart your app to see clean data!
-- ============================================================================

