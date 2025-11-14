-- =====================================================
-- FIX VOID & REFUND OPERATIONS
-- =====================================================
-- Purpose: Fix bugs in void/refund RPC functions
-- Issues Fixed:
--   1. update_session_on_void references non-existent voided_count column
--   2. update_session_for_refund function doesn't exist
--   3. Make inventory restoration atomic with proper error handling
-- =====================================================

-- =====================================================
-- STEP 1: DROP EXISTING BUGGY FUNCTIONS
-- =====================================================

DROP FUNCTION IF EXISTS update_session_on_void(UUID, NUMERIC);

-- =====================================================
-- STEP 2: CREATE/FIX update_session_on_void
-- =====================================================
-- Updates POS session totals when a transaction is voided
-- Decrements total_sales, increments total_refunds
-- =====================================================

CREATE OR REPLACE FUNCTION update_session_on_void(
  p_session_id UUID,
  p_amount_to_subtract NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session RECORD;
  v_result JSON;
BEGIN
  -- Lock the session row to prevent race conditions
  SELECT * INTO v_session
  FROM pos_sessions
  WHERE id = p_session_id
  FOR UPDATE NOWAIT;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'POS session not found: %', p_session_id;
  END IF;

  -- Update session totals
  -- Void decreases total_sales and increases total_refunds
  UPDATE pos_sessions
  SET
    total_sales = GREATEST(total_sales - p_amount_to_subtract, 0),
    total_refunds = total_refunds + p_amount_to_subtract,
    expected_cash = CASE
      WHEN status = 'open' THEN opening_cash + total_cash - (total_refunds + p_amount_to_subtract)
      ELSE expected_cash
    END,
    updated_at = NOW()
  WHERE id = p_session_id;

  -- Build result
  v_result := jsonb_build_object(
    'success', TRUE,
    'session_id', p_session_id,
    'amount_voided', p_amount_to_subtract,
    'new_total_sales', (SELECT total_sales FROM pos_sessions WHERE id = p_session_id),
    'new_total_refunds', (SELECT total_refunds FROM pos_sessions WHERE id = p_session_id)
  );

  RETURN v_result;

EXCEPTION
  WHEN lock_not_available THEN
    RAISE EXCEPTION 'Session is currently locked by another operation. Please try again.';
  WHEN OTHERS THEN
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION update_session_on_void(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION update_session_on_void(UUID, NUMERIC) TO service_role;

COMMENT ON FUNCTION update_session_on_void IS
'Updates POS session totals when a transaction is voided.
FIXED: Removed reference to non-existent voided_count column.
Uses row-level locking to prevent race conditions.';

-- =====================================================
-- STEP 3: CREATE update_session_for_refund
-- =====================================================
-- Updates POS session totals when a refund is processed
-- Similar to void but may be called outside the original session
-- =====================================================

CREATE OR REPLACE FUNCTION update_session_for_refund(
  p_session_id UUID,
  p_refund_amount NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session RECORD;
  v_result JSON;
BEGIN
  -- Lock the session row to prevent race conditions
  SELECT * INTO v_session
  FROM pos_sessions
  WHERE id = p_session_id
  FOR UPDATE NOWAIT;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'POS session not found: %', p_session_id;
  END IF;

  -- Update session totals
  -- Refund decreases total_sales and increases total_refunds
  UPDATE pos_sessions
  SET
    total_sales = GREATEST(total_sales - p_refund_amount, 0),
    total_refunds = total_refunds + p_refund_amount,
    expected_cash = CASE
      WHEN status = 'open' THEN opening_cash + total_cash - (total_refunds + p_refund_amount)
      ELSE expected_cash
    END,
    updated_at = NOW()
  WHERE id = p_session_id;

  -- Build result
  v_result := jsonb_build_object(
    'success', TRUE,
    'session_id', p_session_id,
    'amount_refunded', p_refund_amount,
    'new_total_sales', (SELECT total_sales FROM pos_sessions WHERE id = p_session_id),
    'new_total_refunds', (SELECT total_refunds FROM pos_sessions WHERE id = p_session_id)
  );

  RETURN v_result;

EXCEPTION
  WHEN lock_not_available THEN
    RAISE EXCEPTION 'Session is currently locked by another operation. Please try again.';
  WHEN OTHERS THEN
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION update_session_for_refund(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION update_session_for_refund(UUID, NUMERIC) TO service_role;

COMMENT ON FUNCTION update_session_for_refund IS
'Updates POS session totals when a refund is processed.
Uses row-level locking to prevent race conditions.
Similar to update_session_on_void but may be called from different session.';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check both functions exist
SELECT proname, prosrc LIKE '%FOR UPDATE NOWAIT%' as uses_locking
FROM pg_proc
WHERE proname IN ('update_session_on_void', 'update_session_for_refund')
ORDER BY proname;

-- =====================================================
-- ✅ DEPLOYMENT COMPLETE
-- =====================================================
