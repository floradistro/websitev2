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

    // Get vendor details for repo naming
    const { data: vendor } = await supabase
      .from('vendors')
      .select('slug, store_name')
      .eq('id', vendorId)
      .single()

    if (!vendor) {
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 })
    }

    // Create app record
    const { data: app, error } = await supabase
      .from('vendor_apps')
      .insert({
        vendor_id: vendorId,
        name,
        slug,
        app_type,
        description: description || null,
        status: 'building'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating app:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Create GitHub repo and deploy to Vercel
    try {
      const { createRepositoryFromTemplate } = await import('@/lib/deployment/github')
      const { createVercelProject } = await import('@/lib/deployment/vercel')

      // Map app types to template repos
      const templateMap: Record<string, string> = {
        'storefront': 'template-storefront',
        'admin-panel': 'template-admin-panel',
        'customer-portal': 'template-customer-portal',
        'mobile': 'template-mobile',
        'dashboard': 'template-dashboard',
        'custom': 'template-nextjs-app'
      }

      const templateRepo = templateMap[app_type] || 'template-nextjs-app'
      const repoName = `${vendor.slug}-${slug}`

      // Create GitHub repository
      const repo = await createRepositoryFromTemplate({
        name: repoName,
        description: `${name} - ${app_type} for ${vendor.store_name}`,
        templateRepo,
        isPrivate: true
      })

      // Create Vercel project and deploy
      const vercelProject = await createVercelProject({
        name: repoName,
        gitRepo: repo.full_name,
        environmentVariables: {
          'VENDOR_ID': vendorId,
          'SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          'SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'APP_TYPE': app_type
        }
      })

      // Update app with deployment info
      const { data: updatedApp } = await supabase
        .from('vendor_apps')
        .update({
          github_repo: repo.full_name,
          deployment_url: vercelProject.deploymentUrl,
          status: 'deployed'
        })
        .eq('id', app.id)
        .select()
        .single()

      console.log(`App ${name} deployed to ${vercelProject.deploymentUrl}`)

      return NextResponse.json({
        success: true,
        app: updatedApp || app,
        deploymentUrl: vercelProject.deploymentUrl
      })
    } catch (deployError: any) {
      console.error('Deployment error:', deployError)

      // If deployment fails, still return app but with error message
      // Check if it's a missing token issue
      if (deployError.message?.includes('TOKEN') || deployError.message?.includes('not set')) {
        return NextResponse.json({
          success: true,
          app,
          warning: 'App created but deployment requires GitHub and Vercel tokens to be configured.',
          deploymentError: deployError.message
        })
      }

      // Update status to draft if deployment failed
      await supabase
        .from('vendor_apps')
        .update({ status: 'draft' })
        .eq('id', app.id)

      return NextResponse.json({
        success: true,
        app,
        warning: 'App created but deployment failed. You can still edit the app.',
        deploymentError: deployError.message
      })
    }
  } catch (error: any) {
    console.error('Error in POST /api/vendor/apps:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
