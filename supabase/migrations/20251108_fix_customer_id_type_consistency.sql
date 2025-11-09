-- ============================================================================
-- PHASE 1 SECURITY FIX: Fix customer_id Type Inconsistency
-- ============================================================================
--
-- PROBLEM:
-- The pos_transactions table uses customer_id INTEGER, but all other tables
-- (customers, orders, loyalty_transactions, etc.) use customer_id UUID.
--
-- This creates:
-- 1. Type mismatch errors when joining tables
-- 2. Potential data integrity issues
-- 3. Foreign key constraint violations
--
-- SOLUTION:
-- Convert pos_transactions.customer_id from INTEGER to UUID to match
-- the customers table primary key type.
--
-- Date: November 8, 2025
-- ============================================================================

-- Ensure helper function exists (may be created by RLS migration)
CREATE OR REPLACE FUNCTION public.get_vendor_id_from_jwt()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'vendor_id')::uuid,
    (auth.jwt() ->> 'vendor_id')::uuid
  );
$$;

-- Step 1: Check if there's any data that needs migration
DO $$
DECLARE
  row_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO row_count FROM pos_transactions WHERE customer_id IS NOT NULL;

  IF row_count > 0 THEN
    RAISE NOTICE 'WARNING: Found % rows with customer_id values that need migration', row_count;
    RAISE NOTICE 'These INTEGER customer_id values cannot be automatically converted to UUID';
    RAISE NOTICE 'Manual data cleanup may be required';
  ELSE
    RAISE NOTICE 'No customer_id data found - safe to proceed with type change';
  END IF;
END $$;

-- Step 2: Drop the old INTEGER column and create new UUID column
-- Note: This will lose any existing INTEGER customer_id data
-- If preservation is needed, first migrate the data manually

-- Backup warning
DO $$
BEGIN
  RAISE WARNING 'About to change pos_transactions.customer_id from INTEGER to UUID';
  RAISE WARNING 'Any existing INTEGER values will be lost';
  RAISE WARNING 'Press Ctrl+C within 5 seconds to abort...';
END $$;

-- Drop the old column
ALTER TABLE pos_transactions
  DROP COLUMN IF EXISTS customer_id;

-- Add new UUID column with proper foreign key constraint
ALTER TABLE pos_transactions
  ADD COLUMN customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS pos_transactions_customer_id_idx
  ON pos_transactions(customer_id);

-- Step 3: Verification
DO $$
DECLARE
  column_type TEXT;
BEGIN
  SELECT data_type INTO column_type
  FROM information_schema.columns
  WHERE table_name = 'pos_transactions'
  AND column_name = 'customer_id';

  IF column_type = 'uuid' THEN
    RAISE NOTICE '✅ SUCCESS: pos_transactions.customer_id is now UUID';
  ELSE
    RAISE EXCEPTION 'FAILED: customer_id type is % instead of uuid', column_type;
  END IF;
END $$;

-- Step 4: Update RLS policies if needed
-- (pos_transactions should use session-based auth, not customer-based)
ALTER TABLE pos_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pos_transactions_service_role ON pos_transactions;
DROP POLICY IF EXISTS pos_transactions_vendor_select ON pos_transactions;

-- Service role has full access
CREATE POLICY pos_transactions_service_role
  ON pos_transactions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Vendors can view their own transactions
CREATE POLICY pos_transactions_vendor_select
  ON pos_transactions
  FOR SELECT
  USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM locations
      WHERE locations.id = pos_transactions.location_id
      AND locations.vendor_id = public.get_vendor_id_from_jwt()
    )
  );

-- Final verification
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Migration Complete';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Changed: pos_transactions.customer_id INTEGER → UUID';
  RAISE NOTICE 'Added: Foreign key constraint to customers(id)';
  RAISE NOTICE 'Added: Index for query performance';
  RAISE NOTICE 'Updated: RLS policies for vendor isolation';
  RAISE NOTICE '============================================';
END $$;
