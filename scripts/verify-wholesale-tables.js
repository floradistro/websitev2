#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyTables() {
  console.log('🔍 Verifying wholesale system tables...\n');

  const tables = [
    'suppliers',
    'wholesale_customers',
    'purchase_orders',
    'purchase_order_items',
    'purchase_order_payments',
    'inventory_reservations'
  ];

  const results = {};

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        results[table] = { exists: false, error: error.message };
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        results[table] = { exists: true, count: count || 0 };
        console.log(`✅ ${table}: EXISTS (${count || 0} rows)`);
      }
    } catch (err) {
      results[table] = { exists: false, error: err.message };
      console.log(`❌ ${table}: ${err.message}`);
    }
  }

  console.log('\n📊 Summary:');
  const existing = Object.values(results).filter(r => r.exists).length;
  const missing = tables.length - existing;

  console.log(`   ✅ Existing tables: ${existing}/${tables.length}`);
  console.log(`   ❌ Missing tables: ${missing}/${tables.length}`);

  if (missing > 0) {
    console.log('\n⚠️  Some tables are missing. Run the migration to create them.');
    process.exit(1);
  } else {
    console.log('\n✅ All wholesale tables exist!');
    process.exit(0);
  }
}

verifyTables().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
