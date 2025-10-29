#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ALPINE_API_KEY = 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw';
const ALPINE_USER_ID = '3999';
const ALPINE_BASE_URL = 'https://lab.alpineiq.com';

const DELAY = 300; // 300ms between requests
const BATCH_SIZE = 50;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function alpineRequest(endpoint, method = 'GET', body = null) {
  const url = `${ALPINE_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      'X-APIKEY': ALPINE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.errors?.[0]?.message || `API error: ${response.statusText}`);
  }

  return data.data;
}

async function importViaSearch() {
  console.log('🚀 Import Alpine IQ Customers via Search API\n');

  // Use contact search with empty criteria and pagination
  let start = 0;
  const limit = 100; // Max per page
  let allContacts = [];
  let hasMore = true;

  console.log('1️⃣ Fetching all contacts via search API...\n');

  while (hasMore) {
    try {
      console.log(`   📥 Fetching contacts ${start} to ${start + limit}...`);

      const contacts = await alpineRequest(
        `/api/v1.1/contacts/search/${ALPINE_USER_ID}`,
        'POST',
        {
          start,
          limit,
          // Empty search criteria to get all
        }
      );

      if (!contacts || contacts.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`      ✅ Retrieved ${contacts.length} contacts`);
      allContacts = allContacts.concat(contacts);

      if (contacts.length < limit) {
        hasMore = false;
      } else {
        start += limit;
      }

      await sleep(DELAY);

    } catch (error) {
      console.error(`   ❌ Error at offset ${start}:`, error.message);
      hasMore = false;
    }
  }

  console.log(`\n✅ Total contacts retrieved: ${allContacts.length}\n`);

  if (allContacts.length === 0) {
    console.log('⚠️  No contacts found. The search API may require search criteria.');
    console.log('   Trying alternative: fetch by loyalty status...\n');
    return await importViaLoyaltyLookup();
  }

  // Import to database
  console.log('2️⃣ Importing to database...\n');

  let imported = 0;
  let skipped = 0;
  let batch = [];

  for (let i = 0; i < allContacts.length; i++) {
    const contact = allContacts[i];

    const email = contact.email || contact.emailAddress || null;
    const phone = contact.phone || contact.phoneNumber || contact.mobile || null;

    if (!email && !phone) {
      skipped++;
      continue;
    }

    const customerData = {
      email: email,
      phone: phone,
      first_name: contact.firstName || contact.first_name || null,
      last_name: contact.lastName || contact.last_name || null,
      date_of_birth: contact.birthdate || contact.dob || null,
      marketing_opt_in: contact.emailOptIn !== false,
      sms_notifications: contact.smsOptIn === true,
      loyalty_points: contact.loyaltyPoints || contact.points || 0,
      loyalty_tier: contact.tier || 'Member',
      is_active: true,
      is_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    batch.push(customerData);

    // Insert batch
    if (batch.length >= BATCH_SIZE) {
      const { error } = await supabase
        .from('customers')
        .upsert(batch, {
          onConflict: 'email',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error(`   ❌ Batch error:`, error.message);
      } else {
        imported += batch.length;
        console.log(`   ✅ Imported ${imported} customers so far...`);
      }

      batch = [];
    }
  }

  // Insert remaining
  if (batch.length > 0) {
    const { error } = await supabase
      .from('customers')
      .upsert(batch, {
        onConflict: 'email',
        ignoreDuplicates: false,
      });

    if (!error) {
      imported += batch.length;
    }
  }

  console.log('\n🎉 Import Complete!\n');
  console.log(`   Imported: ${imported}`);
  console.log(`   Skipped: ${skipped}`);

  // Verify
  const { count } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });

  console.log(`\n✅ Total customers in database: ${count}\n`);
}

async function importViaLoyaltyLookup() {
  console.log('🔄 Fallback: Using loyalty lookup for each known email...\n');

  // This is a fallback - we'd need a list of known emails
  // For now, let's just report the issue

  console.log('⚠️  Unable to bulk import from Alpine IQ:');
  console.log('   - No bulk export API available');
  console.log('   - Contact search requires specific criteria');
  console.log('   - Wallet endpoint requires contact-by-contact lookup\n');

  console.log('💡 Recommendation:');
  console.log('   Contact Alpine IQ support and ask for:');
  console.log('   1. CSV export of all contacts');
  console.log('   2. Or bulk export API endpoint');
  console.log('   3. Or pagination support on contacts endpoint\n');

  return;
}

importViaSearch().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
