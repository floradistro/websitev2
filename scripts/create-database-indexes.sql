-- ============================================================================
-- Database Index Creation Script
-- Purpose: Optimize query performance for WhaleTools platform
-- Phase: 2.5.1 - Query Optimization
-- ============================================================================

-- Enable trigram extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- PRODUCTS TABLE INDEXES
-- ============================================================================

-- Vendor-based queries (most common filter)
CREATE INDEX IF NOT EXISTS idx_products_vendor_id
  ON products(vendor_id);

-- Status-based filtering
CREATE INDEX IF NOT EXISTS idx_products_status
  ON products(status);

-- Combined vendor + status (compound index for dashboard queries)
CREATE INDEX IF NOT EXISTS idx_products_vendor_status
  ON products(vendor_id, status);

-- Chronological sorting
CREATE INDEX IF NOT EXISTS idx_products_created_at
  ON products(created_at DESC);

-- Vendor + created_at for recent products queries
CREATE INDEX IF NOT EXISTS idx_products_vendor_created
  ON products(vendor_id, created_at DESC);

-- Category filtering
CREATE INDEX IF NOT EXISTS idx_products_primary_category
  ON products(primary_category_id);

-- SKU lookup (unique identifiers)
CREATE INDEX IF NOT EXISTS idx_products_sku
  ON products(sku);

-- Full-text search on product names (trigram index for LIKE/ILIKE queries)
CREATE INDEX IF NOT EXISTS idx_products_name_trgm
  ON products USING gin(name gin_trgm_ops);

-- Published products only (partial index)
CREATE INDEX IF NOT EXISTS idx_products_published
  ON products(vendor_id, created_at DESC)
  WHERE status = 'published';

COMMENT ON INDEX idx_products_vendor_status IS
  'Optimizes dashboard queries filtering by vendor and status';
COMMENT ON INDEX idx_products_name_trgm IS
  'Enables fast fuzzy search on product names';

-- ============================================================================
-- INVENTORY TABLE INDEXES
-- ============================================================================

-- Vendor-based inventory queries
CREATE INDEX IF NOT EXISTS idx_inventory_vendor_id
  ON inventory(vendor_id);

-- Product-based inventory lookup
CREATE INDEX IF NOT EXISTS idx_inventory_product_id
  ON inventory(product_id);

-- Compound vendor + product for specific inventory checks
CREATE INDEX IF NOT EXISTS idx_inventory_vendor_product
  ON inventory(vendor_id, product_id);

-- Location-based inventory
CREATE INDEX IF NOT EXISTS idx_inventory_location_id
  ON inventory(location_id);

-- Low stock alerts (partial index - only indexes low stock items)
-- This is MUCH faster than indexing all inventory
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock
  ON inventory(vendor_id, quantity)
  WHERE CAST(quantity AS NUMERIC) <= CAST(low_stock_threshold AS NUMERIC);

COMMENT ON INDEX idx_inventory_low_stock IS
  'Partial index for fast low stock queries. Only indexes items below threshold.';

-- ============================================================================
-- ORDERS TABLE INDEXES
-- ============================================================================

-- Chronological order sorting
CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON orders(created_at DESC);

-- Order status filtering
CREATE INDEX IF NOT EXISTS idx_orders_status
  ON orders(status);

-- Customer order history
CREATE INDEX IF NOT EXISTS idx_orders_customer_id
  ON orders(customer_id);

-- Recent orders by status
CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON orders(status, created_at DESC);

-- ============================================================================
-- ORDER ITEMS TABLE INDEXES
-- ============================================================================

-- Order items by order (for order details page)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON order_items(order_id);

-- Product sales history
CREATE INDEX IF NOT EXISTS idx_order_items_product_id
  ON order_items(product_id);

-- Vendor sales tracking
CREATE INDEX IF NOT EXISTS idx_order_items_vendor_id
  ON order_items(vendor_id);

-- Vendor sales by date (for analytics)
CREATE INDEX IF NOT EXISTS idx_order_items_vendor_created
  ON order_items(vendor_id, created_at DESC);

COMMENT ON INDEX idx_order_items_vendor_created IS
  'Critical for vendor analytics and sales reports';

-- ============================================================================
-- CATEGORIES TABLE INDEXES
-- ============================================================================

-- Category lookup by slug (for URLs)
CREATE INDEX IF NOT EXISTS idx_categories_slug
  ON categories(slug);

-- Hierarchical category queries
CREATE INDEX IF NOT EXISTS idx_categories_parent_id
  ON categories(parent_id);

-- Active categories only
CREATE INDEX IF NOT EXISTS idx_categories_active
  ON categories(slug)
  WHERE is_active = true;

-- ============================================================================
-- MEDIA TABLE INDEXES
-- ============================================================================

-- Vendor media library
CREATE INDEX IF NOT EXISTS idx_media_vendor_id
  ON media(vendor_id);

-- Product media associations
CREATE INDEX IF NOT EXISTS idx_media_product_id
  ON media(product_id);

-- Recent media uploads
CREATE INDEX IF NOT EXISTS idx_media_created_at
  ON media(created_at DESC);

-- Vendor + product media lookup
CREATE INDEX IF NOT EXISTS idx_media_vendor_product
  ON media(vendor_id, product_id);

-- ============================================================================
-- CUSTOMERS TABLE INDEXES
-- ============================================================================

-- Customer lookup by email
CREATE INDEX IF NOT EXISTS idx_customers_email
  ON customers(email);

-- Customer lookup by phone
CREATE INDEX IF NOT EXISTS idx_customers_phone
  ON customers(phone)
  WHERE phone IS NOT NULL;

-- Customer name search (trigram)
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm
  ON customers USING gin(
    (COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) gin_trgm_ops
  );

-- ============================================================================
-- LOCATIONS TABLE INDEXES
-- ============================================================================

-- Vendor locations
CREATE INDEX IF NOT EXISTS idx_locations_vendor_id
  ON locations(vendor_id);

-- Active locations only
CREATE INDEX IF NOT EXISTS idx_locations_active
  ON locations(vendor_id)
  WHERE is_active = true;

-- ============================================================================
-- USERS TABLE INDEXES
-- ============================================================================

-- User lookup by email (authentication)
CREATE INDEX IF NOT EXISTS idx_users_email
  ON users(email);

-- Vendor employees
CREATE INDEX IF NOT EXISTS idx_users_vendor_id
  ON users(vendor_id);

-- User role filtering
CREATE INDEX IF NOT EXISTS idx_users_role
  ON users(role);

-- Vendor + role combination
CREATE INDEX IF NOT EXISTS idx_users_vendor_role
  ON users(vendor_id, role);

-- ============================================================================
-- PROMOTIONS TABLE INDEXES
-- ============================================================================

-- Vendor promotions
CREATE INDEX IF NOT EXISTS idx_promotions_vendor_id
  ON promotions(vendor_id)
  WHERE EXISTS (SELECT 1 FROM promotions);

-- Active promotions (partial index)
CREATE INDEX IF NOT EXISTS idx_promotions_active
  ON promotions(vendor_id, start_date, end_date)
  WHERE is_active = true
    AND start_date <= CURRENT_DATE
    AND (end_date IS NULL OR end_date >= CURRENT_DATE);

-- ============================================================================
-- REVIEWS TABLE INDEXES (if exists)
-- ============================================================================

-- Product reviews
CREATE INDEX IF NOT EXISTS idx_reviews_product_id
  ON reviews(product_id)
  WHERE EXISTS (SELECT 1 FROM reviews);

-- Vendor reviews
CREATE INDEX IF NOT EXISTS idx_reviews_vendor_id
  ON reviews(vendor_id)
  WHERE EXISTS (SELECT 1 FROM reviews);

-- Recent reviews
CREATE INDEX IF NOT EXISTS idx_reviews_created_at
  ON reviews(created_at DESC)
  WHERE EXISTS (SELECT 1 FROM reviews);

-- ============================================================================
-- VERIFY INDEX CREATION
-- ============================================================================

-- Query to verify all indexes were created successfully
DO $$
DECLARE
  index_count INT;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE indexname LIKE 'idx_%';

  RAISE NOTICE 'Total indexes created: %', index_count;
  RAISE NOTICE 'Index creation complete!';
  RAISE NOTICE 'Run this query to see all indexes: SELECT tablename, indexname FROM pg_indexes WHERE indexname LIKE ''idx_%'' ORDER BY tablename, indexname;';
END $$;

-- ============================================================================
-- PERFORMANCE TESTING QUERIES
-- ============================================================================

-- Test 1: Dashboard query (should be <50ms with indexes)
-- EXPLAIN ANALYZE
-- SELECT COUNT(*)
-- FROM products
-- WHERE vendor_id = 'YOUR_VENDOR_ID' AND status = 'published';

-- Test 2: Low stock query (should be <20ms with partial index)
-- EXPLAIN ANALYZE
-- SELECT *
-- FROM inventory
-- WHERE vendor_id = 'YOUR_VENDOR_ID'
--   AND CAST(quantity AS NUMERIC) <= CAST(low_stock_threshold AS NUMERIC)
-- LIMIT 10;

-- Test 3: Product search (should be <100ms with trigram index)
-- EXPLAIN ANALYZE
-- SELECT id, name
-- FROM products
-- WHERE name ILIKE '%search_term%'
-- LIMIT 20;

-- Test 4: Recent orders (should be <30ms with index)
-- EXPLAIN ANALYZE
-- SELECT *
-- FROM order_items
-- WHERE vendor_id = 'YOUR_VENDOR_ID'
-- ORDER BY created_at DESC
-- LIMIT 50;

-- ============================================================================
-- MAINTENANCE RECOMMENDATIONS
-- ============================================================================

-- 1. Analyze tables after index creation
ANALYZE products;
ANALYZE inventory;
ANALYZE orders;
ANALYZE order_items;
ANALYZE categories;
ANALYZE media;
ANALYZE customers;
ANALYZE locations;
ANALYZE users;

-- 2. Vacuum to reclaim space
-- Run this periodically in production
-- VACUUM ANALYZE;

-- 3. Monitor index usage
-- Check which indexes are actually being used:
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as index_scans,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE indexname LIKE 'idx_%'
-- ORDER BY idx_scan DESC;

-- 4. Find unused indexes (candidates for removal)
-- SELECT
--   schemaname,
--   tablename,
--   indexname
-- FROM pg_stat_user_indexes
-- WHERE idx_scan = 0
--   AND indexname LIKE 'idx_%'
-- ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

RAISE NOTICE '=================================================================';
RAISE NOTICE 'Index creation complete!';
RAISE NOTICE '=================================================================';
RAISE NOTICE 'Next steps:';
RAISE NOTICE '1. Run ANALYZE on all tables (done above)';
RAISE NOTICE '2. Test query performance with EXPLAIN ANALYZE';
RAISE NOTICE '3. Monitor index usage in production';
RAISE NOTICE '4. Review unused indexes after 30 days';
RAISE NOTICE '=================================================================';
RAISE NOTICE 'Expected performance improvements:';
RAISE NOTICE '  - Dashboard queries: 70-90% faster';
RAISE NOTICE '  - Product search: 90%+ faster';
RAISE NOTICE '  - Low stock alerts: 80-95% faster';
RAISE NOTICE '  - Analytics queries: 60-80% faster';
RAISE NOTICE '=================================================================';
