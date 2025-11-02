import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CHARLOTTE_CENTRAL_ID = 'c4eedafb-4050-4d2d-a6af-e164aad5d934';
const FLORA_DISTRO_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

async function checkProductionRegisters() {
  console.log('🔍 Checking production register configuration...\n');

  // 1. Check if Charlotte Central location exists
  console.log('1️⃣ Checking Charlotte Central location...');
  const { data: location, error: locationError } = await supabase
    .from('locations')
    .select('*')
    .eq('id', CHARLOTTE_CENTRAL_ID)
    .maybeSingle();

  if (locationError) {
    console.error('❌ Error fetching location:', locationError);
  } else if (!location) {
    console.error('❌ Charlotte Central location NOT FOUND');
    console.log('   Location ID:', CHARLOTTE_CENTRAL_ID);
    console.log('\n📋 Available locations:');
    const { data: allLocations } = await supabase
      .from('locations')
      .select('id, name, vendor_id');
    console.table(allLocations);
  } else {
    console.log('✅ Location found:', location.name);
    console.log('   ID:', location.id);
    console.log('   Vendor:', location.vendor_id);
  }

  console.log('\n2️⃣ Checking registers for Charlotte Central...');
  const { data: registers, error: registersError } = await supabase
    .from('pos_registers')
    .select('*')
    .eq('location_id', CHARLOTTE_CENTRAL_ID)
    .order('register_number');

  if (registersError) {
    console.error('❌ Error fetching registers:', registersError);
  } else if (!registers || registers.length === 0) {
    console.error('❌ NO REGISTERS FOUND for Charlotte Central');
    console.log('\n📋 All registers in database:');
    const { data: allRegisters } = await supabase
      .from('pos_registers')
      .select('id, register_number, register_name, location_id, status');
    if (allRegisters && allRegisters.length > 0) {
      console.table(allRegisters);
    } else {
      console.log('   No registers exist in the database at all!');
    }
  } else {
    console.log(`✅ Found ${registers.length} register(s):`);
    console.table(registers.map(r => ({
      number: r.register_number,
      name: r.register_name,
      device: r.device_name,
      status: r.status,
      id: r.id.slice(0, 8) + '...'
    })));
  }

  // 3. Check active sessions
  console.log('\n3️⃣ Checking active sessions...');
  const { data: sessions } = await supabase
    .from('pos_sessions')
    .select(`
      id,
      session_number,
      status,
      register_id,
      pos_registers(register_number, register_name)
    `)
    .eq('status', 'open');

  if (sessions && sessions.length > 0) {
    console.log(`✅ Found ${sessions.length} active session(s):`);
    console.table(sessions.map(s => ({
      session: s.session_number,
      status: s.status,
      register: s.pos_registers?.register_number,
      id: s.id.slice(0, 8) + '...'
    })));
  } else {
    console.log('   No active sessions');
  }

  // 4. Test API endpoint (simulate what browser does)
  console.log('\n4️⃣ Testing API endpoint simulation...');
  const apiUrl = `/api/pos/registers?locationId=${CHARLOTTE_CENTRAL_ID}`;
  console.log('   API would be called with:', apiUrl);
  console.log('   This matches the code in POSRegisterSelector.tsx line 53');

  // 5. Environment check
  console.log('\n5️⃣ Environment configuration:');
  console.log('   Supabase URL:', supabaseUrl);
  console.log('   Service key exists:', !!supabaseServiceKey);
  console.log('   Service key length:', supabaseServiceKey?.length);

  console.log('\n' + '='.repeat(60));
  console.log('💡 DIAGNOSIS:');
  console.log('='.repeat(60));

  if (!location) {
    console.log('❌ ISSUE: Charlotte Central location does not exist');
    console.log('   FIX: Create the location or update the hardcoded location ID');
  } else if (!registers || registers.length === 0) {
    console.log('❌ ISSUE: No registers exist for Charlotte Central');
    console.log('   FIX: Create registers using the POST /api/pos/registers endpoint');
    console.log('   OR: Run the script to create default registers');
  } else {
    console.log('✅ Everything looks correct in the database');
    console.log('   The issue might be:');
    console.log('   1. Environment variables not set in production (Vercel)');
    console.log('   2. API route not accessible in production');
    console.log('   3. CORS or network issues');
    console.log('   4. Production build issue');
  }

  console.log('\n💡 NEXT STEPS:');
  console.log('   1. Check Vercel environment variables');
  console.log('   2. Check Vercel deployment logs');
  console.log('   3. Test production API endpoint directly');
  console.log('   4. Check browser console on production for errors\n');
}

checkProductionRegisters().catch(console.error);
