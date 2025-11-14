/**
 * Debug a recent order to see why loyalty points weren't added
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugRecentOrder() {
  // Get the most recent order
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", "CHA-20251114-985309")
    .single();

  if (!order) {
    console.log("Order not found");
    return;
  }

  console.log("\n🔍 Order Debug Info:");
  console.log("Order Number:", order.order_number);
  console.log("Customer ID:", order.customer_id || "❌ MISSING");
  console.log("Vendor ID:", order.vendor_id);
  console.log("Total Amount:", order.total_amount);
  console.log("Created At:", order.created_at);
  console.log("\nMetadata:", JSON.stringify(order.metadata, null, 2));

  if (order.customer_id) {
    // Check if loyalty record exists
    const { data: loyalty } = await supabase
      .from("customer_loyalty")
      .select("*")
      .eq("customer_id", order.customer_id)
      .eq("vendor_id", order.vendor_id)
      .single();

    console.log("\n💳 Customer Loyalty Record:");
    if (loyalty) {
      console.log("  Points Balance:", loyalty.points_balance);
      console.log("  Lifetime Points:", loyalty.lifetime_points);
      console.log("  Last Updated:", loyalty.updated_at);
    } else {
      console.log("  ❌ No loyalty record found");
    }

    // Check for transactions
    const { data: transactions } = await supabase
      .from("loyalty_transactions")
      .select("*")
      .eq("reference_id", order.id)
      .eq("reference_type", "order");

    console.log("\n📝 Loyalty Transactions:");
    if (transactions && transactions.length > 0) {
      for (const txn of transactions) {
        console.log(`  - ${txn.transaction_type}: ${txn.points} points`);
        console.log(`    Description: ${txn.description}`);
        console.log(`    Created: ${txn.created_at}`);
      }
    } else {
      console.log("  ❌ No transactions found for this order");
    }
  }
}

debugRecentOrder().catch(console.error);
