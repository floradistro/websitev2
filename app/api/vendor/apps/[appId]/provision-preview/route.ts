import { NextRequest, NextResponse } from 'next/server'

const PREVIEW_BASE_URL = 'https://whaletools-preview-runtime.fly.dev'

/**
 * POST /api/vendor/apps/[appId]/provision-preview
 *
 * Returns the multi-tenant preview URL (no actual provisioning needed)
 *
 * SIMPLIFIED: We now use a multi-tenant architecture where all apps
 * share one Fly.io runtime. No need to provision individual machines!
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  try {
    const { appId } = await params

    console.log(`🚀 Using multi-tenant preview for app: ${appId}`)

    // Construct multi-tenant preview URL with appId as query param
    const previewUrl = `${PREVIEW_BASE_URL}?appId=${appId}`

    console.log(`✅ Preview URL: ${previewUrl}`)

    return NextResponse.json({
      success: true,
      previewUrl,
      status: 'running',
      message: 'Preview environment ready (multi-tenant)'
    })

  } catch (error: any) {
    console.error('❌ Error getting preview URL:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get preview URL'
    }, { status: 500 })
  }
}
