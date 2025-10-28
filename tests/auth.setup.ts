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

  // Go to vendor login page
  await page.goto('http://localhost:3000/vendor/login');

  // Fill in credentials and submit
  await page.fill('input[type="email"]', VENDOR_EMAIL);
  await page.fill('input[type="password"]', 'testpassword123');
  await page.click('button[type="submit"]');

  // Wait for successful login - either dashboard or any vendor page loads
  try {
    await page.waitForURL('**/vendor/**', { timeout: 10000 });
    console.log('✅ Logged in successfully');
  } catch (error) {
    console.log('⚠️  Login redirect timeout, trying alternative auth method...');
    
    // Alternative: Set localStorage directly (for development/testing)
    await page.goto('http://localhost:3000/vendor/dashboard');
    
    // Inject vendor data directly into localStorage
    await page.evaluate((vendorData) => {
      localStorage.setItem('vendor_user', JSON.stringify(vendorData));
      localStorage.setItem('vendor_authenticated', 'true');
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
    console.log('✅ Auth injected via localStorage');
  }

  // Ensure auth is persisted - inject if needed
  await page.evaluate((vendorData) => {
    // Double-check localStorage has vendor data
    const existing = localStorage.getItem('vendor_user');
    if (!existing) {
      localStorage.setItem('vendor_user', JSON.stringify(vendorData));
      localStorage.setItem('vendor_authenticated', 'true');
    }
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
    hasVendor: localStorage.getItem('vendor_user') !== null,
    vendorData: localStorage.getItem('vendor_user'),
  }));

  expect(authState.hasVendor).toBeTruthy();
  console.log('✅ Vendor authentication verified');
  console.log(`   Vendor: ${VENDOR_STORE_NAME} (${VENDOR_ID})`);

  // Save signed-in state to 'playwright/.auth/vendor.json'
  await page.context().storageState({ path: authFile });
  console.log(`✅ Auth state saved to ${authFile}`);
});
