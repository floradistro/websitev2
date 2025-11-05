#!/usr/bin/env node

/**
 * Diagnose why pricing isn't showing
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

async function main() {
  console.log('🔍 DIAGNOSING PRICING ISSUE\n');
  console.log('='.repeat(60));

  // 1. Show ALL top-shelf blueprints
  console.log('\n1️⃣ ALL TOP-SHELF BLUEPRINTS:\n');
  const { data: topShelfBlueprints } = await supabase
    .from('pricing_tier_blueprints')
    .select('*')
    .eq('vendor_id', VENDOR_ID)
    .eq('quality_tier', 'top-shelf');

  if (!topShelfBlueprints || topShelfBlueprints.length === 0) {
    console.log('❌ NO TOP-SHELF BLUEPRINTS FOUND!');
  } else {
    topShelfBlueprints.forEach(bp => {
      console.log(`📋 ${bp.name}`);
      console.log(`   ID: ${bp.id}`);
      console.log(`   Slug: ${bp.slug}`);
      console.log(`   Price Breaks: ${JSON.stringify(bp.price_breaks, null, 2)}`);
    });
  }

  // 2. Show vendor_pricing_configs
  console.log('\n2️⃣ VENDOR PRICING CONFIGS:\n');
  const { data: configs } = await supabase
    .from('vendor_pricing_configs')
    .select(`
      *,
      blueprint:pricing_tier_blueprints(name, quality_tier)
    `)
    .eq('vendor_id', VENDOR_ID)
    .eq('is_active', true);

  if (!configs || configs.length === 0) {
    console.log('❌ NO VENDOR PRICING CONFIGS FOUND!');
  } else {
    configs.forEach(cfg => {
      console.log(`💰 ${cfg.blueprint?.name || 'Unknown'}`);
      console.log(`   Blueprint ID: ${cfg.blueprint_id}`);
      console.log(`   Pricing Values: ${JSON.stringify(cfg.pricing_values, null, 2)}`);
    });
  }

  // 3. Check GMO product specifically
  console.log('\n3️⃣ GMO PRODUCT DATA:\n');
  const { data: gmo } = await supabase
    .from('products')
    .select('id, name')
    .eq('vendor_id', VENDOR_ID)
    .eq('name', 'GMO')
    .single();

  if (!gmo) {
    console.log('❌ GMO NOT FOUND!');
  } else {
    console.log(`✅ GMO found: ${gmo.id}`);

    // Check assignment
    const { data: assignment } = await supabase
      .from('product_pricing_assignments')
      .select(`
        *,
        blueprint:pricing_tier_blueprints(name, quality_tier, price_breaks)
      `)
      .eq('product_id', gmo.id)
      .eq('is_active', true)
      .single();

    if (!assignment) {
      console.log('❌ NO PRICING ASSIGNMENT FOR GMO!');
    } else {
      console.log(`✅ Assignment found:`);
      console.log(`   Blueprint: ${assignment.blueprint?.name}`);
      console.log(`   Quality Tier: ${assignment.blueprint?.quality_tier}`);
      console.log(`   Blueprint ID: ${assignment.blueprint_id}`);

      // Check if vendor has pricing config for this blueprint
      const { data: vendorConfig } = await supabase
        .from('vendor_pricing_configs')
        .select('*')
        .eq('vendor_id', VENDOR_ID)
        .eq('blueprint_id', assignment.blueprint_id)
        .eq('is_active', true)
        .single();

      if (!vendorConfig) {
        console.log(`❌ NO VENDOR PRICING CONFIG FOR BLUEPRINT ${assignment.blueprint_id}!`);
        console.log(`   THIS IS THE PROBLEM!`);
      } else {
        console.log(`✅ Vendor pricing config exists:`);
        console.log(`   Pricing Values: ${JSON.stringify(vendorConfig.pricing_values, null, 2)}`);
      }
    }
  }

  // 4. Show a working product for comparison
  console.log('\n4️⃣ WORKING PRODUCT (Cherry Popper) FOR COMPARISON:\n');
  const { data: working } = await supabase
    .from('products')
    .select('id, name')
    .eq('vendor_id', VENDOR_ID)
    .eq('name', 'Cherry Popper')
    .single();

  if (working) {
    const { data: workingAssignment } = await supabase
      .from('product_pricing_assignments')
      .select(`
        *,
        blueprint:pricing_tier_blueprints(name, quality_tier)
      `)
      .eq('product_id', working.id)
      .eq('is_active', true)
      .single();

    if (workingAssignment) {
      console.log(`✅ Cherry Popper assignment:`);
      console.log(`   Blueprint: ${workingAssignment.blueprint?.name}`);
      console.log(`   Blueprint ID: ${workingAssignment.blueprint_id}`);

      const { data: workingConfig } = await supabase
        .from('vendor_pricing_configs')
        .select('*')
        .eq('vendor_id', VENDOR_ID)
        .eq('blueprint_id', workingAssignment.blueprint_id)
        .single();

      if (workingConfig) {
        console.log(`✅ Has vendor pricing config:`);
        console.log(`   Pricing Values: ${JSON.stringify(workingConfig.pricing_values, null, 2)}`);
      }
    }
  }

  console.log('\n' + '='.repeat(60));
}

main().catch(console.error);
