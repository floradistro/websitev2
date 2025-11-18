const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('Checking processor: dd0f8648-5cf9-41a2-b3cf-7ebbd6ffb57c (TEST)');

  const { data, error } = await supabase
    .from('payment_processors')
    .select('id, processor_name, dejavoo_authkey, dejavoo_tpn, is_active')
    .eq('id', 'dd0f8648-5cf9-41a2-b3cf-7ebbd6ffb57c')
    .single();

  if (error) {
    console.log('ERROR:', error.message);
  } else {
    console.log('Processor name:', data.processor_name);
    console.log('Is active:', data.is_active);
    console.log('Has authkey:', !!data.dejavoo_authkey);
    console.log('Authkey length:', data.dejavoo_authkey?.length || 0);
    console.log('Has TPN:', !!data.dejavoo_tpn);
    console.log('TPN value:', data.dejavoo_tpn || 'NULL');
  }

  console.log('\nChecking processor: 8acc43df-9ef1-4dce-b53b-bea6a2544977 (used by POS)');

  const { data: data2, error: error2 } = await supabase
    .from('payment_processors')
    .select('id, processor_name, dejavoo_authkey, dejavoo_tpn, is_active')
    .eq('id', '8acc43df-9ef1-4dce-b53b-bea6a2544977')
    .single();

  if (error2) {
    console.log('ERROR:', error2.message);
  } else {
    console.log('Processor name:', data2.processor_name);
    console.log('Is active:', data2.is_active);
    console.log('Has authkey:', !!data2.dejavoo_authkey);
    console.log('Authkey length:', data2.dejavoo_authkey?.length || 0);
    console.log('Has TPN:', !!data2.dejavoo_tpn);
    console.log('TPN value:', data2.dejavoo_tpn || 'NULL');
  }

  process.exit(0);
})();
