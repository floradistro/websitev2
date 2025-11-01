#!/usr/bin/env node

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  // Get the "Retail Flower - Deals" blueprint
  const { data: blueprint } = await supabase
    .from('pricing_tier_blueprints')
    .select('*')
    .eq('id', 'cf2f07eb-9bb3-4951-9900-5994291bf93e')
    .single();

  console.log('\n📋 Retail Flower - Deals Blueprint:\n');
  console.log('Name:', blueprint.name);
  console.log('\nPrice Breaks:', JSON.stringify(blueprint.price_breaks, null, 2));
}

main().catch(console.error);
