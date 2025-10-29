#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function simpleCheck() {
  console.log('🔍 Simple customer check...\n');

  const { data, error } = await supabase
    .from('customers')
    .select('vendor_id, email, first_name, last_name')
    .limit(10);

  if (error) {
    console.log('❌ Error:', JSON.stringify(error, null, 2));
    return;
  }

  console.log(`✅ Retrieved ${data.length} customers\n`);

  data.forEach((c, i) => {
    console.log(`${i + 1}. ${c.first_name || ''} ${c.last_name || ''}`);
    console.log(`   Vendor: ${c.vendor_id}`);
    console.log(`   Email: ${c.email || 'N/A'}\n`);
  });

  // Now try Flora Distro specifically
  console.log('🔍 Trying Flora Distro (cd2e1122-d511-4edb-be5d-98ef274b4baf)...\n');

  const { data: floraData, error: floraError } = await supabase
    .from('customers')
    .select('id, email, first_name, last_name')
    .eq('vendor_id', 'cd2e1122-d511-4edb-be5d-98ef274b4baf')
    .limit(10);

  if (floraError) {
    console.log('❌ Flora Error:', JSON.stringify(floraError, null, 2));
    return;
  }

  console.log(`✅ Flora Distro has ${floraData.length} customers (showing first 10)\n`);

  if (floraData.length > 0) {
    floraData.forEach((c, i) => {
      console.log(`${i + 1}. ${c.first_name || ''} ${c.last_name || ''} - ${c.email || 'No email'}`);
    });
  }
}

simpleCheck().catch(err => {
  console.error('Uncaught error:', err);
});
