import { test, expect } from '@playwright/test';

test.describe('Category Dropdown E2E', () => {
  test('should work with category filtering in POS', async ({ page, context }) => {
    console.log('🔐 Authenticating via API...');

    // First, call the login API directly
    const apiContext = await context.newPage();
    const loginResponse = await apiContext.request.post('http://localhost:3000/api/vendor/auth/login', {
      data: {
        email: 'fahad@cwscommercial.com',
        password: 'Flipperspender12!!'
      }
    });

    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginData.success) {
      throw new Error(`Login failed: ${loginData.error}`);
    }

    console.log('✅ API login successful for:', loginData.vendor.store_name);

    // Now navigate and inject the auth data into localStorage
    await page.goto('/pos/register');

    // Inject authentication into localStorage
    await page.evaluate((vendorData) => {
      localStorage.setItem('vendor_user', JSON.stringify(vendorData.vendor));
      localStorage.setItem('vendor_id', vendorData.vendor.id);
      localStorage.setItem('vendor_email', vendorData.vendor.email);
      localStorage.setItem('vendor_slug', vendorData.vendor.slug || '');
      if (vendorData.session) {
        localStorage.setItem('supabase_session', vendorData.session);
      }
    }, loginData);

    // Reload the page to pick up the authentication
    await page.reload();
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/category-dropdown-e2e-1-after-reload.png', fullPage: true });

    // Check if register selection is needed
    const registerSelectionVisible = await page.locator('text=SELECT REGISTER').count() > 0;
    console.log('Register selection screen:', registerSelectionVisible);

    if (registerSelectionVisible) {
      console.log('🎯 Selecting register...');
      // Click on the available register
      const registerCard = page.locator('text=FRONT COUNTER').or(page.locator('text=Available')).first();
      await registerCard.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-results/category-dropdown-e2e-2-after-register.png', fullPage: true });
      console.log('✅ Register selected');
    }

    // Check if we're on the POS page
    const isPOSPage = await page.locator('text=Search').or(page.locator('text=Products')).count() > 0;
    console.log('Is POS page loaded:', isPOSPage);

    // Find category dropdown
    console.log('🔍 Looking for category dropdown...');
    const allSelects = await page.locator('select').all();
    console.log(`Found ${allSelects.length} select element(s)`);

    if (allSelects.length === 0) {
      console.log('❌ No select elements found');
      const bodyText = await page.locator('body').textContent();
      console.log('Page content (first 300 chars):', bodyText?.substring(0, 300));
      throw new Error('No select elements found on page');
    }

    // Find the category select (may be first or second depending on register selector)
    let categorySelect = allSelects[0];
    const firstOptions = await categorySelect.locator('option').allTextContents();
    console.log('First select options:', firstOptions);

    // If it's a register selector, use the next one
    if (firstOptions.some(opt => opt.includes('Register') || opt.includes('Select'))) {
      console.log('First select is likely register selector, checking next select...');
      if (allSelects.length > 1) {
        categorySelect = allSelects[1];
      }
    }

    // Get category options
    const categoryOptions = await categorySelect.locator('option').allTextContents();
    console.log('✅ Category dropdown options:', categoryOptions);

    expect(categoryOptions.length).toBeGreaterThan(0);
    expect(categoryOptions).toContain('All Categories');

    // Verify dropdown is visible and has correct styling
    const isVisible = await categorySelect.isVisible();
    const isEnabled = await categorySelect.isEnabled();
    console.log('Dropdown visible:', isVisible, '| enabled:', isEnabled);

    expect(isVisible).toBe(true);
    expect(isEnabled).toBe(true);

    // Check CSS
    const styles = await categorySelect.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        cursor: computed.cursor,
        borderWidth: computed.borderWidth,
      };
    });

    console.log('Dropdown CSS:', styles);
    expect(styles.cursor).toBe('pointer');

    // Test interaction if multiple categories exist
    if (categoryOptions.length > 1) {
      console.log('🎯 Testing category selection...');

      // Select second category
      await categorySelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);

      const newValue = await categorySelect.inputValue();
      console.log('Selected value:', newValue);
      expect(newValue).not.toBe('all');

      // Select back to "All Categories"
      await categorySelect.selectOption({ index: 0 });
      await page.waitForTimeout(500);

      const finalValue = await categorySelect.inputValue();
      console.log('Final value:', finalValue);
      expect(finalValue).toBe('all');

      console.log('✅ Category dropdown is fully functional!');
    } else {
      console.log('⚠️ Only one category available, but dropdown is working');
    }

    await page.screenshot({ path: 'test-results/category-dropdown-e2e-final.png', fullPage: true });
  });
});
