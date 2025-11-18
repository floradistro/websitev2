# 🔧 Loyalty System Fix - Migration Instructions

## Problem Identified

The loyalty system is failing with error `42704: unrecognized configuration parameter "app.current_vendor_id"` because:

1. The `loyalty_programs` table has an RLS policy that checks `current_setting('app.current_vendor_id')`
2. The app is not setting this session variable before querying
3. When using the **anon key** (which the React Native app uses), RLS policies are enforced
4. When using the **service role key** (which bypasses RLS), queries work fine

## Solution

Create a database function `set_vendor_context()` that sets the session variable, then call it before querying.

---

## STEP 1: Apply Database Migration

### Go to Supabase SQL Editor:
https://supabase.com/dashboard/project/uaednwpxursknmwdeejn/sql/new

### Paste and run this SQL:

```sql
-- Migration 1: Create function to set vendor context for RLS
CREATE OR REPLACE FUNCTION set_vendor_context(vendor_id_param TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set the current vendor ID in the session
  -- This is used by RLS policies that check current_setting('app.current_vendor_id')
  PERFORM set_config('app.current_vendor_id', vendor_id_param, false);
END;
$$;

-- Allow anon and authenticated users to call this function
GRANT EXECUTE ON FUNCTION set_vendor_context TO anon, authenticated;

COMMENT ON FUNCTION set_vendor_context IS 'Sets the vendor context (app.current_vendor_id) for the current session. Used by RLS policies to scope queries to a specific vendor.';
```

### Click "RUN" ▶️

---

## STEP 2: Verify the Function Works

Run this test query in the SQL Editor:

```sql
-- Test 1: Set vendor context
SELECT set_vendor_context('cd2e1122-d511-4edb-be5d-98ef274b4baf');

-- Test 2: Verify it's set
SELECT current_setting('app.current_vendor_id', true);

-- Test 3: Query should now work
SELECT * FROM loyalty_programs
WHERE vendor_id = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
AND is_active = true;
```

Expected results:
- Test 1: Should return (empty - void function)
- Test 2: Should return `cd2e1122-d511-4edb-be5d-98ef274b4baf`
- Test 3: Should return the "Flora Distro Rewards" program

---

## STEP 3: Test in the App

The loyalty service has already been updated to call `set_vendor_context()` before querying.

### Reload the React Native app

The loyalty program should now load without errors!

### Check the logs

You should see:
```
✅ [INFO] Loading loyalty program
✅ [INFO] Loyalty program loaded
```

Instead of:
```
❌ [ERROR] unrecognized configuration parameter "app.current_vendor_id"
```

---

## What Was Changed in the Code

### File: `src/services/loyalty.service.ts`

**Before:**
```typescript
const result = await withRetry(
  async () => {
    const { data, error } = await supabase
      .from('loyalty_programs')
      .select('*')
```

**After:**
```typescript
// Set vendor context for RLS policies
await supabase.rpc('set_vendor_context', { vendor_id_param: vendorId })

const result = await withRetry(
  async () => {
    const { data, error } = await supabase
      .from('loyalty_programs')
      .select('*')
```

---

## Troubleshooting

### If the function doesn't exist error persists:

1. Make sure you ran the SQL in the correct project (uaednwpxursknmwdeejn)
2. Check the function was created:
   ```sql
   SELECT proname, pg_get_functiondef(oid)
   FROM pg_proc
   WHERE proname = 'set_vendor_context';
   ```

### If you still get RLS errors:

1. Check the RLS policy on `loyalty_programs`:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'loyalty_programs';
   ```

2. The policy should use `current_setting('app.current_vendor_id', true)`
   - The `true` parameter makes it return NULL instead of erroring if not set

---

## Next Steps (After This Works)

Once loyalty loading works, we'll need to apply the atomic transaction RPC function:
- `record_loyalty_transaction_atomic` - for recording points earned/redeemed

But let's get the loading working first! 🎯
