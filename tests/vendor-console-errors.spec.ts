import { test, expect } from '@playwright/test';

test('capture vendor dashboard console errors', async ({ page }) => {
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  const exceptions: string[] = [];

  // Capture all console messages
  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      consoleErrors.push(text);
      console.log('❌ Console Error:', text);
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(text);
      console.log('⚠️  Console Warning:', text);
    }
  });

  // Capture page errors
  page.on('pageerror', error => {
    exceptions.push(error.message);
    console.log('💥 Page Exception:', error.message);
    console.log('Stack:', error.stack);
  });

  // Navigate to vendor dashboard
  console.log('Navigating to /vendor/dashboard...');
  await page.goto('http://localhost:3000/vendor/dashboard');

  // Wait a bit
  await page.waitForTimeout(3000);

  console.log('\n=== Final State ===');
  console.log('URL:', page.url());
  console.log('Total Console Errors:', consoleErrors.length);
  console.log('Total Console Warnings:', consoleWarnings.length);
  console.log('Total Page Exceptions:', exceptions.length);

  // Take screenshot
  await page.screenshot({ path: 'test-results/vendor-error-state.png', fullPage: true });

  // Print all errors
  if (consoleErrors.length > 0) {
    console.log('\n=== All Console Errors ===');
    consoleErrors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
  }

  if (exceptions.length > 0) {
    console.log('\n=== All Page Exceptions ===');
    exceptions.forEach((err, i) => console.log(`${i + 1}. ${err}`));
  }
});
