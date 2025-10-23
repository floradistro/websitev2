import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkVendorsTable() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('🔍 Checking vendors table structure...\n');

  // Get table columns
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (data && data.length > 0) {
    console.log('✅ Vendors table columns:');
    const columns = Object.keys(data[0]);
    columns.forEach(col => console.log(`   - ${col}`));
  } else {
    console.log('⚠️  Vendors table exists but has no data');
    console.log('   Cannot determine column structure');
  }
}

checkVendorsTable();

