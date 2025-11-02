import { chromium } from '@playwright/test';

async function testMenuEditor() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[MenuEditorModal]') ||
        text.includes('Fetched categories') ||
        text.includes('Fetched custom fields') ||
        text.includes('availableCategories') ||
        text.includes('menuConfigCategories')) {
      console.log('📋 CONSOLE:', text);
    }
  });

  console.log('🔐 Logging in...');
  await page.goto('http://localhost:3000/vendor/login');
  await page.fill('input[type="email"]', 'fahad@cwscommercial.com');
  await page.fill('input[type="password"]', 'Fahad123!');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/vendor/**', { timeout: 10000 });
  console.log('✅ Logged in');

  console.log('📺 Navigating to TV Menus...');
  await page.goto('http://localhost:3000/vendor/tv-menus');
  await page.waitForLoadState('networkidle');

  console.log('🎯 Looking for edit button...');
  // Wait for any menu cards to appear
  await page.waitForSelector('.bg-white\\/3', { timeout: 10000 });

  // Take screenshot to see what's on the page
  await page.screenshot({ path: '/Users/whale/Desktop/tv-menus-page.png' });
  console.log('📸 Page screenshot saved');

  // Try to find and click the first edit button (Pencil icon)
  const editButtons = await page.locator('button').filter({ has: page.locator('svg') }).all();
  console.log(`Found ${editButtons.length} buttons with icons`);

  if (editButtons.length > 0) {
    console.log('🖱️ Clicking first edit button...');
    await editButtons[0].click();
  } else {
    throw new Error('No edit buttons found');
  }

  console.log('⏳ Waiting for modal...');
  await page.waitForSelector('text=Edit Menu', { timeout: 5000 });

  console.log('✅ Modal opened, checking content...');

  // Wait a bit for data to load
  await page.waitForTimeout(2000);

  // Check if categories section exists
  const categoriesSection = await page.locator('text=Categories').count();
  console.log(`📂 Categories section found: ${categoriesSection > 0}`);

  // Check for CategorySelector
  const categoryButtons = await page.locator('button').filter({ hasText: /Flower|Vape|Edibles/ }).count();
  console.log(`🔘 Category buttons found: ${categoryButtons}`);

  // Take screenshot
  await page.screenshot({ path: '/Users/whale/Desktop/menu-editor-debug.png', fullPage: true });
  console.log('📸 Screenshot saved to Desktop/menu-editor-debug.png');

  // Keep open for inspection
  console.log('\n⏸️  Browser will stay open for 30 seconds for inspection...');
  await page.waitForTimeout(30000);

  await browser.close();
}

testMenuEditor().catch(console.error);
