import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkVapeTiers() {
  console.log('🔍 Checking actual VAPE pricing blueprint tiers...\n');

  // Get vendor ID from recent menu
  const { data: menus } = await supabase
    .from('tv_menus')
    .select('vendor_id')
    .order('updated_at', { ascending: false })
    .limit(1);

  const vendorId = menus?.[0]?.vendor_id;
  console.log('📺 Vendor ID:', vendorId, '\n');

  // Get VAPE products with pricing
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      primary_category:categories!products_primary_category_id_fkey(name),
      product_pricing_assignments(
        pricing_tier_blueprints(
          id,
          name,
          price_breaks
        )
      )
    `)
    .eq('vendor_id', vendorId)
    .limit(100);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  // Show all categories
  const allCategories = [...new Set(products?.map(p => p.primary_category?.name).filter(Boolean))];
  console.log('📂 All categories found:', allCategories, '\n');

  const vapeProducts = products?.filter(p =>
    p.primary_category?.name?.toLowerCase().includes('vape')
  );

  console.log(`Found ${vapeProducts?.length || 0} VAPE products\n`);

  if (!vapeProducts || vapeProducts.length === 0) {
    console.log('❌ No VAPE products found with category containing "vape"');

    // Try exact match with what we saw in the UI
    const vapeExact = products?.filter(p => p.primary_category?.name === 'VAPE');
    console.log(`\nTrying exact match "VAPE": ${vapeExact?.length || 0} products`);

    if (vapeExact && vapeExact.length > 0) {
      vapeProducts.push(...vapeExact);
    } else {
      return;
    }
  }

  // Get unique blueprints used by VAPE products
  const blueprints = new Map();

  vapeProducts.forEach(product => {
    const assignments = product.product_pricing_assignments || [];
    assignments.forEach(assignment => {
      const blueprint = assignment.pricing_tier_blueprints;
      if (blueprint) {
        blueprints.set(blueprint.id, blueprint);
      }
    });
  });

  console.log(`📋 Found ${blueprints.size} unique pricing blueprint(s) for VAPE:\n`);

  blueprints.forEach(blueprint => {
    console.log(`Blueprint: "${blueprint.name}"`);
    console.log(`ID: ${blueprint.id}`);
    console.log(`Price Breaks:`, JSON.stringify(blueprint.price_breaks, null, 2));

    if (blueprint.price_breaks) {
      const tierNames = blueprint.price_breaks.map(pb => pb.break_id);
      console.log(`\n✅ Available Tier Names (break_ids):`, tierNames);
    }
    console.log('\n' + '='.repeat(60) + '\n');
  });
}

checkVapeTiers();
