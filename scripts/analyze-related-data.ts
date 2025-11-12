import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function analyzeRelatedData() {
  console.log("🔍 Analyzing related data for duplication issues...\n");

  // Check transactions
  const { data: transactions } = await supabase
    .from("transactions")
    .select("customer_id")
    .not("customer_id", "is", null);

  if (transactions) {
    const customerTxCounts = transactions.reduce((acc: any, tx) => {
      acc[tx.customer_id] = (acc[tx.customer_id] || 0) + 1;
      return acc;
    }, {});

    console.log(`📦 Transactions: ${transactions.length} total`);
    console.log(`   Unique customers: ${Object.keys(customerTxCounts).length}`);

    // Find customers with unusually high transaction counts
    const highTxCustomers = Object.entries(customerTxCounts)
      .filter(([_, count]: any) => count > 20)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5);

    if (highTxCustomers.length > 0) {
      console.log("   Top customers by transaction count:");
      for (const [custId, count] of highTxCustomers) {
        const { data: cust } = await supabase
          .from("customers")
          .select("first_name, last_name, phone")
          .eq("id", custId)
          .single();
        console.log(`     ${cust?.first_name} ${cust?.last_name} (${cust?.phone}): ${count} transactions`);
      }
    }
  }

  // Check loyalty_transactions
  const { data: loyaltyTx } = await supabase
    .from("loyalty_transactions")
    .select("customer_id, transaction_type, points");

  if (loyaltyTx) {
    console.log(`\n💎 Loyalty Transactions: ${loyaltyTx.length} total`);

    const customerLoyaltyCount = loyaltyTx.reduce((acc: any, tx) => {
      acc[tx.customer_id] = (acc[tx.customer_id] || 0) + 1;
      return acc;
    }, {});

    console.log(`   Unique customers: ${Object.keys(customerLoyaltyCount).length}`);

    // Check for duplicate point awards
    const pointsAdded = loyaltyTx.filter(tx => tx.transaction_type === 'points_added');
    const pointsRedeemed = loyaltyTx.filter(tx => tx.transaction_type === 'points_redeemed');

    console.log(`   Points added events: ${pointsAdded.length}`);
    console.log(`   Points redeemed events: ${pointsRedeemed.length}`);
  }

  // Check wallet_passes
  const { data: walletPasses } = await supabase
    .from("wallet_passes")
    .select("customer_id, status, created_at");

  if (walletPasses) {
    console.log(`\n🎫 Wallet Passes: ${walletPasses.length} total`);

    const customerPassCount = walletPasses.reduce((acc: any, pass) => {
      acc[pass.customer_id] = (acc[pass.customer_id] || 0) + 1;
      return acc;
    }, {});

    const duplicatePasses = Object.entries(customerPassCount)
      .filter(([_, count]: any) => count > 1);

    console.log(`   Unique customers: ${Object.keys(customerPassCount).length}`);
    console.log(`   Customers with multiple passes: ${duplicatePasses.length}`);

    if (duplicatePasses.length > 0) {
      console.log("\n   ⚠️  Customers with multiple wallet passes:");
      for (const [custId, count] of duplicatePasses.slice(0, 10)) {
        const { data: cust } = await supabase
          .from("customers")
          .select("first_name, last_name, phone")
          .eq("id", custId)
          .single();
        const { data: passes } = await supabase
          .from("wallet_passes")
          .select("serial_number, status, created_at")
          .eq("customer_id", custId);

        console.log(`     ${cust?.first_name} ${cust?.last_name}: ${count} passes`);
        passes?.forEach((p, i) => {
          console.log(`       [${i + 1}] ${p.serial_number} - ${p.status} - ${new Date(p.created_at).toLocaleDateString()}`);
        });
      }
    }
  }

  // Check for orphaned data (data pointing to non-existent customers)
  console.log("\n🔗 Checking data integrity...");

  const { data: allCustomers } = await supabase
    .from("customers")
    .select("id");

  const validCustomerIds = new Set(allCustomers?.map(c => c.id) || []);

  if (transactions) {
    const orphanedTx = transactions.filter(tx => !validCustomerIds.has(tx.customer_id));
    console.log(`   Orphaned transactions: ${orphanedTx.length}`);
  }

  if (loyaltyTx) {
    const orphanedLoyalty = loyaltyTx.filter(tx => !validCustomerIds.has(tx.customer_id));
    console.log(`   Orphaned loyalty transactions: ${orphanedLoyalty.length}`);
  }

  if (walletPasses) {
    const orphanedPasses = walletPasses.filter(p => !validCustomerIds.has(p.customer_id));
    console.log(`   Orphaned wallet passes: ${orphanedPasses.length}`);
  }
}

analyzeRelatedData().catch(console.error);
