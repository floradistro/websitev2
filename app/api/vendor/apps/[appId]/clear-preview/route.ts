import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * POST /api/vendor/apps/[appId]/clear-preview
 *
 * Force clears preview info for an app
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const { appId } = await params
    const supabase = createServiceClient(SUPABASE_URL, SERVICE_ROLE_KEY)

    console.log(`🔄 Clearing preview info for app: ${appId}`)

    const { data, error } = await supabase
      .from('vendor_apps')
      .update({
        preview_url: null,
        preview_machine_id: null,
        preview_status: null,
        preview_last_activity: null
      })
      .eq('id', appId)
      .select()

    if (error) {
      console.error('❌ Error clearing preview:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    console.log(`✅ Cleared preview info:`, data)

    return NextResponse.json({
      success: true,
      message: 'Preview info cleared',
      data
    })

  } catch (error: any) {
    console.error('❌ Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to clear preview'
    }, { status: 500 })
  }
}
