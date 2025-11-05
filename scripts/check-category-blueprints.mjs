#!/usr/bin/env node

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('📋 CATEGORY BLUEPRINTS:\n');

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('vendor_id', 'cd2e1122-d511-4edb-be5d-98ef274b4baf')
    .order('name');

  for (const cat of categories || []) {
    console.log(`\n${cat.name} (${cat.slug}):`);
    console.log(`  Default Blueprint ID: ${cat.default_blueprint_id}`);

    if (cat.default_blueprint_id) {
      const { data: blueprint } = await supabase
        .from('pricing_tier_blueprints')
        .select('*')
        .eq('id', cat.default_blueprint_id)
        .single();

      if (blueprint) {
        console.log(`  Blueprint Name: ${blueprint.name}`);
        console.log(`  Quality Tier: ${blueprint.quality_tier}`);
      }
    }
  }
}

main().catch(console.error);
