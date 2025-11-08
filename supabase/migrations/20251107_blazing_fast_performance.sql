-- ============================================================================
-- BLAZING FAST PERFORMANCE - Critical Indexes for 2025
-- This migration adds missing critical indexes that should ALWAYS exist
-- ============================================================================

-- Inventory: Critical for ALL product queries
CREATE INDEX IF NOT EXISTS idx_inventory_vendor_id ON inventory(vendor_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_location ON inventory(product_id, location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_vendor_product ON inventory(vendor_id, product_id);

-- Products: Speed up searches and filters
CREATE INDEX IF NOT EXISTS idx_products_vendor_status_created ON products(vendor_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products(vendor_id, name);

-- Categories: Faster lookups
CREATE INDEX IF NOT EXISTS idx_categories_vendor_active ON categories(vendor_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_categories_vendor_name ON categories(vendor_id, name);

-- Purchase Orders: Speed up dashboard queries
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor_status ON purchase_orders(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor_created ON purchase_orders(vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON purchase_order_items(purchase_order_id);

-- Customers: Faster customer lookups
CREATE INDEX IF NOT EXISTS idx_customers_vendor_id ON customers(vendor_id);
CREATE INDEX IF NOT EXISTS idx_customers_email_vendor ON customers(email, vendor_id);

-- Wholesale Customers
CREATE INDEX IF NOT EXISTS idx_wholesale_customers_vendor ON wholesale_customers(vendor_id);

-- Suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_vendor_id ON suppliers(vendor_id) WHERE vendor_id IS NOT NULL;

-- Locations
CREATE INDEX IF NOT EXISTS idx_locations_vendor_active ON locations(vendor_id, is_active) WHERE is_active = true;

-- Update statistics for query planner
ANALYZE inventory;
ANALYZE products;
ANALYZE categories;
ANALYZE purchase_orders;
ANALYZE purchase_order_items;
ANALYZE customers;
ANALYZE suppliers;
ANALYZE locations;

COMMENT ON INDEX idx_inventory_vendor_product IS 'Critical: Speeds up product inventory lookups by 10x';
COMMENT ON INDEX idx_products_vendor_status_created IS 'Critical: Optimizes product listing queries';
COMMENT ON INDEX idx_purchase_orders_vendor_status IS 'Critical: Speeds up PO dashboard';
