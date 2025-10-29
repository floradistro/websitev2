#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { createAlpineIQClient } from '../lib/marketing/alpineiq-client.js';

const supabaseUrl = 'https://uaednwpxursknmwdeejn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const alpineIQConfig = {
  api_key: 'U_SKZShKgmfH1U5CyIBsH0OcNQnWkOcx4oUNMZcq8BFtOiWFEMRPmB6Iqw',
  user_id: '3999',
};

const vendorId = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

// Rate limiting: 5 requests/second, 120/minute
const RATE_LIMIT_PER_SECOND = 5;
const DELAY_BETWEEN_REQUESTS = 1000 / RATE_LIMIT_PER_SECOND; // 200ms

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function importAlpineIQCustomers() {
  console.log('🚀 Starting Alpine IQ Customer Import\n');

  const alpineiq = createAlpineIQClient(alpineIQConfig);

  // Test connection
  console.log('1️⃣ Testing Alpine IQ connection...');
  const connected = await alpineiq.testConnection();
  if (!connected) {
    console.error('❌ Failed to connect to Alpine IQ');
    return;
  }
  console.log('✅ Connected to Alpine IQ\n');

  // Get loyalty audience info
  console.log('2️⃣ Finding loyalty program...');
  const audienceInfo = await alpineiq.getLoyaltyAudienceInfo();

  if (!audienceInfo) {
    console.error('❌ No loyalty program found');
    return;
  }

  console.log(`✅ Found loyalty program: "${audienceInfo.name}"`);
  console.log(`   Total members: ${audienceInfo.totalMembers}`);
  console.log(`   Audience ID: ${audienceInfo.audienceId}\n`);

  // Get all audience members
  console.log('3️⃣ Fetching audience member IDs...');
  const memberIds = await alpineiq.getAudienceMembers(audienceInfo.audienceId);

  console.log(`✅ Retrieved ${memberIds.length} member contact IDs\n`);

  // Now lookup each member's details and import
  console.log(`4️⃣ Looking up member details (${memberIds.length} members)...`);
  console.log(`   ⏱️  This will take ~${Math.ceil(memberIds.length * DELAY_BETWEEN_REQUESTS / 1000 / 60)} minutes due to rate limits\n`);

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < memberIds.length; i++) {
    const contactId = memberIds[i];

    try {
      // Lookup member details (we need email/phone)
      // Alpine IQ requires email/phone for lookup, but we have contact ID
      // Let's try to get wallet first which might have contact info
      const wallet = await alpineiq.getWallet({ contactId });

      if (!wallet || !wallet.contact) {
        skipped++;
        continue;
      }

      const contact = wallet.contact;
      const email = contact.email || contact.emailAddress;
      const phone = contact.phone || contact.phoneNumber;

      if (!email && !phone) {
        console.log(`   ⚠️  Skipping contact ${contactId} - no email or phone`);
        skipped++;
        continue;
      }

      // Check if customer exists
      let existingCustomer = null;
      if (email) {
        const { data } = await supabase
          .from('customers')
          .select('id')
          .eq('email', email)
          .single();
        existingCustomer = data;
      }

      const customerData = {
        email: email || null,
        phone: phone || null,
        first_name: contact.firstName || contact.first_name || null,
        last_name: contact.lastName || contact.last_name || null,
        marketing_opt_in: true, // They're in loyalty program
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      if (existingCustomer) {
        // Update existing customer
        const { error: updateError } = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', existingCustomer.id);

        if (updateError) {
          console.error(`   ❌ Error updating ${email}:`, updateError.message);
          errors++;
        } else {
          updated++;
        }
      } else {
        // Insert new customer
        const { error: insertError } = await supabase
          .from('customers')
          .insert({
            ...customerData,
            created_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error(`   ❌ Error inserting ${email}:`, insertError.message);
          errors++;
        } else {
          imported++;
        }
      }

      // Progress update every 10 customers
      if ((i + 1) % 10 === 0) {
        console.log(`   📊 Progress: ${i + 1}/${memberIds.length} (${imported} imported, ${updated} updated, ${skipped} skipped, ${errors} errors)`);
      }

      // Rate limiting
      await sleep(DELAY_BETWEEN_REQUESTS);

    } catch (error) {
      console.error(`   ❌ Error processing contact ${contactId}:`, error.message);
      errors++;
      await sleep(DELAY_BETWEEN_REQUESTS);
    }
  }

  console.log('\n✅ Import Complete!\n');
  console.log('📊 Summary:');
  console.log(`   Imported: ${imported} new customers`);
  console.log(`   Updated: ${updated} existing customers`);
  console.log(`   Skipped: ${skipped} (no email/phone)`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Total: ${memberIds.length}`);

  console.log('\n🎉 Next step: Run loyalty sync to enrich customer data');
  console.log('   curl -X POST http://localhost:3000/api/vendor/marketing/alpineiq/sync-loyalty \\');
  console.log('     -H "x-vendor-id: cd2e1122-d511-4edb-be5d-98ef274b4baf" \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -d \'{"limit": 100}\'');
}

importAlpineIQCustomers().catch(console.error);
