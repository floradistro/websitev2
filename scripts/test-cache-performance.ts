/**
 * Cache Performance Testing Script
 * Tests various caching strategies and measures performance
 *
 * Usage: npx tsx scripts/test-cache-performance.ts
 */

import { redisCache, CacheKeys } from "@/lib/redis-cache";
import {
  writeThroughCache,
  staleWhileRevalidate,
  multiTierCache,
  cacheWarmer,
} from "@/lib/advanced-cache-strategies";

interface TestResult {
  strategy: string;
  operation: string;
  duration: number;
  success: boolean;
  hitRate?: number;
}

const results: TestResult[] = [];

/**
 * Test 1: Basic Cache Performance
 */
async function testBasicCache() {
  console.log("\n📋 Test 1: Basic Cache Performance");
  console.log("-".repeat(60));

  const testKey = "test:product:123";
  const testData = { id: "123", name: "Test Product", price: 99.99 };

  // Test SET performance
  const setStart = performance.now();
  await redisCache.set(testKey, testData, 300);
  const setDuration = performance.now() - setStart;

  console.log(`SET operation: ${setDuration.toFixed(2)}ms`);

  results.push({
    strategy: "basic-cache",
    operation: "SET",
    duration: setDuration,
    success: true,
  });

  // Test GET performance (should be cached)
  const getStart = performance.now();
  const cached = await redisCache.get(testKey);
  const getDuration = performance.now() - getStart;

  console.log(`GET operation: ${getDuration.toFixed(2)}ms`);
  console.log(`Cache hit: ${cached !== null ? "✅ YES" : "❌ NO"}`);

  results.push({
    strategy: "basic-cache",
    operation: "GET",
    duration: getDuration,
    success: cached !== null,
  });

  // Cleanup
  await redisCache.delete(testKey);
}

/**
 * Test 2: Cache Hit Rate
 */
async function testCacheHitRate() {
  console.log("\n📋 Test 2: Cache Hit Rate");
  console.log("-".repeat(60));

  const requests = 100;
  const uniqueKeys = 10; // 10 unique keys, so we expect ~90% hit rate
  let hits = 0;
  let misses = 0;

  console.log(`Simulating ${requests} requests across ${uniqueKeys} unique items...`);

  for (let i = 0; i < requests; i++) {
    const keyIndex = i % uniqueKeys;
    const key = `test:hitrate:${keyIndex}`;

    const cached = await redisCache.get(key);

    if (cached !== null) {
      hits++;
    } else {
      misses++;
      // Simulate cache miss - populate cache
      await redisCache.set(key, { id: keyIndex, data: `Item ${keyIndex}` }, 300);
    }
  }

  const hitRate = (hits / requests) * 100;
  console.log(`Cache hits: ${hits}`);
  console.log(`Cache misses: ${misses}`);
  console.log(`Hit rate: ${hitRate.toFixed(1)}%`);

  results.push({
    strategy: "hit-rate",
    operation: "MIXED",
    duration: 0,
    success: hitRate > 80,
    hitRate,
  });

  // Cleanup
  for (let i = 0; i < uniqueKeys; i++) {
    await redisCache.delete(`test:hitrate:${i}`);
  }
}

/**
 * Test 3: Multi-Tier Cache Performance
 */
async function testMultiTierCache() {
  console.log("\n📋 Test 3: Multi-Tier Cache Performance");
  console.log("-".repeat(60));

  const testKey = "test:multitier:product";
  let fetchCount = 0;

  const fetchFn = async () => {
    fetchCount++;
    // Simulate database fetch
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { id: "456", name: "Multi-Tier Product", price: 199.99 };
  };

  // First request: Cache miss (all tiers)
  console.log("Request 1: Cold start (cache miss)");
  const start1 = performance.now();
  await multiTierCache.get(testKey, fetchFn, 300);
  const duration1 = performance.now() - start1;
  console.log(`Duration: ${duration1.toFixed(2)}ms (fetched from DB: ${fetchCount} times)`);

  // Second request: L1 cache hit (fastest)
  console.log("\nRequest 2: L1 cache hit");
  const start2 = performance.now();
  await multiTierCache.get(testKey, fetchFn, 300);
  const duration2 = performance.now() - start2;
  console.log(`Duration: ${duration2.toFixed(2)}ms (fetched from DB: ${fetchCount} times)`);

  const speedup = ((duration1 - duration2) / duration1) * 100;
  console.log(`\nSpeed improvement: ${speedup.toFixed(0)}% faster`);

  results.push({
    strategy: "multi-tier",
    operation: "GET",
    duration: duration2,
    success: duration2 < duration1 && fetchCount === 1,
  });

  // Cleanup
  await multiTierCache.invalidate(testKey);
}

/**
 * Test 4: Stale-While-Revalidate Performance
 */
async function testStaleWhileRevalidate() {
  console.log("\n📋 Test 4: Stale-While-Revalidate");
  console.log("-".repeat(60));

  const testKey = "test:swr:data";
  let fetchCount = 0;

  const fetchFn = async () => {
    fetchCount++;
    await new Promise((resolve) => setTimeout(resolve, 100)); // Slow fetch
    return { timestamp: Date.now(), data: "Fresh data" };
  };

  // Initial request: Cache miss
  console.log("Request 1: Initial fetch");
  const start1 = performance.now();
  const result1 = await staleWhileRevalidate.get(testKey, fetchFn, 2, 10); // 2s fresh, 10s stale
  const duration1 = performance.now() - start1;
  console.log(`Duration: ${duration1.toFixed(2)}ms`);

  // Wait for data to become stale (2 seconds)
  console.log("\nWaiting 2.5 seconds for data to become stale...");
  await new Promise((resolve) => setTimeout(resolve, 2500));

  // Request with stale data: Should return immediately
  console.log("\nRequest 2: Stale data (should be instant)");
  const start2 = performance.now();
  const result2 = await staleWhileRevalidate.get(testKey, fetchFn, 2, 10);
  const duration2 = performance.now() - start2;
  console.log(`Duration: ${duration2.toFixed(2)}ms`);
  console.log(`Returned stale data: ${result1.timestamp === result2.timestamp ? "✅ YES" : "❌ NO"}`);

  results.push({
    strategy: "stale-while-revalidate",
    operation: "GET",
    duration: duration2,
    success: duration2 < 50, // Should be <50ms
  });

  // Cleanup
  await redisCache.delete(testKey);
}

/**
 * Test 5: Cache Warming
 */
async function testCacheWarming() {
  console.log("\n📋 Test 5: Cache Warming");
  console.log("-".repeat(60));

  const keys = Array.from({ length: 20 }, (_, i) => `test:warm:product:${i}`);

  const fetchFn = async (key: string) => {
    const id = key.split(":").pop();
    return { id, name: `Product ${id}`, price: Math.random() * 100 };
  };

  console.log(`Warming ${keys.length} cache entries...`);

  const start = performance.now();
  await cacheWarmer.warmKeys(keys, fetchFn, 300);
  const duration = performance.now() - start;

  console.log(`Warming complete: ${duration.toFixed(2)}ms`);
  console.log(`Avg per key: ${(duration / keys.length).toFixed(2)}ms`);

  // Verify all keys are cached
  let cachedCount = 0;
  for (const key of keys) {
    const exists = await redisCache.has(key);
    if (exists) cachedCount++;
  }

  console.log(`Cached keys: ${cachedCount}/${keys.length}`);

  results.push({
    strategy: "cache-warming",
    operation: "WARM",
    duration,
    success: cachedCount === keys.length,
  });

  // Cleanup
  for (const key of keys) {
    await redisCache.delete(key);
  }
}

/**
 * Test 6: Concurrent Cache Access
 */
async function testConcurrentAccess() {
  console.log("\n📋 Test 6: Concurrent Cache Access");
  console.log("-".repeat(60));

  const concurrency = 50;
  const testKey = "test:concurrent:data";

  console.log(`Testing ${concurrency} concurrent requests...`);

  // Pre-populate cache
  await redisCache.set(testKey, { message: "Concurrent test data" }, 300);

  const start = performance.now();

  const promises = Array.from({ length: concurrency }, () => redisCache.get(testKey));

  const results = await Promise.all(promises);
  const duration = performance.now() - start;

  const successCount = results.filter((r) => r !== null).length;

  console.log(`Total time: ${duration.toFixed(2)}ms`);
  console.log(`Avg per request: ${(duration / concurrency).toFixed(2)}ms`);
  console.log(`Success rate: ${successCount}/${concurrency}`);

  results.push({
    strategy: "concurrent",
    operation: "GET",
    duration: duration / concurrency,
    success: successCount === concurrency,
  });

  // Cleanup
  await redisCache.delete(testKey);
}

/**
 * Generate Performance Report
 */
function generateReport() {
  console.log("\n" + "=".repeat(60));
  console.log("CACHE PERFORMANCE TEST REPORT");
  console.log("=".repeat(60));
  console.log();

  const totalTests = results.length;
  const passedTests = results.filter((r) => r.success).length;
  const passRate = (passedTests / totalTests) * 100;

  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Pass Rate: ${passRate.toFixed(1)}%`);
  console.log();

  // Performance Summary
  console.log("Performance Summary:");
  console.log("-".repeat(60));

  results.forEach((result) => {
    const status = result.success ? "✅ PASS" : "❌ FAIL";
    const duration = result.duration > 0 ? ` (${result.duration.toFixed(2)}ms)` : "";
    const hitRate = result.hitRate ? ` - Hit Rate: ${result.hitRate.toFixed(1)}%` : "";

    console.log(`${result.strategy} - ${result.operation}: ${status}${duration}${hitRate}`);
  });

  console.log();

  // Recommendations
  console.log("Recommendations:");
  console.log("-".repeat(60));

  const avgDuration =
    results.filter((r) => r.duration > 0).reduce((sum, r) => sum + r.duration, 0) /
    results.filter((r) => r.duration > 0).length;

  if (avgDuration < 10) {
    console.log("✅ Excellent cache performance (<10ms average)");
  } else if (avgDuration < 50) {
    console.log("✅ Good cache performance (<50ms average)");
  } else {
    console.log("⚠️  Cache performance could be improved (>50ms average)");
  }

  const hitRateTest = results.find((r) => r.hitRate !== undefined);
  if (hitRateTest && hitRateTest.hitRate) {
    if (hitRateTest.hitRate > 90) {
      console.log("✅ Excellent cache hit rate (>90%)");
    } else if (hitRateTest.hitRate > 70) {
      console.log("✅ Good cache hit rate (>70%)");
    } else {
      console.log("⚠️  Low cache hit rate - consider cache warming");
    }
  }

  console.log();
  console.log("For more information, see:");
  console.log("- docs/REDIS_CACHING_GUIDE.md");
  console.log("- lib/advanced-cache-strategies.ts");
  console.log();
}

/**
 * Main execution
 */
async function main() {
  console.log("=".repeat(60));
  console.log("CACHE PERFORMANCE TESTING");
  console.log("=".repeat(60));
  console.log();
  console.log("Testing various caching strategies and measuring performance...");

  try {
    await testBasicCache();
    await testCacheHitRate();
    await testMultiTierCache();
    await testStaleWhileRevalidate();
    await testCacheWarming();
    await testConcurrentAccess();

    generateReport();

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test suite failed with error:");
    console.error(error);
    process.exit(1);
  }
}

main();
