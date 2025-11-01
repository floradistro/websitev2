import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const CHARLOTTE_CENTRAL_ID = 'c4eedafb-4050-4d2d-a6af-e164aad5d934';
const FLORA_DISTRO_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

async function fixRegisters() {
  console.log('🔍 Checking all registers...\n');

  // Check if REG-CHA-001 exists anywhere
  const { data: reg001Check } = await supabase
    .from('pos_registers')
    .select('*')
    .eq('register_number', 'REG-CHA-001')
    .single();

  if (reg001Check) {
    console.log('📍 Found REG-CHA-001:');
    console.log(`   Location: ${reg001Check.location_id}`);
    console.log(`   Name: ${reg001Check.register_name}`);

    if (reg001Check.location_id !== CHARLOTTE_CENTRAL_ID) {
      console.log('   ⚠️  Wrong location! Deleting...');
      await supabase
        .from('pos_registers')
        .delete()
        .eq('id', reg001Check.id);
      console.log('   ✅ Deleted');
    }
  }

  // Now create all 3 registers for Charlotte Central
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

  console.log('\n➕ Ensuring all 3 registers exist...\n');

  for (const register of registers) {
    // Check if exists
    const { data: existing } = await supabase
      .from('pos_registers')
      .select('id')
      .eq('location_id', CHARLOTTE_CENTRAL_ID)
      .eq('register_number', register.register_number)
      .single();

    if (existing) {
      console.log(`✅ ${register.register_number} already exists`);
    } else {
      const { error } = await supabase
        .from('pos_registers')
        .insert([register]);

      if (error) {
        console.error(`❌ Error creating ${register.register_number}:`, error.message);
      } else {
        console.log(`✅ Created ${register.register_number}`);
      }
    }
  }

  // Final check
  const { data: final } = await supabase
    .from('pos_registers')
    .select('*')
    .eq('location_id', CHARLOTTE_CENTRAL_ID)
    .order('register_number');

  console.log(`\n✅ Final count: ${final.length} registers`);
  console.log('\n📋 Charlotte Central Registers:');
  final.forEach(reg => {
    console.log(`   ${reg.register_number}: ${reg.register_name}`);
    console.log(`      Device: ${reg.device_name}`);
    console.log(`      Assigned: ${reg.device_id ? 'Yes' : 'No'}`);
  });
}

fixRegisters()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
