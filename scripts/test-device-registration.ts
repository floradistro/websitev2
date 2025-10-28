/**
 * Test Device Registration
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Use anon key (like browser would)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRegistration() {
  console.log('🧪 Testing device registration...\n');

  const testDevice = {
    device_identifier: 'test-device-' + Date.now(),
    vendor_id: 'cd2e1122-d511-4edb-be5d-98ef274b4baf',
    location_id: 'de082d7f-492f-456e-ad54-c019cc32885a',
    tv_number: 99,
    device_name: 'Test TV 99',
    connection_status: 'online',
    last_seen_at: new Date().toISOString(),
    last_heartbeat_at: new Date().toISOString(),
    user_agent: 'Test Browser',
    screen_resolution: '1920x1080',
    browser_info: {
      platform: 'test',
      language: 'en'
    }
  };

  console.log('📝 Test device data:', JSON.stringify(testDevice, null, 2));
  console.log('\n🔄 Attempting upsert...\n');

  const { data, error } = await supabase
    .from('tv_devices')
    .upsert(testDevice, {
      onConflict: 'device_identifier'
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error:', error);
    console.error('\n📋 Error details:');
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);
    console.error('   Details:', error.details);
    console.error('   Hint:', error.hint);
    process.exit(1);
  }

  console.log('✅ Device registered successfully!');
  console.log('\n📊 Registered device:', JSON.stringify(data, null, 2));

  // Clean up test device
  console.log('\n🗑️  Cleaning up test device...');
  await supabase.from('tv_devices').delete().eq('id', data.id);
  console.log('✅ Test device deleted');
}

testRegistration()
  .then(() => {
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
