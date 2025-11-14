/**
 * Check if the PO receiving fix migration has been applied
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMigration() {
  console.log("🔍 Checking if PO receiving fix migration is applied...\n");

  // Check the function definition
  const { data: functionDef, error } = await supabase.rpc("pg_get_functiondef", {
    func_oid: "receive_purchase_order_items"::regproc::oid,
  }).single();

  if (error) {
    console.log("❌ Error fetching function definition:", error.message);
    console.log("\nTrying alternate method...\n");

    // Try getting function source another way
    const { data: functions, error: funcError } = await supabase
      .from("pg_proc")
      .select("proname, prosrc")
      .eq("proname", "receive_purchase_order_items")
      .single();

    if (funcError) {
      console.error("❌ Cannot check function:", funcError.message);
      console.log("\n📋 Please manually check in Supabase SQL Editor:");
      console.log("   Run: SELECT prosrc FROM pg_proc WHERE proname = 'receive_purchase_order_items';");
      return;
    }

    console.log("✅ Function exists");

    // Check if it contains the fix
    const hasPOItemUpdate = functions.prosrc.includes("UPDATE purchase_order_items");
    const hasPOStatusUpdate = functions.prosrc.includes("UPDATE purchase_orders");
    const hasQuantityReceived = functions.prosrc.includes("quantity_received");

    console.log("\n📊 Migration Status Check:");
    console.log(`   ${hasPOItemUpdate ? "✅" : "❌"} Updates purchase_order_items`);
    console.log(`   ${hasPOStatusUpdate ? "✅" : "❌"} Updates purchase_orders status`);
    console.log(`   ${hasQuantityReceived ? "✅" : "❌"} Sets quantity_received field`);

    if (hasPOItemUpdate && hasPOStatusUpdate && hasQuantityReceived) {
      console.log("\n✅ Migration appears to be applied correctly!");
    } else {
      console.log("\n❌ Migration NOT applied or incomplete.");
      console.log("\n📝 Action Required:");
      console.log("   1. Go to Supabase Dashboard → SQL Editor");
      console.log("   2. Copy contents of: supabase/migrations/20251114000003_fix_po_receiving_updates.sql");
      console.log("   3. Paste and run the SQL");
    }

    return;
  }

  // If we got function def successfully
  const hasPOItemUpdate = functionDef.includes("UPDATE purchase_order_items");
  const hasPOStatusUpdate = functionDef.includes("UPDATE purchase_orders");
  const hasQuantityReceived = functionDef.includes("quantity_received");

  console.log("📊 Migration Status Check:");
  console.log(`   ${hasPOItemUpdate ? "✅" : "❌"} Updates purchase_order_items`);
  console.log(`   ${hasPOStatusUpdate ? "✅" : "❌"} Updates purchase_orders status`);
  console.log(`   ${hasQuantityReceived ? "✅" : "❌"} Sets quantity_received field`);

  if (hasPOItemUpdate && hasPOStatusUpdate && hasQuantityReceived) {
    console.log("\n✅ Migration HAS been applied correctly!");
  } else {
    console.log("\n❌ Migration NOT applied or incomplete.");
    console.log("\n📝 Action Required:");
    console.log("   1. Go to Supabase Dashboard → SQL Editor");
    console.log("   2. Copy contents of: supabase/migrations/20251114000003_fix_po_receiving_updates.sql");
    console.log("   3. Paste and run the SQL");
  }
}

checkMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
