import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import Exa from 'exa-js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
})

const exa = new Exa(process.env.EXASEARCH_API_KEY || process.env.EXA_API_KEY!)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// POST /api/vendor/ai-edit - Simple, clean implementation
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

    console.log('🤖 Processing:', instruction.substring(0, 100))

    // Build clean message history
    const messages: Anthropic.MessageParam[] = [
      ...(conversationHistory || []).slice(-4).map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: instruction
      }
    ]

    // Define tools
    const tools: Anthropic.Tool[] = [
      {
        name: 'web_search',
        description: 'Search the web for current information, design inspiration, examples, or documentation. Use this when the user asks you to copy or reference a specific website design, or when you need current information about best practices, libraries, or design patterns.',
        input_schema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query. Be specific about what you\'re looking for (e.g., "apple.com homepage design 2024", "react animation library comparison")'
            },
            num_results: {
              type: 'number',
              description: 'Number of results to return (1-10). Default: 3',
              default: 3
            }
          },
          required: ['query']
        }
      },
      {
        name: 'get_current_code',
        description: 'Read the current code from a file in the app repository. Use this to see what code currently exists before making changes. Common files: app/page.tsx (main page), app/layout.tsx (root layout), components/Navigation.tsx, etc.',
        input_schema: {
          type: 'object',
          properties: {
            filepath: {
              type: 'string',
              description: 'The file path relative to the repo root (e.g., "app/page.tsx", "components/Header.tsx")'
            }
          },
          required: ['filepath']
        }
      }
    ]

    // Call Anthropic API with tools
    let response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: getSystemPrompt(app),
      messages,
      tools
    })

    console.log('✓ Got initial response, stop_reason:', response.stop_reason)

    // Handle tool use - support multiple rounds
    let toolUseCount = 0
    const maxToolUses = 5

    while (response.stop_reason === 'tool_use' && toolUseCount < maxToolUses) {
      toolUseCount++
      console.log(`🔧 Tool use round ${toolUseCount}`)

      // Get all tool use blocks from the response
      const toolUseBlocks = response.content.filter(block => block.type === 'tool_use') as Anthropic.ToolUseBlock[]

      if (toolUseBlocks.length === 0) break

      // Execute all tools
      const toolResults: any[] = []

      for (const toolUseBlock of toolUseBlocks) {
        console.log(`  🔍 Tool: ${toolUseBlock.name}`)

        let toolResult: any = null

        if (toolUseBlock.name === 'web_search') {
          const { query, num_results = 3 } = toolUseBlock.input as { query: string; num_results?: number }
          console.log(`    Searching: "${query}"`)

          const searchResults = await exa.searchAndContents(query, {
            numResults: Math.min(num_results, 5),
            text: true,
            highlights: true
          })

          toolResult = {
            type: 'tool_result',
            tool_use_id: toolUseBlock.id,
            content: JSON.stringify({
              results_count: searchResults.results.length,
              results: searchResults.results.map(r => ({
                title: r.title,
                url: r.url,
                text: r.text?.substring(0, 1000),
                highlights: r.highlights
              }))
            })
          }

          console.log(`    ✓ Found ${searchResults.results.length} results`)

        } else if (toolUseBlock.name === 'get_current_code') {
          const { filepath } = toolUseBlock.input as { filepath: string }
          console.log(`    Reading: ${filepath}`)

          // TODO: GitHub integration needs vendor access token
          // const { getFileContent } = await import('@/lib/deployment/github')
          // const [owner, repo] = app.github_repo.split('/')
          // const fileContent = await getFileContent(vendorAccessToken, owner, repo, filepath)

          // For now, return error - files should be in database
          toolResult = {
            type: 'tool_result',
            tool_use_id: toolUseBlock.id,
            content: JSON.stringify({
              filepath,
              error: 'GitHub integration disabled - files must be in database'
            })
          }
          console.log(`    ✗ GitHub file reading not available`)
        }

        if (toolResult) {
          toolResults.push(toolResult)
        }
      }

      // Continue conversation with tool results
      messages.push({
        role: 'assistant',
        content: response.content
      })

      messages.push({
        role: 'user',
        content: toolResults
      })

      // Next API call with tool results
      console.log('🤖 Calling Claude again with tool results...')
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        system: getSystemPrompt(app),
        messages,
        tools
      })

      console.log('✓ Got response, stop_reason:', response.stop_reason)
    }

    // Extract text response
    const textBlock = response.content.find(block => block.type === 'text') as Anthropic.TextBlock | undefined
    if (!textBlock) {
      throw new Error('No text response from Claude')
    }

    const responseText = textBlock.text

    // Parse code blocks from response
    const codeBlocks = parseCodeBlocks(responseText)
    const filesChanged: string[] = []

    console.log(`📝 Found ${codeBlocks.length} code blocks`)

    // STEP 1: Save to database FIRST (instant preview)
    if (codeBlocks.length > 0) {
      try {
        // Use service role client to bypass RLS for file operations
        const serviceClient = createServiceClient(SUPABASE_URL, SERVICE_ROLE_KEY)

        const { error: dbError } = await serviceClient
          .from('app_files')
          .upsert(
            codeBlocks.map(block => ({
              app_id: appId,
              filepath: block.filename,
              content: block.code,
              file_type: block.filename.split('.').pop() || 'tsx'
            })),
            { onConflict: 'app_id,filepath' }
          )

        if (dbError) {
          console.error('❌ Database save error:', dbError)
        } else {
          filesChanged.push(...codeBlocks.map(b => b.filename))
          console.log(`✅ Saved to DB: ${filesChanged.join(', ')}`)
        }
      } catch (dbError: any) {
        console.error('❌ Database error:', dbError)
        // Continue anyway
      }
    }

    // STEP 2: Commit to GitHub in background (for production deployment)
    // TODO: GitHub integration needs vendor access token
    // if (app.github_repo && codeBlocks.length > 0) {
    //   // Don't await - let this happen in background
    //   (async () => {
    //     try {
    //       const { commitMultipleFiles } = await import('@/lib/deployment/github')
    //       const [owner, repo] = app.github_repo.split('/')
    //
    //       await commitMultipleFiles(
    //         vendorAccessToken,
    //         owner,
    //         repo,
    //         codeBlocks.map(block => ({
    //           path: block.filename,
    //           content: block.code
    //         })),
    //         `AI: ${instruction.slice(0, 80)}`
    //       )
    //
    //       console.log(`✅ Committed to GitHub: ${filesChanged.join(', ')}`)
    //
    //     } catch (gitError: any) {
    //       console.error('❌ Git error:', gitError)
    //     }
    //   })()
    // }

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
      message: responseText,
      filesChanged
    })

  } catch (error: any) {
    console.error('❌ Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process request'
    }, { status: 500 })
  }
}

function getSystemPrompt(app: any): string {
  return `You are an expert full-stack developer building a ${app.app_type} application.

App: "${app.name}"
Tech Stack: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS
GitHub Repo: ${app.github_repo || 'Not created yet'}

YOU HAVE ACCESS TO:
- web_search: Search the web for design inspiration, examples, documentation
  Use this when the user asks you to copy or reference a specific website's design
- get_current_code: Read current code from the app repository
  ALWAYS use this before making edits to see what currently exists

YOUR JOB: Generate COMPLETE, PRODUCTION-READY code based on the user's request.

WORKFLOW:
1. If user wants to EDIT existing code: Use get_current_code to read the file first (e.g., "app/page.tsx")
2. If user wants to copy a specific website design: Use web_search to research it
3. Analyze the current code or search results
4. Generate complete, updated code

IMPORTANT:
- When editing, ALWAYS read the current code first using get_current_code
- Most edits will be to "app/page.tsx" (the main page)
- For new components, create them in "components/" folder

RESPONSE FORMAT:
You MUST respond with code in this EXACT format:

\`\`\`tsx
// filename: app/page.tsx
export default function Page() {
  return (
    <div className="...">
      {/* Your code here */}
    </div>
  )
}
\`\`\`

CRITICAL RULES:
1. ALWAYS start code blocks with: // filename: path/to/file.tsx
2. Provide COMPLETE file contents (never snippets)
3. Use Tailwind CSS for ALL styling (no separate CSS files)
4. Make it production-ready with proper error handling
5. Follow Next.js 15 best practices
6. Keep responses concise - mostly code, minimal explanation

EXAMPLES:

User: "Make a hero section"
Your response:
\`\`\`tsx
// filename: app/page.tsx
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-6xl font-bold text-white mb-6">
          Welcome
        </h1>
        <p className="text-xl text-white/90 mb-8">
          This is your hero section
        </p>
        <button className="px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-all">
          Get Started
        </button>
      </div>
    </div>
  )
}
\`\`\`

User: "Add a navigation component"
Your response:
\`\`\`tsx
// filename: components/Navigation.tsx
export function Navigation() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold">Logo</div>
          <div className="flex gap-6">
            <a href="/" className="text-gray-700 hover:text-gray-900">Home</a>
            <a href="/about" className="text-gray-700 hover:text-gray-900">About</a>
            <a href="/contact" className="text-gray-700 hover:text-gray-900">Contact</a>
          </div>
        </div>
      </div>
    </nav>
  )
}
\`\`\`

Now generate the code for the user's request. Remember: START WITH THE CODE BLOCK IMMEDIATELY.`
}

function parseCodeBlocks(text: string): Array<{ filename: string; code: string }> {
  const codeBlocks: Array<{ filename: string; code: string }> = []

  // Match code blocks with filename comments
  const regex = /```(?:tsx|typescript|jsx|javascript|ts|js)?\s*\n\s*\/\/\s*filename:\s*(.+?)\n([\s\S]*?)```/gi

  let match
  while ((match = regex.exec(text)) !== null) {
    const filename = match[1]?.trim()
    const code = match[2]?.trim()

    if (filename && code && code.length > 10) {
      codeBlocks.push({ filename, code })
      console.log(`  📄 ${filename} (${code.length} chars)`)
    }
  }

  // Fallback: look for any code block if none with filenames
  if (codeBlocks.length === 0) {
    const fallbackRegex = /```(?:tsx|typescript|jsx)?\s*\n([\s\S]*?)```/gi
    let fallbackMatch
    while ((fallbackMatch = fallbackRegex.exec(text)) !== null) {
      const code = fallbackMatch[1]?.trim()
      if (code && code.length > 50) {
        console.warn('  ⚠️ Found code block without filename, using default')
        codeBlocks.push({ filename: 'app/page.tsx', code })
        break
      }
    }
  }

  return codeBlocks
}

function calculateCost(inputTokens: number, outputTokens: number): number {
  const INPUT_COST_PER_1M = 3.0
  const OUTPUT_COST_PER_1M = 15.0
  return (inputTokens / 1_000_000) * INPUT_COST_PER_1M + (outputTokens / 1_000_000) * OUTPUT_COST_PER_1M
}
