import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_EMAIL || 'darioncdjr@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Smallpenis123!!';

test.describe('Comparison Mode - Final Validation', () => {
  test('should display comparison badges when selecting Day over Day', async ({ page }) => {
    // Set up network monitoring
    let comparisonApiCalled = false;
    let comparisonData: any = null;

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/comparison')) {
        comparisonApiCalled = true;
        console.log('✅ Comparison API called:', url);
        try {
          comparisonData = await response.json();
          console.log('Comparison Data:', JSON.stringify(comparisonData, null, 2));
        } catch (e) {
          console.log('Could not parse response');
        }
      }
    });

    // Login
    console.log('Step 1: Logging in...');
    await page.goto('http://localhost:3000/vendor/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/vendor/analytics', { timeout: 30000 });

    console.log('Step 2: Navigating to analytics...');
    await page.goto('http://localhost:3000/vendor/analytics', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    console.log('Step 3: Taking before screenshot...');
    await page.screenshot({ path: 'test-results/comparison-before.png', fullPage: true });

    // Find and click the comparison selector button
    console.log('Step 4: Looking for comparison selector...');
    const selectorButton = page.locator('button:has-text("No Comparison")').first();
    await expect(selectorButton).toBeVisible({ timeout: 10000 });

    console.log('Step 5: Clicking comparison selector...');
    await selectorButton.click();
    await page.waitForTimeout(500);

    // Click "Day over Day" option
    console.log('Step 6: Clicking Day over Day...');
    const dayOverDayOption = page.locator('button:has-text("Day over Day")').first();
    await expect(dayOverDayOption).toBeVisible({ timeout: 5000 });
    await dayOverDayOption.click();

    console.log('Step 7: Waiting for API response...');
    await page.waitForTimeout(3000);

    console.log('Step 8: Taking after screenshot...');
    await page.screenshot({ path: 'test-results/comparison-after.png', fullPage: true });

    // Verify API was called
    console.log('Step 9: Verifying API was called...');
    expect(comparisonApiCalled).toBe(true);

    // Verify data structure
    if (comparisonData) {
      console.log('Step 10: Verifying data structure...');
      expect(comparisonData).toHaveProperty('current');
      expect(comparisonData).toHaveProperty('comparison');
      expect(comparisonData).toHaveProperty('changes');

      expect(comparisonData.current).toHaveProperty('metrics');
      expect(comparisonData.comparison).toHaveProperty('metrics');

      expect(comparisonData.changes).toHaveProperty('revenue');
      expect(comparisonData.changes).toHaveProperty('orders');
      expect(comparisonData.changes).toHaveProperty('customers');
      expect(comparisonData.changes).toHaveProperty('avgOrderValue');

      console.log('✅ All data structure checks passed');
      console.log('Revenue change:', comparisonData.changes.revenue);
      console.log('Orders change:', comparisonData.changes.orders);
    }

    // Check if comparison badges are visible in UI
    console.log('Step 11: Checking for comparison badges in UI...');
    const badges = page.locator('div:has-text("%")');
    const badgeCount = await badges.count();
    console.log(`Found ${badgeCount} badge elements with % sign`);

    // Verify at least one badge is visible
    expect(badgeCount).toBeGreaterThan(0);

    console.log('✅ Test completed successfully!');
  });

  test('should handle Week over Week comparison', async ({ page }) => {
    let comparisonData: any = null;

    page.on('response', async (response) => {
      if (response.url().includes('/comparison')) {
        try {
          comparisonData = await response.json();
        } catch (e) {}
      }
    });

    // Login
    await page.goto('http://localhost:3000/vendor/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/vendor/analytics', { timeout: 30000 });

    await page.goto('http://localhost:3000/vendor/analytics', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Click comparison selector
    const selectorButton = page.locator('button:has-text("No Comparison")').first();
    await selectorButton.click();
    await page.waitForTimeout(500);

    // Click "Week over Week" option
    const weekOption = page.locator('button:has-text("Week over Week")').first();
    await weekOption.click();
    await page.waitForTimeout(3000);

    await page.screenshot({ path: 'test-results/comparison-week-over-week.png', fullPage: true });

    // Verify data was fetched
    expect(comparisonData).toBeTruthy();
    if (comparisonData) {
      expect(comparisonData.changes).toHaveProperty('revenue');
      console.log('Week over Week - Revenue change:', comparisonData.changes.revenue);
    }
  });

  test('should calculate changes correctly', async ({ page }) => {
    let comparisonData: any = null;

    page.on('response', async (response) => {
      if (response.url().includes('/comparison')) {
        try {
          comparisonData = await response.json();
        } catch (e) {}
      }
    });

    // Login
    await page.goto('http://localhost:3000/vendor/login', { waitUntil: 'networkidle', timeout: 30000 });
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/vendor/analytics', { timeout: 30000 });

    await page.goto('http://localhost:3000/vendor/analytics', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Select Day over Day
    const selectorButton = page.locator('button:has-text("No Comparison")').first();
    await selectorButton.click();
    await page.waitForTimeout(500);
    const dayOption = page.locator('button:has-text("Day over Day")').first();
    await dayOption.click();
    await page.waitForTimeout(3000);

    // Verify calculations
    expect(comparisonData).toBeTruthy();
    if (comparisonData) {
      const { current, comparison, changes } = comparisonData;

      // Manually calculate expected changes
      const expectedRevenueChange = current.metrics.revenue - comparison.metrics.revenue;
      const expectedRevenuePercent = comparison.metrics.revenue > 0
        ? ((current.metrics.revenue - comparison.metrics.revenue) / comparison.metrics.revenue) * 100
        : 0;

      console.log('Expected revenue change:', expectedRevenueChange);
      console.log('Actual revenue change:', changes.revenue.value);
      console.log('Expected revenue percent:', expectedRevenuePercent);
      console.log('Actual revenue percent:', changes.revenue.percent);

      // Allow small floating point differences (0.01 precision)
      expect(Math.abs(changes.revenue.value - expectedRevenueChange)).toBeLessThan(0.01);
      expect(Math.abs(changes.revenue.percent - expectedRevenuePercent)).toBeLessThan(0.01);

      console.log('✅ Calculation validation passed!');
    }
  });
});
