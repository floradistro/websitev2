import { NextRequest } from 'next/server'
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

// POST /api/vendor/ai-edit-stream - Streaming AI response with Server-Sent Events
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false

      function send(data: any) {
        if (!isClosed) {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
          } catch (error) {
            console.error('Failed to send data:', error)
            isClosed = true
          }
        }
      }

      function sendText(text: string) {
        send({ type: 'text', content: text })
      }

      function sendStatus(status: string) {
        send({ type: 'status', content: status })
      }

      function sendDone() {
        if (!isClosed) {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
          isClosed = true
        }
      }

      function sendError(error: string) {
        send({ type: 'error', error })
        sendDone()
      }

      try {
        const body = await request.json()
        const { appId, vendorId, instruction, conversationHistory } = body

        if (!appId || !vendorId || !instruction) {
          sendError('Missing required fields')
          return
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
          sendError('App not found')
          return
        }

        console.log('🤖 Processing (streaming):', instruction.substring(0, 100))

        // Build message history
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
            description: 'Search the web for current information, design inspiration, examples, or documentation.',
            input_schema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' },
                num_results: { type: 'number', description: 'Number of results (1-10)', default: 3 }
              },
              required: ['query']
            }
          },
          {
            name: 'get_current_code',
            description: 'Read current code from a file to understand what exists before making changes.',
            input_schema: {
              type: 'object',
              properties: {
                filepath: { type: 'string', description: 'File path (e.g. "app/page.tsx")' }
              },
              required: ['filepath']
            }
          },
          {
            name: 'apply_edit',
            description: 'Make a surgical edit to a file by replacing specific code. This is the ONLY way to make changes - always use this instead of outputting code blocks.',
            input_schema: {
              type: 'object',
              properties: {
                filepath: { type: 'string', description: 'File path to edit' },
                old_code: { type: 'string', description: 'The exact code to find (must match exactly including whitespace)' },
                new_code: { type: 'string', description: 'The new code to replace it with' }
              },
              required: ['filepath', 'old_code', 'new_code']
            }
          }
        ]

        // Stream response from Claude
        const streamResponse = await anthropic.messages.stream({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          system: getSystemPrompt(app),
          messages,
          tools
        })

        let fullText = ''
        let toolUseBlocks: Anthropic.ToolUseBlock[] = []
        const filesChanged: string[] = [] // Track all file changes from both tools and code blocks

        // Handle streaming text
        streamResponse.on('text', (text) => {
          fullText += text
          sendText(text)
        })

        // Handle tool use
        streamResponse.on('contentBlock', (block) => {
          if (block.type === 'tool_use') {
            toolUseBlocks.push(block as Anthropic.ToolUseBlock)
          }
        })

        // Wait for initial response to complete
        const initialMessage = await streamResponse.finalMessage()
        console.log(`📊 Initial response complete. Text length: ${fullText.length}, Tool blocks: ${toolUseBlocks.length}`)

        // If tools were used, execute them and continue
        if (toolUseBlocks.length > 0) {
          console.log(`🔧 Executing ${toolUseBlocks.length} tools...`)

          const toolResults: any[] = []

          for (const toolUse of toolUseBlocks) {
            console.log(`  🔍 Tool: ${toolUse.name}`)

            if (toolUse.name === 'web_search') {
              const { query, num_results = 3 } = toolUse.input as { query: string; num_results?: number }
              sendStatus(`🔍 Searching for: ${query.substring(0, 50)}...`)
              const searchResults = await exa.searchAndContents(query, {
                numResults: Math.min(num_results, 5),
                text: true,
                highlights: true
              })

              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: JSON.stringify({
                  results_count: searchResults.results.length,
                  results: searchResults.results.map(r => ({
                    title: r.title,
                    url: r.url,
                    text: r.text?.substring(0, 1000),
                    highlights: r.highlights
                  }))
                })
              })

              console.log(`    ✓ Found ${searchResults.results.length} results`)

            } else if (toolUse.name === 'get_current_code') {
              const { filepath } = toolUse.input as { filepath: string }
              sendStatus(`📖 Reading ${filepath}...`)

              // Try database first (faster)
              const serviceClient = createServiceClient(SUPABASE_URL, SERVICE_ROLE_KEY)
              const { data: file } = await serviceClient
                .from('app_files')
                .select('content')
                .eq('app_id', appId)
                .eq('filepath', filepath)
                .single()

              let fileContent = file?.content

              // Fallback to GitHub if not in DB
              if (!fileContent && app.github_repo) {
                const { getFileContent } = await import('@/lib/deployment/github')
                const repoName = app.github_repo.split('/')[1]
                fileContent = await getFileContent(repoName, filepath)
              }

              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: JSON.stringify(
                  fileContent
                    ? { filepath, content: fileContent, lines: fileContent.split('\n').length }
                    : { filepath, error: 'File not found' }
                )
              })

              console.log(fileContent ? `    ✓ Read ${fileContent.split('\n').length} lines` : '    ✗ Not found')

            } else if (toolUse.name === 'apply_edit') {
              const { filepath, old_code, new_code } = toolUse.input as { filepath: string; old_code: string; new_code: string }
              sendStatus(`✏️ Editing ${filepath}...`)

              // Get current file content
              const serviceClient = createServiceClient(SUPABASE_URL, SERVICE_ROLE_KEY)
              const { data: file } = await serviceClient
                .from('app_files')
                .select('content')
                .eq('app_id', appId)
                .eq('filepath', filepath)
                .single()

              if (!file?.content) {
                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify({ error: 'File not found. Cannot apply edit.' })
                })
                console.log(`    ✗ File not found: ${filepath}`)
                continue
              }

              // Apply the edit
              const updatedContent = file.content.replace(old_code, new_code)

              if (updatedContent === file.content) {
                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify({ error: 'Old code not found. Make sure it matches exactly including whitespace.' })
                })
                console.log(`    ✗ Old code not found in ${filepath}`)
                continue
              }

              // Save the edited file
              const { error: saveError } = await serviceClient
                .from('app_files')
                .update({
                  content: updatedContent,
                  updated_at: new Date().toISOString()
                })
                .eq('app_id', appId)
                .eq('filepath', filepath)

              if (saveError) {
                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify({ error: 'Failed to save edit' })
                })
                console.log(`    ✗ Failed to save ${filepath}`)
              } else {
                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: JSON.stringify({ success: true, filepath, lines_changed: new_code.split('\n').length })
                })
                console.log(`    ✓ Applied edit to ${filepath}`)
                sendStatus(`✅ Saved ${filepath}`)

                // Track this file as changed
                if (!filesChanged.includes(filepath)) {
                  filesChanged.push(filepath)
                }

                // Commit to GitHub in background
                if (app.github_repo) {
                  (async () => {
                    try {
                      const { commitMultipleFiles } = await import('@/lib/deployment/github')
                      const repoName = app.github_repo.split('/')[1]
                      await commitMultipleFiles(
                        repoName,
                        [{ path: filepath, content: updatedContent }],
                        `AI: ${instruction.slice(0, 80)}`
                      )
                      console.log(`✅ Committed ${filepath} to GitHub`)
                    } catch (gitError) {
                      console.error('❌ Git commit error:', gitError)
                    }
                  })()
                }
              }
            }
          }

          // Continue conversation with tool results, streaming the final response
          messages.push({ role: 'assistant', content: initialMessage.content })
          messages.push({ role: 'user', content: toolResults })

          const continueStream = await anthropic.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8000,
            system: getSystemPrompt(app),
            messages,
            tools
          })

          fullText = '' // Reset for second response
          let secondToolUseBlocks: Anthropic.ToolUseBlock[] = []

          continueStream.on('text', (text) => {
            fullText += text
            sendText(text)
          })

          continueStream.on('contentBlock', (block) => {
            console.log(`📦 Second turn content block: type=${block.type}`)
            if (block.type === 'tool_use') {
              console.log(`   🔧 Tool use captured: ${(block as any).name}`)
              secondToolUseBlocks.push(block as Anthropic.ToolUseBlock)
            }
          })

          continueStream.on('error', (error) => {
            console.error('❌ Continue stream error:', error)
          })

          try {
            await continueStream.finalMessage()
            console.log('✅ Stream completed successfully')
            console.log(`📊 Second turn stats: Text length: ${fullText.length}, Tool blocks: ${secondToolUseBlocks.length}`)

            // Execute any tools called in the second turn
            if (secondToolUseBlocks.length > 0) {
              console.log(`🔧 Executing ${secondToolUseBlocks.length} more tools (second turn)...`)

              for (const toolUse of secondToolUseBlocks) {
                console.log(`  🔍 Tool: ${toolUse.name}`)

                if (toolUse.name === 'apply_edit') {
                  const { filepath, old_code, new_code } = toolUse.input as { filepath: string; old_code: string; new_code: string }

                  // Read current file
                  const { data: currentFile } = await serviceClient
                    .from('app_files')
                    .select('content')
                    .eq('app_id', appId)
                    .eq('filepath', filepath)
                    .single()

                  if (!currentFile) {
                    console.log(`    ✗ File not found: ${filepath}`)
                    continue
                  }

                  // Apply edit
                  const updatedContent = currentFile.content.replace(old_code, new_code)

                  if (updatedContent === currentFile.content) {
                    console.log(`    ✗ Old code not found in ${filepath}`)
                    continue
                  }

                  // Save
                  const { error: saveError } = await serviceClient
                    .from('app_files')
                    .update({
                      content: updatedContent,
                      updated_at: new Date().toISOString()
                    })
                    .eq('app_id', appId)
                    .eq('filepath', filepath)

                  if (!saveError) {
                    console.log(`    ✓ Applied edit to ${filepath}`)
                    sendStatus(`✅ Saved ${filepath}`)

                    if (!filesChanged.includes(filepath)) {
                      filesChanged.push(filepath)
                    }
                  }
                }
              }
            }
          } catch (streamError: any) {
            console.error('❌ Stream finalization error:', streamError)
            // Don't throw - continue processing what we have
          }

          // Send file changes notification
          if (filesChanged.length > 0) {
            send({ type: 'files', files: filesChanged })
            console.log(`✅ Files changed via apply_edit: ${filesChanged.join(', ')}`)
          }
        }

        // Disable code block parsing - force use of apply_edit tool only
        // This prevents full file rewrites
        const codeBlocks: Array<{ filename: string; code: string }> = []

        console.log(`📝 Code blocks disabled - use apply_edit tool for surgical changes`)

        if (false && codeBlocks.length > 0) {
          sendStatus(`💾 Saving ${codeBlocks.length} file(s)...`)
          try {
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

            if (!dbError) {
              filesChanged.push(...codeBlocks.map(b => b.filename))
              console.log(`✅ Saved to DB: ${filesChanged.join(', ')}`)
              sendStatus(`✅ Saved: ${filesChanged.join(', ')}`)
              send({ type: 'files', files: filesChanged })
            } else {
              console.error('❌ DB save error:', dbError)
            }
          } catch (dbError) {
            console.error('❌ Database error:', dbError)
          }
        }

        // Commit to GitHub in background
        if (app.github_repo && codeBlocks.length > 0) {
          (async () => {
            try {
              const { commitMultipleFiles } = await import('@/lib/deployment/github')
              const repoName = app.github_repo.split('/')[1]
              await commitMultipleFiles(
                repoName,
                codeBlocks.map(block => ({ path: block.filename, content: block.code })),
                `AI: ${instruction.slice(0, 80)}`
              )
              console.log(`✅ Committed to GitHub`)
            } catch (gitError) {
              console.error('❌ Git error:', gitError)
            }
          })()
        }

        // Log AI usage
        await supabase.from('vendor_ai_usage').insert({
          vendor_id: vendorId,
          app_id: appId,
          model: 'claude-sonnet-4-20250514',
          input_tokens: initialMessage.usage.input_tokens,
          output_tokens: initialMessage.usage.output_tokens,
          cost_usd: calculateCost(initialMessage.usage.input_tokens, initialMessage.usage.output_tokens),
          instruction
        })

        sendDone()

      } catch (error: any) {
        console.error('❌ Stream error:', error)
        sendError(error.message || 'Failed to process request')
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}

function getSystemPrompt(app: any): string {
  return `You are an expert full-stack developer helping build: "${app.name}"
Tech Stack: Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS

🎯 MANDATORY: Use apply_edit tool for ALL changes - NEVER output code blocks!

WORKFLOW (NO EXCEPTIONS):
When user requests a change, you MUST:
1. Call get_current_code("file.tsx") to read file
2. After receiving file content, IMMEDIATELY call apply_edit() with minimal change

apply_edit parameters:
• filepath: File to edit
• old_code: EXACT text to find (must match perfectly)
• new_code: Replacement text

EXAMPLE REQUEST: "change hero to say yacht club"

YOUR RESPONSE MUST BE:
[First turn - call tool]
I'll read the current homepage.
(system executes: get_current_code("app/page.tsx") → returns 423 lines)

[Second turn - IMMEDIATELY use apply_edit]
I'll update the hero text to "yacht club".
(system executes: apply_edit with old/new code below)

old_code: '<h1 className="text-6xl font-bold">flora distro</h1>'
new_code: '<h1 className="text-6xl font-bold">yacht club</h1>'

Done! That's it - just ONE line changed.

CRITICAL RULES:
🚨 After getting file content, you MUST call apply_edit - never stop without editing
🚨 Change ONLY 1-10 lines - find the exact text that needs changing
🚨 Match old_code EXACTLY including all whitespace and quotes
🚨 NEVER output code blocks (no markdown code fences)
🚨 NEVER say "here's the updated file" - just use apply_edit

If user says "change X to Y", your job is: find X in file, replace with Y using apply_edit. Nothing else.`
}

function parseCodeBlocks(text: string): Array<{ filename: string; code: string }> {
  const codeBlocks: Array<{ filename: string; code: string }> = []
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
// force recompile
