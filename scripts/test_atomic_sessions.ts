/**
 * 🧪 ATOMIC SESSION CONCURRENCY TEST
 *
 * This script tests that the atomic session function prevents
 * duplicate sessions even when 10 requests are made simultaneously.
 *
 * Expected Result: ALL 10 requests should return the SAME session ID
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://uaednwpxursknmwdeejn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI"
);

interface TestResult {
  success: boolean;
  sessionId?: string;
  sessionNumber?: string;
  method?: string;
  error?: string;
}

async function testConcurrentSessionCreation() {
  console.log("🧪 ATOMIC SESSION CONCURRENCY TEST\n");
  console.log("=" .repeat(60));

  const testRegisterId = `test-register-${Date.now()}`;
  const testLocationId = "c4eedafb-4050-4d2d-a6af-e164aad5d934"; // Charlotte/Monroe location
  const testVendorId = "cd2e1122-d511-4edb-be5d-98ef274b4baf"; // Flora Distro

  // Get a valid user ID
  const { data: users } = await supabase
    .from("users")
    .select("id")
    .eq("vendor_id", testVendorId)
    .limit(1);

  const testUserId = users?.[0]?.id;

  if (!testUserId) {
    console.error("❌ No users found for testing. Please create a user first.");
    return;
  }

  console.log(`\n📋 Test Parameters:`);
  console.log(`   Register ID: ${testRegisterId}`);
  console.log(`   Location ID: ${testLocationId}`);
  console.log(`   Vendor ID: ${testVendorId}`);
  console.log(`   User ID: ${testUserId}`);
  console.log(`\n⚡ Firing 10 simultaneous session creation requests...\n`);

  // Create 10 simultaneous requests
  const startTime = Date.now();

  const requests = Array.from({ length: 10 }, (_, i) =>
    fetch("http://localhost:3000/api/pos/sessions/get-or-create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registerId: testRegisterId,
        locationId: testLocationId,
        vendorId: testVendorId,
        userId: testUserId,
        openingCash: 200,
      }),
    }).then(async (response) => {
      const data = await response.json();
      return {
        requestId: i + 1,
        status: response.status,
        success: response.ok,
        sessionId: data.session?.id,
        sessionNumber: data.session?.session_number,
        method: data.method,
        error: data.error,
      };
    })
  );

  const results = await Promise.all(requests);
  const duration = Date.now() - startTime;

  console.log(`✅ All 10 requests completed in ${duration}ms\n`);
  console.log("=" .repeat(60));
  console.log("\n📊 RESULTS:\n");

  // Analyze results
  const successfulResults = results.filter((r) => r.success);
  const failedResults = results.filter((r) => !r.success);
  const uniqueSessionIds = new Set(
    successfulResults.map((r) => r.sessionId).filter(Boolean)
  );

  console.log(`   Successful: ${successfulResults.length}/10`);
  console.log(`   Failed: ${failedResults.length}/10`);
  console.log(`   Unique Sessions Created: ${uniqueSessionIds.size}`);

  if (failedResults.length > 0) {
    console.log(`\n❌ FAILURES DETECTED:\n`);
    failedResults.forEach((result) => {
      console.log(`   Request ${result.requestId}: ${result.error}`);
    });
  }

  if (successfulResults.length > 0) {
    const firstSession = successfulResults[0];
    console.log(`\n📄 Session Details:`);
    console.log(`   Session ID: ${firstSession.sessionId}`);
    console.log(`   Session Number: ${firstSession.sessionNumber}`);
    console.log(`   Method: ${firstSession.method}`);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`\n🎯 FINAL VERDICT:\n`);

  if (uniqueSessionIds.size === 1 && successfulResults.length === 10) {
    console.log(`   ✅ PASS - ATOMIC FUNCTION WORKING!`);
    console.log(`   All 10 requests returned the SAME session.`);
    console.log(`   No race conditions detected.`);
    console.log(`   Session management is BULLETPROOF! 🚀\n`);
  } else if (uniqueSessionIds.size === 1 && successfulResults.length < 10) {
    console.log(`   ⚠️  PARTIAL PASS - Some requests failed`);
    console.log(`   ${successfulResults.length} requests succeeded with same session.`);
    console.log(`   ${failedResults.length} requests failed (check errors above).\n`);
  } else if (uniqueSessionIds.size > 1) {
    console.log(`   ❌ FAIL - RACE CONDITION DETECTED!`);
    console.log(`   Created ${uniqueSessionIds.size} DIFFERENT sessions!`);
    console.log(`   Session IDs: ${Array.from(uniqueSessionIds).join(", ")}`);
    console.log(`   The atomic function is NOT working correctly! 🔴\n`);
  } else {
    console.log(`   ❌ FAIL - All requests failed`);
    console.log(`   The atomic function may not be deployed.\n`);
  }

  // Cleanup: Close the test session
  if (successfulResults.length > 0) {
    const sessionId = successfulResults[0].sessionId;
    console.log(`🧹 Cleaning up test session...`);

    const { error: closeError } = await supabase
      .from("pos_sessions")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("id", sessionId);

    if (closeError) {
      console.error(`   ⚠️  Failed to cleanup: ${closeError.message}`);
    } else {
      console.log(`   ✅ Test session closed\n`);
    }
  }

  return {
    passed: uniqueSessionIds.size === 1 && successfulResults.length === 10,
    uniqueSessions: uniqueSessionIds.size,
    successfulRequests: successfulResults.length,
    failedRequests: failedResults.length,
  };
}

// Run the test
testConcurrentSessionCreation()
  .then((result) => {
    process.exit(result.passed ? 0 : 1);
  })
  .catch((error) => {
    console.error("\n❌ Test failed with error:", error);
    process.exit(1);
  });
