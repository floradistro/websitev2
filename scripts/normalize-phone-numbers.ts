/**
 * One-time migration: Normalize all phone numbers in customers table
 * Removes ALL formatting: spaces, dashes, parentheses, periods
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://uaednwpxursknmwdeejn.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function normalizePhoneNumbers() {
  console.log("🔍 Step 1: Checking for phone numbers with formatting...\n");

  // Get all customers with phones that have formatting
  const { data: customersToFix, error: checkError } = await supabase
    .from("customers")
    .select("id, first_name, last_name, phone, vendor_id")
    .not("phone", "is", null)
    .or("phone.like.% %,phone.like.%-%,phone.like.%(%,phone.like.%)%,phone.like.%.%");

  if (checkError) {
    console.error("❌ Error checking customers:", checkError);
    return;
  }

  console.log(`📊 Found ${customersToFix?.length || 0} customers with formatted phone numbers\n`);

  if (!customersToFix || customersToFix.length === 0) {
    console.log("✅ No customers need phone normalization!");
    return;
  }

  console.log("📝 Sample customers to fix:");
  customersToFix.slice(0, 5).forEach((c: any) => {
    console.log(`   - ${c.first_name} ${c.last_name}: "${c.phone}" → "${c.phone.replace(/[\s\-\(\)\.]/g, '')}"`);
  });
  console.log();

  console.log("🔧 Step 2: Normalizing phone numbers...\n");

  let updated = 0;
  let errors = 0;

  for (const customer of customersToFix) {
    const normalized = customer.phone.replace(/[\s\-\(\)\.]/g, "");

    const { error } = await supabase
      .from("customers")
      .update({ phone: normalized })
      .eq("id", customer.id);

    if (error) {
      console.error(`   ❌ Failed to update ${customer.first_name} ${customer.last_name}:`, error.message);
      errors++;
    } else {
      updated++;
      if (updated % 10 === 0) {
        console.log(`   ✅ Updated ${updated} of ${customersToFix.length}...`);
      }
    }
  }

  console.log();
  console.log("=".repeat(60));
  console.log(`✅ Migration complete!`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Total: ${customersToFix.length}`);
  console.log("=".repeat(60));
  console.log();

  // Verify the fix
  console.log("🔍 Step 3: Verifying fix...\n");

  const { data: remaining, error: verifyError } = await supabase
    .from("customers")
    .select("id, phone")
    .not("phone", "is", null)
    .or("phone.like.% %,phone.like.%-%,phone.like.%(%,phone.like.%)%,phone.like.%.%");

  if (verifyError) {
    console.error("❌ Error verifying:", verifyError);
    return;
  }

  if (remaining && remaining.length > 0) {
    console.log(`⚠️ Warning: ${remaining.length} customers still have formatting`);
  } else {
    console.log("✅ All phone numbers are now normalized!");
  }
}

normalizePhoneNumbers().catch(console.error);
