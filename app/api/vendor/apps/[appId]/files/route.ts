import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/vendor/apps/[appId]/files - Get all files for an app
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const { appId } = await params
    const supabase = await createClient()

    const { data: files, error } = await supabase
      .from('app_files')
      .select('*')
      .eq('app_id', appId)
      .order('filepath')

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
    const { files } = body as { files: Array<{ filepath: string; content: string }> }

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
      filepath: file.filepath,
      content: file.content,
      file_type: file.filepath.split('.').pop() || 'unknown'
    }))

    const { error: upsertError } = await supabase
      .from('app_files')
      .upsert(fileRecords, {
        onConflict: 'app_id,filepath'
      })

    if (upsertError) {
      console.error('Error upserting files:', upsertError)
      return NextResponse.json({ success: false, error: upsertError.message }, { status: 500 })
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
