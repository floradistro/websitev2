/**
 * Find user by various methods
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://uaednwpxursknmwdeejn.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findUser() {
  console.log("🔍 Searching for user with phone containing 8283204633...\n");

  // Search by phone with various patterns
  const searches = [
    { pattern: "8283204633", desc: "exact normalized" },
    { pattern: "%828-320-4633%", desc: "formatted with dashes" },
    { pattern: "%(828)%320%4633%", desc: "formatted with parens" },
    { pattern: "%(828) 320-4633%", desc: "formatted standard" },
    { pattern: "%828%320%4633%", desc: "any formatting" },
  ];

  for (const search of searches) {
    const { data, error } = await supabase
      .from("customers")
      .select("id, first_name, last_name, phone, email, vendor_id")
      .ilike("phone", search.pattern)
      .limit(5);

    if (error) {
      console.error(`❌ Error with ${search.desc}:`, error.message);
      continue;
    }

    if (data && data.length > 0) {
      console.log(`✅ Found ${data.length} with "${search.desc}":`);
      data.forEach((c: any) => {
        console.log(`   📱 ${c.first_name || 'null'} ${c.last_name || 'null'}: "${c.phone}" (${c.email || 'no email'}) vendor: ${c.vendor_id}`);
      });
      console.log();
    } else {
      console.log(`❌ No results for "${search.desc}"`);
    }
  }

  // Get total customer count
  const { count: totalCount } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true });

  console.log(`\n📊 Total customers in database: ${totalCount}`);

  // Get count with phone numbers
  const { count: phoneCount } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .not("phone", "is", null);

  console.log(`📊 Customers with phone numbers: ${phoneCount}`);
}

findUser().catch(console.error);
