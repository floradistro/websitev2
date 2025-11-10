/**
 * PHASE 1 SECURITY TESTS: Header-Based Auth Bypass Prevention
 *
 * These tests verify that API routes cannot be exploited via header spoofing.
 * All vendor-scoped endpoints MUST extract vendor_id from authenticated session,
 * NOT from request headers.
 *
 * Test Coverage:
 * 1. Reject requests without auth token
 * 2. Ignore x-vendor-id header when present
 * 3. Only return data for authenticated vendor
 * 4. Prevent cross-vendor data access
 *
 * Date: November 8, 2025
 */

import { test, expect } from '@playwright/test';

// ============================================================================
// TEST HELPERS
// ============================================================================

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Test vendor credentials
const VENDOR_A_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'; // Flora Distro
const VENDOR_B_ID = 'test-vendor-b-uuid'; // Test vendor

/**
 * Get auth token for a vendor
 * In production, this would use actual login flow
 */
async function getAuthToken(vendorId: string, email: string, password: string): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  return data.token || data.access_token;
}

// ============================================================================
// TEST SUITE: HEADER SPOOFING PREVENTION
// ============================================================================

test.describe('Security: Header-Based Auth Bypass Prevention', () => {

  test.describe('1. Reject Unauthenticated Requests', () => {

    test('should reject GET /api/supabase/locations without auth token', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/supabase/locations`, {
        headers: {
          'x-vendor-id': VENDOR_A_ID, // Try to spoof
        },
      });

      // Should NOT accept header-based auth
      // Note: This endpoint may be public for retail locations, so check behavior
      const data = await response.json();

      // Either 401 Unauthorized OR returns only public/retail locations (not vendor locations)
      if (response.status() === 401) {
        expect(data.error).toContain('Unauthorized');
      } else if (response.status() === 200) {
        // If public, should NOT return vendor-specific locations without auth
        const locations = data.locations || [];
        const vendorLocations = locations.filter((l: any) => l.vendor_id === VENDOR_A_ID);
        expect(vendorLocations).toHaveLength(0); // No vendor locations without auth
      }
    });

    test('should reject PUT /api/supabase/products/[id] without auth token', async ({ request }) => {
      const productId = 'test-product-uuid';

      const response = await request.put(`${BASE_URL}/api/supabase/products/${productId}`, {
        headers: {
          'x-vendor-id': VENDOR_A_ID, // Try to spoof
          'Content-Type': 'application/json',
        },
        data: {
          name: 'Hacked Product Name',
        },
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Unauthorized');
    });

    test('should reject POST /api/vendor/inventory/adjust without auth token', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/vendor/inventory/adjust`, {
        headers: {
          'x-vendor-id': VENDOR_A_ID, // Try to spoof
          'Content-Type': 'application/json',
        },
        data: {
          productId: 'test-product-uuid',
          adjustment: 1000, // Try to give ourselves free inventory
        },
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Unauthorized');
    });

    test('should reject POST /api/vendor/employees without auth token', async ({ request }) => {
      const response = await request.post(`${BASE_URL}/api/vendor/employees`, {
        headers: {
          'x-vendor-id': VENDOR_A_ID, // Try to spoof
          'Content-Type': 'application/json',
        },
        data: {
          action: 'create',
          email: 'attacker@evil.com',
          first_name: 'Attacker',
          last_name: 'McHacker',
          role: 'admin', // Try to create admin account
        },
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Unauthorized');
    });

  });

  test.describe('2. Ignore x-vendor-id Header (Use Session Instead)', () => {

    test('should ignore x-vendor-id header when valid token present', async ({ request }) => {
      // Login as Vendor A
      const vendorAToken = await getAuthToken(
        VENDOR_A_ID,
        'vendor-a@test.com',
        'test-password'
      );

      // Try to access Vendor B's data by spoofing header
      const response = await request.get(`${BASE_URL}/api/vendor/employees`, {
        headers: {
          'Authorization': `Bearer ${vendorAToken}`,
          'x-vendor-id': VENDOR_B_ID, // Try to spoof different vendor
        },
      });

      const data = await response.json();

      // Should return Vendor A's employees (from token), NOT Vendor B's
      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);

      if (data.employees && data.employees.length > 0) {
        // All employees should belong to Vendor A (from token)
        expect(data.employees.every((e: any) => e.vendor_id === VENDOR_A_ID)).toBe(true);
      }
    });

    test('should use vendor_id from token, not header for inventory operations', async ({ request }) => {
      const vendorAToken = await getAuthToken(
        VENDOR_A_ID,
        'vendor-a@test.com',
        'test-password'
      );

      // Create inventory record
      const response = await request.post(`${BASE_URL}/api/vendor/inventory/adjust`, {
        headers: {
          'Authorization': `Bearer ${vendorAToken}`,
          'x-vendor-id': VENDOR_B_ID, // Try to spoof
          'Content-Type': 'application/json',
        },
        data: {
          productId: 'test-product-a-uuid', // Vendor A's product
          adjustment: 10,
        },
      });

      // Should succeed using Vendor A's token (ignore header)
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);

      // Verify it used Vendor A's vendor_id (from token), not Vendor B (from header)
      // The inventory record should be associated with Vendor A
      expect(data.inventory.vendor_id).toBe(VENDOR_A_ID);
    });

  });

  test.describe('3. Only Return Data for Authenticated Vendor', () => {

    test("should only return authenticated vendor's products", async ({ request }) => {
      const vendorAToken = await getAuthToken(
        VENDOR_A_ID,
        'vendor-a@test.com',
        'test-password'
      );

      const response = await request.get(`${BASE_URL}/api/vendor/products`, {
        headers: {
          'Authorization': `Bearer ${vendorAToken}`,
        },
      });

      const data = await response.json();

      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);

      // All products should belong to Vendor A
      if (data.products && data.products.length > 0) {
        expect(data.products.every((p: any) => p.vendor_id === VENDOR_A_ID)).toBe(true);
      }
    });

    test('should only return authenticated vendor\\'s locations', async ({ request }) => {
      const vendorAToken = await getAuthToken(
        VENDOR_A_ID,
        'vendor-a@test.com',
        'test-password'
      );

      const response = await request.get(`${BASE_URL}/api/vendor/locations`, {
        headers: {
          'Authorization': `Bearer ${vendorAToken}`,
        },
      });

      const data = await response.json();

      expect(response.status()).toBe(200);
      expect(data.success).toBe(true);

      // All locations should belong to Vendor A
      if (data.locations && data.locations.length > 0) {
        expect(data.locations.every((l: any) => l.vendor_id === VENDOR_A_ID)).toBe(true);
      }
    });

    test('should only return authenticated vendor\\'s inventory', async ({ request }) => {
      const vendorAToken = await getAuthToken(
        VENDOR_A_ID,
        'vendor-a@test.com',
        'test-password'
      );

      const response = await request.get(`${BASE_URL}/api/vendor/inventory`, {
        headers: {
          'Authorization': `Bearer ${vendorAToken}`,
        },
      });

      const data = await response.json();

      expect(response.status()).toBe(200);

      // All inventory should belong to Vendor A's products
      if (data.inventory && data.inventory.length > 0) {
        expect(data.inventory.every((i: any) => i.vendor_id === VENDOR_A_ID)).toBe(true);
      }
    });

  });

  test.describe('4. Prevent Cross-Vendor Data Access', () => {

    test('should not allow Vendor A to access Vendor B\\'s products', async ({ request }) => {
      const vendorAToken = await getAuthToken(
        VENDOR_A_ID,
        'vendor-a@test.com',
        'test-password'
      );

      // Try to update Vendor B's product
      const vendorBProductId = 'vendor-b-product-uuid';

      const response = await request.put(`${BASE_URL}/api/supabase/products/${vendorBProductId}`, {
        headers: {
          'Authorization': `Bearer ${vendorAToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          name: 'Hacked Product',
        },
      });

      // Should be rejected (404 or 403)
      expect([403, 404]).toContain(response.status());
      const data = await response.json();
      expect(data.error).toBeTruthy();
    });

    test('should not allow Vendor A to access Vendor B\\'s employees', async ({ request }) => {
      const vendorAToken = await getAuthToken(
        VENDOR_A_ID,
        'vendor-a@test.com',
        'test-password'
      );

      const response = await request.get(`${BASE_URL}/api/vendor/employees`, {
        headers: {
          'Authorization': `Bearer ${vendorAToken}`,
        },
      });

      const data = await response.json();

      expect(response.status()).toBe(200);

      // Should NOT return Vendor B's employees
      if (data.employees && data.employees.length > 0) {
        const vendorBEmployees = data.employees.filter((e: any) => e.vendor_id === VENDOR_B_ID);
        expect(vendorBEmployees).toHaveLength(0);
      }
    });

    test('should not allow Vendor A to adjust Vendor B\\'s inventory', async ({ request }) => {
      const vendorAToken = await getAuthToken(
        VENDOR_A_ID,
        'vendor-a@test.com',
        'test-password'
      );

      // Vendor B's product
      const vendorBProductId = 'vendor-b-product-uuid';

      const response = await request.post(`${BASE_URL}/api/vendor/inventory/adjust`, {
        headers: {
          'Authorization': `Bearer ${vendorAToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          productId: vendorBProductId,
          adjustment: 1000,
        },
      });

      // Should be rejected (403, 404, or 500 with authorization error)
      expect([403, 404, 500]).toContain(response.status());
    });

  });

  test.describe('5. Regression Tests (Ensure Functionality Still Works)', () => {

    test('should allow Vendor A to access their own products', async ({ request }) => {
      const vendorAToken = await getAuthToken(
        VENDOR_A_ID,
        'vendor-a@test.com',
        'test-password'
      );

      const response = await request.get(`${BASE_URL}/api/vendor/products`, {
        headers: {
          'Authorization': `Bearer ${vendorAToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    test('should allow Vendor A to adjust their own inventory', async ({ request }) => {
      const vendorAToken = await getAuthToken(
        VENDOR_A_ID,
        'vendor-a@test.com',
        'test-password'
      );

      // Vendor A's product
      const vendorAProductId = 'vendor-a-product-uuid';

      const response = await request.post(`${BASE_URL}/api/vendor/inventory/adjust`, {
        headers: {
          'Authorization': `Bearer ${vendorAToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          productId: vendorAProductId,
          adjustment: 5,
        },
      });

      // Should succeed
      expect([200, 201]).toContain(response.status());
    });

    test('should allow Vendor A to manage their employees', async ({ request }) => {
      const vendorAToken = await getAuthToken(
        VENDOR_A_ID,
        'vendor-a@test.com',
        'test-password'
      );

      const response = await request.post(`${BASE_URL}/api/vendor/employees`, {
        headers: {
          'Authorization': `Bearer ${vendorAToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          action: 'create',
          email: 'new-employee@vendor-a.com',
          first_name: 'New',
          last_name: 'Employee',
          role: 'staff',
        },
      });

      // Should succeed (or return validation error, but not auth error)
      expect([200, 201, 400]).toContain(response.status());

      if (response.status() === 400) {
        const data = await response.json();
        // Should be validation error, not auth error
        expect(data.error).not.toContain('Unauthorized');
        expect(data.error).not.toContain('Forbidden');
      }
    });

  });

});

// ============================================================================
// TEST SUITE: SPECIFIC ROUTES
// ============================================================================

test.describe('Security: Specific Route Tests', () => {

  const FIXED_ROUTES = [
    '/api/supabase/locations',
    '/api/supabase/products/:id',
    '/api/vendor/inventory/adjust',
    '/api/vendor/inventory/transfer',
    '/api/vendor/employees',
  ];

  for (const route of FIXED_ROUTES) {
    test(`${route} should not accept x-vendor-id header`, async ({ request }) => {
      // Test without auth - should be rejected
      const response = await request.get(`${BASE_URL}${route.replace(':id', 'test-uuid')}`, {
        headers: {
          'x-vendor-id': VENDOR_A_ID,
        },
      });

      // Should be 401 or return empty/public data only
      if (response.status() !== 401) {
        const data = await response.json();
        // If not 401, should not return vendor-specific data
        if (data.products) expect(data.products).toHaveLength(0);
        if (data.locations) {
          const vendorLocs = data.locations.filter((l: any) => l.vendor_id);
          expect(vendorLocs).toHaveLength(0);
        }
        if (data.employees) expect(data.employees).toHaveLength(0);
      }
    });
  }

});
