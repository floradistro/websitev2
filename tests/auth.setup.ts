import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/vendor.json');

// Test vendor credentials (Flora Distribution)
const VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
const VENDOR_EMAIL = 'vendor@floradistro.com';
const VENDOR_STORE_NAME = 'Flora Distribution';
const VENDOR_SLUG = 'floradistro';

setup('authenticate as vendor', async ({ page }) => {
  console.log('🔐 Setting up vendor authentication...');

  // Navigate to vendor dashboard and inject auth directly (most reliable for testing)
  await page.goto('http://localhost:3000/vendor/dashboard');

  // Inject vendor data directly into localStorage
  await page.evaluate((vendorData) => {
      // AppAuthContext uses 'app_user' NOT 'vendor_user'
      const appUser = {
        id: vendorData.id,
        email: vendorData.email,
        name: vendorData.store_name,
        role: 'vendor_admin',
        vendor_id: vendorData.id,
        vendor: {
          id: vendorData.id,
          store_name: vendorData.store_name,
          slug: vendorData.slug,
          vendor_type: vendorData.vendor_type,
          pos_enabled: vendorData.pos_enabled,
        }
      };

      // Set both formats for compatibility
      localStorage.setItem('app_user', JSON.stringify(appUser));
      localStorage.setItem('vendor_user', JSON.stringify(vendorData));
      localStorage.setItem('vendor_authenticated', 'true');
      localStorage.setItem('vendor_id', vendorData.id);
      localStorage.setItem('vendor_email', vendorData.email);
    }, {
      id: VENDOR_ID,
      store_name: VENDOR_STORE_NAME,
      slug: VENDOR_SLUG,
      email: VENDOR_EMAIL,
      user_id: VENDOR_ID,
      vendor_type: 'standard',
      pos_enabled: true,
    });

  // Reload to apply auth
  await page.reload();
  await page.waitForTimeout(1000); // Wait for auth to take effect

  // Verify and ensure auth is persisted
  await page.evaluate((vendorData) => {
    // AppAuthContext uses 'app_user' NOT 'vendor_user'
    const appUser = {
      id: vendorData.id,
      email: vendorData.email,
      name: vendorData.store_name,
      role: 'vendor_admin',
      vendor_id: vendorData.id,
      vendor: {
        id: vendorData.id,
        store_name: vendorData.store_name,
        slug: vendorData.slug,
        vendor_type: vendorData.vendor_type,
        pos_enabled: vendorData.pos_enabled,
      }
    };

    // Set both formats for compatibility
    localStorage.setItem('app_user', JSON.stringify(appUser));
    localStorage.setItem('vendor_user', JSON.stringify(vendorData));
    localStorage.setItem('vendor_authenticated', 'true');
    localStorage.setItem('vendor_id', vendorData.id);
    localStorage.setItem('vendor_email', vendorData.email);
  }, {
    id: VENDOR_ID,
    store_name: VENDOR_STORE_NAME,
    slug: VENDOR_SLUG,
    email: VENDOR_EMAIL,
    user_id: VENDOR_ID,
    vendor_type: 'standard',
    pos_enabled: true,
  });

  // Verify auth by checking localStorage
  const authState = await page.evaluate(() => ({
    hasVendor: localStorage.getItem('app_user') !== null,
    vendorData: localStorage.getItem('app_user'),
  }));

  expect(authState.hasVendor).toBeTruthy();
  console.log('✅ Vendor authentication verified');
  console.log(`   Vendor: ${VENDOR_STORE_NAME} (${VENDOR_ID})`);

  // Save signed-in state to 'playwright/.auth/vendor.json'
  await page.context().storageState({ path: authFile });
  console.log(`✅ Auth state saved to ${authFile}`);
});
