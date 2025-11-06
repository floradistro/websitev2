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

    // Create starter files for instant preview
    try {
      const starterFiles = [
        {
          filepath: 'app/page.tsx',
          content: `export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to ${name}
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Your ${app_type} is ready to customize!
        </p>
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
          <p className="text-gray-700 mb-4">
            This is your starter template. Start editing to make it your own.
          </p>
          <div className="flex gap-4 justify-center">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Get Started
            </button>
            <button className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}`,
          file_type: 'tsx'
        },
        {
          filepath: 'app/layout.tsx',
          content: `export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`,
          file_type: 'tsx'
        }
      ]

      const fileInserts = starterFiles.map(file => ({
        app_id: app.id,
        filepath: file.filepath,
        content: file.content,
        file_type: file.file_type
      }))

      const { error: filesError } = await supabase
        .from('app_files')
        .insert(fileInserts)

      if (filesError) {
        console.error('Error creating starter files:', filesError)
        // Don't fail the whole request, just log the error
      } else {
        console.log(`Created ${starterFiles.length} starter files for app ${app.id}`)
      }
    } catch (fileError: any) {
      console.error('Unexpected error creating starter files:', fileError)
      // Don't fail the whole request
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
      // TODO: This needs vendorAccessToken and vendorUsername
      const repo = await createRepositoryFromTemplate({
        vendorAccessToken: '', // TODO: Get from vendor OAuth
        vendorUsername: vendor.slug,
        name: repoName,
        description: `${name} - ${app_type} for ${vendor.store_name}`,
        // templateRepo, // TODO: Add to interface if needed
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
