#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const ALPINE_API_KEY = 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw';
const ALPINE_USER_ID = '3999';
const ALPINE_BASE_URL = 'https://lab.alpineiq.com';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const customerEmail = process.argv[2] || 'fahad@cwscommercial.com';

console.log('🔍 Checking Alpine IQ mapping for:', customerEmail);
console.log('');

// Get customer
const { data: customer } = await supabase
  .from('customers')
  .select('*')
  .eq('email', customerEmail)
  .single();

if (!customer) {
  console.error('❌ Customer not found');
  process.exit(1);
}

console.log('✅ Customer found:', customer.email);
console.log('   Customer ID:', customer.id);
console.log('');

// Check for mapping
const { data: mapping } = await supabase
  .from('alpineiq_customer_mapping')
  .select('*')
  .eq('customer_id', customer.id)
  .single();

if (mapping) {
  console.log('✅ Alpine IQ mapping exists:');
  console.log('   Alpine IQ Contact ID:', mapping.alpineiq_customer_id);
  console.log('   Last Synced:', mapping.last_synced_at);
  console.log('');

  // Try to get wallet pass
  console.log('🎫 Testing wallet pass API...');
  const passUrl = `${ALPINE_BASE_URL}/api/v1.1/walletPass/${ALPINE_USER_ID}/${mapping.alpineiq_customer_id}`;

  try {
    const response = await fetch(passUrl, {
      headers: {
        'X-APIKEY': ALPINE_API_KEY,
      }
    });

    const passData = await response.json();
    console.log('   Response:', JSON.stringify(passData, null, 2));
  } catch (error) {
    console.error('   Error:', error.message);
  }

} else {
  console.log('❌ No Alpine IQ mapping found');
  console.log('');
  console.log('💡 Searching for customer in Alpine IQ by email...');

  // Try to look up customer in Alpine IQ
  try {
    const searchUrl = `${ALPINE_BASE_URL}/api/v1.1/contacts/${ALPINE_USER_ID}?email=${encodeURIComponent(customer.email)}`;
    const response = await fetch(searchUrl, {
      headers: {
        'X-APIKEY': ALPINE_API_KEY,
      }
    });

    const searchData = await response.json();

    if (searchData.success && searchData.data && searchData.data.length > 0) {
      const contact = searchData.data[0];
      console.log('✅ Found in Alpine IQ!');
      console.log('   Contact ID:', contact.id);
      console.log('   Email:', contact.email);
      console.log('   Name:', contact.firstName, contact.lastName);
      console.log('   Points:', contact.points);
      console.log('');
      console.log('💾 Creating mapping...');

      await supabase.from('alpineiq_customer_mapping').insert({
        vendor_id: 'cd2e1122-d511-4edb-be5d-98ef274b4baf',
        customer_id: customer.id,
        alpineiq_customer_id: contact.id.toString(),
        last_synced_at: new Date().toISOString()
      });

      console.log('✅ Mapping created!');
      console.log('');
      console.log('🎫 Testing wallet pass API...');

      const passUrl = `${ALPINE_BASE_URL}/api/v1.1/walletPass/${ALPINE_USER_ID}/${contact.id}`;
      const passResponse = await fetch(passUrl, {
        headers: {
          'X-APIKEY': ALPINE_API_KEY,
        }
      });

      const passData = await passResponse.json();
      console.log('   Response:', JSON.stringify(passData, null, 2));

    } else {
      console.log('❌ Customer not found in Alpine IQ');
      console.log('   Response:', JSON.stringify(searchData, null, 2));
    }
  } catch (error) {
    console.error('❌ Error searching Alpine IQ:', error.message);
  }
}
