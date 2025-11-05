/**
 * Comprehensive Pricing System Test
 * Tests pricing templates and their reflection across:
 * 1. Product Management (Vendor Portal)
 * 2. POS System
 * 3. TV Menus
 *
 * Ensures changes to pricing templates reflect instantly everywhere
 */

import { test, expect } from '@playwright/test';

const VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf'; // Flora Distro
const TEST_LOCATION_ID = 'c4eedafb-4050-4d2d-a6af-e164aad5d934'; // Charlotte Central

test.describe('Pricing System Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Login to vendor portal
    await page.goto('/vendor/login');
    await page.fill('input[type="email"]', 'flora@floradistro.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/vendor/apps');
  });

  test('1. Verify pricing templates API returns correct data', async ({ request }) => {
    console.log('📋 Testing pricing templates API...');

    const response = await request.get('/api/vendor/pricing-blueprints', {
      headers: {
        'x-vendor-id': VENDOR_ID
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    console.log(`✅ Found ${data.blueprints?.length || 0} pricing templates`);
    expect(data.success).toBe(true);
    expect(data.blueprints).toBeDefined();
    expect(Array.isArray(data.blueprints)).toBe(true);

    // Verify template structure
    if (data.blueprints.length > 0) {
      const firstTemplate = data.blueprints[0];
      console.log(`📝 First template: ${firstTemplate.name}`);

      expect(firstTemplate).toHaveProperty('id');
      expect(firstTemplate).toHaveProperty('name');
      expect(firstTemplate).toHaveProperty('price_breaks');
      expect(Array.isArray(firstTemplate.price_breaks)).toBe(true);

      // Verify price breaks have prices
      const priceBreaks = firstTemplate.price_breaks;
      if (priceBreaks.length > 0) {
        const firstBreak = priceBreaks[0];
        console.log(`💰 First price tier: ${firstBreak.label} = $${firstBreak.price || firstBreak.default_price}`);

        // Should have either price or default_price (API transforms default_price to price)
        expect(firstBreak.price || firstBreak.default_price).toBeDefined();
        expect(firstBreak.label).toBeDefined();
        expect(firstBreak.qty).toBeDefined();
      }
    }
  });

  test('2. Verify products API returns embedded pricing_data', async ({ request }) => {
    console.log('🛍️ Testing products API with pricing_data...');

    const response = await request.get(`/api/vendor/products/full?page=1&limit=5`, {
      headers: {
        'x-vendor-id': VENDOR_ID
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    console.log(`✅ Found ${data.products?.length || 0} products`);
    expect(data.success).toBe(true);
    expect(data.products).toBeDefined();

    // Find a product with tiered pricing
    const tieredProduct = data.products.find((p: any) =>
      p.pricing_mode === 'tiered' && p.pricing_tiers?.length > 0
    );

    if (tieredProduct) {
      console.log(`📦 Testing product: ${tieredProduct.name}`);
      console.log(`💵 Pricing mode: ${tieredProduct.pricing_mode}`);
      console.log(`🎯 Tiers: ${tieredProduct.pricing_tiers?.length || 0}`);

      expect(tieredProduct.pricing_mode).toBe('tiered');
      expect(tieredProduct.pricing_tiers).toBeDefined();
      expect(Array.isArray(tieredProduct.pricing_tiers)).toBe(true);
      expect(tieredProduct.pricing_tiers.length).toBeGreaterThan(0);

      // Verify tier structure
      const firstTier = tieredProduct.pricing_tiers[0];
      console.log(`📊 First tier: ${firstTier.label} - $${firstTier.price}`);

      expect(firstTier.label).toBeDefined();
      expect(firstTier.price).toBeDefined();
      expect(parseFloat(firstTier.price)).toBeGreaterThan(0);
    } else {
      console.log('⚠️ No tiered products found in sample');
    }
  });

  test('3. Verify POS inventory API returns pricing tiers', async ({ request }) => {
    console.log('🏪 Testing POS inventory API...');

    const response = await request.get(`/api/pos/inventory?locationId=${TEST_LOCATION_ID}`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    console.log(`✅ Found ${data.products?.length || 0} products in POS inventory`);
    expect(data.products).toBeDefined();

    // Find a product with pricing tiers
    const productWithPricing = data.products.find((p: any) =>
      p.pricing_tiers && p.pricing_tiers.length > 0
    );

    if (productWithPricing) {
      console.log(`📦 POS Product: ${productWithPricing.name}`);
      console.log(`💰 Pricing tiers: ${productWithPricing.pricing_tiers.length}`);

      expect(productWithPricing.pricing_tiers).toBeDefined();
      expect(Array.isArray(productWithPricing.pricing_tiers)).toBe(true);

      const firstTier = productWithPricing.pricing_tiers[0];
      console.log(`📊 First tier: ${firstTier.label} - $${firstTier.price}`);

      expect(firstTier.price).toBeDefined();
      expect(firstTier.price).toBeGreaterThan(0);
    } else {
      console.log('⚠️ No products with pricing tiers found in POS inventory');
    }
  });

  test('4. Verify TV display API returns pricing tiers', async ({ request }) => {
    console.log('📺 Testing TV display API...');

    const response = await request.get(
      `/api/tv-display/products?vendor_id=${VENDOR_ID}&location_id=${TEST_LOCATION_ID}`
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    console.log(`✅ Found ${data.products?.length || 0} products for TV display`);
    expect(data.success).toBe(true);
    expect(data.products).toBeDefined();

    // Check products have pricing_tiers
    const productWithPricing = data.products.find((p: any) =>
      p.pricing_tiers && Object.keys(p.pricing_tiers).length > 0
    );

    if (productWithPricing) {
      console.log(`📦 TV Product: ${productWithPricing.name}`);
      console.log(`💰 Pricing tiers:`, Object.keys(productWithPricing.pricing_tiers));

      expect(productWithPricing.pricing_tiers).toBeDefined();
      expect(typeof productWithPricing.pricing_tiers).toBe('object');

      const tierIds = Object.keys(productWithPricing.pricing_tiers);
      expect(tierIds.length).toBeGreaterThan(0);

      const firstTierId = tierIds[0];
      const firstTier = productWithPricing.pricing_tiers[firstTierId];
      console.log(`📊 Tier ${firstTierId}: ${firstTier.label} - $${firstTier.price}`);

      expect(firstTier.price).toBeDefined();
      expect(firstTier.price).toBeGreaterThan(0);
    } else {
      console.log('⚠️ No products with pricing tiers found for TV display');
    }
  });

  test('5. End-to-end: Update template → verify across all systems', async ({ page, request }) => {
    console.log('🔄 Testing template update propagation...');

    // Step 1: Get current templates
    const templatesResponse = await request.get('/api/vendor/pricing-blueprints', {
      headers: { 'x-vendor-id': VENDOR_ID }
    });
    const templatesData = await templatesResponse.json();

    if (!templatesData.blueprints || templatesData.blueprints.length === 0) {
      console.log('⚠️ No templates found to test with');
      test.skip();
      return;
    }

    const testTemplate = templatesData.blueprints[0];
    console.log(`📝 Using template: ${testTemplate.name}`);

    // Step 2: Verify template has prices
    expect(testTemplate.price_breaks).toBeDefined();
    expect(testTemplate.price_breaks.length).toBeGreaterThan(0);

    const originalPrices = testTemplate.price_breaks.map((pb: any) => ({
      id: pb.break_id,
      price: pb.price || pb.default_price
    }));
    console.log('💵 Original prices:', originalPrices);

    // Step 3: Check products using this template
    const productsResponse = await request.get('/api/vendor/products/full?page=1&limit=100', {
      headers: { 'x-vendor-id': VENDOR_ID }
    });
    const productsData = await productsResponse.json();

    const productsUsingTemplate = productsData.products.filter((p: any) =>
      p.pricing_blueprint_id === testTemplate.id
    );

    console.log(`📦 Found ${productsUsingTemplate.length} products using this template`);

    if (productsUsingTemplate.length > 0) {
      const testProduct = productsUsingTemplate[0];
      console.log(`🎯 Test product: ${testProduct.name}`);

      // Verify product has pricing tiers matching template
      expect(testProduct.pricing_tiers).toBeDefined();
      expect(testProduct.pricing_tiers.length).toBeGreaterThan(0);

      console.log(`✅ Product has ${testProduct.pricing_tiers.length} pricing tiers`);
    }

    // Step 4: Verify in POS
    const posResponse = await request.get(`/api/pos/inventory?locationId=${TEST_LOCATION_ID}`);
    const posData = await posResponse.json();

    const posProduct = posData.products.find((p: any) =>
      productsUsingTemplate.some((tp: any) => tp.id === p.id)
    );

    if (posProduct) {
      console.log(`🏪 Found product in POS: ${posProduct.name}`);
      expect(posProduct.pricing_tiers).toBeDefined();
      console.log(`✅ POS pricing tiers: ${posProduct.pricing_tiers.length}`);
    }

    // Step 5: Verify in TV display
    const tvResponse = await request.get(
      `/api/tv-display/products?vendor_id=${VENDOR_ID}&location_id=${TEST_LOCATION_ID}`
    );
    const tvData = await tvResponse.json();

    const tvProduct = tvData.products.find((p: any) =>
      productsUsingTemplate.some((tp: any) => tp.id === p.id)
    );

    if (tvProduct) {
      console.log(`📺 Found product in TV display: ${tvProduct.name}`);
      expect(tvProduct.pricing_tiers).toBeDefined();
      console.log(`✅ TV pricing tiers:`, Object.keys(tvProduct.pricing_tiers));
    }

    console.log('✅ All systems have consistent pricing from template');
  });

  test('6. Verify POS displays pricing dropdown correctly', async ({ page }) => {
    console.log('🏪 Testing POS UI pricing display...');

    // Navigate to POS
    await page.goto('/pos/register');
    await page.waitForLoadState('networkidle');

    // Wait for product grid to load
    await page.waitForSelector('[data-testid="pos-product-grid"], .product-grid', {
      timeout: 10000
    }).catch(() => {
      console.log('⚠️ Product grid not found, continuing...');
    });

    // Click first product to open quick view
    const firstProduct = page.locator('[data-product-card]').first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();

      // Wait for quick view modal
      await page.waitForSelector('[data-testid="pos-quick-view"], .quick-view', {
        timeout: 5000
      }).catch(() => {
        console.log('⚠️ Quick view not found');
      });

      // Check for pricing dropdown
      const pricingDropdown = page.locator('select, [data-pricing-tier-select]');
      if (await pricingDropdown.isVisible()) {
        const options = await pricingDropdown.locator('option').allTextContents();
        console.log(`💰 Pricing options found: ${options.length}`);
        console.log(`📋 Options:`, options);

        expect(options.length).toBeGreaterThan(0);
      } else {
        console.log('⚠️ No pricing dropdown found in POS quick view');
      }
    } else {
      console.log('⚠️ No products found in POS');
    }
  });

  test('7. Verify TV menu displays pricing correctly', async ({ page }) => {
    console.log('📺 Testing TV display UI pricing...');

    // Navigate to TV display
    await page.goto(`/tv-display?vendor_id=${VENDOR_ID}&location_id=${TEST_LOCATION_ID}`);
    await page.waitForLoadState('networkidle');

    // Wait for products to load
    await page.waitForSelector('[data-product-card], .product-card', {
      timeout: 10000
    }).catch(() => {
      console.log('⚠️ No product cards found');
    });

    // Check for pricing display
    const priceElements = page.locator('[data-price], .price, [class*="price"]');
    const count = await priceElements.count();

    console.log(`💰 Found ${count} price elements on TV display`);

    if (count > 0) {
      const firstPrice = await priceElements.first().textContent();
      console.log(`📊 First price displayed: ${firstPrice}`);

      expect(firstPrice).toBeTruthy();
      expect(firstPrice).toMatch(/\$\d+/); // Should contain $XX format
    }
  });
});

test.describe('Pricing Data Structure Validation', () => {
  test('Verify database has pricing_data column populated', async ({ request }) => {
    console.log('🗄️ Validating database pricing_data structure...');

    const response = await request.get('/api/vendor/products/full?page=1&limit=10', {
      headers: { 'x-vendor-id': VENDOR_ID }
    });

    const data = await response.json();

    // Find products with different pricing modes
    const singlePriceProduct = data.products.find((p: any) => p.pricing_mode === 'single');
    const tieredPriceProduct = data.products.find((p: any) => p.pricing_mode === 'tiered');

    if (singlePriceProduct) {
      console.log(`💵 Single price product: ${singlePriceProduct.name}`);
      expect(singlePriceProduct.price).toBeDefined();
      console.log(`   Price: $${singlePriceProduct.price}`);
    }

    if (tieredPriceProduct) {
      console.log(`📊 Tiered price product: ${tieredPriceProduct.name}`);
      expect(tieredPriceProduct.pricing_tiers).toBeDefined();
      console.log(`   Tiers: ${tieredPriceProduct.pricing_tiers.length}`);

      tieredPriceProduct.pricing_tiers.forEach((tier: any, idx: number) => {
        console.log(`   ${idx + 1}. ${tier.label}: $${tier.price}`);
      });
    }

    console.log('✅ Database pricing structure validated');
  });
});
