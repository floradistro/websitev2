#!/usr/bin/env node

/**
 * Live Monitoring Dashboard Test Suite
 * This script generates real API traffic so you can see the monitoring dashboard in action
 */

const axios = require('axios');
const BASE_URL = 'http://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Helper to make requests and log them
async function makeRequest(name, url, options = {}) {
  try {
    const start = Date.now();
    const response = await axios.get(url, options);
    const duration = Date.now() - start;
    
    console.log(`${colors.green}✓${colors.reset} ${name.padEnd(30)} ${colors.dim}${duration}ms${colors.reset}`);
    return { success: true, duration, data: response.data };
  } catch (error) {
    console.log(`${colors.yellow}✗${colors.reset} ${name.padEnd(30)} ${colors.dim}Failed${colors.reset}`);
    return { success: false, error: error.message };
  }
}

// Test scenarios
async function runTestSuite() {
  console.log('\n' + colors.bright + '🚀 LIVE MONITORING DASHBOARD TEST SUITE' + colors.reset);
  console.log('=' + '='.repeat(50));
  console.log(colors.cyan + '\n📊 Open the monitoring dashboard to see live updates:' + colors.reset);
  console.log(colors.bright + '   http://localhost:3000/admin/monitoring\n' + colors.reset);
  console.log('Make sure the dashboard is set to ' + colors.green + 'LIVE' + colors.reset + ' mode!\n');
  console.log('-'.repeat(51) + '\n');

  // Phase 1: Warm up the cache
  console.log(colors.magenta + '📈 PHASE 1: CACHE WARM-UP' + colors.reset);
  console.log('Watch the cache hit rate increase from 0% to 90%+\n');
  
  for (let i = 0; i < 5; i++) {
    await makeRequest('Products API (Cold)', `${BASE_URL}/api/supabase/products?page=${i+1}`);
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Repeat to show cache hits
  console.log('\n' + colors.cyan + 'Repeating requests to demonstrate cache...' + colors.reset);
  for (let i = 0; i < 5; i++) {
    await makeRequest('Products API (Cached)', `${BASE_URL}/api/supabase/products?page=${i+1}`);
    await new Promise(r => setTimeout(r, 200));
  }

  // Phase 2: Different API endpoints
  console.log('\n' + colors.magenta + '📊 PHASE 2: VARIOUS API ENDPOINTS' + colors.reset);
  console.log('Watch different operations appear in the performance table\n');
  
  const endpoints = [
    { name: 'Vendor Dashboard', url: '/api/vendor/dashboard', headers: { 'x-vendor-id': 'cd2e1122-d511-4edb-be5d-98ef274b4baf' } },
    { name: 'Admin Analytics', url: '/api/admin/analytics' },
    { name: 'Performance Stats', url: '/api/admin/performance-stats' },
    { name: 'Inventory Check', url: '/api/supabase/inventory' },
    { name: 'Categories', url: '/api/supabase/categories' },
  ];

  for (const endpoint of endpoints) {
    await makeRequest(endpoint.name, BASE_URL + endpoint.url, { headers: endpoint.headers || {} });
    await new Promise(r => setTimeout(r, 1000));
  }

  // Phase 3: Simulate traffic patterns
  console.log('\n' + colors.magenta + '📉 PHASE 3: TRAFFIC SIMULATION' + colors.reset);
  console.log('Watch the response time chart update with varying loads\n');

  // Light traffic
  console.log(colors.cyan + 'Light traffic (slow requests)...' + colors.reset);
  for (let i = 0; i < 5; i++) {
    await makeRequest(`Products Request ${i+1}`, `${BASE_URL}/api/supabase/products?category=flower`);
    await new Promise(r => setTimeout(r, 2000));
  }

  // Heavy traffic burst
  console.log('\n' + colors.cyan + 'Heavy traffic burst (rapid requests)...' + colors.reset);
  const rapidRequests = [];
  for (let i = 0; i < 10; i++) {
    rapidRequests.push(
      makeRequest(`Burst Request ${i+1}`, `${BASE_URL}/api/supabase/products?per_page=5`)
    );
  }
  await Promise.all(rapidRequests);

  // Phase 4: Cache utilization
  console.log('\n' + colors.magenta + '📦 PHASE 4: CACHE UTILIZATION' + colors.reset);
  console.log('Watch the cache size bars increase\n');

  // Fill product cache
  console.log(colors.cyan + 'Filling product cache...' + colors.reset);
  for (let i = 0; i < 10; i++) {
    await makeRequest(`Product Category ${i+1}`, `${BASE_URL}/api/supabase/products?category=${i}`);
    await new Promise(r => setTimeout(r, 300));
  }

  // Fill vendor cache
  console.log('\n' + colors.cyan + 'Testing vendor endpoints...' + colors.reset);
  const vendorIds = [
    'cd2e1122-d511-4edb-be5d-98ef274b4baf',
    'e7b61661-b25a-4152-b83a-030cea9c6c2f',
    '17de99c6-4323-41a9-aca8-5f5bbf1f3562'
  ];

  for (const vendorId of vendorIds) {
    await makeRequest(`Vendor ${vendorId.substring(0, 8)}`, `${BASE_URL}/api/vendor/products`, {
      headers: { 'x-vendor-id': vendorId }
    });
    await new Promise(r => setTimeout(r, 500));
  }

  // Phase 5: Performance patterns
  console.log('\n' + colors.magenta + '📐 PHASE 5: PERFORMANCE PATTERNS' + colors.reset);
  console.log('Creating different response time patterns\n');

  // Consistent fast responses
  console.log(colors.cyan + 'Fast cached responses...' + colors.reset);
  for (let i = 0; i < 5; i++) {
    await makeRequest(`Fast Request ${i+1}`, `${BASE_URL}/api/supabase/products?page=1`);
    await new Promise(r => setTimeout(r, 100));
  }

  // Variable response times
  console.log('\n' + colors.cyan + 'Variable response times...' + colors.reset);
  const delays = [100, 500, 200, 1000, 300];
  for (let i = 0; i < delays.length; i++) {
    await makeRequest(`Variable Request ${i+1}`, `${BASE_URL}/api/supabase/products?search=test${i}`);
    await new Promise(r => setTimeout(r, delays[i]));
  }

  // Phase 6: Monitor the monitor
  console.log('\n' + colors.magenta + '🔍 PHASE 6: MONITORING METRICS' + colors.reset);
  console.log('Checking the monitoring dashboard itself\n');

  // Get final stats
  const stats = await makeRequest('Final Stats Check', `${BASE_URL}/api/admin/performance-stats`);
  
  if (stats.success && stats.data) {
    console.log('\n' + colors.bright + '📊 FINAL DASHBOARD METRICS:' + colors.reset);
    console.log('-'.repeat(51));
    console.log(`Health Score:     ${colors.green}${stats.data.health.score}/100${colors.reset} (${stats.data.health.status})`);
    console.log(`Cache Hit Rate:   ${colors.green}${stats.data.cache.hitRate}${colors.reset}`);
    console.log(`Total Requests:   ${colors.cyan}${stats.data.cache.total}${colors.reset}`);
    console.log(`Cache Hits:       ${colors.green}${stats.data.cache.hits}${colors.reset}`);
    console.log(`Cache Misses:     ${colors.yellow}${stats.data.cache.misses}${colors.reset}`);
    
    console.log('\n' + colors.bright + '📈 CACHE SIZES:' + colors.reset);
    console.log(`Product Cache:    ${stats.data.cache.sizes.product.size}/${stats.data.cache.sizes.product.max}`);
    console.log(`Vendor Cache:     ${stats.data.cache.sizes.vendor.size}/${stats.data.cache.sizes.vendor.max}`);
    console.log(`Inventory Cache:  ${stats.data.cache.sizes.inventory.size}/${stats.data.cache.sizes.inventory.max}`);
    
    if (stats.data.performance && Object.keys(stats.data.performance).length > 0) {
      console.log('\n' + colors.bright + '⚡ API PERFORMANCE:' + colors.reset);
      Object.entries(stats.data.performance).slice(0, 5).forEach(([op, data]) => {
        console.log(`${op.padEnd(20)} Avg: ${data.avg.toFixed(0)}ms, P95: ${data.p95.toFixed(0)}ms`);
      });
    }
  }

  console.log('\n' + colors.green + '✅ TEST SUITE COMPLETE!' + colors.reset);
  console.log('\n' + colors.cyan + '💡 What you should see on the dashboard:' + colors.reset);
  console.log('   • Health score at 90-100');
  console.log('   • Cache hit rate above 90%');
  console.log('   • Response time chart with live data');
  console.log('   • Cache utilization bars filled');
  console.log('   • API performance table with multiple operations');
  console.log('   • All metrics updating in real-time');
  console.log('\n' + colors.bright + '🎯 Dashboard URL: http://localhost:3000/admin/monitoring' + colors.reset + '\n');
}

// Continuous mode for extended testing
async function continuousMode() {
  console.log('\n' + colors.yellow + '♾️  CONTINUOUS MODE' + colors.reset);
  console.log('Generating traffic every 3 seconds. Press Ctrl+C to stop.\n');

  let requestCount = 0;
  while (true) {
    requestCount++;
    const endpoints = [
      '/api/supabase/products',
      '/api/supabase/products?category=flower',
      '/api/supabase/products?category=edibles',
      '/api/vendor/dashboard',
      '/api/admin/performance-stats',
    ];
    
    const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    await makeRequest(`Continuous Request ${requestCount}`, BASE_URL + randomEndpoint, {
      headers: randomEndpoint.includes('vendor') ? { 'x-vendor-id': 'cd2e1122-d511-4edb-be5d-98ef274b4baf' } : {}
    });
    
    await new Promise(r => setTimeout(r, 3000));
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--continuous')) {
    await continuousMode();
  } else {
    await runTestSuite();
    
    console.log('\n' + colors.dim + 'Run with --continuous flag for ongoing traffic generation' + colors.reset);
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('\n' + colors.bright + colors.yellow + '⚠️  Error:', error.message + colors.reset);
  process.exit(1);
});

// Run the test suite
main().catch(console.error);
