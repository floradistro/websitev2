import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testCustomerAPI() {
  console.log("🔍 Testing customer API query logic...\n");

  const vendorId = "cd2e1122-d511-4edb-be5d-98ef274b4baf";
  const page = 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  // Replicate the exact query from the API
  let baseQuery = supabase
    .from("customers")
    .select("*", { count: "exact" })
    .eq("vendor_id", vendorId);

  // Get total count (line 57 of API)
  const { count: totalCount } = await baseQuery;
  console.log(`Total count from first query: ${totalCount}`);

  // Get paginated results (line 60-62 of API) - REUSING baseQuery
  const { data: customers, error } = await baseQuery
    .range(offset, offset + limit - 1)
    .order("loyalty_points", { ascending: false });

  if (error) {
    console.error("❌ Error:", error);
    return;
  }

  console.log(`\nCustomers returned: ${customers?.length || 0}`);

  // Check for duplicates
  const ids = customers?.map(c => c.id) || [];
  const uniqueIds = new Set(ids);

  console.log(`Unique customer IDs: ${uniqueIds.size}`);
  console.log(`Total customer records: ${ids.length}`);

  if (uniqueIds.size !== ids.length) {
    console.log("\n⚠️  DUPLICATES FOUND! Same customer appearing multiple times:");
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    console.log(duplicateIds);
  } else {
    console.log("\n✅ No duplicates in API response");
  }

  // Show first 5 customers
  console.log("\n📋 First 5 customers:");
  customers?.slice(0, 5).forEach((c, i) => {
    console.log(`${i + 1}. ${c.first_name} ${c.last_name} (${c.id.substring(0, 8)}...)`);
  });

  // Now test with a FRESH query (not reusing baseQuery)
  console.log("\n\n🔬 Testing with FRESH query builder...\n");

  const { data: freshCustomers, error: freshError } = await supabase
    .from("customers")
    .select("*")
    .eq("vendor_id", vendorId)
    .range(offset, offset + limit - 1)
    .order("loyalty_points", { ascending: false });

  if (freshError) {
    console.error("❌ Error:", freshError);
    return;
  }

  console.log(`Customers returned: ${freshCustomers?.length || 0}`);

  const freshIds = freshCustomers?.map(c => c.id) || [];
  const uniqueFreshIds = new Set(freshIds);

  console.log(`Unique customer IDs: ${uniqueFreshIds.size}`);
  console.log(`Total customer records: ${freshIds.length}`);

  if (uniqueFreshIds.size !== freshIds.length) {
    console.log("\n⚠️  DUPLICATES FOUND in fresh query too!");
  } else {
    console.log("\n✅ No duplicates with fresh query");
  }
}

testCustomerAPI().catch(console.error);
