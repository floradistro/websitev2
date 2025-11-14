import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPO() {
  const { data: po } = await supabase
    .from('purchase_orders')
    .select('id, po_number, status')
    .eq('po_number', 'IN-PO-20251114-0011')
    .single();

  if (!po) {
    console.log('PO not found');
    return;
  }

  const { data: items } = await supabase
    .from('purchase_order_items')
    .select('id, quantity, quantity_received, quantity_remaining')
    .eq('purchase_order_id', po.id)
    .order('id')
    .limit(10);

  console.log(`PO: ${po.po_number}`);
  console.log(`Status: ${po.status}`);
  console.log(`\nFirst 10 items:\n`);

  items?.forEach((item, idx) => {
    console.log(`${idx + 1}.`);
    console.log(`   quantity: ${item.quantity}`);
    console.log(`   quantity_received: ${item.quantity_received}`);
    console.log(`   quantity_remaining: ${item.quantity_remaining}`);
    console.log(`   calculated: ${item.quantity} - ${item.quantity_received || 0} = ${item.quantity - (item.quantity_received || 0)}`);
    console.log('');
  });
}

checkPO().then(() => process.exit(0));
