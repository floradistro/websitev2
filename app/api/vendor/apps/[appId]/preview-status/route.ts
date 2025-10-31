import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/vendor/apps/[appId]/preview-status - Check if files have been updated
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const { appId } = await params
    const supabase = await createClient()

    // Get latest file update timestamp
    const { data: files, error } = await supabase
      .from('app_files')
      .select('updated_at')
      .eq('app_id', appId)
      .order('updated_at', { ascending: false })
      .limit(1)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const latestUpdate = files && files.length > 0
      ? new Date(files[0].updated_at).getTime()
      : 0

    return NextResponse.json({
      success: true,
      lastUpdate: latestUpdate
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
