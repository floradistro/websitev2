/**
 * Products Page Mobile Polish & Fine-Comb Test
 * Using Fahad's account to thoroughly test and identify issues
 */

import { test, expect } from '@playwright/test';

const VENDOR_EMAIL = 'fahad@cwscommercial.com';
const VENDOR_PASSWORD = 'Flipperspender12!!';

// Test multiple mobile device sizes
const MOBILE_DEVICES = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12 Pro', width: 390, height: 844 },
  { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
  { name: 'Samsung Galaxy S21', width: 360, height: 800 },
  { name: 'iPad Mini', width: 768, height: 1024 },
];

test.describe('Products Page - Comprehensive Mobile Polish', () => {
  test.beforeEach(async ({ page }) => {
    // Login with Fahad's account
    await page.goto('http://localhost:3000/vendor/login');
    await page.waitForLoadState('networkidle');

    // Fill login form
    const emailInput = page.locator('input[type="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(VENDOR_EMAIL);

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill(VENDOR_PASSWORD);

    // Click login button
    const loginButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Sign In")'));
    await loginButton.click();

    // Wait for redirect to dashboard or apps page
    await page.waitForURL(/\/(vendor\/apps|vendor\/dashboard)/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Wait longer for auth state to fully settle
    await page.waitForTimeout(2000);

    // Verify we have auth cookies
    const cookies = await page.context().cookies();
    const authCookie = cookies.find(c => c.name === 'auth-token' || c.name.includes('auth'));
    if (!authCookie) {
      console.warn('⚠️ Warning: No auth cookie found after login');
    } else {
      console.log('✅ Auth cookie found:', authCookie.name);
    }

    console.log('✅ Login successful');
  });

  test('1. Mobile: Page loads and all elements are visible', async ({ page }) => {
    console.log('📱 Testing mobile page load...');

    // Set to iPhone 12 Pro size
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/vendor/products');
    await page.waitForLoadState('networkidle');

    // Check header is visible
    const header = page.locator('h1, [role="heading"][level="1"]').first();
    await expect(header).toBeVisible();
    console.log('✅ Header visible');

    // Check tabs are visible
    const productsTab = page.locator('button:has-text("Products")').first();
    await expect(productsTab).toBeVisible();
    console.log('✅ Tabs visible');

    // Check stats cards are visible
    const statsRegion = page.locator('[aria-label="Inventory statistics"]');
    await expect(statsRegion).toBeVisible();
    console.log('✅ Stats cards visible');

    // Check filters are visible
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();
    console.log('✅ Search input visible');

    // Check products list is visible
    await page.waitForTimeout(1000);
    const productsList = page.locator('[role="list"], [id="products-list"]').first();
    await expect(productsList).toBeVisible();
    console.log('✅ Products list visible');

    console.log('✅ All elements visible on mobile');
  });

  test('2. Mobile: Stats cards are properly sized and readable', async ({ page }) => {
    console.log('📊 Testing stats card mobile sizing...');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/vendor/products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const statsCards = page.locator('[aria-label="Inventory statistics"] [role="article"]');
    const count = await statsCards.count();
    console.log(`   Found ${count} stat cards`);

    // Check each card
    for (let i = 0; i < Math.min(count, 4); i++) {
      const card = statsCards.nth(i);
      const box = await card.boundingBox();

      if (box) {
        console.log(`   Card ${i + 1}: ${box.width}x${box.height}px`);

        // Check minimum size for mobile
        expect(box.width).toBeGreaterThan(100);
        expect(box.height).toBeGreaterThan(60);

        // Check text is visible
        const text = await card.textContent();
        expect(text?.length).toBeGreaterThan(0);
      }
    }

    console.log('✅ Stats cards properly sized');
  });

  test('3. Mobile: Search input is usable', async ({ page }) => {
    console.log('🔍 Testing mobile search...');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/vendor/products');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible();

    // Check input is large enough to tap
    const box = await searchInput.boundingBox();
    if (box) {
      console.log(`   Search input: ${box.width}x${box.height}px`);
      expect(box.height).toBeGreaterThan(40); // Minimum tap target
    }

    // Test typing
    await searchInput.click();
    await searchInput.fill('test');
    const value = await searchInput.inputValue();
    expect(value).toBe('test');

    console.log('✅ Search input usable on mobile');
  });

  test('4. Mobile: Filter dropdowns are accessible', async ({ page }) => {
    console.log('🎛️  Testing mobile filters...');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/vendor/products');
    await page.waitForLoadState('networkidle');

    const statusFilter = page.locator('select#status-filter').first();
    const categoryFilter = page.locator('select#category-filter').first();

    // Check both are visible
    await expect(statusFilter).toBeVisible();
    await expect(categoryFilter).toBeVisible();

    // Check they're tappable size
    const statusBox = await statusFilter.boundingBox();
    const categoryBox = await categoryFilter.boundingBox();

    if (statusBox && categoryBox) {
      console.log(`   Status filter: ${statusBox.width}x${statusBox.height}px`);
      console.log(`   Category filter: ${categoryBox.width}x${categoryBox.height}px`);

      expect(statusBox.height).toBeGreaterThan(40);
      expect(categoryBox.height).toBeGreaterThan(40);
    }

    // Test selecting
    await statusFilter.selectOption('published');
    await page.waitForTimeout(1000);

    console.log('✅ Filters accessible on mobile');
  });

  test('5. Mobile: Product cards are well-formatted', async ({ page }) => {
    console.log('📦 Testing mobile product cards...');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/vendor/products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const productCards = page.locator('[role="article"]').filter({ hasText: /SKU/ });
    const count = await productCards.count();
    console.log(`   Found ${count} product cards`);

    if (count > 0) {
      const firstCard = productCards.first();

      // Check card is visible
      await expect(firstCard).toBeVisible();

      // Check card has reasonable size
      const box = await firstCard.boundingBox();
      if (box) {
        console.log(`   Card size: ${box.width}x${box.height}px`);

        // Card should not overflow viewport
        expect(box.width).toBeLessThan(400);

        // Card should be tall enough to show content
        expect(box.height).toBeGreaterThan(80);
      }

      // Check product name is visible
      const name = firstCard.locator('h3').first();
      await expect(name).toBeVisible();

      // Check action buttons are visible
      const viewButton = firstCard.locator('button').first();
      await expect(viewButton).toBeVisible();

      console.log('✅ Product card well-formatted');
    } else {
      console.log('ℹ️  No products found');
    }
  });

  test('6. Mobile: Action buttons are easily tappable', async ({ page }) => {
    console.log('👆 Testing mobile tap targets...');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/vendor/products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const productCards = page.locator('[role="article"]').filter({ hasText: /SKU/ });
    const count = await productCards.count();

    if (count > 0) {
      const firstCard = productCards.first();

      // Get all buttons in the card
      const buttons = firstCard.locator('button');
      const buttonCount = await buttons.count();
      console.log(`   Found ${buttonCount} buttons in card`);

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();

        if (box) {
          console.log(`   Button ${i + 1}: ${box.width}x${box.height}px`);

          // iOS HIG recommends 44x44 minimum tap target
          expect(box.width).toBeGreaterThan(40);
          expect(box.height).toBeGreaterThan(40);
        }
      }

      console.log('✅ Tap targets properly sized');
    }
  });

  test('7. Mobile: Pagination works correctly', async ({ page }) => {
    console.log('📄 Testing mobile pagination...');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/vendor/products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Look for pagination
    const pagination = page.locator('[aria-label*="pagination" i], nav').filter({ hasText: /next|prev|page/i });

    if (await pagination.isVisible()) {
      console.log('   Pagination found');

      // Check if there's a next button
      const nextButton = page.locator('button:has-text("Next"), button[aria-label*="next" i]').first();

      if (await nextButton.isVisible() && !await nextButton.isDisabled()) {
        // Check button size
        const box = await nextButton.boundingBox();
        if (box) {
          console.log(`   Next button: ${box.width}x${box.height}px`);
          expect(box.height).toBeGreaterThan(40);
        }

        // Test clicking
        await nextButton.click();
        await page.waitForTimeout(1500);

        console.log('✅ Pagination works on mobile');
      } else {
        console.log('ℹ️  Only one page of products');
      }
    } else {
      console.log('ℹ️  No pagination needed');
    }
  });

  test('8. Test on multiple mobile devices', async ({ page }) => {
    console.log('📱 Testing on multiple device sizes...');

    for (const device of MOBILE_DEVICES) {
      console.log(`\n   Testing on ${device.name} (${device.width}x${device.height})...`);

      await page.setViewportSize({ width: device.width, height: device.height });
      await page.goto('/vendor/products');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Check main elements are visible
      const header = page.locator('h1').first();
      const stats = page.locator('[aria-label="Inventory statistics"]');
      const filters = page.locator('input[type="text"]').first();

      const headerVisible = await header.isVisible();
      const statsVisible = await stats.isVisible();
      const filtersVisible = await filters.isVisible();

      console.log(`      Header: ${headerVisible ? '✓' : '✗'}`);
      console.log(`      Stats: ${statsVisible ? '✓' : '✗'}`);
      console.log(`      Filters: ${filtersVisible ? '✓' : '✗'}`);

      expect(headerVisible).toBeTruthy();
      expect(statsVisible).toBeTruthy();
      expect(filtersVisible).toBeTruthy();
    }

    console.log('\n✅ All device sizes tested');
  });

  test('9. Mobile: Scrolling works smoothly', async ({ page }) => {
    console.log('📜 Testing mobile scrolling...');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/vendor/products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Get initial scroll position
    const initialY = await page.evaluate(() => window.scrollY);
    console.log(`   Initial scroll: ${initialY}px`);

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);

    const scrolledY = await page.evaluate(() => window.scrollY);
    console.log(`   After scroll: ${scrolledY}px`);

    expect(scrolledY).toBeGreaterThan(initialY);

    console.log('✅ Scrolling works');
  });

  test('10. Mobile: No horizontal overflow', async ({ page }) => {
    console.log('↔️  Testing for horizontal overflow...');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/vendor/products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check if page has horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    if (hasHorizontalScroll) {
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      console.log(`   ⚠️  Horizontal overflow detected: ${scrollWidth}px > ${clientWidth}px`);

      // Find elements causing overflow
      const overflowingElements = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements
          .filter(el => el.scrollWidth > document.documentElement.clientWidth)
          .map(el => ({
            tag: el.tagName,
            class: el.className,
            width: el.scrollWidth,
          }))
          .slice(0, 5);
      });

      console.log('   Overflowing elements:', overflowingElements);
    } else {
      console.log('   ✅ No horizontal overflow');
    }

    expect(hasHorizontalScroll).toBeFalsy();
  });

  test('11. Mobile: Text is readable (not too small)', async ({ page }) => {
    console.log('📖 Testing text readability...');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/vendor/products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check various text elements
    const textElements = [
      { selector: 'h1', minSize: 20, name: 'Main heading' },
      { selector: 'h3', minSize: 14, name: 'Product name' },
      { selector: 'input::placeholder', minSize: 14, name: 'Search placeholder' },
    ];

    for (const element of textElements) {
      const el = page.locator(element.selector).first();
      if (await el.isVisible()) {
        const fontSize = await el.evaluate((node) => {
          return window.getComputedStyle(node).fontSize;
        });

        const size = parseInt(fontSize);
        console.log(`   ${element.name}: ${size}px`);

        expect(size).toBeGreaterThanOrEqual(element.minSize);
      }
    }

    console.log('✅ Text is readable');
  });
});

test.describe('Products Page - Desktop Comparison', () => {
  test('12. Desktop: Verify layout differences', async ({ page }) => {
    console.log('🖥️  Testing desktop layout...');

    // Login first
    await page.goto('http://localhost:3000/vendor/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    await emailInput.fill(VENDOR_EMAIL);

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill(VENDOR_PASSWORD);

    const loginButton = page.locator('button[type="submit"]').or(page.locator('button:has-text("Sign In")'));
    await loginButton.click();

    await page.waitForURL(/\/(vendor\/apps|vendor\/dashboard)/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Desktop size
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/vendor/products');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check stats are in single row
    const statsCards = page.locator('[aria-label="Inventory statistics"] [role="article"]');
    const count = await statsCards.count();

    if (count === 4) {
      const positions = [];
      for (let i = 0; i < 4; i++) {
        const box = await statsCards.nth(i).boundingBox();
        if (box) positions.push(box.y);
      }

      // All should have same Y position (single row)
      const allSameRow = positions.every(y => Math.abs(y - positions[0]) < 10);
      console.log(`   Stats in single row: ${allSameRow ? 'Yes' : 'No'}`);
      expect(allSameRow).toBeTruthy();
    }

    console.log('✅ Desktop layout correct');
  });
});
