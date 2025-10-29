/**
 * Marketing Analytics API
 * Returns aggregated campaign performance data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    const channel = searchParams.get('channel') || 'all';

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 400 });
    }

    // Calculate date range
    const startDate = getStartDate(range);

    // Get campaign data
    const emailCampaigns = await getEmailCampaigns(vendorId, startDate, channel);
    const smsCampaigns = await getSMSCampaigns(vendorId, startDate, channel);

    // Aggregate overview stats
    const overview = calculateOverview([...emailCampaigns, ...smsCampaigns]);

    // Channel performance
    const channelPerformance = {
      email: calculateChannelStats(emailCampaigns),
      sms: calculateChannelStats(smsCampaigns),
    };

    // Top performing campaigns
    const allCampaigns = [...emailCampaigns, ...smsCampaigns]
      .map((c) => ({
        ...c,
        open_rate: c.total_sent > 0 ? c.total_opened / c.total_sent : 0,
        click_rate: c.total_sent > 0 ? c.total_clicked / c.total_sent : 0,
      }))
      .sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))
      .slice(0, 10);

    // Time series data (simplified)
    const timeSeries = generateTimeSeries([...emailCampaigns, ...smsCampaigns], startDate);

    return NextResponse.json({
      overview,
      channel_performance: channelPerformance,
      top_campaigns: allCampaigns.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type || 'email',
        sent_at: c.sent_at || c.created_at,
        sent: c.total_sent || 0,
        opened: c.total_opened || 0,
        clicked: c.total_clicked || 0,
        revenue: c.total_revenue || 0,
        open_rate: c.open_rate,
        click_rate: c.click_rate,
      })),
      time_series: timeSeries,
    });
  } catch (error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to load analytics', message: error.message },
      { status: 500 }
    );
  }
}

function getStartDate(range: string): string {
  const now = new Date();
  switch (range) {
    case '7d':
      now.setDate(now.getDate() - 7);
      break;
    case '30d':
      now.setDate(now.getDate() - 30);
      break;
    case '90d':
      now.setDate(now.getDate() - 90);
      break;
    case 'all':
      return '2000-01-01';
    default:
      now.setDate(now.getDate() - 30);
  }
  return now.toISOString();
}

async function getEmailCampaigns(vendorId: string, startDate: string, channel: string) {
  if (channel === 'sms') return [];

  const { data } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('vendor_id', vendorId)
    .gte('created_at', startDate);

  return (data || []).map((c) => ({ ...c, type: 'email' }));
}

async function getSMSCampaigns(vendorId: string, startDate: string, channel: string) {
  if (channel === 'email') return [];

  const { data } = await supabase
    .from('sms_campaigns')
    .select('*')
    .eq('vendor_id', vendorId)
    .gte('created_at', startDate);

  return (data || []).map((c) => ({ ...c, type: 'sms', total_opened: c.total_delivered || 0 }));
}

function calculateOverview(campaigns: any[]) {
  const totalSent = campaigns.reduce((sum, c) => sum + (c.total_sent || 0), 0);
  const totalOpened = campaigns.reduce((sum, c) => sum + (c.total_opened || 0), 0);
  const totalClicked = campaigns.reduce((sum, c) => sum + (c.total_clicked || 0), 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + (c.total_revenue || 0), 0);

  return {
    total_campaigns: campaigns.length,
    total_sent: totalSent,
    total_opened: totalOpened,
    total_clicked: totalClicked,
    total_revenue: totalRevenue,
    avg_open_rate: totalSent > 0 ? totalOpened / totalSent : 0,
    avg_click_rate: totalSent > 0 ? totalClicked / totalSent : 0,
    revenue_per_campaign: campaigns.length > 0 ? totalRevenue / campaigns.length : 0,
  };
}

function calculateChannelStats(campaigns: any[]) {
  return {
    campaigns: campaigns.length,
    sent: campaigns.reduce((sum, c) => sum + (c.total_sent || 0), 0),
    opened: campaigns.reduce((sum, c) => sum + (c.total_opened || 0), 0),
    delivered: campaigns.reduce((sum, c) => sum + (c.total_delivered || 0), 0),
    clicked: campaigns.reduce((sum, c) => sum + (c.total_clicked || 0), 0),
    revenue: campaigns.reduce((sum, c) => sum + (c.total_revenue || 0), 0),
  };
}

function generateTimeSeries(campaigns: any[], startDate: string): any[] {
  // Group campaigns by date and aggregate stats
  const dateMap = new Map<string, any>();

  campaigns.forEach((campaign) => {
    const date = new Date(campaign.sent_at || campaign.created_at).toISOString().split('T')[0];

    if (!dateMap.has(date)) {
      dateMap.set(date, {
        date,
        sent: 0,
        opened: 0,
        clicked: 0,
        revenue: 0,
      });
    }

    const dayData = dateMap.get(date);
    dayData.sent += campaign.total_sent || 0;
    dayData.opened += campaign.total_opened || 0;
    dayData.clicked += campaign.total_clicked || 0;
    dayData.revenue += campaign.total_revenue || 0;
  });

  return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}
