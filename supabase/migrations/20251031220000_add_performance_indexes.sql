-- Performance optimization: Add missing database indexes
-- Created: 2025-10-31

-- ============================================================================
-- Orders table indexes
-- ============================================================================

-- Index on customer_id for customer order history queries
CREATE INDEX IF NOT EXISTS idx_orders_customer_id
ON public.orders(customer_id);

-- Index on transaction_id for payment verification and idempotency
CREATE INDEX IF NOT EXISTS idx_orders_transaction_id
ON public.orders(transaction_id);

-- Index on order status for filtering active/processing orders
CREATE INDEX IF NOT EXISTS idx_orders_status
ON public.orders(status);

-- Index on order date for time-based queries
CREATE INDEX IF NOT EXISTS idx_orders_order_date
ON public.orders(order_date DESC);

-- Composite index for vendor orders by status
CREATE INDEX IF NOT EXISTS idx_orders_vendor_status
ON public.orders(vendor_id, status)
WHERE vendor_id IS NOT NULL;

-- ============================================================================
-- Order Items table indexes
-- ============================================================================

-- Index on order_id for fetching order details (prevents N+1 queries)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id
ON public.order_items(order_id);

-- Index on product_id for product sales analytics
CREATE INDEX IF NOT EXISTS idx_order_items_product_id
ON public.order_items(product_id);

-- ============================================================================
-- Products table indexes
-- ============================================================================

-- Index on vendor_id for vendor product listings
CREATE INDEX IF NOT EXISTS idx_products_vendor_id
ON public.products(vendor_id);

-- Index on category_id for category browsing (if column exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'products' AND column_name = 'category_id') THEN
    CREATE INDEX IF NOT EXISTS idx_products_category_id
    ON public.products(category_id)
    WHERE category_id IS NOT NULL;
  END IF;
END $$;

-- Index on primary_category_id
CREATE INDEX IF NOT EXISTS idx_products_primary_category_id
ON public.products(primary_category_id)
WHERE primary_category_id IS NOT NULL;

-- Index on SKU for inventory lookups
CREATE INDEX IF NOT EXISTS idx_products_sku
ON public.products(sku)
WHERE sku IS NOT NULL;

-- Index on barcode for scanning operations (if column exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'products' AND column_name = 'barcode') THEN
    CREATE INDEX IF NOT EXISTS idx_products_barcode
    ON public.products(barcode)
    WHERE barcode IS NOT NULL;
  END IF;
END $$;

-- Index on status for active product queries
CREATE INDEX IF NOT EXISTS idx_products_status
ON public.products(status);

-- Composite index for vendor active products
CREATE INDEX IF NOT EXISTS idx_products_vendor_status
ON public.products(vendor_id, status);

-- Full text search index on product name (requires pg_trgm extension)
DO $$
BEGIN
  -- Enable pg_trgm extension if not already enabled
  CREATE EXTENSION IF NOT EXISTS pg_trgm;

  -- Create trigram index for fuzzy text search
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_name_trgm') THEN
    CREATE INDEX idx_products_name_trgm
    ON public.products USING gin(name gin_trgm_ops);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- If extension cannot be created (insufficient permissions), skip
    RAISE NOTICE 'Could not create trigram index: %', SQLERRM;
END $$;

-- ============================================================================
-- Customers table indexes
-- ============================================================================

-- Index on email for customer lookups (should already exist as unique constraint)
-- This ensures fast customer creation/lookup in payment flow
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_email
ON public.customers(email);

-- Index on phone for customer search
CREATE INDEX IF NOT EXISTS idx_customers_phone
ON public.customers(phone)
WHERE phone IS NOT NULL;

-- ============================================================================
-- Categories table indexes
-- ============================================================================

-- Index on vendor_id for vendor category management
CREATE INDEX IF NOT EXISTS idx_categories_vendor_id
ON public.categories(vendor_id);

-- Index on parent_id for hierarchical category queries
CREATE INDEX IF NOT EXISTS idx_categories_parent_id
ON public.categories(parent_id)
WHERE parent_id IS NOT NULL;

-- Index on slug for category page lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug
ON public.categories(slug);

-- ============================================================================
-- Inventory table indexes (if exists)
-- ============================================================================

-- Index on product_id for inventory lookups
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inventory') THEN
    CREATE INDEX IF NOT EXISTS idx_inventory_product_id
    ON public.inventory(product_id);

    CREATE INDEX IF NOT EXISTS idx_inventory_location_id
    ON public.inventory(location_id)
    WHERE location_id IS NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- User activity indexes
-- ============================================================================

-- Index on users table vendor_id for vendor user lookups
CREATE INDEX IF NOT EXISTS idx_users_vendor_id
ON public.users(vendor_id)
WHERE vendor_id IS NOT NULL;

-- Index on users email for login queries
CREATE INDEX IF NOT EXISTS idx_users_email
ON public.users(email);

-- Index on users role for authorization queries
CREATE INDEX IF NOT EXISTS idx_users_role
ON public.users(role);

-- ============================================================================
-- Comments and analysis
-- ============================================================================

-- Add table statistics update
ANALYZE public.orders;
ANALYZE public.order_items;
ANALYZE public.products;
ANALYZE public.customers;
ANALYZE public.categories;
ANALYZE public.users;

COMMENT ON INDEX idx_orders_customer_id IS 'Optimizes customer order history queries';
COMMENT ON INDEX idx_orders_transaction_id IS 'Enables fast payment verification and idempotency checks';
COMMENT ON INDEX idx_order_items_order_id IS 'Prevents N+1 queries when loading order details';
COMMENT ON INDEX idx_products_vendor_id IS 'Optimizes vendor product listing queries';
COMMENT ON INDEX idx_customers_email IS 'Ensures fast customer lookup during checkout';
