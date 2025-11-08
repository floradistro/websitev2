import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uaednwpxursknmwdeejn.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔧 Fixing get_or_create_session function...\n');

// Supabase client doesn't support raw SQL execution directly,
// so we'll use the Supabase Database REST API
const sql = `
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
  PERFORM * FROM pos_registers
  WHERE pos_registers.id = p_register_id
  FOR UPDATE;

  SELECT * INTO v_existing_session
  FROM pos_sessions
  WHERE pos_sessions.register_id = p_register_id
    AND pos_sessions.status = 'open'
  LIMIT 1;

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
`;

// Try to execute via psql command line (requires database connection)
console.log('Step 2: Attempting to execute SQL...\n');

// Save SQL to temp file
const fs = await import('fs');
const tmpFile = '/tmp/fix-session-function.sql';
fs.writeFileSync(tmpFile, sql);

// Try psql if available
const { exec } = await import('child_process');
const { promisify } = await import('util');
const execPromise = promisify(exec);

try {
  const password = 'SelahEsco123!!';
  const host = 'db.uaednwpxursknmwdeejn.supabase.co';
  const user = 'postgres';
  const db = 'postgres';

  // Try with psql
  const result = await execPromise(
    `PGPASSWORD="${password}" psql -h ${host} -U ${user} -d ${db} -f ${tmpFile}`,
    { timeout: 10000 }
  );

  console.log('✅ Function fix applied successfully!');
  console.log('   Output:', result.stdout);
  if (result.stderr && !result.stderr.includes('NOTICE')) {
    console.log('   Warnings:', result.stderr);
  }
  console.log('\n✅ Session status 500 errors should now be resolved!');
  console.log('   Refresh your POS page to test.');

} catch (error) {
  console.error('❌ Could not execute SQL:', error.message);
  console.log('\n📋 The database may be temporarily blocking connections.');
  console.log('📋 Please apply the fix manually:');
  console.log('');
  console.log('Option 1 - Supabase Dashboard (Recommended):');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project (uaednwpxursknmwdeejn)');
  console.log('3. Click "SQL Editor" in the left sidebar');
  console.log('4. Click "New Query"');
  console.log('5. Copy and paste contents of: fix-session-function.sql');
  console.log('6. Click "Run"');
  console.log('');
  console.log('Option 2 - Command Line (when database accepts connections):');
  console.log(`psql "postgresql://postgres:SelahEsco123!!@db.uaednwpxursknmwdeejn.supabase.co:5432/postgres" -f fix-session-function.sql`);
  console.log('');
  console.log('⚠️  This fix is CRITICAL to resolve the session status 500 errors!');
}

// Cleanup
try {
  fs.unlinkSync(tmpFile);
} catch (e) {
  // Ignore
}
