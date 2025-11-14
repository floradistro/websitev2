import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testValidations() {
  console.log('🧪 Testing Production Validations\n');
  console.log('='.repeat(60));

  // Get a test PO
  const { data: po } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      items:purchase_order_items(*)
    `)
    .eq('vendor_id', 'cd2e1122-d511-4edb-be5d-98ef274b4baf')
    .eq('po_type', 'inbound')
    .in('status', ['ordered', 'confirmed', 'partially_received'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!po || !po.items?.[0]) {
    console.log('❌ No test PO found');
    return;
  }

  const testItem = po.items[0];
  console.log(`Using PO: ${po.po_number}\n`);

  // Test 1: Zero quantity should fail
  console.log('Test 1: Zero Quantity Validation');
  const { data: result1, error: err1 } = await supabase.rpc('receive_purchase_order_items', {
    p_po_id: po.id,
    p_items: [{
      po_item_id: testItem.id,
      quantity_received: 0,  // INVALID
      condition: 'good'
    }],
    p_vendor_id: 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  });

  if (result1?.results?.[0]?.error?.includes('greater than 0') || err1?.message?.includes('greater than 0')) {
    console.log('✅ PASS: Zero quantity rejected\n');
  } else {
    console.log('❌ FAIL: Zero quantity should be rejected');
    console.log('   Result:', JSON.stringify(result1, null, 2));
    console.log('   Error:', err1?.message, '\n');
  }

  // Test 2: Negative quantity should fail
  console.log('Test 2: Negative Quantity Validation');
  const { data: result2, error: err2 } = await supabase.rpc('receive_purchase_order_items', {
    p_po_id: po.id,
    p_items: [{
      po_item_id: testItem.id,
      quantity_received: -5,  // INVALID
      condition: 'good'
    }],
    p_vendor_id: 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  });

  if (result2?.results?.[0]?.error?.includes('greater than 0') || err2?.message?.includes('greater than 0')) {
    console.log('✅ PASS: Negative quantity rejected\n');
  } else {
    console.log('❌ FAIL: Negative quantity should be rejected');
    console.log('   Result:', JSON.stringify(result2, null, 2));
    console.log('   Error:', err2?.message, '\n');
  }

  // Test 3: Invalid condition should fail
  console.log('Test 3: Invalid Condition Validation');
  const { data: result3, error: err3 } = await supabase.rpc('receive_purchase_order_items', {
    p_po_id: po.id,
    p_items: [{
      po_item_id: testItem.id,
      quantity_received: 1,
      condition: 'bad_condition',  // INVALID
    }],
    p_vendor_id: 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  });

  if (result3?.results?.[0]?.error?.includes('Invalid condition') || err3?.message?.includes('Invalid condition')) {
    console.log('✅ PASS: Invalid condition rejected\n');
  } else {
    console.log('❌ FAIL: Invalid condition should be rejected');
    console.log('   Result:', JSON.stringify(result3, null, 2));
    console.log('   Error:', err3?.message, '\n');
  }

  // Test 4: Damaged condition without quality notes should fail
  console.log('Test 4: Quality Notes Required for Damaged Items');
  const { data: result4, error: err4 } = await supabase.rpc('receive_purchase_order_items', {
    p_po_id: po.id,
    p_items: [{
      po_item_id: testItem.id,
      quantity_received: 1,
      condition: 'damaged',
      quality_notes: '',  // INVALID - should require notes
    }],
    p_vendor_id: 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  });

  if (result4?.results?.[0]?.error?.includes('Quality notes are required') || err4?.message?.includes('Quality notes are required')) {
    console.log('✅ PASS: Quality notes enforced for damaged items\n');
  } else {
    console.log('❌ FAIL: Quality notes should be required for damaged items');
    console.log('   Result:', JSON.stringify(result4, null, 2));
    console.log('   Error:', err4?.message, '\n');
  }

  // Test 5: Exceeding ordered quantity should fail
  console.log('Test 5: Quantity Limit Validation');
  const { data: result5, error: err5 } = await supabase.rpc('receive_purchase_order_items', {
    p_po_id: po.id,
    p_items: [{
      po_item_id: testItem.id,
      quantity_received: testItem.quantity + 999,  // INVALID - way over limit
      condition: 'good'
    }],
    p_vendor_id: 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  });

  if (result5?.results?.[0]?.error?.includes('exceed ordered quantity') || err5?.message?.includes('exceed ordered quantity')) {
    console.log('✅ PASS: Over-receiving rejected\n');
  } else {
    console.log('❌ FAIL: Over-receiving should be rejected');
    console.log('   Result:', JSON.stringify(result5, null, 2));
    console.log('   Error:', err5?.message, '\n');
  }

  // Test 6: Valid receive should work
  console.log('Test 6: Valid Receive (Control Test)');
  const { data: result6 } = await supabase.rpc('receive_purchase_order_items', {
    p_po_id: po.id,
    p_items: [{
      po_item_id: testItem.id,
      quantity_received: 1,
      condition: 'good',
      notes: 'Validation test'
    }],
    p_vendor_id: 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  });

  if (result6?.success && result6.successful_items === 1) {
    console.log('✅ PASS: Valid receive succeeded\n');
  } else {
    console.log('❌ FAIL: Valid receive should succeed');
    console.log('   Result:', JSON.stringify(result6, null, 2), '\n');
  }

  console.log('='.repeat(60));
  console.log('🏁 Validation Tests Complete\n');
}

testValidations().then(() => process.exit(0)).catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
