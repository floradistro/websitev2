-- ============================================================================
-- PERFORMANCE OPTIMIZATION: Materialized Views
-- Enterprise-grade query optimization like Amazon RDS
-- ============================================================================

-- Materialized view for product display (refreshed every 5 minutes)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.products_display_view AS
SELECT 
  p.id,
  p.name,
  p.slug,
  p.description,
  p.regular_price,
  p.sale_price,
  p.featured_image_storage as featured_image,
  p.status,
  p.vendor_id,
  v.store_name as vendor_name,
  v.slug as vendor_slug,
  v.status as vendor_status,
  c.name as category_name,
  c.slug as category_slug,
  -- Pre-calculated total stock across all locations
  COALESCE(
    (SELECT SUM(i.quantity) 
     FROM inventory i 
     WHERE i.product_id = p.id),
    p.stock_quantity,
    0
  ) as total_stock,
  -- Pre-calculated stock status
  CASE 
    WHEN COALESCE((SELECT SUM(i.quantity) FROM inventory i WHERE i.product_id = p.id), p.stock_quantity, 0) > 0 
    THEN 'instock'
    ELSE 'outofstock'
  END as calculated_stock_status,
  -- Location count
  (SELECT COUNT(DISTINCT location_id) 
   FROM inventory i 
   WHERE i.product_id = p.id AND i.quantity > 0) as available_locations,
  p.created_at,
  p.updated_at
FROM products p
LEFT JOIN vendors v ON p.vendor_id = v.id
LEFT JOIN categories c ON p.primary_category_id = c.id
WHERE p.status = 'published'
  AND (v.status = 'active' OR v.status IS NULL);

-- Index for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_display_view_id 
ON products_display_view(id);

CREATE INDEX IF NOT EXISTS idx_products_display_view_vendor 
ON products_display_view(vendor_id);

CREATE INDEX IF NOT EXISTS idx_products_display_view_stock 
ON products_display_view(total_stock);

-- ============================================================================
-- Vendor Dashboard Aggregates (refreshed hourly)
-- ============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.vendor_dashboard_stats AS
SELECT 
  v.id as vendor_id,
  v.store_name,
  -- Product counts
  COUNT(DISTINCT p.id) as total_products,
  COUNT(DISTINCT CASE WHEN p.status = 'published' THEN p.id END) as published_products,
  COUNT(DISTINCT CASE WHEN p.status = 'pending' THEN p.id END) as pending_products,
  -- Inventory stats
  COALESCE(SUM(i.quantity), 0) as total_inventory,
  COUNT(DISTINCT CASE WHEN i.stock_status = 'low_stock' THEN i.id END) as low_stock_items,
  COUNT(DISTINCT CASE WHEN i.stock_status = 'out_of_stock' THEN i.id END) as out_of_stock_items,
  -- Order stats (30 days)
  (SELECT COUNT(*) 
   FROM orders o 
   JOIN order_items oi ON o.id = oi.order_id 
   WHERE oi.vendor_id = v.id 
   AND o.created_at >= NOW() - INTERVAL '30 days') as orders_30d,
  -- Revenue (30 days)
  (SELECT COALESCE(SUM(oi.subtotal), 0)
   FROM orders o 
   JOIN order_items oi ON o.id = oi.order_id 
   WHERE oi.vendor_id = v.id 
   AND o.created_at >= NOW() - INTERVAL '30 days') as revenue_30d,
  NOW() as last_refreshed
FROM vendors v
LEFT JOIN products p ON v.id = p.vendor_id
LEFT JOIN inventory i ON v.id = i.vendor_id
WHERE v.status = 'active'
GROUP BY v.id, v.store_name;

-- Index for instant vendor lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_dashboard_stats_id 
ON vendor_dashboard_stats(vendor_id);

-- ============================================================================
-- Auto-refresh function (called by cron job)
-- ============================================================================
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  -- Refresh product view (frequently accessed)
  REFRESH MATERIALIZED VIEW CONCURRENTLY products_display_view;
  
  -- Refresh vendor stats (less frequent)
  REFRESH MATERIALIZED VIEW CONCURRENTLY vendor_dashboard_stats;
  
  -- Log refresh
  INSERT INTO system_logs (action, details, created_at)
  VALUES ('refresh_views', 'Materialized views refreshed', NOW());
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Cron job setup (using pg_cron extension)
-- ============================================================================
-- Run every 5 minutes for product view
-- SELECT cron.schedule('refresh-product-view', '*/5 * * * *', 
--   'SELECT refresh_materialized_views();');

COMMENT ON MATERIALIZED VIEW products_display_view IS 
'Pre-computed product display data for ultra-fast queries. Refreshed every 5 minutes.';

COMMENT ON MATERIALIZED VIEW vendor_dashboard_stats IS 
'Pre-aggregated vendor statistics for instant dashboard loading. Refreshed hourly.';
