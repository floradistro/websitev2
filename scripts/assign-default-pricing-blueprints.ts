/**
 * Auto-assign default pricing blueprints to all products
 * that don't have pricing tier assignments yet
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyOTY0Mjk1MywiZXhwIjoyMDQ1MjE4OTUzfQ.uLaYErg6YNag1a2xZRME49Wj3bBJx9yt6qACOsCjgds';

const supabase = createClient(supabaseUrl, supabaseKey);

async function assignDefaultPricingBlueprints() {
  console.log('🔵 Starting auto-assignment of default pricing blueprints...\n');

  // 1. Get the default pricing blueprint
  const { data: defaultBlueprint, error: blueprintError } = await supabase
    .from('pricing_tier_blueprints')
    .select('id, name, slug')
    .eq('is_default', true)
    .eq('is_active', true)
    .single();

  if (blueprintError || !defaultBlueprint) {
    console.error('❌ No default pricing blueprint found');
    console.log('Creating default blueprint...');

    // Create a default blueprint if it doesn't exist
    const { data: newBlueprint, error: createError } = await supabase
      .from('pricing_tier_blueprints')
      .insert({
        name: 'Retail Cannabis Flower',
        slug: 'retail-flower',
        description: 'Standard weight-based pricing for flower products',
        tier_type: 'weight',
        price_breaks: [
          {"break_id": "1g", "label": "1 gram", "qty": 1, "unit": "g", "sort_order": 1},
          {"break_id": "3_5g", "label": "Eighth (3.5g)", "qty": 3.5, "unit": "g", "sort_order": 2},
          {"break_id": "7g", "label": "Quarter (7g)", "qty": 7, "unit": "g", "sort_order": 3},
          {"break_id": "14g", "label": "Half Ounce (14g)", "qty": 14, "unit": "g", "sort_order": 4},
          {"break_id": "28g", "label": "Ounce (28g)", "qty": 28, "unit": "g", "sort_order": 5}
        ],
        is_default: true,
        is_active: true
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create default blueprint:', createError);
      return;
    }

    console.log('✅ Created default blueprint:', newBlueprint.name);
  }

  const blueprintId = defaultBlueprint?.id;
  console.log(`✅ Using blueprint: "${defaultBlueprint?.name}" (${defaultBlueprint?.slug})\n`);

  // 2. Get all products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, vendor_id, status');

  if (productsError) {
    console.error('❌ Error fetching products:', productsError);
    return;
  }

  console.log(`📦 Found ${products?.length || 0} products\n`);

  if (!products || products.length === 0) {
    console.log('No products to process');
    return;
  }

  // 3. Check which products already have assignments
  const { data: existingAssignments } = await supabase
    .from('product_pricing_assignments')
    .select('product_id')
    .in('product_id', products.map(p => p.id));

  const assignedProductIds = new Set((existingAssignments || []).map(a => a.product_id));
  const productsWithoutAssignments = products.filter(p => !assignedProductIds.has(p.id));

  console.log(`✅ ${assignedProductIds.size} products already have pricing assignments`);
  console.log(`🔄 ${productsWithoutAssignments.length} products need assignments\n`);

  if (productsWithoutAssignments.length === 0) {
    console.log('All products already have pricing assignments! ✨');
    return;
  }

  // 4. Create assignments for products without them
  const assignments = productsWithoutAssignments.map(product => ({
    product_id: product.id,
    blueprint_id: blueprintId,
    price_overrides: {},
    is_active: true
  }));

  const { data: inserted, error: insertError } = await supabase
    .from('product_pricing_assignments')
    .insert(assignments)
    .select();

  if (insertError) {
    console.error('❌ Error creating assignments:', insertError);
    return;
  }

  console.log(`✅ Created ${inserted?.length || 0} pricing assignments\n`);

  // 5. Show summary
  console.log('📊 Summary:');
  console.log(`   Total products: ${products.length}`);
  console.log(`   Already assigned: ${assignedProductIds.size}`);
  console.log(`   Newly assigned: ${inserted?.length || 0}`);
  console.log(`   Blueprint used: ${defaultBlueprint?.name}\n`);

  console.log('✨ Done! Products now have pricing tier assignments.');
  console.log('💡 Vendors can see/edit their prices at /vendor/pricing');
}

// Run the script
assignDefaultPricingBlueprints()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
