import { NextRequest, NextResponse } from 'next/server';
import { NLPProcessor } from '@/ai-agent/src/nlp/processor';
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
    
    // Use NLP processor directly (templates not needed for specs)
    const processor = new NLPProcessor('anthropic');
    
    const { requirements, response, confidence } = await processor.processVendorRequest(
      message,
      history || []
    );
    
    console.log(`✅ AI generated specs with ${(confidence * 100).toFixed(0)}% confidence`);
    
    // Save conversation to database
    await supabase.from('ai_conversations').insert({
      vendor_id: vendorId,
      messages: [
        ...(history || []),
        { role: 'user', content: message },
        { role: 'assistant', content: response },
      ],
    });
    
    // Save storefront specification
    const { data: storefront } = await supabase
      .from('vendor_storefronts')
      .insert({
        vendor_id: vendorId,
        template: requirements?.theme.style,
        customizations: requirements,
        ai_specs: requirements,
        status: 'draft',
      })
      .select()
      .single();
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      requirements: requirements,
      response: response,
      confidence: confidence,
      storefrontId: storefront?.id,
      previewUrl: `/api/ai-agent/preview/${storefront?.id}`,
      meta: {
        responseTime: `${responseTime}ms`,
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
