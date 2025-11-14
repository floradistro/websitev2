/**
 * PWA Viewport Debug Test - iPad Pro 13"
 *
 * This test checks if the PWA viewport fix is working on iPad Pro
 */

import { test, expect } from '@playwright/test';

test.describe('PWA Viewport - iPad Pro Debug', () => {
  test('should detect iOS and apply correct styles', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    console.log('📱 Testing on:', page.viewportSize());

    // Check if the debug banner is visible (means CSS is loaded and iOS is detected)
    const debugBanner = page.locator('body::after');

    // Take a screenshot to see what's happening
    await page.screenshot({
      path: 'playwright-report/pwa/ipad-viewport-debug.png',
      fullPage: true
    });

    // Check computed styles on html element
    const htmlStyles = await page.locator('html').evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        borderTop: computed.borderTop,
        borderBottom: computed.borderBottom,
        height: computed.height,
        width: computed.width,
        position: computed.position,
      };
    });

    console.log('📊 HTML computed styles:', htmlStyles);

    // Check computed styles on body element
    const bodyStyles = await page.locator('body').evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        backgroundColor: computed.backgroundColor,
        height: computed.height,
        width: computed.width,
        position: computed.position,
        overflow: computed.overflow,
      };
    });

    console.log('📊 BODY computed styles:', bodyStyles);

    // Check computed styles on #__next element
    const nextStyles = await page.locator('#__next').evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        position: computed.position,
        top: computed.top,
        right: computed.right,
        bottom: computed.bottom,
        left: computed.left,
        height: computed.height,
        width: computed.width,
        background: computed.background,
      };
    });

    console.log('📊 #__next computed styles:', nextStyles);

    // Check if @supports (-webkit-touch-callout: none) is working
    const supportsCheck = await page.evaluate(() => {
      return CSS.supports('-webkit-touch-callout', 'none');
    });

    console.log('✅ @supports (-webkit-touch-callout: none):', supportsCheck);

    // Get viewport dimensions
    const viewportInfo = await page.evaluate(() => {
      return {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        devicePixelRatio: window.devicePixelRatio,
      };
    });

    console.log('📐 Viewport info:', viewportInfo);

    // Check if there's a gap at the bottom
    const bodyRect = await page.locator('body').boundingBox();
    const htmlRect = await page.locator('html').boundingBox();
    const nextRect = await page.locator('#__next').boundingBox();

    console.log('📏 Bounding boxes:');
    console.log('  - HTML:', htmlRect);
    console.log('  - BODY:', bodyRect);
    console.log('  - #__next:', nextRect);

    // Calculate if there's a gap
    if (bodyRect && nextRect) {
      const gap = bodyRect.height - (nextRect.y + nextRect.height);
      console.log(`🔍 Gap at bottom: ${gap}px`);

      if (gap > 5) {
        console.error(`❌ FOUND GAP: ${gap}px at bottom of #__next`);
      } else {
        console.log(`✅ No gap detected (${gap}px is acceptable)`);
      }
    }

    // Verify iOS detection markers
    expect(supportsCheck).toBe(true); // Should support -webkit-touch-callout on iPad
    expect(htmlStyles.borderTop).toContain('red'); // Should have red border if iOS detected
    expect(bodyStyles.backgroundColor).toContain('255, 0, 255'); // Should be magenta (#FF00FF)
  });

  test('should fill entire viewport with no gaps', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get all the heights
    const heights = await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      const next = document.getElementById('__next');

      return {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        html: {
          scrollHeight: html.scrollHeight,
          clientHeight: html.clientHeight,
          offsetHeight: html.offsetHeight,
        },
        body: {
          scrollHeight: body.scrollHeight,
          clientHeight: body.clientHeight,
          offsetHeight: body.offsetHeight,
        },
        next: next ? {
          scrollHeight: next.scrollHeight,
          clientHeight: next.clientHeight,
          offsetHeight: next.offsetHeight,
        } : null,
      };
    });

    console.log('📊 Heights comparison:', JSON.stringify(heights, null, 2));

    // body and html should fill viewport exactly
    expect(heights.body.clientHeight).toBe(heights.viewport.height);
    expect(heights.html.clientHeight).toBe(heights.viewport.height);
  });
});
