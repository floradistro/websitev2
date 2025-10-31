import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const FLY_API_TOKEN = process.env.FLY_API_TOKEN!
const FLY_APP_NAME = process.env.FLY_APP_NAME || 'whaletools-preview-runtime'

/**
 * POST /api/vendor/apps/[appId]/wake-preview
 *
 * Wakes up a sleeping preview machine
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

    if (!app.preview_machine_id) {
      return NextResponse.json({
        success: false,
        error: 'No preview machine provisioned'
      }, { status: 404 })
    }

    // If already running, just update activity time
    if (app.preview_status === 'running') {
      await supabase
        .from('vendor_apps')
        .update({ preview_last_activity: new Date().toISOString() })
        .eq('id', appId)

      return NextResponse.json({
        success: true,
        status: 'running',
        message: 'Machine already running'
      })
    }

    console.log(`⏰ Waking machine: ${app.preview_machine_id}`)

    // Start the machine via Fly.io API
    const response = await fetch(
      `https://api.machines.dev/v1/apps/${FLY_APP_NAME}/machines/${app.preview_machine_id}/start`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FLY_API_TOKEN}`
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Fly.io API error:', response.status, errorText)
      throw new Error(`Failed to wake machine: ${response.status}`)
    }

    // Update database
    await supabase
      .from('vendor_apps')
      .update({
        preview_status: 'running',
        preview_last_activity: new Date().toISOString()
      })
      .eq('id', appId)

    console.log(`✅ Machine woken: ${app.preview_machine_id}`)

    return NextResponse.json({
      success: true,
      status: 'running',
      message: 'Machine woken successfully'
    })

  } catch (error: any) {
    console.error('❌ Error waking machine:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to wake machine'
    }, { status: 500 })
  }
}
