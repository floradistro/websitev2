import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkVapePricing() {
  console.log('🔍 Checking VAPE category pricing configuration...\n');

  // Get recent menu with split view config
  const { data: menus, error: menuError } = await supabase
    .from('tv_menus')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(5);

  if (menuError) {
    console.error('❌ Error fetching menus:', menuError);
    return;
  }

  if (!menus || menus.length === 0) {
    console.error('❌ No menus found');
    return;
  }

  // Find menu with CONCENTRATES/VAPE split
  const menu = menus.find(m =>
    m.config_data?.splitLeftCategory === 'CONCENTRATES' &&
    m.config_data?.splitRightCategory === 'VAPE'
  ) || menus[0];

  console.log('📺 Menu:', menu.name);
  console.log('📋 Config data:', JSON.stringify(menu.config_data, null, 2));

  // Check category pricing config
  const categoryPricingConfig = menu.config_data?.categoryPricingConfig || {};
  console.log('\n💰 Category Pricing Config:');
  console.log(JSON.stringify(categoryPricingConfig, null, 2));

  if (categoryPricingConfig['VAPE']) {
    console.log('\n✅ VAPE has pricing config:', categoryPricingConfig['VAPE']);
  } else {
    console.log('\n❌ VAPE does NOT have pricing config');
  }

  // Get some VAPE products by custom_fields category
  const { data: vapeProducts, error: vapeError} = await supabase
    .from('products')
    .select('id, name, pricing_tiers, custom_fields')
    .eq('vendor_id', menu.vendor_id)
    .limit(100);

  if (vapeError) {
    console.error('❌ Error fetching VAPE products:', vapeError);
    return;
  }

  // Filter for VAPE products
  const vapeOnly = vapeProducts.filter(p => {
    const cat = p.custom_fields?.category;
    return cat && cat.toLowerCase().includes('vape');
  });

  console.log(`\n📦 Found ${vapeOnly.length} VAPE Products (out of ${vapeProducts.length} total)`);

  // Get unique category names
  const uniqueCategories = [...new Set(vapeProducts.map(p => p.custom_fields?.category).filter(Boolean))];
  console.log('\n📂 All category names found:', uniqueCategories);

  console.log('\n📦 Sample VAPE Products:');
  vapeOnly.slice(0, 5).forEach(product => {
    console.log(`\n  ${product.name}`);
    console.log(`  Category:`, product.custom_fields?.category);
    console.log(`  Pricing tiers:`, product.pricing_tiers ? JSON.stringify(product.pricing_tiers, null, 2) : 'NONE');
  });
}

checkVapePricing();
