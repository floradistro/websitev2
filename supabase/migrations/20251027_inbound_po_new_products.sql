-- Migration: Support for new products in inbound purchase orders
-- Created: 2025-10-27
-- Purpose: Allow vendors to add new products while creating inbound POs

-- Step 1: Add new product statuses
-- Drop existing constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;

-- Add new constraint with additional statuses
ALTER TABLE products ADD CONSTRAINT products_status_check
  CHECK (status IN (
    'published',        -- Live on storefront
    'draft',           -- Work in progress
    'archived',        -- Removed from storefront
    'po_only',         -- Created from PO, not yet received
    'in_stock_unpublished'  -- Received but not published to storefront
  ));

-- Step 2: Add supplier product tracking
ALTER TABLE products
ADD COLUMN IF NOT EXISTS supplier_product_id TEXT,
ADD COLUMN IF NOT EXISTS created_from_po_id UUID REFERENCES purchase_orders(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_products_created_from_po ON products(created_from_po_id);
CREATE INDEX IF NOT EXISTS idx_products_status_po_only ON products(status) WHERE status IN ('po_only', 'in_stock_unpublished');

-- Step 3: Add source tracking to purchase order items
-- This helps identify which items are new products
ALTER TABLE purchase_order_items
ADD COLUMN IF NOT EXISTS is_new_product BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS supplier_sku TEXT;

-- Step 4: Create view for pending products (products ready to publish)
CREATE OR REPLACE VIEW pending_products AS
SELECT
  p.id,
  p.vendor_id,
  p.name,
  p.sku,
  p.supplier_product_id,
  p.category,
  p.cost_price,
  p.regular_price,
  p.status,
  p.created_from_po_id,
  p.created_at,
  po.po_number,
  po.received_at,
  s.external_name as supplier_name,
  COALESCE(inv.total_quantity, 0) as inventory_quantity
FROM products p
LEFT JOIN purchase_orders po ON p.created_from_po_id = po.id
LEFT JOIN suppliers s ON po.supplier_id = s.id
LEFT JOIN (
  SELECT product_id, SUM(quantity) as total_quantity
  FROM inventory
  GROUP BY product_id
) inv ON p.id = inv.product_id
WHERE p.status IN ('po_only', 'in_stock_unpublished')
ORDER BY p.created_at DESC;

-- Step 5: Add helpful comments
COMMENT ON COLUMN products.supplier_product_id IS 'SKU or product ID from the supplier''s catalog';
COMMENT ON COLUMN products.created_from_po_id IS 'References the purchase order that created this product (for inbound POs with new products)';
COMMENT ON COLUMN purchase_order_items.is_new_product IS 'True if this item was a new product created during PO creation';
COMMENT ON COLUMN purchase_order_items.supplier_sku IS 'Supplier''s SKU for this product';

-- Step 6: Update RLS policies to allow viewing pending products
-- (Existing policies should cover this, but let's be explicit)
CREATE POLICY IF NOT EXISTS "Vendors can view their pending products"
  ON products FOR SELECT
  TO authenticated
  USING (vendor_id = (SELECT id FROM vendors WHERE id = auth.uid()));

-- Grant access to the view
GRANT SELECT ON pending_products TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Inbound PO new products support added';
  RAISE NOTICE '  - Added product statuses: po_only, in_stock_unpublished';
  RAISE NOTICE '  - Added supplier tracking columns';
  RAISE NOTICE '  - Created pending_products view';
  RAISE NOTICE '  - Ready for new product workflow';
END $$;
