/**
 * Comprehensive TV System Test
 * Tests device registration, menu creation, and dashboard loading
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

const TEST_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
const TEST_LOCATION_ID = 'de082d7f-492f-456e-ad54-c019cc32885a';

async function test1_CheckRLSPolicies() {
  console.log('\n========================================');
  console.log('TEST 1: Checking RLS Policies');
  console.log('========================================\n');

  // Test tv_devices table
  console.log('📋 Testing tv_devices RLS...');

  // Try to read devices with anon client
  const { data: anonDevices, error: anonError } = await anonClient
    .from('tv_devices')
    .select('*')
    .eq('vendor_id', TEST_VENDOR_ID);

  console.log(`  Anon read: ${anonDevices?.length || 0} devices, error: ${anonError?.message || 'none'}`);

  // Try to read with service client
  const { data: serviceDevices, error: serviceError } = await serviceClient
    .from('tv_devices')
    .select('*')
    .eq('vendor_id', TEST_VENDOR_ID);

  console.log(`  Service read: ${serviceDevices?.length || 0} devices, error: ${serviceError?.message || 'none'}`);

  // Test tv_menus table
  console.log('\n📋 Testing tv_menus RLS...');

  const { data: anonMenus, error: anonMenuError } = await anonClient
    .from('tv_menus')
    .select('*')
    .eq('vendor_id', TEST_VENDOR_ID);

  console.log(`  Anon read: ${anonMenus?.length || 0} menus, error: ${anonMenuError?.message || 'none'}`);

  const { data: serviceMenus, error: serviceMenuError } = await serviceClient
    .from('tv_menus')
    .select('*')
    .eq('vendor_id', TEST_VENDOR_ID);

  console.log(`  Service read: ${serviceMenus?.length || 0} menus, error: ${serviceMenuError?.message || 'none'}`);

  return { anonDevices, serviceDevices, anonMenus, serviceMenus };
}

async function test2_DeviceRegistration() {
  console.log('\n========================================');
  console.log('TEST 2: Device Registration');
  console.log('========================================\n');

  const testDevice = {
    device_identifier: 'test-device-' + Date.now(),
    vendor_id: TEST_VENDOR_ID,
    location_id: null,
    tv_number: 999,
    device_name: 'Test TV 999',
    connection_status: 'online',
    last_seen_at: new Date().toISOString(),
    last_heartbeat_at: new Date().toISOString(),
    user_agent: 'Test Script',
    screen_resolution: '1920x1080',
    browser_info: { platform: 'test', language: 'en' }
  };

  console.log('📝 Attempting device registration with anon client...');
  const { data: device, error } = await anonClient
    .from('tv_devices')
    .insert(testDevice)
    .select()
    .single();

  if (error) {
    console.log(`  ❌ Error: ${error.message}`);
    console.log(`  Code: ${error.code}`);
    console.log(`  Details:`, error.details);
    return null;
  }

  console.log(`  ✅ Device registered successfully: ${device.id}`);
  return device;
}

async function test3_MenuCreation() {
  console.log('\n========================================');
  console.log('TEST 3: Menu Creation');
  console.log('========================================\n');

  const testMenu = {
    vendor_id: TEST_VENDOR_ID,
    location_id: null,
    name: 'Test Menu - ' + Date.now(),
    description: 'Created by test script',
    menu_type: 'product_menu',
    is_active: true,
    config_data: {
      backgroundColor: '#000000',
      fontColor: '#ffffff',
      headerTitleSize: 60,
      cardTitleSize: 18,
      priceSize: 32
    },
    subscription_status: 'active'
  };

  console.log('📝 Attempting menu creation with service client...');
  const { data: menu, error } = await serviceClient
    .from('tv_menus')
    .insert(testMenu)
    .select()
    .single();

  if (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return null;
  }

  console.log(`  ✅ Menu created successfully: ${menu.id}`);
  return menu;
}

async function test4_DashboardQuery() {
  console.log('\n========================================');
  console.log('TEST 4: Dashboard Query Simulation');
  console.log('========================================\n');

  console.log('📊 Simulating dashboard device query...');

  // Query exactly as the dashboard does
  let query = anonClient
    .from('tv_devices')
    .select('*')
    .eq('vendor_id', TEST_VENDOR_ID)
    .order('tv_number');

  const { data: devices, error } = await query;

  if (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return [];
  }

  console.log(`  ✅ Query successful: ${devices.length} devices found`);
  devices.forEach(d => {
    console.log(`     - TV ${d.tv_number}: ${d.device_name} (${d.connection_status})`);
    console.log(`       Location: ${d.location_id || 'null'}`);
  });

  return devices;
}

async function test5_MenuAssignment() {
  console.log('\n========================================');
  console.log('TEST 5: Menu Assignment');
  console.log('========================================\n');

  // Get a device and a menu
  const { data: devices } = await serviceClient
    .from('tv_devices')
    .select('*')
    .eq('vendor_id', TEST_VENDOR_ID)
    .limit(1);

  const { data: menus } = await serviceClient
    .from('tv_menus')
    .select('*')
    .eq('vendor_id', TEST_VENDOR_ID)
    .limit(1);

  if (!devices || devices.length === 0) {
    console.log('  ⚠️ No devices found to test assignment');
    return;
  }

  if (!menus || menus.length === 0) {
    console.log('  ⚠️ No menus found to test assignment');
    return;
  }

  const device = devices[0];
  const menu = menus[0];

  console.log(`📝 Assigning menu "${menu.name}" to device "${device.device_name}"...`);

  const { error } = await anonClient
    .from('tv_devices')
    .update({ active_menu_id: menu.id })
    .eq('id', device.id);

  if (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return;
  }

  console.log(`  ✅ Menu assigned successfully`);

  // Verify
  const { data: updated } = await anonClient
    .from('tv_devices')
    .select('*')
    .eq('id', device.id)
    .single();

  console.log(`  ✓ Verification: active_menu_id = ${updated?.active_menu_id}`);
}

async function cleanup() {
  console.log('\n========================================');
  console.log('CLEANUP: Removing Test Data');
  console.log('========================================\n');

  // Remove test devices
  const { error: devError } = await serviceClient
    .from('tv_devices')
    .delete()
    .eq('vendor_id', TEST_VENDOR_ID)
    .eq('tv_number', 999);

  if (!devError) {
    console.log('✅ Cleaned up test devices');
  }

  // Remove test menus
  const { error: menuError } = await serviceClient
    .from('tv_menus')
    .delete()
    .eq('vendor_id', TEST_VENDOR_ID)
    .like('name', 'Test Menu -%');

  if (!menuError) {
    console.log('✅ Cleaned up test menus');
  }
}

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   TV SYSTEM COMPREHENSIVE TEST SUITE   ║');
  console.log('╚════════════════════════════════════════╝');

  try {
    await test1_CheckRLSPolicies();
    await test2_DeviceRegistration();
    await test3_MenuCreation();
    await test4_DashboardQuery();
    await test5_MenuAssignment();
    await cleanup();

    console.log('\n========================================');
    console.log('✅ ALL TESTS COMPLETED');
    console.log('========================================\n');
  } catch (error: any) {
    console.error('\n❌ TEST SUITE FAILED:', error.message);
    process.exit(1);
  }
}

runAllTests()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
