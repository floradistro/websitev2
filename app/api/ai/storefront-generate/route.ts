/**
 * React Stream Generation - Uses Database Agent Configuration
 * Maintains conversation history
 * Cursor-style streaming with context
 */

import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getServiceSupabase } from '@/lib/supabase/client';
import { ExaClient } from '@/lib/ai/exa-client';
import { VisualAnalyzer } from '@/lib/ai/visual-analyzer';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

const exa = new ExaClient(process.env.EXA_API_KEY);
const visualAnalyzer = new VisualAnalyzer();

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  console.log('🔥 API ROUTE CALLED - storefront-generate');
  
  const encoder = new TextEncoder();
  
  let body;
  try {
    body = await request.json();
    console.log('📦 Request body received:', {
      hasPrompt: !!body.prompt,
      hasCode: !!body.fullCode,
      hasReferenceUrl: !!body.referenceUrl,
      manualMode: body.manualMode
    });
  } catch (e) {
    console.error('❌ Failed to parse request body:', e);
    return new Response('Invalid JSON', { status: 400 });
  }
  
  const {
    prompt,
    fullCode,
    vendorId,
    vendorName,
    industry = 'cannabis',
    referenceUrl,
    isEditingExisting,
    conversationId,
    manualMode = false // NEW: Manual browser mode
  } = body;
  
  console.log('🎯 API received manualMode:', manualMode);
  if (manualMode) {
    console.log('👁️ MANUAL MODE ENABLED - Browser will open visibly!');
  }
  
  const stream = new ReadableStream({
    async start(controller) {
      console.log('🌊 Stream started');
      
      // Send immediate heartbeat
      const send = (event: string, data: any) => {
        console.log(`📡 Sending event: ${event}`, data);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event, ...data })}\n\n`));
      };
      
      // Send initial status immediately
      send('status', { message: '🚀 AI request received, initializing...' });
      
      try {
        console.log('📊 Fetching AI agent from database...');
        // Fetch the WhaleTools Storefront AI agent from database
        const supabase = getServiceSupabase();
        console.log('✅ Supabase client created');
        const { data: agent, error: agentError } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('name', 'WhaleTools Storefront AI')
          .eq('status', 'active')
          .single();

        if (agentError || !agent) {
          throw new Error('WhaleTools Storefront AI agent not found or inactive');
        }

        send('status', { message: `🤖 ${agent.name} ready...` });

        // Get or create conversation
        let dbConversationId = conversationId;
        if (!dbConversationId) {
          const { data: newConv } = await supabase
            .from('ai_conversations')
            .insert({
              user_id: 'storefront-builder',
              agent_id: agent.id,
              title: prompt.substring(0, 50),
              context: {
                vendorId,
                vendorName,
                industry,
                type: 'code-generation'
              }
            })
            .select('id')
            .single();

          if (newConv) dbConversationId = newConv.id;
        }

        // Build context-aware system prompt
        let systemPrompt = agent.system_prompt;
        systemPrompt += `\n\n## CURRENT SESSION CONTEXT\n`;
        systemPrompt += `Vendor: ${vendorName} (ID: ${vendorId})\n`;
        systemPrompt += `Industry: ${industry}\n`;
        
        if (isEditingExisting && fullCode) {
          systemPrompt += `\n⚠️ EDITING MODE ACTIVE\n`;
          systemPrompt += `Current code length: ${fullCode.length} chars\n`;
          systemPrompt += `Task: Make surgical edits only - preserve all existing functionality\n`;
        }

        // Get conversation history for context
        let conversationHistory: any[] = [];
        if (dbConversationId) {
          const { data: messages } = await supabase
            .from('ai_messages')
            .select('role, content')
            .eq('conversation_id', dbConversationId)
            .order('created_at', { ascending: true })
            .limit(10); // Last 10 messages for context

          if (messages) {
            conversationHistory = messages.map(m => ({
              role: m.role as 'user' | 'assistant',
              content: m.content
            }));
          }
        }

          // Build user message with full context
          let userMessage = prompt;
          if (fullCode) {
            userMessage += `\n\n### Current React Code\n\`\`\`jsx\n${fullCode}\n\`\`\``;
          }
        if (referenceUrl) {
          userMessage += `\n\n### Reference URL\n${referenceUrl}`;
        }

        // Add current message to history
        conversationHistory.push({
          role: 'user' as const,
          content: userMessage
        });

        // Save user message to database
        if (dbConversationId) {
          await supabase.from('ai_messages').insert({
            conversation_id: dbConversationId,
            role: 'user',
            content: userMessage
          });
        }

        send('status', { message: '💭 Analyzing request...' });

        // PHASE 1: VISUAL SCRAPING (if reference URL provided)
        let screenshotBase64 = '';
        if (referenceUrl) {
          send('status', { message: '🌐 Opening browser...' });
          send('tool_result', { 
            tool: 'playwright_scraper', 
            result: '🚀 Launching Chromium browser',
            details: `Target: ${referenceUrl}`
          });

          try {
            // Add timeout wrapper for scraping (90 seconds max for large pages)
            const analysisPromise = visualAnalyzer.analyzeWebsite(referenceUrl, {
              viewport: { width: 1920, height: 1080 },
              waitFor: manualMode ? 0 : 3000, // Skip wait if manual mode (user controls timing)
              manualMode: manualMode, // NEW: Pass manual mode flag
              onProgress: (status: string) => {
                // Stream progress updates to UI in real-time
                console.log(`📡 Streaming progress: ${status}`);
                send('status', { message: status });
                send('tool_result', {
                  tool: 'playwright_scraper',
                  result: status,
                  details: ''
                });
              }
            });
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Scraping timeout after 90s - site may be too complex')), 90000)
            );
            
            const analysis = await Promise.race([analysisPromise, timeoutPromise]) as any;

            screenshotBase64 = analysis.screenshot;
            
            // Send screenshot preview to UI (like Cursor AI)
            send('screenshot', {
              data: `data:image/jpeg;base64,${screenshotBase64}`,
              width: analysis.metadata.viewport.width,
              height: analysis.metadata.viewport.height,
              title: analysis.metadata.title
            });
            
            // Add comprehensive visual analysis to system prompt
            systemPrompt += `\n\n### VISUAL ANALYSIS OF REFERENCE SITE\n`;
            systemPrompt += visualAnalyzer.formatForAI(analysis);
            
            // Extract specific insights
            if (analysis.insights.pageStructure) {
              systemPrompt += `\n📋 PAGE STRUCTURE:\n`;
              analysis.insights.pageStructure.forEach((s: string) => {
                systemPrompt += `• ${s}\n`;
              });
            }
            
            if (analysis.insights.headingTexts) {
              systemPrompt += `\n📝 HEADING HIERARCHY:\n`;
              analysis.insights.headingTexts.forEach((h: string) => {
                systemPrompt += `• ${h}\n`;
              });
            }
            
            if (analysis.insights.buttonTexts) {
              systemPrompt += `\n🔘 CTA TEXT:\n`;
              analysis.insights.buttonTexts.slice(0, 5).forEach((b: string) => {
                systemPrompt += `• ${b}\n`;
              });
            }

            const screenshotSizeKB = (analysis.screenshot.length * 0.75 / 1024).toFixed(0); // Base64 is ~33% larger
            
            send('status', { message: '✅ Screenshot analysis complete!' });
            send('tool_result', { 
              tool: 'playwright_scraper', 
              result: '🎉 Visual analysis complete!',
              details: `📸 ${screenshotSizeKB}KB JPEG\n📋 ${analysis.insights.pageStructure?.length || 0} sections\n🧩 ${analysis.insights.components.length} components\n🎨 ${analysis.insights.dominantColors.length} colors\n\n✅ Ready to generate matching design!`
            });
            
            console.log(`✅ Visual analysis complete: ${analysis.metadata.title}`);
          } catch (err: any) {
            console.error('Visual analysis failed:', err);
            send('status', { message: '⚠️ Screenshot failed, continuing without visual reference...' });
            send('tool_result', { 
              tool: 'playwright_scraper', 
              result: 'Failed ❌',
              details: `${err.message}\n\n⏩ AI will generate code based on your prompt only (no visual reference)`
            });
            // Don't throw - continue without screenshot
          }
        }

        // PHASE 2: EXA RESEARCH (if keywords detected)
        const needsResearch = prompt.toLowerCase().includes('inspiration') || 
                             prompt.toLowerCase().includes('best practice') ||
                             prompt.toLowerCase().includes('example') ||
                             prompt.toLowerCase().includes('research') ||
                             prompt.toLowerCase().includes('similar');

        // TEMPORARILY DISABLED to test manual mode faster
        if (false && (needsResearch || referenceUrl)) {
          send('status', { message: '🔍 Researching design patterns with Exa...' });
          send('tool_result', { 
            tool: 'exa_search', 
            result: 'Searching for design inspiration',
            details: `Query: luxury ${industry} ${prompt.substring(0, 50)}`
          });

          try {
            const results = await exa.searchDesignInspiration(prompt, industry);
            if (results.length > 0) {
              systemPrompt += `\n\n### EXA RESEARCH FINDINGS\n`;
              systemPrompt += `Found ${results.length} relevant design resources:\n\n`;
              results.slice(0, 5).forEach((r, i) => {
                systemPrompt += `${i + 1}. **${r.title}**\n`;
                systemPrompt += `   URL: ${r.url}\n`;
                systemPrompt += `   ${r.text.substring(0, 250)}...\n\n`;
                if (r.highlights && r.highlights.length > 0) {
                  systemPrompt += `   Key Points:\n`;
                  r.highlights.forEach(h => {
                    systemPrompt += `   • ${h}\n`;
                  });
                }
                systemPrompt += `\n`;
              });
              
              send('tool_result', { 
                tool: 'exa_search', 
                result: 'Complete ✅',
                details: `Found ${results.length} relevant articles`
              });
            }
          } catch (err) {
            console.error('Exa search failed:', err);
            const errorMessage = (err as Error)?.message || String(err) || 'Unknown error';
            send('tool_result', {
              tool: 'exa_search',
              result: 'Failed ❌',
              details: errorMessage
                });
              }
            }
            
        send('status', { message: '✨ Generating React code with vision...' });

        // Build message content with screenshot if available
        const lastMessage = conversationHistory[conversationHistory.length - 1];
        if (screenshotBase64 && lastMessage.role === 'user') {
          // Replace last message with vision-enabled version
          conversationHistory[conversationHistory.length - 1] = {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg', // FIXED: Changed from image/png to match JPEG format
                  data: screenshotBase64,
                }
              },
              {
                type: 'text',
                text: lastMessage.content as string
              }
            ]
          } as any;
          
          send('status', { message: '👁️ Claude analyzing screenshot...' });
        }

        // Stream response from Claude using agent settings with timeout
        send('status', { message: '🤖 Streaming response from Claude...' });
        
        const messageStream = await Promise.race([
          anthropic.messages.stream({
            model: agent.model,
            max_tokens: agent.max_tokens,
            temperature: agent.temperature,
            system: systemPrompt,
            messages: conversationHistory,
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Claude API timeout after 2 minutes')), 120000)
          )
        ]) as any;

        let fullResponse = '';
        let currentThinking = '';

        messageStream.on('text', (text: string) => {
          fullResponse += text;
          send('text', { content: text, full: fullResponse });
        });

        messageStream.on('content_block_start', (block: any) => {
          if (block.type === 'thinking') {
            send('thinking_start', {});
          }
        });

        messageStream.on('message_start', (event: any) => {
          if (event.message.usage) {
            send('tokens', { 
              input: event.message.usage.input_tokens,
              output: event.message.usage.output_tokens
            });
          }
        });

        messageStream.on('error', (error: any) => {
          console.error('Stream error:', error);
          send('error', { message: error.message });
        });

        const finalMessage = await messageStream.finalMessage();

        // Extract code from response
        const codeMatch = fullResponse.match(/```(?:jsx|javascript|js)?\n([\s\S]*?)\n```/);
        let code = codeMatch ? codeMatch[1] : fullResponse;
        
        // CRITICAL: Auto-fix common syntax errors
        let fixed = false;
        
        // Fix unmatched braces
        const openBraces = (code.match(/{/g) || []).length;
        const closeBraces = (code.match(/}/g) || []).length;
        if (openBraces > closeBraces) {
          const missing = openBraces - closeBraces;
          code += '\n' + '  }'.repeat(missing);
          fixed = true;
          console.log(`✅ Fixed ${missing} missing braces`);
        }
        
        // Fix unterminated strings in className attributes
        code = code.replace(/className="([^"\n]*?)$/gm, 'className="$1"');
        code = code.replace(/className='([^'\n]*?)$/gm, "className='$1'");
        
        if (fixed) {
          send('status', { message: '✅ Auto-fixed syntax errors' });
        }

        // Save assistant response to database
        if (dbConversationId) {
          await supabase.from('ai_messages').insert({
            conversation_id: dbConversationId,
            role: 'assistant',
            content: fullResponse,
            tokens_used: finalMessage.usage?.output_tokens,
            model_version: agent.model
          });
        }

        send('complete', { 
          conversationId: dbConversationId,
          code: code,
          fullResponse: fullResponse,
          usage: finalMessage.usage
        });
        
        controller.close();
        
      } catch (error: any) {
        console.error('❌❌❌ FATAL ERROR in storefront generation:', error);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        send('error', { 
          message: error.message || 'Failed to generate storefront code',
          details: error.stack
        });
        send('status', { message: `❌ Fatal error: ${error.message || 'Unknown'}` });
        
        // Give client time to receive error
        await new Promise(resolve => setTimeout(resolve, 100));
        controller.close();
      }
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
