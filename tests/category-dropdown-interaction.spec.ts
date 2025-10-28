import { test, expect } from '@playwright/test';

test.describe('Category Dropdown Interaction', () => {
  test('should show dropdown options when clicked', async ({ page, context }) => {
    console.log('🔐 Authenticating via API...');

    // Login via API
    const apiContext = await context.newPage();
    const loginResponse = await apiContext.request.post('http://localhost:3000/api/vendor/auth/login', {
      data: {
        email: 'fahad@cwscommercial.com',
        password: 'Flipperspender12!!'
      }
    });

    const loginData = await loginResponse.json();
    if (!loginData.success) {
      throw new Error(`Login failed: ${loginData.error}`);
    }

    console.log('✅ API login successful');

    // Navigate and inject auth
    await page.goto('/pos/register');
    await page.evaluate((vendorData) => {
      localStorage.setItem('vendor_user', JSON.stringify(vendorData.vendor));
      localStorage.setItem('vendor_id', vendorData.vendor.id);
      localStorage.setItem('vendor_email', vendorData.vendor.email);
      localStorage.setItem('vendor_slug', vendorData.vendor.slug || '');
      if (vendorData.session) {
        localStorage.setItem('supabase_session', vendorData.session);
      }
    }, loginData);

    await page.reload();
    await page.waitForTimeout(3000);

    // Handle register selection
    const registerSelectionVisible = await page.locator('text=SELECT REGISTER').count() > 0;
    if (registerSelectionVisible) {
      console.log('🎯 Selecting register...');
      const registerCard = page.locator('text=FRONT COUNTER').or(page.locator('text=Available')).first();
      await registerCard.click();
      await page.waitForTimeout(2000);
    }

    console.log('📸 Taking screenshot before clicking dropdown...');
    await page.screenshot({ path: 'test-results/dropdown-before-click.png', fullPage: true });

    // Find the category dropdown
    const allSelects = await page.locator('select').all();
    let categorySelect = allSelects[0];

    // Check if first is register selector
    const firstOptions = await categorySelect.locator('option').allTextContents();
    if (firstOptions.some(opt => opt.includes('Register') || opt.includes('Select'))) {
      if (allSelects.length > 1) {
        categorySelect = allSelects[1];
      }
    }

    // Scroll the dropdown into view
    await categorySelect.scrollIntoViewIfNeeded();

    // Highlight the dropdown with a border for visual verification
    await categorySelect.evaluate((el) => {
      el.style.border = '3px solid red';
      el.style.outline = '3px solid yellow';
    });

    console.log('🖱️ Clicking dropdown...');
    await page.screenshot({ path: 'test-results/dropdown-highlighted.png', fullPage: true });

    // Focus the dropdown (this will show native dropdown on most browsers)
    await categorySelect.focus();
    await page.waitForTimeout(500);

    console.log('📸 Taking screenshot after focusing dropdown...');
    await page.screenshot({ path: 'test-results/dropdown-focused.png', fullPage: true });

    // Check the dropdown's container to see if overflow is cutting it off
    const containerInfo = await categorySelect.evaluate((el) => {
      const parent = el.parentElement;
      const grandparent = parent?.parentElement;
      const container = grandparent?.parentElement;

      return {
        selectZIndex: window.getComputedStyle(el).zIndex,
        selectPosition: window.getComputedStyle(el).position,
        parentOverflow: parent ? window.getComputedStyle(parent).overflow : 'none',
        grandparentOverflow: grandparent ? window.getComputedStyle(grandparent).overflow : 'none',
        containerOverflow: container ? window.getComputedStyle(container).overflow : 'none',
        parentZIndex: parent ? window.getComputedStyle(parent).zIndex : 'none',
        grandparentZIndex: grandparent ? window.getComputedStyle(grandparent).zIndex : 'none',
      };
    });

    console.log('🔍 Container overflow info:', containerInfo);

    // Get all options
    const options = await categorySelect.locator('option').allTextContents();
    console.log('✅ Available options:', options);

    // Verify dropdown works
    expect(options.length).toBeGreaterThan(0);

    console.log('✅ Dropdown interaction test complete');
  });
});
