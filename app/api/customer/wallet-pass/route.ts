import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AlpineIQClient } from '@/lib/marketing/alpineiq-client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/customer/wallet-pass?customer_id=xxx
 * Get Apple Wallet and Google Wallet pass links for a customer's loyalty card
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Wallet Pass] API called');
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customer_id');

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    console.log('[Wallet Pass] Creating Supabase client');
    // Create Supabase client directly with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uaednwpxursknmwdeejn.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVhZWRud3B4dXJza25td2RlZWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDk5NzIzMywiZXhwIjoyMDc2NTczMjMzfQ.l0NvBbS2JQWPObtWeVD2M2LD866A2tgLmModARYNnbI',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get customer info
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, email, phone, first_name, last_name, loyalty_points, loyalty_tier')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Check if customer has Alpine IQ contact ID
    const { data: mapping } = await supabase
      .from('alpineiq_customer_mapping')
      .select('alpineiq_customer_id')
      .eq('customer_id', customerId)
      .single();

    if (!mapping) {
      // Customer not synced to Alpine IQ yet
      // This typically happens automatically when they make their first purchase
      // For now, return an error prompting them to make a purchase first
      console.log('[Wallet Pass] Customer not enrolled in Alpine IQ yet:', customer.email);

      return NextResponse.json(
        {
          success: false,
          error: 'Please make a purchase first to enroll in our loyalty program',
          needsEnrollment: true
        },
        { status: 400 }
      );
    }

    // Customer already synced - generate web wallet URL
    // Alpine IQ's web wallet URL auto-generates passes on first visit
    const alpineUserId = process.env.ALPINE_USER_ID || '3999';
    const contactId = mapping.alpineiq_customer_id;
    const webWalletUrl = `https://lab.alpineiq.com/wallet/${alpineUserId}/${contactId}`;

    console.log('[Wallet Pass] Generated web wallet URL for contact:', contactId);

    return NextResponse.json({
      success: true,
      customer: {
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email,
        loyaltyPoints: customer.loyalty_points,
        loyaltyTier: customer.loyalty_tier
      },
      walletPass: {
        apple: webWalletUrl,
        google: webWalletUrl
      },
      webWalletUrl: webWalletUrl
    });

  } catch (error: any) {
    console.error('Wallet pass API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get wallet pass' },
      { status: 500 }
    );
  }
}
