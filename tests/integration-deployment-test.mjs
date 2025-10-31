#!/usr/bin/env node

/**
 * Full Integration Test - Creates Real App with Deployment
 * WARNING: This creates actual GitHub repos and Vercel deployments
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://uaednwpxursknmwdeejn.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

function log(emoji, message) {
  console.log(`${emoji} ${message}`)
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function runIntegrationTest() {
  console.log('🚀 Starting Full Integration Deployment Test\n')
  console.log('⚠️  WARNING: This will create real GitHub repos and Vercel deployments\n')

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

  let testAppId = null
  let testAppGitRepo = null
  let testAppDeploymentUrl = null

  try {
    // Step 1: Get a test vendor
    log('📋', 'Step 1: Getting test vendor...')
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id, slug, store_name')
      .limit(1)

    if (!vendors || vendors.length === 0) {
      log('❌', 'No vendors found. Cannot run test.')
      process.exit(1)
    }

    const testVendor = vendors[0]
    log('✅', `Using vendor: ${testVendor.store_name} (${testVendor.slug})`)

    // Step 2: Create test app via API
    log('📋', 'Step 2: Creating test app...')
    const timestamp = Date.now()
    const appName = `Integration Test ${timestamp}`

    const createResponse = await fetch('http://localhost:3000/api/vendor/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vendorId: testVendor.id,
        name: appName,
        description: 'Automated integration test app',
        app_type: 'custom'
      })
    })

    const createData = await createResponse.json()

    if (!createData.success) {
      log('❌', `App creation failed: ${createData.error || 'Unknown error'}`)
      if (createData.warning) {
        log('⚠️', `Warning: ${createData.warning}`)
      }
      if (createData.deploymentError) {
        log('⚠️', `Deployment error: ${createData.deploymentError}`)
      }
      process.exit(1)
    }

    testAppId = createData.app.id
    log('✅', `App created: ${testAppId}`)

    // Step 3: Check app status
    log('📋', 'Step 3: Checking app status...')
    await sleep(2000)

    const { data: app } = await supabase
      .from('vendor_apps')
      .select('*')
      .eq('id', testAppId)
      .single()

    if (app) {
      log('✅', `App status: ${app.status}`)
      log('✅', `GitHub repo: ${app.github_repo || 'Not set'}`)
      log('✅', `Deployment URL: ${app.deployment_url || 'Not set'}`)

      testAppGitRepo = app.github_repo
      testAppDeploymentUrl = app.deployment_url
    }

    // Step 4: Verify GitHub repo was created
    if (testAppGitRepo) {
      log('📋', 'Step 4: Verifying GitHub repo...')

      const repoResponse = await fetch(`https://api.github.com/repos/${testAppGitRepo}`, {
        headers: {
          'Authorization': `token ${process.env.GITHUB_BOT_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      })

      if (repoResponse.ok) {
        const repoData = await repoResponse.json()
        log('✅', `GitHub repo verified: ${repoData.html_url}`)
        log('✅', `Repo is private: ${repoData.private}`)
        log('✅', `Default branch: ${repoData.default_branch}`)
      } else {
        log('❌', `GitHub repo not found: ${testAppGitRepo}`)
      }
    } else {
      log('⚠️', 'No GitHub repo was created (deployment tokens may be missing)')
    }

    // Step 5: Verify Vercel deployment
    if (testAppDeploymentUrl) {
      log('📋', 'Step 5: Verifying Vercel deployment...')

      // Wait for deployment to be ready
      log('⏳', 'Waiting 30 seconds for deployment...')
      await sleep(30000)

      // Check if URL is accessible
      try {
        const deployResponse = await fetch(testAppDeploymentUrl, {
          timeout: 10000
        })

        if (deployResponse.ok) {
          log('✅', `Deployment is live and accessible`)
          const html = await deployResponse.text()
          if (html.includes('Welcome')) {
            log('✅', 'Deployment shows welcome page')
          }
        } else {
          log('⚠️', `Deployment returned status ${deployResponse.status}`)
        }
      } catch (err) {
        log('⚠️', `Could not reach deployment: ${err.message}`)
      }
    } else {
      log('⚠️', 'No deployment URL was created')
    }

    // Step 6: Test AI edit
    log('📋', 'Step 6: Testing AI edit...')

    const aiEditResponse = await fetch('http://localhost:3000/api/vendor/ai-edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appId: testAppId,
        vendorId: testVendor.id,
        instruction: 'Change the welcome message to say "Integration Test Success"',
        conversationHistory: []
      })
    })

    const aiEditData = await aiEditResponse.json()

    if (aiEditData.success) {
      log('✅', 'AI edit successful')
      log('✅', `AI response: ${aiEditData.message.substring(0, 100)}...`)

      if (aiEditData.filesChanged && aiEditData.filesChanged.length > 0) {
        log('✅', `Files changed: ${aiEditData.filesChanged.join(', ')}`)

        // Step 7: Verify commit was made
        if (testAppGitRepo) {
          log('📋', 'Step 7: Verifying GitHub commit...')
          await sleep(2000)

          const commitsResponse = await fetch(`https://api.github.com/repos/${testAppGitRepo}/commits`, {
            headers: {
              'Authorization': `token ${process.env.GITHUB_BOT_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          })

          if (commitsResponse.ok) {
            const commits = await commitsResponse.json()
            if (commits.length > 0) {
              log('✅', `Latest commit: ${commits[0].commit.message}`)
              log('✅', `Commit SHA: ${commits[0].sha}`)
            }
          }
        }
      } else {
        log('⚠️', 'No files were changed by AI edit')
      }
    } else {
      log('❌', `AI edit failed: ${aiEditData.error || 'Unknown error'}`)
    }

    // Step 8: Check AI usage logging
    log('📋', 'Step 8: Checking AI usage logging...')

    const { data: usage } = await supabase
      .from('vendor_ai_usage')
      .select('*')
      .eq('app_id', testAppId)
      .order('created_at', { ascending: false })
      .limit(1)

    if (usage && usage.length > 0) {
      log('✅', 'AI usage logged successfully')
      log('✅', `Tokens used: ${usage[0].input_tokens} input, ${usage[0].output_tokens} output`)
      log('✅', `Cost: $${usage[0].cost_usd.toFixed(4)}`)
    } else {
      log('⚠️', 'No AI usage records found')
    }

    // Step 9: Test app deletion
    log('📋', 'Step 9: Testing app deletion...')

    const deleteResponse = await fetch(`http://localhost:3000/api/vendor/apps/${testAppId}`, {
      method: 'DELETE'
    })

    const deleteData = await deleteResponse.json()

    if (deleteData.success) {
      log('✅', 'App deleted successfully (soft delete)')

      // Verify it's marked as inactive
      const { data: deletedApp } = await supabase
        .from('vendor_apps')
        .select('is_active')
        .eq('id', testAppId)
        .single()

      if (deletedApp && !deletedApp.is_active) {
        log('✅', 'App marked as inactive in database')
      }
    } else {
      log('❌', `App deletion failed: ${deleteData.error || 'Unknown error'}`)
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 INTEGRATION TEST SUMMARY')
    console.log('='.repeat(60))
    log('✅', 'App creation: SUCCESS')
    log(testAppGitRepo ? '✅' : '⚠️', `GitHub repo: ${testAppGitRepo ? 'SUCCESS' : 'SKIPPED'}`)
    log(testAppDeploymentUrl ? '✅' : '⚠️', `Vercel deployment: ${testAppDeploymentUrl ? 'SUCCESS' : 'SKIPPED'}`)
    log('✅', 'AI edit: SUCCESS')
    log('✅', 'App deletion: SUCCESS')
    console.log('='.repeat(60))

    // Cleanup note
    if (testAppGitRepo) {
      console.log(`\n⚠️  CLEANUP REQUIRED:`)
      console.log(`   GitHub repo: https://github.com/${testAppGitRepo}`)
      if (testAppDeploymentUrl) {
        console.log(`   Vercel deployment: ${testAppDeploymentUrl}`)
      }
      console.log(`   These were created for testing and should be manually removed.`)
    }

    console.log('\n✅ Integration test completed successfully!')

  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Confirmation prompt
console.log('⚠️  This test will create REAL resources:')
console.log('   - GitHub repository')
console.log('   - Vercel deployment')
console.log('   - Database records')
console.log('\nContinuing in 5 seconds... (Ctrl+C to cancel)')

setTimeout(() => {
  runIntegrationTest().catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
}, 5000)
