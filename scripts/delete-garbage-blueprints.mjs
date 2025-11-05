#!/usr/bin/env node

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Garbage blueprint IDs to delete
const GARBAGE_IDS = [
  'ef87e798-a123-4d23-8e69-b0fbe3c705ef', // Updated Premium Pricing
  '43fb960e-e5c5-429d-96d7-3e62ea1c6964', // Test Integration Blueprint
  'd28e219b-b8d8-429d-aa71-8ee2cf9ea9d4'  // Hash Rosin
];

async function main() {
  console.log('🗑️  DELETING GARBAGE BLUEPRINTS\n');

  for (const id of GARBAGE_IDS) {
    const { data: blueprint } = await supabase
      .from('pricing_tier_blueprints')
      .select('name')
      .eq('id', id)
      .single();

    if (!blueprint) {
      console.log(`⚠️  Blueprint ${id} not found, skipping`);
      continue;
    }

    const { error } = await supabase
      .from('pricing_tier_blueprints')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`❌ Failed to delete ${blueprint.name}:`, error.message);
    } else {
      console.log(`✅ Deleted: ${blueprint.name}`);
    }
  }

  console.log('\n✅ GARBAGE CLEANUP COMPLETE');
}

main().catch(console.error);
