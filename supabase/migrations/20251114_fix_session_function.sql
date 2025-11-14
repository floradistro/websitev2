-- ===================================================================
-- FIX FOR POS SESSION CREATION (Applied 2025-11-14)
-- ===================================================================
-- Problem: Ambiguous column reference "register_id" 
-- Solution: Use SETOF instead of RETURNS TABLE to avoid conflicts
-- ===================================================================

-- Drop the broken function
DROP FUNCTION IF EXISTS get_or_create_session(UUID, UUID, UUID, UUID, NUMERIC);

-- Recreate with proper column qualification
CREATE OR REPLACE FUNCTION get_or_create_session(
  p_register_id UUID,
  p_location_id UUID,
  p_vendor_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_opening_cash NUMERIC DEFAULT 200.00
)
RETURNS SETOF pos_sessions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_session pos_sessions%ROWTYPE;
  v_new_session pos_sessions%ROWTYPE;
  v_session_number TEXT;
BEGIN
  -- Lock the register row to prevent race conditions
  PERFORM 1 FROM pos_registers pr
  WHERE pr.id = p_register_id
  FOR UPDATE NOWAIT;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Register not found or locked: %', p_register_id;
  END IF;

  -- Check for existing open session
  SELECT * INTO v_existing_session
  FROM pos_sessions ps
  WHERE ps.register_id = p_register_id
    AND ps.status = 'open'
  LIMIT 1;

  -- If session exists, return it
  IF FOUND THEN
    RETURN NEXT v_existing_session;
    RETURN;
  END IF;

  -- Generate unique session number
  v_session_number := 'S-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                      LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

  -- Create new session with all fields initialized
  INSERT INTO pos_sessions (
    session_number,
    register_id,
    location_id,
    vendor_id,
    user_id,
    status,
    opening_cash,
    expected_cash,
    total_sales,
    total_transactions,
    total_cash,
    total_card,
    total_refunds,
    walk_in_sales,
    pickup_orders_fulfilled,
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
    0.00,
    0,
    0.00,
    0.00,
    0.00,
    0.00,
    0,
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
  RETURN NEXT v_new_session;

EXCEPTION
  WHEN lock_not_available THEN
    RAISE EXCEPTION 'Session operation already in progress for this register. Please try again.';
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Duplicate session detected. Another session was created concurrently.';
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_or_create_session(UUID, UUID, UUID, UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_session(UUID, UUID, UUID, UUID, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION get_or_create_session(UUID, UUID, UUID, UUID, NUMERIC) TO anon;

COMMENT ON FUNCTION get_or_create_session IS
'Atomically gets an existing open session or creates a new one for a register.
FIXED: Properly qualifies register_id column to avoid ambiguity.
Uses row-level locking (FOR UPDATE NOWAIT) to prevent race conditions.
Applied: 2025-11-14';
