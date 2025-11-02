-- Migration: Add increment_inventory function for voiding sales
-- This function atomically increments inventory when sales are voided

CREATE OR REPLACE FUNCTION public.increment_inventory(
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

  -- Atomic increment
  UPDATE inventory
  SET quantity = quantity + p_quantity
  WHERE id = p_inventory_id
  RETURNING quantity INTO v_new_quantity;

  RETURN json_build_object(
    'success', true,
    'old_quantity', v_old_quantity,
    'new_quantity', v_new_quantity,
    'incremented', p_quantity
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_inventory TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_inventory TO anon;
GRANT EXECUTE ON FUNCTION public.increment_inventory TO service_role;
