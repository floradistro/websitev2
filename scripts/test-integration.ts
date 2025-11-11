/**
 * Integration Testing Suite
 * Tests that can run without external dependencies
 *
 * Usage: npx tsx scripts/test-integration.ts
 */

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

function runTest(
  name: string,
  category: string,
  testFn: () => void | Promise<void>,
): Promise<void> {
  return new Promise(async (resolve) => {
    const start = performance.now();
    try {
      await testFn();
      results.push({
        name,
        category,
        passed: true,
        duration: performance.now() - start,
      });
    } catch (error: any) {
      results.push({
        name,
        category,
        passed: false,
        duration: performance.now() - start,
        error: error.message,
      });
    }
    resolve();
  });
}

/**
 * TEST SUITE 1: Error Handling
 */
async function testErrorHandling() {
  console.log("\n📋 Test Suite 1: Error Handling");
  console.log("-".repeat(60));

  const { toError } = await import("@/lib/errors");

  // Test 1.1: toError with Error object
  await runTest("toError with Error", "ErrorHandling", () => {
    const error = new Error("Test error");
    const result = toError(error);
    if (!(result instanceof Error)) throw new Error("Should return Error instance");
    if (result.message !== "Test error") throw new Error("Message not preserved");
  });

  // Test 1.2: toError with string
  await runTest("toError with string", "ErrorHandling", () => {
    const result = toError("String error");
    if (!(result instanceof Error)) throw new Error("Should return Error instance");
    if (result.message !== "String error") throw new Error("Message not preserved");
  });

  // Test 1.3: toError with object
  await runTest("toError with object", "ErrorHandling", () => {
    const result = toError({ message: "Object error", code: 500 });
    if (!(result instanceof Error)) throw new Error("Should return Error instance");
  });

  // Test 1.4: toError with null/undefined
  await runTest("toError with null", "ErrorHandling", () => {
    const result = toError(null);
    if (!(result instanceof Error)) throw new Error("Should return Error instance");
  });

  // Test 1.5: toError with unknown type
  await runTest("toError with number", "ErrorHandling", () => {
    const result = toError(42);
    if (!(result instanceof Error)) throw new Error("Should return Error instance");
  });
}

/**
 * TEST SUITE 2: Cache Manager (LRU)
 */
async function testCacheManager() {
  console.log("\n📋 Test Suite 2: Cache Manager (LRU)");
  console.log("-".repeat(60));

  const { QueryCache } = await import("@/lib/cache-manager");

  // Test 2.1: Basic set/get
  await runTest("Basic set/get", "CacheManager", () => {
    const cache = new QueryCache({ ttl: 60000, max: 100 });
    cache.set("key1", "value1");
    const result = cache.get("key1");
    if (result !== "value1") throw new Error("Value not retrieved correctly");
  });

  // Test 2.2: TTL expiration
  await runTest("TTL expiration", "CacheManager", async () => {
    const cache = new QueryCache({ ttl: 10, max: 100 }); // 10ms TTL
    cache.set("key2", "value2");

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 20));

    const result = cache.get("key2");
    if (result !== undefined) throw new Error("Value should have expired");
  });

  // Test 2.3: Max size limit
  await runTest("Max size limit", "CacheManager", () => {
    const cache = new QueryCache({ ttl: 60000, max: 3 });
    cache.set("key1", "value1");
    cache.set("key2", "value2");
    cache.set("key3", "value3");
    cache.set("key4", "value4"); // Should evict key1

    if (cache.get("key1") !== undefined) throw new Error("Oldest key should be evicted");
    if (cache.get("key4") !== "value4") throw new Error("Newest key should exist");
  });

  // Test 2.4: Pattern invalidation
  await runTest("Pattern invalidation", "CacheManager", () => {
    const cache = new QueryCache({ ttl: 60000, max: 100 });
    cache.set("product:123", "data1");
    cache.set("product:456", "data2");
    cache.set("vendor:789", "data3");

    cache.invalidatePattern("product:.*");

    if (cache.get("product:123") !== undefined) throw new Error("Product:123 should be invalidated");
    if (cache.get("product:456") !== undefined) throw new Error("Product:456 should be invalidated");
    if (cache.get("vendor:789") === undefined) throw new Error("Vendor:789 should still exist");
  });

  // Test 2.5: Clear all
  await runTest("Clear all", "CacheManager", () => {
    const cache = new QueryCache({ ttl: 60000, max: 100 });
    cache.set("key1", "value1");
    cache.set("key2", "value2");

    cache.clear();

    if (cache.get("key1") !== undefined) throw new Error("All keys should be cleared");
    if (cache.get("key2") !== undefined) throw new Error("All keys should be cleared");
  });
}

/**
 * TEST SUITE 3: Logger
 */
async function testLogger() {
  console.log("\n📋 Test Suite 3: Logger");
  console.log("-".repeat(60));

  const { logger } = await import("@/lib/logger");

  // Test 3.1: Info logging
  await runTest("Info logging", "Logger", () => {
    // Should not throw
    logger.info("Test info message");
    logger.info("Test with metadata", { key: "value" });
  });

  // Test 3.2: Error logging
  await runTest("Error logging", "Logger", () => {
    // Should not throw
    logger.error("Test error message");
    logger.error("Test error", new Error("Test"), { context: "test" });
  });

  // Test 3.3: Warn logging
  await runTest("Warn logging", "Logger", () => {
    // Should not throw
    logger.warn("Test warning");
    logger.warn("Warning with context", { details: "test" });
  });

  // Test 3.4: Debug logging
  await runTest("Debug logging", "Logger", () => {
    // Should not throw
    logger.debug("Debug message");
  });
}

/**
 * TEST SUITE 4: Performance Monitor
 */
async function testPerformanceMonitor() {
  console.log("\n📋 Test Suite 4: Performance Monitor");
  console.log("-".repeat(60));

  const { monitor } = await import("@/lib/performance-monitor");

  // Test 4.1: Timer
  await runTest("Timer", "PerformanceMonitor", async () => {
    const endTimer = monitor.startTimer("Test Operation");
    await new Promise(resolve => setTimeout(resolve, 10));
    const duration = endTimer();

    if (duration < 10) throw new Error("Duration should be at least 10ms");
  });

  // Test 4.2: Cache access tracking
  await runTest("Cache access tracking", "PerformanceMonitor", () => {
    monitor.recordCacheAccess("test-cache", true);
    monitor.recordCacheAccess("test-cache", false);

    const stats = monitor.getStats();
    if (!stats.cache || !stats.cache["test-cache"]) {
      throw new Error("Cache stats not recorded");
    }
  });

  // Test 4.3: Get stats
  await runTest("Get stats", "PerformanceMonitor", () => {
    const stats = monitor.getStats();

    if (!stats.operations) throw new Error("Operations stats missing");
    if (!stats.cache) throw new Error("Cache stats missing");
    if (typeof stats.startTime !== "number") throw new Error("Start time missing");
  });

  // Test 4.4: Reset stats
  await runTest("Reset stats", "PerformanceMonitor", () => {
    monitor.recordCacheAccess("reset-test", true);
    monitor.reset();

    const stats = monitor.getStats();
    // After reset, should have no operation history
    if (Object.keys(stats.operations).length > 0) {
      throw new Error("Operations should be cleared after reset");
    }
  });
}

/**
 * TEST SUITE 5: Validation Schemas
 */
async function testValidation() {
  console.log("\n📋 Test Suite 5: Validation Schemas");
  console.log("-".repeat(60));

  const { validateData, LoginSchema, RegisterSchema } = await import("@/lib/validation/schemas");

  // Test 5.1: Valid login data
  await runTest("Valid login data", "Validation", () => {
    const result = validateData(LoginSchema, {
      email: "test@example.com",
      password: "SecurePass123!",
    });

    if (!result.success) throw new Error("Valid login should pass");
  });

  // Test 5.2: Invalid email
  await runTest("Invalid email", "Validation", () => {
    const result = validateData(LoginSchema, {
      email: "invalid-email",
      password: "SecurePass123!",
    });

    if (result.success) throw new Error("Invalid email should fail");
  });

  // Test 5.3: Short password
  await runTest("Short password", "Validation", () => {
    const result = validateData(LoginSchema, {
      email: "test@example.com",
      password: "123",
    });

    if (result.success) throw new Error("Short password should fail");
  });

  // Test 5.4: Valid registration
  await runTest("Valid registration", "Validation", () => {
    const result = validateData(RegisterSchema, {
      email: "test@example.com",
      password: "SecurePass123!",
      confirmPassword: "SecurePass123!",
      firstName: "John",
      lastName: "Doe",
    });

    if (!result.success) throw new Error("Valid registration should pass");
  });

  // Test 5.5: Password mismatch
  await runTest("Password mismatch", "Validation", () => {
    const result = validateData(RegisterSchema, {
      email: "test@example.com",
      password: "SecurePass123!",
      confirmPassword: "DifferentPass123!",
      firstName: "John",
      lastName: "Doe",
    });

    if (result.success) throw new Error("Mismatched passwords should fail");
  });

  // Test 5.6: Missing required fields
  await runTest("Missing required fields", "Validation", () => {
    const result = validateData(RegisterSchema, {
      email: "test@example.com",
    });

    if (result.success) throw new Error("Missing fields should fail");
  });
}

/**
 * Generate test report
 */
function generateReport() {
  console.log("\n" + "=".repeat(60));
  console.log("INTEGRATION TEST REPORT");
  console.log("=".repeat(60));
  console.log();

  const categories = [...new Set(results.map((r) => r.category))];

  categories.forEach((category) => {
    const categoryResults = results.filter((r) => r.category === category);
    const passed = categoryResults.filter((r) => r.passed).length;
    const total = categoryResults.length;

    console.log(`${category}: ${passed}/${total} passed`);
    console.log("-".repeat(60));

    categoryResults.forEach((result) => {
      const status = result.passed ? "✅ PASS" : "❌ FAIL";
      const duration = result.duration.toFixed(2);
      console.log(`  ${status} ${result.name} (${duration}ms)`);
      if (result.error) {
        console.log(`       Error: ${result.error}`);
      }
    });
    console.log();
  });

  const totalPassed = results.filter((r) => r.passed).length;
  const totalTests = results.length;
  const passRate = (totalPassed / totalTests) * 100;

  console.log("=".repeat(60));
  console.log(`OVERALL: ${totalPassed}/${totalTests} tests passed (${passRate.toFixed(1)}%)`);
  console.log("=".repeat(60));

  if (passRate === 100) {
    console.log("\n✅ All integration tests passed!");
  } else {
    console.log("\n⚠️  Some tests failed. Review errors above.");
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("=".repeat(60));
  console.log("INTEGRATION TESTING SUITE");
  console.log("=".repeat(60));
  console.log();
  console.log("Testing core utilities and libraries...");

  try {
    await testErrorHandling();
    await testCacheManager();
    await testLogger();
    await testPerformanceMonitor();
    await testValidation();

    generateReport();

    const allPassed = results.every((r) => r.passed);
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error("\n❌ Test suite failed with error:");
    console.error(error);
    process.exit(1);
  }
}

main();
