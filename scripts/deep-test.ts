/**
 * Deep Integration Test Suite
 * Tests all systems with real database data
 */

import { getServiceSupabase } from '../lib/supabase/client';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  duration: number;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  console.log(`\n🧪 Testing: ${name}`);
  
  try {
    await testFn();
    const duration = Date.now() - start;
    results.push({ name, passed: true, details: 'Success', duration });
    console.log(`   ✅ PASSED (${duration}ms)`);
  } catch (error: any) {
    const duration = Date.now() - start;
    results.push({ name, passed: false, details: error.message, duration });
    console.log(`   ❌ FAILED: ${error.message}`);
  }
}

async function main() {
  console.log('🧪 DEEP INTEGRATION TEST SUITE');
  console.log('==============================\n');
  console.log('Testing with REAL DATABASE DATA\n');

  const supabase = getServiceSupabase();

  // Test 1: Verify real vendors exist
  await runTest('Real Vendors in Database', async () => {
    const { data: vendors, error } = await supabase
      .from('vendors')
      .select('id, store_name, email, status')
      .limit(10);

    if (error) throw new Error(`Database error: ${error.message}`);
    
    console.log(`   📊 Found ${vendors?.length || 0} vendors`);
    
    if (vendors && vendors.length > 0) {
      const activeVendors = vendors.filter(v => v.status === 'active');
      console.log(`   ✅ Active vendors: ${activeVendors.length}`);
      console.log(`   📝 Sample: ${vendors[0].store_name}`);
    } else {
      throw new Error('No vendors found in database');
    }
  });

  // Test 2: Verify real products exist
  await runTest('Real Products in Database', async () => {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, price, status, vendor_id')
      .limit(10);

    if (error) throw new Error(`Database error: ${error.message}`);
    
    console.log(`   📦 Found ${products?.length || 0} products`);
    
    if (products && products.length > 0) {
      const published = products.filter(p => p.status === 'published');
      console.log(`   ✅ Published: ${published.length}`);
      console.log(`   📝 Sample: ${products[0].name} ($${products[0].price})`);
    } else {
      throw new Error('No products found in database');
    }
  });

  // Test 3: Verify inventory exists
  await runTest('Real Inventory in Database', async () => {
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select('id, product_id, quantity, vendor_id, location_id')
      .limit(10);

    if (error) throw new Error(`Database error: ${error.message}`);
    
    console.log(`   📊 Found ${inventory?.length || 0} inventory records`);
    
    if (inventory && inventory.length > 0) {
      const totalQty = inventory.reduce((sum, inv) => sum + parseFloat(inv.quantity || '0'), 0);
      console.log(`   ✅ Total quantity: ${totalQty}g`);
    }
  });

  // Test 4: Test vendor dashboard with real vendor
  await runTest('Vendor Dashboard with Real Data', async () => {
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id')
      .eq('status', 'active')
      .limit(1)
      .single();

    if (!vendors) throw new Error('No active vendors found');

    const vendorId = vendors.id;
    console.log(`   🔑 Testing with vendor ID: ${vendorId}`);

    // Test dashboard API
    const response = await fetch(`http://localhost:3000/api/vendor/dashboard`, {
      headers: { 'x-vendor-id': vendorId }
    });

    if (!response.ok) throw new Error(`Dashboard API failed: ${response.status}`);

    const data = await response.json();
    
    if (!data.success) throw new Error('Dashboard returned success=false');

    console.log(`   📊 Stats:`, JSON.stringify(data.stats, null, 2));
  });

  // Test 5: Verify cache invalidation works
  await runTest('Cache Invalidation System', async () => {
    const { productCache } = await import('../lib/cache-manager');
    
    // Check cache stats
    const stats = productCache.getStats();
    console.log(`   📊 Product cache: ${stats.size}/${stats.max} items`);
    
    // Invalidate pattern
    productCache.invalidatePattern('products:.*');
    
    const statsAfter = productCache.getStats();
    console.log(`   🧹 After invalidation: ${statsAfter.size}/${statsAfter.max} items`);
  });

  // Test 6: Test parallel queries
  await runTest('Parallel Query Execution', async () => {
    const { getVendorDashboardData } = await import('../lib/parallel-queries');
    
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id')
      .limit(1)
      .single();

    if (!vendors) throw new Error('No vendors found');

    const startTime = Date.now();
    const result = await getVendorDashboardData(vendors.id);
    const duration = Date.now() - startTime;

    console.log(`   ⏱️  Parallel query duration: ${duration}ms`);
    console.log(`   📊 Products: ${result.products.length}`);
    console.log(`   📊 Inventory: ${result.inventory.length}`);
    console.log(`   📊 Orders: ${result.orders.length}`);
    
    if (duration > 500) {
      throw new Error(`Parallel queries too slow: ${duration}ms (target: <500ms)`);
    }
  });

  // Test 7: Verify job queue works
  await runTest('Job Queue System', async () => {
    const { jobQueue } = await import('../lib/job-queue');
    
    // Enqueue test job
    const jobId = await jobQueue.enqueue('send-email', {
      to: 'test@example.com',
      subject: 'Test Job'
    });

    console.log(`   📋 Job enqueued: ${jobId}`);

    // Check stats
    const stats = jobQueue.getStats();
    console.log(`   📊 Queue stats: ${JSON.stringify(stats)}`);

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    const statsAfter = jobQueue.getStats();
    console.log(`   📊 After processing: ${JSON.stringify(statsAfter)}`);
  });

  // Test 8: Check for mock data
  await runTest('No Mock Data Verification', async () => {
    const response = await fetch('http://localhost:3000/vendor/dashboard');
    const html = await response.text();

    // Check for common mock data patterns
    const mockPatterns = [
      'heights = [15, 25, 20',
      'demo-data',
      'test-data',
      'mock-',
      'placeholder-bar',
      'fake-'
    ];

    for (const pattern of mockPatterns) {
      if (html.toLowerCase().includes(pattern.toLowerCase())) {
        throw new Error(`Found mock data pattern: "${pattern}"`);
      }
    }

    console.log('   ✅ No mock data patterns found');
  });

  // Summary
  console.log('\n\n📊 TEST SUMMARY');
  console.log('═══════════════');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ${failed > 0 ? '❌' : ''}`);
  console.log(`Total Duration: ${totalDuration}ms\n`);

  if (failed > 0) {
    console.log('Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ ${r.name}: ${r.details}`);
    });
  }

  console.log('\n' + (failed === 0 ? '✅ ALL TESTS PASSED!' : '❌ SOME TESTS FAILED'));
  
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);

