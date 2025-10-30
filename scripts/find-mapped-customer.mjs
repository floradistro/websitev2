#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const { data: mappings } = await supabase
  .from('alpineiq_customer_mapping')
  .select('customer_id, alpineiq_customer_id, customers!inner(email, first_name, last_name)')
  .limit(10);

if (mappings && mappings.length > 0) {
  console.log(`Found ${mappings.length} mapped customers:\n`);
  mappings.forEach((m, i) => {
    console.log(`${i + 1}. ${m.customers.email} - Alpine IQ ID: ${m.alpineiq_customer_id}`);
  });
  console.log(`\nTesting with first customer: ${mappings[0].customers.email}`);
  console.log(`Alpine IQ Customer ID: ${mappings[0].alpineiq_customer_id}`);
} else {
  console.log('No mapped customers found');
}
