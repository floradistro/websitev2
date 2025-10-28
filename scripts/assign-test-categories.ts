import { getServiceSupabase } from '@/lib/supabase/client';

async function assignTestCategories() {
  const supabase = getServiceSupabase();

  console.log('🔧 Assigning test categories to products...');

  // Category assignments based on product names
  const categoryMap: Record<string, string> = {
    'Flower': ['Air Headz', 'Atm', 'Apples And Bananas'],
    'Concentrates': ['Apple-tart-concentrate'],
    'Edibles': ['123'], // Example
    'Pre-Rolls': [],
    'Vapes': [],
  };

  let updated = 0;

  for (const [category, productNames] of Object.entries(categoryMap)) {
    if (productNames.length === 0) continue;

    for (const productName of productNames) {
      const { data, error } = await supabase
        .from('products')
        .update({ category })
        .eq('name', productName)
        .select();

      if (error) {
        console.error(`❌ Failed to update ${productName}:`, error.message);
      } else if (data && data.length > 0) {
        console.log(`✅ Updated ${productName} → ${category}`);
        updated++;
      }
    }
  }

  console.log(`\n✅ Updated ${updated} products with categories`);
  console.log('\n📊 Category breakdown:');
  for (const [category, productNames] of Object.entries(categoryMap)) {
    if (productNames.length > 0) {
      console.log(`  ${category}: ${productNames.length} products`);
    }
  }
}

assignTestCategories().catch(console.error);
