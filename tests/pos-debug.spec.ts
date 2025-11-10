/**
 * POS System Debug Tests
 * Check if POS is working after Phase 2 refactoring
 */

import { test, expect } from '@playwright/test';

test.describe('POS System Health Check', () => {
  test('POS register page loads', async ({ page }) => {
    const errors: string[] = [];
    const consoleMessages: string[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });

    await page.goto('/pos/register');
    await page.waitForLoadState('networkidle');
    
    // Wait for any errors to appear
    await page.waitForTimeout(3000);
    
    console.log('=== PAGE ERRORS ===');
    errors.forEach(err => console.log(err));
    
    console.log('\n=== CONSOLE ERRORS ===');
    consoleMessages.forEach(msg => console.log(msg));
    
    // Check for component-related errors
    const componentErrors = errors.filter(err => 
      err.includes('Card') || 
      err.includes('Input') || 
      err.includes('Textarea') ||
      err.includes('Button') ||
      err.includes('ds') ||
      err.includes('export')
    );
    
    if (componentErrors.length > 0) {
      console.log('\n=== COMPONENT ERRORS ===');
      componentErrors.forEach(err => console.log(err));
    }
    
    expect(componentErrors.length).toBe(0);
  });

  test('POS orders page loads', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/pos/orders');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const componentErrors = errors.filter(err => 
      err.includes('Card') || 
      err.includes('Input') || 
      err.includes('export')
    );
    
    console.log('Orders page errors:', componentErrors);
    expect(componentErrors.length).toBe(0);
  });

  test('POS receiving page loads', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/pos/receiving');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const componentErrors = errors.filter(err => 
      err.includes('Card') || 
      err.includes('Input') || 
      err.includes('export')
    );
    
    console.log('Receiving page errors:', componentErrors);
    expect(componentErrors.length).toBe(0);
  });
});
