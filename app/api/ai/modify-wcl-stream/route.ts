/**
 * AI WCL Modifier - STREAMING VERSION with TOOL CHAINING
 * Real-time generation with Exa + Playwright tools
 * Extended thinking enabled for deep analysis
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

// Claude Tool Definitions
const TOOLS = [
  {
    name: 'take_screenshot',
    description: 'Take a screenshot of a website and analyze its design. Use this to understand layout, colors, typography, and spacing from a reference URL.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'The URL to screenshot and analyze (e.g., https://www.apple.com)'
        }
      },
      required: ['url']
    }
  },
  {
    name: 'search_design_inspiration',
    description: 'Search the web for design inspiration, trends, and visual examples using Exa. Use this when you need to see what top brands are doing.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'What to search for (e.g., "luxury cannabis website design 2025")'
        },
        industry: {
          type: 'string',
          description: 'Industry context (e.g., "cannabis", "fashion", "tech")'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'search_best_practices',
    description: 'Research best practices and proven patterns for conversion optimization. Use this to understand what actually works.',
    input_schema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'What best practices to find (e.g., "homepage layout", "product grid")'
        },
        industry: {
          type: 'string',
          description: 'Industry context'
        }
      },
      required: ['topic']
    }
  },
  {
    name: 'research_trends',
    description: 'Research current industry trends and emerging patterns for 2025. Use this to stay cutting-edge.',
    input_schema: {
      type: 'object',
      properties: {
        industry: {
          type: 'string',
          description: 'Industry to research (e.g., "cannabis", "luxury fashion")'
        }
      },
      required: ['industry']
    }
  }
];

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { 
          prompt, 
          fullWCLCode,
          vendorId, 
          vendorName,
          vendorLogo,
          industry,
          referenceUrl,
          isEditingExisting
        } = await request.json();
        
        // Helper to send events
        const send = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event, data })}\n\n`));
        };
        
        send('start', { message: 'Initializing AI with deep thinking...' });
        
        // Tool execution function
        const executeTool = async (toolName: string, toolInput: any) => {
          send('tool_use', { tool: toolName, input: toolInput });
          
          try {
            switch (toolName) {
              case 'take_screenshot':
                send('phase', { phase: 'screenshot', message: `Analyzing ${toolInput.url}...` });
                const analysis = await visualAnalyzer.analyzeWebsite(toolInput.url);
                send('tool_result', { 
                  tool: toolName, 
                  result: {
                    colors: analysis.insights.dominantColors.length,
                    layout: analysis.insights.layout,
                    title: analysis.metadata.title
                  }
                });
                return {
                  screenshot: analysis.screenshot,
                  analysis: `
Page: ${analysis.metadata.title}
Layout: ${analysis.insights.layout}
Colors: ${analysis.insights.dominantColors.slice(0, 10).join('; ')}
Typography: ${analysis.insights.typography.join('; ')}
Components: ${analysis.insights.components.join(', ')}
Spacing: ${analysis.insights.spacing}
`
                };
                
              case 'search_design_inspiration':
                send('phase', { phase: 'research', message: 'Searching design inspiration...' });
                const designResults = await exa.searchDesignInspiration(toolInput.query, toolInput.industry);
                send('tool_result', { tool: toolName, result: { sources: designResults.length } });
                return designResults.slice(0, 5).map(r => `${r.title}: ${r.highlights?.join(' ') || r.text?.substring(0, 200)}`).join('\n\n');
                
              case 'search_best_practices':
                send('phase', { phase: 'research', message: 'Researching best practices...' });
                const practices = await exa.searchBestPractices(toolInput.topic, toolInput.industry);
                send('tool_result', { tool: toolName, result: { sources: practices.length } });
                return practices.slice(0, 5).map(r => `${r.title}: ${r.text?.substring(0, 300)}`).join('\n\n');
                
              case 'research_trends':
                send('phase', { phase: 'research', message: 'Researching 2025 trends...' });
                const trends = await exa.researchTrends(toolInput.industry);
                send('tool_result', { tool: toolName, result: { sources: trends.length } });
                return trends.slice(0, 5).map(r => `${r.title} (${r.publishedDate}): ${r.text?.substring(0, 200)}`).join('\n\n');
                
              default:
                return 'Tool not found';
            }
          } catch (error: any) {
            send('warning', { message: `${toolName} failed: ${error.message}` });
            return `Error: ${error.message}`;
          }
        };
        
        send('thinking', { message: 'AI starting deep analysis...' });
        
        const fontLibrary = formatFontsForAI();
        
        // Build comprehensive system prompt
        const systemPrompt = `${fontLibrary}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ SENIOR DESIGNER MODE - APPLE/GUCCI/LOUIS VUITTON QUALITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are a world-class designer for ${vendorName}.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ SENIOR DESIGNER MODE - APPLE/GUCCI/LOUIS VUITTON QUALITY REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${isEditingExisting ? `
🔄 EDITING MODE: The user has an existing component and wants to MODIFY it.

EXISTING COMPONENT:
${fullWCLCode}

USER REQUEST: "${prompt}"

⚠️ CRITICAL: This is an EDIT, not a replacement!

TASK:
1. Analyze what exists
2. Identify what user wants to change/add
3. PRESERVE all existing sections not mentioned
4. Only modify/add the requested parts
5. Return COMPLETE component with ALL sections (existing + new/modified)

EXAMPLE:
If existing has: Hero + Products
User says: "Add testimonials section"
You return: Hero + Products + Testimonials (keep existing, add new)

DO NOT regenerate sections that weren't mentioned!
` : `
🆕 GENERATION MODE: Create a brand new complete component.

USER REQUEST: "${prompt}"

⚠️ BE EXTREMELY THOROUGH:
• Minimum 5-6 major sections
• Each section complete with real data
• Professional quality
• Mobile responsive
• If copying reference, recreate ALL sections shown
`}

Vendor: ${vendorName}
Vendor ID: ${vendorId}

Return ONLY WCL code. No explanations.`;

        // PHASE 3: Stream from Claude
        const messageContent: any[] = [
          { type: 'text', text: systemPrompt }
        ];
        
        const stream = await anthropic.messages.stream({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 16000,
          temperature: 1.0,
          messages: [{
            role: 'user',
            content: messageContent
          }]
        });
        
        let fullResponse = '';
        
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && 
              chunk.delta.type === 'text_delta') {
            const text = chunk.delta.text;
            fullResponse += text;
            
            // Stream each chunk to client
            send('chunk', { text });
          }
        }
        
        send('complete', { code: fullResponse });
        controller.close();
        
      } catch (error: any) {
        const send = (event: string, data: any) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event, data })}\n\n`));
        };
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

