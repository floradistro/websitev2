-- Drop and recreate the function to ensure we're using the latest version
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
BEGIN
  SELECT * INTO v_po
  FROM purchase_orders
  WHERE id = p_po_id AND vendor_id = p_vendor_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Purchase order not found or access denied'
    );
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    BEGIN
      v_quantity_received := (v_item->>'quantity_received')::DECIMAL;

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

      SELECT id, quantity, average_cost INTO v_inventory_id, v_current_qty, v_current_avg_cost
      FROM inventory
      WHERE product_id = v_po_item.product_id
        AND location_id = v_po.location_id
        AND vendor_id = p_vendor_id;

      IF NOT FOUND THEN
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
        v_new_qty := v_current_qty + v_quantity_received;
        v_new_avg_cost := (v_current_qty * v_current_avg_cost + v_quantity_received * v_unit_cost) / v_new_qty;

        UPDATE inventory
        SET
          quantity = v_new_qty,
          unit_cost = v_unit_cost,
          average_cost = v_new_avg_cost,
          updated_at = NOW()
        WHERE id = v_inventory_id;
      END IF;

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

  RETURN jsonb_build_object(
    'success', CASE WHEN v_success_count > 0 THEN true ELSE false END,
    'successful_items', v_success_count,
    'failed_items', v_fail_count,
    'results', v_results
  );
END;
$$;

GRANT EXECUTE ON FUNCTION receive_purchase_order_items(UUID, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION receive_purchase_order_items(UUID, JSONB, UUID) TO service_role;
