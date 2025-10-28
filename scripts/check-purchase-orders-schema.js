const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uaednwpxursknmwdeejn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNzQwNjA0MywiZXhwIjoyMDQyOTgyMDQzfQ.w8gLdJvS_C_PN4cYKV7oEWGqrNL-0o6MgvTF4uRbp8Y'
);

async function checkSchema() {
  console.log('Checking purchase_orders table schema...\n');

  // Try to get a sample row to see the structure
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns in purchase_orders table:');
    Object.keys(data[0]).forEach(key => {
      console.log(`  - ${key}`);
    });
  } else {
    console.log('No data in purchase_orders table yet');

    // Try to create a test PO to see what columns are required
    console.log('\nAttempting test insert to discover schema...');
    const { error: insertError } = await supabase
      .from('purchase_orders')
      .insert({
        vendor_id: 'cd2e1122-d511-4edb-be5d-98ef274b4baf',
        po_type: 'inbound'
      })
      .select();

    if (insertError) {
      console.log('Insert error (this helps us see required fields):', insertError.message);
    }
  }
}

checkSchema();
