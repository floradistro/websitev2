/**
 * WCL Stream Generation - Complete Tool Chaining Implementation
 * ✅ Streaming
 * ✅ Extended Thinking  
 * ✅ Tool Chaining (Exa + Playwright)
 * ✅ Real-time Progress
 */

import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ExaClient } from '@/lib/ai/exa-client';
import { VisualAnalyzer } from '@/lib/ai/visual-analyzer';
import { formatFontsForAI } from '@/lib/ai/font-library';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

const exa = new ExaClient(process.env.EXA_API_KEY);
const visualAnalyzer = new VisualAnalyzer();

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for complex generation

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const {
    prompt,
    fullWCLCode,
    vendorId,
    vendorName,
    industry = 'cannabis',
    referenceUrl,
    isEditingExisting
  } = await request.json();
  
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event, ...data })}\n\n`));
      };
      
      try {
        send('status', { message: '🤖 Initializing Claude Sonnet 4.5 with extended thinking...' });
        
        // System instructions
        const systemPrompt = `You are a world-class senior designer for Apple, Gucci, and Louis Vuitton.

${formatFontsForAI()}

TASK: ${prompt}

Vendor: ${vendorName} (${vendorId})
Industry: ${industry}
${referenceUrl ? `Reference URL: ${referenceUrl} (use screenshot_website tool)` : ''}

${isEditingExisting ? `
🔄 EDITING MODE:
Current component exists. PRESERVE all existing sections.
Only modify/add what user requests.

EXISTING COMPONENT:
${fullWCLCode}
` : `
🆕 GENERATION MODE:
Create complete professional component.
Minimum 6-8 major sections.
`}

PROCESS:
${referenceUrl ? '1. screenshot_website - Analyze reference\n' : ''}2. search_design_patterns - Find inspiration
3. research_best_practices - Get proven patterns
4. THINK DEEPLY about structure
5. Generate COMPLETE WCL component

BE EXTREMELY THOROUGH. Create ALL sections needed.

WhaleTools theme: bg-black, border-white/5, rounded-2xl, font-black uppercase, mobile responsive.`;

        // Tool definitions
        const tools: Anthropic.Tool[] = [
          {
            name: 'screenshot_website',
            description: 'Screenshot and analyze a website design',
            input_schema: {
              type: 'object',
              properties: {
                url: { type: 'string', description: 'URL to analyze' }
              },
              required: ['url']
            }
          },
          {
            name: 'search_design_patterns',
            description: 'Search web for design inspiration',
            input_schema: {
              type: 'object',
              properties: {
                query: { type: 'string' },
                industry: { type: 'string' }
              },
              required: ['query']
            }
          },
          {
            name: 'research_best_practices',
            description: 'Research conversion best practices',
            input_schema: {
              type: 'object',
              properties: {
                topic: { type: 'string' },
                industry: { type: 'string' }
              },
              required: ['topic']
            }
          }
        ];
        
        // Multi-turn conversation for tool use
        let messages: Anthropic.MessageParam[] = [
          { role: 'user', content: systemPrompt }
        ];
        
        let continueLoop = true;
        let finalCode = '';
        
        while (continueLoop) {
          send('status', { message: '🧠 AI thinking deeply...' });
          
          const response = await anthropic.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 16000,
            temperature: 1.0,
            thinking: {
              type: 'enabled',
              budget_tokens: 10000 // Extended thinking
            },
            tools,
            messages,
            stream: true
          });
          
          const contentBlocks: any[] = [];
          let currentBlock: any = null;
          let thinkingText = '';
          
          for await (const event of response) {
            // Track content blocks
            if (event.type === 'content_block_start') {
              currentBlock = { ...event.content_block };
              if (currentBlock.type === 'tool_use') {
                currentBlock.input = '';
              }
            }
            
            if (event.type === 'content_block_delta') {
              if (event.delta.type === 'thinking_delta') {
                thinkingText += event.delta.thinking;
                send('thinking', { text: event.delta.thinking });
              }
              
              if (event.delta.type === 'text_delta') {
                finalCode += event.delta.text;
                send('code_chunk', { text: event.delta.text });
              }
              
              if (event.delta.type === 'input_json_delta' && currentBlock) {
                currentBlock.input += event.delta.partial_json;
              }
            }
            
            if (event.type === 'content_block_stop' && currentBlock) {
              if (currentBlock.type === 'tool_use') {
                // Parse complete tool input
                try {
                  currentBlock.input = JSON.parse(currentBlock.input);
                } catch (e) {
                  // Already an object
                }
                contentBlocks.push(currentBlock);
                send('tool_start', { tool: currentBlock.name });
              } else {
                contentBlocks.push(currentBlock);
              }
              currentBlock = null;
            }
          }
          
          // Check if AI wants to use tools
          const toolUses = contentBlocks.filter(b => b.type === 'tool_use');
          
          if (toolUses.length > 0) {
            send('status', { message: `🔧 Executing ${toolUses.length} tools...` });
            
            const toolResults: Anthropic.ToolResultBlockParam[] = [];
            
            for (const toolUse of toolUses) {
              const { name, input } = toolUse;
              
              send('tool_execute', { tool: name, input });
              
              let result: any;
              
              try {
                if (name === 'screenshot_website') {
                  send('status', { message: `📸 Screenshotting ${input.url}...` });
                  const analysis = await visualAnalyzer.analyzeWebsite(input.url);
                  
                  const componentsCount = analysis.insights.components.length;
                  
                  send('tool_result', { 
                    tool: name,
                    result: `✅ Screenshot complete - ${componentsCount} components detected`,
                    details: analysis.metadata.title
                  });
                  
                  result = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📸 SCREENSHOT ANALYSIS: ${analysis.metadata.title}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ FOUND ${componentsCount} COMPONENTS - YOU MUST RECREATE THE DESIGN!

LAYOUT TYPE:
${analysis.insights.layout}

COMPONENTS DETECTED:
${analysis.insights.components.map((c, i) => `${i + 1}. ${c}`).join('\n')}

COLORS:
${analysis.insights.dominantColors.slice(0, 12).join('\n')}

TYPOGRAPHY:
${analysis.insights.typography.join(', ')}

SPACING: ${analysis.insights.spacing}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ RECREATE THE DESIGN WITH ALL ${componentsCount} COMPONENTS!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
                } else if (name === 'search_design_patterns') {
                  send('status', { message: `🔍 Searching: ${input.query}...` });
                  const results = await exa.searchDesignInspiration(input.query, input.industry);
                  
                  send('tool_result', { 
                    tool: name,
                    result: `✅ Found ${results.length} design sources`,
                    details: results.slice(0, 3).map(r => r.title).join(', ')
                  });
                  
                  result = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 DESIGN PATTERNS RESEARCH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${results.slice(0, 5).map((r, i) => `
${i + 1}. ${r.title}
   ${r.highlights?.join('\n   ') || r.text?.substring(0, 200)}
`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
                } else if (name === 'research_best_practices') {
                  send('status', { message: `📚 Researching: ${input.topic}...` });
                  const results = await exa.searchBestPractices(input.topic, input.industry);
                  
                  send('tool_result', { 
                    tool: name,
                    result: `✅ Found ${results.length} best practices`,
                    details: 'Conversion & UX insights'
                  });
                  
                  result = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 BEST PRACTICES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${results.slice(0, 5).map((r, i) => `
${i + 1}. ${r.title}
   ${r.text?.substring(0, 300)}
`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
                }
                
                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: result || 'No result'
                });
                
                send('tool_complete', { tool: name });
                
              } catch (error: any) {
                send('warning', { message: `Tool ${name} failed: ${error.message}` });
                send('tool_result', {
                  tool: name,
                  result: `❌ Failed: ${error.message}`,
                  details: ''
                });
                toolResults.push({
                  type: 'tool_result',
                  tool_use_id: toolUse.id,
                  content: `Error: ${error.message}`,
                  is_error: true
                });
              }
            }
            
            // Add assistant message + tool results to conversation
            messages.push({
              role: 'assistant',
              content: contentBlocks
            });
            
            messages.push({
              role: 'user',
              content: toolResults
            });
            
            // Continue loop to get AI's response with tool results
            send('status', { message: '🤖 AI processing research and generating...' });
            
          } else {
            // No tools used, we have final code
            continueLoop = false;
          }
        }
        
        send('complete', { code: finalCode });
        controller.close();
        
      } catch (error: any) {
        send('error', { message: error.message });
        controller.close();
      }
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}

