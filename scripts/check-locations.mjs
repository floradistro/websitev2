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
  console.log('🔍 Checking locations and inventory...\n');

  // Get all locations
  const { data: locations, error: locationsError } = await supabase
    .from('locations')
    .select('id, name, vendor:vendors(store_name)')
    .order('name');

  if (locationsError) {
    console.error('❌ Error:', locationsError);
    process.exit(1);
  }

  console.log(`📍 Found ${locations.length} locations:\n`);

  for (const location of locations) {
    // Count inventory for this location
    const { count } = await supabase
      .from('inventory')
      .select('id', { count: 'exact', head: true })
      .eq('location_id', location.id)
      .gt('quantity', 0);

    console.log(`${location.name} (${location.vendor?.store_name || 'No vendor'})`);
    console.log(`  ID: ${location.id}`);
    console.log(`  Inventory items: ${count || 0}\n`);
  }
}

main().catch(console.error);
