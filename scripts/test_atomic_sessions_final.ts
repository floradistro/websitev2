/**
 * 🧪 FINAL COMPREHENSIVE ATOMIC SESSION TEST SUITE
 *
 * Tests every edge case with REAL database entities
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://uaednwpxursknmwdeejn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI"
);

const TEST_LOCATION_ID = "c4eedafb-4050-4d2d-a6af-e164aad5d934";
const TEST_VENDOR_ID = "cd2e1122-d511-4edb-be5d-98ef274b4baf";
const TEST_USER_ID = "3334217e-e62c-4ebc-8c21-a011ac49a853";

let testRegisters: string[] = [];
const results: any[] = [];

// Setup: Create test registers
async function setupTestRegisters() {
  console.log("\n🔧 Setting up test registers...");

  // Create 5 test registers
  const registers = [];
  for (let i = 0; i < 5; i++) {
    const { data, error } = await supabase
      .from("pos_registers")
      .insert({
        location_id: TEST_LOCATION_ID,
        vendor_id: TEST_VENDOR_ID,
        name: `TEST-REGISTER-${i + 1}-${Date.now()}`,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error(`   ❌ Failed to create register ${i + 1}:`, error.message);
      throw error;
    }

    registers.push(data.id);
    console.log(`   ✅ Created register ${i + 1}: ${data.name}`);
  }

  testRegisters = registers;
  console.log(`\n✅ Setup complete: ${testRegisters.length} test registers created\n`);
}

// Cleanup: Delete test registers and sessions
async function cleanup() {
  console.log("\n🧹 Cleaning up...");

  // Close all test sessions
  const { error: sessionsError } = await supabase
    .from("pos_sessions")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .in("register_id", testRegisters);

  if (sessionsError) {
    console.error("   ⚠️  Error closing sessions:", sessionsError.message);
  }

  // Delete test registers
  const { error: registersError } = await supabase
    .from("pos_registers")
    .delete()
    .in("id", testRegisters);

  if (registersError) {
    console.error("   ⚠️  Error deleting registers:", registersError.message);
  } else {
    console.log(`   ✅ Deleted ${testRegisters.length} test registers`);
  }
}

// Helper: Call atomic function
async function createSession(registerId: string, openingCash: number = 200) {
  const { data, error } = await supabase.rpc("get_or_create_session", {
    p_location_id: TEST_LOCATION_ID,
    p_opening_cash: openingCash,
    p_register_id: registerId,
    p_user_id: TEST_USER_ID,
    p_vendor_id: TEST_VENDOR_ID,
  });

  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

// TEST 1: Basic session creation
async function test1_BasicCreation() {
  console.log("\n🧪 TEST 1: Basic Session Creation");
  console.log("─".repeat(60));

  try {
    const session = await createSession(testRegisters[0]);

    const passed =
      session &&
      session.id &&
      session.register_id === testRegisters[0] &&
      session.status === "open" &&
      session.opening_cash === 200;

    console.log(passed ? "✅ PASS - Session created successfully" : "❌ FAIL - Invalid session");
    results.push({ test: "Basic Creation", passed });
    return passed;
  } catch (error: any) {
    console.log("❌ FAIL -", error.message);
    results.push({ test: "Basic Creation", passed: false });
    return false;
  }
}

// TEST 2: Race condition - 20 simultaneous requests
async function test2_RaceCondition() {
  console.log("\n🧪 TEST 2: Race Condition (20 Concurrent Requests)");
  console.log("─".repeat(60));

  try {
    const promises = Array.from({ length: 20 }, () => createSession(testRegisters[1]));
    const sessions = await Promise.all(promises);

    const uniqueIds = new Set(sessions.map((s) => s.id));
    const passed = uniqueIds.size === 1;

    console.log(
      passed
        ? `✅ PASS - All 20 requests returned THE SAME session`
        : `❌ FAIL - Created ${uniqueIds.size} different sessions!`
    );
    results.push({ test: "Race Condition (20 concurrent)", passed });
    return passed;
  } catch (error: any) {
    console.log("❌ FAIL -", error.message);
    results.push({ test: "Race Condition", passed: false });
    return false;
  }
}

// TEST 3: Multiple registers - should create separate sessions
async function test3_MultipleRegisters() {
  console.log("\n🧪 TEST 3: Multiple Registers (3 registers, 10 requests each)");
  console.log("─".repeat(60));

  try {
    const promises = [
      ...Array.from({ length: 10 }, () => createSession(testRegisters[2])),
      ...Array.from({ length: 10 }, () => createSession(testRegisters[3])),
      ...Array.from({ length: 10 }, () => createSession(testRegisters[4])),
    ];

    const sessions = await Promise.all(promises);
    const uniqueIds = new Set(sessions.map((s) => s.id));

    const passed = uniqueIds.size === 3;

    console.log(
      passed
        ? `✅ PASS - Created exactly 3 sessions (one per register)`
        : `❌ FAIL - Created ${uniqueIds.size} sessions (expected 3)`
    );
    results.push({ test: "Multiple Registers", passed });
    return passed;
  } catch (error: any) {
    console.log("❌ FAIL -", error.message);
    results.push({ test: "Multiple Registers", passed: false });
    return false;
  }
}

// TEST 4: Join existing session
async function test4_JoinExisting() {
  console.log("\n🧪 TEST 4: Join Existing Session");
  console.log("─".repeat(60));

  try {
    const session1 = await createSession(testRegisters[0]);
    await new Promise((resolve) => setTimeout(resolve, 100));
    const session2 = await createSession(testRegisters[0]);

    const passed = session1.id === session2.id;

    console.log(
      passed
        ? "✅ PASS - Second request joined existing session"
        : "❌ FAIL - Created duplicate session"
    );
    results.push({ test: "Join Existing", passed });
    return passed;
  } catch (error: any) {
    console.log("❌ FAIL -", error.message);
    results.push({ test: "Join Existing", passed: false });
    return false;
  }
}

// TEST 5: Rapid sequential requests
async function test5_RapidSequential() {
  console.log("\n🧪 TEST 5: Rapid Sequential Requests (30 in a row)");
  console.log("─".repeat(60));

  try {
    const sessions = [];
    for (let i = 0; i < 30; i++) {
      const session = await createSession(testRegisters[1]);
      sessions.push(session);
    }

    const uniqueIds = new Set(sessions.map((s) => s.id));
    const passed = uniqueIds.size === 1;

    console.log(
      passed
        ? "✅ PASS - All 30 sequential requests returned same session"
        : `❌ FAIL - Created ${uniqueIds.size} sessions`
    );
    results.push({ test: "Rapid Sequential", passed });
    return passed;
  } catch (error: any) {
    console.log("❌ FAIL -", error.message);
    results.push({ test: "Rapid Sequential", passed: false });
    return false;
  }
}

// TEST 6: Session closure and reopening
async function test6_ClosureAndReopening() {
  console.log("\n🧪 TEST 6: Session Closure and Reopening");
  console.log("─".repeat(60));

  try {
    const session1 = await createSession(testRegisters[2]);
    const session1Id = session1.id;

    // Close it
    await supabase
      .from("pos_sessions")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("id", session1Id);

    // Create new session
    const session2 = await createSession(testRegisters[2]);

    const passed = session1Id !== session2.id;

    console.log(
      passed
        ? "✅ PASS - New session created after closing old one"
        : "❌ FAIL - Failed to create new session"
    );
    results.push({ test: "Closure and Reopening", passed });
    return passed;
  } catch (error: any) {
    console.log("❌ FAIL -", error.message);
    results.push({ test: "Closure and Reopening", passed: false });
    return false;
  }
}

// TEST 7: Stress test - 100 concurrent requests
async function test7_StressTest() {
  console.log("\n🧪 TEST 7: Stress Test (100 Concurrent Requests)");
  console.log("─".repeat(60));

  try {
    const startTime = Date.now();
    const promises = Array.from({ length: 100 }, () => createSession(testRegisters[3]));
    const sessions = await Promise.all(promises);
    const duration = Date.now() - startTime;

    const uniqueIds = new Set(sessions.map((s) => s.id));
    const passed = uniqueIds.size === 1;

    console.log(
      passed
        ? `✅ PASS - All 100 requests returned same session in ${duration}ms (avg ${Math.round(duration / 100)}ms/request)`
        : `❌ FAIL - Created ${uniqueIds.size} sessions`
    );
    results.push({ test: "Stress Test (100 requests)", passed });
    return passed;
  } catch (error: any) {
    console.log("❌ FAIL -", error.message);
    results.push({ test: "Stress Test", passed: false });
    return false;
  }
}

// TEST 8: Different opening cash amounts
async function test8_DifferentOpeningCash() {
  console.log("\n🧪 TEST 8: Opening Cash Consistency");
  console.log("─".repeat(60));

  try {
    const session1 = await createSession(testRegisters[4], 200);
    const session2 = await createSession(testRegisters[4], 500);

    const passed = session1.id === session2.id && session2.opening_cash === 200;

    console.log(
      passed
        ? "✅ PASS - Existing session preserved with original opening cash"
        : "❌ FAIL - Opening cash inconsistency"
    );
    results.push({ test: "Opening Cash Consistency", passed });
    return passed;
  } catch (error: any) {
    console.log("❌ FAIL -", error.message);
    results.push({ test: "Opening Cash", passed: false });
    return false;
  }
}

// TEST 9: Real-world multi-device scenario
async function test9_MultiDevice() {
  console.log("\n🧪 TEST 9: Multi-Device Scenario (Simulating 3 devices clicking simultaneously)");
  console.log("─".repeat(60));

  try {
    // Simulate 3 devices all trying to start shift on same register at same time
    const promises = Array.from({ length: 3 }, () => createSession(testRegisters[0]));
    const sessions = await Promise.all(promises);

    const uniqueIds = new Set(sessions.map((s) => s.id));
    const passed = uniqueIds.size === 1;

    console.log(
      passed
        ? "✅ PASS - All 3 'devices' got the same session"
        : `❌ FAIL - Created ${uniqueIds.size} sessions (race condition!)`
    );
    results.push({ test: "Multi-Device Scenario", passed });
    return passed;
  } catch (error: any) {
    console.log("❌ FAIL -", error.message);
    results.push({ test: "Multi-Device", passed: false });
    return false;
  }
}

// TEST 10: Extreme stress - 200 concurrent requests
async function test10_ExtremeStress() {
  console.log("\n🧪 TEST 10: Extreme Stress Test (200 Concurrent Requests)");
  console.log("─".repeat(60));

  try {
    const startTime = Date.now();
    const promises = Array.from({ length: 200 }, () => createSession(testRegisters[1]));
    const sessions = await Promise.all(promises);
    const duration = Date.now() - startTime;

    const uniqueIds = new Set(sessions.map((s) => s.id));
    const passed = uniqueIds.size === 1;

    console.log(
      passed
        ? `✅ PASS - All 200 requests handled correctly in ${duration}ms`
        : `❌ FAIL - Created ${uniqueIds.size} sessions under extreme load`
    );
    results.push({ test: "Extreme Stress (200 concurrent)", passed });
    return passed;
  } catch (error: any) {
    console.log("❌ FAIL -", error.message);
    results.push({ test: "Extreme Stress", passed: false });
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log("\n");
  console.log("═".repeat(60));
  console.log("🚀 COMPREHENSIVE ATOMIC SESSION TEST SUITE");
  console.log("═".repeat(60));

  try {
    await setupTestRegisters();

    const tests = [
      test1_BasicCreation,
      test2_RaceCondition,
      test3_MultipleRegisters,
      test4_JoinExisting,
      test5_RapidSequential,
      test6_ClosureAndReopening,
      test7_StressTest,
      test8_DifferentOpeningCash,
      test9_MultiDevice,
      test10_ExtremeStress,
    ];

    for (const test of tests) {
      await test();
    }

    // Summary
    console.log("\n");
    console.log("═".repeat(60));
    console.log("📊 FINAL RESULTS");
    console.log("═".repeat(60));

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;

    results.forEach((r) => {
      console.log(`   ${r.passed ? "✅" : "❌"} ${r.test}`);
    });

    console.log("\n" + "═".repeat(60));
    console.log(`\n📈 SCORE: ${passed}/${results.length} tests passed`);

    if (failed === 0) {
      console.log("\n🎉 ALL TESTS PASSED!");
      console.log("   ✓ Zero race conditions possible");
      console.log("   ✓ Database-level atomicity working");
      console.log("   ✓ Handles 200+ concurrent requests");
      console.log("   ✓ Session management is BULLETPROOF! 🚀");
    } else {
      console.log(`\n⚠️  ${failed} TEST(S) FAILED - Review above`);
    }

    console.log("\n" + "═".repeat(60) + "\n");

    await cleanup();

    return failed === 0;
  } catch (error: any) {
    console.error("\n❌ Test suite error:", error.message);
    await cleanup();
    return false;
  }
}

// Run
runAllTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
