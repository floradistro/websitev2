import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugLemonRuntz() {
  console.log('🔍 Debugging Lemon Runtz receive issue...\n');

  const poItemId = 'b7b8d920-5880-4340-9366-885bd6b939c2';

  // Check for any receives for this PO item
  const { data: receives, error: recError } = await supabase
    .from('purchase_order_receives')
    .select('*')
    .eq('po_item_id', poItemId);

  console.log('📦 Existing receives for this PO item:', receives?.length || 0);
  if (receives && receives.length > 0) {
    receives.forEach((r, i) => {
      console.log(`  ${i+1}. ID: ${r.id}, Qty: ${r.quantity_received}, Created: ${r.created_at}`);
    });
  }

  // Check Lemon Runtz product
  const { data: products } = await supabase
    .from('products')
    .select('id, name, sku')
    .ilike('name', '%lemon%runtz%');

  console.log('\n🌿 Lemon Runtz Products Found:', products?.length || 0);
  products?.forEach((p, i) => {
    console.log(`  ${i+1}. ID: ${p.id}, Name: ${p.name}, SKU: ${p.sku}`);
  });

  // Check if this product_id matches the PO item
  const { data: poItem } = await supabase
    .from('purchase_order_items')
    .select('*')
    .eq('id', poItemId)
    .single();

  console.log('\n📋 PO Item Details:');
  console.log('  Product ID:', poItem?.product_id);
  console.log('  Quantity:', poItem?.quantity);
  console.log('  Quantity Received:', poItem?.quantity_received);
  console.log('  Quantity Remaining:', poItem?.quantity_remaining);

  // Get the product for this PO item
  const { data: poProduct } = await supabase
    .from('products')
    .select('id, name, sku')
    .eq('id', poItem?.product_id)
    .single();

  console.log('  Product Name:', poProduct?.name);
  console.log('  Product SKU:', poProduct?.sku);

  // Check for any database triggers or functions that might be interfering
  console.log('\n🔧 Checking for triggers...');
  const { data: schemaData } = await supabase.rpc('exec_sql', {
    sql_query: `
      SELECT
        trigger_name,
        event_manipulation,
        action_timing,
        action_statement
      FROM information_schema.triggers
      WHERE event_object_table IN ('purchase_order_receives', 'purchase_order_items')
      ORDER BY event_object_table, trigger_name;
    `
  });

  if (schemaData) {
    console.log('Found triggers:', schemaData);
  }
}

debugLemonRuntz();
