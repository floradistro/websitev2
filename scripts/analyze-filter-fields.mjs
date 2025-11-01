#!/usr/bin/env node

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🔍 Analyzing custom fields for filtering...\n');

  const { data: products } = await supabase
    .from('products')
    .select('id, name, custom_fields, primary_category:categories!primary_category_id(name)')
    .not('custom_fields', 'is', null);

  // Organize by field type
  const fieldValues = {
    strain_type: new Set(),
    consistency: new Set(),
    flavor: new Set(),
    line: new Set(),
    edible_type: new Set(),
  };

  const categoryFields = {};

  products.forEach(product => {
    const category = product.primary_category?.name || 'Unknown';
    if (!categoryFields[category]) {
      categoryFields[category] = new Set();
    }

    const fields = product.custom_fields || {};
    Object.keys(fields).forEach(key => {
      categoryFields[category].add(key);

      if (key === 'strain_type' && fields[key]) {
        fieldValues.strain_type.add(fields[key]);
      }
      if (key === 'consistency' && fields[key]) {
        fieldValues.consistency.add(fields[key]);
      }
      if (key === 'flavor' && fields[key]) {
        fieldValues.flavor.add(fields[key]);
      }
      if (key === 'line' && fields[key]) {
        fieldValues.line.add(fields[key]);
      }
      if (key === 'edible_type' && fields[key]) {
        fieldValues.edible_type.add(fields[key]);
      }
    });
  });

  console.log('📊 UNIQUE FIELD VALUES\n');
  console.log('Strain Types:', Array.from(fieldValues.strain_type).sort());
  console.log('Consistencies:', Array.from(fieldValues.consistency).sort());
  console.log('Flavors:', Array.from(fieldValues.flavor).sort().slice(0, 10), '...');
  console.log('Lines:', Array.from(fieldValues.line).sort());
  console.log('Edible Types:', Array.from(fieldValues.edible_type).sort());

  console.log('\n📁 FIELDS BY CATEGORY\n');
  Object.entries(categoryFields).forEach(([cat, fields]) => {
    console.log(`${cat}:`, Array.from(fields).sort().join(', '));
  });
}

main().catch(console.error);
