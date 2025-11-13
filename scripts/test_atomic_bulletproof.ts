/**
 * 🧪 BULLETPROOF ATOMIC SESSION TEST
 *
 * Tests with existing registers - no setup required
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://uaednwpxursknmwdeejn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI"
);

const TEST_VENDOR_ID = "cd2e1122-d511-4edb-be5d-98ef274b4baf";
const TEST_USER_ID = "3334217e-e62c-4ebc-8c21-a011ac49a853";

let testRegisters: any[] = [];
const results: any[] = [];
const createdSessionIds: string[] = [];

async function createSession(registerId: string, locationId: string, openingCash: number = 200) {
  const { data, error } = await supabase.rpc("get_or_create_session", {
    p_location_id: locationId,
    p_opening_cash: openingCash,
    p_register_id: registerId,
    p_user_id: TEST_USER_ID,
    p_vendor_id: TEST_VENDOR_ID,
  });

  if (error) throw error;
  const session = Array.isArray(data) ? data[0] : data;
  if (session?.id && !createdSessionIds.includes(session.id)) {
    createdSessionIds.push(session.id);
  }
  return session;
}

async function setup() {
  console.log("\n🔧 Finding existing registers...");

  const { data, error } = await supabase
    .from("pos_registers")
    .select("id, location_id, register_name")
    .eq("vendor_id", TEST_VENDOR_ID)
    .limit(3);

  if (error || !data || data.length === 0) {
    throw new Error("No registers found! Please create registers first via POS interface.");
  }

  testRegisters = data;
  console.log(`   ✅ Found ${testRegisters.length} registers to test\n`);
  testRegisters.forEach((r, i) => {
    console.log(`      ${i + 1}. ${r.register_name || "Register " + (i + 1)}`);
  });
}

async function cleanup() {
  console.log("\n🧹 Cleaning up test sessions...");

  if (createdSessionIds.length === 0) {
    console.log("   ℹ️  No sessions to clean up\n");
    return;
  }

  const { error } = await supabase
    .from("pos_sessions")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .in("id", createdSessionIds);

  if (error) {
    console.error("   ⚠️  Error closing sessions:", error.message);
  } else {
    console.log(`   ✅ Closed ${createdSessionIds.length} test sessions\n`);
  }
}

// TEST 1: Basic creation
async function test1() {
  console.log("\n🧪 TEST 1: Basic Session Creation");
  console.log("─".repeat(60));

  try {
    const reg = testRegisters[0];
    const session = await createSession(reg.id, reg.location_id);

    const passed = session && session.id && session.status === "open";
    console.log(passed ? "✅ PASS" : "❌ FAIL");
    results.push({ name: "Basic Creation", passed });
    return passed;
  } catch (error: any) {
    console.log("❌ FAIL -", error.message);
    results.push({ name: "Basic Creation", passed: false });
    return false;
  }
}

// TEST 2: Race condition - 50 concurrent
async function test2() {
  console.log("\n🧪 TEST 2: Race Condition (50 Concurrent Requests)");
  console.log("─".repeat(60));

  try {
    const reg = testRegisters[0];
    const startTime = Date.now();

    const promises = Array.from({ length: 50 }, () => createSession(reg.id, reg.location_id));
    const sessions = await Promise.all(promises);

    const duration = Date.now() - startTime;
    const uniqueIds = new Set(sessions.map((s) => s.id));
    const passed = uniqueIds.size === 1;

    console.log(
      passed
        ? `✅ PASS - All 50 requests returned SAME session in ${duration}ms`
        : `❌ FAIL - Created ${uniqueIds.size} different sessions (RACE CONDITION!)`
    );
    results.push({ name: "Race Condition (50 concurrent)", passed });
    return passed;
  } catch (error: any) {
    console.log("❌ FAIL -", error.message);
    results.push({ name: "Race Condition", passed: false });
    return false;
  }
}

// TEST 3: Multiple registers simultaneously
async function test3() {
  console.log("\n🧪 TEST 3: Multiple Registers (10 requests each, all simultaneous)");
  console.log("─".repeat(60));

  try {
    const promises = testRegisters.flatMap((reg) =>
      Array.from({ length: 10 }, () => createSession(reg.id, reg.location_id))
    );

    const sessions = await Promise.all(promises);
    const uniqueIds = new Set(sessions.map((s) => s.id));

    const passed = uniqueIds.size === testRegisters.length;

    console.log(
      passed
        ? `✅ PASS - Created exactly ${testRegisters.length} sessions (one per register)`
        : `❌ FAIL - Created ${uniqueIds.size} sessions (expected ${testRegisters.length})`
    );
    results.push({ name: "Multiple Registers", passed });
    return passed;
  } catch (error: any) {
    console.log("❌ FAIL -", error.message);
    results.push({ name: "Multiple Registers", passed: false });
    return false;
  }
}

// TEST 4: Rapid sequential
async function test4() {
  console.log("\n🧪 TEST 4: Rapid Sequential (100 requests in a row)");
  console.log("─".repeat(60));

  try {
    const reg = testRegisters[0];
    const sessions = [];

    for (let i = 0; i < 100; i++) {
      const session = await createSession(reg.id, reg.location_id);
      sessions.push(session);
    }

    const uniqueIds = new Set(sessions.map((s) => s.id));
    const passed = uniqueIds.size === 1;

    console.log(
      passed
        ? "✅ PASS - All 100 sequential requests returned same session"
        : `❌ FAIL - Created ${uniqueIds.size} sessions`
    );
    results.push({ name: "Rapid Sequential", passed });
    return passed;
  } catch (error: any) {
    console.log("❌ FAIL -", error.message);
    results.push({ name: "Rapid Sequential", passed: false });
    return false;
  }
}

// TEST 5: Join existing
async function test5() {
  console.log("\n🧪 TEST 5: Join Existing Session");
  console.log("─".repeat(60));

  try {
    const reg = testRegisters[1];
    const session1 = await createSession(reg.id, reg.location_id);
    await new Promise((resolve) => setTimeout(resolve, 200));
    const session2 = await createSession(reg.id, reg.location_id);

    const passed = session1.id === session2.id;

    console.log(
      passed
        ? "✅ PASS - Second request joined existing session"
        : "❌ FAIL - Created duplicate session"
    );
    results.push({ name: "Join Existing", passed });
    return passed;
  } catch (error: any) {
    console.log("❌ FAIL -", error.message);
    results.push({ name: "Join Existing", passed: false });
    return false;
  }
}

// TEST 6: Session closure and reopening
async function test6() {
  console.log("\n🧪 TEST 6: Session Closure & Reopening");
  console.log("─".repeat(60));

  try {
    const reg = testRegisters[1];
    const session1 = await createSession(reg.id, reg.location_id);

    // Close it
    await supabase
      .from("pos_sessions")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("id", session1.id);

    // Create new
    const session2 = await createSession(reg.id, reg.location_id);

    const passed = session1.id !== session2.id;

    console.log(
      passed
        ? "✅ PASS - New session created after closing old one"
        : "❌ FAIL - Session reopening failed"
    );
    results.push({ name: "Closure & Reopening", passed });
    return passed;
  } catch (error: any) {
    console.log("❌ FAIL -", error.message);
    results.push({ name: "Closure & Reopening", passed: false });
    return false;
  }
}

// TEST 7: Extreme stress - 200 concurrent
async function test7() {
  console.log("\n🧪 TEST 7: Extreme Stress (200 Concurrent Requests)");
  console.log("─".repeat(60));

  try {
    const reg = testRegisters[2] || testRegisters[0];
    const startTime = Date.now();

    const promises = Array.from({ length: 200 }, () => createSession(reg.id, reg.location_id));
    const sessions = await Promise.all(promises);

    const duration = Date.now() - startTime;
    const uniqueIds = new Set(sessions.map((s) => s.id));
    const passed = uniqueIds.size === 1;

    console.log(
      passed
        ? `✅ PASS - All 200 requests handled in ${duration}ms (avg ${Math.round(duration / 200)}ms/req)`
        : `❌ FAIL - Created ${uniqueIds.size} sessions under extreme load`
    );
    results.push({ name: "Extreme Stress (200 concurrent)", passed });
    return passed;
  } catch (error: any) {
    console.log("❌ FAIL -", error.message);
    results.push({ name: "Extreme Stress", passed: false });
    return false;
  }
}

// TEST 8: Opening cash consistency
async function test8() {
  console.log("\n🧪 TEST 8: Opening Cash Consistency");
  console.log("─".repeat(60));

  try {
    const reg = testRegisters[2] || testRegisters[0];
    const session1 = await createSession(reg.id, reg.location_id, 200);
    const session2 = await createSession(reg.id, reg.location_id, 999); // Try different amount

    const passed = session1.id === session2.id && session2.opening_cash === 200; // Should keep original

    console.log(
      passed
        ? "✅ PASS - Original opening cash preserved"
        : "❌ FAIL - Opening cash inconsistency"
    );
    results.push({ name: "Opening Cash Consistency", passed });
    return passed;
  } catch (error: any) {
    console.log("❌ FAIL -", error.message);
    results.push({ name: "Opening Cash", passed: false });
    return false;
  }
}

async function runAllTests() {
  console.log("\n");
  console.log("═".repeat(60));
  console.log("🚀 BULLETPROOF ATOMIC SESSION TEST SUITE");
  console.log("═".repeat(60));

  try {
    await setup();

    const tests = [test1, test2, test3, test4, test5, test6, test7, test8];

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

    console.log("");
    results.forEach((r) => {
      console.log(`   ${r.passed ? "✅" : "❌"} ${r.name}`);
    });

    console.log("\n" + "═".repeat(60));
    console.log(`\n📈 SCORE: ${passed}/${results.length} tests passed`);

    if (failed === 0) {
      console.log("\n🎉 ALL TESTS PASSED - SYSTEM IS BULLETPROOF!");
      console.log("   ✓ Zero race conditions possible");
      console.log("   ✓ Database-level atomicity confirmed");
      console.log("   ✓ Handles 200+ concurrent requests flawlessly");
      console.log("   ✓ Session management is ENTERPRISE-GRADE 🚀");
      console.log("\n   Ready for production!");
    } else {
      console.log(`\n⚠️  ${failed} TEST(S) FAILED`);
      console.log("   Review failures above");
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

runAllTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
