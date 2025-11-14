/**
 * Comprehensive test script for Purchase Order receiving flow
 * Tests the fix for PO status not updating after receiving items
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test vendor ID (Charlotte vendor)
const TEST_VENDOR_ID = "cd2e1122-d511-4edb-be5d-98ef274b4baf";

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  data?: any;
}

const results: TestResult[] = [];

function logTest(test: string, passed: boolean, message: string, data?: any) {
  results.push({ test, passed, message, data });
  const icon = passed ? "✅" : "❌";
  console.log(`${icon} ${test}: ${message}`);
  if (data && process.env.DEBUG) {
    console.log("   Data:", JSON.stringify(data, null, 2));
  }
}

async function testPOReceivingFlow() {
  console.log("\n🧪 Starting Purchase Order Receiving Tests\n");
  console.log("=" .repeat(60));

  try {
    // Step 1: Find an existing PO in 'ordered' status
    console.log("\n📋 Step 1: Finding test purchase order...");
    const { data: testPO, error: poError } = await supabase
      .from("purchase_orders")
      .select(
        `
        *,
        items:purchase_order_items(
          *,
          product:products(id, name, sku)
        ),
        location:locations(id, name)
      `,
      )
      .eq("vendor_id", TEST_VENDOR_ID)
      .eq("po_type", "inbound")
      .in("status", ["ordered", "confirmed"])
      .limit(1)
      .maybeSingle();

    if (poError) {
      logTest("Find Test PO", false, `Database error: ${poError.message}`);
      return;
    }

    if (!testPO) {
      logTest("Find Test PO", false, "No test PO found. Create a PO first.");
      return;
    }

    logTest(
      "Find Test PO",
      true,
      `Found PO: ${testPO.po_number} with ${testPO.items?.length || 0} items`,
      {
        po_id: testPO.id,
        po_number: testPO.po_number,
        status: testPO.status,
        items: testPO.items?.length,
      },
    );

    // Step 2: Check initial state
    console.log("\n📊 Step 2: Checking initial PO state...");
    const initialStatus = testPO.status;
    const itemsWithRemaining = testPO.items?.filter(
      (item: any) => (item.quantity_remaining || item.quantity) > 0,
    );

    logTest(
      "Check Initial State",
      itemsWithRemaining && itemsWithRemaining.length > 0,
      `PO status: ${initialStatus}, Items to receive: ${itemsWithRemaining?.length || 0}`,
      {
        total_items: testPO.items?.length,
        receivable_items: itemsWithRemaining?.length,
      },
    );

    if (!itemsWithRemaining || itemsWithRemaining.length === 0) {
      logTest("Has Receivable Items", false, "No items left to receive");
      return;
    }

    // Step 3: Prepare receive data (receive half of first item)
    console.log("\n📦 Step 3: Preparing to receive items...");
    const firstItem = itemsWithRemaining[0];
    const quantityToReceive = Math.floor(firstItem.quantity / 2) || 1; // Receive half (partial receive)

    const receiveItems = [
      {
        po_item_id: firstItem.id,
        quantity_received: quantityToReceive,
        condition: "good",
        quality_notes: "",
        notes: "Test receive from automated script",
      },
    ];

    logTest("Prepare Receive Data", true, `Receiving ${quantityToReceive} of item: ${firstItem.product?.name}`, {
      item_id: firstItem.id,
      product: firstItem.product?.name,
      ordered_qty: firstItem.quantity,
      receiving_qty: quantityToReceive,
      already_received: firstItem.quantity_received || 0,
    });

    // Step 4: Call the receive function
    console.log("\n🔧 Step 4: Calling receive function...");
    console.log("   Request data:", JSON.stringify({
      p_po_id: testPO.id,
      p_items: receiveItems,
      p_vendor_id: TEST_VENDOR_ID,
    }, null, 2));

    const { data: receiveResult, error: receiveError } = await supabase.rpc(
      "receive_purchase_order_items",
      {
        p_po_id: testPO.id,
        p_items: receiveItems,
        p_vendor_id: TEST_VENDOR_ID,
      },
    );

    console.log("   Response:", JSON.stringify(receiveResult, null, 2));

    if (receiveError) {
      logTest("Call Receive Function", false, `Error: ${receiveError.message}`, receiveError);
      return;
    }

    if (!receiveResult || !receiveResult.success) {
      logTest("Call Receive Function", false, `Function returned error: ${receiveResult?.error || 'Unknown error'}`, receiveResult);
      console.log("   Full result:", JSON.stringify(receiveResult, null, 2));
      // Continue to see what happened
      if (receiveResult?.results) {
        console.log("   Individual item results:");
        receiveResult.results.forEach((r: any, i: number) => {
          console.log(`     ${i + 1}. ${r.success ? '✅' : '❌'} ${r.error || 'Success'}`);
        });
      }
      return;
    }

    logTest("Call Receive Function", true, `Received ${receiveResult.successful_items} items successfully`, {
      successful: receiveResult.successful_items,
      failed: receiveResult.failed_items,
      results: receiveResult.results,
    });

    // Step 5: Verify purchase_order_items was updated
    console.log("\n✔️  Step 5: Verifying PO item was updated...");
    const { data: updatedItem, error: itemError } = await supabase
      .from("purchase_order_items")
      .select("*")
      .eq("id", firstItem.id)
      .maybeSingle();

    if (itemError) {
      logTest("Verify Item Update", false, `Error fetching item: ${itemError.message}`);
      return;
    }

    const itemUpdated =
      updatedItem &&
      updatedItem.quantity_received === quantityToReceive &&
      updatedItem.quantity_remaining === firstItem.quantity - quantityToReceive;

    logTest(
      "Verify Item Update",
      itemUpdated,
      itemUpdated
        ? `Item updated: received=${updatedItem.quantity_received}, remaining=${updatedItem.quantity_remaining}`
        : `Item NOT updated correctly: received=${updatedItem?.quantity_received}, remaining=${updatedItem?.quantity_remaining}`,
      {
        expected_received: quantityToReceive,
        actual_received: updatedItem?.quantity_received,
        expected_remaining: firstItem.quantity - quantityToReceive,
        actual_remaining: updatedItem?.quantity_remaining,
      },
    );

    // Step 6: Verify purchase order status was updated
    console.log("\n✔️  Step 6: Verifying PO status was updated...");
    const { data: updatedPO, error: poUpdateError } = await supabase
      .from("purchase_orders")
      .select("*")
      .eq("id", testPO.id)
      .maybeSingle();

    if (poUpdateError) {
      logTest("Verify PO Status Update", false, `Error fetching PO: ${poUpdateError.message}`);
      return;
    }

    // Since we did a partial receive, status should be 'partially_received'
    const expectedStatus = quantityToReceive < firstItem.quantity ? "partially_received" : "received";
    const statusUpdated = updatedPO && updatedPO.status !== initialStatus;

    logTest(
      "Verify PO Status Update",
      statusUpdated,
      statusUpdated
        ? `Status changed from '${initialStatus}' to '${updatedPO.status}'`
        : `Status NOT updated (still '${updatedPO?.status}')`,
      {
        initial_status: initialStatus,
        current_status: updatedPO?.status,
        expected_status: expectedStatus,
      },
    );

    // Step 7: Verify inventory was updated
    console.log("\n✔️  Step 7: Verifying inventory was updated...");
    const { data: inventory, error: invError } = await supabase
      .from("inventory")
      .select("*")
      .eq("product_id", firstItem.product_id)
      .eq("location_id", testPO.location_id)
      .eq("vendor_id", TEST_VENDOR_ID)
      .maybeSingle();

    if (invError) {
      logTest("Verify Inventory Update", false, `Error fetching inventory: ${invError.message}`);
    } else {
      logTest(
        "Verify Inventory Update",
        inventory !== null,
        inventory
          ? `Inventory updated: quantity=${inventory.quantity}, avg_cost=${inventory.average_cost}`
          : "Inventory record not found (may have been created)",
        inventory,
      );
    }

    // Step 8: Verify stock movement was created
    console.log("\n✔️  Step 8: Verifying stock movement was created...");
    const { data: stockMovements, error: movementError } = await supabase
      .from("stock_movements")
      .select("*")
      .eq("reference_type", "purchase_order")
      .eq("reference_id", testPO.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (movementError) {
      logTest("Verify Stock Movement", false, `Error fetching stock movements: ${movementError.message}`);
    } else {
      logTest(
        "Verify Stock Movement",
        stockMovements && stockMovements.length > 0,
        stockMovements && stockMovements.length > 0
          ? `Stock movement created: ${stockMovements[0].movement_type} of ${stockMovements[0].quantity} units`
          : "No stock movement found",
        stockMovements?.[0],
      );
    }

    // Step 9: Verify purchase_order_receives record was created
    console.log("\n✔️  Step 9: Verifying receive record was created...");
    const { data: receiveRecords, error: receiveRecordError } = await supabase
      .from("purchase_order_receives")
      .select("*")
      .eq("purchase_order_id", testPO.id)
      .eq("po_item_id", firstItem.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (receiveRecordError) {
      logTest("Verify Receive Record", false, `Error fetching receive records: ${receiveRecordError.message}`);
    } else {
      logTest(
        "Verify Receive Record",
        receiveRecords && receiveRecords.length > 0,
        receiveRecords && receiveRecords.length > 0
          ? `Receive record created: ${receiveRecords[0].quantity_received} units, condition: ${receiveRecords[0].condition}`
          : "No receive record found",
        receiveRecords?.[0],
      );
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📊 TEST SUMMARY");
    console.log("=".repeat(60));
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    console.log(`Total Tests: ${results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log("\nTest Results:");
    results.forEach((r, i) => {
      const icon = r.passed ? "✅" : "❌";
      console.log(`${i + 1}. ${icon} ${r.test}`);
    });

    if (failed === 0) {
      console.log("\n🎉 ALL TESTS PASSED! PO receiving flow is working correctly.");
    } else {
      console.log("\n⚠️  SOME TESTS FAILED. Review the output above.");
    }
  } catch (error) {
    console.error("\n❌ Unexpected error during tests:", error);
    logTest("Overall Test", false, `Unexpected error: ${error}`);
  }
}

// Run tests
testPOReceivingFlow()
  .then(() => {
    console.log("\n✨ Test script completed\n");
    process.exit(results.some((r) => !r.passed) ? 1 : 0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
