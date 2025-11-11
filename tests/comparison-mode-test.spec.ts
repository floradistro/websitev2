import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_EMAIL || 'darioncdjr@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Smallpenis123!!';

test.describe('Comparison Mode Test', () => {
  test('should trigger comparison API when selecting comparison type', async ({ page }) => {
    // Set up network monitoring
    const apiCalls: string[] = [];
    const apiResponses: Record<string, any> = {};

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/vendor/analytics/v2')) {
        apiCalls.push(url);
        console.log('API Call:', url);
      }
    });

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/comparison')) {
        console.log('Comparison API Response Status:', response.status());
        console.log('Comparison API Response OK:', response.ok());
        try {
          const text = await response.text();
          console.log('Comparison API Response Body:', text.substring(0, 500));
          const data = JSON.parse(text);
          apiResponses[url] = data;
          console.log('Parsed Comparison Data:', JSON.stringify(data, null, 2));
        } catch (e) {
          console.log('Failed to parse response:', e);
        }
      }
    });

    // Set up console logging
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('Comparison') || text.includes('comparison')) {
        console.log('Console:', text);
      }
    });

    // Login
    await page.goto('http://localhost:3000/vendor/login');
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);

    // Navigate to analytics
    await page.goto('http://localhost:3000/vendor/analytics');
    await page.waitForTimeout(3000);

    console.log('\n=== Initial API Calls ===');
    apiCalls.forEach(url => console.log(url));

    // Clear the list to see new calls
    apiCalls.length = 0;

    // Click comparison selector
    console.log('\n=== Clicking Comparison Selector ===');
    await page.click('button:has-text("No Comparison")');
    await page.waitForTimeout(500);

    // Select "Day over Day"
    console.log('\n=== Selecting Day over Day ===');
    await page.click('button:has-text("Day over Day")');
    await page.waitForTimeout(3000);

    console.log('\n=== API Calls After Selection ===');
    apiCalls.forEach(url => console.log(url));

    // Check if comparison API was called
    const comparisonCalls = apiCalls.filter(url => url.includes('/comparison'));
    console.log('\n=== Comparison API Calls ===');
    console.log(`Found ${comparisonCalls.length} comparison API calls`);
    comparisonCalls.forEach(url => console.log(url));

    // Take screenshot
    await page.screenshot({ path: 'test-results/comparison-test.png', fullPage: true });

    // Verify comparison API was called
    expect(comparisonCalls.length).toBeGreaterThan(0);
  });
});
