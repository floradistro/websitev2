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
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * This script populates vendor_pricing_configs with default values
 * based on existing product_pricing_assignments
 */
async function populateVendorPricingConfigs() {
  console.log('🔍 Checking vendor pricing configurations...\n');

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

  // Check existing vendor pricing configs
  const { data: existingConfigs } = await supabase
    .from('vendor_pricing_configs')
    .select('*')
    .eq('vendor_id', vendor.id);

  console.log(`📦 Found ${existingConfigs?.length || 0} existing pricing configs for this vendor\n`);

  // Get all blueprints used by this vendor's products
  const { data: assignments } = await supabase
    .from('product_pricing_assignments')
    .select(`
      blueprint_id,
      price_overrides,
      blueprint:pricing_tier_blueprints(
        id,
        name,
        slug,
        price_breaks,
        display_unit
      ),
      product:products!inner(
        vendor_id,
        name
      )
    `)
    .eq('product.vendor_id', vendor.id)
    .eq('is_active', true);

  if (!assignments || assignments.length === 0) {
    console.log('⚠️  No product pricing assignments found for this vendor');
    return;
  }

  console.log(`📋 Found ${assignments.length} product pricing assignments\n`);

  // Get unique blueprints and collect all pricing data
  const blueprintMap = new Map();

  assignments.forEach(assignment => {
    const blueprintId = assignment.blueprint_id;
    const blueprint = assignment.blueprint;
    const priceOverrides = assignment.price_overrides || {};

    if (!blueprint) return;

    if (!blueprintMap.has(blueprintId)) {
      blueprintMap.set(blueprintId, {
        blueprint,
        priceExamples: []
      });
    }

    // Collect price examples from this product
    if (Object.keys(priceOverrides).length > 0) {
      blueprintMap.get(blueprintId).priceExamples.push(priceOverrides);
    }
  });

  console.log(`🎯 Found ${blueprintMap.size} unique pricing blueprints used by products:\n`);

  // Create vendor pricing configs for each blueprint
  const configsToCreate = [];

  for (const [blueprintId, data] of blueprintMap.entries()) {
    const { blueprint, priceExamples } = data;

    // Check if config already exists
    const existingConfig = existingConfigs?.find(c => c.blueprint_id === blueprintId);

    if (existingConfig) {
      console.log(`   ✓ "${blueprint.name}" - already configured`);
      continue;
    }

    // Build default pricing values from price breaks
    const pricingValues = {};
    const priceBreaks = blueprint.price_breaks || [];

    // Strategy: Use first product's price overrides as template, or create defaults
    const templatePrices = priceExamples[0] || {};

    priceBreaks.forEach(priceBreak => {
      const breakId = priceBreak.break_id;

      if (templatePrices[breakId]) {
        // Use existing price from a product
        pricingValues[breakId] = {
          price: templatePrices[breakId].price || templatePrices[breakId],
          enabled: true
        };
      } else {
        // Create a placeholder price based on the tier
        let defaultPrice = '0.00';

        // Try to infer a reasonable default based on quantity/tier
        if (priceBreak.qty) {
          const qty = parseFloat(priceBreak.qty);
          if (!isNaN(qty)) {
            // Simple formula: $10 per gram as baseline
            defaultPrice = (qty * 10).toFixed(2);
          }
        }

        pricingValues[breakId] = {
          price: defaultPrice,
          enabled: true
        };
      }
    });

    configsToCreate.push({
      vendor_id: vendor.id,
      blueprint_id: blueprintId,
      pricing_values: pricingValues,
      display_unit: blueprint.display_unit || 'gram',
      is_active: true
    });

    console.log(`   + "${blueprint.name}" - will create with ${Object.keys(pricingValues).length} price tiers`);
  }

  if (configsToCreate.length === 0) {
    console.log('\n✅ All blueprints already have vendor pricing configs!');
    return;
  }

  console.log(`\n🔄 Creating ${configsToCreate.length} vendor pricing configs...\n`);

  const { data: inserted, error } = await supabase
    .from('vendor_pricing_configs')
    .insert(configsToCreate)
    .select();

  if (error) {
    console.error('❌ Error creating vendor pricing configs:', error);
    return;
  }

  console.log(`✅ Successfully created ${inserted?.length || 0} vendor pricing configs!\n`);

  // Show sample
  if (inserted && inserted.length > 0) {
    console.log('📋 Sample created config:');
    const sample = inserted[0];
    console.log(`   Blueprint ID: ${sample.blueprint_id}`);
    console.log(`   Pricing values:`, JSON.stringify(sample.pricing_values, null, 2));
  }
}

populateVendorPricingConfigs().catch(console.error);
