/**
 * Test if void-related RPC functions exist by trying to call them
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testRPCFunctions() {
  console.log('🧪 Testing RPC functions by calling them...\n');

  // Test increment_inventory (with dummy data)
  console.log('1️⃣ Testing increment_inventory...');
  const { data: inc1, error: incErr1 } = await supabase.rpc('increment_inventory', {
    p_inventory_id: '00000000-0000-0000-0000-000000000000',
    p_quantity: 1
  });

  if (incErr1) {
    if (incErr1.code === 'PGRST202') {
      console.log('❌ increment_inventory does NOT exist (with p_inventory_id, p_quantity)');
    } else {
      console.log('✅ increment_inventory EXISTS (error is expected with fake ID)');
      console.log(`   Error: ${incErr1.message}`);
    }
  } else {
    console.log('✅ increment_inventory EXISTS and executed');
  }

  // Test alternate signature (product_id, location_id, quantity)
  console.log('\n2️⃣ Testing increment_inventory (alternate signature)...');
  const { data: inc2, error: incErr2 } = await supabase.rpc('increment_inventory', {
    p_product_id: '00000000-0000-0000-0000-000000000000',
    p_location_id: '00000000-0000-0000-0000-000000000000',
    p_quantity: 1
  });

  if (incErr2) {
    if (incErr2.code === 'PGRST202') {
      console.log('❌ increment_inventory does NOT exist (with p_product_id, p_location_id, p_quantity)');
    } else {
      console.log('✅ increment_inventory EXISTS (error is expected with fake ID)');
      console.log(`   Error: ${incErr2.message}`);
    }
  } else {
    console.log('✅ increment_inventory EXISTS and executed');
  }

  // Test decrement_inventory
  console.log('\n3️⃣ Testing decrement_inventory...');
  const { data: dec, error: decErr } = await supabase.rpc('decrement_inventory', {
    p_inventory_id: '00000000-0000-0000-0000-000000000000',
    p_quantity: 1
  });

  if (decErr) {
    if (decErr.code === 'PGRST202') {
      console.log('❌ decrement_inventory does NOT exist');
    } else {
      console.log('✅ decrement_inventory EXISTS');
      console.log(`   Error: ${decErr.message}`);
    }
  } else {
    console.log('✅ decrement_inventory EXISTS and executed');
  }

  // Test update_session_on_void
  console.log('\n4️⃣ Testing update_session_on_void...');
  const { data: void1, error: voidErr } = await supabase.rpc('update_session_on_void', {
    p_session_id: '00000000-0000-0000-0000-000000000000',
    p_amount_to_subtract: 10.00
  });

  if (voidErr) {
    if (voidErr.code === 'PGRST202') {
      console.log('❌ update_session_on_void does NOT exist');
    } else {
      console.log('✅ update_session_on_void EXISTS');
      console.log(`   Error: ${voidErr.message}`);
    }
  } else {
    console.log('✅ update_session_on_void EXISTS and executed');
  }

  // Test update_session_for_refund
  console.log('\n5️⃣ Testing update_session_for_refund...');
  const { data: refund, error: refundErr } = await supabase.rpc('update_session_for_refund', {
    p_session_id: '00000000-0000-0000-0000-000000000000',
    p_refund_amount: 10.00
  });

  if (refundErr) {
    if (refundErr.code === 'PGRST202') {
      console.log('❌ update_session_for_refund does NOT exist');
    } else {
      console.log('✅ update_session_for_refund EXISTS');
      console.log(`   Error: ${refundErr.message}`);
    }
  } else {
    console.log('✅ update_session_for_refund EXISTS and executed');
  }

  console.log('\n' + '='.repeat(60));
  console.log('Summary: Check which functions need to be created');
}

testRPCFunctions();
