import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMenuConfig() {
  console.log('🔍 Checking menu configuration...\n');

  // Get most recent menu
  const { data: menus, error } = await supabase
    .from('tv_menus')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  const menu = menus[0];
  console.log('📺 Menu:', menu.name);
  console.log('ID:', menu.id);
  console.log('\nConfig Data:', JSON.stringify(menu.config_data, null, 2));

  // Check categoryPricingConfig specifically
  const categoryPricingConfig = menu.config_data?.categoryPricingConfig || {};
  console.log('\n📋 Category Pricing Config:');

  Object.keys(categoryPricingConfig).forEach(category => {
    const config = categoryPricingConfig[category];
    console.log(`\n${category}:`);
    console.log(`  Available: [${config.available?.join(', ')}]`);
    console.log(`  Selected: [${config.selected?.join(', ')}]`);
  });

  // Check split view config
  console.log('\n📱 Split View Config:');
  console.log('  Layout Style:', menu.config_data?.layoutStyle);
  console.log('  Split Left Category:', menu.config_data?.splitLeftCategory);
  console.log('  Split Right Category:', menu.config_data?.splitRightCategory);
}

checkMenuConfig();
