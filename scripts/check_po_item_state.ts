import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPOItemState() {
  console.log('🔍 Checking Lemon Runtz PO item state...\n');

  const poItemId = 'b7b8d920-5880-4340-9366-885bd6b939c2';

  // Get PO item details
  const { data: poItem, error: poItemError } = await supabase
    .from('purchase_order_items')
    .select(`
      id,
      quantity,
      quantity_received,
      quantity_remaining,
      unit_price,
      product:product_id(name),
      purchase_order:purchase_order_id(po_number, status)
    `)
    .eq('id', poItemId)
    .single();

  if (poItemError) {
    console.error('❌ Error fetching PO item:', poItemError);
    return;
  }

  console.log('📦 PO Item Details:');
  console.log('Product:', (poItem.product as any).name);
  console.log('PO Number:', (poItem.purchase_order as any).po_number);
  console.log('PO Status:', (poItem.purchase_order as any).status);
  console.log('Quantity Ordered:', poItem.quantity);
  console.log('Quantity Received:', poItem.quantity_received || 0);
  console.log('Quantity Remaining:', poItem.quantity_remaining);
  console.log('Unit Price:', poItem.unit_price);

  // Check all receiving records for this item
  const { data: receives, error: receivesError } = await supabase
    .from('purchase_order_receives')
    .select('*')
    .eq('po_item_id', poItemId)
    .order('created_at', { ascending: false });

  if (receivesError) {
    console.error('❌ Error fetching receives:', receivesError);
    return;
  }

  console.log('\n📝 Receiving History:');
  if (receives && receives.length > 0) {
    receives.forEach((receive, i) => {
      console.log(`  ${i + 1}. Received ${receive.quantity_received} on ${new Date(receive.created_at).toLocaleString()}`);
      console.log(`     Condition: ${receive.condition}, Notes: ${receive.notes || 'N/A'}`);
    });
    console.log(`\nTotal receives: ${receives.length}`);
    console.log(`Total quantity received via records: ${receives.reduce((sum, r) => sum + parseFloat(r.quantity_received), 0)}`);
  } else {
    console.log('  No receiving records found');
  }

  // Check if there's a trigger that might be updating quantity_received
  console.log('\n🔍 Checking for triggers on purchase_order_receives...');
  const { data: triggers, error: triggersError } = await supabase.rpc('exec_sql', {
    sql_query: `
      SELECT
        trigger_name,
        event_manipulation,
        action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'purchase_order_receives'
      ORDER BY trigger_name;
    `
  });

  if (!triggersError && triggers) {
    console.log('Triggers:', triggers);
  }
}

checkPOItemState();
