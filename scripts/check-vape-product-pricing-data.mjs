import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkVapePricingData() {
  console.log('🔍 Checking VAPE product actual pricing data...\n');

  // Get vendor ID
  const { data: menus } = await supabase
    .from('tv_menus')
    .select('vendor_id')
    .order('updated_at', { ascending: false })
    .limit(1);

  const vendorId = menus?.[0]?.vendor_id;
  console.log('📺 Vendor ID:', vendorId, '\n');

  // Get VAPE products with ALL pricing data
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      primary_category:categories!products_primary_category_id_fkey(name),
      product_pricing_assignments(
        id,
        pricing_tier_blueprints(
          id,
          name,
          price_breaks
        ),
        price_overrides
      )
    `)
    .eq('vendor_id', vendorId)
    .limit(20);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  // Filter for VAPE products
  const vapeProducts = products?.filter(p =>
    p.primary_category?.name?.toLowerCase().includes('vape')
  ) || [];

  console.log(`📦 Found ${vapeProducts.length} VAPE products\n`);

  for (const product of vapeProducts.slice(0, 5)) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Product: ${product.name}`);
    console.log(`ID: ${product.id}`);

    const assignments = product.product_pricing_assignments || [];

    if (assignments.length === 0) {
      console.log('❌ NO PRICING ASSIGNMENTS');
      continue;
    }

    for (const assignment of assignments) {
      const blueprint = assignment.pricing_tier_blueprints;
      console.log(`\nBlueprint: ${blueprint.name}`);
      console.log(`Price Breaks:`, JSON.stringify(blueprint.price_breaks, null, 2));
      console.log(`Product Price Overrides:`, JSON.stringify(assignment.price_overrides, null, 2));
    }

    // Also get vendor pricing config for this blueprint
    const blueprintId = assignments[0]?.pricing_tier_blueprints?.id;
    if (blueprintId) {
      const { data: vendorPricing } = await supabase
        .from('vendor_pricing_configs')
        .select('pricing_values')
        .eq('vendor_id', vendorId)
        .eq('blueprint_id', blueprintId)
        .single();

      console.log(`\nVendor Pricing Config:`, JSON.stringify(vendorPricing?.pricing_values, null, 2));
    }
  }

  console.log(`\n${'='.repeat(80)}\n`);
}

checkVapePricingData();
