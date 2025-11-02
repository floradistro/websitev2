import { chromium } from '@playwright/test';

async function explorMenuEditor() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔐 Logging in as fahad@cwscommercial.com...');
  await page.goto('http://localhost:3000/vendor/login');

  await page.fill('input[type="email"]', 'fahad@cwscommercial.com');
  await page.fill('input[type="password"]', 'Fahad123!');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/vendor/**', { timeout: 10000 });
  console.log('✅ Logged in successfully');

  console.log('📺 Navigating to TV Menus...');
  await page.goto('http://localhost:3000/vendor/tv-menus');
  await page.waitForLoadState('networkidle');

  console.log('🎯 Looking for edit menu button...');
  await page.waitForSelector('button[title="Edit menu"]', { timeout: 5000 });

  // Click the first edit button
  await page.click('button[title="Edit menu"]');

  console.log('⏳ Waiting for modal to open...');
  await page.waitForSelector('text=Edit Menu', { timeout: 5000 });

  console.log('\n📋 ANALYZING MENU EDITOR MODAL...\n');

  // Check all tabs
  const tabs = await page.locator('button').filter({ hasText: /Content|Layout|Style/ }).all();
  console.log(`Found ${tabs.length} tabs`);

  for (const tab of tabs) {
    const tabText = await tab.textContent();
    console.log(`\n=== TAB: ${tabText} ===`);
    await tab.click();
    await page.waitForTimeout(500);

    // Get all visible inputs, selects, and sections
    const sections = await page.locator('h3, h4, label').allTextContents();
    console.log('Sections/Labels:', sections.filter(Boolean).join(', '));

    const inputs = await page.locator('input[type="text"], input[type="number"]').count();
    const selects = await page.locator('select').count();
    const checkboxes = await page.locator('input[type="checkbox"]').count();
    const buttons = await page.locator('button').count();

    console.log(`Controls: ${inputs} text inputs, ${selects} selects, ${checkboxes} checkboxes, ${buttons} buttons`);
  }

  console.log('\n\n📊 TAKING SCREENSHOT...');
  await page.screenshot({ path: '/Users/whale/Desktop/menu-editor-analysis.png', fullPage: true });

  console.log('\n✅ Analysis complete! Check menu-editor-analysis.png');
  console.log('Press Ctrl+C to close when done exploring...');

  // Keep browser open for manual exploration
  await page.waitForTimeout(60000);

  await browser.close();
}

explorMenuEditor().catch(console.error);
