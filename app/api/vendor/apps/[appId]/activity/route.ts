import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/vendor/apps/[appId]/activity
 *
 * Updates the last activity timestamp for a preview machine
 * This prevents it from auto-sleeping
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const { appId } = await params
    const supabase = await createClient()

    await supabase
      .from('vendor_apps')
      .update({ preview_last_activity: new Date().toISOString() })
      .eq('id', appId)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
