import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/vendor/apps/[appId]
export async function GET(
  request: NextRequest,
  { params }: { params: { appId: string } }
) {
  try {
    const supabase = await createClient()

    const { data: app, error } = await supabase
      .from('vendor_apps')
      .select('*')
      .eq('id', params.appId)
      .single()

    if (error) {
      console.error('Error fetching app:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, app })
  } catch (error: any) {
    console.error('Error in GET /api/vendor/apps/[appId]:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// DELETE /api/vendor/apps/[appId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { appId: string } }
) {
  try {
    const supabase = await createClient()

    // Soft delete - just mark as inactive
    const { error } = await supabase
      .from('vendor_apps')
      .update({ is_active: false })
      .eq('id', params.appId)

    if (error) {
      console.error('Error deleting app:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // TODO: Archive GitHub repo
    // TODO: Delete/archive Vercel deployment

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/vendor/apps/[appId]:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
