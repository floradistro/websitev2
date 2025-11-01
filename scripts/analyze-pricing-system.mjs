#!/usr/bin/env node

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('📊 COMPLETE PRICING SYSTEM ANALYSIS\n');
  console.log('=' .repeat(80));

  // 1. Get all pricing tier blueprints
  const { data: blueprints } = await supabase
    .from('pricing_tier_blueprints')
    .select('*')
    .order('name');

  console.log(`\n1️⃣  PRICING TIER BLUEPRINTS (${blueprints.length} total):\n`);

  for (const blueprint of blueprints) {
    console.log(`\n📋 ${blueprint.name}`);
    console.log(`   ID: ${blueprint.id}`);
    console.log(`   Price Breaks: ${blueprint.price_breaks?.length || 0}`);
    if (blueprint.price_breaks && blueprint.price_breaks.length > 0) {
      blueprint.price_breaks.forEach(pb => {
        console.log(`      - ${pb.label || pb.break_id}: ${pb.qty}${pb.unit || ''}`);
      });
    }
  }

  // 2. Get all vendor pricing configs
  const { data: vendorConfigs } = await supabase
    .from('vendor_pricing_configs')
    .select(`
      id,
      vendor_id,
      blueprint_id,
      is_active,
      pricing_values,
      vendor:vendors(store_name),
      blueprint:pricing_tier_blueprints(name)
    `)
    .eq('is_active', true);

  console.log(`\n\n2️⃣  VENDOR PRICING CONFIGS (${vendorConfigs.length} active):\n`);

  const vendorGroups = {};
  vendorConfigs.forEach(config => {
    const vendorName = config.vendor?.store_name || 'Unknown';
    if (!vendorGroups[vendorName]) vendorGroups[vendorName] = [];
    vendorGroups[vendorName].push(config);
  });

  for (const [vendorName, configs] of Object.entries(vendorGroups)) {
    console.log(`\n🏪 ${vendorName}:`);
    configs.forEach(config => {
      const priceCount = Object.keys(config.pricing_values || {}).length;
      console.log(`   - ${config.blueprint?.name}: ${priceCount} prices set`);

      // Show actual prices
      if (config.pricing_values) {
        Object.entries(config.pricing_values).forEach(([breakId, value]) => {
          if (value.enabled !== false && value.price) {
            console.log(`      ${breakId}: $${value.price}`);
          }
        });
      }
    });
  }

  // 3. Get all product categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name');

  console.log(`\n\n3️⃣  PRODUCT CATEGORIES (${categories.length} total):\n`);
  categories.forEach(cat => {
    console.log(`   - ${cat.name} (${cat.id})`);
  });

  // 4. Analyze product assignments
  const { data: products } = await supabase
    .from('products')
    .select(`
      id,
      name,
      price,
      primary_category:categories!primary_category_id(name),
      assignments:product_pricing_assignments(
        blueprint:pricing_tier_blueprints(name)
      )
    `)
    .limit(50);

  console.log(`\n\n4️⃣  PRODUCT PRICING ASSIGNMENTS (sample of ${products.length}):\n`);

  const categoryToBlueprint = {};
  products.forEach(p => {
    const category = p.primary_category?.name || 'No Category';
    const blueprint = p.assignments?.[0]?.blueprint?.name || 'No Blueprint';

    if (!categoryToBlueprint[category]) {
      categoryToBlueprint[category] = new Set();
    }
    categoryToBlueprint[category].add(blueprint);
  });

  console.log('Category → Blueprint Mapping:');
  for (const [category, blueprints] of Object.entries(categoryToBlueprint)) {
    console.log(`   ${category}:`);
    blueprints.forEach(bp => console.log(`      → ${bp}`));
  }

  // 5. Recommendations
  console.log('\n\n5️⃣  RECOMMENDED STANDARDIZATION:\n');
  console.log('=' .repeat(80));
  console.log(`
Based on the analysis, here's the recommended approach:

1. Create ONE blueprint per product category (Flower, Concentrate, Vape, Edibles)
2. Each blueprint defines the QUANTITY options (3.5g, 7g, 14g, etc.)
3. Each product stores its base price per gram/unit in the 'price' field
4. POS calculates final prices: base_price × quantity
5. Optional: Vendor can override specific tier prices in vendor_pricing_configs

This eliminates:
   - Confusion about which blueprint to use
   - Need to update prices in multiple places
   - Inconsistent pricing across similar products
`);

  console.log('\n' + '=' .repeat(80));
}

main().catch(console.error);
