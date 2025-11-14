/**
 * Script to verify loyalty points are being added correctly
 * Run with: npx tsx scripts/check-loyalty-points.ts
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkLoyaltyPoints() {
  console.log("\n📊 Loyalty Points Verification Report\n");
  console.log("=" .repeat(80));

  // 1. Check loyalty program settings
  console.log("\n1️⃣  LOYALTY PROGRAM SETTINGS");
  console.log("-".repeat(80));

  const { data: program } = await supabase
    .from("loyalty_programs")
    .select("*")
    .eq("vendor_id", "cd2e1122-d511-4edb-be5d-98ef274b4baf")
    .single();

  if (program) {
    console.log(`   Name: ${program.name}`);
    console.log(`   Points per Dollar: ${program.points_per_dollar}`);
    console.log(`   Point Value: $${program.point_value}`);
    console.log(`   Min Redemption: ${program.min_redemption_points} points`);
    console.log(`   Active: ${program.is_active ? "✅ Yes" : "❌ No"}`);
  } else {
    console.log("   ⚠️  No loyalty program configured");
  }

  // 2. Check recent POS sales
  console.log("\n2️⃣  RECENT POS SALES (Last 7 days)");
  console.log("-".repeat(80));

  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      created_at,
      total_amount,
      customer_id,
      metadata,
      customers (
        first_name,
        last_name,
        email
      )
    `)
    .eq("vendor_id", "cd2e1122-d511-4edb-be5d-98ef274b4baf")
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(10);

  if (orders && orders.length > 0) {
    for (const order of orders) {
      const customer = order.customers as any;
      const customerName = customer
        ? `${customer.first_name} ${customer.last_name}`
        : "Walk-In";

      const isPOS = order.metadata?.pos_sale;
      const pointsRedeemed = order.metadata?.loyalty_points_redeemed || 0;
      const loyaltyDiscount = order.metadata?.loyalty_discount_amount || 0;

      console.log(`\n   Order: ${order.order_number}`);
      console.log(`   Date: ${new Date(order.created_at).toLocaleString()}`);
      console.log(`   Customer: ${customerName}`);
      console.log(`   Total: $${order.total_amount.toFixed(2)}`);
      console.log(`   POS Sale: ${isPOS ? "✅" : "❌"}`);

      if (pointsRedeemed > 0) {
        console.log(`   Points Redeemed: ${pointsRedeemed} (saved $${loyaltyDiscount})`);
      }

      // Calculate expected points earned
      if (program && order.customer_id) {
        const expectedPoints = Math.floor(order.total_amount * program.points_per_dollar);
        console.log(`   Expected Points Earned: ${expectedPoints}`);
      }
    }
  } else {
    console.log("   No recent sales found");
  }

  // 3. Check customer loyalty balances
  console.log("\n\n3️⃣  CUSTOMER LOYALTY BALANCES");
  console.log("-".repeat(80));

  const { data: loyaltyRecords } = await supabase
    .from("customer_loyalty")
    .select(`
      *,
      customers (
        first_name,
        last_name,
        email
      )
    `)
    .eq("vendor_id", "cd2e1122-d511-4edb-be5d-98ef274b4baf")
    .order("updated_at", { ascending: false })
    .limit(10);

  if (loyaltyRecords && loyaltyRecords.length > 0) {
    for (const record of loyaltyRecords) {
      const customer = record.customers as any;
      const customerName = customer
        ? `${customer.first_name} ${customer.last_name}`
        : "Unknown";

      console.log(`\n   Customer: ${customerName}`);
      console.log(`   Email: ${customer?.email || "N/A"}`);
      console.log(`   Current Balance: ${record.points_balance.toLocaleString()} points`);
      console.log(`   Lifetime Points: ${record.lifetime_points.toLocaleString()} points`);
      console.log(`   Tier: ${record.loyalty_tier}`);
      console.log(`   Last Updated: ${new Date(record.updated_at).toLocaleString()}`);

      if (program) {
        const cashValue = record.points_balance * program.point_value;
        console.log(`   Cash Value: $${cashValue.toFixed(2)}`);
      }
    }
  } else {
    console.log("   No loyalty members found");
  }

  // 4. Check recent loyalty transactions
  console.log("\n\n4️⃣  RECENT LOYALTY TRANSACTIONS");
  console.log("-".repeat(80));

  const { data: transactions } = await supabase
    .from("loyalty_transactions")
    .select(`
      *,
      customers (
        first_name,
        last_name
      ),
      orders (
        order_number
      )
    `)
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(15);

  if (transactions && transactions.length > 0) {
    for (const txn of transactions) {
      const customer = txn.customers as any;
      const customerName = customer
        ? `${customer.first_name} ${customer.last_name}`
        : "Unknown";

      const order = txn.orders as any;
      const orderNumber = order?.order_number || "N/A";

      const typeEmoji = txn.transaction_type === "earned" ? "💰" : "🎁";
      const pointsDisplay = txn.points > 0 ? `+${txn.points}` : txn.points;

      console.log(`\n   ${typeEmoji} ${txn.transaction_type.toUpperCase()}`);
      console.log(`   Date: ${new Date(txn.created_at).toLocaleString()}`);
      console.log(`   Customer: ${customerName}`);
      console.log(`   Points: ${pointsDisplay}`);
      console.log(`   Balance: ${txn.balance_before} → ${txn.balance_after}`);
      console.log(`   Order: ${orderNumber}`);
      console.log(`   Description: ${txn.description}`);
    }
  } else {
    console.log("   No recent transactions found");
  }

  // 5. Verify calculations
  console.log("\n\n5️⃣  VERIFICATION SUMMARY");
  console.log("-".repeat(80));

  if (program && orders && orders.length > 0 && transactions && transactions.length > 0) {
    let issuesFound = false;

    for (const order of orders) {
      if (!order.customer_id) continue;

      const expectedPoints = Math.floor(order.total_amount * program.points_per_dollar);

      // Find matching earned transaction
      const earnedTxn = transactions.find(
        t => t.reference_id === order.id && t.transaction_type === "earned"
      );

      if (earnedTxn) {
        if (earnedTxn.points === expectedPoints) {
          console.log(`   ✅ ${order.order_number}: ${earnedTxn.points} points (correct)`);
        } else {
          console.log(`   ❌ ${order.order_number}: Expected ${expectedPoints}, got ${earnedTxn.points}`);
          issuesFound = true;
        }
      } else {
        console.log(`   ⚠️  ${order.order_number}: No loyalty transaction found`);
        issuesFound = true;
      }
    }

    if (!issuesFound) {
      console.log("\n   🎉 All loyalty points verified correctly!");
    }
  } else {
    console.log("   ⚠️  Insufficient data to verify calculations");
  }

  console.log("\n" + "=".repeat(80) + "\n");
}

checkLoyaltyPoints()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
