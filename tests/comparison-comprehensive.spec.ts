import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_EMAIL || 'darioncdjr@gmail.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Smallpenis123!!';

/**
 * COMPREHENSIVE COMPARISON MODE TEST SUITE
 *
 * Tests all 7 comparison types with real data and edge cases
 * Validates calculations, UI rendering, and API responses
 */

test.describe('Comparison Mode - Comprehensive Testing', () => {

  // Helper function to login and navigate
  async function loginAndNavigate(page: any) {
    await page.goto('http://localhost:3000/vendor/login');
    await page.waitForTimeout(1000);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    await page.goto('http://localhost:3000/vendor/analytics');
    await page.waitForTimeout(3000);
  }

  // Helper to capture comparison data
  async function selectComparisonAndCapture(page: any, comparisonType: string) {
    const responsePromise = page.waitForResponse(
      (response: any) => response.url().includes('/comparison'),
      { timeout: 10000 }
    );

    // Open comparison selector
    await page.click('button:has-text("No Comparison"), button:has-text("Day over Day"), button:has-text("Week over Week"), button:has-text("Month over Month"), button:has-text("Quarter over Quarter"), button:has-text("Year over Year"), button:has-text("Previous Period")');
    await page.waitForTimeout(500);

    // Select the comparison type
    const optionText = {
      'day_over_day': 'Day over Day',
      'week_over_week': 'Week over Week',
      'month_over_month': 'Month over Month',
      'quarter_over_quarter': 'Quarter over Quarter',
      'same_period_last_year': 'Year over Year',
      'previous_period': 'Previous Period',
    }[comparisonType] || comparisonType;

    await page.click(`button:has-text("${optionText}")`);

    // Wait for API response
    const response = await responsePromise;
    const data = await response.json();

    await page.waitForTimeout(2000);

    return { response, data };
  }

  // Helper to extract KPI values from UI
  async function extractKPIValues(page: any) {
    const kpis: any[] = [];

    // Get all KPI cards
    const cards = await page.$$('.minimal-glass');

    for (const card of cards) {
      try {
        const label = await card.$eval('.text-label', (el: any) => el.textContent?.trim());
        const value = await card.$eval('.text-xl, .text-3xl', (el: any) => el.textContent?.trim());
        const badge = await card.$('.bg-green-500\\/10, .bg-red-500\\/10, .bg-white\\/5');

        let change = null;
        if (badge) {
          const badgeText = await badge.textContent();
          change = badgeText;
        }

        kpis.push({ label, value, change });
      } catch (e) {
        // Skip if element not found
      }
    }

    return kpis;
  }

  test('Test 1: Day over Day Comparison', async ({ page }) => {
    console.log('\n========================================');
    console.log('TEST 1: DAY OVER DAY COMPARISON');
    console.log('========================================\n');

    await loginAndNavigate(page);

    const { response, data } = await selectComparisonAndCapture(page, 'day_over_day');

    console.log('API Response Status:', response.status());
    expect(response.status()).toBe(200);

    console.log('Comparison Data:', JSON.stringify(data, null, 2));

    // Validate data structure
    expect(data).toHaveProperty('current');
    expect(data).toHaveProperty('comparison');
    expect(data).toHaveProperty('changes');

    // Validate current period
    expect(data.current).toHaveProperty('metrics');
    expect(data.current.metrics).toHaveProperty('revenue');
    expect(data.current.metrics).toHaveProperty('orders');
    expect(data.current.metrics).toHaveProperty('customers');
    expect(data.current.metrics).toHaveProperty('avgOrderValue');

    // Validate comparison period
    expect(data.comparison).toHaveProperty('metrics');
    expect(data.comparison.period.label).toBe('Yesterday');

    // Validate calculations
    const revenueChange = data.current.metrics.revenue - data.comparison.metrics.revenue;
    const revenuePercent = (revenueChange / data.comparison.metrics.revenue) * 100;

    console.log('\nCalculation Validation:');
    console.log(`Current Revenue: $${data.current.metrics.revenue.toFixed(2)}`);
    console.log(`Comparison Revenue: $${data.comparison.metrics.revenue.toFixed(2)}`);
    console.log(`Expected Change: $${revenueChange.toFixed(2)} (${revenuePercent.toFixed(2)}%)`);
    console.log(`API Change: $${data.changes.revenue.value.toFixed(2)} (${data.changes.revenue.percent.toFixed(2)}%)`);

    // Allow for floating point precision differences (within 0.01)
    expect(Math.abs(data.changes.revenue.value - revenueChange)).toBeLessThan(0.01);
    expect(Math.abs(data.changes.revenue.percent - revenuePercent)).toBeLessThan(0.01);

    // Extract and validate UI
    const kpis = await extractKPIValues(page);
    console.log('\nUI KPI Values:', kpis);

    await page.screenshot({ path: 'test-results/comparison-day-over-day.png', fullPage: true });

    console.log('\n✅ Test 1 PASSED\n');
  });

  test('Test 2: Week over Week Comparison', async ({ page }) => {
    console.log('\n========================================');
    console.log('TEST 2: WEEK OVER WEEK COMPARISON');
    console.log('========================================\n');

    await loginAndNavigate(page);

    const { response, data } = await selectComparisonAndCapture(page, 'week_over_week');

    console.log('API Response Status:', response.status());
    expect(response.status()).toBe(200);

    console.log('Comparison Label:', data.comparison.period.label);
    expect(data.comparison.period.label).toBe('Last Week');

    // Validate date logic - comparison period should be 7 days before current
    const currentStart = new Date(data.current.period.start);
    const comparisonStart = new Date(data.comparison.period.start);
    const daysDiff = Math.round((currentStart.getTime() - comparisonStart.getTime()) / (1000 * 60 * 60 * 24));

    console.log(`\nDate Validation:`);
    console.log(`Current Start: ${currentStart.toISOString()}`);
    console.log(`Comparison Start: ${comparisonStart.toISOString()}`);
    console.log(`Days Difference: ${daysDiff}`);

    expect(daysDiff).toBe(7);

    await page.screenshot({ path: 'test-results/comparison-week-over-week.png', fullPage: true });

    console.log('\n✅ Test 2 PASSED\n');
  });

  test('Test 3: Month over Month Comparison', async ({ page }) => {
    console.log('\n========================================');
    console.log('TEST 3: MONTH OVER MONTH COMPARISON');
    console.log('========================================\n');

    await loginAndNavigate(page);

    const { response, data } = await selectComparisonAndCapture(page, 'month_over_month');

    expect(response.status()).toBe(200);
    expect(data.comparison.period.label).toBe('Last Month');

    // Validate month offset
    const currentStart = new Date(data.current.period.start);
    const comparisonStart = new Date(data.comparison.period.start);

    console.log(`\nDate Validation:`);
    console.log(`Current: ${currentStart.toLocaleDateString()}`);
    console.log(`Comparison: ${comparisonStart.toLocaleDateString()}`);

    const monthsDiff = (currentStart.getFullYear() - comparisonStart.getFullYear()) * 12 +
                      (currentStart.getMonth() - comparisonStart.getMonth());

    console.log(`Months Difference: ${monthsDiff}`);
    expect(monthsDiff).toBe(1);

    await page.screenshot({ path: 'test-results/comparison-month-over-month.png', fullPage: true });

    console.log('\n✅ Test 3 PASSED\n');
  });

  test('Test 4: Quarter over Quarter Comparison', async ({ page }) => {
    console.log('\n========================================');
    console.log('TEST 4: QUARTER OVER QUARTER COMPARISON');
    console.log('========================================\n');

    await loginAndNavigate(page);

    const { response, data } = await selectComparisonAndCapture(page, 'quarter_over_quarter');

    expect(response.status()).toBe(200);
    expect(data.comparison.period.label).toBe('Last Quarter');

    // Validate quarter offset (3 months)
    const currentStart = new Date(data.current.period.start);
    const comparisonStart = new Date(data.comparison.period.start);

    const monthsDiff = (currentStart.getFullYear() - comparisonStart.getFullYear()) * 12 +
                      (currentStart.getMonth() - comparisonStart.getMonth());

    console.log(`\nDate Validation:`);
    console.log(`Months Difference: ${monthsDiff}`);
    expect(monthsDiff).toBe(3);

    await page.screenshot({ path: 'test-results/comparison-quarter-over-quarter.png', fullPage: true });

    console.log('\n✅ Test 4 PASSED\n');
  });

  test('Test 5: Year over Year Comparison', async ({ page }) => {
    console.log('\n========================================');
    console.log('TEST 5: YEAR OVER YEAR COMPARISON');
    console.log('========================================\n');

    await loginAndNavigate(page);

    const { response, data } = await selectComparisonAndCapture(page, 'same_period_last_year');

    expect(response.status()).toBe(200);
    expect(data.comparison.period.label).toBe('Same Period Last Year');

    // Validate year offset
    const currentStart = new Date(data.current.period.start);
    const comparisonStart = new Date(data.comparison.period.start);

    console.log(`\nDate Validation:`);
    console.log(`Current: ${currentStart.toLocaleDateString()}`);
    console.log(`Comparison: ${comparisonStart.toLocaleDateString()}`);

    const yearsDiff = currentStart.getFullYear() - comparisonStart.getFullYear();
    console.log(`Years Difference: ${yearsDiff}`);
    expect(yearsDiff).toBe(1);

    await page.screenshot({ path: 'test-results/comparison-year-over-year.png', fullPage: true });

    console.log('\n✅ Test 5 PASSED\n');
  });

  test('Test 6: Previous Period Comparison', async ({ page }) => {
    console.log('\n========================================');
    console.log('TEST 6: PREVIOUS PERIOD COMPARISON');
    console.log('========================================\n');

    await loginAndNavigate(page);

    const { response, data } = await selectComparisonAndCapture(page, 'previous_period');

    expect(response.status()).toBe(200);
    expect(data.comparison.period.label).toBe('Previous Period');

    // Validate that comparison period has same duration as current period
    const currentStart = new Date(data.current.period.start);
    const currentEnd = new Date(data.current.period.end);
    const comparisonStart = new Date(data.comparison.period.start);
    const comparisonEnd = new Date(data.comparison.period.end);

    const currentDuration = Math.round((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
    const comparisonDuration = Math.round((comparisonEnd.getTime() - comparisonStart.getTime()) / (1000 * 60 * 60 * 24));

    console.log(`\nDuration Validation:`);
    console.log(`Current Period Duration: ${currentDuration} days`);
    console.log(`Comparison Period Duration: ${comparisonDuration} days`);

    expect(currentDuration).toBe(comparisonDuration);

    await page.screenshot({ path: 'test-results/comparison-previous-period.png', fullPage: true });

    console.log('\n✅ Test 6 PASSED\n');
  });

  test('Test 7: All Metrics Calculation Accuracy', async ({ page }) => {
    console.log('\n========================================');
    console.log('TEST 7: ALL METRICS CALCULATION ACCURACY');
    console.log('========================================\n');

    await loginAndNavigate(page);

    const { data } = await selectComparisonAndCapture(page, 'day_over_day');

    // Test Revenue
    const revenueChange = data.current.metrics.revenue - data.comparison.metrics.revenue;
    const revenuePercent = data.comparison.metrics.revenue > 0
      ? (revenueChange / data.comparison.metrics.revenue) * 100
      : 0;

    console.log('\nRevenue Calculation:');
    console.log(`  Current: $${data.current.metrics.revenue.toFixed(2)}`);
    console.log(`  Comparison: $${data.comparison.metrics.revenue.toFixed(2)}`);
    console.log(`  Expected: $${revenueChange.toFixed(2)} (${revenuePercent.toFixed(2)}%)`);
    console.log(`  API: $${data.changes.revenue.value.toFixed(2)} (${data.changes.revenue.percent.toFixed(2)}%)`);

    expect(Math.abs(data.changes.revenue.value - revenueChange)).toBeLessThan(0.01);
    expect(Math.abs(data.changes.revenue.percent - revenuePercent)).toBeLessThan(0.01);

    // Test Orders
    const ordersChange = data.current.metrics.orders - data.comparison.metrics.orders;
    const ordersPercent = data.comparison.metrics.orders > 0
      ? (ordersChange / data.comparison.metrics.orders) * 100
      : 0;

    console.log('\nOrders Calculation:');
    console.log(`  Current: ${data.current.metrics.orders}`);
    console.log(`  Comparison: ${data.comparison.metrics.orders}`);
    console.log(`  Expected: ${ordersChange} (${ordersPercent.toFixed(2)}%)`);
    console.log(`  API: ${data.changes.orders.value} (${data.changes.orders.percent.toFixed(2)}%)`);

    expect(data.changes.orders.value).toBe(ordersChange);
    expect(Math.abs(data.changes.orders.percent - ordersPercent)).toBeLessThan(0.01);

    // Test Customers
    const customersChange = data.current.metrics.customers - data.comparison.metrics.customers;
    const customersPercent = data.comparison.metrics.customers > 0
      ? (customersChange / data.comparison.metrics.customers) * 100
      : 0;

    console.log('\nCustomers Calculation:');
    console.log(`  Current: ${data.current.metrics.customers}`);
    console.log(`  Comparison: ${data.comparison.metrics.customers}`);
    console.log(`  Expected: ${customersChange} (${customersPercent.toFixed(2)}%)`);
    console.log(`  API: ${data.changes.customers.value} (${data.changes.customers.percent.toFixed(2)}%)`);

    expect(data.changes.customers.value).toBe(customersChange);
    expect(Math.abs(data.changes.customers.percent - customersPercent)).toBeLessThan(0.01);

    // Test Average Order Value
    const avgOrderChange = data.current.metrics.avgOrderValue - data.comparison.metrics.avgOrderValue;
    const avgOrderPercent = data.comparison.metrics.avgOrderValue > 0
      ? (avgOrderChange / data.comparison.metrics.avgOrderValue) * 100
      : 0;

    console.log('\nAverage Order Value Calculation:');
    console.log(`  Current: $${data.current.metrics.avgOrderValue.toFixed(2)}`);
    console.log(`  Comparison: $${data.comparison.metrics.avgOrderValue.toFixed(2)}`);
    console.log(`  Expected: $${avgOrderChange.toFixed(2)} (${avgOrderPercent.toFixed(2)}%)`);
    console.log(`  API: $${data.changes.avgOrderValue.value.toFixed(2)} (${data.changes.avgOrderValue.percent.toFixed(2)}%)`);

    expect(Math.abs(data.changes.avgOrderValue.value - avgOrderChange)).toBeLessThan(0.01);
    expect(Math.abs(data.changes.avgOrderValue.percent - avgOrderPercent)).toBeLessThan(0.01);

    console.log('\n✅ Test 7 PASSED - All calculations are accurate!\n');
  });

  test('Test 8: Zero Division Edge Case', async ({ page }) => {
    console.log('\n========================================');
    console.log('TEST 8: ZERO DIVISION EDGE CASE');
    console.log('========================================\n');

    await loginAndNavigate(page);

    const { data } = await selectComparisonAndCapture(page, 'same_period_last_year');

    // Check for division by zero handling
    console.log('\nChecking zero division handling:');

    // If comparison metrics are zero, percent should be 0 (not Infinity or NaN)
    if (data.comparison.metrics.revenue === 0) {
      console.log('  Revenue comparison is zero - checking percent calculation');
      expect(data.changes.revenue.percent).toBe(0);
    }

    if (data.comparison.metrics.orders === 0) {
      console.log('  Orders comparison is zero - checking percent calculation');
      expect(data.changes.orders.percent).toBe(0);
    }

    if (data.comparison.metrics.customers === 0) {
      console.log('  Customers comparison is zero - checking percent calculation');
      expect(data.changes.customers.percent).toBe(0);
    }

    if (data.comparison.metrics.avgOrderValue === 0) {
      console.log('  Avg order value comparison is zero - checking percent calculation');
      expect(data.changes.avgOrderValue.percent).toBe(0);
    }

    // Verify no NaN or Infinity values
    expect(isNaN(data.changes.revenue.percent)).toBe(false);
    expect(isFinite(data.changes.revenue.percent)).toBe(true);

    console.log('\n✅ Test 8 PASSED - Zero division handled correctly!\n');
  });

  test('Test 9: UI Badge Color Validation', async ({ page }) => {
    console.log('\n========================================');
    console.log('TEST 9: UI BADGE COLOR VALIDATION');
    console.log('========================================\n');

    await loginAndNavigate(page);

    const { data } = await selectComparisonAndCapture(page, 'day_over_day');

    await page.waitForTimeout(2000);

    // Check Revenue badge
    const revenueBadge = await page.$('.minimal-glass:has-text("Total Revenue") .bg-green-500\\/10, .minimal-glass:has-text("Total Revenue") .bg-red-500\\/10');

    if (revenueBadge) {
      const badgeClass = await revenueBadge.getAttribute('class');
      console.log('\nRevenue Badge Class:', badgeClass);

      if (data.changes.revenue.percent > 0) {
        expect(badgeClass).toContain('bg-green-500');
        console.log('  ✓ Positive change shows GREEN badge');
      } else if (data.changes.revenue.percent < 0) {
        expect(badgeClass).toContain('bg-red-500');
        console.log('  ✓ Negative change shows RED badge');
      } else {
        expect(badgeClass).toContain('bg-white');
        console.log('  ✓ No change shows NEUTRAL badge');
      }
    }

    await page.screenshot({ path: 'test-results/comparison-ui-badges.png', fullPage: true });

    console.log('\n✅ Test 9 PASSED - Badge colors are correct!\n');
  });

  test('Test 10: Switching Between Comparison Types', async ({ page }) => {
    console.log('\n========================================');
    console.log('TEST 10: SWITCHING BETWEEN COMPARISON TYPES');
    console.log('========================================\n');

    await loginAndNavigate(page);

    const comparisonTypes = [
      'day_over_day',
      'week_over_week',
      'month_over_month',
      'previous_period'
    ];

    for (const type of comparisonTypes) {
      console.log(`\nTesting ${type}...`);
      const { response, data } = await selectComparisonAndCapture(page, type);

      expect(response.status()).toBe(200);
      expect(data).toHaveProperty('current');
      expect(data).toHaveProperty('comparison');
      expect(data).toHaveProperty('changes');

      console.log(`  ✓ ${type} works correctly`);

      await page.waitForTimeout(1000);
    }

    console.log('\n✅ Test 10 PASSED - All comparison type switches work!\n');
  });
});
