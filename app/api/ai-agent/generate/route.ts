import { NextRequest, NextResponse } from 'next/server';
import { AIStorefrontAgent } from '@/ai-agent/src/index';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

/**
 * AI Agent - Generate Storefront from Natural Language
 * POST /api/ai-agent/generate
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID required' },
        { status: 401 }
      );
    }
    
    const { message, history } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }
    
    // Get vendor details from Supabase
    const supabase = getServiceSupabase();
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, slug, store_name')
      .eq('id', vendorId)
      .single();
    
    if (vendorError || !vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      );
    }
    
    console.log(`🔵 Generating storefront for ${vendor.store_name} (${vendor.slug})`);
    
    // Initialize AI agent
    const agent = new AIStorefrontAgent();
    
    // Generate storefront
    const result = await agent.generate({
      vendorId: vendor.id,
      vendorSlug: vendor.slug,
      userMessage: message,
      conversationHistory: history || [],
    });
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
    
    // Save conversation to database
    if (result.requirements) {
      await supabase.from('ai_conversations').insert({
        vendor_id: vendorId,
        messages: [
          ...(history || []),
          { role: 'user', content: message },
          { role: 'assistant', content: result.response },
        ],
      });
    }
    
    // Save storefront specification
    const { data: storefront } = await supabase
      .from('vendor_storefronts')
      .insert({
        vendor_id: vendorId,
        template: result.requirements?.theme.style,
        customizations: result.requirements,
        ai_specs: result.requirements,
        status: 'draft',
      })
      .select()
      .single();
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      requirements: result.requirements,
      response: result.response,
      confidence: result.confidence,
      storefrontId: storefront?.id,
      previewUrl: `/api/ai-agent/preview/${storefront?.id}`,
      meta: {
        responseTime: `${responseTime}ms`,
        filesGenerated: result.files?.length || 0,
      },
    });
    
  } catch (error: any) {
    console.error('❌ AI Agent generate error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Generation failed' },
      { status: 500 }
    );
  }
}

