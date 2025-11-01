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

async function createDefaultRegisters() {
  console.log('🖥️  Creating default registers for Charlotte Central...\n');

  const registers = [
    {
      location_id: CHARLOTTE_CENTRAL_ID,
      vendor_id: FLORA_DISTRO_VENDOR_ID,
      register_number: 'REG-CHA-001',
      register_name: 'Register 1 - Charlotte Central',
      device_name: 'iPad #1',
      status: 'active',
      allow_cash: true,
      allow_card: true,
      allow_refunds: true,
      allow_voids: true,
    },
    {
      location_id: CHARLOTTE_CENTRAL_ID,
      vendor_id: FLORA_DISTRO_VENDOR_ID,
      register_number: 'REG-CHA-002',
      register_name: 'Register 2 - Charlotte Central',
      device_name: 'iPad #2',
      status: 'active',
      allow_cash: true,
      allow_card: true,
      allow_refunds: true,
      allow_voids: true,
    },
    {
      location_id: CHARLOTTE_CENTRAL_ID,
      vendor_id: FLORA_DISTRO_VENDOR_ID,
      register_number: 'REG-CHA-003',
      register_name: 'Register 3 - Charlotte Central',
      device_name: 'iPad #3',
      status: 'active',
      allow_cash: true,
      allow_card: true,
      allow_refunds: true,
      allow_voids: true,
    },
  ];

  // First, check existing registers
  const { data: existing, error: fetchError } = await supabase
    .from('pos_registers')
    .select('register_number')
    .eq('location_id', CHARLOTTE_CENTRAL_ID);

  if (fetchError) {
    console.error('❌ Error fetching existing registers:', fetchError);
    return;
  }

  console.log(`📊 Found ${existing.length} existing registers`);

  const existingNumbers = new Set(existing.map(r => r.register_number));
  const newRegisters = registers.filter(r => !existingNumbers.has(r.register_number));

  if (newRegisters.length === 0) {
    console.log('✅ All 3 registers already exist!');

    // List them
    const { data: allRegisters } = await supabase
      .from('pos_registers')
      .select('*')
      .eq('location_id', CHARLOTTE_CENTRAL_ID)
      .order('register_number');

    console.log('\n📋 Charlotte Central Registers:');
    allRegisters.forEach(reg => {
      console.log(`   ${reg.register_number}: ${reg.register_name} (${reg.device_name})`);
    });
    return;
  }

  // Insert new registers
  console.log(`\n➕ Creating ${newRegisters.length} new registers...`);

  for (const register of newRegisters) {
    const { data, error } = await supabase
      .from('pos_registers')
      .insert([register])
      .select();

    if (error) {
      console.error(`❌ Error creating ${register.register_number}:`, error.message);
    } else {
      console.log(`✅ Created ${register.register_number}: ${register.register_name}`);
    }
  }

  // Verify final count
  const { data: final, count } = await supabase
    .from('pos_registers')
    .select('*', { count: 'exact' })
    .eq('location_id', CHARLOTTE_CENTRAL_ID)
    .order('register_number');

  console.log(`\n✅ Total registers: ${count}`);
  console.log('\n📋 Charlotte Central Registers:');
  final.forEach(reg => {
    console.log(`   ${reg.register_number}: ${reg.register_name} (${reg.device_name})`);
    console.log(`      Status: ${reg.status}, Device ID: ${reg.device_id || 'Not assigned'}`);
  });
}

createDefaultRegisters()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
