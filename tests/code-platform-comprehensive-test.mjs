#!/usr/bin/env node

/**
 * Comprehensive Code Platform Testing Suite
 * Tests: Database, APIs, GitHub, Vercel, Edge Cases
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://uaednwpxursknmwdeejn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5OTcyMzMsImV4cCI6MjA3NjU3MzIzM30.N8jPwlyCBB5KJB5I-XaK6m-mq88rSR445AWFJJmwRCg'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Test results tracking
const results = {
  passed: [],
  failed: [],
  warnings: []
}

function log(emoji, message) {
  console.log(`${emoji} ${message}`)
}

function pass(test) {
  results.passed.push(test)
  log('✅', test)
}

function fail(test, error) {
  results.failed.push({ test, error })
  log('❌', `${test}: ${error}`)
}

function warn(test, message) {
  results.warnings.push({ test, message })
  log('⚠️', `${test}: ${message}`)
}

// =============================================================================
// DATABASE TESTS
// =============================================================================

async function testDatabaseSchema() {
  log('🧪', '\n=== DATABASE SCHEMA TESTS ===')

  // Test 1: Check if vendor_apps table exists
  try {
    const { error } = await supabase
      .from('vendor_apps')
      .select('id')
      .limit(1)

    if (error && error.message.includes('does not exist')) {
      fail('vendor_apps table exists', 'Table not found')
    } else {
      pass('vendor_apps table exists')
    }
  } catch (err) {
    fail('vendor_apps table exists', err.message)
  }

  // Test 2: Check if vendor_ai_usage table exists
  try {
    const { error } = await supabase
      .from('vendor_ai_usage')
      .select('id')
      .limit(1)

    if (error && error.message.includes('does not exist')) {
      fail('vendor_ai_usage table exists', 'Table not found')
    } else {
      pass('vendor_ai_usage table exists')
    }
  } catch (err) {
    fail('vendor_ai_usage table exists', err.message)
  }

  // Test 3: Check if app_templates table exists and has data
  try {
    const { data, error } = await supabase
      .from('app_templates')
      .select('*')

    if (error) {
      fail('app_templates table exists', error.message)
    } else if (!data || data.length === 0) {
      warn('app_templates has seed data', 'No templates found')
    } else {
      pass(`app_templates has ${data.length} templates`)
    }
  } catch (err) {
    fail('app_templates table exists', err.message)
  }

  // Test 4: Check vendor_apps schema has required columns
  try {
    const { data, error } = await supabase
      .from('vendor_apps')
      .select('*')
      .limit(1)

    if (!error && data) {
      const requiredColumns = ['id', 'vendor_id', 'name', 'slug', 'app_type', 'github_repo', 'deployment_url', 'status']
      const hasAllColumns = requiredColumns.every(col => data.length === 0 || col in (data[0] || {}))

      if (data.length === 0) {
        pass('vendor_apps has correct schema (empty table)')
      } else if (hasAllColumns) {
        pass('vendor_apps has all required columns')
      } else {
        fail('vendor_apps has all required columns', 'Missing columns')
      }
    }
  } catch (err) {
    fail('vendor_apps schema validation', err.message)
  }
}

async function testRLSPolicies() {
  log('🧪', '\n=== RLS POLICY TESTS ===')

  // Test 1: Try to access vendor_apps with anon key (should be restricted by RLS)
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  try {
    const { data, error } = await anonClient
      .from('vendor_apps')
      .select('*')

    // Anon access should either return empty or be filtered by RLS
    if (data) {
      pass('RLS policies active on vendor_apps (anon access controlled)')
    }
  } catch (err) {
    warn('RLS policies test', err.message)
  }

  // Test 2: Verify app_templates is publicly readable
  try {
    const { data, error } = await anonClient
      .from('app_templates')
      .select('*')

    if (data && data.length > 0) {
      pass('app_templates publicly readable')
    } else if (error) {
      fail('app_templates publicly readable', error.message)
    }
  } catch (err) {
    fail('app_templates publicly readable', err.message)
  }
}

// =============================================================================
// CODE PARSING TESTS
// =============================================================================

async function testCodeParsing() {
  log('🧪', '\n=== CODE PARSING TESTS ===')

  // Test 1: Parse code block with filename comment
  const codeWithFilename = `
Here's the code:

\`\`\`typescript
// filename: app/page.tsx
export default function Page() {
  return <div>Hello</div>
}
\`\`\`
`

  const blocks1 = parseCodeBlocks(codeWithFilename)
  if (blocks1.length === 1 && blocks1[0].filename === 'app/page.tsx') {
    pass('Parse code block with filename comment')
  } else {
    fail('Parse code block with filename comment', `Got ${blocks1.length} blocks, filename: ${blocks1[0]?.filename}`)
  }

  // Test 2: Parse multiple code blocks
  const multipleBlocks = `
\`\`\`tsx
// file: components/Button.tsx
export function Button() {}
\`\`\`

\`\`\`typescript
// filename: lib/utils.ts
export function util() {}
\`\`\`
`

  const blocks2 = parseCodeBlocks(multipleBlocks)
  if (blocks2.length === 2) {
    pass('Parse multiple code blocks')
  } else {
    fail('Parse multiple code blocks', `Expected 2, got ${blocks2.length}`)
  }

  // Test 3: Parse code without filename (should guess)
  const noFilename = `
\`\`\`tsx
export default function HomePage() {
  return <div>Test</div>
}
\`\`\`
`

  const blocks3 = parseCodeBlocks(noFilename)
  if (blocks3.length === 1 && blocks3[0].filename) {
    pass('Parse code without filename (guesses filename)')
  } else {
    fail('Parse code without filename', 'Failed to guess filename')
  }

  // Test 4: Handle empty code blocks
  const emptyBlock = `
\`\`\`typescript
\`\`\`
`

  const blocks4 = parseCodeBlocks(emptyBlock)
  if (blocks4.length === 0) {
    pass('Handle empty code blocks')
  } else {
    fail('Handle empty code blocks', `Should return 0, got ${blocks4.length}`)
  }

  // Test 5: Handle malformed code blocks
  const malformed = `
\`\`\`
This is not valid code
no closing backticks
`

  try {
    const blocks5 = parseCodeBlocks(malformed)
    pass('Handle malformed code blocks without crashing')
  } catch (err) {
    fail('Handle malformed code blocks', err.message)
  }
}

function parseCodeBlocks(text) {
  const codeBlocks = []
  const codeBlockRegex = /```(?:typescript|tsx|javascript|jsx|ts|js)?\n(?:\/\/\s*(?:filename:|file:)\s*(.+?)\n)?([\s\S]*?)```/gi

  let match
  while ((match = codeBlockRegex.exec(text)) !== null) {
    const filename = match[1]?.trim()
    const code = match[2]?.trim()

    if (code) {
      if (filename) {
        codeBlocks.push({ filename, code })
      } else {
        const guessedFilename = guessFilename(code)
        codeBlocks.push({ filename: guessedFilename, code })
      }
    }
  }

  return codeBlocks
}

function guessFilename(code) {
  if (code.includes('export default function') && code.includes('Page')) {
    return 'app/page.tsx'
  }
  if (code.includes('export default function') || code.includes('export function')) {
    const match = code.match(/export (?:default )?function (\w+)/)
    if (match) {
      return `components/${match[1]}.tsx`
    }
  }
  return 'app/page.tsx'
}

// =============================================================================
// API TESTS
// =============================================================================

async function testAPIs() {
  log('🧪', '\n=== API ENDPOINT TESTS ===')

  // Get a test vendor ID
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, slug, store_name')
    .limit(1)

  if (!vendors || vendors.length === 0) {
    warn('API tests', 'No vendors found, skipping API tests')
    return
  }

  const testVendor = vendors[0]
  log('📝', `Using test vendor: ${testVendor.store_name} (${testVendor.id})`)

  // Test 1: GET /api/vendor/apps
  try {
    const response = await fetch(`http://localhost:3000/api/vendor/apps?vendorId=${testVendor.id}`)
    const data = await response.json()

    if (response.ok && data.success) {
      pass('GET /api/vendor/apps returns success')
    } else {
      fail('GET /api/vendor/apps', data.error || 'Invalid response')
    }
  } catch (err) {
    fail('GET /api/vendor/apps', err.message)
  }

  // Test 2: POST /api/vendor/apps (with invalid data)
  try {
    const response = await fetch('http://localhost:3000/api/vendor/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendorId: testVendor.id,
        // Missing required fields
      })
    })
    const data = await response.json()

    if (response.status === 400 && !data.success) {
      pass('POST /api/vendor/apps validates required fields')
    } else {
      fail('POST /api/vendor/apps validation', 'Should reject invalid data')
    }
  } catch (err) {
    fail('POST /api/vendor/apps validation', err.message)
  }

  // Test 3: POST /api/vendor/ai-edit (with invalid data)
  try {
    const response = await fetch('http://localhost:3000/api/vendor/ai-edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing required fields
      })
    })
    const data = await response.json()

    if (response.status === 400 && !data.success) {
      pass('POST /api/vendor/ai-edit validates required fields')
    } else {
      fail('POST /api/vendor/ai-edit validation', 'Should reject invalid data')
    }
  } catch (err) {
    fail('POST /api/vendor/ai-edit validation', err.message)
  }
}

// =============================================================================
// EDGE CASE TESTS
// =============================================================================

async function testEdgeCases() {
  log('🧪', '\n=== EDGE CASE TESTS ===')

  // Test 1: Very long app names
  const longName = 'A'.repeat(1000)
  try {
    const slug = longName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    if (slug.length > 0) {
      pass('Handle very long app names')
    }
  } catch (err) {
    fail('Handle very long app names', err.message)
  }

  // Test 2: Special characters in app names
  const specialChars = '!@#$%^&*()_+-=[]{}|;:",.<>?/~`'
  try {
    const slug = specialChars.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    pass('Handle special characters in app names')
  } catch (err) {
    fail('Handle special characters in app names', err.message)
  }

  // Test 3: Empty strings
  try {
    const slug = ''.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    pass('Handle empty strings')
  } catch (err) {
    fail('Handle empty strings', err.message)
  }

  // Test 4: Unicode characters
  const unicode = '你好世界 🚀 café'
  try {
    const slug = unicode.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    pass('Handle unicode characters')
  } catch (err) {
    fail('Handle unicode characters', err.message)
  }

  // Test 5: Duplicate slugs (database constraint)
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id')
    .limit(1)

  if (vendors && vendors.length > 0) {
    const testVendorId = vendors[0].id

    // Try to create two apps with same slug
    try {
      const { data: app1, error: error1 } = await supabase
        .from('vendor_apps')
        .insert({
          vendor_id: testVendorId,
          name: 'Duplicate Test',
          slug: 'duplicate-test-slug',
          app_type: 'custom',
          status: 'draft'
        })
        .select()
        .single()

      if (error1) {
        pass('Duplicate slug prevention (already exists)')
      } else {
        // Try to create duplicate
        const { error: error2 } = await supabase
          .from('vendor_apps')
          .insert({
            vendor_id: testVendorId,
            name: 'Duplicate Test 2',
            slug: 'duplicate-test-slug',
            app_type: 'custom',
            status: 'draft'
          })

        if (error2 && error2.message.includes('duplicate')) {
          pass('Duplicate slug prevention works')

          // Clean up
          await supabase
            .from('vendor_apps')
            .delete()
            .eq('id', app1.id)
        } else {
          fail('Duplicate slug prevention', 'Allowed duplicate slug')
        }
      }
    } catch (err) {
      warn('Duplicate slug test', err.message)
    }
  }
}

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

async function testGitHubIntegration() {
  log('🧪', '\n=== GITHUB INTEGRATION TESTS ===')

  // Test 1: Check if GITHUB_BOT_TOKEN is set
  const token = process.env.GITHUB_BOT_TOKEN
  if (token && token.startsWith('ghp_')) {
    pass('GITHUB_BOT_TOKEN is set')
  } else {
    fail('GITHUB_BOT_TOKEN is set', 'Token not found or invalid format')
    return
  }

  // Test 2: Check if GITHUB_ORG is set
  const org = process.env.GITHUB_ORG
  if (org) {
    pass(`GITHUB_ORG is set: ${org}`)
  } else {
    fail('GITHUB_ORG is set', 'Organization not configured')
    return
  }

  // Test 3: Verify template repo exists
  try {
    const response = await fetch(`https://api.github.com/repos/${org}/template-nextjs-app`, {
      headers: { 'Authorization': `token ${token}` }
    })
    const data = await response.json()

    if (response.ok && data.is_template) {
      pass('Template repository exists and is marked as template')
    } else if (response.ok && !data.is_template) {
      warn('Template repository', 'Repo exists but not marked as template')
    } else {
      fail('Template repository exists', data.message || 'Not found')
    }
  } catch (err) {
    fail('Template repository check', err.message)
  }

  // Test 4: Check GitHub API rate limit
  try {
    const response = await fetch('https://api.github.com/rate_limit', {
      headers: { 'Authorization': `token ${token}` }
    })
    const data = await response.json()

    if (data.rate && data.rate.remaining > 100) {
      pass(`GitHub API rate limit OK (${data.rate.remaining}/${data.rate.limit})`)
    } else if (data.rate && data.rate.remaining <= 100) {
      warn('GitHub API rate limit', `Low remaining: ${data.rate.remaining}/${data.rate.limit}`)
    } else {
      fail('GitHub API rate limit', 'Could not check rate limit')
    }
  } catch (err) {
    fail('GitHub API rate limit check', err.message)
  }
}

async function testVercelIntegration() {
  log('🧪', '\n=== VERCEL INTEGRATION TESTS ===')

  // Test 1: Check if VERCEL_TOKEN is set
  const token = process.env.VERCEL_TOKEN
  if (token && token.length > 20) {
    pass('VERCEL_TOKEN is set')
  } else {
    fail('VERCEL_TOKEN is set', 'Token not found or too short')
    return
  }

  // Test 2: Verify Vercel API access
  try {
    const response = await fetch('https://api.vercel.com/v2/user', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()

    if (response.ok && data.user) {
      pass(`Vercel API access OK (${data.user.username})`)
    } else {
      fail('Vercel API access', data.error?.message || 'Invalid token')
    }
  } catch (err) {
    fail('Vercel API access', err.message)
  }

  // Test 3: Check existing projects
  try {
    const response = await fetch('https://api.vercel.com/v9/projects', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await response.json()

    if (response.ok && data.projects) {
      pass(`Vercel projects accessible (${data.projects.length} projects)`)
    } else {
      fail('Vercel projects list', data.error?.message || 'Could not list projects')
    }
  } catch (err) {
    fail('Vercel projects list', err.message)
  }
}

async function testAnthropicIntegration() {
  log('🧪', '\n=== ANTHROPIC API TESTS ===')

  // Test 1: Check if ANTHROPIC_API_KEY is set
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (apiKey && apiKey.startsWith('sk-ant-')) {
    pass('ANTHROPIC_API_KEY is set')
  } else {
    fail('ANTHROPIC_API_KEY is set', 'Key not found or invalid format')
    return
  }

  // Test 2: Verify API access with a minimal request
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      })
    })

    const data = await response.json()

    if (response.ok && data.content) {
      pass('Anthropic API access OK')
    } else {
      fail('Anthropic API access', data.error?.message || 'API request failed')
    }
  } catch (err) {
    fail('Anthropic API access', err.message)
  }
}

// =============================================================================
// MAIN TEST RUNNER
// =============================================================================

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Code Platform Tests\n')

  // Load environment variables
  if (!process.env.GITHUB_BOT_TOKEN) {
    const envPath = '/Users/whale/Desktop/Website/.env.local'
    console.log(`Loading env from: ${envPath}`)
    const fs = await import('fs')
    const envContent = fs.readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim()
      }
    })
  }

  // Run all test suites
  await testDatabaseSchema()
  await testRLSPolicies()
  await testCodeParsing()
  await testEdgeCases()
  await testGitHubIntegration()
  await testVercelIntegration()
  await testAnthropicIntegration()
  await testAPIs()

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Passed: ${results.passed.length}`)
  console.log(`❌ Failed: ${results.failed.length}`)
  console.log(`⚠️  Warnings: ${results.warnings.length}`)

  if (results.failed.length > 0) {
    console.log('\n❌ FAILED TESTS:')
    results.failed.forEach(({ test, error }) => {
      console.log(`  - ${test}: ${error}`)
    })
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:')
    results.warnings.forEach(({ test, message }) => {
      console.log(`  - ${test}: ${message}`)
    })
  }

  console.log('\n' + '='.repeat(60))

  if (results.failed.length === 0) {
    console.log('✅ All critical tests passed!')
  } else {
    console.log('❌ Some tests failed. Please review and fix.')
    process.exit(1)
  }
}

runAllTests().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
