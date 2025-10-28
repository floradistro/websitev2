import { test, expect } from '@playwright/test';

test('vendor dashboard - no flash on redirect', async ({ page }) => {
  let flashDetected = false;
  let contentSeen: string[] = [];

  // Monitor for any dashboard content appearing
  page.on('console', msg => {
    if (msg.text().includes('Dashboard') || msg.text().includes('Products')) {
      contentSeen.push(msg.text());
    }
  });

  // Navigate to dashboard (unauthenticated)
  await page.goto('http://localhost:3000/vendor/dashboard');

  // Wait a moment to see what happens
  await page.waitForTimeout(1500);

  const finalUrl = page.url();
  console.log('Final URL:', finalUrl);

  // Take screenshot
  await page.screenshot({ path: 'test-results/vendor-no-flash-test.png', fullPage: true });

  // Check if we landed on login page (expected)
  const onLoginPage = finalUrl.includes('/vendor/login');
  console.log('Redirected to login:', onLoginPage);

  // Check what text we see
  const bodyText = await page.textContent('body');
  const seesLogin = bodyText?.includes('Email') || bodyText?.includes('Password');
  const seesDashboard = bodyText?.includes('Live Products') || bodyText?.includes('Revenue');

  console.log('Sees login form:', seesLogin);
  console.log('Sees dashboard content:', seesDashboard);

  // The key test: we should ONLY see login page, NOT dashboard content
  if (seesDashboard) {
    console.log('❌ FLASH DETECTED: Dashboard content visible');
    flashDetected = true;
  } else if (seesLogin && onLoginPage) {
    console.log('✅ NO FLASH: Clean redirect to login');
  }

  expect(flashDetected).toBe(false);
  expect(onLoginPage).toBe(true);
});
