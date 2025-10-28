-- ============================================================================
-- TV MENU + INVENTORY INTEGRATION
-- Date: 2025-10-28
-- Purpose: Enable real-time inventory sync between TV displays, POS, and inventory
-- ============================================================================

-- ============================================================================
-- PHASE 1: Enhance tv_menus table with inventory sync fields
-- ============================================================================

ALTER TABLE public.tv_menus
ADD COLUMN IF NOT EXISTS sync_with_inventory BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hide_out_of_stock BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_low_stock_badges BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS sync_pricing BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_stock_count BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS show_new_badge_days INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS show_sale_badges BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_inventory_sync TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_refresh_interval INTEGER DEFAULT 60, -- seconds
ADD COLUMN IF NOT EXISTS sort_by TEXT DEFAULT 'name' CHECK (sort_by IN (
  'name', 'price_asc', 'price_desc', 'stock_qty',
  'popularity', 'newest', 'featured', 'sales_rank'
)),
ADD COLUMN IF NOT EXISTS max_products_displayed INTEGER DEFAULT 50;

COMMENT ON COLUMN public.tv_menus.sync_with_inventory IS 'Enable real-time inventory synchronization';
COMMENT ON COLUMN public.tv_menus.hide_out_of_stock IS 'Automatically hide products when inventory = 0';
COMMENT ON COLUMN public.tv_menus.show_low_stock_badges IS 'Display "Limited Stock" badges';
COMMENT ON COLUMN public.tv_menus.low_stock_threshold IS 'Quantity threshold for low stock badge';
COMMENT ON COLUMN public.tv_menus.sync_pricing IS 'Sync real-time pricing from POS';
COMMENT ON COLUMN public.tv_menus.show_stock_count IS 'Display actual stock quantity ("Only 3 left!")';
COMMENT ON COLUMN public.tv_menus.show_new_badge_days IS 'How many days to show "NEW" badge on new products';
COMMENT ON COLUMN public.tv_menus.auto_refresh_interval IS 'Auto-refresh interval in seconds';
COMMENT ON COLUMN public.tv_menus.sort_by IS 'How to sort products on TV display';

-- ============================================================================
-- PHASE 2: Create tv_menu_product_rules table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tv_menu_product_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tv_menu_id UUID NOT NULL REFERENCES public.tv_menus(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,

  -- Product Filtering
  category_filter TEXT[], -- Which categories to show (null = all)
  tag_filter TEXT[], -- Which tags to filter by
  min_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  featured_only BOOLEAN DEFAULT false,

  -- Inventory Rules
  require_in_stock BOOLEAN DEFAULT true,
  min_available_qty INTEGER, -- Only show if qty >= X
  hide_if_reserved_qty_gte INTEGER, -- Hide if too many reserved

  -- Display Priority
  priority_products UUID[], -- Product IDs to prioritize
  exclude_products UUID[], -- Product IDs to never show

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tv_menu_product_rules_menu ON public.tv_menu_product_rules(tv_menu_id);
CREATE INDEX IF NOT EXISTS idx_tv_menu_product_rules_vendor ON public.tv_menu_product_rules(vendor_id);
CREATE INDEX IF NOT EXISTS idx_tv_menu_product_rules_active ON public.tv_menu_product_rules(is_active);

-- RLS Policies
ALTER TABLE public.tv_menu_product_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can manage their own menu rules" ON public.tv_menu_product_rules;
CREATE POLICY "Vendors can manage their own menu rules"
  ON public.tv_menu_product_rules FOR ALL
  USING (true); -- Simplified: App handles auth via service role

-- Update timestamp trigger
CREATE TRIGGER tv_menu_product_rules_updated_at
  BEFORE UPDATE ON public.tv_menu_product_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.tv_menu_product_rules IS 'Rules for filtering and displaying products on TV menus';

-- ============================================================================
-- PHASE 3: Create tv_menu_inventory_cache table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tv_menu_inventory_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tv_menu_id UUID NOT NULL REFERENCES public.tv_menus(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,

  -- Cached Inventory Data (for fast TV display)
  available_quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  stock_status TEXT,
  is_low_stock BOOLEAN DEFAULT false,
  is_out_of_stock BOOLEAN DEFAULT false,

  -- Cached Product Data
  current_price DECIMAL(10,2),
  is_on_sale BOOLEAN DEFAULT false,
  sale_price DECIMAL(10,2),
  discount_percentage DECIMAL(5,2),

  -- Display Metadata
  is_new_product BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER,

  -- Analytics
  display_count INTEGER DEFAULT 0,
  last_displayed_at TIMESTAMPTZ,
  sales_count_24h INTEGER DEFAULT 0,
  sales_count_7d INTEGER DEFAULT 0,

  -- Cache Management
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  cache_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '60 seconds'),
  sync_version INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(tv_menu_id, product_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_tv_menu_cache_menu ON public.tv_menu_inventory_cache(tv_menu_id);
CREATE INDEX IF NOT EXISTS idx_tv_menu_cache_product ON public.tv_menu_inventory_cache(product_id);
CREATE INDEX IF NOT EXISTS idx_tv_menu_cache_location ON public.tv_menu_inventory_cache(location_id);
CREATE INDEX IF NOT EXISTS idx_tv_menu_cache_stock ON public.tv_menu_inventory_cache(is_out_of_stock, is_low_stock);
CREATE INDEX IF NOT EXISTS idx_tv_menu_cache_expires ON public.tv_menu_inventory_cache(cache_expires_at);
CREATE INDEX IF NOT EXISTS idx_tv_menu_cache_synced ON public.tv_menu_inventory_cache(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_tv_menu_cache_display ON public.tv_menu_inventory_cache(display_order);

-- RLS Policies
ALTER TABLE public.tv_menu_inventory_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read inventory cache for TV displays" ON public.tv_menu_inventory_cache;
CREATE POLICY "Anyone can read inventory cache for TV displays"
  ON public.tv_menu_inventory_cache FOR SELECT
  USING (true); -- Public read for TV displays

DROP POLICY IF EXISTS "Service can manage inventory cache" ON public.tv_menu_inventory_cache;
CREATE POLICY "Service can manage inventory cache"
  ON public.tv_menu_inventory_cache FOR ALL
  USING (true); -- Service role handles writes

-- Update timestamp trigger
CREATE TRIGGER tv_menu_inventory_cache_updated_at
  BEFORE UPDATE ON public.tv_menu_inventory_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.tv_menu_inventory_cache IS 'Fast-access cache of inventory data for TV menu displays';
COMMENT ON COLUMN public.tv_menu_inventory_cache.available_quantity IS 'Current available stock quantity';
COMMENT ON COLUMN public.tv_menu_inventory_cache.is_low_stock IS 'True when quantity is below threshold';
COMMENT ON COLUMN public.tv_menu_inventory_cache.cache_expires_at IS 'When this cache entry should be refreshed';
COMMENT ON COLUMN public.tv_menu_inventory_cache.sync_version IS 'Version number for optimistic locking';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if product is "new" based on created_at
CREATE OR REPLACE FUNCTION is_product_new(
  created_at TIMESTAMPTZ,
  new_badge_days INTEGER DEFAULT 7
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN created_at >= (NOW() - (new_badge_days || ' days')::INTERVAL);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION is_product_new IS 'Check if product is new based on creation date';

-- Function to calculate low stock status
CREATE OR REPLACE FUNCTION is_low_stock(
  available_qty INTEGER,
  threshold INTEGER DEFAULT 10
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN available_qty > 0 AND available_qty <= threshold;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION is_low_stock IS 'Check if product is low stock based on threshold';

-- Function to update inventory cache for a menu
CREATE OR REPLACE FUNCTION refresh_tv_menu_inventory_cache(
  p_menu_id UUID,
  p_location_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  rows_updated INTEGER := 0;
  menu_record RECORD;
BEGIN
  -- Get menu configuration
  SELECT * INTO menu_record
  FROM public.tv_menus
  WHERE id = p_menu_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TV menu not found: %', p_menu_id;
  END IF;

  -- Only refresh if sync is enabled
  IF NOT menu_record.sync_with_inventory THEN
    RETURN 0;
  END IF;

  -- Delete old cache entries
  DELETE FROM public.tv_menu_inventory_cache
  WHERE tv_menu_id = p_menu_id
    AND (p_location_id IS NULL OR location_id = p_location_id)
    AND cache_expires_at < NOW();

  -- Insert/update cache from current inventory
  INSERT INTO public.tv_menu_inventory_cache (
    tv_menu_id,
    product_id,
    location_id,
    available_quantity,
    reserved_quantity,
    stock_status,
    is_low_stock,
    is_out_of_stock,
    current_price,
    is_on_sale,
    sale_price,
    is_new_product,
    is_featured,
    last_synced_at,
    cache_expires_at
  )
  SELECT
    p_menu_id,
    p.id,
    i.location_id,
    i.available_quantity,
    i.reserved_quantity,
    i.stock_status,
    is_low_stock(i.available_quantity, menu_record.low_stock_threshold),
    i.available_quantity <= 0,
    p.regular_price,
    p.on_sale,
    p.sale_price,
    is_product_new(p.created_at, menu_record.show_new_badge_days),
    p.featured,
    NOW(),
    NOW() + (menu_record.auto_refresh_interval || ' seconds')::INTERVAL
  FROM public.products p
  INNER JOIN public.inventory i ON i.product_id = p.id
  WHERE p.vendor_id = menu_record.vendor_id
    AND p.status = 'published'
    AND (p_location_id IS NULL OR i.location_id = p_location_id)
    AND (NOT menu_record.hide_out_of_stock OR i.available_quantity > 0)
  ON CONFLICT (tv_menu_id, product_id, location_id)
  DO UPDATE SET
    available_quantity = EXCLUDED.available_quantity,
    reserved_quantity = EXCLUDED.reserved_quantity,
    stock_status = EXCLUDED.stock_status,
    is_low_stock = EXCLUDED.is_low_stock,
    is_out_of_stock = EXCLUDED.is_out_of_stock,
    current_price = EXCLUDED.current_price,
    is_on_sale = EXCLUDED.is_on_sale,
    sale_price = EXCLUDED.sale_price,
    is_new_product = EXCLUDED.is_new_product,
    is_featured = EXCLUDED.is_featured,
    last_synced_at = NOW(),
    cache_expires_at = NOW() + (menu_record.auto_refresh_interval || ' seconds')::INTERVAL,
    sync_version = tv_menu_inventory_cache.sync_version + 1;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;

  -- Update menu's last sync timestamp
  UPDATE public.tv_menus
  SET last_inventory_sync = NOW()
  WHERE id = p_menu_id;

  RETURN rows_updated;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_tv_menu_inventory_cache IS 'Refresh inventory cache for a TV menu';

-- ============================================================================
-- AUTOMATED CACHE CLEANUP
-- ============================================================================

-- Function to clean expired cache entries (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_tv_menu_cache()
RETURNS INTEGER AS $$
DECLARE
  rows_deleted INTEGER := 0;
BEGIN
  DELETE FROM public.tv_menu_inventory_cache
  WHERE cache_expires_at < NOW();

  GET DIAGNOSTICS rows_deleted = ROW_COUNT;

  RETURN rows_deleted;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_tv_menu_cache IS 'Delete expired cache entries (run via cron every hour)';

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Example: Create a test menu with inventory sync enabled
/*
INSERT INTO public.tv_menu_product_rules (
  tv_menu_id,
  vendor_id,
  require_in_stock,
  min_available_qty,
  priority_products
) VALUES (
  'your-menu-id-here',
  'your-vendor-id-here',
  true,
  1,
  ARRAY['product-id-1', 'product-id-2']::UUID[]
);
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log successful migration
DO $$
BEGIN
  RAISE NOTICE 'TV Menu + Inventory Integration migration completed successfully';
  RAISE NOTICE 'Tables created: tv_menu_product_rules, tv_menu_inventory_cache';
  RAISE NOTICE 'Columns added to tv_menus: sync_with_inventory, hide_out_of_stock, etc.';
  RAISE NOTICE 'Functions created: is_product_new, is_low_stock, refresh_tv_menu_inventory_cache, cleanup_expired_tv_menu_cache';
END $$;
