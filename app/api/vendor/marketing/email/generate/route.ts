/**
 * AI Email Generation API
 * Generates email content using OpenAI
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createEmailGenerator } from '@/lib/marketing/email-generator';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 400 });
    }

    const body = await request.json();
    const {
      campaignType,
      productData,
      discountData,
      customerSegment,
      additionalContext,
    } = body;

    // Get vendor info
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, vendor_name, logo_url, brand_colors')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Initialize email generator
    const generator = createEmailGenerator(process.env.OPENAI_API_KEY);

    // Generate email content
    const generatedEmail = await generator.generateCampaign({
      vendor: {
        id: vendor.id,
        name: vendor.vendor_name,
        logo_url: vendor.logo_url,
        brand_colors: vendor.brand_colors || {
          primary: '#22c55e',
          secondary: '#000000',
        },
      },
      campaignType,
      productData,
      discountData,
      customerSegment,
      additionalContext,
    });

    return NextResponse.json({
      success: true,
      email: generatedEmail,
    });
  } catch (error: any) {
    console.error('Email generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate email',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
