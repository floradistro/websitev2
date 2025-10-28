import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testDelete() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const vendorId = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

  // List all menus
  const { data: menus } = await supabase
    .from('tv_menus')
    .select('id, name')
    .eq('vendor_id', vendorId);

  console.log('\n📋 Current Menus:');
  menus?.forEach(m => console.log(`  - ${m.name} (${m.id})`));

  // Try to delete menu named "1" (one of the duplicates)
  const menuToDelete = menus?.find(m => m.name === '123');

  if (!menuToDelete) {
    console.log('\n❌ No menu named "123" found to test delete');
    return;
  }

  console.log(`\n🗑️ Testing delete of menu: ${menuToDelete.name}`);

  // First unassign from devices
  console.log('  Step 1: Unassigning from devices...');
  const { error: unassignError } = await supabase
    .from('tv_devices')
    .update({ active_menu_id: null })
    .eq('active_menu_id', menuToDelete.id);

  if (unassignError) {
    console.error('  ❌ Unassign failed:', unassignError);
    return;
  }
  console.log('  ✅ Unassigned from devices');

  // Delete menu
  console.log('  Step 2: Deleting menu...');
  const { error: deleteError } = await supabase
    .from('tv_menus')
    .delete()
    .eq('id', menuToDelete.id);

  if (deleteError) {
    console.error('  ❌ Delete failed:', deleteError);
    return;
  }

  console.log('  ✅ Menu deleted successfully!');

  // Verify
  const { data: remainingMenus } = await supabase
    .from('tv_menus')
    .select('id, name')
    .eq('vendor_id', vendorId);

  console.log('\n📋 Remaining Menus:');
  remainingMenus?.forEach(m => console.log(`  - ${m.name} (${m.id})`));
}

testDelete();
