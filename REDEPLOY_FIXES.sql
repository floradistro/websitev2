-- =====================================================
-- REDEPLOY P0 FIXES WITH CORRECTIONS
-- =====================================================
-- Run this entire file in Supabase SQL Editor
-- https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/sql/new
-- =====================================================

-- =====================================================
-- FIX 1: atomic_inventory_transfer (stock_movements schema fix)
-- =====================================================

DROP FUNCTION IF EXISTS atomic_inventory_transfer(UUID, UUID, UUID, UUID, NUMERIC, TEXT);

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
  v_current_qty NUMERIC;
  v_new_from_qty NUMERIC;
  v_to_current_qty NUMERIC;
  v_new_to_qty NUMERIC;
  v_total_stock NUMERIC;
  v_from_location_name TEXT;
  v_to_location_name TEXT;
  v_result JSON;
BEGIN
  -- Validate locations
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

  -- Lock source inventory row for update
  SELECT * INTO v_from_inventory
  FROM inventory
  WHERE product_id = p_product_id
    AND location_id = p_from_location_id
    AND vendor_id = p_vendor_id
  FOR UPDATE NOWAIT;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No inventory found at source location: %', v_from_location_name;
  END IF;

  -- Get current quantity
  v_current_qty := COALESCE(v_from_inventory.quantity, 0);

  -- Verify sufficient stock
  IF v_current_qty < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock at %. Available: %g, Requested: %g',
      v_from_location_name, v_current_qty, p_quantity;
  END IF;

  -- Calculate new quantities
  v_new_from_qty := v_current_qty - p_quantity;

  -- Lock destination inventory row
  SELECT * INTO v_to_inventory
  FROM inventory
  WHERE product_id = p_product_id
    AND location_id = p_to_location_id
    AND vendor_id = p_vendor_id
  FOR UPDATE NOWAIT;

  v_to_current_qty := COALESCE(v_to_inventory.quantity, 0);
  v_new_to_qty := v_to_current_qty + p_quantity;

  -- Update source inventory
  UPDATE inventory
  SET
    quantity = v_new_from_qty,
    updated_at = NOW()
  WHERE id = v_from_inventory.id;

  -- Update or insert destination inventory
  IF v_to_inventory.id IS NOT NULL THEN
    UPDATE inventory
    SET
      quantity = v_new_to_qty,
      updated_at = NOW()
    WHERE id = v_to_inventory.id;
  ELSE
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

  -- Create audit trail (FIXED: use inventory_id instead of product_id)
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

  -- Update product total stock
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

  -- Build success result
  v_result := jsonb_build_object(
    'success', TRUE,
    'product_id', p_product_id,
    'from_location', v_from_location_name,
    'to_location', v_to_location_name,
    'quantity_transferred', p_quantity,
    'from_qty_before', v_current_qty,
    'from_qty_after', v_new_from_qty,
    'to_qty_before', v_to_current_qty,
    'to_qty_after', v_new_to_qty,
    'total_stock', v_total_stock
  );

  RETURN v_result;

EXCEPTION
  WHEN lock_not_available THEN
    RAISE EXCEPTION 'Inventory is currently locked by another operation. Please try again.';
  WHEN OTHERS THEN
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION atomic_inventory_transfer(UUID, UUID, UUID, UUID, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION atomic_inventory_transfer(UUID, UUID, UUID, UUID, NUMERIC, TEXT) TO service_role;

COMMENT ON FUNCTION atomic_inventory_transfer IS
'Atomically transfers inventory between locations with row-level locking.
FIXED: Uses inventory_id in stock_movements (not product_id).
Prevents race conditions via FOR UPDATE NOWAIT.';

-- =====================================================
-- FIX 2: get_or_create_session (pos_registers table fix)
-- =====================================================

DROP FUNCTION IF EXISTS get_or_create_session(UUID, UUID, UUID, UUID, NUMERIC);

CREATE OR REPLACE FUNCTION get_or_create_session(
  p_register_id UUID,
  p_location_id UUID,
  p_vendor_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_opening_cash NUMERIC DEFAULT 200.00
)
RETURNS TABLE (
  id UUID,
  session_number TEXT,
  register_id UUID,
  location_id UUID,
  vendor_id UUID,
  user_id UUID,
  status TEXT,
  opening_cash NUMERIC,
  expected_cash NUMERIC,
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  is_existing BOOLEAN,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_session RECORD;
  v_new_session RECORD;
  v_session_number TEXT;
BEGIN
  -- Lock the register row (FIXED: use pos_registers instead of registers)
  PERFORM 1 FROM pos_registers
  WHERE pos_registers.id = p_register_id
  FOR UPDATE NOWAIT;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Register not found or locked: %', p_register_id;
  END IF;

  -- Check for existing open session
  SELECT * INTO v_existing_session
  FROM pos_sessions
  WHERE register_id = p_register_id
    AND status = 'open'
  LIMIT 1;

  -- If session exists, return it
  IF FOUND THEN
    RETURN QUERY
    SELECT
      v_existing_session.id,
      v_existing_session.session_number,
      v_existing_session.register_id,
      v_existing_session.location_id,
      v_existing_session.vendor_id,
      v_existing_session.user_id,
      v_existing_session.status,
      v_existing_session.opening_cash,
      v_existing_session.expected_cash,
      v_existing_session.opened_at,
      v_existing_session.closed_at,
      TRUE as is_existing,
      v_existing_session.metadata,
      v_existing_session.created_at,
      v_existing_session.updated_at;
    RETURN;
  END IF;

  -- Generate session number
  v_session_number := 'S-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                      LPAD(nextval('pos_sessions_id_seq')::TEXT, 6, '0');

  -- Create new session
  INSERT INTO pos_sessions (
    session_number,
    register_id,
    location_id,
    vendor_id,
    user_id,
    status,
    opening_cash,
    expected_cash,
    opened_at,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    v_session_number,
    p_register_id,
    p_location_id,
    p_vendor_id,
    p_user_id,
    'open',
    p_opening_cash,
    p_opening_cash,
    NOW(),
    jsonb_build_object(
      'created_by', 'atomic_session_rpc',
      'created_via', 'get_or_create_session'
    ),
    NOW(),
    NOW()
  )
  RETURNING * INTO v_new_session;

  -- Return the new session
  RETURN QUERY
  SELECT
    v_new_session.id,
    v_new_session.session_number,
    v_new_session.register_id,
    v_new_session.location_id,
    v_new_session.vendor_id,
    v_new_session.user_id,
    v_new_session.status,
    v_new_session.opening_cash,
    v_new_session.expected_cash,
    v_new_session.opened_at,
    v_new_session.closed_at,
    FALSE as is_existing,
    v_new_session.metadata,
    v_new_session.created_at,
    v_new_session.updated_at;

EXCEPTION
  WHEN lock_not_available THEN
    RAISE EXCEPTION 'Session operation already in progress for this register. Please try again.';
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Duplicate session detected. Another session was created concurrently.';
  WHEN OTHERS THEN
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION get_or_create_session(UUID, UUID, UUID, UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_session(UUID, UUID, UUID, UUID, NUMERIC) TO service_role;

COMMENT ON FUNCTION get_or_create_session IS
'Atomically gets an existing open session or creates a new one for a register.
FIXED: Uses pos_registers table (not registers).
Uses row-level locking (FOR UPDATE NOWAIT) to prevent race conditions.';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check both functions exist
SELECT proname, prosrc LIKE '%inventory_id%' as uses_inventory_id_fix
FROM pg_proc
WHERE proname = 'atomic_inventory_transfer';

SELECT proname, prosrc LIKE '%pos_registers%' as uses_pos_registers_fix
FROM pg_proc
WHERE proname = 'get_or_create_session';

-- =====================================================
-- ✅ DEPLOYMENT COMPLETE
-- =====================================================
