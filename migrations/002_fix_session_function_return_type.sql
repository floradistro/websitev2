-- Fix the return type to match actual pos_sessions table structure
-- Instead of hardcoding columns, use SETOF to return the whole row

DROP FUNCTION IF EXISTS get_or_create_session(UUID, UUID, UUID, UUID, DECIMAL);

CREATE OR REPLACE FUNCTION get_or_create_session(
  p_register_id UUID,
  p_location_id UUID,
  p_vendor_id UUID,
  p_user_id UUID,
  p_opening_cash DECIMAL DEFAULT 200.00
)
RETURNS SETOF pos_sessions AS $$
DECLARE
  v_existing_session pos_sessions%ROWTYPE;
  v_new_session pos_sessions%ROWTYPE;
  v_session_number TEXT;
BEGIN
  -- CRITICAL: Lock the register row to prevent race conditions
  PERFORM * FROM pos_registers
  WHERE pos_registers.id = p_register_id
  FOR UPDATE;

  -- Check for existing open session
  SELECT * INTO v_existing_session
  FROM pos_sessions
  WHERE pos_sessions.register_id = p_register_id
    AND pos_sessions.status = 'open'
  LIMIT 1;

  -- If session exists, return it
  IF v_existing_session.id IS NOT NULL THEN
    RETURN NEXT v_existing_session;
    RETURN;
  END IF;

  -- No existing session - create new one
  v_session_number := 'S-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS');

  INSERT INTO pos_sessions (
    register_id,
    location_id,
    vendor_id,
    user_id,
    session_number,
    status,
    opening_cash,
    total_sales,
    total_transactions,
    total_cash,
    total_card,
    walk_in_sales,
    pickup_orders_fulfilled,
    opened_at,
    last_transaction_at
  ) VALUES (
    p_register_id,
    p_location_id,
    p_vendor_id,
    p_user_id,
    v_session_number,
    'open',
    p_opening_cash,
    0.00,
    0,
    0.00,
    0.00,
    0.00,
    0,
    NOW(),
    NOW()
  )
  RETURNING * INTO v_new_session;

  RETURN NEXT v_new_session;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_or_create_session TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_session TO service_role;
