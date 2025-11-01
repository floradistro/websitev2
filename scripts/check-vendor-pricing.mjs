#!/usr/bin/env node

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
  console.log('🔍 Checking vendor pricing configurations...\n');

  // Get all vendors
  const { data: vendors, error: vendorsError } = await supabase
    .from('vendors')
    .select('id, store_name')
    .order('store_name');

  if (vendorsError) {
    console.error('❌ Error fetching vendors:', vendorsError);
    process.exit(1);
  }

  console.log(`📊 Found ${vendors.length} vendors\n`);

  // Check pricing configs for each vendor
  for (const vendor of vendors) {
    const { data: configs, error: configsError } = await supabase
      .from('vendor_pricing_configs')
      .select(`
        id,
        is_active,
        pricing_values,
        blueprint:pricing_tier_blueprints(id, name)
      `)
      .eq('vendor_id', vendor.id);

    if (configsError) {
      console.error(`❌ Error fetching configs for ${vendor.store_name}:`, configsError);
      continue;
    }

    console.log(`\n📦 ${vendor.store_name} (${vendor.id})`);
    if (configs.length === 0) {
      console.log('   ⚠️  NO PRICING CONFIGS');
    } else {
      configs.forEach(config => {
        const valueCount = Object.keys(config.pricing_values || {}).length;
        console.log(`   - ${config.blueprint?.name || 'Unknown'}: ${valueCount} price breaks ${config.is_active ? '✅' : '❌'}`);
      });
    }
  }
}

main().catch(console.error);
