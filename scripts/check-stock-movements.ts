/**
 * Check stock_movements table schema
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkStockMovements() {
  // Get a sample stock movement to see the structure
  const { data, error } = await supabase
    .from('stock_movements')
    .select('*')
    .limit(1);

  if (error) {
    console.log('❌ Error:', error);
  } else {
    console.log('📦 Sample stock_movements record:');
    console.log(data?.[0] || 'No records found');
    if (data?.[0]) {
      console.log('\n🔑 Keys:', Object.keys(data[0]));
    }
  }
}

checkStockMovements();
