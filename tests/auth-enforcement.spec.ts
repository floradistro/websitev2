import { test, expect } from "@playwright/test";

/**
 * Phase 1 Security - Authentication Enforcement Test Suite
 *
 * Tests that all protected routes properly enforce authentication
 * and return 401 Unauthorized when accessed without credentials.
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

test.describe("Authentication Enforcement - Admin Routes", () => {
  const adminGetRoutes = [
    "/api/admin/analytics?vendor_id=test",
    "/api/admin/check-tables",
    "/api/admin/metrics?vendor_id=test",
    "/api/admin/vendors/test-id",
  ];

  adminGetRoutes.forEach((route) => {
    test(`GET ${route} should return 401 without auth`, async ({ request }) => {
      const response = await request.get(`${BASE_URL}${route}`);

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.error || body.message).toContain("Unauthorized");
    });
  });

  const adminPostRoutes = [
    { url: "/api/admin/dev-tools", data: { command: "test" } },
    { url: "/api/admin/diagnose-rls", data: {} },
  ];

  adminPostRoutes.forEach(({ url, data }) => {
    test(`POST ${url} should return 401 without auth`, async ({ request }) => {
      const response = await request.post(`${BASE_URL}${url}`, {
        data,
        headers: { "Content-Type": "application/json" },
      });

      expect(response.status()).toBe(401);
    });
  });

  test("DELETE /api/admin/products/orphaned should return 401", async ({ request }) => {
    const response = await request.delete(`${BASE_URL}/api/admin/products/orphaned`);
    expect(response.status()).toBe(401);
  });

  test("POST /api/admin/run-migration should return 401", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/admin/run-migration`, {
      data: { test: true },
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status()).toBe(401);
  });
});

test.describe("Authentication Enforcement - Vendor Routes", () => {
  const vendorRoutes = [
    "/api/vendor/badge-counts?vendor_id=test",
    "/api/vendor/categories/subcategories?vendor_id=test&parent_categories=flower",
    "/api/vendor/category-pricing?vendor_id=test",
    "/api/vendor/inventory/low-stock?vendor_id=test",
    "/api/vendor/terminals?vendor_id=test",
    "/api/vendor/tv-menus?vendor_id=test",
    "/api/vendor/wholesale-customers?vendor_id=test",
  ];

  vendorRoutes.forEach((route) => {
    test(`${route} should return 401 without auth`, async ({ request }) => {
      const response = await request.get(`${BASE_URL}${route}`);

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.error || body.message).toContain("Unauthorized");
    });
  });

  test("POST /api/vendor/tv-menus should return 401", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/vendor/tv-menus`, {
      data: { vendor_id: "test", name: "Test Menu", config_data: {} },
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status()).toBe(401);
  });
});

test.describe("Authentication Enforcement - Customer Routes", () => {
  const customerRoutes = [
    "/api/customer/wallet-pass?customer_id=test",
    "/api/customer-orders?customer=test",
    "/api/customers/test-id",
  ];

  customerRoutes.forEach((route) => {
    test(`${route} should return 401 without auth`, async ({ request }) => {
      const response = await request.get(`${BASE_URL}${route}`);

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.error || body.message).toContain("Unauthorized");
    });
  });

  test("PUT /api/customers/:id should return 401", async ({ request }) => {
    const response = await request.put(`${BASE_URL}/api/customers/test-id`, {
      data: { first_name: "Test" },
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status()).toBe(401);
  });
});

test.describe("Authentication Enforcement - POS Routes", () => {
  const posGetRoutes = [
    "/api/pos/customers?location_id=test",
    "/api/pos/products/lookup?sku=test",
    "/api/pos/sessions/status?session_id=test",
    "/api/pos/sessions/active?location_id=test",
  ];

  posGetRoutes.forEach((route) => {
    test(`GET ${route} should return 401 without auth`, async ({ request }) => {
      const response = await request.get(`${BASE_URL}${route}`);

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.error || body.message).toContain("Unauthorized");
    });
  });

  test("POST /api/pos/registers/identify should return 401", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/pos/registers/identify`, {
      data: { terminal_id: "test" },
      headers: { "Content-Type": "application/json" },
    });
    expect(response.status()).toBe(401);
  });

  test("POST /api/pos/sales/create should return 401", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/pos/sales/create`, {
      data: {
        locationId: "test",
        vendorId: "test",
        items: [],
        subtotal: 0,
        taxAmount: 0,
        total: 0,
        paymentMethod: "cash",
      },
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status()).toBe(401);
  });

  test("POST /api/pos/sessions/close should return 401", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/pos/sessions/close`, {
      data: { session_id: "test" },
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status()).toBe(401);
  });

  test("POST /api/pos/customers/create should return 401", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/pos/customers/create`, {
      data: { first_name: "Test", last_name: "Customer" },
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status()).toBe(401);
  });
});

test.describe("Security - No Auth Token Leakage", () => {
  test("401 responses should not leak sensitive info", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/admin/analytics?vendor_id=test`);
    const body = await response.text();

    // Should NOT contain sensitive information
    expect(body).not.toContain("JWT");
    expect(body).not.toContain("token");
    expect(body).not.toContain("secret");
    expect(body).not.toContain("password");
    expect(body).not.toContain("Bearer");
  });
});

test.describe("Security - Rate Limiting (Optional)", () => {
  test("Multiple failed auth attempts should still return 401", async ({ request }) => {
    const promises = Array(5).fill(null).map(() =>
      request.get(`${BASE_URL}/api/admin/analytics?vendor_id=test`)
    );

    const responses = await Promise.all(promises);

    // All should return 401, not 429 or 500
    responses.forEach(response => {
      expect(response.status()).toBe(401);
    });
  });
});
