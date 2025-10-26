import { NextRequest, NextResponse } from 'next/server';

/**
 * POST - Trigger AI storefront generation
 * Calls the Agent SDK server to generate complete storefront
 */
export async function POST(request: NextRequest) {
  try {
    const { vendorId, vendorData } = await request.json();
    
    if (!vendorId || !vendorData) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: vendorId, vendorData' },
        { status: 400 }
      );
    }
    
    const agentUrl = process.env.MCP_AGENT_URL || 'http://localhost:3001';
    const agentSecret = process.env.MCP_AGENT_SECRET || 'yacht-club-secret-2025';
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🤖 Triggering AI generation for: ${vendorData.store_name}`);
    console.log(`   Agent URL: ${agentUrl}`);
    console.log(`${'='.repeat(60)}\n`);
    
    // Call AI Agent server
    const response = await fetch(`${agentUrl}/api/generate-storefront`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${agentSecret}`
      },
      body: JSON.stringify({
        vendorId,
        vendorData
      }),
      signal: AbortSignal.timeout(120000) // 2 minute timeout
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Agent server error:', response.status, error);
      throw new Error(`Agent server error: ${response.status}`);
    }
    
    const result = await response.json();
    
    console.log(`\n${'='.repeat(60)}`);
    if (result.success) {
      console.log(`✅ GENERATION SUCCESS`);
      console.log(`   Sections: ${result.sectionsCreated}`);
      console.log(`   Components: ${result.componentsCreated}`);
      console.log(`   URL: ${result.storefrontUrl}`);
    } else {
      console.log(`❌ GENERATION FAILED`);
      console.log(`   Errors: ${result.errors?.join(', ')}`);
    }
    console.log(`${'='.repeat(60)}\n`);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('Generation trigger error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to trigger generation'
      },
      { status: 500 }
    );
  }
}

