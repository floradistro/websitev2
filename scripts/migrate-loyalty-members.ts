/**
 * Migrate all existing customers to the loyalty program
 * This creates customer_loyalty records for everyone who doesn't have one
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateCustomersToLoyalty() {
  console.log("🚀 Starting loyalty member migration...\n");

  const VENDOR_ID = "cd2e1122-d511-4edb-be5d-98ef274b4baf"; // Yacht Club

  // Step 1: Get all customers (with pagination - Supabase default limit is 1000)
  console.log("📊 Fetching all customers...");

  let allCustomers: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("customers")
      .select("id, email, metadata")
      .eq("vendor_id", VENDOR_ID)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error("❌ Error fetching customers:", error);
      return;
    }

    if (data && data.length > 0) {
      allCustomers = allCustomers.concat(data);
      console.log(`  Fetched page ${page + 1}: ${data.length} customers (total: ${allCustomers.length})`);
      hasMore = data.length === pageSize;
      page++;
    } else {
      hasMore = false;
    }
  }

  console.log(`✅ Found ${allCustomers.length} total customers\n`);

  // Step 2: Get existing loyalty members
  console.log("📊 Checking existing loyalty members...");
  const { data: existingLoyalty, error: loyaltyError } = await supabase
    .from("customer_loyalty")
    .select("*")
    .eq("vendor_id", VENDOR_ID)
    .limit(1);

  if (loyaltyError) {
    console.error("❌ Error fetching loyalty members:", loyaltyError);
    return;
  }

  // Log the schema to see what columns exist
  if (existingLoyalty && existingLoyalty.length > 0) {
    console.log("📋 Sample loyalty record columns:", Object.keys(existingLoyalty[0]));
  }

  // Get all existing customer IDs
  const { data: allExisting } = await supabase
    .from("customer_loyalty")
    .select("customer_id")
    .eq("vendor_id", VENDOR_ID);

  const existingCustomerIds = new Set(allExisting?.map((l) => l.customer_id) || []);
  console.log(`✅ Found ${existingCustomerIds.size} existing loyalty members\n`);

  // Step 3: Filter customers who need loyalty accounts
  const customersToMigrate = allCustomers.filter((c) => !existingCustomerIds.has(c.id));
  console.log(
    `🔄 Need to create loyalty accounts for ${customersToMigrate.length} customers\n`,
  );

  if (customersToMigrate.length === 0) {
    console.log("✅ All customers already have loyalty accounts!");
    return;
  }

  // Step 4: Batch insert loyalty records
  console.log("💾 Creating loyalty accounts in batches of 500...");

  const batchSize = 500;
  let created = 0;
  let errors = 0;

  for (let i = 0; i < customersToMigrate.length; i += batchSize) {
    const batch = customersToMigrate.slice(i, i + batchSize);

    const loyaltyRecords = batch.map((customer) => ({
      customer_id: customer.id,
      vendor_id: VENDOR_ID,
      points_balance: 0,
      points_lifetime_earned: 0,
      points_lifetime_redeemed: 0,
      current_tier: "bronze",
    }));

    const { error: insertError } = await supabase
      .from("customer_loyalty")
      .insert(loyaltyRecords);

    if (insertError) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, insertError);
      errors += batch.length;
    } else {
      created += batch.length;
      console.log(
        `✅ Batch ${i / batchSize + 1}: Created ${batch.length} loyalty accounts (${created}/${customersToMigrate.length})`,
      );
    }
  }

  console.log(`\n🎉 Migration complete!`);
  console.log(`✅ Created: ${created} loyalty accounts`);
  console.log(`❌ Errors: ${errors}`);
  console.log(
    `📊 Total loyalty members: ${existingCustomerIds.size + created}`,
  );
}

// Run migration
migrateCustomersToLoyalty()
  .then(() => {
    console.log("\n✅ Migration script completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration script failed:", error);
    process.exit(1);
  });
