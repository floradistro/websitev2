/**
 * Check if void-related RPC functions exist
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkVoidFunctions() {
  console.log('🔍 Checking void-related RPC functions...\n');

  // Check for increment_inventory function
  const { data: incrementInv, error: err1 } = await supabase
    .from('pg_proc')
    .select('proname, prosrc')
    .eq('proname', 'increment_inventory');

  console.log('📦 increment_inventory function:');
  if (err1) {
    console.log('❌ Error:', err1.message);
  } else if (!incrementInv || incrementInv.length === 0) {
    console.log('❌ Function does NOT exist');
  } else {
    console.log('✅ Function EXISTS');
    console.log('Source preview:', incrementInv[0].prosrc.substring(0, 200) + '...\n');
  }

  // Check for decrement_inventory function (used in sales)
  const { data: decrementInv, error: err2 } = await supabase
    .from('pg_proc')
    .select('proname, prosrc')
    .eq('proname', 'decrement_inventory');

  console.log('📦 decrement_inventory function:');
  if (err2) {
    console.log('❌ Error:', err2.message);
  } else if (!decrementInv || decrementInv.length === 0) {
    console.log('❌ Function does NOT exist');
  } else {
    console.log('✅ Function EXISTS');
    console.log('Source preview:', decrementInv[0].prosrc.substring(0, 200) + '...\n');
  }

  // Check for update_session_on_void function
  const { data: sessionVoid, error: err3 } = await supabase
    .from('pg_proc')
    .select('proname, prosrc')
    .eq('proname', 'update_session_on_void');

  console.log('📦 update_session_on_void function:');
  if (err3) {
    console.log('❌ Error:', err3.message);
  } else if (!sessionVoid || sessionVoid.length === 0) {
    console.log('❌ Function does NOT exist');
  } else {
    console.log('✅ Function EXISTS');
    console.log('Source preview:', sessionVoid[0].prosrc.substring(0, 200) + '...\n');
  }

  // Check for update_session_for_refund function
  const { data: sessionRefund, error: err4 } = await supabase
    .from('pg_proc')
    .select('proname, prosrc')
    .eq('proname', 'update_session_for_refund');

  console.log('📦 update_session_for_refund function:');
  if (err4) {
    console.log('❌ Error:', err4.message);
  } else if (!sessionRefund || sessionRefund.length === 0) {
    console.log('❌ Function does NOT exist');
  } else {
    console.log('✅ Function EXISTS');
    console.log('Source preview:', sessionRefund[0].prosrc.substring(0, 200) + '...\n');
  }

  // List all RPC functions in database
  const { data: allFunctions, error: err5 } = await supabase
    .from('pg_proc')
    .select('proname')
    .order('proname');

  if (err5) {
    console.log('\n❌ Error listing functions:', err5.message);
  } else {
    console.log(`\n📋 All RPC functions in database (${allFunctions?.length || 0} total):`);
    allFunctions?.forEach((f: any) => console.log(`  - ${f.proname}`));
  }
}

checkVoidFunctions();
