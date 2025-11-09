/**
 * SMS Campaigns API
 * Create and manage SMS campaigns
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAlpineIQClient } from '@/lib/marketing/alpineiq-client';
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
      name,
      campaign_type,
      message_body,
      segment_id,
      schedule_type,
      scheduled_for,
      metadata,
    } = body;

    // Validate required fields
    if (!name || !message_body) {
      return NextResponse.json(
        { error: 'Missing required fields: name, message_body' },
        { status: 400 }
      );
    }

    // Get vendor info
    const { data: vendor } = await supabase
      .from('vendors')
      .select('marketing_provider, marketing_config')
      .eq('id', vendorId)
      .single();

    if (vendor?.marketing_provider === 'alpineiq') {
      // For AlpineIQ vendors, SMS campaigns should be created in their dashboard
      return NextResponse.json(
        {
          error: 'AlpineIQ SMS campaigns must be created in AlpineIQ dashboard',
          message: 'This vendor uses AlpineIQ. Please create SMS campaigns at lab.alpineiq.com',
        },
        { status: 400 }
      );
    }

    // Create SMS campaign in built-in system
    const campaignData: any = {
      vendor_id: vendorId,
      name,
      campaign_type: campaign_type || 'custom',
      message_body,
      segment_id: segment_id || null,
      status: schedule_type === 'now' ? 'sending' : 'scheduled',
      scheduled_for: schedule_type === 'scheduled' ? scheduled_for : null,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    };

    const { data: campaign, error: createError } = await supabase
      .from('sms_campaigns')
      .insert(campaignData)
      .select()
      .single();

    if (createError) {
      console.error('SMS campaign creation error:', createError);
      return NextResponse.json(
        { error: 'Failed to create SMS campaign', message: createError.message },
        { status: 500 }
      );
    }

    // If sending now, trigger sending process
    if (schedule_type === 'now') {
      // In a real implementation, this would trigger Twilio sending
      // For now, we'll just update the status
      await supabase
        .from('sms_campaigns')
        .update({ sent_at: new Date().toISOString(), status: 'sent' })
        .eq('id', campaign.id);
    }

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        created_at: campaign.created_at,
      },
    });
  } catch (error: any) {
    console.error('SMS campaign creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create SMS campaign', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get SMS campaigns from built-in system
    const { data: smsCampaigns } = await supabase
      .from('sms_campaigns')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(limit);

    const campaigns = (smsCampaigns || []).map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      type: 'sms',
      status: campaign.status,
      sent_at: campaign.sent_at || campaign.scheduled_for || campaign.created_at,
      stats: {
        sent: campaign.total_sent || 0,
        delivered: campaign.total_delivered || 0,
        clicked: campaign.total_clicked || 0,
        revenue: campaign.total_revenue || 0,
      },
    }));

    return NextResponse.json(campaigns);
  } catch (error: any) {
    console.error('SMS campaigns API error:', error);
    return NextResponse.json(
      { error: 'Failed to load SMS campaigns', message: error.message },
      { status: 500 }
    );
  }
}
