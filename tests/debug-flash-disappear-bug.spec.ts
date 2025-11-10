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

    // Go to media library
    await page.goto('http://localhost:3000/vendor/media-library');
    await page.waitForLoadState('networkidle');
  });

  test('Gallery View - Component Lifecycle Investigation', async ({ page }) => {
    console.log('🔍 Starting Gallery View Investigation...');

    // Wait for product list to load
    await page.waitForSelector('text=Products', { timeout: 10000 });

    // Find a product with images (look for checkmark icon)
    const productWithImage = page.locator('[class*="bg-white"][class*="border"]').filter({ hasText: 'Bolo Candy' }).first();

    // Take screenshot before click
    await page.screenshot({ path: 'tests/screenshots/01-before-click.png', fullPage: true });
    console.log('📸 Screenshot 1: Before click');

    // Monitor DOM mutations
    const mutations: string[] = [];
    await page.evaluate(() => {
      const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
          if (mutation.type === 'childList') {
            mutation.removedNodes.forEach((node) => {
              if (node.nodeType === 1) {
                const el = node as Element;
                console.log('🗑️ DOM REMOVED:', {
                  tag: el.tagName,
                  class: el.className,
                  id: el.id,
                });
              }
            });
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });

    // Click the product
    console.log('🖱️  Clicking product...');
    await productWithImage.click();

    // Take rapid screenshots to catch the flash
    console.log('📸 Taking rapid screenshots...');
    await page.waitForTimeout(50);
    await page.screenshot({ path: 'tests/screenshots/02-at-50ms.png', fullPage: true });

    await page.waitForTimeout(100);
    await page.screenshot({ path: 'tests/screenshots/03-at-150ms.png', fullPage: true });

    await page.waitForTimeout(100);
    await page.screenshot({ path: 'tests/screenshots/04-at-250ms.png', fullPage: true });

    await page.waitForTimeout(250);
    await page.screenshot({ path: 'tests/screenshots/05-at-500ms.png', fullPage: true });

    await page.waitForTimeout(500);
    await page.screenshot({ path: 'tests/screenshots/06-at-1000ms.png', fullPage: true });

    // Check if gallery component exists at different times
    const checks = [
      { time: 0, label: 'immediately' },
      { time: 100, label: 'at 100ms' },
      { time: 500, label: 'at 500ms' },
      { time: 1000, label: 'at 1000ms' },
    ];

    for (const check of checks) {
      await page.waitForTimeout(check.time);

      const galleryExists = await page.locator('[class*="ProductGallery"]').count() > 0 ||
                            await page.locator('text=Go Back').count() > 0 ||
                            await page.locator('text=Bolo Candy').count() > 1; // Product name in header

      console.log(`✓ Gallery exists ${check.label}:`, galleryExists);

      // Check computed styles
      const mainContent = page.locator('.flex-1').last();
      const styles = await mainContent.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity,
          zIndex: computed.zIndex,
          position: computed.position,
          transform: computed.transform,
        };
      });

      console.log(`🎨 Styles ${check.label}:`, styles);
    }

    // Check for React errors in console
    const reactErrors = await page.evaluate(() => {
      return window.localStorage.getItem('react-errors') || 'none';
    });
    console.log('⚛️  React errors:', reactErrors);

    // Final check: Is the gallery visible?
    const finalGalleryVisible = await page.locator('text=Go Back').isVisible().catch(() => false);
    console.log('🎯 Final gallery visible:', finalGalleryVisible);

    // Get all console errors
    const allErrors = await page.evaluate(() => {
      return (window as any).__errors || [];
    });
    console.log('❌ All errors:', allErrors);
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
