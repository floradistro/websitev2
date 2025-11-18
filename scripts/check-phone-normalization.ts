/**
 * Check what phone numbers actually look like in database
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://uaednwpxursknmwdeejn.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPhones() {
  console.log("🔍 Checking actual phone numbers in database...\n");

  // Get sample of phone numbers
  const { data: sample, error } = await supabase
    .from("customers")
    .select("id, first_name, last_name, phone")
    .not("phone", "is", null)
    .limit(20);

  if (error) {
    console.error("❌ Error:", error);
    return;
  }

  console.log("📱 Sample phone numbers:");
  sample?.forEach((c: any) => {
    const hasFormatting = /[\s\-\(\)\.]/.test(c.phone);
    const icon = hasFormatting ? "❌" : "✅";
    console.log(`   ${icon} ${c.first_name || 'null'} ${c.last_name || 'null'}: "${c.phone}" (${c.phone.length} chars)`);
  });

  console.log("\n🔍 Looking for user's number 8283204633...");

  const { data: userPhone, error: userError } = await supabase
    .from("customers")
    .select("id, first_name, last_name, phone, email")
    .or("phone.like.%828%,phone.like.%4633%")
    .limit(10);

  if (userError) {
    console.error("❌ Error:", userError);
    return;
  }

  if (userPhone && userPhone.length > 0) {
    console.log(`\n📱 Found ${userPhone.length} customers with 828 or 4633:`);
    userPhone.forEach((c: any) => {
      const matches = c.phone.includes("8283204633");
      const icon = matches ? "🎯" : "📱";
      console.log(`   ${icon} ${c.first_name || 'null'} ${c.last_name || 'null'}: "${c.phone}" (${c.email || 'no email'})`);
    });
  } else {
    console.log("   ❌ No customers found with those digits");
  }

  // Check total with formatting
  const { count } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .not("phone", "is", null)
    .or("phone.like.% %,phone.like.%-%,phone.like.%(%,phone.like.%)%,phone.like.%.%");

  console.log(`\n📊 Total customers with formatting characters: ${count}`);
}

checkPhones().catch(console.error);
