/**
 * Marketing Analytics API
 * Returns aggregated campaign performance data with trend analysis
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { MarketingAnalyticsData, TimeRange, ChannelType } from "@/types/analytics";
import {
  getStartDate,
  getComparisonPeriod,
  calculateTrend,
  calculatePercentage,
  safeParseFloat,
  safeParseInt,
  isValidTimeRange,
  isValidVendorId,
} from "@/lib/analytics-utils";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ============================================================================
// Types
// ============================================================================

interface CampaignData {
  id: string;
  name: string;
  type: "email" | "sms";
  vendor_id: string;
  created_at: string;
  sent_at?: string;
  total_sent: number;
  total_opened: number;
  total_delivered?: number;
  total_clicked: number;
  total_revenue: number;
}

// ============================================================================
// Main Handler
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "30d";
    const channel = searchParams.get("channel") || "all";

    if (!isValidTimeRange(range)) {
      return NextResponse.json(
        { error: "Invalid time range. Use: 7d, 30d, 90d, 1y, or all" },
        { status: 400 },
      );
    }

    // Get current period data
    const currentStart = getStartDate(range as TimeRange);
    const [emailCampaigns, smsCampaigns] = await Promise.all([
      getEmailCampaigns(vendorId!, currentStart.toISOString(), channel as ChannelType),
      getSMSCampaigns(vendorId!, currentStart.toISOString(), channel as ChannelType),
    ]);

    // Get comparison period data for trends
    const comparisonPeriod = getComparisonPeriod(range as TimeRange);
    const [prevEmailCampaigns, prevSmsCampaigns] = await Promise.all([
      getEmailCampaigns(
        vendorId!,
        comparisonPeriod.start.toISOString(),
        channel as ChannelType,
        comparisonPeriod.end,
      ),
      getSMSCampaigns(
        vendorId!,
        comparisonPeriod.start.toISOString(),
        channel as ChannelType,
        comparisonPeriod.end,
      ),
    ]);

    // Aggregate all data
    const currentCampaigns = [...emailCampaigns, ...smsCampaigns];
    const previousCampaigns = [...prevEmailCampaigns, ...prevSmsCampaigns];

    // Build response
    const analyticsData: MarketingAnalyticsData = {
      overview: calculateOverview(currentCampaigns, previousCampaigns),
      channelPerformance: {
        email: calculateChannelStats(emailCampaigns),
        sms: calculateChannelStats(smsCampaigns),
      },
      topCampaigns: getTopCampaigns(currentCampaigns),
      timeSeries: generateTimeSeries(currentCampaigns, currentStart),
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("[Marketing Analytics API] Error:", error);
    }
    return NextResponse.json(
      {
        error: "Failed to load analytics",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// ============================================================================
// Data Fetching Functions
// ============================================================================

async function getEmailCampaigns(
  vendorId: string,
  startDate: string,
  channel: ChannelType,
  endDate?: Date,
): Promise<CampaignData[]> {
  if (channel === "sms") return [];

  let query = supabase
    .from("email_campaigns")
    .select(
      "id, name, vendor_id, created_at, sent_at, total_sent, total_opened, total_clicked, total_revenue",
    )
    .eq("vendor_id", vendorId)
    .gte("created_at", startDate);

  if (endDate) {
    query = query.lte("created_at", endDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("[getEmailCampaigns] Error:", error);
    }
    throw new Error(`Failed to fetch email campaigns: ${error.message}`);
  }

  return (data || []).map((c) => ({
    ...c,
    type: "email" as const,
    total_sent: safeParseInt(c.total_sent),
    total_opened: safeParseInt(c.total_opened),
    total_clicked: safeParseInt(c.total_clicked),
    total_revenue: safeParseFloat(c.total_revenue),
  }));
}

async function getSMSCampaigns(
  vendorId: string,
  startDate: string,
  channel: ChannelType,
  endDate?: Date,
): Promise<CampaignData[]> {
  if (channel === "email") return [];

  let query = supabase
    .from("sms_campaigns")
    .select(
      "id, name, vendor_id, created_at, sent_at, total_sent, total_delivered, total_clicked, total_revenue",
    )
    .eq("vendor_id", vendorId)
    .gte("created_at", startDate);

  if (endDate) {
    query = query.lte("created_at", endDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("[getSMSCampaigns] Error:", error);
    }
    throw new Error(`Failed to fetch SMS campaigns: ${error.message}`);
  }

  return (data || []).map((c) => ({
    ...c,
    type: "sms" as const,
    total_sent: safeParseInt(c.total_sent),
    total_opened: safeParseInt(c.total_delivered), // SMS uses delivered as "opened"
    total_delivered: safeParseInt(c.total_delivered),
    total_clicked: safeParseInt(c.total_clicked),
    total_revenue: safeParseFloat(c.total_revenue),
  }));
}

// ============================================================================
// Calculation Functions
// ============================================================================

function calculateOverview(currentCampaigns: CampaignData[], previousCampaigns: CampaignData[]) {
  // Current period aggregates
  const totalSent = currentCampaigns.reduce((sum, c) => sum + c.total_sent, 0);
  const totalOpened = currentCampaigns.reduce((sum, c) => sum + c.total_opened, 0);
  const totalClicked = currentCampaigns.reduce((sum, c) => sum + c.total_clicked, 0);
  const totalRevenue = currentCampaigns.reduce((sum, c) => sum + c.total_revenue, 0);

  // Previous period aggregates
  const prevSent = previousCampaigns.reduce((sum, c) => sum + c.total_sent, 0);
  const prevOpened = previousCampaigns.reduce((sum, c) => sum + c.total_opened, 0);
  const prevClicked = previousCampaigns.reduce((sum, c) => sum + c.total_clicked, 0);
  const prevRevenue = previousCampaigns.reduce((sum, c) => sum + c.total_revenue, 0);

  // Calculate rates
  const avgOpenRate = calculatePercentage(totalOpened, totalSent) / 100;
  const avgClickRate = calculatePercentage(totalClicked, totalSent) / 100;
  const prevOpenRate = calculatePercentage(prevOpened, prevSent) / 100;
  const prevClickRate = calculatePercentage(prevClicked, prevSent) / 100;

  return {
    totalCampaigns: currentCampaigns.length,
    totalSent,
    totalOpened,
    totalClicked,
    totalRevenue,
    avgOpenRate,
    avgClickRate,
    revenuePerCampaign: currentCampaigns.length > 0 ? totalRevenue / currentCampaigns.length : 0,
    trends: {
      campaigns: calculateTrend(currentCampaigns.length, previousCampaigns.length),
      openRate: calculateTrend(avgOpenRate, prevOpenRate),
      clickRate: calculateTrend(avgClickRate, prevClickRate),
      revenue: calculateTrend(totalRevenue, prevRevenue),
    },
  };
}

function calculateChannelStats(campaigns: CampaignData[]) {
  const sent = campaigns.reduce((sum, c) => sum + c.total_sent, 0);
  const clicked = campaigns.reduce((sum, c) => sum + c.total_clicked, 0);
  const revenue = campaigns.reduce((sum, c) => sum + c.total_revenue, 0);

  return {
    campaigns: campaigns.length,
    sent,
    opened: campaigns.reduce((sum, c) => sum + c.total_opened, 0),
    delivered: campaigns.reduce((sum, c) => sum + (c.total_delivered || 0), 0),
    clicked,
    revenue,
    conversionRate: calculatePercentage(clicked, sent) / 100,
  };
}

function getTopCampaigns(campaigns: CampaignData[]) {
  return campaigns
    .map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      sentAt: c.sent_at || c.created_at,
      sent: c.total_sent,
      opened: c.total_opened,
      clicked: c.total_clicked,
      revenue: c.total_revenue,
      openRate: calculatePercentage(c.total_opened, c.total_sent) / 100,
      clickRate: calculatePercentage(c.total_clicked, c.total_sent) / 100,
      conversionRate: calculatePercentage(c.total_clicked, c.total_sent) / 100,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
}

function generateTimeSeries(campaigns: CampaignData[], startDate: Date) {
  const dateMap = new Map<
    string,
    {
      date: string;
      sent: number;
      opened: number;
      clicked: number;
      revenue: number;
    }
  >();

  campaigns.forEach((campaign) => {
    const date = new Date(campaign.sent_at || campaign.created_at).toISOString().split("T")[0];

    if (!dateMap.has(date)) {
      dateMap.set(date, {
        date,
        sent: 0,
        opened: 0,
        clicked: 0,
        revenue: 0,
      });
    }

    const dayData = dateMap.get(date)!;
    dayData.sent += campaign.total_sent;
    dayData.opened += campaign.total_opened;
    dayData.clicked += campaign.total_clicked;
    dayData.revenue += campaign.total_revenue;
  });

  return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}
