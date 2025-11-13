import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFunctionBody() {
  console.log('🔍 Checking receive_purchase_order_items function body...\n');

  // Get the function source code
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: `
      SELECT pg_get_functiondef(oid) as function_def
      FROM pg_proc
      WHERE proname = 'receive_purchase_order_items';
    `
  });

  if (error) {
    console.log('Error:', error);
    console.log('\nTrying direct query method...\n');

    // Try alternative method
    const { data: altData, error: altError } = await supabase
      .from('pg_proc')
      .select('prosrc')
      .eq('proname', 'receive_purchase_order_items')
      .single();

    if (altError) {
      console.log('Alt error:', altError);
    } else {
      console.log('Function source:', altData);
    }
  } else {
    console.log('Function definition:');
    console.log(data);
  }
}

checkFunctionBody();
