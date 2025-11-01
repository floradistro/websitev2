import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// GET /api/vendor/apps/[appId]/files - Get all files for an app
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const { appId } = await params

    // Check if request has API key (for file-sync-daemon)
    const authHeader = request.headers.get('authorization')
    const apiKey = authHeader?.replace('Bearer ', '')

    // Use service role client if API key provided (bypass RLS)
    const supabase = apiKey === SERVICE_ROLE_KEY
      ? createServiceClient(SUPABASE_URL, SERVICE_ROLE_KEY)
      : await createClient()

    const { data: files, error } = await supabase
      .from('app_files')
      .select('*')
      .eq('app_id', appId)
      .order('path')

    if (error) {
      console.error('Error fetching files:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      files: files || []
    })

  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch files'
    }, { status: 500 })
  }
}

// PUT /api/vendor/apps/[appId]/files - Upsert files
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const { appId } = await params
    const body = await request.json()
    const { files } = body as { files: Array<{ path: string; content: string }> }

    if (!files || !Array.isArray(files)) {
      return NextResponse.json(
        { success: false, error: 'Invalid files array' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify app exists and user has access
    const { data: app, error: appError } = await supabase
      .from('vendor_apps')
      .select('id')
      .eq('id', appId)
      .single()

    if (appError || !app) {
      return NextResponse.json({ success: false, error: 'App not found' }, { status: 404 })
    }

    // Upsert files
    const fileRecords = files.map(file => ({
      app_id: appId,
      path: file.path,
      content: file.content,
      type: file.path?.split('.').pop() || 'text'
    }))

    const { error: upsertError } = await supabase
      .from('app_files')
      .upsert(fileRecords, {
        onConflict: 'app_id,path'
      })

    if (upsertError) {
      console.error('Error upserting files:', upsertError)
      return NextResponse.json({ success: false, error: upsertError.message }, { status: 500 })
    }

    // Push files to preview runtime for instant updates
    try {
      const pushResponse = await fetch('https://whaletools-preview-runtime.fly.dev/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId, files })
      })

      if (!pushResponse.ok) {
        console.warn('Failed to push to preview runtime:', await pushResponse.text())
      } else {
        console.log('✅ Pushed files to preview runtime')
      }
    } catch (pushError: any) {
      console.warn('Preview push failed (non-critical):', pushError.message)
    }

    return NextResponse.json({
      success: true,
      filesUpdated: files.length
    })

  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update files'
    }, { status: 500 })
  }
}
