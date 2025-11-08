-- Fix get_or_create_session function type mismatch
-- walk_in_sales should be integer, not numeric

DROP FUNCTION IF EXISTS get_or_create_session(uuid, uuid, uuid, uuid, numeric);

CREATE OR REPLACE FUNCTION get_or_create_session(
  p_register_id uuid,
  p_location_id uuid,
  p_vendor_id uuid,
  p_user_id uuid,
  p_opening_cash numeric DEFAULT 200.00
)
RETURNS TABLE(
  id uuid,
  session_number text,
  register_id uuid,
  location_id uuid,
  vendor_id uuid,
  user_id uuid,
  status text,
  opening_cash numeric,
  total_sales numeric,
  total_transactions integer,
  total_cash numeric,
  total_card numeric,
  walk_in_sales integer,
  pickup_orders_fulfilled integer,
  opened_at timestamp with time zone,
  last_transaction_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_existing_session RECORD;
  v_new_session RECORD;
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

  -- If session exists, return it immediately
  IF v_existing_session.id IS NOT NULL THEN
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
      v_existing_session.total_sales,
      v_existing_session.total_transactions,
      v_existing_session.total_cash,
      v_existing_session.total_card,
      v_existing_session.walk_in_sales,
      v_existing_session.pickup_orders_fulfilled,
      v_existing_session.opened_at,
      v_existing_session.last_transaction_at;
    RETURN;
  END IF;

  -- No existing session - create new one atomically
  v_session_number := 'S-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS');

  INSERT INTO pos_sessions (
    register_id, location_id, vendor_id, user_id, session_number,
    status, opening_cash, total_sales, total_transactions,
    total_cash, total_card, walk_in_sales, pickup_orders_fulfilled,
    opened_at, last_transaction_at
  ) VALUES (
    p_register_id, p_location_id, p_vendor_id, p_user_id, v_session_number,
    'open', p_opening_cash, 0.00, 0, 0.00, 0.00, 0, 0, NOW(), NOW()
  )
  RETURNING * INTO v_new_session;

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
    v_new_session.total_sales,
    v_new_session.total_transactions,
    v_new_session.total_cash,
    v_new_session.total_card,
    v_new_session.walk_in_sales,
    v_new_session.pickup_orders_fulfilled,
    v_new_session.opened_at,
    v_new_session.last_transaction_at;
END;
$function$;
