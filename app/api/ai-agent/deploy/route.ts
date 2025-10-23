import { NextRequest, NextResponse } from 'next/server';
import { AIStorefrontAgent } from '@/ai-agent/src/index';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

/**
 * AI Agent - Deploy Storefront to Vercel
 * POST /api/ai-agent/deploy
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
    
    const { storefrontId, domain } = await request.json();
    
    // Get vendor and storefront details
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
    
    const { data: storefront, error: storefrontError } = await supabase
      .from('vendor_storefronts')
      .select('*')
      .eq('id', storefrontId)
      .eq('vendor_id', vendorId)
      .single();
    
    if (storefrontError || !storefront) {
      return NextResponse.json(
        { success: false, error: 'Storefront not found' },
        { status: 404 }
      );
    }
    
    console.log(`🔵 Deploying storefront for ${vendor.store_name} to Vercel`);
    
    // Update status to building
    await supabase
      .from('vendor_storefronts')
      .update({ status: 'building' })
      .eq('id', storefrontId);
    
    // Initialize AI agent
    const agent = new AIStorefrontAgent();
    
    // Deploy to Vercel
    const result = await agent.deploy({
      vendorId: vendor.id,
      vendorSlug: vendor.slug,
      requirements: storefront.ai_specs,
      domain: domain,
    });
    
    if (!result.success) {
      // Update status to failed
      await supabase
        .from('vendor_storefronts')
        .update({ 
          status: 'failed',
          build_logs: result.error,
        })
        .eq('id', storefrontId);
      
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
    
    // Update storefront with deployment details
    await supabase
      .from('vendor_storefronts')
      .update({
        status: 'deployed',
        deployment_id: result.deploymentId,
        live_url: result.deploymentUrl,
        last_deployed_at: new Date().toISOString(),
      })
      .eq('id', storefrontId);
    
    // If custom domain, update vendor_domains table
    if (domain) {
      await supabase
        .from('vendor_domains')
        .upsert({
          vendor_id: vendorId,
          domain: domain,
          verified: false,
          dns_configured: false,
          ssl_status: 'pending',
        });
    }
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      deploymentUrl: result.deploymentUrl,
      deploymentId: result.deploymentId,
      storefrontId: storefrontId,
      meta: {
        responseTime: `${responseTime}ms`,
        vendor: vendor.store_name,
      },
    });
    
  } catch (error: any) {
    console.error('❌ AI Agent deploy error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Deployment failed' },
      { status: 500 }
    );
  }
}

