import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CHARLOTTE_CENTRAL_ID = 'c4eedafb-4050-4d2d-a6af-e164aad5d934';
const FLORA_DISTRO_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

async function checkRegisters() {
  console.log('🔍 Checking POS registers...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}\n`);

  // Check Charlotte Central location exists
  const { data: location, error: locError } = await supabase
    .from('locations')
    .select('id, name, slug')
    .eq('id', CHARLOTTE_CENTRAL_ID)
    .single();

  if (locError || !location) {
    console.error('❌ Charlotte Central location not found!');
    console.error('Error:', locError);
    return;
  }

  console.log('✅ Location found:', location.name, `(${location.slug})`);

  // Check registers
  const { data: registers, error: regError } = await supabase
    .from('pos_registers')
    .select('*')
    .eq('location_id', CHARLOTTE_CENTRAL_ID)
    .order('register_number');

  if (regError) {
    console.error('❌ Error fetching registers:', regError);
    return;
  }

  console.log(`\n📊 Found ${registers.length} registers for Charlotte Central:\n`);

  if (registers.length > 0) {
    registers.forEach(reg => {
      console.log(`   ${reg.register_number}: ${reg.register_name}`);
      console.log(`      Device: ${reg.device_name}`);
      console.log(`      Status: ${reg.status}`);
      console.log(`      ID: ${reg.id}`);
      console.log('');
    });
  } else {
    console.log('   ⚠️  No registers found!\n');
  }

  // Check if we can query via API endpoint pattern
  console.log('🧪 Testing register query (simulating API call)...\n');
  const { data: apiTest, error: apiError } = await supabase
    .from('pos_registers')
    .select('*')
    .eq('location_id', CHARLOTTE_CENTRAL_ID)
    .eq('status', 'active')
    .order('register_number');

  if (apiError) {
    console.error('❌ API-style query failed:', apiError);
  } else {
    console.log(`✅ API-style query returned ${apiTest.length} active registers`);
  }

  return registers;
}

checkRegisters()
  .then(() => {
    console.log('\n✅ Check complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
