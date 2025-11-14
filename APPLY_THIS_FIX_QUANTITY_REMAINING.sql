-- Fix quantity_remaining to auto-calculate properly
-- PostgreSQL requires recreating the column for GENERATED changes

-- Step 1: Check current state
DO $$
BEGIN
  RAISE NOTICE 'Current quantity_remaining column info:';
END $$;

SELECT
  column_name,
  data_type,
  is_nullable,
  is_generated,
  generation_expression
FROM information_schema.columns
WHERE table_name = 'purchase_order_items'
  AND column_name = 'quantity_remaining';

-- Step 2: Drop the column and recreate as GENERATED
-- WARNING: This will work because we can recalculate all values
ALTER TABLE purchase_order_items
DROP COLUMN IF EXISTS quantity_remaining;

ALTER TABLE purchase_order_items
ADD COLUMN quantity_remaining DECIMAL(10, 2)
GENERATED ALWAYS AS (quantity - COALESCE(quantity_received, 0)) STORED;

-- Step 3: Verify the fix works
SELECT
  po.po_number,
  poi.quantity,
  poi.quantity_received,
  poi.quantity_remaining,
  (poi.quantity - COALESCE(poi.quantity_received, 0)) as should_be
FROM purchase_order_items poi
JOIN purchase_orders po ON po.id = poi.purchase_order_id
WHERE po.po_number = 'IN-PO-20251114-0011'
LIMIT 5;
