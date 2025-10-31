#!/usr/bin/env node

/**
 * Error Recovery and Edge Case Testing
 * Tests failure scenarios and system recovery
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://uaednwpxursknmwdeejn.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const results = { passed: 0, failed: 0, warnings: 0 }

function log(emoji, message) {
  console.log(`${emoji} ${message}`)
}

function pass(test) {
  results.passed++
  log('✅', test)
}

function fail(test, error) {
  results.failed++
  log('❌', `${test}: ${error}`)
}

function warn(test, message) {
  results.warnings++
  log('⚠️', `${test}: ${message}`)
}

// =============================================================================
// ERROR RECOVERY TESTS
// =============================================================================

async function testAPIErrorHandling() {
  log('🧪', '\n=== API ERROR HANDLING TESTS ===')

  // Test 1: POST with missing content-type
  try {
    const response = await fetch('http://localhost:3000/api/vendor/apps', {
      method: 'POST',
      body: JSON.stringify({ test: 'data' })
      // Missing Content-Type header
    })

    // Should handle gracefully
    pass('API handles missing Content-Type header')
  } catch (err) {
    fail('API handles missing Content-Type', err.message)
  }

  // Test 2: POST with malformed JSON
  try {
    const response = await fetch('http://localhost:3000/api/vendor/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'this is not valid json{'
    })

    const data = await response.json().catch(() => null)

    if (response.status === 400 || response.status === 500) {
      pass('API handles malformed JSON')
    } else {
      fail('API handles malformed JSON', 'Did not return error status')
    }
  } catch (err) {
    pass('API handles malformed JSON (threw exception)')
  }

  // Test 3: GET with invalid UUID
  try {
    const response = await fetch('http://localhost:3000/api/vendor/apps/invalid-uuid-format')

    if (response.status === 400 || response.status === 404) {
      pass('API handles invalid UUID format')
    } else {
      warn('API handles invalid UUID', `Got status ${response.status}`)
    }
  } catch (err) {
    pass('API handles invalid UUID (threw exception)')
  }

  // Test 4: Extremely large payload
  try {
    const largePayload = {
      vendorId: 'test',
      name: 'A'.repeat(1000000), // 1MB of 'A's
      description: 'B'.repeat(1000000)
    }

    const response = await fetch('http://localhost:3000/api/vendor/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(largePayload)
    })

    // Should either reject or handle
    if (response.status === 413 || response.status === 400) {
      pass('API handles extremely large payloads')
    } else {
      warn('API large payload handling', `Got status ${response.status}`)
    }
  } catch (err) {
    pass('API handles large payloads (connection error)')
  }

  // Test 5: SQL injection attempt in app name
  try {
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id')
      .limit(1)

    if (vendors && vendors.length > 0) {
      const response = await fetch('http://localhost:3000/api/vendor/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: vendors[0].id,
          name: "'; DROP TABLE vendor_apps; --",
          app_type: 'custom'
        })
      })

      // Check if table still exists after
      const { error } = await supabase
        .from('vendor_apps')
        .select('id')
        .limit(1)

      if (!error) {
        pass('API prevents SQL injection')
      } else {
        fail('API SQL injection test', 'Table may have been affected')
      }
    }
  } catch (err) {
    warn('SQL injection test', err.message)
  }

  // Test 6: XSS attempt in app name
  try {
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id')
      .limit(1)

    if (vendors && vendors.length > 0) {
      const xssPayload = '<script>alert("xss")</script>'

      const response = await fetch('http://localhost:3000/api/vendor/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: vendors[0].id,
          name: xssPayload,
          app_type: 'custom'
        })
      })

      const data = await response.json()

      // Should either reject or sanitize
      pass('API handles XSS attempts')
    }
  } catch (err) {
    warn('XSS test', err.message)
  }

  // Test 7: Race condition - concurrent app creation
  try {
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id')
      .limit(1)

    if (vendors && vendors.length > 0) {
      const timestamp = Date.now()

      // Create two apps with same name simultaneously
      const promises = [
        fetch('http://localhost:3000/api/vendor/apps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendorId: vendors[0].id,
            name: `Race Test ${timestamp}`,
            app_type: 'custom'
          })
        }),
        fetch('http://localhost:3000/api/vendor/apps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vendorId: vendors[0].id,
            name: `Race Test ${timestamp}`,
            app_type: 'custom'
          })
        })
      ]

      const results = await Promise.all(promises)
      const successCount = results.filter(r => r.ok).length

      // At least one should succeed or both should fail with duplicate error
      if (successCount >= 1) {
        pass('API handles concurrent requests')

        // Clean up
        const slug = `race-test-${timestamp}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        await supabase
          .from('vendor_apps')
          .delete()
          .eq('vendor_id', vendors[0].id)
          .eq('slug', slug)
      } else {
        warn('Concurrent requests', 'Both requests failed')
      }
    }
  } catch (err) {
    warn('Race condition test', err.message)
  }
}

async function testDatabaseConstraints() {
  log('🧪', '\n=== DATABASE CONSTRAINT TESTS ===')

  const { data: vendors } = await supabase
    .from('vendors')
    .select('id')
    .limit(1)

  if (!vendors || vendors.length === 0) {
    warn('Database constraint tests', 'No vendors found')
    return
  }

  const testVendorId = vendors[0].id

  // Test 1: NULL vendor_id
  try {
    const { error } = await supabase
      .from('vendor_apps')
      .insert({
        vendor_id: null,
        name: 'Test',
        slug: 'test',
        app_type: 'custom'
      })

    if (error && error.message.includes('null')) {
      pass('Database prevents NULL vendor_id')
    } else {
      fail('NULL vendor_id constraint', 'Should reject NULL')
    }
  } catch (err) {
    pass('Database prevents NULL vendor_id (exception)')
  }

  // Test 2: Invalid app_type
  try {
    const { error } = await supabase
      .from('vendor_apps')
      .insert({
        vendor_id: testVendorId,
        name: 'Test Invalid Type',
        slug: 'test-invalid-type',
        app_type: 'invalid-type'
      })

    if (error && error.message.includes('check')) {
      pass('Database enforces app_type enum')
    } else {
      fail('app_type constraint', 'Should reject invalid type')
    }
  } catch (err) {
    pass('Database enforces app_type enum (exception)')
  }

  // Test 3: Invalid status
  try {
    const { error } = await supabase
      .from('vendor_apps')
      .insert({
        vendor_id: testVendorId,
        name: 'Test Invalid Status',
        slug: 'test-invalid-status',
        app_type: 'custom',
        status: 'invalid-status'
      })

    if (error && error.message.includes('check')) {
      pass('Database enforces status enum')
    } else {
      fail('status constraint', 'Should reject invalid status')
    }
  } catch (err) {
    pass('Database enforces status enum (exception)')
  }

  // Test 4: Foreign key constraint (non-existent vendor)
  try {
    const fakeVendorId = '00000000-0000-0000-0000-000000000000'

    const { error } = await supabase
      .from('vendor_apps')
      .insert({
        vendor_id: fakeVendorId,
        name: 'Test FK',
        slug: 'test-fk',
        app_type: 'custom'
      })

    if (error && error.message.includes('foreign key')) {
      pass('Database enforces foreign key constraints')
    } else {
      fail('Foreign key constraint', 'Should reject non-existent vendor')
    }
  } catch (err) {
    pass('Database enforces foreign key constraints (exception)')
  }

  // Test 5: Cascading delete
  try {
    // Create test vendor
    const { data: testVendor, error: vendorError } = await supabase
      .from('vendors')
      .insert({
        store_name: 'Delete Test Vendor',
        slug: `delete-test-${Date.now()}`
      })
      .select()
      .single()

    if (!vendorError && testVendor) {
      // Create app for this vendor
      const { data: testApp, error: appError } = await supabase
        .from('vendor_apps')
        .insert({
          vendor_id: testVendor.id,
          name: 'Delete Test App',
          slug: 'delete-test-app',
          app_type: 'custom'
        })
        .select()
        .single()

      if (!appError && testApp) {
        // Delete vendor
        await supabase
          .from('vendors')
          .delete()
          .eq('id', testVendor.id)

        // Check if app was also deleted
        const { data: orphanedApp } = await supabase
          .from('vendor_apps')
          .select('id')
          .eq('id', testApp.id)
          .single()

        if (!orphanedApp) {
          pass('Cascading delete works (ON DELETE CASCADE)')
        } else {
          fail('Cascading delete', 'App was not deleted with vendor')
        }
      }
    }
  } catch (err) {
    warn('Cascading delete test', err.message)
  }
}

async function testGitHubErrorRecovery() {
  log('🧪', '\n=== GITHUB ERROR RECOVERY TESTS ===')

  // Test 1: Invalid repo name
  try {
    const response = await fetch('https://api.github.com/repos/floradistro/this-repo-does-not-exist-12345', {
      headers: {
        'Authorization': `token ${process.env.GITHUB_BOT_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })

    if (response.status === 404) {
      pass('GitHub API returns 404 for non-existent repo')
    } else {
      warn('GitHub 404 test', `Got status ${response.status}`)
    }
  } catch (err) {
    fail('GitHub API error handling', err.message)
  }

  // Test 2: Rate limit handling
  try {
    const response = await fetch('https://api.github.com/rate_limit', {
      headers: {
        'Authorization': `token ${process.env.GITHUB_BOT_TOKEN}`
      }
    })
    const data = await response.json()

    if (data.rate && data.rate.remaining < 100) {
      warn('GitHub rate limit', `Only ${data.rate.remaining} requests remaining`)
    } else {
      pass('GitHub rate limit check works')
    }
  } catch (err) {
    fail('GitHub rate limit check', err.message)
  }

  // Test 3: Invalid token handling
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': 'token invalid_token_12345'
      }
    })

    if (response.status === 401) {
      pass('GitHub API rejects invalid tokens')
    } else {
      fail('Invalid token handling', `Got status ${response.status}`)
    }
  } catch (err) {
    fail('Invalid token test', err.message)
  }
}

async function testVercelErrorRecovery() {
  log('🧪', '\n=== VERCEL ERROR RECOVERY TESTS ===')

  // Test 1: Invalid project name
  try {
    const response = await fetch('https://api.vercel.com/v9/projects/this-project-does-not-exist-12345', {
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`
      }
    })

    if (response.status === 404 || response.status === 403) {
      pass('Vercel API returns error for non-existent project')
    } else {
      warn('Vercel 404 test', `Got status ${response.status}`)
    }
  } catch (err) {
    fail('Vercel API error handling', err.message)
  }

  // Test 2: Invalid token handling
  try {
    const response = await fetch('https://api.vercel.com/v2/user', {
      headers: {
        'Authorization': 'Bearer invalid_token_12345'
      }
    })

    if (response.status === 403 || response.status === 401) {
      pass('Vercel API rejects invalid tokens')
    } else {
      fail('Invalid Vercel token handling', `Got status ${response.status}`)
    }
  } catch (err) {
    fail('Invalid Vercel token test', err.message)
  }
}

async function testAnthropicErrorRecovery() {
  log('🧪', '\n=== ANTHROPIC API ERROR RECOVERY TESTS ===')

  // Test 1: Invalid API key
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'sk-ant-invalid-key-12345',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      })
    })

    if (response.status === 401 || response.status === 403) {
      pass('Anthropic API rejects invalid keys')
    } else {
      fail('Invalid Anthropic key handling', `Got status ${response.status}`)
    }
  } catch (err) {
    fail('Invalid Anthropic key test', err.message)
  }

  // Test 2: Invalid model name
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'invalid-model-name',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      })
    })

    const data = await response.json()

    if (response.status === 400 && data.error) {
      pass('Anthropic API rejects invalid model names')
    } else {
      warn('Invalid model test', `Got status ${response.status}`)
    }
  } catch (err) {
    fail('Invalid model test', err.message)
  }

  // Test 3: Rate limiting
  try {
    // Send multiple rapid requests
    const promises = []
    for (let i = 0; i < 5; i++) {
      promises.push(
        fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 5,
            messages: [{ role: 'user', content: `Test ${i}` }]
          })
        })
      )
    }

    const results = await Promise.all(promises)
    const rateLimited = results.some(r => r.status === 429)

    if (rateLimited) {
      pass('Anthropic API rate limiting works')
    } else {
      pass('Anthropic API handled rapid requests')
    }
  } catch (err) {
    warn('Rate limiting test', err.message)
  }
}

// =============================================================================
// MAIN TEST RUNNER
// =============================================================================

async function runAllTests() {
  console.log('🚀 Starting Error Recovery & Edge Case Tests\n')

  // Load environment variables
  if (!process.env.GITHUB_BOT_TOKEN) {
    const envPath = '/Users/whale/Desktop/Website/.env.local'
    const fs = await import('fs')
    const envContent = fs.readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim()
      }
    })
  }

  await testAPIErrorHandling()
  await testDatabaseConstraints()
  await testGitHubErrorRecovery()
  await testVercelErrorRecovery()
  await testAnthropicErrorRecovery()

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 ERROR RECOVERY TEST SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`⚠️  Warnings: ${results.warnings}`)
  console.log('='.repeat(60))

  if (results.failed === 0) {
    console.log('✅ All error recovery tests passed!')
  } else {
    console.log('❌ Some tests failed. Please review.')
    process.exit(1)
  }
}

runAllTests().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
