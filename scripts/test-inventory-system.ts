/**
 * TEST INVENTORY SYSTEM
 * Tests all features:
 * 1. Atomic transactions
 * 2. Optimistic updates
 * 3. Bulk operations
 * 4. Edge cases (float precision, negative inventory prevention)
 */

import axios from "axios";

const VENDOR_ID = "cd2e1122-d511-4edb-be5d-98ef274b4baf";
const API_BASE = "http://localhost:3000/api/vendor";

// Test data from database
const TEST_DATA = {
  productId: "962e4aea-8fa4-4994-8d85-86d9e6daa2b7", // Orange Candy Crush
  inventoryId: "13309fbd-0fe1-44fd-8fa6-1515b8856b76",
  locationId: "c4eedafb-4050-4d2d-a6af-e164aad5d934", // Charlotte Central
  currentQuantity: 8.0,
};

async function testAtomicAdjustment() {
  console.log("\n🧪 TEST 1: Atomic Adjustment with Transaction Logging");
  console.log("===============================================");

  try {
    // Add 3.5g (⅛oz)
    const response = await axios.post(
      `${API_BASE}/inventory/adjust`,
      {
        inventoryId: TEST_DATA.inventoryId,
        productId: TEST_DATA.productId,
        locationId: TEST_DATA.locationId,
        adjustment: 3.5,
        reason: "Test: Adding ⅛oz for atomic transaction test",
      },
      {
        headers: { "x-vendor-id": VENDOR_ID },
      }
    );

    console.log("✅ Adjustment successful:");
    console.log("   Previous:", response.data.previous_quantity, "g");
    console.log("   Change: +3.5g");
    console.log("   New:", response.data.new_quantity, "g");

    // Verify transaction was logged
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: transactions } = await supabase
      .from("inventory_transactions")
      .select("*")
      .eq("inventory_id", TEST_DATA.inventoryId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (transactions && transactions.length > 0) {
      console.log("\n✅ Transaction logged atomically:");
      console.log("   Type:", transactions[0].transaction_type);
      console.log("   Before:", transactions[0].quantity_before, "g");
      console.log("   Change:", transactions[0].quantity_change, "g");
      console.log("   After:", transactions[0].quantity_after, "g");
      console.log("   Reason:", transactions[0].reason);
    } else {
      console.log("❌ No transaction record found!");
    }

    // Rollback - remove the 3.5g we added
    await axios.post(
      `${API_BASE}/inventory/adjust`,
      {
        inventoryId: TEST_DATA.inventoryId,
        productId: TEST_DATA.productId,
        locationId: TEST_DATA.locationId,
        adjustment: -3.5,
        reason: "Test rollback",
      },
      {
        headers: { "x-vendor-id": VENDOR_ID },
      }
    );
    console.log("\n✅ Rolled back test adjustment");

    return true;
  } catch (error: any) {
    console.error("❌ Test failed:", error.response?.data || error.message);
    return false;
  }
}

async function testFloatPrecision() {
  console.log("\n🧪 TEST 2: Float Precision (0.1 + 0.2 = 0.3?)");
  console.log("===============================================");

  try {
    // Add 0.1g three times, then remove 0.3g - should be back to original
    const originalQty = 8.0;

    for (let i = 0; i < 3; i++) {
      await axios.post(
        `${API_BASE}/inventory/adjust`,
        {
          inventoryId: TEST_DATA.inventoryId,
          productId: TEST_DATA.productId,
          locationId: TEST_DATA.locationId,
          adjustment: 0.1,
          reason: `Float test: iteration ${i + 1}`,
        },
        {
          headers: { "x-vendor-id": VENDOR_ID },
        }
      );
    }

    // Now remove 0.3g
    const response = await axios.post(
      `${API_BASE}/inventory/adjust`,
      {
        inventoryId: TEST_DATA.inventoryId,
        productId: TEST_DATA.productId,
        locationId: TEST_DATA.locationId,
        adjustment: -0.3,
        reason: "Float test: remove 0.3g",
      },
      {
        headers: { "x-vendor-id": VENDOR_ID },
      }
    );

    const finalQty = response.data.new_quantity;
    const expectedQty = originalQty;
    const diff = Math.abs(finalQty - expectedQty);

    if (diff < 0.001) {
      console.log("✅ Float precision handled correctly!");
      console.log(`   Final: ${finalQty}g, Expected: ${expectedQty}g, Diff: ${diff}g`);
    } else {
      console.log("❌ Float precision issue detected!");
      console.log(`   Final: ${finalQty}g, Expected: ${expectedQty}g, Diff: ${diff}g`);
    }

    return diff < 0.001;
  } catch (error: any) {
    console.error("❌ Test failed:", error.response?.data || error.message);
    return false;
  }
}

async function testNegativeInventoryPrevention() {
  console.log("\n🧪 TEST 3: Negative Inventory Prevention");
  console.log("===============================================");

  try {
    // Try to remove more than available
    await axios.post(
      `${API_BASE}/inventory/adjust`,
      {
        inventoryId: TEST_DATA.inventoryId,
        productId: TEST_DATA.productId,
        locationId: TEST_DATA.locationId,
        adjustment: -1000, // Way more than available
        reason: "Test: Attempting negative inventory",
      },
      {
        headers: { "x-vendor-id": VENDOR_ID },
      }
    );

    console.log("❌ System allowed negative inventory (BAD!)");
    return false;
  } catch (error: any) {
    if (error.response?.status === 400 && error.response?.data?.error?.includes("below 0")) {
      console.log("✅ Negative inventory correctly prevented!");
      console.log("   Error:", error.response.data.error);
      return true;
    } else {
      console.error("❌ Unexpected error:", error.response?.data || error.message);
      return false;
    }
  }
}

async function testBulkZeroOut() {
  console.log("\n🧪 TEST 4: Bulk Zero-Out Operation");
  console.log("===============================================");

  try {
    // Get current quantity first
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: beforeInv } = await supabase
      .from("inventory")
      .select("quantity")
      .eq("id", TEST_DATA.inventoryId)
      .single();

    const originalQty = beforeInv?.quantity || 0;

    // Perform bulk zero-out
    const response = await axios.post(
      `${API_BASE}/inventory/bulk-operations`,
      {
        operation: "zero_out",
        items: [
          {
            inventoryId: TEST_DATA.inventoryId,
            productId: TEST_DATA.productId,
            locationId: TEST_DATA.locationId,
            currentQuantity: originalQty,
            productName: "Orange Candy Crush",
          },
        ],
      },
      {
        headers: { "x-vendor-id": VENDOR_ID },
      }
    );

    console.log("✅ Bulk zero-out executed:");
    console.log("   Success:", response.data.results.success);
    console.log("   Failed:", response.data.results.failed);

    // Verify it's at 0
    const { data: afterInv } = await supabase
      .from("inventory")
      .select("quantity")
      .eq("id", TEST_DATA.inventoryId)
      .single();

    if (afterInv?.quantity === 0) {
      console.log("✅ Inventory correctly set to 0g");
    } else {
      console.log(`❌ Inventory is ${afterInv?.quantity}g, expected 0g`);
    }

    // Restore original quantity
    if (originalQty > 0) {
      await axios.post(
        `${API_BASE}/inventory/adjust`,
        {
          inventoryId: TEST_DATA.inventoryId,
          productId: TEST_DATA.productId,
          locationId: TEST_DATA.locationId,
          adjustment: originalQty,
          reason: "Test cleanup: restore original quantity",
        },
        {
          headers: { "x-vendor-id": VENDOR_ID },
        }
      );
      console.log(`\n✅ Restored original quantity: ${originalQty}g`);
    }

    return afterInv?.quantity === 0;
  } catch (error: any) {
    console.error("❌ Test failed:", error.response?.data || error.message);
    return false;
  }
}

async function testTransactionHistory() {
  console.log("\n🧪 TEST 5: Transaction History Audit Trail");
  console.log("===============================================");

  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: transactions, count } = await supabase
      .from("inventory_transactions")
      .select("*", { count: "exact" })
      .eq("inventory_id", TEST_DATA.inventoryId)
      .order("created_at", { ascending: false })
      .limit(10);

    console.log(`✅ Found ${count} total transactions for this inventory item`);
    console.log("\nRecent transactions:");
    transactions?.forEach((txn, i) => {
      console.log(`\n${i + 1}. ${txn.transaction_type.toUpperCase()}`);
      console.log(`   Before: ${txn.quantity_before}g`);
      console.log(`   Change: ${txn.quantity_change > 0 ? "+" : ""}${txn.quantity_change}g`);
      console.log(`   After: ${txn.quantity_after}g`);
      console.log(`   Reason: ${txn.reason}`);
      console.log(`   Time: ${new Date(txn.created_at).toLocaleString()}`);
    });

    return (count || 0) > 0;
  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  INVENTORY SYSTEM TEST SUITE                             ║");
  console.log("║  Testing atomic transactions, edge cases, bulk ops       ║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  const results = {
    atomicAdjustment: await testAtomicAdjustment(),
    floatPrecision: await testFloatPrecision(),
    negativeInventory: await testNegativeInventoryPrevention(),
    bulkZeroOut: await testBulkZeroOut(),
    transactionHistory: await testTransactionHistory(),
  };

  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  TEST RESULTS                                            ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log("");
  console.log(`1. Atomic Adjustment:          ${results.atomicAdjustment ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`2. Float Precision:            ${results.floatPrecision ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`3. Negative Inventory Block:   ${results.negativeInventory ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`4. Bulk Zero-Out:              ${results.bulkZeroOut ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`5. Transaction History:        ${results.transactionHistory ? "✅ PASS" : "❌ FAIL"}`);
  console.log("");

  const allPassed = Object.values(results).every((r) => r === true);
  if (allPassed) {
    console.log("🎉 ALL TESTS PASSED! Steve Jobs would be proud.");
  } else {
    console.log("⚠️  Some tests failed. Review output above.");
  }

  process.exit(allPassed ? 0 : 1);
}

runAllTests();
