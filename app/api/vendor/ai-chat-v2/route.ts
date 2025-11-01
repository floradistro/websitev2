/**
 * AI Code Feature V2 - Chat API with SSE Streaming
 * Uses new architecture with parallel tools, timeouts, and session management
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireVendor } from '@/lib/auth/middleware'
import { withErrorHandler } from '@/lib/api-handler'
import { aiOrchestrator } from '@/lib/ai/orchestrator'
import { sessionManager } from '@/lib/ai/session-manager'
import type { WSMessage } from '@/lib/ai/orchestrator'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max

/**
 * POST /api/vendor/ai-chat-v2
 * Send a message and stream the AI response using SSE
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { message, appId, sessionId } = body

    if (!message || !appId) {
      return NextResponse.json(
        { error: 'Missing required fields: message, appId' },
        { status: 400 }
      )
    }

    // Get vendor ID from header (matching V1 pattern)
    const vendorId = request.headers.get('x-vendor-id')

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Verify app ownership
    const { getServiceSupabase } = await import('@/lib/supabase/client')
    const supabase = getServiceSupabase()

    const { data: app, error: appError } = await supabase
      .from('vendor_apps')
      .select('id, name')
      .eq('id', appId)
      .eq('vendor_id', vendorId)
      .single()

    if (appError || !app) {
      return NextResponse.json(
        { error: 'App not found or access denied' },
        { status: 404 }
      )
    }

    // Generate session ID if not provided
    const finalSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create SSE stream
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const sendUpdate = (update: WSMessage) => {
          try {
            const data = `data: ${JSON.stringify(update)}\n\n`
            controller.enqueue(encoder.encode(data))
          } catch (error) {
            console.error('Error sending SSE update:', error)
          }
        }

        try {
          // Send initial connection message
          sendUpdate({
            type: 'connection_established',
            data: { sessionId: finalSessionId, appId: app.id },
            timestamp: Date.now()
          })

          // Process message through orchestrator
          await aiOrchestrator.sendMessage(
            finalSessionId,
            appId,
            vendorId,
            message,
            sendUpdate
          )

          // Send completion message
          sendUpdate({
            type: 'message_complete',
            timestamp: Date.now()
          })
        } catch (error: any) {
          console.error('❌ AI chat error:', error)

          sendUpdate({
            type: 'error',
            data: {
              message: error.message || 'An error occurred',
              code: error.code
            },
            timestamp: Date.now()
          })
        } finally {
          controller.close()
        }
      },
      cancel() {
        console.log('Client disconnected - cancelling operation')
        aiOrchestrator.cancel()
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no' // Disable nginx buffering
      }
    })
  } catch (error: any) {
    console.error('❌ API error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
})

/**
 * GET /api/vendor/ai-chat-v2?sessionId=xxx
 * Get session history (for resume/debugging)
 */
export const GET = withErrorHandler(async (request: NextRequest) => {
  try {
    const vendorId = request.headers.get('x-vendor-id')

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId parameter' },
        { status: 400 }
      )
    }

    // Get session
    const session = await sessionManager.getSession(sessionId)

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Verify vendor owns the app
    if (session.vendorId !== vendorId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      session
    })
  } catch (error: any) {
    console.error('❌ Get session error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get session' },
      { status: 500 }
    )
  }
})

/**
 * DELETE /api/vendor/ai-chat-v2?sessionId=xxx
 * Clear/reset a session
 */
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  try {
    const vendorId = request.headers.get('x-vendor-id')

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId parameter' },
        { status: 400 }
      )
    }

    // Get session to verify ownership
    const session = await sessionManager.getSession(sessionId)

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Verify vendor owns the app
    if (session.vendorId !== vendorId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Delete session
    await sessionManager.deleteSession(sessionId)

    return NextResponse.json({
      success: true,
      message: 'Session cleared'
    })
  } catch (error: any) {
    console.error('❌ Delete session error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete session' },
      { status: 500 }
    )
  }
})
