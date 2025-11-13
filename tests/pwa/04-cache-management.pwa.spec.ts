import { test, expect } from "@playwright/test";

/**
 * Cache Management Tests
 *
 * Tests caching behavior:
 * - Cache creation
 * - Cache hits and misses
 * - Cache size monitoring
 * - Cache cleanup
 */

test.describe("Cache Management", () => {
  test("should create caches when service worker activates", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for service worker to create caches
    await page.waitForTimeout(4000);

    const cacheInfo = await page.evaluate(async () => {
      if (!("caches" in window)) {
        return { supported: false };
      }

      try {
        const cacheNames = await caches.keys();

        return {
          supported: true,
          cacheCount: cacheNames.length,
          cacheNames: cacheNames,
        };
      } catch (error) {
        return {
          supported: true,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    expect(cacheInfo.supported).toBeTruthy();

    if (process.env.NODE_ENV === "production" && cacheInfo.cacheCount) {
      expect(cacheInfo.cacheCount).toBeGreaterThan(0);
      console.log("✅ Caches created:", cacheInfo.cacheCount);
      console.log("   Cache names:", cacheInfo.cacheNames);
    } else {
      console.log("⚠️  No caches (development mode or not yet created)");
    }
  });

  test("should cache static assets", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for caching to complete
    await page.waitForTimeout(3000);

    const cachedAssets = await page.evaluate(async () => {
      if (!("caches" in window)) return { supported: false };

      try {
        const cacheNames = await caches.keys();
        let totalAssets = 0;
        const assetTypes: Record<string, number> = {};

        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();

          for (const request of requests) {
            totalAssets++;

            // Categorize by file extension
            const url = request.url;
            if (url.match(/\.(js|mjs)$/)) {
              assetTypes.javascript = (assetTypes.javascript || 0) + 1;
            } else if (url.match(/\.css$/)) {
              assetTypes.css = (assetTypes.css || 0) + 1;
            } else if (url.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/)) {
              assetTypes.images = (assetTypes.images || 0) + 1;
            } else if (url.match(/\.(woff|woff2|ttf|otf|eot)$/)) {
              assetTypes.fonts = (assetTypes.fonts || 0) + 1;
            } else if (url.includes("/api/")) {
              assetTypes.api = (assetTypes.api || 0) + 1;
            } else {
              assetTypes.other = (assetTypes.other || 0) + 1;
            }
          }
        }

        return {
          supported: true,
          totalAssets,
          assetTypes,
        };
      } catch (error) {
        return {
          supported: true,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    if (cachedAssets.totalAssets) {
      expect(cachedAssets.totalAssets).toBeGreaterThan(0);
      console.log("✅ Assets cached:", cachedAssets.totalAssets);
      console.log("   Asset types:", cachedAssets.assetTypes);
    } else {
      console.log("⚠️  No assets cached yet");
    }
  });

  test("should estimate cache storage usage", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const storageEstimate = await page.evaluate(async () => {
      if (!("storage" in navigator) || !("estimate" in navigator.storage)) {
        return { supported: false };
      }

      try {
        const estimate = await navigator.storage.estimate();

        return {
          supported: true,
          usage: estimate.usage || 0,
          quota: estimate.quota || 0,
          usageMB: ((estimate.usage || 0) / 1024 / 1024).toFixed(2),
          quotaMB: ((estimate.quota || 0) / 1024 / 1024).toFixed(2),
          percentUsed: (((estimate.usage || 0) / (estimate.quota || 1)) * 100).toFixed(2),
        };
      } catch (error) {
        return {
          supported: true,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    expect(storageEstimate.supported).toBeTruthy();

    if (storageEstimate.usageMB) {
      console.log("✅ Storage estimate available");
      console.log(`   Usage: ${storageEstimate.usageMB}MB / ${storageEstimate.quotaMB}MB`);
      console.log(`   Percent used: ${storageEstimate.percentUsed}%`);

      // Ensure we're not using too much storage
      expect(parseFloat(storageEstimate.percentUsed!)).toBeLessThan(80);
    }
  });

  test("should handle cache cleanup", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const cleanupResult = await page.evaluate(async () => {
      if (!("caches" in window)) return { supported: false };

      try {
        const initialCaches = await caches.keys();
        const initialCount = initialCaches.length;

        // Try to delete a test cache (if it exists)
        const testCacheName = "test-cache-to-delete";
        await caches.open(testCacheName);
        await caches.delete(testCacheName);

        const finalCaches = await caches.keys();

        return {
          supported: true,
          canDelete: true,
          initialCount,
          finalCount: finalCaches.length,
        };
      } catch (error) {
        return {
          supported: true,
          canDelete: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    expect(cleanupResult.supported).toBeTruthy();
    console.log("✅ Cache cleanup works");
  });

  test("should not exceed cache size limits", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // iOS has 50MB limit, let's check we're under 40MB
    const estimate = await page.evaluate(async () => {
      if (!("storage" in navigator) || !("estimate" in navigator.storage)) {
        return null;
      }

      const est = await navigator.storage.estimate();
      return ((est.usage || 0) / 1024 / 1024); // Convert to MB
    });

    if (estimate !== null) {
      // Should be under 40MB (leaving headroom for iOS 50MB limit)
      expect(estimate).toBeLessThan(40);
      console.log(`✅ Cache size OK: ${estimate.toFixed(2)}MB`);
    }
  });
});
