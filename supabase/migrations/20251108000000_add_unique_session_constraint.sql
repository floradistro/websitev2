-- CRITICAL: Add unique constraint to prevent duplicate open sessions per register
-- This ensures only ONE open session can exist per register at any time
-- Without this, race conditions can create duplicate sessions

-- Drop existing index if it exists (for idempotency)
DROP INDEX IF EXISTS idx_one_open_session_per_register;

-- Create unique partial index
-- This prevents multiple 'open' sessions for the same register
CREATE UNIQUE INDEX idx_one_open_session_per_register
ON pos_sessions (register_id)
WHERE status = 'open';

-- Add comment for documentation
COMMENT ON INDEX idx_one_open_session_per_register IS
  'Ensures only one open session per register. Critical for preventing race conditions and duplicate sessions.';
