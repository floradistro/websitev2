import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkMenus() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('\n📺 TV Devices and Menu Assignments:\n');

  const { data: devices } = await supabase
    .from('tv_devices')
    .select('tv_number, device_name, active_menu_id, connection_status')
    .eq('vendor_id', 'cd2e1122-d511-4edb-be5d-98ef274b4baf')
    .order('tv_number');

  const { data: menus } = await supabase
    .from('tv_menus')
    .select('id, name')
    .eq('vendor_id', 'cd2e1122-d511-4edb-be5d-98ef274b4baf');

  devices?.forEach(device => {
    console.log(`TV ${device.tv_number} (${device.device_name}):`);
    console.log(`  Status: ${device.connection_status}`);
    console.log(`  Active Menu ID: ${device.active_menu_id || 'NULL'}`);

    if (device.active_menu_id) {
      const menu = menus?.find(m => m.id === device.active_menu_id);
      console.log(`  Menu Name: ${menu?.name || 'UNKNOWN MENU'}`);
    }
    console.log('');
  });

  console.log('\n📋 All Menus:\n');
  menus?.forEach(menu => {
    console.log(`  - ${menu.name} (ID: ${menu.id})`);
  });
}

checkMenus();
