#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Searching for Eva Magan in customers table...\n');

// Search by name
const { data: byName, error: nameError } = await supabase
  .from('customers')
  .select('id, first_name, last_name, email, phone')
  .ilike('first_name', '%eva%')
  .ilike('last_name', '%magan%');

if (nameError) {
  console.error('Error:', nameError);
} else {
  console.log(`Found ${byName?.length || 0} matches by name:`);
  byName?.forEach(c => {
    console.log(`  - ${c.first_name} ${c.last_name}`);
    console.log(`    Email: ${c.email}`);
    console.log(`    Phone: ${c.phone || 'N/A'}`);
    console.log(`    ID: ${c.id}\n`);
  });
}

// Search by phone variations
const phoneVariations = [
  '9198066511',
  '919-806-6511',
  '(919) 806-6511',
  '+19198066511',
  '19198066511',
];

console.log('🔍 Searching by phone variations...\n');

for (const phone of phoneVariations) {
  const { data: byPhone } = await supabase
    .from('customers')
    .select('id, first_name, last_name, email, phone')
    .ilike('phone', `%${phone}%`);

  if (byPhone && byPhone.length > 0) {
    console.log(`✅ Found match with phone pattern "${phone}":`);
    byPhone.forEach(c => {
      console.log(`  - ${c.first_name} ${c.last_name}`);
      console.log(`    Email: ${c.email}`);
      console.log(`    Phone: ${c.phone}`);
      console.log(`    ID: ${c.id}\n`);
    });
  }
}

// Check if synthetic email exists
const syntheticEmail = '9198066511@alpine.local';
const { data: bySynthetic } = await supabase
  .from('customers')
  .select('id, first_name, last_name, email, phone')
  .eq('email', syntheticEmail);

console.log(`\n🔍 Checking for synthetic email: ${syntheticEmail}`);
if (bySynthetic && bySynthetic.length > 0) {
  console.log('✅ Found:');
  bySynthetic.forEach(c => {
    console.log(`  - ${c.first_name} ${c.last_name}`);
    console.log(`    Email: ${c.email}`);
    console.log(`    Phone: ${c.phone}`);
    console.log(`    ID: ${c.id}\n`);
  });
} else {
  console.log('❌ Not found with synthetic email\n');
}

console.log('✨ Done!\n');
