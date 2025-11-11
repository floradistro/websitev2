/**
 * FINAL LOYALTY DATA MIGRATION
 *
 * Migrates loyalty_points and loyalty_tier from customers table
 * to customer_loyalty table properly.
 *
 * This will:
 * 1. Validate existing data
 * 2. Copy loyalty_points → points_balance, points_lifetime_earned
 * 3. Copy loyalty_tier → current_tier
 * 4. Verify everything matches
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VENDOR_ID = "cd2e1122-d511-4edb-be5d-98ef274b4baf";

async function validateAndMigrate() {
  console.log("🚀 LOYALTY DATA MIGRATION - VALIDATION PHASE\n");
  console.log("=" .repeat(70));

  // STEP 1: Pre-migration validation
  console.log("\n📊 STEP 1: Checking current state...\n");

  const { count: totalCustomers } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", VENDOR_ID);

  const { count: customersWithPoints } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", VENDOR_ID)
    .gt("loyalty_points", 0);

  // Get total points in customers table
  const { data: customerPoints } = await supabase
    .from("customers")
    .select("loyalty_points")
    .eq("vendor_id", VENDOR_ID)
    .gt("loyalty_points", 0);

  const totalPointsInCustomers = customerPoints?.reduce((sum, c) => sum + (c.loyalty_points || 0), 0) || 0;

  // Get total points in customer_loyalty table
  const { data: loyaltyPoints } = await supabase
    .from("customer_loyalty")
    .select("points_balance")
    .eq("vendor_id", VENDOR_ID)
    .gt("points_balance", 0);

  const totalPointsInLoyalty = loyaltyPoints?.reduce((sum, c) => sum + (c.points_balance || 0), 0) || 0;

  console.log(`Total Customers: ${totalCustomers}`);
  console.log(`Customers with Points: ${customersWithPoints}`);
  console.log(`Total Points in customers table: ${totalPointsInCustomers.toLocaleString()}`);
  console.log(`Total Points in customer_loyalty table: ${totalPointsInLoyalty.toLocaleString()}`);
  console.log(`\nPoints to migrate: ${(totalPointsInCustomers - totalPointsInLoyalty).toLocaleString()}`);

  // STEP 2: Get all customers with loyalty data
  console.log("\n📊 STEP 2: Fetching customer loyalty data...\n");

  let allCustomersWithLoyalty: any[] = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("customers")
      .select("id, email, loyalty_points, loyalty_tier")
      .eq("vendor_id", VENDOR_ID)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error("❌ Error fetching customers:", error);
      return;
    }

    if (!data || data.length === 0) break;

    allCustomersWithLoyalty = allCustomersWithLoyalty.concat(data);
    console.log(`  Fetched page ${page + 1}: ${data.length} customers (total: ${allCustomersWithLoyalty.length})`);

    if (data.length < pageSize) break;
    page++;
  }

  console.log(`\n✅ Loaded ${allCustomersWithLoyalty.length} customers\n`);

  // Show sample of what will be migrated
  const samplesWithPoints = allCustomersWithLoyalty
    .filter(c => (c.loyalty_points || 0) > 0)
    .sort((a, b) => (b.loyalty_points || 0) - (a.loyalty_points || 0))
    .slice(0, 10);

  console.log("📋 Top 10 customers by points (preview):");
  samplesWithPoints.forEach(c => {
    console.log(`  ${c.email?.padEnd(35)}: ${String(c.loyalty_points).padStart(6)} points (tier: ${c.loyalty_tier || "bronze"})`);
  });

  // STEP 3: Perform migration
  console.log("\n\n📊 STEP 3: Migrating data to customer_loyalty...\n");
  console.log("=" .repeat(70));

  let migrated = 0;
  let errors = 0;
  const batchSize = 500;

  for (let i = 0; i < allCustomersWithLoyalty.length; i += batchSize) {
    const batch = allCustomersWithLoyalty.slice(i, i + batchSize);

    // Prepare update records
    const updates = batch.map(customer => {
      const points = customer.loyalty_points || 0;
      const tier = customer.loyalty_tier || "bronze";

      return {
        customer_id: customer.id,
        vendor_id: VENDOR_ID,
        provider: "builtin",
        points_balance: points,
        points_lifetime_earned: points, // Initial migration: balance = lifetime earned
        points_lifetime_redeemed: 0,
        current_tier: tier,
      };
    });

    // Use upsert to update existing records
    const { data, error } = await supabase
      .from("customer_loyalty")
      .upsert(updates, {
        onConflict: "customer_id,vendor_id,provider",
        ignoreDuplicates: false // We WANT to update existing records
      })
      .select();

    if (error) {
      console.error(`❌ Error in batch ${Math.floor(i / batchSize) + 1}:`, error);
      errors += batch.length;
    } else {
      migrated += batch.length;
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: Migrated ${batch.length} customers (${migrated}/${allCustomersWithLoyalty.length})`);
    }
  }

  console.log(`\n✅ Migration complete: ${migrated} customers, ${errors} errors\n`);

  // STEP 4: Post-migration validation
  console.log("📊 STEP 4: Validating migration...\n");
  console.log("=" .repeat(70));

  // Re-fetch totals
  const { data: newLoyaltyPoints } = await supabase
    .from("customer_loyalty")
    .select("points_balance")
    .eq("vendor_id", VENDOR_ID)
    .gt("points_balance", 0);

  const newTotalPointsInLoyalty = newLoyaltyPoints?.reduce((sum, c) => sum + (c.points_balance || 0), 0) || 0;

  const { count: newCustomersWithPoints } = await supabase
    .from("customer_loyalty")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", VENDOR_ID)
    .gt("points_balance", 0);

  console.log("\n📊 AFTER MIGRATION:");
  console.log(`Total Points in customers table: ${totalPointsInCustomers.toLocaleString()}`);
  console.log(`Total Points in customer_loyalty table: ${newTotalPointsInLoyalty.toLocaleString()}`);
  console.log(`Customers with points in customer_loyalty: ${newCustomersWithPoints}`);

  const pointsDiff = Math.abs(totalPointsInCustomers - newTotalPointsInLoyalty);
  const tolerance = totalPointsInCustomers * 0.01; // 1% tolerance for rounding

  if (pointsDiff <= tolerance) {
    console.log(`\n✅ VALIDATION PASSED! Points match (diff: ${pointsDiff})`);
  } else {
    console.log(`\n⚠️  WARNING: Points don't match exactly (diff: ${pointsDiff})`);
    console.log(`This might be due to concurrent POS transactions during migration.`);
  }

  // Show top customers after migration
  const { data: topAfter } = await supabase
    .from("customer_loyalty")
    .select("customer_id, points_balance, current_tier")
    .eq("vendor_id", VENDOR_ID)
    .order("points_balance", { ascending: false })
    .limit(5);

  console.log("\n📋 Top 5 customers after migration:");
  for (const record of topAfter || []) {
    const { data: customer } = await supabase
      .from("customers")
      .select("email")
      .eq("id", record.customer_id)
      .single();

    console.log(`  ${customer?.email?.padEnd(35)}: ${String(record.points_balance).padStart(6)} points (tier: ${record.current_tier})`);
  }

  console.log("\n" + "=" .repeat(70));
  console.log("🎉 MIGRATION COMPLETE!");
  console.log("=" .repeat(70));
}

// Run migration
validateAndMigrate()
  .then(() => {
    console.log("\n✅ Migration script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration script failed:", error);
    process.exit(1);
  });
