#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ALPINE_API_KEY = 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw';
const ALPINE_USER_ID = '3999';
const ALPINE_BASE_URL = 'https://lab.alpineiq.com';

const DELAY_BETWEEN_REQUESTS = 250; // 250ms = 4 req/sec
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

async function bulkImportFromAlpineIQ() {
  console.log('🚀 Bulk Import: Alpine IQ → Supabase\n');
  console.log('⚠️  This will import all Alpine IQ customers');
  console.log('⏱️  Estimated time: ~60-90 minutes due to rate limits\n');

  // Test connection
  console.log('1️⃣ Testing connection...');
  try {
    await alpineRequest(`/api/v1.1/stores/${ALPINE_USER_ID}`);
    console.log('✅ Connected to Alpine IQ\n');
  } catch (error) {
    console.error('❌ Failed to connect:', error.message);
    return;
  }

  // Get all audiences
  console.log('2️⃣ Fetching all audiences...');
  const audiencesData = await alpineRequest(`/api/v1.1/audiences/${ALPINE_USER_ID}?limit=100`);
  const audiences = audiencesData.data || audiencesData || [];
  console.log(`✅ Found ${audiences.length} audiences\n`);

  // Collect all unique contact IDs
  const allContactIds = new Set();

  for (const audience of audiences) {
    console.log(`   📋 ${audience.name}: ${audience.audienceSize || 0} members`);

    try {
      const members = await alpineRequest(`/api/v2/audience/members/${audience.id}`);
      console.log(`      ✅ Retrieved ${members.length} contact IDs`);

      members.forEach(id => allContactIds.add(id));
      await sleep(DELAY_BETWEEN_REQUESTS);
    } catch (error) {
      console.log(`      ⚠️  Error: ${error.message}`);
      await sleep(DELAY_BETWEEN_REQUESTS);
    }
  }

  console.log(`\n✅ Total unique contacts: ${allContactIds.size}\n`);

  // Convert to array
  const contactIds = Array.from(allContactIds);

  // Fetch details and import
  console.log('3️⃣ Fetching contact details and importing...\n');

  let imported = 0;
  let skipped = 0;
  let errors = 0;
  let batch = [];

  for (let i = 0; i < contactIds.length; i++) {
    const contactId = contactIds[i];

    try {
      // Get wallet data (includes contact info)
      const walletData = await alpineRequest(`/api/v1.1/wallet/${ALPINE_USER_ID}/${contactId}`);

      if (!walletData || !walletData.contact) {
        skipped++;
        await sleep(DELAY_BETWEEN_REQUESTS);
        continue;
      }

      const contact = walletData.contact;
      const wallet = walletData.wallet || walletData.loyaltyWallet || {};

      // Extract email/phone
      const email = contact.email || contact.emailAddress || null;
      const phone = contact.phone || contact.phoneNumber || contact.mobile || null;

      if (!email && !phone) {
        skipped++;
        await sleep(DELAY_BETWEEN_REQUESTS);
        continue;
      }

      // Prepare customer record
      const customerData = {
        email: email,
        phone: phone,
        first_name: contact.firstName || contact.first_name || null,
        last_name: contact.lastName || contact.last_name || null,
        date_of_birth: contact.birthdate || contact.dob || null,
        marketing_opt_in: contact.emailOptIn !== false,
        sms_notifications: contact.smsOptIn === true,
        loyalty_points: wallet.points || wallet.loyaltyPoints || 0,
        loyalty_tier: wallet.tier || 'Member',
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
          errors += batch.length;
        } else {
          imported += batch.length;
        }

        batch = [];
      }

      // Progress update
      if ((i + 1) % 100 === 0) {
        const progress = ((i + 1) / contactIds.length * 100).toFixed(1);
        const elapsed = Math.floor(i * DELAY_BETWEEN_REQUESTS / 1000 / 60);
        const remaining = Math.ceil((contactIds.length - i) * DELAY_BETWEEN_REQUESTS / 1000 / 60);
        console.log(`   📊 ${i + 1}/${contactIds.length} (${progress}%) | ${imported} imported | ${elapsed}m elapsed, ~${remaining}m remaining`);
      }

      await sleep(DELAY_BETWEEN_REQUESTS);

    } catch (error) {
      errors++;
      await sleep(DELAY_BETWEEN_REQUESTS);
    }
  }

  // Insert remaining batch
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
  console.log('📊 Summary:');
  console.log(`   Contacts processed: ${contactIds.length}`);
  console.log(`   Successfully imported: ${imported}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);

  // Verify
  const { count } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true });

  console.log(`\n✅ Total customers in database: ${count}\n`);
}

bulkImportFromAlpineIQ().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
