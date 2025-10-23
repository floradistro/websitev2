-- Find and delete orphaned products (products with null or invalid vendor_id)

-- Step 1: Show orphaned products
SELECT 
  p.id,
  p.name,
  p.vendor_id,
  p.status,
  p.created_at
FROM products p
LEFT JOIN vendors v ON p.vendor_id = v.id
WHERE p.vendor_id IS NULL OR v.id IS NULL
ORDER BY p.created_at DESC;

-- Step 2: Delete related records for orphaned products
-- Delete inventory
DELETE FROM inventory 
WHERE product_id IN (
  SELECT p.id
  FROM products p
  LEFT JOIN vendors v ON p.vendor_id = v.id
  WHERE p.vendor_id IS NULL OR v.id IS NULL
);

-- Delete product categories
DELETE FROM product_categories 
WHERE product_id IN (
  SELECT p.id
  FROM products p
  LEFT JOIN vendors v ON p.vendor_id = v.id
  WHERE p.vendor_id IS NULL OR v.id IS NULL
);

-- Delete wholesale pricing
DELETE FROM wholesale_pricing 
WHERE product_id IN (
  SELECT p.id
  FROM products p
  LEFT JOIN vendors v ON p.vendor_id = v.id
  WHERE p.vendor_id IS NULL OR v.id IS NULL
);

-- Step 3: Delete the orphaned products themselves
DELETE FROM products 
WHERE id IN (
  SELECT p.id
  FROM products p
  LEFT JOIN vendors v ON p.vendor_id = v.id
  WHERE p.vendor_id IS NULL OR v.id IS NULL
);

-- Verify cleanup - should return 0 rows
SELECT COUNT(*) as remaining_orphaned_products
FROM products p
LEFT JOIN vendors v ON p.vendor_id = v.id
WHERE p.vendor_id IS NULL OR v.id IS NULL;

