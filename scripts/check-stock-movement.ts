/**
 * Check if stock movements are being created by the atomic transfer
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkMovements() {
  // Get most recent transfer movement
  const { data: movements, error } = await supabase
    .from('stock_movements')
    .select('*')
    .eq('movement_type', 'transfer')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.log('❌ Error:', error);
  } else {
    console.log(`📦 Found ${movements?.length || 0} recent transfer movements:\n`);
    movements?.forEach((m, i) => {
      console.log(`${i + 1}. Movement ID: ${m.id}`);
      console.log(`   inventory_id: ${m.inventory_id}`);
      console.log(`   product_id: ${m.product_id}`);
      console.log(`   reference_type: ${m.reference_type}`);
      console.log(`   reference_id: ${m.reference_id}`);
      console.log(`   quantity: ${m.quantity}`);
      console.log(`   reason: ${m.reason}`);
      console.log(`   metadata: ${JSON.stringify(m.metadata)}`);
      console.log(`   created_at: ${m.created_at}\n`);
    });
  }
}

checkMovements();
