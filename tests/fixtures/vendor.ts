import { test as base } from '@playwright/test';

// Test vendor data (Flora Distribution)
export const VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
export const VENDOR_EMAIL = 'vendor@floradistro.com';
export const VENDOR_STORE_NAME = 'Flora Distribution';
export const VENDOR_SLUG = 'floradistro';
export const BASE_URL = 'http://localhost:3000';

// Sample location ID for Flora Distribution
export const LOCATION_ID = 'c4eedafb-4050-4d2d-a6af-e164aad5d934';

// Sample menu ID
export const MENU_ID = '47425963-ad46-4213-b569-3f2c8117c1ac';

// Extended test with vendor context
export const test = base.extend<{
  vendorPage: any;
  vendorId: string;
  locationId: string;
}>({
  vendorId: VENDOR_ID,
  locationId: LOCATION_ID,

  vendorPage: async ({ page }, use) => {
    // This fixture ensures we're on a vendor page with auth
    await page.goto(`${BASE_URL}/vendor/dashboard`);
    await use(page);
  },
});

export { expect } from '@playwright/test';

// Helper functions for common test operations
export async function waitForNetworkIdle(page: any, timeout = 3000) {
  await page.waitForLoadState('networkidle', { timeout });
}

export async function createTestPromotion(page: any, data: {
  name: string;
  type: 'product' | 'category' | 'tier' | 'global';
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  badgeText?: string;
  badgeColor?: string;
}) {
  await page.goto(`${BASE_URL}/vendor/promotions`);
  await waitForNetworkIdle(page);

  // Click Create Promotion button
  await page.click('button:has-text("Create Promotion")');

  // Wait for modal to open and stabilize
  await page.waitForSelector('input[placeholder*="20% Off"]', { state: 'visible', timeout: 10000 });
  await page.waitForTimeout(800); // Wait for modal animation

  // Fill in basic info
  await page.fill('input[placeholder*="20% Off"]', data.name);
  await page.click(`button:has-text("${data.type.charAt(0).toUpperCase() + data.type.slice(1)}")`);
  await page.click(`button:has-text("${data.discountType === 'percentage' ? '%' : '$'}")`);
  await page.fill('input[placeholder="20"]', data.discountValue.toString());

  if (data.badgeText) {
    await page.fill('input[placeholder="20% OFF"]', data.badgeText);
  }

  if (data.badgeColor) {
    await page.click(`button[style*="${data.badgeColor}"]`);
  }

  // Submit
  await page.click('button:has-text("Create"):last-child');

  // Wait for success
  await page.waitForTimeout(2000);
  await waitForNetworkIdle(page);
}

export async function deleteAllTestPromotions(page: any) {
  await page.goto(`${BASE_URL}/vendor/promotions`);
  await waitForNetworkIdle(page);
  
  // Get all delete buttons
  const deleteButtons = await page.locator('button:has-text("Delete")').all();
  
  for (const button of deleteButtons) {
    await button.click();
    // Confirm deletion
    await page.click('button:has-text("Confirm")');
    await page.waitForTimeout(500);
  }
}
