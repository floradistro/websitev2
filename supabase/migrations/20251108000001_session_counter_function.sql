-- Create function to atomically increment session counters
-- This handles updating total_sales and transaction counts

CREATE OR REPLACE FUNCTION increment_session_counter(
  p_session_id uuid,
  p_counter_name text,
  p_amount numeric
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the session based on counter type
  IF p_counter_name = 'walk_in_sales' THEN
    UPDATE pos_sessions
    SET
      walk_in_sales = walk_in_sales + 1,
      total_sales = total_sales + p_amount
    WHERE id = p_session_id;

  ELSIF p_counter_name = 'pickup_orders_fulfilled' THEN
    UPDATE pos_sessions
    SET
      pickup_orders_fulfilled = pickup_orders_fulfilled + 1,
      total_sales = total_sales + p_amount
    WHERE id = p_session_id;

  ELSIF p_counter_name = 'delivery_orders_dispatched' THEN
    UPDATE pos_sessions
    SET
      delivery_orders_dispatched = delivery_orders_dispatched + 1,
      total_sales = total_sales + p_amount
    WHERE id = p_session_id;

  ELSE
    RAISE EXCEPTION 'Invalid counter name: %', p_counter_name;
  END IF;
END;
$$;

COMMENT ON FUNCTION increment_session_counter IS
  'Atomically increment session transaction counters and total sales. Used by POS sales endpoint.';
