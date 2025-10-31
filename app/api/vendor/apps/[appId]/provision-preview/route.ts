import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const FLY_API_TOKEN = process.env.FLY_API_TOKEN!
const FLY_APP_NAME = process.env.FLY_APP_NAME || 'whaletools-preview-runtime'
const API_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const API_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * POST /api/vendor/apps/[appId]/provision-preview
 *
 * Provisions a new Fly.io machine for instant preview
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const { appId } = await params
    const supabase = await createClient()

    // Get app details
    const { data: app, error: appError } = await supabase
      .from('vendor_apps')
      .select('*')
      .eq('id', appId)
      .single()

    if (appError || !app) {
      return NextResponse.json({ success: false, error: 'App not found' }, { status: 404 })
    }

    // Check if preview app already exists
    if (app.preview_machine_id && app.preview_url) {
      console.log(`✓ Preview app already exists: ${app.preview_machine_id}`)
      return NextResponse.json({
        success: true,
        previewUrl: app.preview_url,
        appName: app.preview_machine_id,
        status: app.preview_status,
        message: 'Preview app already provisioned'
      })
    }

    console.log(`🚀 Provisioning preview environment for app: ${app.name}`)

    // Create unique Fly.io App name
    const flyAppName = `preview-${appId.substring(0, 12).replace(/-/g, '')}`

    console.log(`📡 Step 1: Creating or verifying Fly.io App: ${flyAppName}`)

    // Step 1: Create a new Fly.io App (or use existing)
    const createAppResponse = await fetch(
      'https://api.machines.dev/v1/apps',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FLY_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          app_name: flyAppName,
          org_slug: 'personal' // or your org slug
        })
      }
    )

    // Check if app already exists (422 = already taken)
    if (!createAppResponse.ok) {
      const errorText = await createAppResponse.text()

      // If app already exists, that's okay - we'll reuse it
      if (createAppResponse.status === 422 && errorText.includes('already been taken')) {
        console.log(`ℹ️  Fly.io app already exists: ${flyAppName}, will reuse it`)
      } else {
        console.error('❌ Failed to create Fly.io app:', createAppResponse.status, errorText)
        throw new Error(`Failed to create app: ${createAppResponse.status} ${errorText}`)
      }
    } else {
      const flyApp = await createAppResponse.json()
      console.log(`✅ Fly.io app created: ${flyApp.name}`)
    }

    // Step 2: Get base runtime image
    console.log(`📡 Step 2: Getting base runtime image...`)

    const baseMachinesResponse = await fetch(
      `https://api.machines.dev/v1/apps/${FLY_APP_NAME}/machines`,
      {
        headers: {
          'Authorization': `Bearer ${FLY_API_TOKEN}`
        }
      }
    )

    if (!baseMachinesResponse.ok) {
      throw new Error(`Failed to get base machines: ${baseMachinesResponse.status}`)
    }

    const baseMachines = await baseMachinesResponse.json()
    const baseImage = baseMachines[0]?.config?.image

    if (!baseImage) {
      throw new Error('No base image found')
    }

    console.log(`✓ Using base image: ${baseImage}`)

    // Step 3: Deploy machine to the new app
    console.log(`📡 Step 3: Deploying machine to ${flyAppName}...`)

    const machineConfig = {
      config: {
        image: baseImage,
        env: {
          APP_ID: appId,
          API_URL: API_URL,
          API_KEY: API_KEY,
          NODE_ENV: 'development'
        },
        services: [
          {
            ports: [
              { port: 80, handlers: ['http'] },
              { port: 443, handlers: ['tls', 'http'] }
            ],
            protocol: 'tcp',
            internal_port: 3000
          }
        ],
        auto_destroy: false,
        restart: { policy: 'on-failure' },
        guest: {
          cpu_kind: 'shared',
          cpus: 1,
          memory_mb: 512
        }
      }
    }

    const deployResponse = await fetch(
      `https://api.machines.dev/v1/apps/${flyAppName}/machines`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FLY_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(machineConfig)
      }
    )

    if (!deployResponse.ok) {
      const errorText = await deployResponse.text()
      console.error('❌ Failed to deploy machine:', errorText)
      throw new Error(`Failed to deploy: ${deployResponse.status}`)
    }

    const machine = await deployResponse.json()
    console.log(`✅ Machine deployed: ${machine.id}`)

    // Wait for machine to start
    console.log(`⏳ Waiting for machine to start...`)
    let attempts = 0
    while (attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const statusResponse = await fetch(
        `https://api.machines.dev/v1/apps/${flyAppName}/machines/${machine.id}`,
        {
          headers: { 'Authorization': `Bearer ${FLY_API_TOKEN}` }
        }
      )

      if (statusResponse.ok) {
        const status = await statusResponse.json()
        if (status.state === 'started') {
          console.log(`✅ Machine is running!`)
          break
        }
      }
      attempts++
    }

    // Construct preview URL
    const previewUrl = `https://${flyAppName}.fly.dev`
    console.log(`🎉 Preview URL: ${previewUrl}`)

    // Update database
    const { error: updateError } = await supabase
      .from('vendor_apps')
      .update({
        preview_machine_id: flyAppName, // Store app name, not machine ID
        preview_url: previewUrl,
        preview_status: 'running',
        preview_last_activity: new Date().toISOString()
      })
      .eq('id', appId)

    if (updateError) {
      console.error('❌ Database update error:', updateError)
      throw new Error('Failed to update database')
    }

    console.log(`🎉 Preview app provisioned successfully!`)

    return NextResponse.json({
      success: true,
      previewUrl,
      flyAppName,
      machineId: machine.id,
      status: 'running',
      message: 'Preview environment provisioned successfully'
    })

  } catch (error: any) {
    console.error('❌ Error provisioning preview:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to provision preview'
    }, { status: 500 })
  }
}
