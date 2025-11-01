#!/usr/bin/env node

/**
 * Create Clean Moonwater Categories (Steve Jobs Style)
 *
 * Creates 4 subcategories under Beverages:
 * - Day Drinker (5mg)
 * - Golden Hour (10mg)
 * - Darkside (30mg)
 * - Riptide (60mg)
 *
 * Then moves products and renames them to just flavor names
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseKey);

const FLORA_DISTRO_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
const BEVERAGES_CATEGORY_ID = '64ca5109-04c7-4279-bef5-c7da59a42654';

// Moonwater line categories to create
const CATEGORIES_TO_CREATE = [
  {
    name: 'Day Drinker (5mg)',
    slug: 'day-drinker-5mg',
    dosage: '5mg',
    description: 'Moonwater Day Drinker - Perfect for daytime enjoyment'
  },
  {
    name: 'Golden Hour (10mg)',
    slug: 'golden-hour-10mg',
    dosage: '10mg',
    description: 'Moonwater Golden Hour - Mid-tier THC sodas'
  },
  {
    name: 'Darkside (30mg)',
    slug: 'darkside-30mg',
    dosage: '30mg',
    description: 'Moonwater Darkside - Higher potency experience'
  },
  {
    name: 'Riptide (60mg)',
    slug: 'riptide-60mg',
    dosage: '60mg',
    description: 'Moonwater Riptide - Maximum strength premium line'
  }
];

async function createMoonwaterCategories() {
  console.log('🎨 Creating Moonwater Line Categories...\n');

  const createdCategories = {};

  // Step 1: Create categories
  for (const cat of CATEGORIES_TO_CREATE) {
    console.log(`📁 Creating category: "${cat.name}"`);

    // Check if category already exists
    const { data: existing } = await supabase
      .from('categories')
      .select('id, name')
      .eq('vendor_id', FLORA_DISTRO_VENDOR_ID)
      .eq('slug', cat.slug)
      .single();

    if (existing) {
      console.log(`   ℹ️  Category already exists, using existing ID`);
      createdCategories[cat.dosage] = existing.id;
      continue;
    }

    // Create new category
    const { data: created, error } = await supabase
      .from('categories')
      .insert({
        vendor_id: FLORA_DISTRO_VENDOR_ID,
        parent_id: BEVERAGES_CATEGORY_ID,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error(`   ❌ Error creating category: ${error.message}`);
      continue;
    }

    console.log(`   ✅ Created: ${created.name} (${created.id})\n`);
    createdCategories[cat.dosage] = created.id;
  }

  console.log('\n📦 Moving and Renaming Products...\n');

  // Step 2: Get all Moonwater products
  const { data: products, error: fetchError } = await supabase
    .from('products')
    .select('id, name, meta_data')
    .eq('vendor_id', FLORA_DISTRO_VENDOR_ID)
    .ilike('name', 'Moonwater%')
    .order('meta_data->dosage', 'meta_data->flavor');

  if (fetchError) {
    console.error('❌ Error fetching products:', fetchError);
    return;
  }

  let updated = 0;
  let errors = 0;

  // Step 3: Move products and rename them
  for (const product of products) {
    const dosage = product.meta_data?.dosage;
    const flavor = product.meta_data?.flavor;

    if (!dosage || !flavor) {
      console.log(`⚠️  SKIP: "${product.name}" - Missing metadata`);
      continue;
    }

    const newCategoryId = createdCategories[dosage];
    if (!newCategoryId) {
      console.log(`⚠️  SKIP: "${product.name}" - No category found for ${dosage}`);
      continue;
    }

    // New name is just the flavor (clean!)
    const newName = flavor;

    console.log(`📝 "${product.name}" → "${newName}"`);
    console.log(`   └─ Moving to: ${CATEGORIES_TO_CREATE.find(c => c.dosage === dosage)?.name}`);

    const { error: updateError } = await supabase
      .from('products')
      .update({
        name: newName,
        primary_category_id: newCategoryId
      })
      .eq('id', product.id);

    if (updateError) {
      console.error(`   ❌ Error: ${updateError.message}`);
      errors++;
    } else {
      console.log(`   ✅ Updated\n`);
      updated++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`📁 Categories Created: ${Object.keys(createdCategories).length}`);
  console.log(`✅ Products Updated: ${updated}`);
  console.log(`❌ Errors: ${errors}`);
  console.log('='.repeat(60));
  console.log('\n✨ Clean, minimal, Steve Jobs-approved! ✨\n');
}

// Run the script
createMoonwaterCategories().catch(console.error);
