/**
 * Verify TV Dashboard State
 * Checks exactly what the dashboard should be seeing
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const anonClient = createClient(supabaseUrl, supabaseAnonKey);

const VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

async function verifyDashboardState() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   TV DASHBOARD STATE VERIFICATION   ║');
  console.log('╚══════════════════════════════════════╝\n');

  // 1. Check locations
  console.log('1️⃣  LOCATIONS');
  console.log('─'.repeat(40));

  const locResponse = await fetch(`http://localhost:3000/api/vendor/locations?vendor_id=${VENDOR_ID}`);
  const locData = await locResponse.json();

  console.log(`   API Response: ${locData.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`   Locations found: ${locData.locations?.length || 0}`);

  if (locData.locations) {
    locData.locations.forEach((loc: any, i: number) => {
      console.log(`   ${i + 1}. ${loc.name} (${loc.id.substring(0, 8)}...)`);
    });
  }

  // 2. Check devices with NULL location filter (simulating "All Locations")
  console.log('\n2️⃣  DEVICES (All Locations - selectedLocation = null)');
  console.log('─'.repeat(40));

  let query = anonClient
    .from('tv_devices')
    .select('*')
    .eq('vendor_id', VENDOR_ID)
    .order('tv_number');

  // Don't filter by location when selectedLocation is null

  const { data: allDevices, error: allError } = await query;

  if (allError) {
    console.log(`   ❌ Error: ${allError.message}`);
  } else {
    console.log(`   ✅ Query successful: ${allDevices.length} devices`);
    allDevices.forEach((d: any) => {
      const locName = locData.locations?.find((l: any) => l.id === d.location_id)?.name || 'null';
      console.log(`   - TV ${d.tv_number}: ${d.device_name}`);
      console.log(`     Status: ${d.connection_status}`);
      console.log(`     Location: ${locName} (${d.location_id?.substring(0, 8) || 'null'}...)`);
      console.log(`     Menu: ${d.active_menu_id ? d.active_menu_id.substring(0, 8) + '...' : 'none'}`);
    });
  }

  // 3. Check devices with Charlotte Central filter
  console.log('\n3️⃣  DEVICES (Charlotte Central filtered)');
  console.log('─'.repeat(40));

  const charlotteCentral = locData.locations?.find((l: any) => l.name === 'Charlotte Central');

  if (charlotteCentral) {
    const { data: filtered, error: filteredError } = await anonClient
      .from('tv_devices')
      .select('*')
      .eq('vendor_id', VENDOR_ID)
      .eq('location_id', charlotteCentral.id)
      .order('tv_number');

    if (filteredError) {
      console.log(`   ❌ Error: ${filteredError.message}`);
    } else {
      console.log(`   ✅ Query successful: ${filtered.length} devices`);
      if (filtered.length === 0) {
        console.log(`   ⚠️ No devices at Charlotte Central`);
        console.log(`   💡 This is why dashboard shows "No displays yet" when Charlotte Central is selected`);
      }
    }
  }

  // 4. Check menus
  console.log('\n4️⃣  MENUS');
  console.log('─'.repeat(40));

  const menuResponse = await fetch(`http://localhost:3000/api/vendor/tv-menus?vendor_id=${VENDOR_ID}`);
  const menuData = await menuResponse.json();

  console.log(`   API Response: ${menuData.success ? '✅ Success' : '❌ Failed'}`);
  console.log(`   Menus found: ${menuData.menus?.length || 0}`);

  if (menuData.menus) {
    menuData.menus.forEach((m: any, i: number) => {
      const locName = locData.locations?.find((l: any) => l.id === m.location_id)?.name || 'Global (all locations)';
      console.log(`   ${i + 1}. ${m.name}`);
      console.log(`      Location: ${locName}`);
      console.log(`      Active: ${m.is_active ? 'Yes' : 'No'}`);
    });
  }

  // 5. Summary
  console.log('\n5️⃣  SUMMARY');
  console.log('─'.repeat(40));
  console.log(`   Total Devices: ${allDevices?.length || 0}`);
  console.log(`   Online Devices: ${allDevices?.filter((d: any) => d.connection_status === 'online').length || 0}`);
  console.log(`   Total Menus: ${menuData.menus?.length || 0}`);
  console.log(`   Active Menus: ${menuData.menus?.filter((m: any) => m.is_active).length || 0}`);

  // 6. What dashboard should show
  console.log('\n6️⃣  EXPECTED DASHBOARD STATE');
  console.log('─'.repeat(40));
  console.log(`   Header should say: "${allDevices?.filter((d: any) => d.connection_status === 'online').length || 0} of ${allDevices?.length || 0} displays online • ${menuData.menus?.length || 0} menus"`);
  console.log(`   Location selector default: "All Locations" (value="")`);
  console.log(`   Display cards visible: ${allDevices?.length || 0}`);
  console.log(`   Menus in dropdowns: ${menuData.menus?.length || 0}`);

  // 7. Troubleshooting
  if (allDevices?.length === 0) {
    console.log('\n⚠️  ISSUE: No devices found');
    console.log('   Solution: Open /tv-display?vendor_id=...&tv_number=1 to register a device');
  }

  if (menuData.menus?.length === 0) {
    console.log('\n⚠️  ISSUE: No menus found');
    console.log('   Solution: Click "New Menu" button to create a menu');
  }

  console.log('\n✅ Verification complete!\n');
}

verifyDashboardState()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });
