import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkPoints() {
  const VENDOR_ID = "cd2e1122-d511-4edb-be5d-98ef274b4baf";

  console.log("🔍 Checking for existing loyalty points in customers table...\n");

  // Check how many customers have loyalty_points > 0 in customers table
  const { count: withPoints } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", VENDOR_ID)
    .gt("loyalty_points", 0);

  console.log(`📊 Customers with loyalty_points > 0 in customers table: ${withPoints || 0}\n`);

  // Get sample customers with points
  const { data: samplesWithPoints } = await supabase
    .from("customers")
    .select("id, email, loyalty_points, loyalty_tier, last_purchase_date")
    .eq("vendor_id", VENDOR_ID)
    .gt("loyalty_points", 0)
    .order("loyalty_points", { ascending: false })
    .limit(15);

  if (samplesWithPoints && samplesWithPoints.length > 0) {
    console.log("Top customers by loyalty points (from customers table):");
    samplesWithPoints.forEach((c) => {
      console.log(
        `  ${c.email?.padEnd(35)}: ${String(c.loyalty_points).padStart(6)} points (tier: ${c.loyalty_tier || "none"})`
      );
    });
  }

  // Check distribution
  const { data: stats } = await supabase
    .from("customers")
    .select("loyalty_points")
    .eq("vendor_id", VENDOR_ID)
    .gt("loyalty_points", 0);

  if (stats && stats.length > 0) {
    const totalPoints = stats.reduce((sum, c) => sum + (c.loyalty_points || 0), 0);
    console.log(`\n📊 Total points in customers table: ${totalPoints.toLocaleString()}`);
    console.log(`📊 Average points per customer: ${Math.round(totalPoints / stats.length)}`);
  }

  // Now check what's in customer_loyalty
  const { data: loyaltyStats } = await supabase
    .from("customer_loyalty")
    .select("points_balance")
    .eq("vendor_id", VENDOR_ID)
    .gt("points_balance", 0);

  const totalLoyaltyPoints = loyaltyStats?.reduce((sum, c) => sum + (c.points_balance || 0), 0) || 0;

  console.log(`\n📊 Total points in customer_loyalty table: ${totalLoyaltyPoints.toLocaleString()}`);
  console.log(
    `📊 Customers with points in customer_loyalty: ${loyaltyStats?.length || 0}\n`
  );

  if ((withPoints || 0) > (loyaltyStats?.length || 0)) {
    console.log("⚠️  WARNING: More customers have points in the customers table than in customer_loyalty!");
    console.log("⚠️  We need to migrate the loyalty_points data from customers to customer_loyalty!");
  }
}

checkPoints()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
