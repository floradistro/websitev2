#!/usr/bin/env node

/**
 * Organize category hierarchy:
 * - Day Drinker (5mg) → under Beverages
 * - Golden Hour (10mg) → under Beverages
 * - Darkside (30mg) → under Beverages
 * - Riptide (60mg) → under Beverages
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🔧 Organizing category hierarchy...\n');

  // Get all categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name');

  const categoryMap = {};
  categories.forEach(c => {
    categoryMap[c.name] = c.id;
  });

  const beveragesId = categoryMap['Beverages'];

  if (!beveragesId) {
    console.error('❌ Beverages category not found!');
    process.exit(1);
  }

  console.log(`✅ Found Beverages category: ${beveragesId}\n`);

  // Update beverage subcategories
  const beverageSubcategories = [
    'Day Drinker (5mg)',
    'Golden Hour (10mg)',
    'Darkside (30mg)',
    'Riptide (60mg)'
  ];

  console.log('📝 Setting parent category for beverage subcategories:\n');

  for (const subcatName of beverageSubcategories) {
    const subcatId = categoryMap[subcatName];

    if (!subcatId) {
      console.log(`⚠️  ${subcatName} - not found, skipping`);
      continue;
    }

    const { error } = await supabase
      .from('categories')
      .update({ parent_category_id: beveragesId })
      .eq('id', subcatId);

    if (error) {
      console.log(`❌ ${subcatName} - error: ${error.message}`);
    } else {
      console.log(`✅ ${subcatName} → Beverages`);
    }
  }

  console.log('\n🎉 Category hierarchy organized!');
  console.log('\nParent Categories (shown in dropdown):');
  console.log('  - Beverages');
  console.log('  - Concentrates');
  console.log('  - Edibles');
  console.log('  - Flower');
  console.log('  - Hash Holes');
  console.log('  - Pre-Rolls');
  console.log('  - Vape');
  console.log('\nBeverages Subcategories (shown as pills):');
  console.log('  - Day Drinker (5mg)');
  console.log('  - Golden Hour (10mg)');
  console.log('  - Darkside (30mg)');
  console.log('  - Riptide (60mg)');
}

main().catch(console.error);
