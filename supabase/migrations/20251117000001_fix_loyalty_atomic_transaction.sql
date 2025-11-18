-- Migration: Fix Atomic Loyalty Transaction to match actual schema
-- Purpose: Update RPC function to work with actual loyalty_transactions table
-- Date: 2025-11-17
--
-- Actual schema:
-- - customer_id UUID
-- - points INTEGER
-- - transaction_type TEXT
-- - reference_type TEXT
-- - reference_id UUID
-- - description TEXT
-- - expires_at TIMESTAMPTZ
-- - balance_before INTEGER
-- - balance_after INTEGER
-- - created_at TIMESTAMPTZ

-- Drop existing function
DROP FUNCTION IF EXISTS record_loyalty_transaction_atomic;

-- Create atomic function matching actual schema
CREATE OR REPLACE FUNCTION record_loyalty_transaction_atomic(
  p_customer_id UUID,
  p_order_id UUID,
  p_points_earned INTEGER,
  p_points_redeemed INTEGER,
  p_order_total NUMERIC
) RETURNS VOID AS $$
DECLARE
  v_current_points INTEGER;
  v_new_points INTEGER;
  v_points_delta INTEGER;
  v_tx_type TEXT;
BEGIN
  -- Validate inputs
  IF p_customer_id IS NULL THEN
    RAISE EXCEPTION 'customer_id cannot be null';
  END IF;

  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'order_id cannot be null';
  END IF;

  IF p_points_earned < 0 THEN
    RAISE EXCEPTION 'points_earned cannot be negative';
  END IF;

  IF p_points_redeemed < 0 THEN
    RAISE EXCEPTION 'points_redeemed cannot be negative';
  END IF;

  IF p_order_total < 0 THEN
    RAISE EXCEPTION 'order_total cannot be negative';
  END IF;

  IF p_points_earned = 0 AND p_points_redeemed = 0 THEN
    RAISE EXCEPTION 'points_earned and points_redeemed cannot both be zero';
  END IF;

  -- Get current customer points (with row lock to prevent race conditions)
  SELECT loyalty_points INTO v_current_points
  FROM customers
  WHERE id = p_customer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer % not found', p_customer_id;
  END IF;

  -- Calculate new points
  v_new_points := v_current_points + p_points_earned - p_points_redeemed;

  -- Ensure points don't go negative
  IF v_new_points < 0 THEN
    RAISE EXCEPTION 'Insufficient loyalty points: current=%, redeeming=%, would result in %',
      v_current_points, p_points_redeemed, v_new_points;
  END IF;

  -- Calculate points delta (positive for earning, negative for redemption)
  v_points_delta := p_points_earned - p_points_redeemed;

  -- Determine transaction type
  v_tx_type := CASE
    WHEN p_points_redeemed > 0 THEN 'redemption'
    ELSE 'earning'
  END;

  -- Insert loyalty transaction record (matching actual schema)
  INSERT INTO loyalty_transactions (
    customer_id,
    points,
    transaction_type,
    reference_type,
    reference_id,
    description,
    balance_before,
    balance_after,
    created_at
  ) VALUES (
    p_customer_id,
    v_points_delta,  -- Positive for earned, negative for redeemed
    v_tx_type,
    'order',
    p_order_id,
    CASE
      WHEN p_points_redeemed > 0 THEN
        format('Redeemed %s points for order $%s', p_points_redeemed, p_order_total)
      ELSE
        format('Earned %s points from order $%s', p_points_earned, p_order_total)
    END,
    v_current_points,
    v_new_points,
    NOW()
  );

  -- Update customer points (atomic with insert due to transaction)
  UPDATE customers
  SET loyalty_points = v_new_points,
      updated_at = NOW()
  WHERE id = p_customer_id;

  -- Log the transaction for audit trail
  RAISE NOTICE 'Loyalty transaction recorded: customer=%, order=%, points_delta=%, balance: % -> %',
    p_customer_id, p_order_id, v_points_delta, v_current_points, v_new_points;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comment
COMMENT ON FUNCTION record_loyalty_transaction_atomic IS 'Atomically records a loyalty transaction and updates customer points. Prevents race conditions and ensures data consistency. Works with actual schema: points (delta), reference_type, reference_id, balance_before, balance_after.';
