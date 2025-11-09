-- Migration: Add decrement_inventory function for sales
-- This function atomically decrements inventory when sales are made
-- Critical fix from Apple Assessment - this function was missing

CREATE OR REPLACE FUNCTION public.decrement_inventory(
  p_inventory_id UUID,
  p_quantity NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_quantity NUMERIC;
  v_new_quantity NUMERIC;
BEGIN
  -- Lock the row to prevent concurrent modifications
  SELECT quantity INTO v_old_quantity
  FROM inventory
  WHERE id = p_inventory_id
  FOR UPDATE;

  -- Validate inventory exists
  IF v_old_quantity IS NULL THEN
    RAISE EXCEPTION 'Inventory record not found: %', p_inventory_id;
  END IF;

  -- Validate sufficient quantity available
  IF v_old_quantity < p_quantity THEN
    RAISE EXCEPTION 'Insufficient inventory: available %, requested %', v_old_quantity, p_quantity;
  END IF;

  -- Atomic decrement
  UPDATE inventory
  SET quantity = quantity - p_quantity
  WHERE id = p_inventory_id
  RETURNING quantity INTO v_new_quantity;

  RETURN json_build_object(
    'success', true,
    'old_quantity', v_old_quantity,
    'new_quantity', v_new_quantity,
    'decremented', p_quantity
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.decrement_inventory TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_inventory TO anon;
GRANT EXECUTE ON FUNCTION public.decrement_inventory TO service_role;
