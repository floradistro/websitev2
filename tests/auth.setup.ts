import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Go to login page
  await page.goto('http://localhost:3000');

  // Fill in login form - update these credentials as needed
  await page.fill('input[type="email"]', 'floradelivery29@gmail.com');
  await page.fill('input[type="password"]', 'Selah123!');

  // Click login button
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard
  await page.waitForURL(/\/vendor\/(apps|products)/);

  // Save storage state
  await page.context().storageState({ path: authFile });
});
