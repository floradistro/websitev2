-- Fix decimal precision issue in receive_purchase_order_items function
-- The problem is that when using SELECT * INTO v_po_item, the RECORD type
-- loses decimal precision. We need to explicitly select and cast the columns.

DROP FUNCTION IF EXISTS receive_purchase_order_items(UUID, JSONB, UUID);

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
  v_po_item_id UUID;
  v_product_id UUID;
  v_ordered_qty DECIMAL(10,2);
  v_already_received DECIMAL(10,2);
  v_unit_price DECIMAL(10,2);
  v_inventory_id UUID;
  v_current_qty DECIMAL(10,2);
  v_current_avg_cost DECIMAL(10,2);
  v_new_qty DECIMAL(10,2);
  v_new_avg_cost DECIMAL(10,2);
  v_quantity_received DECIMAL(10,2);
  v_results JSONB := '[]'::JSONB;
  v_success_count INT := 0;
  v_fail_count INT := 0;
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

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    BEGIN
      -- Extract values from JSON
      v_quantity_received := (v_item->>'quantity_received')::DECIMAL(10,2);
      v_po_item_id := (v_item->>'po_item_id')::UUID;

      -- Get PO item details with explicit decimal casting
      SELECT
        id,
        product_id,
        quantity::DECIMAL(10,2),
        COALESCE(quantity_received, 0)::DECIMAL(10,2),
        unit_price::DECIMAL(10,2)
      INTO
        v_po_item_id,
        v_product_id,
        v_ordered_qty,
        v_already_received,
        v_unit_price
      FROM purchase_order_items
      WHERE id = v_po_item_id;

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
      IF (v_already_received + v_quantity_received) > v_ordered_qty THEN
        v_results := v_results || jsonb_build_object(
          'success', false,
          'item_id', v_item->>'po_item_id',
          'error', format('Cannot receive %s - would exceed ordered quantity of %s (already received: %s)',
                         v_quantity_received,
                         v_ordered_qty,
                         v_already_received)
        );
        v_fail_count := v_fail_count + 1;
        CONTINUE;
      END IF;

      -- Find or create inventory record
      SELECT
        id,
        quantity::DECIMAL(10,2),
        average_cost::DECIMAL(10,2)
      INTO
        v_inventory_id,
        v_current_qty,
        v_current_avg_cost
      FROM inventory
      WHERE product_id = v_product_id
        AND location_id = v_po.location_id
        AND vendor_id = p_vendor_id;

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
          v_product_id,
          v_po.location_id,
          p_vendor_id,
          v_quantity_received,
          v_unit_price,
          v_unit_price
        )
        RETURNING id INTO v_inventory_id;
      ELSE
        -- Update existing inventory with weighted average cost
        v_new_qty := v_current_qty + v_quantity_received;
        v_new_avg_cost := (v_current_qty * v_current_avg_cost + v_quantity_received * v_unit_price) / v_new_qty;

        UPDATE inventory
        SET
          quantity = v_new_qty,
          unit_cost = v_unit_price,
          average_cost = v_new_avg_cost,
          updated_at = NOW()
        WHERE id = v_inventory_id;
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
        v_po_item_id,
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
        notes,
        vendor_id
      ) VALUES (
        v_inventory_id,
        'purchase',
        v_quantity_received,
        NULL,
        v_po.location_id,
        'purchase_order',
        p_po_id,
        format('Received from PO %s', COALESCE(v_po.po_number, p_po_id::TEXT)),
        p_vendor_id
      );

      -- Success
      v_results := v_results || jsonb_build_object(
        'success', true,
        'item_id', v_item->>'po_item_id'
      );
      v_success_count := v_success_count + 1;

    EXCEPTION WHEN OTHERS THEN
      v_results := v_results || jsonb_build_object(
        'success', false,
        'item_id', v_item->>'po_item_id',
        'error', SQLERRM
      );
      v_fail_count := v_fail_count + 1;
    END;
  END LOOP;

  -- Return results
  RETURN jsonb_build_object(
    'success', CASE WHEN v_success_count > 0 THEN true ELSE false END,
    'successful_items', v_success_count,
    'failed_items', v_fail_count,
    'results', v_results
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION receive_purchase_order_items(UUID, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION receive_purchase_order_items(UUID, JSONB, UUID) TO service_role;

COMMENT ON FUNCTION receive_purchase_order_items IS 'Atomic function to receive purchase order items with proper decimal precision handling. Processes inventory updates, receiving records, and stock movements in a single transaction.';
