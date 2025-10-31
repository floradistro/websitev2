import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/vendor/apps/[appId]/files-timestamp - Get last modified timestamp of files
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const { appId } = await params
    const supabase = await createClient()

    // Get the most recent file update timestamp
    const { data: files, error } = await supabase
      .from('app_files')
      .select('updated_at')
      .eq('app_id', appId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No files found
        return NextResponse.json({
          success: true,
          lastModified: null
        })
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      lastModified: files?.updated_at || null
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch timestamp'
    }, { status: 500 })
  }
}
