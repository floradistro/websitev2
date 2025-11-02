import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixMenuVapeTiers() {
  console.log('🔧 Fixing menu VAPE tiers to show only tier 1...\n');

  // Get most recent menu
  const { data: menus } = await supabase
    .from('tv_menus')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1);

  const menu = menus[0];
  console.log('📺 Menu:', menu.name);
  console.log('ID:', menu.id);

  const configData = menu.config_data;

  // Update VAPE category pricing config to show only tier 1 (single price)
  const updatedCategoryPricingConfig = {
    ...configData.categoryPricingConfig,
    Vape: {
      available: ['1', '2', '3'],
      selected: ['1']  // Only select tier 1 for cleaner display
    }
  };

  // Update split view price breaks
  const updatedConfig = {
    ...configData,
    categoryPricingConfig: updatedCategoryPricingConfig,
    splitRightPriceBreaks: ['1']  // Only show tier 1
  };

  console.log('\n📝 Updated Vape config:');
  console.log('  Available: [1, 2, 3]');
  console.log('  Selected: [1] (single price for clarity)');
  console.log('  Split Right Price Breaks: [1]');
  console.log('  Will display: $29.99 only');

  // Save updated config
  const { error } = await supabase
    .from('tv_menus')
    .update({ config_data: updatedConfig })
    .eq('id', menu.id);

  if (error) {
    console.error('\n❌ Error updating menu:', error);
    return;
  }

  console.log('\n✅ Menu updated successfully!');
  console.log('   Refresh the TV display to see clean VAPE pricing.');
}

fixMenuVapeTiers();
