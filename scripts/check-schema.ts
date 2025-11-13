/**
 * Check database schema for inventory and registers tables
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkSchema() {
  console.log('🔍 Checking database schema...\n');

  // Check inventory table columns
  const { data: inventoryColumns, error: invError } = await supabase.rpc('exec', {
    sql: `
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'inventory'
      ORDER BY ordinal_position;
    `
  });

  if (invError) {
    console.log('❌ Error checking inventory table:', invError);
  } else {
    console.log('📋 Inventory table columns:');
    console.table(inventoryColumns);
  }

  // Check if registers table exists
  const { data: registersExists, error: regError } = await supabase.rpc('exec', {
    sql: `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'registers'
      );
    `
  });

  if (regError) {
    console.log('❌ Error checking registers table:', regError);
  } else {
    console.log('\n🏪 Registers table exists:', registersExists);
  }

  // Check pos_sessions table
  const { data: posSessionsColumns, error: posError } = await supabase.rpc('exec', {
    sql: `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'pos_sessions'
      ORDER BY ordinal_position;
    `
  });

  if (posError) {
    console.log('❌ Error checking pos_sessions table:', posError);
  } else {
    console.log('\n📋 POS Sessions table columns:');
    console.table(posSessionsColumns);
  }

  // Check actual inventory data type for product_id
  const { data: sampleInventory, error: sampleError } = await supabase
    .from('inventory')
    .select('id, product_id, location_id, vendor_id')
    .limit(1)
    .single();

  if (sampleError) {
    console.log('❌ Error fetching sample inventory:', sampleError);
  } else {
    console.log('\n📦 Sample inventory record:');
    console.log(sampleInventory);
    console.log('product_id type:', typeof sampleInventory.product_id);
  }
}

checkSchema();
