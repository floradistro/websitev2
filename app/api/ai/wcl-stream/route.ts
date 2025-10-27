/**
 * WCL AI Stream - Complete Implementation
 * Tool chaining + Extended thinking + Real-time streaming
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

// Tool definitions for Claude
const TOOLS: Anthropic.Tool[] = [
  {
    name: 'screenshot_website',
    description: 'Take a screenshot and deeply analyze a website. Returns detailed breakdown of sections, colors, typography, spacing, and all visual elements.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Website URL to analyze' }
      },
      required: ['url']
    }
  },
  {
    name: 'search_design_patterns',
    description: 'Search Exa for design inspiration and visual patterns from top brands.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What to search for' },
        industry: { type: 'string', description: 'Industry context' }
      },
      required: ['query']
    }
  },
  {
    name: 'research_best_practices',
    description: 'Find proven best practices and conversion optimization strategies.',
    input_schema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Topic to research' },
        industry: { type: 'string', description: 'Industry' }
      },
      required: ['topic']
    }
  }
];

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const { 
    prompt, 
    fullWCLCode,
    vendorId, 
    vendorName,
    industry,
    referenceUrl,
    isEditingExisting
  } = await request.json();
  
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event, data })}\n\n`));
      };
      
      try {
        send('start', { message: 'Initializing Claude Sonnet 4.5 with extended thinking...' });
        
        // Build system prompt
        const systemPrompt = `${formatFontsForAI()}

You are a world-class senior designer working for Apple, Gucci, and Louis Vuitton.

AVAILABLE TOOLS:
1. screenshot_website - Analyze any website visually
2. search_design_patterns - Find design inspiration
3. research_best_practices - Get conversion strategies

${isEditingExisting ? `
🔄 EDITING MODE
Existing component has content. PRESERVE all existing sections.
Only modify/add what user specifically requests.
` : `
🆕 GENERATION MODE
Create complete, thorough component.
Minimum 6-8 major sections. Be extremely detailed.
`}

CURRENT COMPONENT:
${fullWCLCode || 'Empty - generate from scratch'}

USER REQUEST: "${prompt}"

INSTRUCTIONS:
${referenceUrl ? `1. Use screenshot_website on: ${referenceUrl}` : ''}
${industry ? `2. Use search_design_patterns for ${industry} inspiration` : ''}
3. Think deeply about the design
4. Generate complete WCL component

BE EXTREMELY THOROUGH. If copying a site, recreate ALL sections.`;

        // Start Claude stream with tools and extended thinking
        send('thinking', { message: 'Claude analyzing with deep reasoning...' });
        
        const stream = await anthropic.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 16000,
          temperature: 1.0,
          thinking: {
            type: 'enabled',
            budget_tokens: 10000 // Extended thinking budget
          },
          tools: TOOLS,
          messages: [{
            role: 'user',
            content: systemPrompt
          }],
          stream: true
        });
        
        let fullText = '';
        let currentThinking = '';
        const toolResults: any[] = [];
        let screenshotData: string | null = null;
        
        // Process stream
        for await (const event of stream) {
          // Thinking blocks
          if (event.type === 'content_block_start' && event.content_block.type === 'thinking') {
            send('thinking_start', { message: 'AI reasoning about design...' });
          }
          
          if (event.type === 'content_block_delta' && event.delta.type === 'thinking_delta') {
            currentThinking += event.delta.thinking;
            send('thinking_chunk', { text: event.delta.thinking });
          }
          
          if (event.type === 'content_block_stop' && currentThinking) {
            send('thinking_complete', { thinking: currentThinking.substring(0, 500) + '...' });
            currentThinking = '';
          }
          
          // Tool use
          if (event.type === 'content_block_start' && event.content_block.type === 'tool_use') {
            const toolName = event.content_block.name;
            send('tool_start', { tool: toolName, message: `Using tool: ${toolName}` });
          }
          
          if (event.type === 'content_block_delta' && event.delta.type === 'input_json_delta') {
            // Tool input being built
          }
          
          if (event.type === 'content_block_stop' && event.index !== undefined) {
            const block = (stream as any).currentMessage?.content[event.index];
            
            if (block?.type === 'tool_use') {
              const toolName = block.name;
              const toolInput = block.input;
              
              send('tool_execute', { tool: toolName, input: toolInput });
              
              // Execute tool
              let toolResult: any;
              
              if (toolName === 'screenshot_website') {
                const analysis = await visualAnalyzer.analyzeWebsite(toolInput.url);
                screenshotData = analysis.screenshot;
                
                send('tool_complete', {
                  tool: toolName,
                  components: analysis.insights.components.length,
                  title: analysis.metadata.title
                });
                
                toolResult = `
Screenshot Analysis of ${analysis.metadata.title}:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Layout: ${analysis.insights.layout}

Components Detected:
${analysis.insights.components.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Colors:
${analysis.insights.dominantColors.slice(0, 15).join('\n')}

Typography:
${analysis.insights.typography.join('\n')}

Spacing: ${analysis.insights.spacing}

⚠️ RECREATE ALL ${analysis.insights.components.length} COMPONENTS!
`;
              } else if (toolName === 'search_design_patterns') {
                const results = await exa.searchDesignInspiration(toolInput.query, toolInput.industry);
                send('tool_complete', { tool: toolName, sources: results.length });
                toolResult = results.slice(0, 5).map(r => 
                  `${r.title}\n${r.highlights?.join('\n') || r.text?.substring(0, 300)}\n`
                ).join('\n━━━\n');
              } else if (toolName === 'research_best_practices') {
                const results = await exa.searchBestPractices(toolInput.topic, toolInput.industry);
                send('tool_complete', { tool: toolName, sources: results.length });
                toolResult = results.slice(0, 5).map(r =>
                  `${r.title}\n${r.text?.substring(0, 400)}\n`
                ).join('\n━━━\n');
              }
              
              toolResults.push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: toolResult
              });
            }
          }
          
          // Text generation
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullText += event.delta.text;
            send('chunk', { text: event.delta.text });
          }
          
          // Message stop - send tool results if needed
          if (event.type === 'message_stop' && toolResults.length > 0) {
            send('tool_results_sent', { count: toolResults.length });
            
            // Continue conversation with tool results
            const continueStream = await anthropic.messages.create({
              model: 'claude-sonnet-4-5-20250929',
              max_tokens: 16000,
              temperature: 1.0,
              thinking: {
                type: 'enabled',
                budget_tokens: 10000
              },
              tools: TOOLS,
              messages: [
                {
                  role: 'user',
                  content: systemPrompt
                },
                {
                  role: 'assistant',
                  content: (stream as any).currentMessage?.content || []
                },
                {
                  role: 'user',
                  content: toolResults
                }
              ],
              stream: true
            });
            
            // Process continued stream
            for await (const contEvent of continueStream) {
              if (contEvent.type === 'content_block_delta' && contEvent.delta.type === 'text_delta') {
                fullText += contEvent.delta.text;
                send('chunk', { text: contEvent.delta.text });
              }
              
              if (contEvent.type === 'content_block_delta' && contEvent.delta.type === 'thinking_delta') {
                send('thinking_chunk', { text: contEvent.delta.thinking });
              }
            }
          }
        }
        
        send('complete', { code: fullText, screenshot: screenshotData });
        controller.close();
        
      } catch (error: any) {
        send('error', { message: error.message, stack: error.stack });
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

