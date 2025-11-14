import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFields() {
  const { data: items } = await supabase
    .from('purchase_order_items')
    .select('id, quantity, quantity_received, quantity_remaining')
    .eq('purchase_order_id', (await supabase
      .from('purchase_orders')
      .select('id')
      .eq('po_number', 'IN-PO-20251114-0011')
      .single()).data!.id)
    .limit(3);

  console.log('Sample items from PO IN-PO-20251114-0011:\n');
  items?.forEach((item, idx) => {
    console.log(`Item ${idx + 1}:`);
    console.log('  quantity:', item.quantity);
    console.log('  quantity_received:', item.quantity_received);
    console.log('  quantity_remaining:', item.quantity_remaining);
    console.log('  typeof quantity_remaining:', typeof item.quantity_remaining);
    console.log('  (quantity_remaining || 0) > 0:', (item.quantity_remaining || 0) > 0);
    console.log('');
  });
}

checkFields().then(() => process.exit(0));
