-- =====================================================
-- ATOMIC POS SESSION MANAGEMENT
-- =====================================================
-- Purpose: Prevent duplicate POS sessions for same register
-- Risk Addressed: Cash drawer discrepancies, transaction conflicts
-- Apple Standard: Database-level enforcement, atomic operations
-- =====================================================

-- =====================================================
-- STEP 1: ADD UNIQUE CONSTRAINT
-- =====================================================
-- Prevent multiple open sessions for the same register
-- This is the database-level guarantee that duplicates are IMPOSSIBLE
-- =====================================================

-- First, close any duplicate sessions (keeping the most recent one per register)
WITH ranked_sessions AS (
  SELECT
    id,
    register_id,
    ROW_NUMBER() OVER (
      PARTITION BY register_id
      ORDER BY opened_at DESC
    ) as rn
  FROM pos_sessions
  WHERE status = 'open'
)
UPDATE pos_sessions
SET
  status = 'closed',
  closed_at = NOW(),
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'auto_closed_reason', 'duplicate_session_cleanup',
    'auto_closed_at', NOW()
  )
WHERE id IN (
  SELECT id FROM ranked_sessions WHERE rn > 1
);

-- Now add the unique constraint
-- This prevents ANY future duplicates at database level
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_pos_sessions_one_open_per_register
ON pos_sessions (register_id)
WHERE status = 'open';

-- Add comment for documentation
COMMENT ON INDEX idx_pos_sessions_one_open_per_register IS
'Ensures only ONE open session per register at any time. Prevents duplicate sessions that cause cash drawer discrepancies and transaction conflicts.';

-- =====================================================
-- STEP 2: CREATE ATOMIC GET-OR-CREATE FUNCTION
-- =====================================================
-- This function is IMPOSSIBLE to race condition
-- Uses row-level locking + unique constraint
-- =====================================================

CREATE OR REPLACE FUNCTION get_or_create_session(
  p_register_id UUID,
  p_location_id UUID,
  p_vendor_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_opening_cash NUMERIC DEFAULT 200.00
)
RETURNS TABLE (
  id UUID,
  session_number TEXT,
  register_id UUID,
  location_id UUID,
  vendor_id UUID,
  user_id UUID,
  status TEXT,
  opening_cash NUMERIC,
  expected_cash NUMERIC,
  opened_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  is_existing BOOLEAN,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_session RECORD;
  v_new_session RECORD;
  v_session_number TEXT;
BEGIN
  -- =====================================================
  -- STEP 1: LOCK THE REGISTER ROW
  -- =====================================================
  -- This prevents ANY concurrent session creation
  -- NOWAIT ensures we fail fast if already locked
  -- =====================================================

  PERFORM 1 FROM registers
  WHERE registers.id = p_register_id
  FOR UPDATE NOWAIT;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Register not found or locked: %', p_register_id;
  END IF;

  -- =====================================================
  -- STEP 2: CHECK FOR EXISTING OPEN SESSION
  -- =====================================================
  -- With register locked, this check is race-condition safe
  -- =====================================================

  SELECT * INTO v_existing_session
  FROM pos_sessions
  WHERE register_id = p_register_id
    AND status = 'open'
  LIMIT 1;

  -- If session exists, return it
  IF FOUND THEN
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
      v_existing_session.expected_cash,
      v_existing_session.opened_at,
      v_existing_session.closed_at,
      TRUE as is_existing, -- Flag: this was already open
      v_existing_session.metadata,
      v_existing_session.created_at,
      v_existing_session.updated_at;
    RETURN;
  END IF;

  -- =====================================================
  -- STEP 3: CREATE NEW SESSION (ATOMICALLY)
  -- =====================================================
  -- With register locked and no existing session,
  -- we can safely create a new one
  -- =====================================================

  -- Generate session number
  v_session_number := 'S-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
                      LPAD(nextval('pos_sessions_id_seq')::TEXT, 6, '0');

  -- Create the session
  INSERT INTO pos_sessions (
    session_number,
    register_id,
    location_id,
    vendor_id,
    user_id,
    status,
    opening_cash,
    expected_cash,
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
    p_opening_cash, -- Expected cash starts at opening cash
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
    v_new_session.expected_cash,
    v_new_session.opened_at,
    v_new_session.closed_at,
    FALSE as is_existing, -- Flag: this is a new session
    v_new_session.metadata,
    v_new_session.created_at,
    v_new_session.updated_at;

EXCEPTION
  WHEN lock_not_available THEN
    RAISE EXCEPTION 'Session operation already in progress for this register. Please try again.';
  WHEN unique_violation THEN
    -- This should NEVER happen with our locking, but handle it gracefully
    RAISE EXCEPTION 'Duplicate session detected. Another session was created concurrently.';
  WHEN OTHERS THEN
    -- Re-raise any other exceptions (transaction will auto-rollback)
    RAISE;
END;
$$;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_or_create_session(UUID, UUID, UUID, UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_session(UUID, UUID, UUID, UUID, NUMERIC) TO service_role;

-- =====================================================
-- COMMENT FOR DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION get_or_create_session IS
'Atomically gets an existing open session or creates a new one for a register.
Uses row-level locking (FOR UPDATE NOWAIT) to prevent race conditions.
Combined with unique constraint on (register_id) WHERE status=open to guarantee no duplicates.
Same atomic pattern used by enterprise POS systems (Walmart, Best Buy, Apple Retail).';

-- =====================================================
-- VERIFICATION QUERIES (run these to verify deployment)
-- =====================================================

-- Verify unique index exists
-- SELECT indexname, indexdef FROM pg_indexes WHERE indexname = 'idx_pos_sessions_one_open_per_register';

-- Verify function exists
-- SELECT proname, prosrc FROM pg_proc WHERE proname = 'get_or_create_session';

-- Test session creation (replace UUIDs with real values)
-- SELECT * FROM get_or_create_session(
--   '00000000-0000-0000-0000-000000000000'::UUID, -- register_id
--   '00000000-0000-0000-0000-000000000000'::UUID, -- location_id
--   '00000000-0000-0000-0000-000000000000'::UUID, -- vendor_id
--   NULL, -- user_id (optional)
--   200.00 -- opening_cash
-- );
