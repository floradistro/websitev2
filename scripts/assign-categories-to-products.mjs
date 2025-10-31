#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from project root
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function assignCategories() {
  console.log('🔍 Checking products without categories...\n');

  // Get Flora Distro vendor ID
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, store_name')
    .eq('store_name', 'Flora Distro')
    .single();

  if (!vendor) {
    console.error('❌ Flora Distro vendor not found');
    return;
  }

  console.log(`✅ Found vendor: ${vendor.store_name} (${vendor.id})\n`);

  // Get the Flower category for this vendor
  const { data: flowerCategory } = await supabase
    .from('categories')
    .select('id, name')
    .eq('vendor_id', vendor.id)
    .eq('slug', 'flower')
    .single();

  if (!flowerCategory) {
    console.error('❌ Flower category not found for this vendor');
    return;
  }

  console.log(`✅ Found category: ${flowerCategory.name} (${flowerCategory.id})\n`);

  // Get all products for this vendor
  const { data: products } = await supabase
    .from('products')
    .select(`
      id,
      name,
      product_categories(category_id)
    `)
    .eq('vendor_id', vendor.id)
    .eq('status', 'published');

  console.log(`📦 Found ${products?.length || 0} published products\n`);

  // Find products without categories
  const productsWithoutCategories = products?.filter(p =>
    !p.product_categories || p.product_categories.length === 0
  ) || [];

  console.log(`⚠️  ${productsWithoutCategories.length} products have NO categories\n`);

  if (productsWithoutCategories.length === 0) {
    console.log('✅ All products already have categories!');
    return;
  }

  // Ask for confirmation
  console.log(`Will assign "${flowerCategory.name}" category to ${productsWithoutCategories.length} products:\n`);
  productsWithoutCategories.slice(0, 10).forEach(p => {
    console.log(`  - ${p.name}`);
  });
  if (productsWithoutCategories.length > 10) {
    console.log(`  ... and ${productsWithoutCategories.length - 10} more`);
  }

  console.log('\n🔄 Assigning categories...\n');

  // Assign Flower category to all products without categories
  const assignments = productsWithoutCategories.map(p => ({
    product_id: p.id,
    category_id: flowerCategory.id
  }));

  const { data: inserted, error } = await supabase
    .from('product_categories')
    .insert(assignments)
    .select();

  if (error) {
    console.error('❌ Error assigning categories:', error);
    return;
  }

  console.log(`✅ Successfully assigned "${flowerCategory.name}" to ${inserted?.length || 0} products!\n`);

  // Verify
  const { data: updatedProducts } = await supabase
    .from('products')
    .select(`
      id,
      name,
      product_categories(category:categories(name))
    `)
    .eq('vendor_id', vendor.id)
    .eq('status', 'published')
    .limit(5);

  console.log('📋 Sample products with categories:');
  updatedProducts?.forEach(p => {
    const cats = p.product_categories?.map(pc => pc.category?.name).filter(Boolean) || [];
    console.log(`  - ${p.name}: [${cats.join(', ')}]`);
  });
}

assignCategories().catch(console.error);
