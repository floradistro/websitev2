import { test, expect } from '@playwright/test';

test('debug field visibility modal', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => {
    console.log(`BROWSER: ${msg.text()}`);
  });

  // Login first
  await page.goto('http://localhost:3000/vendor/login');
  await page.fill('input[type="email"]', 'fahad@cwscommercial.com');
  await page.fill('input[type="password"]', 'Selah1234!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // Navigate to products page
  await page.goto('http://localhost:3000/vendor/products');

  // Wait for page to load - look for the CATEGORIES tab
  await page.waitForSelector('text=CATEGORIES', { timeout: 15000 });

  console.log('✅ Page loaded');

  // Wait for category cards to load
  await page.waitForTimeout(2000);

  // Click on FIELDS button for Beverages category
  const fieldsButton = page.locator('button').filter({ hasText: /^Fields \(\d+\)$/ }).first();
  await fieldsButton.click();
  await page.waitForTimeout(1000);

  console.log('✅ Clicked FIELDS tab');

  // Check if the Eye icon button exists
  const eyeButton = page.locator('button[title="Configure visibility"]').first();
  const eyeButtonExists = await eyeButton.count();
  console.log(`Eye button count: ${eyeButtonExists}`);

  if (eyeButtonExists > 0) {
    console.log('✅ Eye button exists');

    // Check if FieldVisibilityModal component is in the DOM
    const modalInDom = await page.locator('text=Field Visibility Settings').count();
    console.log(`Modal in DOM before click: ${modalInDom}`);

    // Click the eye button
    await eyeButton.click();
    await page.waitForTimeout(2000);

    console.log('✅ Clicked eye button');

    // Check if modal appears after click
    const modalAfterClick = await page.locator('text=Field Visibility Settings').count();
    console.log(`Modal in DOM after click: ${modalAfterClick}`);

    // Check the state values
    const stateCheck = await page.evaluate(() => {
      // @ts-ignore
      return {
        // Try to find the modal in DOM
        modalElement: !!document.querySelector('text=Field Visibility Settings'),
        // Check if there's a backdrop
        backdrop: !!document.querySelector('[class*="backdrop"]'),
        // Check z-index issues
        highZIndex: Array.from(document.querySelectorAll('*'))
          .map(el => ({
            tag: el.tagName,
            zIndex: window.getComputedStyle(el).zIndex
          }))
          .filter(item => item.zIndex !== 'auto' && parseInt(item.zIndex) > 9000)
      };
    });

    console.log('State check:', JSON.stringify(stateCheck, null, 2));

    // Take a screenshot
    await page.screenshot({ path: 'field-visibility-modal-debug.png', fullPage: true });
    console.log('✅ Screenshot saved');

    // Check if modal is visible but off-screen or hidden
    const modalBoundingBox = await page.locator('div').filter({ hasText: 'Field Visibility Settings' }).first().boundingBox();
    console.log('Modal bounding box:', modalBoundingBox);

  } else {
    console.log('❌ Eye button not found');
  }
});
