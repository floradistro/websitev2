-- ============================================================================
-- REMOVE ALL WORDPRESS_ID COLUMNS
-- Complete removal of WordPress legacy identifiers
-- ============================================================================

-- Drop indexes first
DROP INDEX IF EXISTS idx_customers_wordpress_id;
DROP INDEX IF EXISTS idx_vendors_wordpress_id;
DROP INDEX IF EXISTS orders_wordpress_id_idx;
DROP INDEX IF EXISTS customers_wordpress_id_idx;

-- Drop wordpress_id columns from all tables
ALTER TABLE public.products DROP COLUMN IF EXISTS wordpress_id CASCADE;
ALTER TABLE public.categories DROP COLUMN IF EXISTS wordpress_id CASCADE;
ALTER TABLE public.product_variations DROP COLUMN IF EXISTS wordpress_id CASCADE;
ALTER TABLE public.customers DROP COLUMN IF EXISTS wordpress_id CASCADE;
ALTER TABLE public.orders DROP COLUMN IF EXISTS wordpress_id CASCADE;
ALTER TABLE public.order_items DROP COLUMN IF EXISTS wordpress_id CASCADE;
ALTER TABLE public.order_refunds DROP COLUMN IF EXISTS wordpress_id CASCADE;
ALTER TABLE public.product_reviews DROP COLUMN IF EXISTS wordpress_id CASCADE;
ALTER TABLE public.coupons DROP COLUMN IF EXISTS wordpress_id CASCADE;

-- Drop wordpress_user_id columns if they exist
ALTER TABLE public.customers DROP COLUMN IF EXISTS wordpress_user_id CASCADE;
ALTER TABLE public.vendors DROP COLUMN IF EXISTS wordpress_user_id CASCADE;

-- Drop wordpress_product_id column if exists
ALTER TABLE public.order_items DROP COLUMN IF EXISTS wordpress_product_id CASCADE;
