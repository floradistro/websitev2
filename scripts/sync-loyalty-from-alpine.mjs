#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ALPINE_API_KEY = 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw';
const ALPINE_BASE_URL = 'https://lab.alpineiq.com';

const DELAY = 300; // ms between requests (rate limiting)
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

console.log('🚀 Syncing loyalty points from Alpine IQ\n');

// Get all customers from database (paginated to avoid limit)
console.log('1️⃣ Loading customers from database...');

let allCustomers = [];
let page = 0;
const pageSize = 1000;
let hasMore = true;

while (hasMore) {
  const { data, error } = await supabase
    .from('customers')
    .select('id, email, phone, loyalty_points, first_name, last_name')
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) {
    console.error('❌ Error loading customers:', error.message);
    process.exit(1);
  }

  if (data && data.length > 0) {
    allCustomers = allCustomers.concat(data);
    console.log(`   Loaded page ${page + 1}: ${data.length} customers (total: ${allCustomers.length})`);
    page++;

    if (data.length < pageSize) {
      hasMore = false;
    }
  } else {
    hasMore = false;
  }
}

const customers = allCustomers;
console.log(`✅ Loaded ${customers.length} customers total\n`);

console.log('2️⃣ Syncing loyalty data from Alpine IQ...\n');

let enriched = 0;
let notFound = 0;
let errors = 0;
let batch = [];

for (let i = 0; i < customers.length; i++) {
  const customer = customers[i];

  // Skip if no email or phone
  if (!customer.email && !customer.phone) {
    notFound++;
    continue;
  }

  // Skip synthetic emails
  if (customer.email?.includes('@phone.local')) {
    notFound++;
    continue;
  }

  try {
    const identifier = customer.email || customer.phone;

    // Look up in Alpine IQ
    const loyaltyData = await alpineRequest(
      `/api/v2/loyalty/lookup/${identifier}`,
      'POST',
      {}
    );

    if (loyaltyData?.wallet) {
      // Map Alpine IQ tier to database tier
      const alpineTier = loyaltyData.wallet.tier || '';
      let dbTier = 'bronze';
      if (alpineTier.toLowerCase().includes('silver') || alpineTier.toLowerCase().includes('tier 2')) dbTier = 'silver';
      else if (alpineTier.toLowerCase().includes('gold') || alpineTier.toLowerCase().includes('tier 3')) dbTier = 'gold';
      else if (alpineTier.toLowerCase().includes('platinum') || alpineTier.toLowerCase().includes('tier 4')) dbTier = 'platinum';

      batch.push({
        id: customer.id,
        loyalty_points: loyaltyData.wallet.points || 0,
        loyalty_tier: dbTier,
        first_name: loyaltyData.contact?.firstName || customer.first_name,
        last_name: loyaltyData.contact?.lastName || customer.last_name
      });

      enriched++;

      if (enriched % 10 === 0) {
        console.log(`   ✅ Enriched ${enriched} customers so far...`);
      }
    } else {
      notFound++;
    }

    await sleep(DELAY);

  } catch (error) {
    // Customer not found in Alpine IQ
    notFound++;
  }

  // Update batch
  if (batch.length >= BATCH_SIZE) {
    const { error: updateError } = await supabase
      .from('customers')
      .upsert(batch, { onConflict: 'id' });

    if (updateError) {
      console.error(`   ❌ Batch update error:`, updateError.message);
      errors += batch.length;
    }

    batch = [];
  }

  // Progress
  if (i % 500 === 0 && i > 0) {
    console.log(`   📊 Progress: ${i}/${customers.length} (${enriched} enriched, ${notFound} not found)`);
  }
}

// Update remaining batch
if (batch.length > 0) {
  const { error: updateError } = await supabase
    .from('customers')
    .upsert(batch, { onConflict: 'id' });

  if (updateError) {
    console.error(`   ❌ Final batch error:`, updateError.message);
    errors += batch.length;
  }
}

console.log('\n🎉 Sync Complete!\n');
console.log('📊 Summary:');
console.log(`   Total customers: ${customers.length}`);
console.log(`   Enriched with Alpine IQ: ${enriched}`);
console.log(`   Not found in Alpine IQ: ${notFound}`);
console.log(`   Errors: ${errors}`);

// Verify
const { data: stats } = await supabase
  .from('customers')
  .select('loyalty_points')
  .gt('loyalty_points', 0);

console.log(`\n✅ Total customers with loyalty points: ${stats?.length || 0}\n`);
