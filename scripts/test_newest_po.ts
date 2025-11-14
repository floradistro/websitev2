import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testReceive() {
  console.log('🔍 Finding newest PO...\n');

  const { data: pos, error } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      items:purchase_order_items(
        *,
        product:products(id, name, sku)
      ),
      location:locations(id, name)
    `)
    .eq('vendor_id', 'cd2e1122-d511-4edb-be5d-98ef274b4baf')
    .eq('po_type', 'inbound')
    .in('status', ['ordered', 'confirmed', 'partially_received'])
    .order('created_at', { ascending: false })
    .limit(1);

  if (error || !pos || pos.length === 0) {
    console.log('❌ No POs found or error:', error);
    return;
  }

  const po = pos[0];
  console.log(`✅ Found PO: ${po.po_number}`);
  console.log(`   Status: ${po.status}`);
  console.log(`   Items: ${po.items?.length || 0}`);
  console.log(`   Location: ${po.location?.name}\n`);

  const firstItem = po.items?.[0];
  if (!firstItem) {
    console.log('❌ No items in PO');
    return;
  }

  console.log(`📦 Testing with first item:`);
  console.log(`   Product: ${firstItem.product?.name}`);
  console.log(`   Ordered: ${firstItem.quantity}`);
  console.log(`   Received: ${firstItem.quantity_received || 0}`);
  console.log(`   Remaining: ${firstItem.quantity_remaining || firstItem.quantity}\n`);

  const testQuantity = 1;
  console.log(`🧪 Attempting to receive ${testQuantity} unit(s)...\n`);

  const { data: result, error: rpcError } = await supabase.rpc('receive_purchase_order_items', {
    p_po_id: po.id,
    p_items: [{
      po_item_id: firstItem.id,
      quantity_received: testQuantity,
      condition: 'good',
      quality_notes: '',
      notes: 'Test receive from script'
    }],
    p_vendor_id: 'cd2e1122-d511-4edb-be5d-98ef274b4baf'
  });

  if (rpcError) {
    console.log('❌ RPC ERROR:');
    console.log('   Message:', rpcError.message);
    console.log('   Details:', rpcError.details);
    console.log('   Hint:', rpcError.hint);
    console.log('   Code:', rpcError.code);
    console.log('\n   Full error:', JSON.stringify(rpcError, null, 2));
    return;
  }

  if (!result) {
    console.log('❌ Result is null - function may have failed silently');
    return;
  }

  if (!result.success) {
    console.log('❌ Function returned error:');
    console.log('   Error:', result.error);
    console.log('   Details:', result.results);
    console.log('\n   Full result:', JSON.stringify(result, null, 2));
    return;
  }

  console.log('✅ SUCCESS!');
  console.log(`   Received: ${result.successful_items} items`);
  console.log(`   Failed: ${result.failed_items} items`);
  console.log(`   Results:`, JSON.stringify(result.results, null, 2));

  // Check updated PO status
  console.log('\n🔍 Checking updated PO status...');
  const { data: updatedPO } = await supabase
    .from('purchase_orders')
    .select('id, po_number, status')
    .eq('id', po.id)
    .single();

  console.log(`   PO Status: ${updatedPO?.status}`);
}

testReceive().then(() => process.exit(0)).catch(e => { console.error('Fatal:', e); process.exit(1); });
