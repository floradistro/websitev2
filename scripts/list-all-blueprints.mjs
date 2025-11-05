#!/usr/bin/env node

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

async function main() {
  console.log('📋 ALL BLUEPRINTS FOR VENDOR:\n');
  console.log('='.repeat(80));

  const { data: blueprints } = await supabase
    .from('pricing_tier_blueprints')
    .select('*')
    .eq('vendor_id', VENDOR_ID)
    .order('created_at');

  for (const bp of blueprints || []) {
    console.log(`\n${bp.name}`);
    console.log(`  ID: ${bp.id}`);
    console.log(`  Slug: ${bp.slug}`);
    console.log(`  Quality Tier: ${bp.quality_tier || 'null'}`);
    console.log(`  Created: ${bp.created_at}`);
    console.log(`  Price Breaks: ${bp.price_breaks ? bp.price_breaks.length : 0} tiers`);

    // Check if vendor has pricing config for it
    const { data: config } = await supabase
      .from('vendor_pricing_configs')
      .select('id')
      .eq('vendor_id', VENDOR_ID)
      .eq('blueprint_id', bp.id)
      .single();

    console.log(`  Has Vendor Pricing: ${config ? '✅ YES' : '❌ NO'}`);

    // Check if any products use it
    const { data: assignments, count } = await supabase
      .from('product_pricing_assignments')
      .select('id', { count: 'exact' })
      .eq('blueprint_id', bp.id);

    console.log(`  Products Using: ${count || 0}`);
  }

  console.log('\n' + '='.repeat(80));
}

main().catch(console.error);
