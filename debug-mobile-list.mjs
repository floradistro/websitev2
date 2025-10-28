import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });

  // Mobile viewport - iPhone 12 Pro
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  });

  const page = await context.newPage();

  const errors = [];
  const logs = [];

  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (msg.type() === 'error') {
      console.log('❌ ERROR:', text);
      errors.push(text);
    }
  });

  page.on('pageerror', error => {
    console.log('❌ EXCEPTION:', error.message);
    errors.push(error.message);
  });

  console.log('🔵 Navigating to admin products page...\n');

  await page.goto('http://localhost:3000/admin/products', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  await page.waitForTimeout(3000);

  // Check what's on the page
  console.log('\n📊 Checking page content...\n');

  const title = await page.textContent('h1, h2, h3').catch(() => 'Not found');
  console.log('Title:', title);

  const showingText = await page.locator('text=/Showing.*Products/i').textContent().catch(() => 'Not found');
  console.log('Showing text:', showingText);

  // Check if list view is active
  const listViewButton = await page.locator('button:has-text("List")').first();
  const isListActive = await listViewButton.getAttribute('class');
  console.log('List view button classes:', isListActive);

  // Click list view if not active
  if (!isListActive.includes('bg-white/10')) {
    console.log('\n🔘 Clicking list view button...');
    await listViewButton.click();
    await page.waitForTimeout(1000);
  }

  // Check for table
  const hasTable = await page.locator('table').count();
  console.log('\nTable elements found:', hasTable);

  if (hasTable > 0) {
    const rows = await page.locator('tbody tr').count();
    console.log('Table rows found:', rows);

    // Get table dimensions
    const tableBox = await page.locator('table').first().boundingBox();
    console.log('Table bounding box:', tableBox);

    // Get the overflow container
    const overflowContainer = await page.locator('div.overflow-x-auto').first().boundingBox();
    console.log('Overflow container:', overflowContainer);

    // Check if table is visible
    const isVisible = await page.locator('table').first().isVisible();
    console.log('Table visible:', isVisible);

    // Get computed styles
    const tableStyles = await page.locator('table').first().evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        width: styles.width,
        height: styles.height,
        overflow: styles.overflow
      };
    });
    console.log('Table computed styles:', tableStyles);

    // Get parent container styles
    const containerStyles = await page.locator('div.overflow-x-auto').first().evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        width: styles.width,
        height: styles.height,
        overflow: styles.overflow,
        overflowX: styles.overflowX,
        maxHeight: styles.maxHeight
      };
    });
    console.log('Container styles:', containerStyles);
  } else {
    console.log('❌ No table found on page!');

    // Check what's in the products section
    const productsSection = await page.locator('text=/showing.*products/i').locator('..').locator('..').innerHTML().catch(() => 'Not found');
    console.log('\nProducts section HTML preview:', productsSection.substring(0, 500));
  }

  // Take screenshot
  await page.screenshot({ path: '/tmp/mobile-debug.png', fullPage: true });
  console.log('\n📸 Screenshot saved to /tmp/mobile-debug.png');

  console.log('\n=== SUMMARY ===');
  console.log('Total errors:', errors.length);
  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach(e => console.log(' -', e));
  }

  console.log('\nKeeping browser open for inspection...');
  await page.waitForTimeout(120000); // 2 minutes

  await browser.close();
})();
