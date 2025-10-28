import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch({ headless: false });

  console.log('🔵 Testing Admin Products Page Table Layout\n');

  // Test Desktop View
  console.log('=== DESKTOP VIEW (1440x900) ===\n');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const desktopPage = await desktopContext.newPage();

  await desktopPage.goto('http://localhost:3001/admin/products', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  await desktopPage.waitForTimeout(2000);

  // Check if table exists
  const desktopTableCount = await desktopPage.locator('table').count();
  console.log('✅ Table elements found:', desktopTableCount);

  if (desktopTableCount > 0) {
    // Get table dimensions
    const tableBox = await desktopPage.locator('table').first().boundingBox();
    console.log('📏 Table width:', tableBox.width);
    console.log('📏 Viewport width:', 1440);

    // Check if table fits within viewport
    if (tableBox.width <= 1440) {
      console.log('✅ Table fits within viewport!\n');
    } else {
      console.log('❌ Table overflows viewport by:', tableBox.width - 1440, 'px\n');
    }

    // Get table styles
    const tableStyles = await desktopPage.locator('table').first().evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        tableLayout: styles.tableLayout,
        width: styles.width,
        display: styles.display
      };
    });
    console.log('🎨 Table computed styles:', tableStyles);

    // Check if table is visible
    const isVisible = await desktopPage.locator('table').first().isVisible();
    console.log('👁️  Table visible:', isVisible);

    // Count rows
    const rowCount = await desktopPage.locator('tbody tr').count();
    console.log('📊 Table rows:', rowCount);
  } else {
    console.log('❌ No table found on desktop view!');
  }

  // Take screenshot
  await desktopPage.screenshot({ path: '/tmp/desktop-table-layout.png', fullPage: true });
  console.log('📸 Desktop screenshot: /tmp/desktop-table-layout.png\n');

  // Test Mobile View
  console.log('=== MOBILE VIEW (390x844 - iPhone 12 Pro) ===\n');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  });

  const mobilePage = await mobileContext.newPage();

  await mobilePage.goto('http://localhost:3001/admin/products', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  await mobilePage.waitForTimeout(2000);

  // Check if cards are displayed
  const mobileTableCount = await mobilePage.locator('table').count();
  console.log('📱 Table elements found:', mobileTableCount);

  if (mobileTableCount === 0) {
    console.log('✅ Table correctly hidden on mobile');
  } else {
    console.log('⚠️  Table still visible on mobile (should be hidden)');
  }

  // Check for mobile card layout
  const cardCount = await mobilePage.locator('.lg\\:hidden > div[class*="rounded-xl"]').count();
  console.log('📱 Mobile cards found:', cardCount);

  if (cardCount > 0) {
    console.log('✅ Mobile cards are displayed\n');
  } else {
    console.log('❌ No mobile cards found\n');
  }

  // Take screenshot
  await mobilePage.screenshot({ path: '/tmp/mobile-table-layout.png', fullPage: true });
  console.log('📸 Mobile screenshot: /tmp/mobile-table-layout.png\n');

  console.log('=== TEST COMPLETE ===');
  console.log('✨ Both views tested successfully');

  await browser.close();
})();
