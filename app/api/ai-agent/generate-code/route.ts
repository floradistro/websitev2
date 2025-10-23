import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CODE_GENERATION_PROMPT = `You are an expert Next.js/React developer building custom vendor storefronts for a cannabis marketplace.

CONTEXT:
- Vendor sells cannabis products via Yacht Club platform
- Products are loaded from Supabase (vendor_id filter)
- Use Next.js 14 App Router + TypeScript + Tailwind CSS
- Must be production-ready, mobile-responsive, accessible
- Use real data from Supabase, NEVER mock/fake data

SUPABASE SETUP (already configured):
\`\`\`typescript
// lib/supabase.ts exists with:
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(url, key);

// To fetch products:
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('vendor_id', process.env.NEXT_PUBLIC_VENDOR_ID)
  .eq('status', 'published');
\`\`\`

YOUR TASK:
Build/modify the storefront based on the user's request. Be creative and modern!

RESPONSE FORMAT (JSON ONLY):
\`\`\`json
{
  "explanation": "I've created a hero section with...",
  "files": [
    {
      "path": "app/page.tsx",
      "content": "export default function HomePage() { return <div>...</div>; }",
      "action": "create",
      "reasoning": "Main homepage with hero and products"
    }
  ],
  "nextSuggestions": [
    "Add a navigation menu",
    "Create a product detail page"
  ]
}
\`\`\`

RULES:
- ONLY return valid JSON (no markdown, no explanations outside JSON)
- Use TypeScript for all .tsx files
- Use Tailwind for styling  
- Components must be async if they fetch data
- Always import from '@/lib/supabase' for data
- Use 'use client' for components with hooks
- Keep code clean and production-ready
- Make it look modern and professional

EXAMPLE OUTPUT:
\`\`\`json
{
  "explanation": "I've created a modern homepage with a hero section featuring your logo, and a product grid that loads from Supabase.",
  "files": [
    {
      "path": "app/page.tsx",
      "content": "export default async function HomePage() { return <div className='p-8'><h1>Home</h1></div>; }",
      "action": "create",
      "reasoning": "Main homepage with hero and product grid"
    }
  ],
  "nextSuggestions": ["Add navigation header", "Create product detail pages", "Add shopping cart"]
}
\`\`\``;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const vendorId = request.headers.get('x-vendor-id');
    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const { message, storefrontId, conversationHistory } = await request.json();
    
    console.log(`🔵 Generating code for storefront: ${storefrontId}`);
    
    const supabase = getServiceSupabase();
    
    // Get existing files for context
    const { data: existingFiles } = await supabase
      .from('storefront_files')
      .select('file_path, file_content')
      .eq('storefront_id', storefrontId)
      .order('created_at', { ascending: true });
    
    const filesContext = existingFiles && existingFiles.length > 0
      ? existingFiles.map(f => `// ${f.file_path}\n${f.file_content}`).join('\n\n---\n\n')
      : 'No files yet. Create from scratch.';
    
    // Build conversation for Claude
    const messages = [
      ...(conversationHistory || [])
        .filter((msg: any) => msg.role !== 'system' && msg.content) // Filter out system messages and empty content
        .map((msg: any) => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content || '',
        })),
      {
        role: 'user',
        content: `EXISTING FILES:\n${filesContext}\n\nNEW REQUEST:\n${message}\n\nGenerate the necessary files.`,
      },
    ].filter(m => m.content); // Ensure all messages have content
    
    console.log('🤖 Calling Claude Sonnet 4.5...');
    console.log(`   Messages: ${messages.length}`);
    
    // Call Claude
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: CODE_GENERATION_PROMPT,
      messages: messages as any,
    });
    
    console.log(`✅ Claude responded`);
    
    const aiText = response.content[0].type === 'text' ? response.content[0].text : '';
    
    // Extract JSON from response
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI did not return valid JSON');
    }
    
    const aiResponse = JSON.parse(jsonMatch[0]);
    
    console.log(`✅ AI generated ${aiResponse.files.length} files`);
    
    // Save files to database
    for (const file of aiResponse.files) {
      // Get current version
      const { data: existing } = await supabase
        .from('storefront_files')
        .select('version')
        .eq('storefront_id', storefrontId)
        .eq('file_path', file.path)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const newVersion = (existing?.version || 0) + 1;
      
      // Insert new version
      await supabase.from('storefront_files').insert({
        storefront_id: storefrontId,
        vendor_id: vendorId,
        file_path: file.path,
        file_content: file.content,
        file_type: file.path.split('.').pop(),
        version: newVersion,
        created_by_prompt: message,
        ai_explanation: file.reasoning,
      });
      
      console.log(`  ✅ Saved: ${file.path} (v${newVersion})`);
    }
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      explanation: aiResponse.explanation,
      files: aiResponse.files,
      filesModified: aiResponse.files.length,
      nextSuggestions: aiResponse.nextSuggestions || [],
      meta: {
        responseTime: `${responseTime}ms`,
      },
    });
    
  } catch (error: any) {
    console.error('❌ Code generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

