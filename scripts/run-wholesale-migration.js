const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('📦 Running wholesale system migration...\n');

    const migrationPath = path.join(__dirname, '../supabase/migrations/20251027_wholesale_system.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
      console.error('❌ Migration failed:', error);
      console.log('\n💡 You may need to run this migration manually in Supabase SQL Editor');
      console.log('   File location:', migrationPath);
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
    console.log('\nCreated tables:');
    console.log('  - suppliers');
    console.log('  - wholesale_customers');
    console.log('  - purchase_orders');
    console.log('  - purchase_order_items');
    console.log('  - purchase_order_payments');
    console.log('  - inventory_reservations');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Please run the migration manually in Supabase SQL Editor');
    console.log('   File: supabase/migrations/20251027_wholesale_system.sql');
  }
}

runMigration();
