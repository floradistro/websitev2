import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

// POST /api/vendor/ai-edit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { appId, vendorId, instruction, conversationHistory } = body

    if (!appId || !vendorId || !instruction) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get app details
    const { data: app, error: appError } = await supabase
      .from('vendor_apps')
      .select('*')
      .eq('id', appId)
      .eq('vendor_id', vendorId)
      .single()

    if (appError || !app) {
      return NextResponse.json({ success: false, error: 'App not found' }, { status: 404 })
    }

    // TODO: Get current app files from GitHub repo
    // For now, we'll use a placeholder

    // Build conversation context
    const messages = [
      ...(conversationHistory || []).slice(-6), // Last 6 messages for context
      {
        role: 'user' as const,
        content: instruction
      }
    ]

    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: `You are an expert full-stack developer helping build a ${app.app_type} application.

The app is called "${app.name}" and is described as: ${app.description || 'A custom application'}.

This app is connected to a cannabis platform backend with the following APIs available:
- /api/products - Get products for this vendor
- /api/orders - Get orders for this vendor
- /api/customers - Get customers for this vendor
- /api/inventory - Get inventory data
- /api/analytics - Get analytics data

The tech stack is:
- Next.js 15 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Supabase for backend

When you provide code:
1. Use modern React patterns (hooks, server components when appropriate)
2. Make it production-ready with proper error handling
3. Use Tailwind for styling
4. Follow Next.js 15 best practices
5. Keep responses concise and actionable

Respond with the code changes needed and explain what you're doing.`,
      messages
    })

    // Extract response
    const assistantMessage = response.content[0].type === 'text' ? response.content[0].text : ''

    // TODO: Parse code blocks from response
    // TODO: Commit changes to GitHub repo via GitHub API
    // TODO: Track which files were changed

    const filesChanged = ['app/page.tsx'] // Placeholder

    // Log AI usage
    await supabase.from('vendor_ai_usage').insert({
      vendor_id: vendorId,
      app_id: appId,
      model: 'claude-sonnet-4-20250514',
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      cost_usd: calculateCost(response.usage.input_tokens, response.usage.output_tokens),
      instruction
    })

    return NextResponse.json({
      success: true,
      message: assistantMessage,
      filesChanged
    })
  } catch (error: any) {
    console.error('Error in POST /api/vendor/ai-edit:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process AI request'
    }, { status: 500 })
  }
}

function calculateCost(inputTokens: number, outputTokens: number): number {
  // Claude Sonnet 4.5 pricing (as of 2025)
  const INPUT_COST_PER_1M = 3.0
  const OUTPUT_COST_PER_1M = 15.0

  const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_1M
  const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_1M

  return inputCost + outputCost
}
