import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkVapeProductPricing() {
  console.log('🔍 Checking VAPE product pricing assignments...\n');

  // Get recent menu
  const { data: menus } = await supabase
    .from('tv_menus')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1);

  const menu = menus[0];
  const vendorId = menu.vendor_id;

  console.log('📺 Vendor ID:', vendorId);

  // Get VAPE products using the same query as TV display
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      vendor_id,
      primary_category:categories!products_primary_category_id_fkey(id, name),
      product_pricing_assignments(
        id,
        pricing_blueprint_id,
        pricing_blueprints(
          id,
          name,
          custom_fields
        )
      )
    `)
    .eq('vendor_id', vendorId)
    .limit(100);

  if (error) {
    console.error('❌ Error fetching products:', error);
    return;
  }

  // Filter for VAPE products
  const vapeProducts = products?.filter(p =>
    p.primary_category?.name?.toLowerCase().includes('vape')
  ) || [];

  console.log(`\n📦 Found ${vapeProducts.length} VAPE products (out of ${products.length} total)\n`);

  if (vapeProducts.length === 0) {
    console.log('❌ No VAPE products found');

    // Show available categories
    const uniqueCategories = [...new Set(products.map(p => p.primary_category?.name).filter(Boolean))];
    console.log('\n📂 Available categories:', uniqueCategories);
    return;
  }

  console.log('📂 VAPE Category:', vapeProducts[0].primary_category.name);

  // Check pricing assignments
  let withPricing = 0;
  let withoutPricing = 0;

  vapeProducts.slice(0, 10).forEach(product => {
    const hasAssignment = product.product_pricing_assignments && product.product_pricing_assignments.length > 0;
    if (hasAssignment) {
      withPricing++;
      console.log(`✅ ${product.name}`);
      console.log(`   Blueprint: ${product.product_pricing_assignments[0].pricing_blueprints.name}`);
      console.log(`   Blueprint fields:`, product.product_pricing_assignments[0].pricing_blueprints.custom_fields);
    } else {
      withoutPricing++;
      console.log(`❌ ${product.name}`);
      console.log(`   No pricing assignment`);
    }
  });

  console.log(`\n📊 Summary (showing first 10):`);
  console.log(`   With pricing: ${withPricing}/10`);
  console.log(`   Without pricing: ${withoutPricing}/10`);
  console.log(`   Total VAPE products: ${vapeProducts.length}`);

  if (withoutPricing > 0) {
    console.log('\n⚠️  Some VAPE products are missing pricing assignments!');
    console.log('   Run the pricing assignment script to assign pricing.');
  }
}

checkVapeProductPricing();
