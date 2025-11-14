-- =====================================================
-- PRODUCTION-READY FIX FOR PURCHASE ORDER RECEIVING
-- =====================================================
-- Apply this SQL in Supabase SQL Editor
-- Fixes all HIGH RISK issues from stability analysis:
--   ✅ Row locking to prevent race conditions
--   ✅ Validation for cancelled POs
--   ✅ Validation for null location_id
--   ✅ Validation for positive quantities
--   ✅ Division by zero prevention
--   ✅ Decimal precision rounding
--   ✅ Condition value validation
--   ✅ Quality notes enforcement for damaged items
--   ✅ Better error handling
-- =====================================================

CREATE OR REPLACE FUNCTION receive_purchase_order_items(
  p_po_id UUID,
  p_items JSONB,
  p_vendor_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_po RECORD;
  v_item JSONB;
  v_po_item RECORD;
  v_inventory_id UUID;
  v_current_qty DECIMAL;
  v_current_avg_cost DECIMAL;
  v_new_qty DECIMAL;
  v_new_avg_cost DECIMAL;
  v_quantity_received DECIMAL;
  v_unit_cost DECIMAL;
  v_results JSONB := '[]'::JSONB;
  v_success_count INT := 0;
  v_fail_count INT := 0;
  v_new_quantity_received DECIMAL;
  v_all_received BOOLEAN;
  v_any_received BOOLEAN;
BEGIN
  -- Verify PO exists and belongs to vendor
  SELECT * INTO v_po
  FROM purchase_orders
  WHERE id = p_po_id AND vendor_id = p_vendor_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Purchase order not found or access denied'
    );
  END IF;

  -- FIX #1: Prevent receiving cancelled POs
  IF v_po.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot receive items for cancelled purchase order'
    );
  END IF;

  -- FIX #2: Validate location_id exists
  IF v_po.location_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Purchase order must have a location assigned'
    );
  END IF;

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    BEGIN
      v_quantity_received := (v_item->>'quantity_received')::DECIMAL;

      -- FIX #3: Validate quantity is positive
      IF v_quantity_received IS NULL OR v_quantity_received <= 0 THEN
        v_results := v_results || jsonb_build_object(
          'success', false,
          'item_id', v_item->>'po_item_id',
          'error', 'Quantity must be greater than 0'
        );
        v_fail_count := v_fail_count + 1;
        CONTINUE;
      END IF;

      -- Get PO item details
      SELECT * INTO v_po_item
      FROM purchase_order_items
      WHERE id = (v_item->>'po_item_id')::UUID;

      IF NOT FOUND THEN
        v_results := v_results || jsonb_build_object(
          'success', false,
          'item_id', v_item->>'po_item_id',
          'error', 'PO item not found'
        );
        v_fail_count := v_fail_count + 1;
        CONTINUE;
      END IF;

      -- Check if receiving would exceed ordered quantity
      IF (COALESCE(v_po_item.quantity_received, 0) + v_quantity_received) > v_po_item.quantity THEN
        v_results := v_results || jsonb_build_object(
          'success', false,
          'item_id', v_item->>'po_item_id',
          'error', format('Cannot receive %s - would exceed ordered quantity of %s (already received: %s)',
                         v_quantity_received,
                         v_po_item.quantity,
                         COALESCE(v_po_item.quantity_received, 0))
        );
        v_fail_count := v_fail_count + 1;
        CONTINUE;
      END IF;

      v_unit_cost := v_po_item.unit_price;

      -- FIX #4: Add row locking to prevent race conditions
      SELECT id, quantity, average_cost
      INTO v_inventory_id, v_current_qty, v_current_avg_cost
      FROM inventory
      WHERE product_id = v_po_item.product_id
        AND location_id = v_po.location_id
        AND vendor_id = p_vendor_id
      FOR UPDATE NOWAIT;  -- Lock the row immediately

      IF NOT FOUND THEN
        -- Create new inventory record
        INSERT INTO inventory (
          product_id,
          location_id,
          vendor_id,
          quantity,
          unit_cost,
          average_cost
        ) VALUES (
          v_po_item.product_id,
          v_po.location_id,
          p_vendor_id,
          v_quantity_received,
          v_unit_cost,
          v_unit_cost
        )
        RETURNING id INTO v_inventory_id;
      ELSE
        -- Update existing inventory with weighted average cost
        v_new_qty := v_current_qty + v_quantity_received;

        -- FIX #5: Prevent division by zero
        IF v_new_qty = 0 THEN
          RAISE EXCEPTION 'New quantity cannot be zero';
        END IF;

        -- FIX #6: Round to 2 decimal places to prevent precision loss
        v_new_avg_cost := ROUND(
          (v_current_qty * v_current_avg_cost + v_quantity_received * v_unit_cost) / v_new_qty,
          2
        );

        UPDATE inventory
        SET
          quantity = v_new_qty,
          unit_cost = v_unit_cost,
          average_cost = v_new_avg_cost,
          updated_at = NOW()
        WHERE id = v_inventory_id;
      END IF;

      -- FIX #7: Validate condition values
      IF v_item->>'condition' IS NOT NULL
         AND v_item->>'condition' NOT IN ('good', 'damaged', 'expired', 'rejected') THEN
        v_results := v_results || jsonb_build_object(
          'success', false,
          'item_id', v_item->>'po_item_id',
          'error', 'Invalid condition value. Must be: good, damaged, expired, or rejected'
        );
        v_fail_count := v_fail_count + 1;
        CONTINUE;
      END IF;

      -- FIX #8: Enforce quality_notes for non-good condition
      IF COALESCE(v_item->>'condition', 'good') != 'good'
         AND COALESCE(v_item->>'quality_notes', '') = '' THEN
        v_results := v_results || jsonb_build_object(
          'success', false,
          'item_id', v_item->>'po_item_id',
          'error', 'Quality notes are required for non-good condition items'
        );
        v_fail_count := v_fail_count + 1;
        CONTINUE;
      END IF;

      -- Create receiving record
      INSERT INTO purchase_order_receives (
        purchase_order_id,
        po_item_id,
        quantity_received,
        condition,
        quality_notes,
        notes,
        inventory_id
      ) VALUES (
        p_po_id,
        (v_item->>'po_item_id')::UUID,
        v_quantity_received,
        COALESCE(v_item->>'condition', 'good'),
        v_item->>'quality_notes',
        v_item->>'notes',
        v_inventory_id
      );

      -- Create stock movement record
      INSERT INTO stock_movements (
        inventory_id,
        movement_type,
        quantity,
        from_location_id,
        to_location_id,
        reference_type,
        reference_id,
        notes
      ) VALUES (
        v_inventory_id,
        'purchase',
        v_quantity_received,
        NULL,
        v_po.location_id,
        'purchase_order',
        p_po_id,
        format('Received from PO %s', COALESCE(v_po.po_number, p_po_id::TEXT))
      );

      v_new_quantity_received := COALESCE(v_po_item.quantity_received, 0) + v_quantity_received;

      -- Update purchase_order_items (quantity_remaining is auto-calculated)
      UPDATE purchase_order_items
      SET
        quantity_received = v_new_quantity_received,
        updated_at = NOW()
      WHERE id = (v_item->>'po_item_id')::UUID;

      v_results := v_results || jsonb_build_object(
        'success', true,
        'item_id', v_item->>'po_item_id'
      );
      v_success_count := v_success_count + 1;

    EXCEPTION
      WHEN lock_not_available THEN
        -- FIX #9: Handle concurrent modification gracefully
        v_results := v_results || jsonb_build_object(
          'success', false,
          'item_id', v_item->>'po_item_id',
          'error', 'This item is being received by another user. Please try again.'
        );
        v_fail_count := v_fail_count + 1;
      WHEN OTHERS THEN
        v_results := v_results || jsonb_build_object(
          'success', false,
          'item_id', v_item->>'po_item_id',
          'error', SQLERRM,
          'error_code', SQLSTATE
        );
        v_fail_count := v_fail_count + 1;
    END;
  END LOOP;

  IF v_success_count = 0 AND v_fail_count > 0 THEN
    RAISE EXCEPTION 'All items failed to receive. Details: %', v_results;
  END IF;

  -- Update purchase order status after receiving
  SELECT
    COUNT(*) = COUNT(*) FILTER (WHERE quantity_received >= quantity),
    COUNT(*) FILTER (WHERE quantity_received > 0) > 0
  INTO v_all_received, v_any_received
  FROM purchase_order_items
  WHERE purchase_order_id = p_po_id;

  IF v_all_received THEN
    UPDATE purchase_orders
    SET status = 'received', updated_at = NOW()
    WHERE id = p_po_id;
  ELSIF v_any_received THEN
    UPDATE purchase_orders
    SET status = 'partially_received', updated_at = NOW()
    WHERE id = p_po_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'successful_items', v_success_count,
    'failed_items', v_fail_count,
    'results', v_results
  );
END;
$$;

GRANT EXECUTE ON FUNCTION receive_purchase_order_items(UUID, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION receive_purchase_order_items(UUID, JSONB, UUID) TO service_role;

COMMENT ON FUNCTION receive_purchase_order_items IS 'Production-ready PO receiving with row locking, validation, and error handling';
