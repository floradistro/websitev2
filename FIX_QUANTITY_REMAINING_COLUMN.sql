-- Fix quantity_remaining to be a proper GENERATED STORED column
-- This ensures it auto-calculates as (quantity - quantity_received)

-- First, drop any existing expression
ALTER TABLE purchase_order_items
ALTER COLUMN quantity_remaining DROP EXPRESSION IF EXISTS;

-- Set default value for existing NULL records
UPDATE purchase_order_items
SET quantity_remaining = quantity - COALESCE(quantity_received, 0)
WHERE quantity_remaining IS NULL;

-- Now make it a GENERATED STORED column
ALTER TABLE purchase_order_items
ALTER COLUMN quantity_remaining
SET DATA TYPE DECIMAL(10, 2)
GENERATED ALWAYS AS (quantity - COALESCE(quantity_received, 0)) STORED;

-- Verify the fix
SELECT
  id,
  quantity,
  quantity_received,
  quantity_remaining,
  (quantity - COALESCE(quantity_received, 0)) as calculated_remaining
FROM purchase_order_items
WHERE purchase_order_id = (
  SELECT id FROM purchase_orders WHERE po_number = 'IN-PO-20251114-0011' LIMIT 1
)
LIMIT 5;
