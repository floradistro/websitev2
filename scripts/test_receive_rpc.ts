import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testReceiveRPC() {
  console.log('🧪 Testing receive_purchase_order_items RPC function...\n');

  // First, let's find a simple PO to test with
  const { data: pos } = await supabase
    .from('purchase_orders')
    .select(`
      id,
      po_number,
      vendor_id,
      purchase_order_items (
        id,
        product_id,
        quantity,
        quantity_received,
        unit_price
      )
    `)
    .eq('vendor_id', 'cd2e1122-d511-4edb-be5d-98ef274b4baf')
    .order('created_at', { ascending: false })
    .limit(3);

  console.log('📦 Recent POs:', pos?.length || 0);

  if (pos && pos.length > 0) {
    const testPO = pos[0];
    console.log('\nTesting with PO:', testPO.po_number || testPO.id);
    console.log('Items:', testPO.purchase_order_items?.length || 0);

    // Try to receive just 1 unit of the first item
    const firstItem = testPO.purchase_order_items?.[0];
    if (firstItem) {
      console.log('\n📋 First Item:');
      console.log('  ID:', firstItem.id);
      console.log('  Quantity:', firstItem.quantity);
      console.log('  Already Received:', firstItem.quantity_received || 0);
      console.log('  Unit Price:', firstItem.unit_price);

      const testReceiveQty = 1;
      console.log(`\n🧪 Attempting to receive ${testReceiveQty} unit(s)...`);

      const { data, error } = await supabase.rpc('receive_purchase_order_items', {
        p_po_id: testPO.id,
        p_items: [
          {
            po_item_id: firstItem.id,
            quantity_received: testReceiveQty,
            condition: 'good',
            notes: 'Test receive from script'
          }
        ],
        p_vendor_id: testPO.vendor_id
      });

      if (error) {
        console.log('\n❌ RPC Error:');
        console.log('  Code:', error.code);
        console.log('  Message:', error.message);
        console.log('  Details:', error.details);
        console.log('  Hint:', error.hint);
      } else {
        console.log('\n✅ RPC Success:');
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }
}

testReceiveRPC().catch(console.error);
