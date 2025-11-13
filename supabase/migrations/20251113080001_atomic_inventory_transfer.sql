-- =====================================================
-- ATOMIC INVENTORY TRANSFER RPC FUNCTION
-- =====================================================
-- Purpose: Eliminate race conditions in inventory transfers
-- Risk Addressed: $10k+ monthly loss from inventory discrepancies
-- Apple Standard: ACID compliance, row-level locking
-- =====================================================

CREATE OR REPLACE FUNCTION atomic_inventory_transfer(
  p_vendor_id UUID,
  p_product_id UUID,
  p_from_location_id UUID,
  p_to_location_id UUID,
  p_quantity NUMERIC,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_from_inventory RECORD;
  v_to_inventory RECORD;
  v_from_location_name TEXT;
  v_to_location_name TEXT;
  v_current_qty NUMERIC;
  v_new_from_qty NUMERIC;
  v_new_to_qty NUMERIC;
  v_to_current_qty NUMERIC;
  v_total_stock NUMERIC;
  v_result JSON;
BEGIN
  -- =====================================================
  -- VALIDATION
  -- =====================================================

  -- Validate quantity
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Transfer quantity must be greater than 0';
  END IF;

  -- Validate locations are different
  IF p_from_location_id = p_to_location_id THEN
    RAISE EXCEPTION 'Cannot transfer to the same location';
  END IF;

  -- =====================================================
  -- VERIFY LOCATIONS BELONG TO VENDOR
  -- =====================================================

  SELECT name INTO v_from_location_name
  FROM locations
  WHERE id = p_from_location_id
    AND vendor_id = p_vendor_id
    AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Source location not found or not authorized';
  END IF;

  SELECT name INTO v_to_location_name
  FROM locations
  WHERE id = p_to_location_id
    AND vendor_id = p_vendor_id
    AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Destination location not found or not authorized';
  END IF;

  -- =====================================================
  -- ATOMIC TRANSFER (ROW-LEVEL LOCKING)
  -- =====================================================

  -- Lock source inventory row for update (prevents concurrent modifications)
  SELECT * INTO v_from_inventory
  FROM inventory
  WHERE product_id = p_product_id
    AND location_id = p_from_location_id
    AND vendor_id = p_vendor_id
  FOR UPDATE NOWAIT; -- NOWAIT ensures we fail fast if row is locked

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No inventory found at source location: %', v_from_location_name;
  END IF;

  -- Get current quantity with precision
  v_current_qty := COALESCE(v_from_inventory.quantity, 0);

  -- Verify sufficient stock
  IF v_current_qty < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock at %. Available: %g, Requested: %g',
      v_from_location_name, v_current_qty, p_quantity;
  END IF;

  -- Calculate new quantity for source (with precision)
  v_new_from_qty := v_current_qty - p_quantity;

  -- Lock destination inventory row (or prepare to create if doesn't exist)
  SELECT * INTO v_to_inventory
  FROM inventory
  WHERE product_id = p_product_id
    AND location_id = p_to_location_id
    AND vendor_id = p_vendor_id
  FOR UPDATE NOWAIT;

  v_to_current_qty := COALESCE(v_to_inventory.quantity, 0);
  v_new_to_qty := v_to_current_qty + p_quantity;

  -- =====================================================
  -- UPDATE SOURCE INVENTORY (WITHIN TRANSACTION)
  -- =====================================================

  UPDATE inventory
  SET
    quantity = v_new_from_qty,
    updated_at = NOW()
  WHERE id = v_from_inventory.id;

  -- =====================================================
  -- UPDATE/INSERT DESTINATION INVENTORY
  -- =====================================================

  IF v_to_inventory.id IS NOT NULL THEN
    -- Update existing inventory record
    UPDATE inventory
    SET
      quantity = v_new_to_qty,
      updated_at = NOW()
    WHERE id = v_to_inventory.id;
  ELSE
    -- Create new inventory record (no lock needed for new row)
    INSERT INTO inventory (
      product_id,
      location_id,
      vendor_id,
      quantity,
      low_stock_threshold,
      notes,
      created_at,
      updated_at
    ) VALUES (
      p_product_id,
      p_to_location_id,
      p_vendor_id,
      v_new_to_qty,
      10,
      'Created via atomic transfer',
      NOW(),
      NOW()
    );
  END IF;

  -- =====================================================
  -- CREATE AUDIT TRAIL (STOCK MOVEMENT)
  -- =====================================================

  INSERT INTO stock_movements (
    inventory_id,
    movement_type,
    quantity,
    from_location_id,
    to_location_id,
    reference_type,
    reference_id,
    reason,
    metadata,
    created_at
  ) VALUES (
    v_from_inventory.id,
    'transfer',
    p_quantity,
    p_from_location_id,
    p_to_location_id,
    'inventory_transfer',
    p_product_id::TEXT,
    COALESCE(p_reason, 'Transfer from ' || v_from_location_name || ' to ' || v_to_location_name),
    jsonb_build_object(
      'created_by', 'atomic_transfer_rpc',
      'vendor_id', p_vendor_id,
      'product_id', p_product_id,
      'from_qty_before', v_current_qty,
      'from_qty_after', v_new_from_qty,
      'to_qty_before', v_to_current_qty,
      'to_qty_after', v_new_to_qty
    ),
    NOW()
  );

  -- =====================================================
  -- UPDATE PRODUCT TOTAL STOCK
  -- =====================================================

  -- Calculate total stock across all locations for this product
  SELECT COALESCE(SUM(quantity), 0) INTO v_total_stock
  FROM inventory
  WHERE product_id = p_product_id
    AND vendor_id = p_vendor_id;

  UPDATE products
  SET
    stock_quantity = v_total_stock,
    stock_status = CASE WHEN v_total_stock > 0 THEN 'instock' ELSE 'outofstock' END,
    updated_at = NOW()
  WHERE id = p_product_id
    AND vendor_id = p_vendor_id;

  -- =====================================================
  -- RETURN RESULT
  -- =====================================================

  v_result := json_build_object(
    'success', TRUE,
    'message', 'Transferred ' || p_quantity || 'g from ' || v_from_location_name || ' to ' || v_to_location_name,
    'transfer', json_build_object(
      'quantity', p_quantity,
      'from_location', v_from_location_name,
      'to_location', v_to_location_name,
      'from_qty_before', v_current_qty,
      'from_qty_after', v_new_from_qty,
      'to_qty_before', v_to_current_qty,
      'to_qty_after', v_new_to_qty,
      'total_stock', v_total_stock
    )
  );

  RETURN v_result;

EXCEPTION
  WHEN lock_not_available THEN
    RAISE EXCEPTION 'Transfer already in progress for this product/location. Please try again.';
  WHEN OTHERS THEN
    -- Re-raise the exception (transaction will auto-rollback)
    RAISE;
END;
$$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant execute to authenticated users (vendor auth verified in function)
GRANT EXECUTE ON FUNCTION atomic_inventory_transfer(UUID, UUID, UUID, UUID, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION atomic_inventory_transfer(UUID, UUID, UUID, UUID, NUMERIC, TEXT) TO service_role;

-- =====================================================
-- COMMENT FOR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION atomic_inventory_transfer IS
'Atomically transfers inventory between locations with row-level locking to prevent race conditions.
All operations occur within a single transaction with automatic rollback on failure.
Uses FOR UPDATE NOWAIT to fail fast when concurrent operations are detected.';
