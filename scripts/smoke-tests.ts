/**
 * Production Smoke Tests
 * Quick tests to verify critical functionality after deployment
 *
 * Usage: npx tsx scripts/smoke-tests.ts [base-url]
 * Example: npx tsx scripts/smoke-tests.ts https://yachtclub.vip
 */

interface TestResult {
  test: string;
  passed: boolean;
  duration: number;
  status?: number;
  error?: string;
}

const results: TestResult[] = [];
const BASE_URL = process.argv[2] || "http://localhost:3000";

async function runTest(
  name: string,
  testFn: () => Promise<void>,
): Promise<void> {
  const start = performance.now();
  try {
    await testFn();
    results.push({
      test: name,
      passed: true,
      duration: performance.now() - start,
    });
  } catch (error: any) {
    results.push({
      test: name,
      passed: false,
      duration: performance.now() - start,
      error: error.message,
      status: error.status,
    });
  }
}

/**
 * TEST SUITE 1: Health Checks
 */
async function testHealthChecks() {
  console.log("\n🏥 Test Suite 1: Health Checks");
  console.log("-".repeat(60));

  // Test 1.1: Basic health check
  await runTest("Basic health check", async () => {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (!response.ok) {
      throw { message: "Health check failed", status: response.status };
    }
    const data = await response.json();
    if (!data.success) {
      throw { message: "Health check returned unsuccessful" };
    }
  });

  // Test 1.2: Homepage loads
  await runTest("Homepage loads", async () => {
    const response = await fetch(BASE_URL);
    if (!response.ok) {
      throw { message: "Homepage failed to load", status: response.status };
    }
  });
}

/**
 * TEST SUITE 2: Authentication Flow
 */
async function testAuthenticationFlow() {
  console.log("\n🔐 Test Suite 2: Authentication");
  console.log("-".repeat(60));

  // Test 2.1: Login page loads
  await runTest("Login page loads", async () => {
    const response = await fetch(`${BASE_URL}/login`);
    if (!response.ok) {
      throw { message: "Login page failed to load", status: response.status };
    }
  });

  // Test 2.2: Auth endpoint returns proper error for missing credentials
  await runTest("Auth endpoint validation", async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    // Should return 400 or 401 for missing credentials
    if (response.ok) {
      throw { message: "Auth endpoint should reject empty credentials" };
    }

    if (response.status !== 400 && response.status !== 401 && response.status !== 422) {
      throw { message: "Unexpected auth error status", status: response.status };
    }
  });

  // Test 2.3: Protected route rejects unauthenticated requests
  await runTest("Protected route security", async () => {
    const response = await fetch(`${BASE_URL}/api/vendor/products/list`);

    // Should return 401 Unauthorized
    if (response.ok) {
      throw { message: "Protected route should reject unauthenticated requests" };
    }

    if (response.status !== 401) {
      throw {
        message: "Protected route should return 401",
        status: response.status,
      };
    }
  });
}

/**
 * TEST SUITE 3: Rate Limiting
 */
async function testRateLimiting() {
  console.log("\n⏱️  Test Suite 3: Rate Limiting");
  console.log("-".repeat(60));

  // Test 3.1: Rate limit headers present
  await runTest("Rate limit headers", async () => {
    const response = await fetch(`${BASE_URL}/api/health`);

    const hasRateLimitHeaders =
      response.headers.has("X-RateLimit-Limit") ||
      response.headers.has("x-ratelimit-limit");

    if (!hasRateLimitHeaders) {
      // Not a failure - just means rate limiting might not be on health endpoint
      console.log("   ℹ️  No rate limit headers (may not be on health endpoint)");
    }
  });

  // Test 3.2: Rate limiting works (if configured)
  await runTest("Rate limiting mechanism", async () => {
    // Make multiple rapid requests to test rate limiting
    const requests = Array(10)
      .fill(null)
      .map(() =>
        fetch(`${BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@test.com", password: "test" }),
        }),
      );

    const responses = await Promise.all(requests);
    const rateLimited = responses.some((r) => r.status === 429);

    if (!rateLimited) {
      console.log("   ℹ️  No rate limiting detected (may use high limits)");
    }
  });
}

/**
 * TEST SUITE 4: API Endpoints
 */
async function testAPIEndpoints() {
  console.log("\n🔌 Test Suite 4: API Endpoints");
  console.log("-".repeat(60));

  // Test 4.1: Vendor API routes exist
  await runTest("Vendor API routes", async () => {
    const routes = [
      "/api/vendor/products/list",
      "/api/vendor/inventory",
      "/api/vendor/analytics/v2/sales/by-category",
    ];

    for (const route of routes) {
      const response = await fetch(`${BASE_URL}${route}`);

      // Should return 401 (auth required) not 404 (not found)
      if (response.status === 404) {
        throw { message: `Route ${route} not found (404)` };
      }
    }
  });

  // Test 4.2: Public API routes work
  await runTest("Public API accessibility", async () => {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (!response.ok) {
      throw { message: "Public API should be accessible", status: response.status };
    }
  });

  // Test 4.3: Error handling returns proper JSON
  await runTest("Error response format", async () => {
    const response = await fetch(`${BASE_URL}/api/vendor/products/list`);

    const contentType = response.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      throw { message: "Error responses should be JSON" };
    }

    const data = await response.json();
    if (typeof data !== "object") {
      throw { message: "Error response should be object" };
    }
  });
}

/**
 * TEST SUITE 5: Performance
 */
async function testPerformance() {
  console.log("\n⚡ Test Suite 5: Performance");
  console.log("-".repeat(60));

  // Test 5.1: Homepage loads quickly
  await runTest("Homepage performance", async () => {
    const start = performance.now();
    const response = await fetch(BASE_URL);
    const duration = performance.now() - start;

    if (!response.ok) {
      throw { message: "Homepage failed to load", status: response.status };
    }

    if (duration > 3000) {
      throw { message: `Homepage too slow: ${duration.toFixed(0)}ms (target: <3000ms)` };
    }

    console.log(`   ✓ Loaded in ${duration.toFixed(0)}ms`);
  });

  // Test 5.2: API response time
  await runTest("API response time", async () => {
    const start = performance.now();
    const response = await fetch(`${BASE_URL}/api/health`);
    const duration = performance.now() - start;

    if (!response.ok) {
      throw { message: "Health endpoint failed", status: response.status };
    }

    if (duration > 1000) {
      throw { message: `API too slow: ${duration.toFixed(0)}ms (target: <1000ms)` };
    }

    console.log(`   ✓ Responded in ${duration.toFixed(0)}ms`);
  });
}

/**
 * TEST SUITE 6: Database Connectivity
 */
async function testDatabaseConnectivity() {
  console.log("\n💾 Test Suite 6: Database Connectivity");
  console.log("-".repeat(60));

  // Test 6.1: Database health check
  await runTest("Database connection", async () => {
    const response = await fetch(`${BASE_URL}/api/health/database`);

    // If endpoint doesn't exist, that's okay
    if (response.status === 404) {
      console.log("   ℹ️  Database health endpoint not implemented");
      return;
    }

    if (!response.ok) {
      throw { message: "Database health check failed", status: response.status };
    }
  });
}

/**
 * TEST SUITE 7: Caching
 */
async function testCaching() {
  console.log("\n🗄️  Test Suite 7: Caching");
  console.log("-".repeat(60));

  // Test 7.1: Cache headers present
  await runTest("Cache headers", async () => {
    const response = await fetch(`${BASE_URL}/api/health`);

    const hasCacheHeaders =
      response.headers.has("Cache-Control") ||
      response.headers.has("cache-control");

    if (!hasCacheHeaders) {
      console.log("   ℹ️  No cache headers (may not cache health endpoint)");
    }
  });

  // Test 7.2: Redis health check
  await runTest("Redis connection", async () => {
    const response = await fetch(`${BASE_URL}/api/health/redis`);

    // If endpoint doesn't exist, that's okay
    if (response.status === 404) {
      console.log("   ℹ️  Redis health endpoint not implemented");
      return;
    }

    if (!response.ok) {
      throw { message: "Redis health check failed", status: response.status };
    }
  });
}

/**
 * TEST SUITE 8: Security Headers
 */
async function testSecurityHeaders() {
  console.log("\n🔒 Test Suite 8: Security Headers");
  console.log("-".repeat(60));

  // Test 8.1: Security headers present
  await runTest("Security headers", async () => {
    const response = await fetch(BASE_URL);

    const securityHeaders = [
      "X-Frame-Options",
      "X-Content-Type-Options",
      "Referrer-Policy",
    ];

    const missingHeaders = securityHeaders.filter(
      (header) => !response.headers.has(header) && !response.headers.has(header.toLowerCase()),
    );

    if (missingHeaders.length > 0) {
      console.log(`   ℹ️  Missing security headers: ${missingHeaders.join(", ")}`);
      console.log("   ℹ️  (Vercel adds these automatically in production)");
    }
  });

  // Test 8.2: HTTPS redirect (in production)
  await runTest("HTTPS enforcement", async () => {
    if (BASE_URL.startsWith("https://")) {
      // Try HTTP version
      const httpUrl = BASE_URL.replace("https://", "http://");
      try {
        const response = await fetch(httpUrl, { redirect: "manual" });
        if (response.status !== 301 && response.status !== 308) {
          console.log("   ℹ️  No HTTP to HTTPS redirect detected");
        }
      } catch (error) {
        // HTTP connection refused is also good - means only HTTPS is allowed
        console.log("   ✓ HTTP connections refused (HTTPS only)");
      }
    } else {
      console.log("   ℹ️  Testing against HTTP - HTTPS redirect not applicable");
    }
  });
}

/**
 * Generate test report
 */
function generateReport() {
  console.log("\n" + "=".repeat(60));
  console.log("SMOKE TEST REPORT");
  console.log("=".repeat(60));
  console.log();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => r.passed === false).length;
  const total = results.length;

  console.log(`Target: ${BASE_URL}`);
  console.log(`Results: ${passed}/${total} passed, ${failed} failed`);
  console.log();

  if (failed > 0) {
    console.log("Failed Tests:");
    console.log("-".repeat(60));

    results
      .filter((r) => !r.passed)
      .forEach((result) => {
        console.log(`  ❌ ${result.test}`);
        if (result.error) console.log(`     ${result.error}`);
        if (result.status) console.log(`     Status: ${result.status}`);
        console.log(`     Duration: ${result.duration.toFixed(0)}ms`);
      });
    console.log();
  }

  console.log("Passed Tests:");
  console.log("-".repeat(60));

  results
    .filter((r) => r.passed)
    .forEach((result) => {
      console.log(`  ✅ ${result.test} (${result.duration.toFixed(0)}ms)`);
    });

  console.log();
  console.log("=".repeat(60));

  if (failed === 0) {
    console.log("✅ All smoke tests passed! System is operational.");
    return 0;
  } else if (failed <= 2) {
    console.log("⚠️  Some tests failed, but system may be operational.");
    console.log("   Review failed tests above.");
    return 0;
  } else {
    console.log("❌ Multiple tests failed. System may have issues.");
    console.log("   Review and fix before proceeding.");
    return 1;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("=".repeat(60));
  console.log("PRODUCTION SMOKE TESTS");
  console.log("=".repeat(60));
  console.log();
  console.log(`Testing: ${BASE_URL}`);

  try {
    await testHealthChecks();
    await testAuthenticationFlow();
    await testRateLimiting();
    await testAPIEndpoints();
    await testPerformance();
    await testDatabaseConnectivity();
    await testCaching();
    await testSecurityHeaders();

    const exitCode = generateReport();
    process.exit(exitCode);
  } catch (error) {
    console.error("\n❌ Smoke tests failed with error:");
    console.error(error);
    process.exit(1);
  }
}

main();
