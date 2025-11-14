/**
 * Final comprehensive loyalty points verification
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const VENDOR_ID = "cd2e1122-d511-4edb-be5d-98ef274b4baf";

async function generateReport() {
  console.log("\n" + "=".repeat(80));
  console.log("🎯 LOYALTY POINTS VERIFICATION - COMPLETE REPORT");
  console.log("=".repeat(80) + "\n");

  // 1. Loyalty Program Settings
  const { data: program } = await supabase
    .from("loyalty_programs")
    .select("*")
    .eq("vendor_id", VENDOR_ID)
    .single();

  console.log("📋 PROGRAM SETTINGS");
  console.log("-".repeat(80));
  console.log(`   Name: ${program?.name || "N/A"}`);
  console.log(`   Points per $1: ${program?.points_per_dollar || 1}`);
  console.log(`   Point Value: $${program?.point_value || 0.01}`);
  console.log(`   Min Redemption: ${program?.min_redemption_points || 100} points`);
  console.log(`   Active: ${program?.is_active ? "✅ YES" : "❌ NO"}\n`);

  // 2. Recent transactions (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: transactions } = await supabase
    .from("loyalty_transactions")
    .select("*")
    .gte("created_at", sevenDaysAgo)
    .order("created_at", { ascending: false });

  console.log("📊 TRANSACTION SUMMARY (Last 7 Days)");
  console.log("-".repeat(80));
  console.log(`   Total Transactions: ${transactions?.length || 0}`);

  if (transactions && transactions.length > 0) {
    const earned = transactions.filter(t => t.transaction_type === "earned");
    const redeemed = transactions.filter(t => t.transaction_type === "redeemed");

    const totalPointsEarned = earned.reduce((sum, t) => sum + t.points, 0);
    const totalPointsRedeemed = redeemed.reduce((sum, t) => sum + Math.abs(t.points), 0);

    console.log(`   Points Earned: ${totalPointsEarned.toLocaleString()}`);
    console.log(`   Points Redeemed: ${totalPointsRedeemed.toLocaleString()}`);
    console.log(`   Net Change: ${(totalPointsEarned - totalPointsRedeemed).toLocaleString()}\n`);

    // Get orders for these transactions
    const orderIds = [...new Set(transactions.map(t => t.reference_id))];
    const { data: orders } = await supabase
      .from("orders")
      .select("id, order_number, total_amount, customer_id")
      .in("id", orderIds);

    const orderMap = new Map(orders?.map(o => [o.id, o]) || []);

    console.log("📝 RECENT TRANSACTIONS");
    console.log("-".repeat(80));

    // Get customer names
    const customerIds = [...new Set(transactions.map(t => t.customer_id))];
    const { data: customers } = await supabase
      .from("customers")
      .select("id, first_name, last_name")
      .in("id", customerIds);

    const customerMap = new Map(
      customers?.map(c => [c.id, `${c.first_name} ${c.last_name}`]) || []
    );

    for (const txn of transactions.slice(0, 15)) {
      const order = orderMap.get(txn.reference_id);
      const customerName = customerMap.get(txn.customer_id) || "Unknown";
      const typeIcon = txn.transaction_type === "earned" ? "💰" : "🎁";
      const pointsDisplay = txn.points >= 0 ? `+${txn.points}` : txn.points;

      console.log(`\n   ${typeIcon} ${txn.transaction_type.toUpperCase()}`);
      console.log(`      Customer: ${customerName}`);
      console.log(`      Order: ${order?.order_number || "N/A"}`);
      console.log(`      Points: ${pointsDisplay} (${txn.balance_before} → ${txn.balance_after})`);
      console.log(`      Date: ${new Date(txn.created_at).toLocaleString()}`);

      if (order && program && txn.transaction_type === "earned") {
        const expectedPoints = Math.floor(order.total_amount * program.points_per_dollar);
        const isCorrect = txn.points === expectedPoints;
        console.log(`      Expected: ${expectedPoints} points ${isCorrect ? "✅" : "❌"}`);
      }
    }
  } else {
    console.log("   ❌ No transactions found\n");
  }

  // 3. Verification - check last 5 orders with customers
  console.log("\n\n🔍 VERIFICATION CHECK");
  console.log("-".repeat(80));

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("*")
    .eq("vendor_id", VENDOR_ID)
    .not("customer_id", "is", null)
    .gte("created_at", sevenDaysAgo)
    .order("created_at", { ascending: false })
    .limit(5);

  if (recentOrders && recentOrders.length > 0) {
    let allCorrect = true;

    for (const order of recentOrders) {
      const expectedPoints = Math.floor(order.total_amount * (program?.points_per_dollar || 1));

      // Find matching transaction
      const txn = transactions?.find(
        t => t.reference_id === order.id && t.transaction_type === "earned"
      );

      if (txn) {
        const isCorrect = txn.points === expectedPoints;
        const status = isCorrect ? "✅" : "❌";
        console.log(`   ${status} ${order.order_number}: $${order.total_amount.toFixed(2)} → ${txn.points} points (expected ${expectedPoints})`);
        if (!isCorrect) allCorrect = false;
      } else {
        console.log(`   ⚠️  ${order.order_number}: No loyalty transaction found!`);
        allCorrect = false;
      }
    }

    console.log();
    if (allCorrect) {
      console.log("   🎉 All loyalty points calculated correctly!");
    } else {
      console.log("   ⚠️  Some discrepancies found - review above");
    }
  } else {
    console.log("   No recent orders with customers to verify");
  }

  // 4. Top loyalty members
  console.log("\n\n👥 TOP LOYALTY MEMBERS");
  console.log("-".repeat(80));

  const { data: topMembers } = await supabase
    .from("customer_loyalty")
    .select(`
      *,
      customers (
        first_name,
        last_name,
        email
      )
    `)
    .eq("vendor_id", VENDOR_ID)
    .order("points_balance", { ascending: false })
    .limit(5);

  if (topMembers && topMembers.length > 0) {
    for (let i = 0; i < topMembers.length; i++) {
      const member = topMembers[i];
      const customer = member.customers as any;
      const name = customer ? `${customer.first_name} ${customer.last_name}` : "Unknown";
      const cashValue = member.points_balance * (program?.point_value || 0.01);

      console.log(`\n   ${i + 1}. ${name}`);
      console.log(`      Balance: ${member.points_balance.toLocaleString()} points ($${cashValue.toFixed(2)})`);
      console.log(`      Lifetime: ${member.lifetime_points.toLocaleString()} points`);
      console.log(`      Tier: ${member.loyalty_tier || "None"}`);
    }
  }

  console.log("\n" + "=".repeat(80) + "\n");
}

generateReport().catch(console.error);
