import { test, expect } from '@playwright/test';

/**
 * Comprehensive test to debug the persistent "flash then disappear" bug
 * Affects: Gallery view, Order expand view, and potentially other components
 */
test.describe('Flash-Then-Disappear Bug Investigation', () => {
  test.beforeEach(async ({ page }) => {
    // Monitor console for errors
    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    // Monitor page errors
    page.on('pageerror', error => {
      console.error('❌ Page Error:', error.message);
    });

    // Log in first
    await page.goto('http://localhost:3000');

    // Check if already logged in
    const isLoggedIn = await page.locator('text=Dashboard').isVisible().catch(() => false);

    if (!isLoggedIn) {
      // Fill in login form
      await page.fill('input[type="email"]', process.env.TEST_EMAIL || 'darioncdjr@gmail.com');
      await page.fill('input[type="password"]', process.env.TEST_PASSWORD || 'Smallpenis123!!');
      await page.click('button[type="submit"]');

      // Wait for login to complete
      await page.waitForURL(/vendor|admin/, { timeout: 10000 });
    }

    // Navigate to media library
    await page.goto('http://localhost:3000/vendor/media-library');
    await page.waitForLoadState('networkidle');

    // Wait for products to load
    await page.waitForSelector('text=Products', { timeout: 10000 });
  });

  test('Gallery View - Component Lifecycle Investigation', async ({ page }) => {
    console.log('🔍 Starting Gallery View Investigation...');

    // Wait a moment for everything to settle
    await page.waitForTimeout(1000);

    // Find first product (any product)
    const firstProduct = page.locator('[class*="bg-white"][class*="border"]').first();
    await firstProduct.waitFor({ state: 'visible', timeout: 5000 });

    // Take screenshot before click
    await page.screenshot({ path: 'tests/screenshots/01-before-click.png', fullPage: true });
    console.log('📸 Screenshot 1: Before click');

    // Click the product
    console.log('🖱️  Clicking product...');
    await firstProduct.click();

    // Take rapid screenshots to catch the flash
    console.log('📸 Taking rapid screenshots...');
    await page.waitForTimeout(100);
    await page.screenshot({ path: 'tests/screenshots/02-at-100ms.png', fullPage: true });

    await page.waitForTimeout(200);
    await page.screenshot({ path: 'tests/screenshots/03-at-300ms.png', fullPage: true });

    await page.waitForTimeout(200);
    await page.screenshot({ path: 'tests/screenshots/04-at-500ms.png', fullPage: true });

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/05-at-1000ms.png', fullPage: true });

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'tests/screenshots/06-at-2000ms.png', fullPage: true });

    // Check if gallery is visible at different timestamps
    const timestamps = [
      { time: 0, label: 'immediately' },
      { time: 100, label: 'at 100ms' },
      { time: 500, label: 'at 500ms' },
      { time: 1000, label: 'at 1s' },
      { time: 2000, label: 'at 2s' },
    ];

    const galleryVisibilityHistory: any[] = [];

    for (const check of timestamps) {
      await page.waitForTimeout(check.time);

      const backButton = page.locator('button:has-text("Go Back"), button:has(svg.lucide-arrow-left)');
      const isVisible = await backButton.isVisible().catch(() => false);

      galleryVisibilityHistory.push({
        time: check.label,
        galleryVisible: isVisible
      });

      console.log(`✓ Gallery visible ${check.label}:`, isVisible);
    }

    // Print visibility history
    console.log('\n📊 Gallery Visibility History:');
    console.table(galleryVisibilityHistory);

    // Final assertion
    const finalVisible = await page.locator('button:has-text("Go Back"), button:has(svg.lucide-arrow-left)').isVisible().catch(() => false);

    if (!finalVisible) {
      console.error('❌ BUG CONFIRMED: Gallery disappeared!');
      // Fail the test
      expect(finalVisible).toBe(true);
    } else {
      console.log('✅ Gallery is stable and visible');
    }
  });

  test('Z-Index Conflict Detection', async ({ page }) => {
    console.log('🔍 Checking for Z-Index conflicts...');

    // Click a product
    const productWithImage = page.locator('text=Bolo Candy').first();
    await productWithImage.click();
    await page.waitForTimeout(500);

    // Get z-index values of all visible elements
    const zIndexes = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const withZIndex = elements
        .map(el => {
          const computed = window.getComputedStyle(el);
          const zIndex = computed.zIndex;
          if (zIndex !== 'auto' && zIndex !== '0') {
            return {
              tag: el.tagName,
              class: el.className,
              zIndex: zIndex,
              position: computed.position,
              display: computed.display,
              visibility: computed.visibility,
            };
          }
          return null;
        })
        .filter(Boolean);

      return withZIndex;
    });

    console.log('📊 Elements with z-index:', JSON.stringify(zIndexes, null, 2));

    // Check for overlapping elements
    const overlaps = await page.evaluate(() => {
      const gallery = document.querySelector('[class*="ProductGallery"]') ||
                     document.querySelector('text=Go Back')?.closest('div');

      if (!gallery) return { found: false };

      const rect = gallery.getBoundingClientRect();
      const elementsAtPoint = document.elementsFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
      );

      return {
        found: true,
        galleryRect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
        elementsOnTop: elementsAtPoint.slice(0, 5).map(el => ({
          tag: el.tagName,
          class: el.className,
          zIndex: window.getComputedStyle(el).zIndex,
        })),
      };
    });

    console.log('🎯 Overlap analysis:', JSON.stringify(overlaps, null, 2));
  });

  test('State and Re-render Detection', async ({ page }) => {
    console.log('🔍 Monitoring React state changes...');

    // Inject monitoring code
    await page.evaluate(() => {
      const originalLog = console.log;
      const logs: string[] = [];

      console.log = (...args) => {
        const message = args.join(' ');
        logs.push(message);
        originalLog.apply(console, args);
      };

      (window as any).__getLogs = () => logs;
    });

    // Click product
    const productWithImage = page.locator('text=Bolo Candy').first();
    await productWithImage.click();

    // Wait and collect logs
    await page.waitForTimeout(2000);

    const logs = await page.evaluate(() => (window as any).__getLogs());

    // Filter for our debug logs
    const debugLogs = logs.filter((log: string) =>
      log.includes('🖼️') ||
      log.includes('🎨') ||
      log.includes('🎭') ||
      log.includes('📸') ||
      log.includes('🔙')
    );

    console.log('📝 Debug logs captured:');
    debugLogs.forEach((log: string) => console.log('  ', log));

    // Check for state cycling
    const galleryProductChanges = debugLogs.filter((log: string) =>
      log.includes('🎭 Gallery product changed')
    );

    console.log(`🔄 Gallery product changed ${galleryProductChanges.length} times`);

    if (galleryProductChanges.length > 2) {
      console.error('⚠️  WARNING: Gallery product state changing too many times - possible re-render loop!');
    }
  });

  test('Animation/Transition Conflict Detection', async ({ page }) => {
    console.log('🔍 Checking for animation conflicts...');

    // Click product
    const productWithImage = page.locator('text=Bolo Candy').first();
    await productWithImage.click();

    await page.waitForTimeout(100);

    // Check for Tailwind animation classes
    const animations = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const animated = elements
        .filter(el => {
          const classes = el.className.toString();
          return classes.includes('animate-') ||
                 classes.includes('transition-') ||
                 classes.includes('duration-');
        })
        .map(el => ({
          tag: el.tagName,
          classes: el.className.toString(),
          computed: {
            animation: window.getComputedStyle(el).animation,
            transition: window.getComputedStyle(el).transition,
          },
        }));

      return animated;
    });

    console.log('🎬 Animated elements:', JSON.stringify(animations, null, 2));

    // Check if animate-in is causing issues
    const animateInElements = animations.filter((el: any) =>
      el.classes.includes('animate-in')
    );

    console.log(`📊 Found ${animateInElements.length} elements with animate-in class`);
  });
});
