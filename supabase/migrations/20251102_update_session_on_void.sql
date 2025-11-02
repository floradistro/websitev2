-- Migration: Add update_session_on_void function
-- This function atomically updates session totals when a sale is voided

CREATE OR REPLACE FUNCTION public.update_session_on_void(
  p_session_id UUID,
  p_amount_to_subtract NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_total NUMERIC;
  v_new_total NUMERIC;
  v_old_voided_count INTEGER;
  v_new_voided_count INTEGER;
BEGIN
  -- Lock the row to prevent concurrent modifications
  SELECT total_sales, voided_count INTO v_old_total, v_old_voided_count
  FROM pos_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  -- Validate session exists
  IF v_old_total IS NULL THEN
    RAISE EXCEPTION 'Session not found: %', p_session_id;
  END IF;

  -- Atomic update
  UPDATE pos_sessions
  SET
    total_sales = total_sales - p_amount_to_subtract,
    voided_count = voided_count + 1
  WHERE id = p_session_id
  RETURNING total_sales, voided_count INTO v_new_total, v_new_voided_count;

  RETURN json_build_object(
    'success', true,
    'old_total', v_old_total,
    'new_total', v_new_total,
    'old_voided_count', v_old_voided_count,
    'new_voided_count', v_new_voided_count
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_session_on_void TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_session_on_void TO anon;
GRANT EXECUTE ON FUNCTION public.update_session_on_void TO service_role;
