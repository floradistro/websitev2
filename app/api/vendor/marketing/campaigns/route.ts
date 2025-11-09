/**
 * Marketing Campaigns API
 * Returns list of campaigns (email, SMS, or AlpineIQ)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createAlpineIQClient } from '@/lib/marketing/alpineiq-client';
import { requireVendor } from '@/lib/auth/middleware';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get vendor info
    const { data: vendor } = await supabase
      .from('vendors')
      .select('marketing_provider, marketing_config')
      .eq('id', vendorId)
      .single();

    let campaigns = [];

    if (vendor?.marketing_provider === 'alpineiq') {
      // Get campaigns from AlpineIQ
      const alpineiq = createAlpineIQClient(vendor.marketing_config);
      const alpineiqCampaigns = await alpineiq.getCampaigns();

      // Transform to our format
      campaigns = alpineiqCampaigns.slice(0, limit).map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        type: campaign.type.toLowerCase(),
        status: campaign.isActive ? 'active' : (campaign.archived ? 'archived' : 'sent'),
        sent_at: campaign.scheduled ? new Date(campaign.scheduled * 1000).toISOString() : new Date().toISOString(),
        stats: {
          sent: campaign.summary?.msgsSent || 0,
          opened: campaign.summary?.emailOpens || 0,
          clicked: campaign.summary?.clicks || 0,
          revenue: campaign.summary?.revenue || 0,
        },
      }));
    } else {
      // Get campaigns from built-in system
      const { data: emailCampaigns } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })
        .limit(limit);

      campaigns = (emailCampaigns || []).map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        type: 'email',
        status: campaign.status,
        sent_at: campaign.sent_at || campaign.scheduled_for || campaign.created_at,
        stats: {
          sent: campaign.total_sent || 0,
          opened: campaign.total_opened || 0,
          clicked: campaign.total_clicked || 0,
          revenue: campaign.total_revenue || 0,
        },
      }));
    }

    return NextResponse.json(campaigns);
  } catch (error: any) {
    console.error('Campaigns API error:', error);
    return NextResponse.json(
      { error: 'Failed to load campaigns', message: error.message },
      { status: 500 }
    );
  }
}

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
      subject_line,
      preheader,
      html_body,
      plain_text_body,
      from_name,
      from_email,
      segment_id,
      schedule_type,
      scheduled_for,
      metadata,
    } = body;

    // Validate required fields
    if (!name || !subject_line || !html_body) {
      return NextResponse.json(
        { error: 'Missing required fields: name, subject_line, html_body' },
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
      // For AlpineIQ vendors, create campaign via their API
      const alpineiq = createAlpineIQClient(vendor.marketing_config);

      // Note: AlpineIQ campaign creation would happen here
      // For now, return error as AlpineIQ campaigns should be created in their dashboard
      return NextResponse.json(
        {
          error: 'AlpineIQ campaigns must be created in AlpineIQ dashboard',
          message: 'This vendor uses AlpineIQ. Please create campaigns at lab.alpineiq.com',
        },
        { status: 400 }
      );
    }

    // Create campaign in built-in system
    const campaignData: any = {
      vendor_id: vendorId,
      name,
      campaign_type: campaign_type || 'custom',
      subject_line,
      preheader,
      html_body,
      plain_text_body: plain_text_body || '',
      from_name: from_name || 'Marketing',
      from_email: from_email || `marketing@vendor-${vendorId.slice(0, 8)}.com`,
      segment_id: segment_id || null,
      status: schedule_type === 'now' ? 'sending' : 'scheduled',
      scheduled_for: schedule_type === 'scheduled' ? scheduled_for : null,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    };

    const { data: campaign, error: createError } = await supabase
      .from('email_campaigns')
      .insert(campaignData)
      .select()
      .single();

    if (createError) {
      console.error('Campaign creation error:', createError);
      return NextResponse.json(
        { error: 'Failed to create campaign', message: createError.message },
        { status: 500 }
      );
    }

    // If sending now, trigger sending process
    if (schedule_type === 'now') {
      // In a real implementation, this would trigger a background job
      // For now, we'll just update the status
      await supabase
        .from('email_campaigns')
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
    console.error('Campaign creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign', message: error.message },
      { status: 500 }
    );
  }
}
