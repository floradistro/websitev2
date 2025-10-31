import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/vendor/apps/active
 *
 * Returns all recently active apps for file sync daemon
 * Apps are considered active if they've had activity in the last hour
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get all apps that have been active in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { data: apps, error } = await supabase
      .from('vendor_apps')
      .select('id, name, app_type, updated_at')
      .gte('updated_at', oneHourAgo)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching active apps:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      apps: apps || [],
      count: apps?.length || 0
    })

  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch active apps'
    }, { status: 500 })
  }
}
