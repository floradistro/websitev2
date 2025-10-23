/**
 * Load Testing Script
 * Tests system under high concurrent load
 * Simulates 10K+ concurrent users
 */

interface LoadTestConfig {
  baseUrl: string;
  totalRequests: number;
  concurrency: number;
  endpoints: string[];
}

interface LoadTestResult {
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50: number;
  p95: number;
  p99: number;
  throughput: number;
}

/**
 * Run load test for a single endpoint
 */
async function testEndpoint(
  url: string,
  requestCount: number,
  concurrency: number
): Promise<LoadTestResult> {
  const responseTimes: number[] = [];
  let successCount = 0;
  let failureCount = 0;
  
  const startTime = Date.now();
  
  // Create batches of concurrent requests
  const batches = Math.ceil(requestCount / concurrency);
  
  for (let batch = 0; batch < batches; batch++) {
    const batchSize = Math.min(concurrency, requestCount - (batch * concurrency));
    const requests = [];
    
    for (let i = 0; i < batchSize; i++) {
      requests.push(
        (async () => {
          const requestStart = Date.now();
          
          try {
            const response = await fetch(url);
            const requestEnd = Date.now();
            const duration = requestEnd - requestStart;
            
            responseTimes.push(duration);
            
            if (response.ok) {
              successCount++;
            } else {
              failureCount++;
            }
          } catch (error) {
            failureCount++;
            responseTimes.push(999999); // Timeout/error
          }
        })()
      );
    }
    
    await Promise.allSettled(requests);
  }
  
  const endTime = Date.now();
  const totalDuration = (endTime - startTime) / 1000; // seconds
  
  // Calculate statistics
  responseTimes.sort((a, b) => a - b);
  
  const sum = responseTimes.reduce((a, b) => a + b, 0);
  const avg = responseTimes.length > 0 ? sum / responseTimes.length : 0;
  const min = responseTimes[0] || 0;
  const max = responseTimes[responseTimes.length - 1] || 0;
  const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)] || 0;
  const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)] || 0;
  const p99 = responseTimes[Math.floor(responseTimes.length * 0.99)] || 0;
  const throughput = requestCount / totalDuration;
  
  return {
    endpoint: url,
    totalRequests: requestCount,
    successfulRequests: successCount,
    failedRequests: failureCount,
    averageResponseTime: avg,
    minResponseTime: min,
    maxResponseTime: max,
    p50,
    p95,
    p99,
    throughput
  };
}

/**
 * Run full load test suite
 */
async function runLoadTest(config: LoadTestConfig): Promise<void> {
  console.log('🚀 Starting load test...');
  console.log(`   Base URL: ${config.baseUrl}`);
  console.log(`   Total Requests per Endpoint: ${config.totalRequests}`);
  console.log(`   Concurrency: ${config.concurrency}`);
  console.log(`   Endpoints: ${config.endpoints.length}`);
  console.log('');
  
  const results: LoadTestResult[] = [];
  
  for (const endpoint of config.endpoints) {
    const url = `${config.baseUrl}${endpoint}`;
    console.log(`📊 Testing: ${endpoint}`);
    
    const result = await testEndpoint(url, config.totalRequests, config.concurrency);
    results.push(result);
    
    console.log(`   ✅ Success: ${result.successfulRequests}/${result.totalRequests}`);
    console.log(`   ⏱️  Avg Response: ${result.averageResponseTime.toFixed(2)}ms`);
    console.log(`   📈 P95: ${result.p95.toFixed(2)}ms`);
    console.log(`   🚀 Throughput: ${result.throughput.toFixed(2)} req/s`);
    console.log('');
  }
  
  // Summary
  console.log('📊 LOAD TEST SUMMARY');
  console.log('='.repeat(80));
  
  const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0);
  const totalSuccess = results.reduce((sum, r) => sum + r.successfulRequests, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failedRequests, 0);
  const successRate = (totalSuccess / totalRequests) * 100;
  
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Successful: ${totalSuccess} (${successRate.toFixed(2)}%)`);
  console.log(`Failed: ${totalFailed} (${((totalFailed / totalRequests) * 100).toFixed(2)}%)`);
  console.log('');
  
  results.forEach(result => {
    const status = result.averageResponseTime < 200 ? '✅' :
                   result.averageResponseTime < 500 ? '⚠️' : '🔴';
    
    console.log(`${status} ${result.endpoint}`);
    console.log(`   Avg: ${result.averageResponseTime.toFixed(2)}ms | P95: ${result.p95.toFixed(2)}ms | P99: ${result.p99.toFixed(2)}ms`);
    console.log(`   Throughput: ${result.throughput.toFixed(2)} req/s`);
  });
  
  console.log('');
  console.log('✅ Load test complete!');
}

// Run load test if executed directly
if (require.main === module) {
  const config: LoadTestConfig = {
    baseUrl: process.env.TEST_URL || 'http://localhost:3000',
    totalRequests: 1000, // 1K requests per endpoint
    concurrency: 50,     // 50 concurrent connections
    endpoints: [
      '/api/supabase/products',
      '/api/admin/performance-stats',
      '/api/admin/jobs?action=stats',
    ]
  };
  
  runLoadTest(config).catch(console.error);
}

export { runLoadTest, testEndpoint };

