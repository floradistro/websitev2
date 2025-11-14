import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugPO() {
  const poNumber = 'IN-PO-20251114-0011';

  console.log(`🔍 Debugging PO: ${poNumber}\n`);

  const { data: po, error } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      items:purchase_order_items(
        *,
        product:products(id, name, sku)
      ),
      location:locations(id, name)
    `)
    .eq('po_number', poNumber)
    .eq('vendor_id', 'cd2e1122-d511-4edb-be5d-98ef274b4baf')
    .single();

  if (error || !po) {
    console.log('❌ Error fetching PO:', error);
    return;
  }

  console.log('📦 PO Details:');
  console.log('   Number:', po.po_number);
  console.log('   Status:', po.status);
  console.log('   Location:', po.location?.name || 'NULL ⚠️');
  console.log('   Location ID:', po.location_id || 'NULL ⚠️');
  console.log('   Total Items:', po.items?.length || 0);
  console.log('');

  console.log('📋 Items Breakdown:');
  let allReceived = true;
  let anyReceived = false;

  po.items?.forEach((item: any, idx: number) => {
    const received = item.quantity_received || 0;
    const remaining = item.quantity_remaining || item.quantity;
    const isFullyReceived = received >= item.quantity;

    console.log(`   ${idx + 1}. ${item.product?.name}`);
    console.log(`      Ordered: ${item.quantity}`);
    console.log(`      Received: ${received}`);
    console.log(`      Remaining: ${remaining}`);
    console.log(`      Status: ${isFullyReceived ? '✅ Fully Received' : received > 0 ? '🔄 Partially Received' : '⏳ Not Received'}`);
    console.log('');

    if (!isFullyReceived) allReceived = false;
    if (received > 0) anyReceived = true;
  });

  console.log('='.repeat(60));
  console.log('🎯 Expected Status:');
  if (allReceived) {
    console.log('   Should be: "received" (all items fully received)');
  } else if (anyReceived) {
    console.log('   Should be: "partially_received" (some items received)');
  } else {
    console.log('   Should be: "ordered" (nothing received yet)');
  }
  console.log('   Current Status:', po.status);

  if (
    (allReceived && po.status !== 'received') ||
    (anyReceived && !allReceived && po.status !== 'partially_received') ||
    (!anyReceived && po.status !== 'ordered')
  ) {
    console.log('   ⚠️  STATUS MISMATCH DETECTED!');
  } else {
    console.log('   ✅ Status is correct');
  }

  // Check if location_id is missing
  if (!po.location_id) {
    console.log('');
    console.log('⚠️  CRITICAL: PO has no location_id!');
    console.log('   This will prevent receiving items.');
    console.log('   The PO needs to be assigned to a location.');
  }
}

debugPO().then(() => process.exit(0)).catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
