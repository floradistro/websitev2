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

async function reloadSchema() {
  console.log('🔄 Reloading PostgREST schema cache...');

  // Execute SQL to reload schema
  const { data, error } = await supabase.rpc('pgrst_reload_schema_cache');

  if (error) {
    console.log('Method 1 failed, trying direct SQL...');

    // Try direct SQL approach
    const { data: data2, error: error2 } = await supabase
      .from('purchase_order_items')
      .select('*', { count: 'exact', head: true });

    if (error2) {
      console.error('❌ Still having issues:', error2.message);
      console.log('\n💡 Tip: The schema cache will refresh automatically within a few seconds.');
      console.log('   Try waiting 10-30 seconds and running your test again.');
    } else {
      console.log('✅ Schema cache appears to be working now!');
    }
  } else {
    console.log('✅ Schema cache reloaded successfully!');
  }
}

reloadSchema().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
