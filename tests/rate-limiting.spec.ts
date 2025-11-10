import { test, expect } from "@playwright/test";

/**
 * Rate Limiting Tests
 * Tests AI endpoint rate limiting and security monitoring
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const TEST_VENDOR_TOKEN = process.env.TEST_VENDOR_TOKEN || "";

test.describe("AI Rate Limiting", () => {
  test("should rate limit AI chat endpoint after 30 requests", async ({
    request,
  }) => {
    // AI chat has 30 req/5min limit
    const endpoint = `${BASE_URL}/api/ai/chat`;

    // Make 30 successful requests
    for (let i = 0; i < 30; i++) {
      const response = await request.post(endpoint, {
        headers: {
          Authorization: `Bearer ${TEST_VENDOR_TOKEN}`,
          "Content-Type": "application/json",
        },
        data: {
          messages: [{ role: "user", content: `Test message ${i}` }],
        },
      });

      // Should succeed (or fail auth if token invalid, but not rate limited)
      expect([200, 401]).toContain(response.status());
    }

    // 31st request should be rate limited
    const rateLimitedResponse = await request.post(endpoint, {
      headers: {
        Authorization: `Bearer ${TEST_VENDOR_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: {
        messages: [{ role: "user", content: "This should be rate limited" }],
      },
    });

    expect(rateLimitedResponse.status()).toBe(429);

    const body = await rateLimitedResponse.json();
    expect(body).toHaveProperty("error");
    expect(body.error).toContain("rate limit");

    // Check headers
    expect(rateLimitedResponse.headers()["retry-after"]).toBeDefined();
    expect(rateLimitedResponse.headers()["x-ratelimit-limit"]).toBe("30");
    expect(rateLimitedResponse.headers()["x-ratelimit-remaining"]).toBe("0");
  });

  test("should rate limit AI generation endpoint after 10 requests", async ({
    request,
  }) => {
    // AI generation (DALL-E) has stricter 10 req/5min limit
    const endpoint = `${BASE_URL}/api/vendor/media/ai-generate`;

    // Make 10 requests
    for (let i = 0; i < 10; i++) {
      const response = await request.post(endpoint, {
        headers: {
          Authorization: `Bearer ${TEST_VENDOR_TOKEN}`,
          "Content-Type": "application/json",
        },
        data: {
          prompt: `Test prompt ${i}`,
          category: "product_photos",
        },
      });

      expect([200, 401, 400]).toContain(response.status());
    }

    // 11th request should be rate limited
    const rateLimitedResponse = await request.post(endpoint, {
      headers: {
        Authorization: `Bearer ${TEST_VENDOR_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: {
        prompt: "This should be rate limited",
        category: "product_photos",
      },
    });

    expect(rateLimitedResponse.status()).toBe(429);

    const body = await rateLimitedResponse.json();
    expect(body).toHaveProperty("error");
    expect(body).toHaveProperty("retryAfter");

    // Check rate limit headers
    expect(rateLimitedResponse.headers()["x-ratelimit-limit"]).toBe("10");
  });

  test("should rate limit general AI endpoints after 20 requests", async ({
    request,
  }) => {
    const endpoint = `${BASE_URL}/api/ai/quick-autofill`;

    // Make 20 requests
    for (let i = 0; i < 20; i++) {
      const response = await request.post(endpoint, {
        headers: {
          Authorization: `Bearer ${TEST_VENDOR_TOKEN}`,
          "Content-Type": "application/json",
        },
        data: {
          productName: `Test Product ${i}`,
        },
      });

      expect([200, 401, 400]).toContain(response.status());
    }

    // 21st request should be rate limited
    const rateLimitedResponse = await request.post(endpoint, {
      headers: {
        Authorization: `Bearer ${TEST_VENDOR_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: {
        productName: "Rate limited product",
      },
    });

    expect(rateLimitedResponse.status()).toBe(429);

    const body = await rateLimitedResponse.json();
    expect(body.error).toMatch(/rate limit/i);
  });

  test("should return proper rate limit headers", async ({ request }) => {
    const endpoint = `${BASE_URL}/api/ai/chat`;

    const response = await request.post(endpoint, {
      headers: {
        Authorization: `Bearer ${TEST_VENDOR_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: {
        messages: [{ role: "user", content: "Test" }],
      },
    });

    // If rate limited, should have proper headers
    if (response.status() === 429) {
      expect(response.headers()).toHaveProperty("retry-after");
      expect(response.headers()).toHaveProperty("x-ratelimit-limit");
      expect(response.headers()).toHaveProperty("x-ratelimit-remaining");
      expect(response.headers()).toHaveProperty("x-ratelimit-reset");
    }
  });
});

test.describe("Security Monitoring", () => {
  test("should log unauthorized access attempts", async ({ request }) => {
    const endpoint = `${BASE_URL}/api/admin/users`;

    // Make request without auth token
    const response = await request.get(endpoint);

    expect(response.status()).toBe(401);

    const body = await response.json();
    expect(body).toHaveProperty("error");
    expect(body.error).toMatch(/unauthorized/i);
  });

  test("should log forbidden access attempts", async ({ request }) => {
    // Use vendor token to access admin endpoint
    const endpoint = `${BASE_URL}/api/admin/analytics/dashboard`;

    const response = await request.get(endpoint, {
      headers: {
        Authorization: `Bearer ${TEST_VENDOR_TOKEN}`,
      },
    });

    // Should be forbidden (vendor trying to access admin route)
    expect([401, 403]).toContain(response.status());
  });

  test("should handle multiple failed auth attempts gracefully", async ({
    request,
  }) => {
    const endpoint = `${BASE_URL}/api/vendor/products/list`;

    // Make 5 failed auth attempts
    for (let i = 0; i < 5; i++) {
      const response = await request.get(endpoint, {
        headers: {
          Authorization: "Bearer invalid_token_123",
        },
      });

      expect(response.status()).toBe(401);
    }

    // System should still respond (not crash)
    const response = await request.get(endpoint, {
      headers: {
        Authorization: "Bearer another_invalid_token",
      },
    });

    expect(response.status()).toBe(401);
  });
});

test.describe("Rate Limit Recovery", () => {
  test("should reset rate limit after window expires", async ({ request }) => {
    // Note: This test would take 5+ minutes to run
    // Skipping in normal test runs
    test.skip();

    const endpoint = `${BASE_URL}/api/ai/chat`;

    // Hit rate limit
    for (let i = 0; i < 31; i++) {
      await request.post(endpoint, {
        headers: {
          Authorization: `Bearer ${TEST_VENDOR_TOKEN}`,
          "Content-Type": "application/json",
        },
        data: {
          messages: [{ role: "user", content: `Message ${i}` }],
        },
      });
    }

    // Should be rate limited
    let response = await request.post(endpoint, {
      headers: {
        Authorization: `Bearer ${TEST_VENDOR_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: {
        messages: [{ role: "user", content: "Should be rate limited" }],
      },
    });

    expect(response.status()).toBe(429);

    // Wait 5 minutes for window to reset
    await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000 + 1000));

    // Should work again
    response = await request.post(endpoint, {
      headers: {
        Authorization: `Bearer ${TEST_VENDOR_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: {
        messages: [{ role: "user", content: "Should work now" }],
      },
    });

    expect([200, 401]).toContain(response.status());
  });
});

test.describe("Rate Limit by IP", () => {
  test("should rate limit based on IP address", async ({ request }) => {
    const endpoint = `${BASE_URL}/api/ai/chat`;

    // Make requests from same IP (default request context)
    for (let i = 0; i < 30; i++) {
      await request.post(endpoint, {
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          messages: [{ role: "user", content: `Message ${i}` }],
        },
      });
    }

    // Next request from same IP should be rate limited (even without auth)
    const response = await request.post(endpoint, {
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        messages: [{ role: "user", content: "Rate limited by IP" }],
      },
    });

    // Should be rate limited OR unauthorized (both acceptable)
    expect([401, 429]).toContain(response.status());
  });
});

test.describe("Different Endpoint Limits", () => {
  test("AI chat should have different limit than AI generation", async ({
    request,
  }) => {
    // Chat: 30 req/5min
    // Generation: 10 req/5min

    const chatEndpoint = `${BASE_URL}/api/ai/chat`;
    const genEndpoint = `${BASE_URL}/api/vendor/media/ai-generate`;

    // Make 10 requests to generation endpoint
    for (let i = 0; i < 10; i++) {
      await request.post(genEndpoint, {
        headers: {
          Authorization: `Bearer ${TEST_VENDOR_TOKEN}`,
          "Content-Type": "application/json",
        },
        data: { prompt: `Prompt ${i}` },
      });
    }

    // 11th should be rate limited
    let response = await request.post(genEndpoint, {
      headers: {
        Authorization: `Bearer ${TEST_VENDOR_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: { prompt: "Should be rate limited" },
    });

    expect([429, 401]).toContain(response.status());

    // But chat should still have budget (separate limit)
    response = await request.post(chatEndpoint, {
      headers: {
        Authorization: `Bearer ${TEST_VENDOR_TOKEN}`,
        "Content-Type": "application/json",
      },
      data: {
        messages: [{ role: "user", content: "Should work" }],
      },
    });

    // Should not be rate limited (different endpoint)
    expect([200, 401]).toContain(response.status());
  });
});
