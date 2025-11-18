/**
 * BULK migration using SQL - normalizes ALL phones in one query
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://uaednwpxursknmwdeejn.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function bulkNormalize() {
  console.log("🚀 Starting BULK phone normalization via SQL...\n");

  // Check how many need fixing
  const { count: beforeCount } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .not("phone", "is", null)
    .or("phone.like.% %,phone.like.%-%,phone.like.%(%,phone.like.%)%,phone.like.%.%");

  console.log(`📊 Customers with formatted phones: ${beforeCount}\n`);

  // Execute bulk SQL update
  console.log("⚡ Executing bulk SQL update...");
  const startTime = Date.now();

  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `
      UPDATE customers
      SET phone = REGEXP_REPLACE(phone, '[\\s\\-\\(\\)\\.]+', '', 'g')
      WHERE phone IS NOT NULL
        AND phone ~ '[\\s\\-\\(\\)\\.]'
      RETURNING id;
    `
  });

  if (error) {
    // Try alternative method using raw SQL
    console.log("⚠️ RPC method not available, trying direct update...\n");

    const { error: updateError } = await supabase
      .from('customers')
      .update({
        phone: supabase.sql`REGEXP_REPLACE(phone, '[\\s\\-\\(\\)\\.]+', '', 'g')`
      })
      .not('phone', 'is', null)
      .filter('phone', 'match', '[\\s\\-\\(\\)\\.]');

    if (updateError) {
      console.error("❌ Update failed:", updateError);
      console.log("\n💡 Falling back to batch processing...");
      return false;
    }
  }

  const duration = Date.now() - startTime;
  console.log(`✅ Bulk update completed in ${duration}ms\n`);

  // Verify
  const { count: afterCount } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .not("phone", "is", null)
    .or("phone.like.% %,phone.like.%-%,phone.like.%(%,phone.like.%)%,phone.like.%.%");

  console.log("=".repeat(60));
  console.log(`✅ Migration complete!`);
  console.log(`   Before: ${beforeCount} with formatting`);
  console.log(`   After: ${afterCount} with formatting`);
  console.log(`   Fixed: ${beforeCount - afterCount}`);
  console.log("=".repeat(60));
  console.log();

  // Verify user
  console.log("🔍 Checking Fahad Khan (8283204633)...");
  const { data: fahad } = await supabase
    .from("customers")
    .select("id, first_name, last_name, phone, email")
    .eq("phone", "8283204633")
    .maybeSingle();

  if (fahad) {
    console.log(`✅ Found: ${fahad.first_name} ${fahad.last_name} - "${fahad.phone}" (${fahad.email})`);
  } else {
    console.log("❌ User not found with normalized phone - checking original format...");
    const { data: fahadOld } = await supabase
      .from("customers")
      .select("id, first_name, last_name, phone, email")
      .ilike("phone", "%(828) 320-4633%")
      .maybeSingle();

    if (fahadOld) {
      console.log(`⚠️ Still has old format: "${fahadOld.phone}"`);
    }
  }

  return true;
}

bulkNormalize().catch(console.error);
