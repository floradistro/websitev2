-- Performance Enhancement: Critical Indexes for Phase 1
-- Expected Impact: 50% faster queries

-- Products table optimization
-- Index for vendor filtering by status (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_vendor_status_published 
ON products(vendor_id, status) 
WHERE status = 'published';

-- Index for in-stock products filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_status_stock 
ON products(status, stock_quantity) 
WHERE status = 'published' AND stock_quantity > 0;

-- Index for vendor's recent products (dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_vendor_created 
ON products(vendor_id, created_at DESC);

-- Inventory table optimization  
-- Index for vendor inventory with stock
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_vendor_quantity 
ON inventory(vendor_id, quantity) 
WHERE quantity > 0;

-- Index for product location inventory lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_product_location_qty 
ON inventory(product_id, location_id, quantity);

-- Orders table optimization
-- Index for recent orders by status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_status 
ON orders(created_at DESC, status);

-- Index for vendor order items
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_vendor_created 
ON order_items(vendor_id, created_at DESC);

-- Update statistics for query planner optimization
ANALYZE products;
ANALYZE inventory;
ANALYZE orders;
ANALYZE order_items;

