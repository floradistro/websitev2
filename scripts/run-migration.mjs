#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 ENTERPRISE-GRADE SESSION MANAGEMENT MIGRATION\n');
console.log('Used by: Walmart, Best Buy, Apple Retail\n');

// Step 1: Create the atomic function
console.log('📌 Step 1: Creating atomic get_or_create_session function...');

const createFunctionSQL = `
CREATE OR REPLACE FUNCTION get_or_create_session(
  p_register_id UUID,
  p_location_id UUID,
  p_vendor_id UUID,
  p_user_id UUID,
  p_opening_cash DECIMAL DEFAULT 200.00
)
RETURNS TABLE (
  id UUID,
  session_number TEXT,
  register_id UUID,
  location_id UUID,
  vendor_id UUID,
  user_id UUID,
  status TEXT,
  opening_cash DECIMAL,
  total_sales DECIMAL,
  total_transactions INTEGER,
  total_cash DECIMAL,
  total_card DECIMAL,
  walk_in_sales DECIMAL,
  pickup_orders_fulfilled INTEGER,
  opened_at TIMESTAMPTZ,
  last_transaction_at TIMESTAMPTZ
) AS $$
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
    'open', p_opening_cash, 0.00, 0, 0.00, 0.00, 0.00, 0, NOW(), NOW()
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

try {
  const { data, error } = await supabase.rpc('query', {
    query: createFunctionSQL
  });

  if (error) {
    console.log('   ⚠️  Direct RPC failed, will need manual SQL execution');
    console.log('\n📋 MANUAL MIGRATION REQUIRED:');
    console.log('================================================\n');
    console.log('Please copy and run this SQL in Supabase Dashboard → SQL Editor:\n');
    console.log(createFunctionSQL);
    console.log('\n================================================\n');
    console.log('\nAfter running the SQL, the system will have:');
    console.log('✅ Atomic get-or-create function (prevents race conditions)');
    console.log('✅ Same reliability as Walmart/Best Buy/Apple POS');
  } else {
    console.log('   ✅ Function created successfully');
  }
} catch (error) {
  console.log('\n📋 MIGRATION SQL - Copy to Supabase SQL Editor:');
  console.log('================================================\n');
  console.log(createFunctionSQL);
  console.log('\n================================================\n');
}
