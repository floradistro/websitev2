import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkCustomerData() {
  const VENDOR_ID = "cd2e1122-d511-4edb-be5d-98ef274b4baf";

  console.log("🔍 Checking customer data for loyalty info...\n");

  // Get sample customers to see what data they have
  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .eq("vendor_id", VENDOR_ID)
    .limit(20);

  if (customers && customers.length > 0) {
    console.log("📋 Sample customer record structure:");
    console.log("Keys:", Object.keys(customers[0]));
    console.log("\n");

    // Check if customers have Alpine IQ loyalty data in metadata
    let customersWithMetadata = 0;
    let customersWithAlpineIQ = 0;
    let sampleAlpineIQData: any = null;

    customers.forEach((c) => {
      if (c.metadata) {
        customersWithMetadata++;
        if (c.metadata.alpineiq_member_id || c.metadata.alpineiq_points) {
          customersWithAlpineIQ++;
          if (!sampleAlpineIQData) {
            sampleAlpineIQData = { ...c.metadata, customer_email: c.email };
          }
        }
      }
    });

    console.log(`📊 Out of 20 sample customers:`);
    console.log(`  - ${customersWithMetadata} have metadata`);
    console.log(`  - ${customersWithAlpineIQ} have Alpine IQ data in metadata\n`);

    if (sampleAlpineIQData) {
      console.log("❗ Sample customer with Alpine IQ data:");
      console.log(JSON.stringify(sampleAlpineIQData, null, 2));
    }
  }

  // Check what we created in customer_loyalty
  const { data: loyaltyRecords } = await supabase
    .from("customer_loyalty")
    .select("*")
    .eq("vendor_id", VENDOR_ID)
    .order("created_at", { ascending: false })
    .limit(5);

  console.log("\n📋 Sample loyalty records we created (most recent):");
  loyaltyRecords?.forEach((record, idx) => {
    console.log(`\nRecord ${idx + 1}:`);
    console.log(`  Points Balance: ${record.points_balance}`);
    console.log(`  Lifetime Earned: ${record.points_lifetime_earned}`);
    console.log(`  Current Tier: ${record.current_tier}`);
    console.log(`  Provider: ${record.provider}`);
    console.log(`  Alpine IQ ID: ${record.alpineiq_customer_id || "none"}`);
  });

  // Check if ANY customers have points > 0
  const { count: withPointsCount } = await supabase
    .from("customer_loyalty")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", VENDOR_ID)
    .gt("points_balance", 0);

  const { data: withPoints } = await supabase
    .from("customer_loyalty")
    .select("points_balance, customer_id")
    .eq("vendor_id", VENDOR_ID)
    .gt("points_balance", 0)
    .limit(10);

  console.log(`\n\n📊 Total customers with points > 0: ${withPointsCount || 0}`);
  if (withPoints && withPoints.length > 0) {
    console.log("Sample customers with points:");
    withPoints.forEach((r) => {
      console.log(`  Customer ${r.customer_id}: ${r.points_balance} points`);
    });
  } else {
    console.log("⚠️  NO CUSTOMERS HAVE ANY POINTS!");
  }

  // Summary
  console.log("\n\n" + "=".repeat(60));
  console.log("📊 SUMMARY");
  console.log("=".repeat(60));

  const { count: totalCustomers } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", VENDOR_ID);

  const { count: totalLoyalty } = await supabase
    .from("customer_loyalty")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", VENDOR_ID);

  console.log(`Total Customers: ${totalCustomers}`);
  console.log(`Total Loyalty Records: ${totalLoyalty}`);
  console.log(`Customers with Points: ${withPointsCount || 0}`);
  console.log(`Migration Complete: ${totalCustomers === totalLoyalty ? "✅" : "❌"}`);

  if (customersWithAlpineIQ > 0 && (!withPointsCount || withPointsCount === 0)) {
    console.log("\n⚠️  WARNING: Customers have Alpine IQ data but loyalty records have 0 points!");
    console.log("We may need to migrate the Alpine IQ points data!");
  }
}

checkCustomerData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
