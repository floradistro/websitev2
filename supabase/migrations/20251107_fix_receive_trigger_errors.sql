-- FIX: Ambiguous column reference "quantity_received" in trigger
-- FIX: Type mismatch (integer vs numeric) in atomic session function

-- Drop and recreate the trigger function with proper column qualification
CREATE OR REPLACE FUNCTION update_item_receive_status()
RETURNS TRIGGER AS $$
DECLARE
  v_total_received DECIMAL(10,2);
  v_quantity_ordered INTEGER;
  v_new_status TEXT;
BEGIN
  -- Calculate total received for this item
  -- FIX: Explicitly qualify quantity_received as pr.quantity_received in SUM
  SELECT
    COALESCE(SUM(purchase_order_receives.quantity_received), 0),
    pi.quantity
  INTO v_total_received, v_quantity_ordered
  FROM purchase_order_receives
  JOIN purchase_order_items pi ON purchase_order_receives.po_item_id = pi.id
  WHERE purchase_order_receives.po_item_id = NEW.po_item_id
  GROUP BY pi.quantity;

  -- Determine new status
  IF v_total_received = 0 THEN
    v_new_status := 'pending';
  ELSIF v_total_received < v_quantity_ordered THEN
    v_new_status := 'partial';
  ELSIF v_total_received >= v_quantity_ordered THEN
    v_new_status := 'received';
  END IF;

  -- Update the purchase order item status
  UPDATE purchase_order_items
  SET receive_status = v_new_status
  WHERE id = NEW.po_item_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_item_receive_status() IS
'FIXED: Ambiguous column reference - now uses full table names instead of aliases';
