#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCategories() {
  console.log('🔍 Checking categories in database...\n');

  // Check categories table
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (catError) {
    console.error('❌ Error fetching categories:', catError);
  } else {
    console.log(`📂 Found ${categories.length} total categories:`);
    categories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.slug}) - Active: ${cat.is_active}`);
    });
  }

  // Check product_categories join table
  const { data: productCats, error: pcError } = await supabase
    .from('product_categories')
    .select('product_id, category_id, categories(name)')
    .limit(10);

  if (pcError) {
    console.error('\n❌ Error fetching product_categories:', pcError);
  } else {
    console.log(`\n🔗 Found ${productCats.length} product-category relationships (showing first 10)`);
    productCats.forEach(pc => {
      console.log(`  - Product ${pc.product_id.slice(0, 8)}... → ${pc.categories?.name || 'Unknown'}`);
    });
  }

  // Check if any products have categories
  const { data: products, error: prodError } = await supabase
    .from('products')
    .select(`
      id,
      name,
      vendor_id,
      product_categories(
        category:categories(name)
      )
    `)
    .limit(5);

  if (prodError) {
    console.error('\n❌ Error fetching products:', prodError);
  } else {
    console.log(`\n📦 Sample products with categories (first 5):`);
    products.forEach(p => {
      const cats = p.product_categories?.map(pc => pc.category?.name).filter(Boolean);
      console.log(`  - ${p.name}: [${cats?.join(', ') || 'No categories'}]`);
    });
  }
}

checkCategories().catch(console.error);
