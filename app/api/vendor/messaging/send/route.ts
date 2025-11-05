import { NextRequest, NextResponse } from 'next/server';
import { requireVendor } from '@/lib/auth/middleware';
import { createClient } from '@supabase/supabase-js';
import { createAlpineIQClient } from '@/lib/marketing/alpineiq-client';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/vendor/messaging/send
 * Send SMS or Email campaign via Alpine IQ
 *
 * Body:
 * {
 *   type: 'sms' | 'email',
 *   segment: string, // SQL-like filter: "loyalty_tier = 'gold'" or "all"
 *   message: string,
 *   subject?: string, // Required for email
 *   campaignName?: string,
 *   sendAt?: string // ISO date string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const vendorId = authResult.vendorId;
    const body = await request.json();

    const { type, segment, message, subject, campaignName, sendAt } = body;

    if (!type || !segment || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (type === 'email' && !subject) {
      return NextResponse.json(
        { success: false, error: 'Subject required for email' },
        { status: 400 }
      );
    }

    // Get vendor's Alpine IQ config
    const { data: vendor } = await supabase
      .from('vendors')
      .select('marketing_provider, marketing_config')
      .eq('id', vendorId)
      .single();

    if (!vendor || vendor.marketing_provider !== 'alpineiq') {
      return NextResponse.json(
        { success: false, error: 'Alpine IQ not configured for this vendor' },
        { status: 400 }
      );
    }

    // Create Alpine IQ client
    const alpineiq = createAlpineIQClient(vendor.marketing_config);

    // Get customers based on segment
    let query = supabase
      .from('customers')
      .select('id, email, phone, first_name, last_name')
      .eq('vendor_id', vendorId);

    // Apply segment filter
    if (segment !== 'all') {
      // Parse segment filter (simple version)
      // Examples: "loyalty_tier = 'gold'", "loyalty_points > 100"
      const [field, operator, value] = segment.split(/\s+/);
      const cleanValue = value?.replace(/['"]/g, '');

      if (operator === '=') {
        query = query.eq(field, cleanValue);
      } else if (operator === '>') {
        query = query.gt(field, parseInt(cleanValue));
      } else if (operator === '<') {
        query = query.lt(field, parseInt(cleanValue));
      } else if (operator === '>=') {
        query = query.gte(field, parseInt(cleanValue));
      } else if (operator === '<=') {
        query = query.lte(field, parseInt(cleanValue));
      }
    }

    const { data: customers, error: customersError } = await query;

    if (customersError || !customers || customers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No customers match segment', details: customersError },
        { status: 400 }
      );
    }

    // Send via Alpine IQ
    let result;

    if (type === 'sms') {
      result = await alpineiq.sendBulkSMS({
        customers: customers.map(c => ({ phone: c.phone })),
        message,
        campaignName: campaignName || `SMS Campaign ${new Date().toLocaleDateString()}`,
        sendAt: sendAt ? new Date(sendAt) : undefined,
      });
    } else {
      result = await alpineiq.sendBulkEmail({
        customers: customers.map(c => ({ email: c.email })),
        subject: subject!,
        htmlContent: message,
        campaignName: campaignName || `Email Campaign ${new Date().toLocaleDateString()}`,
        sendAt: sendAt ? new Date(sendAt) : undefined,
      });
    }

    // Log campaign
    await supabase.from('marketing_campaigns').insert({
      vendor_id: vendorId,
      name: campaignName || result.campaignId,
      type: type,
      provider: 'alpineiq',
      provider_campaign_id: result.campaignId,
      recipients_count: result.recipientCount,
      segment: segment,
      message_content: message,
      subject: subject,
      scheduled_at: sendAt ? new Date(sendAt).toISOString() : new Date().toISOString(),
      status: 'scheduled',
    });

    return NextResponse.json({
      success: true,
      campaignId: result.campaignId,
      recipientCount: result.recipientCount,
      message: `${type.toUpperCase()} campaign created for ${result.recipientCount} customers`,
    });

  } catch (error: any) {
    console.error('Messaging send error:', error);

    // Check for Alpine IQ specific errors
    if (error.message?.includes('10dlc')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Message template not approved',
          details: 'Your message content needs to be approved by carriers. Contact Alpine IQ support to get message templates approved, or check their dashboard for approved templates.',
          alpineError: error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send campaign',
      },
      { status: 500 }
    );
  }
}
