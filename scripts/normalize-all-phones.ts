/**
 * Complete migration: Normalize ALL phone numbers in batches
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://uaednwpxursknmwdeejn.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function normalizeAllPhones() {
  console.log("🔍 Starting complete phone normalization...\n");

  let totalUpdated = 0;
  let totalErrors = 0;
  let batchNumber = 1;

  while (true) {
    console.log(`📦 Processing batch ${batchNumber}...`);

    // Get next batch of customers with formatting
    const { data: customersToFix, error: checkError } = await supabase
      .from("customers")
      .select("id, first_name, last_name, phone, vendor_id")
      .not("phone", "is", null)
      .or("phone.like.% %,phone.like.%-%,phone.like.%(%,phone.like.%)%,phone.like.%.%")
      .limit(1000);

    if (checkError) {
      console.error("❌ Error fetching batch:", checkError);
      break;
    }

    if (!customersToFix || customersToFix.length === 0) {
      console.log("\n✅ No more customers need normalization!");
      break;
    }

    console.log(`   Found ${customersToFix.length} customers to fix in this batch`);

    // Show sample from this batch
    if (batchNumber === 1) {
      console.log("\n📝 Sample customers:");
      customersToFix.slice(0, 5).forEach((c: any) => {
        const normalized = c.phone.replace(/[\s\-\(\)\.]/g, '');
        console.log(`   - ${c.first_name || 'null'} ${c.last_name || 'null'}: "${c.phone}" → "${normalized}"`);
      });
      console.log();
    }

    // Update each customer
    let batchUpdated = 0;
    let batchErrors = 0;

    for (const customer of customersToFix) {
      const normalized = customer.phone.replace(/[\s\-\(\)\.]/g, "");

      const { error } = await supabase
        .from("customers")
        .update({ phone: normalized })
        .eq("id", customer.id);

      if (error) {
        console.error(`   ❌ Failed to update ${customer.first_name} ${customer.last_name}:`, error.message);
        batchErrors++;
        totalErrors++;
      } else {
        batchUpdated++;
        totalUpdated++;
        if (totalUpdated % 100 === 0) {
          console.log(`   ✅ Total updated: ${totalUpdated}...`);
        }
      }
    }

    console.log(`   ✅ Batch ${batchNumber} complete: ${batchUpdated} updated, ${batchErrors} errors\n`);
    batchNumber++;
  }

  console.log("=".repeat(60));
  console.log(`✅ Complete migration finished!`);
  console.log(`   Total Updated: ${totalUpdated}`);
  console.log(`   Total Errors: ${totalErrors}`);
  console.log("=".repeat(60));
  console.log();

  // Verify
  console.log("🔍 Verifying...\n");

  const { count: remaining } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .not("phone", "is", null)
    .or("phone.like.% %,phone.like.%-%,phone.like.%(%,phone.like.%)%,phone.like.%.%");

  if (remaining && remaining > 0) {
    console.log(`⚠️ Warning: ${remaining} customers still have formatting`);
  } else {
    console.log("✅ All phone numbers are now normalized!");
  }

  // Verify specific user
  console.log("\n🔍 Checking Fahad Khan (8283204633)...");
  const { data: fahad } = await supabase
    .from("customers")
    .select("id, first_name, last_name, phone, email")
    .eq("phone", "8283204633")
    .single();

  if (fahad) {
    console.log(`✅ Found: ${fahad.first_name} ${fahad.last_name} - "${fahad.phone}" (${fahad.email})`);
  } else {
    console.log("❌ User not found with normalized phone");
  }
}

normalizeAllPhones().catch(console.error);
