-- =====================================================
-- BULK OPERATIONS FOR ADMIN PANEL
-- High-performance batch operations for products, vendors, etc.
-- =====================================================

-- =====================================================
-- 1. BULK PRODUCT OPERATIONS
-- =====================================================

-- Bulk delete products (with inventory cleanup)
CREATE OR REPLACE FUNCTION public.bulk_delete_products(
  product_ids UUID[],
  force_delete BOOLEAN DEFAULT false
)
RETURNS TABLE (
  product_id UUID,
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  p_id UUID;
  has_inventory BOOLEAN;
BEGIN
  FOREACH p_id IN ARRAY product_ids
  LOOP
    BEGIN
      -- Check if product has inventory
      SELECT EXISTS(
        SELECT 1 FROM public.inventory WHERE product_id = p_id AND quantity > 0
      ) INTO has_inventory;

      IF has_inventory AND NOT force_delete THEN
        -- Return error if has inventory and not force delete
        RETURN QUERY SELECT p_id, false, 'Product has inventory. Use force_delete=true to remove.'::TEXT;
      ELSE
        -- Delete related records first
        IF force_delete THEN
          DELETE FROM public.inventory WHERE product_id = p_id;
          DELETE FROM public.inventory_adjustments WHERE product_id = p_id;
        END IF;
        
        DELETE FROM public.product_images WHERE product_id = p_id;
        DELETE FROM public.product_tags WHERE product_id = p_id;
        DELETE FROM public.product_categories WHERE product_id = p_id;
        DELETE FROM public.reviews WHERE product_id = p_id;
        DELETE FROM public.products WHERE id = p_id;
        
        RETURN QUERY SELECT p_id, true, NULL::TEXT;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT p_id, false, SQLERRM::TEXT;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bulk approve products
CREATE OR REPLACE FUNCTION public.bulk_approve_products(
  product_ids UUID[]
)
RETURNS TABLE (
  product_id UUID,
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  p_id UUID;
BEGIN
  FOREACH p_id IN ARRAY product_ids
  LOOP
    BEGIN
      UPDATE public.products
      SET 
        status = 'published',
        updated_at = NOW()
      WHERE id = p_id;
      
      IF FOUND THEN
        RETURN QUERY SELECT p_id, true, NULL::TEXT;
      ELSE
        RETURN QUERY SELECT p_id, false, 'Product not found'::TEXT;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT p_id, false, SQLERRM::TEXT;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bulk update product status
CREATE OR REPLACE FUNCTION public.bulk_update_product_status(
  product_ids UUID[],
  new_status TEXT
)
RETURNS TABLE (
  product_id UUID,
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  p_id UUID;
BEGIN
  FOREACH p_id IN ARRAY product_ids
  LOOP
    BEGIN
      UPDATE public.products
      SET 
        status = new_status,
        updated_at = NOW()
      WHERE id = p_id;
      
      IF FOUND THEN
        RETURN QUERY SELECT p_id, true, NULL::TEXT;
      ELSE
        RETURN QUERY SELECT p_id, false, 'Product not found'::TEXT;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT p_id, false, SQLERRM::TEXT;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. BULK VENDOR OPERATIONS
-- =====================================================

-- Bulk update vendor status
CREATE OR REPLACE FUNCTION public.bulk_update_vendor_status(
  vendor_ids UUID[],
  new_status TEXT
)
RETURNS TABLE (
  vendor_id UUID,
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_id UUID;
BEGIN
  FOREACH v_id IN ARRAY vendor_ids
  LOOP
    BEGIN
      UPDATE public.vendors
      SET 
        status = new_status,
        updated_at = NOW()
      WHERE id = v_id;
      
      IF FOUND THEN
        RETURN QUERY SELECT v_id, true, NULL::TEXT;
      ELSE
        RETURN QUERY SELECT v_id, false, 'Vendor not found'::TEXT;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT v_id, false, SQLERRM::TEXT;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bulk delete vendors
CREATE OR REPLACE FUNCTION public.bulk_delete_vendors(
  vendor_ids UUID[]
)
RETURNS TABLE (
  vendor_id UUID,
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  v_id UUID;
BEGIN
  FOREACH v_id IN ARRAY vendor_ids
  LOOP
    BEGIN
      -- Delete vendor and cascade to related records
      DELETE FROM public.vendors WHERE id = v_id;
      
      IF FOUND THEN
        RETURN QUERY SELECT v_id, true, NULL::TEXT;
      ELSE
        RETURN QUERY SELECT v_id, false, 'Vendor not found'::TEXT;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT v_id, false, SQLERRM::TEXT;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. BULK USER OPERATIONS
-- =====================================================

-- Bulk update user status
CREATE OR REPLACE FUNCTION public.bulk_update_user_status(
  user_ids UUID[],
  new_status TEXT
)
RETURNS TABLE (
  user_id UUID,
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  u_id UUID;
BEGIN
  FOREACH u_id IN ARRAY user_ids
  LOOP
    BEGIN
      UPDATE public.users
      SET 
        status = new_status,
        updated_at = NOW()
      WHERE id = u_id;
      
      IF FOUND THEN
        RETURN QUERY SELECT u_id, true, NULL::TEXT;
      ELSE
        RETURN QUERY SELECT u_id, false, 'User not found'::TEXT;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT u_id, false, SQLERRM::TEXT;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. BULK ORDER OPERATIONS
-- =====================================================

-- Bulk update order status
CREATE OR REPLACE FUNCTION public.bulk_update_order_status(
  order_ids UUID[],
  new_status TEXT
)
RETURNS TABLE (
  order_id UUID,
  success BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  o_id UUID;
BEGIN
  FOREACH o_id IN ARRAY order_ids
  LOOP
    BEGIN
      UPDATE public.orders
      SET 
        status = new_status,
        updated_at = NOW()
      WHERE id = o_id;
      
      IF FOUND THEN
        RETURN QUERY SELECT o_id, true, NULL::TEXT;
      ELSE
        RETURN QUERY SELECT o_id, false, 'Order not found'::TEXT;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RETURN QUERY SELECT o_id, false, SQLERRM::TEXT;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. COMMENTS
-- =====================================================

COMMENT ON FUNCTION public.bulk_delete_products IS 'Delete multiple products at once with optional force delete for products with inventory';
COMMENT ON FUNCTION public.bulk_approve_products IS 'Approve multiple products at once';
COMMENT ON FUNCTION public.bulk_update_product_status IS 'Update status for multiple products';
COMMENT ON FUNCTION public.bulk_update_vendor_status IS 'Update status for multiple vendors';
COMMENT ON FUNCTION public.bulk_delete_vendors IS 'Delete multiple vendors at once';
COMMENT ON FUNCTION public.bulk_update_user_status IS 'Update status for multiple users';
COMMENT ON FUNCTION public.bulk_update_order_status IS 'Update status for multiple orders';



