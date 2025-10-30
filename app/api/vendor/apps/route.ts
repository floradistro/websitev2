import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/vendor/apps?vendorId=xxx
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const vendorId = searchParams.get('vendorId')

  if (!vendorId) {
    return NextResponse.json({ success: false, error: 'Missing vendorId' }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    const { data: apps, error } = await supabase
      .from('vendor_apps')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching apps:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, apps })
  } catch (error: any) {
    console.error('Error in GET /api/vendor/apps:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST /api/vendor/apps
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vendorId, name, description, app_type } = body

    if (!vendorId || !name || !app_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Create slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    // Create app record
    const { data: app, error } = await supabase
      .from('vendor_apps')
      .insert({
        vendor_id: vendorId,
        name,
        slug,
        app_type,
        description: description || null,
        status: 'draft'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating app:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // TODO: Create GitHub repo for this app
    // TODO: Initialize with template based on app_type
    // For now, we'll just return the app record

    return NextResponse.json({ success: true, app })
  } catch (error: any) {
    console.error('Error in POST /api/vendor/apps:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
