import { chromium } from '@playwright/test';

async function testMenuCategories() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    if (text.includes('Fetching categories') ||
        text.includes('Fetched categories') ||
        text.includes('[MenuEditorModal]') ||
        text.includes('availableCategories') ||
        text.includes('custom fields')) {
      console.log('📋 BROWSER CONSOLE:', text);
    }
  });

  // Listen to network requests
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/vendor/products/categories') ||
        url.includes('/api/vendor/products/custom-fields')) {
      console.log('🌐 REQUEST:', request.method(), url);
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/vendor/products/categories') ||
        url.includes('/api/vendor/products/custom-fields')) {
      console.log('📥 RESPONSE:', response.status(), url);
      try {
        const json = await response.json();
        console.log('📦 DATA:', JSON.stringify(json, null, 2));
      } catch (e) {
        console.log('⚠️  Could not parse response');
      }
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
  // Wait for menus to load
  await page.waitForTimeout(1000);

  // Take screenshot of the page
  await page.screenshot({ path: '/Users/whale/Desktop/tv-menus-before-edit.png' });
  console.log('📸 Page screenshot saved');

  // Find edit button - look for Pencil icon button
  const editButton = page.locator('button[title="Edit menu"]').first();
  const editButtonCount = await page.locator('button[title="Edit menu"]').count();
  console.log(`Found ${editButtonCount} edit buttons`);

  if (editButtonCount > 0) {
    console.log('🖱️  Clicking edit button...');
    await editButton.click();

    console.log('⏳ Waiting for modal...');
    await page.waitForSelector('text=Edit Menu', { timeout: 5000 });

    console.log('✅ Modal opened!');

    // Wait for data to load
    await page.waitForTimeout(3000);

    // Take screenshot of modal
    await page.screenshot({ path: '/Users/whale/Desktop/menu-editor-with-categories.png', fullPage: true });
    console.log('📸 Modal screenshot saved');

    // Check console logs
    console.log('\n\n=== CONSOLE LOGS ===');
    const relevantLogs = consoleLogs.filter(log =>
      log.includes('MenuEditorModal') ||
      log.includes('categories') ||
      log.includes('custom')
    );
    relevantLogs.forEach(log => console.log(log));

    console.log('\n⏸️  Browser will stay open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);
  } else {
    console.error('❌ No edit buttons found!');
    await page.screenshot({ path: '/Users/whale/Desktop/no-edit-buttons.png' });
  }

  await browser.close();
}

testMenuCategories().catch(console.error);
