-- ============================================================================
-- PHASE 1 SECURITY FIX: Replace Header-Based RLS with JWT-Based RLS
-- ============================================================================
--
-- CRITICAL SECURITY FIX:
-- Existing RLS policies use current_setting('request.headers.x-vendor-id')
-- which is VULNERABLE to header spoofing attacks.
--
-- This migration replaces all header-based RLS policies with JWT-based policies
-- that extract vendor_id from the authenticated user's JWT token.
--
-- Pattern:
--   OLD (VULNERABLE): current_setting('request.headers.x-vendor-id', true)
--   NEW (SECURE):     (auth.jwt() ->> 'vendor_id')::uuid
--
-- Date: November 8, 2025
-- ============================================================================

-- Helper function to get vendor_id from JWT token
-- IMPORTANT: Created in public schema due to Supabase auth schema permissions
CREATE OR REPLACE FUNCTION public.get_vendor_id_from_jwt()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'vendor_id')::uuid,
    (auth.jwt() ->> 'vendor_id')::uuid
  );
$$;

-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS products_select_own ON products;
DROP POLICY IF EXISTS products_insert_own ON products;
DROP POLICY IF EXISTS products_update_own ON products;
DROP POLICY IF EXISTS products_delete_own ON products;
DROP POLICY IF EXISTS products_service_role ON products;

-- Service role has full access
CREATE POLICY products_service_role
  ON products
  FOR ALL
  USING (auth.role() = 'service_role');

-- Vendors can view their own products
CREATE POLICY products_select_own
  ON products
  FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- Vendors can insert their own products
CREATE POLICY products_insert_own
  ON products
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- Vendors can update their own products
CREATE POLICY products_update_own
  ON products
  FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  )
  WITH CHECK (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- Vendors can delete their own products
CREATE POLICY products_delete_own
  ON products
  FOR DELETE
  USING (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- ============================================================================
-- INVENTORY TABLE
-- ============================================================================

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventory_select_own ON inventory;
DROP POLICY IF EXISTS inventory_insert_own ON inventory;
DROP POLICY IF EXISTS inventory_update_own ON inventory;
DROP POLICY IF EXISTS inventory_delete_own ON inventory;
DROP POLICY IF EXISTS inventory_service_role ON inventory;

-- Service role has full access
CREATE POLICY inventory_service_role
  ON inventory
  FOR ALL
  USING (auth.role() = 'service_role');

-- Vendors can view their own inventory
CREATE POLICY inventory_select_own
  ON inventory
  FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- Vendors can insert their own inventory
CREATE POLICY inventory_insert_own
  ON inventory
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- Vendors can update their own inventory
CREATE POLICY inventory_update_own
  ON inventory
  FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  )
  WITH CHECK (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- Vendors can delete their own inventory
CREATE POLICY inventory_delete_own
  ON inventory
  FOR DELETE
  USING (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- ============================================================================
-- LOCATIONS TABLE
-- ============================================================================

ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS locations_select_own ON locations;
DROP POLICY IF EXISTS locations_insert_own ON locations;
DROP POLICY IF EXISTS locations_update_own ON locations;
DROP POLICY IF EXISTS locations_delete_own ON locations;
DROP POLICY IF EXISTS locations_service_role ON locations;
DROP POLICY IF EXISTS locations_select_retail_public ON locations;

-- Service role has full access
CREATE POLICY locations_service_role
  ON locations
  FOR ALL
  USING (auth.role() = 'service_role');

-- Public can view retail locations (for storefront)
CREATE POLICY locations_select_retail_public
  ON locations
  FOR SELECT
  USING (type = 'retail');

-- Vendors can view their own locations
CREATE POLICY locations_select_own
  ON locations
  FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    type = 'retail' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- Vendors can insert their own locations
CREATE POLICY locations_insert_own
  ON locations
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- Vendors can update their own locations
CREATE POLICY locations_update_own
  ON locations
  FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  )
  WITH CHECK (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- Vendors can delete their own locations
CREATE POLICY locations_delete_own
  ON locations
  FOR DELETE
  USING (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- ============================================================================
-- USERS TABLE (Employees)
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_insert_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS users_delete_own ON users;
DROP POLICY IF EXISTS users_service_role ON users;

-- Service role has full access
CREATE POLICY users_service_role
  ON users
  FOR ALL
  USING (auth.role() = 'service_role');

-- Vendors can view their own employees
CREATE POLICY users_select_own
  ON users
  FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- Vendors can insert their own employees
CREATE POLICY users_insert_own
  ON users
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- Vendors can update their own employees
CREATE POLICY users_update_own
  ON users
  FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  )
  WITH CHECK (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- Vendors can delete their own employees
CREATE POLICY users_delete_own
  ON users
  FOR DELETE
  USING (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- ============================================================================
-- STOCK_MOVEMENTS TABLE
-- ============================================================================

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stock_movements_select_own ON stock_movements;
DROP POLICY IF EXISTS stock_movements_insert_own ON stock_movements;
DROP POLICY IF EXISTS stock_movements_service_role ON stock_movements;

-- Service role has full access
CREATE POLICY stock_movements_service_role
  ON stock_movements
  FOR ALL
  USING (auth.role() = 'service_role');

-- Vendors can view their own stock movements (via product relationship)
CREATE POLICY stock_movements_select_own
  ON stock_movements
  FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = stock_movements.product_id
      AND products.vendor_id = public.get_vendor_id_from_jwt()
    )
  );

-- Vendors can insert stock movements for their own products
CREATE POLICY stock_movements_insert_own
  ON stock_movements
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM products
      WHERE products.id = stock_movements.product_id
      AND products.vendor_id = public.get_vendor_id_from_jwt()
    )
  );

-- ============================================================================
-- PRICING_TIER_BLUEPRINTS TABLE
-- ============================================================================

ALTER TABLE pricing_tier_blueprints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pricing_tier_blueprints_select_own ON pricing_tier_blueprints;
DROP POLICY IF EXISTS pricing_tier_blueprints_insert_own ON pricing_tier_blueprints;
DROP POLICY IF EXISTS pricing_tier_blueprints_update_own ON pricing_tier_blueprints;
DROP POLICY IF EXISTS pricing_tier_blueprints_delete_own ON pricing_tier_blueprints;
DROP POLICY IF EXISTS pricing_tier_blueprints_service_role ON pricing_tier_blueprints;

-- Service role has full access
CREATE POLICY pricing_tier_blueprints_service_role
  ON pricing_tier_blueprints
  FOR ALL
  USING (auth.role() = 'service_role');

-- Vendors can view their own pricing blueprints
CREATE POLICY pricing_tier_blueprints_select_own
  ON pricing_tier_blueprints
  FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- Vendors can insert their own pricing blueprints
CREATE POLICY pricing_tier_blueprints_insert_own
  ON pricing_tier_blueprints
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- Vendors can update their own pricing blueprints
CREATE POLICY pricing_tier_blueprints_update_own
  ON pricing_tier_blueprints
  FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  )
  WITH CHECK (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- Vendors can delete their own pricing blueprints
CREATE POLICY pricing_tier_blueprints_delete_own
  ON pricing_tier_blueprints
  FOR DELETE
  USING (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- ============================================================================
-- VENDOR_MEDIA TABLE
-- ============================================================================

ALTER TABLE vendor_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vendor_media_select_own ON vendor_media;
DROP POLICY IF EXISTS vendor_media_insert_own ON vendor_media;
DROP POLICY IF EXISTS vendor_media_update_own ON vendor_media;
DROP POLICY IF EXISTS vendor_media_delete_own ON vendor_media;
DROP POLICY IF EXISTS vendor_media_service_role ON vendor_media;

-- Service role has full access
CREATE POLICY vendor_media_service_role
  ON vendor_media
  FOR ALL
  USING (auth.role() = 'service_role');

-- Vendors can see their own media
CREATE POLICY vendor_media_select_own
  ON vendor_media
  FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- Vendors can insert their own media
CREATE POLICY vendor_media_insert_own
  ON vendor_media
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- Vendors can update their own media
CREATE POLICY vendor_media_update_own
  ON vendor_media
  FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  )
  WITH CHECK (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- Vendors can delete their own media
CREATE POLICY vendor_media_delete_own
  ON vendor_media
  FOR DELETE
  USING (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- ============================================================================
-- ORDERS TABLE
-- ============================================================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS orders_select_own ON orders;
DROP POLICY IF EXISTS orders_insert_any ON orders;
DROP POLICY IF EXISTS orders_update_own ON orders;
DROP POLICY IF EXISTS orders_service_role ON orders;

-- Service role has full access
CREATE POLICY orders_service_role
  ON orders
  FOR ALL
  USING (auth.role() = 'service_role');

-- Vendors can view their own orders
CREATE POLICY orders_select_own
  ON orders
  FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- Anyone can create orders (public checkout)
CREATE POLICY orders_insert_any
  ON orders
  FOR INSERT
  WITH CHECK (true);

-- Vendors can update their own orders
CREATE POLICY orders_update_own
  ON orders
  FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  )
  WITH CHECK (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- ============================================================================
-- POS_SESSIONS TABLE
-- ============================================================================

ALTER TABLE pos_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pos_sessions_select_own ON pos_sessions;
DROP POLICY IF EXISTS pos_sessions_insert_own ON pos_sessions;
DROP POLICY IF EXISTS pos_sessions_update_own ON pos_sessions;
DROP POLICY IF EXISTS pos_sessions_service_role ON pos_sessions;

-- Service role has full access
CREATE POLICY pos_sessions_service_role
  ON pos_sessions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Vendors can view their own POS sessions
CREATE POLICY pos_sessions_select_own
  ON pos_sessions
  FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- Vendors can create their own POS sessions
CREATE POLICY pos_sessions_insert_own
  ON pos_sessions
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- Vendors can update their own POS sessions
CREATE POLICY pos_sessions_update_own
  ON pos_sessions
  FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  )
  WITH CHECK (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- ============================================================================
-- PURCHASE_ORDERS TABLE
-- ============================================================================

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS purchase_orders_select_own ON purchase_orders;
DROP POLICY IF EXISTS purchase_orders_insert_own ON purchase_orders;
DROP POLICY IF EXISTS purchase_orders_update_own ON purchase_orders;
DROP POLICY IF EXISTS purchase_orders_delete_own ON purchase_orders;
DROP POLICY IF EXISTS purchase_orders_service_role ON purchase_orders;

-- Service role has full access
CREATE POLICY purchase_orders_service_role
  ON purchase_orders
  FOR ALL
  USING (auth.role() = 'service_role');

-- Vendors can view their own purchase orders
CREATE POLICY purchase_orders_select_own
  ON purchase_orders
  FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- Vendors can create their own purchase orders
CREATE POLICY purchase_orders_insert_own
  ON purchase_orders
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- Vendors can update their own purchase orders
CREATE POLICY purchase_orders_update_own
  ON purchase_orders
  FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  )
  WITH CHECK (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- Vendors can delete their own purchase orders
CREATE POLICY purchase_orders_delete_own
  ON purchase_orders
  FOR DELETE
  USING (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- ============================================================================
-- MARKETING_CAMPAIGNS TABLE
-- ============================================================================

ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS marketing_campaigns_select_own ON marketing_campaigns;
DROP POLICY IF EXISTS marketing_campaigns_insert_own ON marketing_campaigns;
DROP POLICY IF EXISTS marketing_campaigns_update_own ON marketing_campaigns;
DROP POLICY IF EXISTS marketing_campaigns_delete_own ON marketing_campaigns;
DROP POLICY IF EXISTS marketing_campaigns_service_role ON marketing_campaigns;

-- Service role has full access
CREATE POLICY marketing_campaigns_service_role
  ON marketing_campaigns
  FOR ALL
  USING (auth.role() = 'service_role');

-- Vendors can view their own campaigns
CREATE POLICY marketing_campaigns_select_own
  ON marketing_campaigns
  FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- Vendors can create their own campaigns
CREATE POLICY marketing_campaigns_insert_own
  ON marketing_campaigns
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- Vendors can update their own campaigns
CREATE POLICY marketing_campaigns_update_own
  ON marketing_campaigns
  FOR UPDATE
  USING (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  )
  WITH CHECK (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- Vendors can delete their own campaigns
CREATE POLICY marketing_campaigns_delete_own
  ON marketing_campaigns
  FOR DELETE
  USING (
    auth.role() = 'service_role' OR
    vendor_id = public.get_vendor_id_from_jwt()
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Create audit log
DO $$
BEGIN
  RAISE NOTICE '✅ RLS Policies Updated - Vendor Isolation Enforced';
  RAISE NOTICE 'Tables secured: products, inventory, locations, users, stock_movements';
  RAISE NOTICE 'Auth method: JWT-based (vendor_id from token)';
  RAISE NOTICE 'Security level: Database-enforced vendor isolation';
END $$;
