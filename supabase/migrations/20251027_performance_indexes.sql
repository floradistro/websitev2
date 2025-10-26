-- Performance Optimization Indexes
-- Created: 2025-10-27
-- Purpose: Reduce query times for vendor dashboard and product listings

-- ============================================
-- PRODUCTS TABLE OPTIMIZATION
-- ============================================

-- Fast vendor product lookups by status
CREATE INDEX IF NOT EXISTS idx_products_vendor_status 
ON products(vendor_id, status)
WHERE status IN ('approved', 'pending');

-- Featured products (storefront) - using 'featured' column
CREATE INDEX IF NOT EXISTS idx_products_vendor_featured 
ON products(vendor_id, featured)
WHERE featured = true;

-- Product search by name (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_products_name_search 
ON products USING gin(to_tsvector('english', name));

-- SKU lookups
CREATE INDEX IF NOT EXISTS idx_products_sku 
ON products(sku)
WHERE sku IS NOT NULL;

-- Price range queries
CREATE INDEX IF NOT EXISTS idx_products_price 
ON products(price)
WHERE price IS NOT NULL;

-- ============================================
-- INVENTORY TABLE OPTIMIZATION
-- ============================================

-- Fast product inventory lookups
CREATE INDEX IF NOT EXISTS idx_inventory_product_location 
ON inventory(product_id, location_id);

-- Low stock alerts
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock 
ON inventory(product_id, quantity)
WHERE quantity < 100;

-- Location-specific inventory
CREATE INDEX IF NOT EXISTS idx_inventory_location 
ON inventory(location_id, quantity);

-- ============================================
-- PRODUCT CATEGORIES (JUNCTION TABLE)
-- ============================================

-- Product to category lookups
CREATE INDEX IF NOT EXISTS idx_product_categories_product 
ON product_categories(product_id);

-- Category to product lookups
CREATE INDEX IF NOT EXISTS idx_product_categories_category 
ON product_categories(category_id);

-- Composite for join optimization
CREATE INDEX IF NOT EXISTS idx_product_categories_composite 
ON product_categories(product_id, category_id);

-- ============================================
-- PRICING TIERS OPTIMIZATION (Skip if table doesn't exist)
-- ============================================

-- Active pricing tier lookups
-- CREATE INDEX IF NOT EXISTS idx_pricing_product_active 
-- ON product_pricing_tiers(product_id, is_active)
-- WHERE is_active = true;

-- Tier quantity range queries
-- CREATE INDEX IF NOT EXISTS idx_pricing_quantity 
-- ON product_pricing_tiers(min_quantity, max_quantity)
-- WHERE is_active = true;

-- ============================================
-- VENDORS TABLE OPTIMIZATION
-- ============================================

-- Active vendor lookups
CREATE INDEX IF NOT EXISTS idx_vendors_status 
ON vendors(status)
WHERE status = 'active';

-- Vendor slug lookups (storefront routing)
CREATE INDEX IF NOT EXISTS idx_vendors_slug 
ON vendors(slug)
WHERE slug IS NOT NULL;

-- Storefront generation status (if column exists)
-- CREATE INDEX IF NOT EXISTS idx_vendors_storefront_generated 
-- ON vendors(storefront_generated)
-- WHERE storefront_generated = true;

-- ============================================
-- ORDERS TABLE OPTIMIZATION
-- ============================================

-- Vendor order lookups
CREATE INDEX IF NOT EXISTS idx_orders_vendor 
ON orders(vendor_id, created_at DESC)
WHERE vendor_id IS NOT NULL;

-- Customer order lookups
CREATE INDEX IF NOT EXISTS idx_orders_customer 
ON orders(customer_id, created_at DESC)
WHERE customer_id IS NOT NULL;

-- Order status queries
CREATE INDEX IF NOT EXISTS idx_orders_status 
ON orders(status, created_at DESC);

-- ============================================
-- CUSTOM FIELD VALUES OPTIMIZATION (Skip if table doesn't exist)
-- ============================================

-- Product field lookups
-- CREATE INDEX IF NOT EXISTS idx_custom_field_values_product 
-- ON custom_field_values(product_id, field_key);

-- Field value searches
-- CREATE INDEX IF NOT EXISTS idx_custom_field_values_search 
-- ON custom_field_values USING gin(field_value);

-- ============================================
-- VENDOR STOREFRONT SECTIONS/COMPONENTS
-- ============================================

-- Vendor sections by page type
CREATE INDEX IF NOT EXISTS idx_storefront_sections_vendor_page 
ON vendor_storefront_sections(vendor_id, page_type, section_order);

-- Component instances by section
CREATE INDEX IF NOT EXISTS idx_component_instances_section 
ON vendor_component_instances(section_id, position_order)
WHERE is_enabled = true;

-- ============================================
-- STOCK MOVEMENTS (ANALYTICS) - Corrected column names
-- ============================================

-- Product movement history (stock_movements doesn't have vendor_id)
CREATE INDEX IF NOT EXISTS idx_stock_movements_product 
ON stock_movements(product_id, created_at DESC);

-- Movement type tracking
CREATE INDEX IF NOT EXISTS idx_stock_movements_type 
ON stock_movements(movement_type, created_at DESC);

-- ============================================
-- STATISTICS & VERIFICATION
-- ============================================

-- Count indexes created
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';
  
  RAISE NOTICE '✅ Performance indexes created. Total custom indexes: %', index_count;
END $$;

-- Analyze tables for query planner
ANALYZE products;
ANALYZE inventory;
ANALYZE product_categories;
ANALYZE vendors;
ANALYZE orders;
ANALYZE vendor_storefront_sections;
ANALYZE vendor_component_instances;
ANALYZE stock_movements;

-- Vacuum for optimization
VACUUM ANALYZE;

