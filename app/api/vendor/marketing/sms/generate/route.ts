/**
 * AI SMS Generation API
 * Generates SMS content using OpenAI
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSMSGenerator } from '@/lib/marketing/sms-generator';
import { requireVendor } from '@/lib/auth/middleware';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const {
      campaignType,
      productData,
      discountData,
      includeLink,
      additionalContext,
    } = body;

    // Get vendor info
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, vendor_name')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Initialize SMS generator
    const generator = createSMSGenerator(process.env.OPENAI_API_KEY);

    // Generate SMS content
    const generatedSMS = await generator.generateMessage({
      vendor: {
        id: vendor.id,
        name: vendor.vendor_name,
      },
      campaignType,
      productData,
      discountData,
      includeLink,
      additionalContext,
    });

    return NextResponse.json({
      success: true,
      sms: generatedSMS,
    });
  } catch (error: any) {
    console.error('SMS generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate SMS',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
