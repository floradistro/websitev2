#!/usr/bin/env node

/**
 * Manually deploy an app that failed initial deployment
 */

import { createClient } from '@supabase/supabase-js'
import { Octokit } from '@octokit/rest'
import fs from 'fs'

// Load env vars
const envPath = '/Users/whale/Desktop/Website/.env.local'
const envContent = fs.readFileSync(envPath, 'utf-8')
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    process.env[key.trim()] = valueParts.join('=').trim()
  }
})

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const GITHUB_TOKEN = process.env.GITHUB_BOT_TOKEN
const GITHUB_ORG = process.env.GITHUB_ORG
const VERCEL_TOKEN = process.env.VERCEL_TOKEN

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const octokit = new Octokit({ auth: GITHUB_TOKEN })

const APP_ID = 'dd4e23d0-1f85-4855-bdc5-be4e807566c1'

async function deployApp() {
  console.log('🚀 Starting manual deployment...\n')

  // Step 1: Get app details
  console.log('📋 Step 1: Getting app details...')
  const { data: app, error: appError } = await supabase
    .from('vendor_apps')
    .select('*, vendors(slug, store_name)')
    .eq('id', APP_ID)
    .single()

  if (appError || !app) {
    console.error('❌ App not found:', appError)
    process.exit(1)
  }

  console.log(`✅ Found app: ${app.name}`)
  console.log(`   Vendor: ${app.vendors.store_name}`)
  console.log(`   Type: ${app.app_type}`)
  console.log(`   Current status: ${app.status}`)

  // Step 2: Create GitHub repo
  console.log('\n📋 Step 2: Creating GitHub repository...')

  const repoName = `${app.vendors.slug}-${app.slug}`
  console.log(`   Repo name: ${repoName}`)

  let repo
  try {
    const { data: repoData } = await octokit.repos.createUsingTemplate({
      template_owner: GITHUB_ORG,
      template_repo: 'template-nextjs-app',
      owner: GITHUB_ORG,
      name: repoName,
      description: `${app.name} - ${app.app_type} for ${app.vendors.store_name}`,
      private: true,
      include_all_branches: false
    })
    repo = repoData
    console.log(`✅ GitHub repo created: ${repo.html_url}`)
  } catch (error) {
    // Check if repo already exists
    try {
      const { data: existingRepo } = await octokit.repos.get({
        owner: GITHUB_ORG,
        repo: repoName
      })
      repo = existingRepo
      console.log(`✅ Using existing repo: ${repo.html_url}`)
    } catch (e) {
      console.error('❌ Failed to create/find GitHub repo:', error.message)
      process.exit(1)
    }
  }

  // Step 3: Create Vercel project
  console.log('\n📋 Step 3: Creating Vercel project...')

  let deploymentUrl
  try {
    const vercelResponse = await fetch('https://api.vercel.com/v9/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: repoName,
        gitRepository: {
          type: 'github',
          repo: repo.full_name
        },
        framework: 'nextjs',
        environmentVariables: [
          { key: 'VENDOR_ID', value: app.vendor_id, type: 'plain', target: ['production', 'preview'] },
          { key: 'NEXT_PUBLIC_SUPABASE_URL', value: SUPABASE_URL, type: 'plain', target: ['production', 'preview'] },
          { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, type: 'plain', target: ['production', 'preview'] },
          { key: 'APP_TYPE', value: app.app_type, type: 'plain', target: ['production', 'preview'] }
        ]
      })
    })

    const vercelData = await vercelResponse.json()

    if (vercelResponse.ok) {
      deploymentUrl = `https://${vercelData.name}.vercel.app`
      console.log(`✅ Vercel project created: ${deploymentUrl}`)
    } else {
      console.error('❌ Vercel error:', vercelData.error?.message || JSON.stringify(vercelData))

      // If project exists, get its URL
      if (vercelData.error?.code === 'project_already_exists') {
        const projectResponse = await fetch(`https://api.vercel.com/v9/projects/${repoName}`, {
          headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}` }
        })
        const projectData = await projectResponse.json()
        if (projectResponse.ok) {
          deploymentUrl = `https://${projectData.name}.vercel.app`
          console.log(`✅ Using existing Vercel project: ${deploymentUrl}`)
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to create Vercel project:', error.message)
  }

  // Step 4: Update database
  console.log('\n📋 Step 4: Updating database...')

  const { error: updateError } = await supabase
    .from('vendor_apps')
    .update({
      github_repo: repo.full_name,
      deployment_url: deploymentUrl,
      status: deploymentUrl ? 'deployed' : 'draft'
    })
    .eq('id', APP_ID)

  if (updateError) {
    console.error('❌ Failed to update database:', updateError)
  } else {
    console.log('✅ Database updated')
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 DEPLOYMENT SUMMARY')
  console.log('='.repeat(60))
  console.log(`App: ${app.name}`)
  console.log(`GitHub: ${repo.html_url}`)
  console.log(`Vercel: ${deploymentUrl || 'Not deployed'}`)
  console.log(`Status: ${deploymentUrl ? 'deployed' : 'draft'}`)
  console.log('='.repeat(60))

  if (deploymentUrl) {
    console.log('\n✅ Deployment successful!')
    console.log(`\n🌐 Visit your app: ${deploymentUrl}`)
    console.log('\n⏳ Note: First deployment takes 30-60 seconds. Refresh the page in the browser.')
  } else {
    console.log('\n⚠️  Deployment partially successful (GitHub repo created, Vercel deployment may need manual setup)')
  }
}

deployApp().catch(err => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
