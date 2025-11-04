'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Mail,
  MessageSquare,
  DollarSign,
  Users,
  MousePointerClick,
  Eye,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Filter,
} from 'lucide-react';
import { useAppAuth } from '@/context/AppAuthContext';
import type { MarketingAnalyticsData, TimeRange } from '@/types/analytics';
import { formatCurrency, formatPercentage, formatNumber } from '@/lib/analytics-utils';
import { TimeSeriesChart } from '@/components/analytics/TimeSeriesChart';
import { AnalyticsPageWrapper } from '@/components/analytics/AnalyticsPageWrapper';

function MarketingAnalyticsContent() {
  const { vendor } = useAppAuth();
  const [data, setData] = useState<MarketingAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [channelFilter, setChannelFilter] = useState<'all' | 'email' | 'sms'>('all');
  const [activeChartMetric, setActiveChartMetric] = useState<'sent' | 'opened' | 'clicked' | 'revenue'>('revenue');

  useEffect(() => {
    if (vendor) {
      loadAnalytics();
    }
  }, [vendor, timeRange, channelFilter]);

  const loadAnalytics = async () => {
    if (!vendor) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/vendor/marketing/analytics?range=${timeRange}&channel=${channelFilter}`,
        {
          headers: { 'x-vendor-id': vendor.id },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load analytics: ${response.statusText}`);
      }

      const analyticsData: MarketingAnalyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full px-4 lg:px-0 py-6">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white/20 border-r-white"></div>
          <p className="mt-4 text-white/40">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full px-4 lg:px-0 py-6">
        <div className="text-center py-12">
          <p className="text-red-400">{error || 'Failed to load analytics'}</p>
          <button
            onClick={loadAnalytics}
            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { overview, channelPerformance, topCampaigns, timeSeries } = data;
  const openRate = overview.avgOpenRate * 100;
  const clickRate = overview.avgClickRate * 100;

  // Helper function to render trend indicator
  const renderTrendIndicator = (trend: { changePercent: number; direction: 'up' | 'down' | 'neutral' }) => {
    if (trend.direction === 'neutral') {
      return (
        <div className="flex items-center gap-1 text-white/40 text-xs font-bold">
          <Minus className="w-3 h-3" />
          0%
        </div>
      );
    }

    const isPositive = trend.direction === 'up';
    const color = isPositive ? 'text-green-400' : 'text-red-400';
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

    return (
      <div className={`flex items-center gap-1 ${color} text-xs font-bold`}>
        <Icon className="w-3 h-3" />
        {formatPercentage(Math.abs(trend.changePercent), { decimals: 0, showSign: false })}
      </div>
    );
  };

  return (
    <div className="w-full px-4 lg:px-0 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white mb-2">Campaign Analytics</h1>
          <p className="text-white/60 text-sm">
            Track performance, revenue, and engagement across all campaigns
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time Range Filter */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-white/30"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>

          {/* Channel Filter */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as any)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-white/30"
          >
            <option value="all">All Channels</option>
            <option value="email">Email Only</option>
            <option value="sms">SMS Only</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-2xl p-6"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            {renderTrendIndicator(overview.trends.campaigns)}
          </div>
          <div className="text-2xl font-black text-white mb-1">
            {formatNumber(overview.totalCampaigns)}
          </div>
          <div className="text-xs uppercase tracking-wider text-white/60">Total Campaigns</div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-2xl p-6"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-green-400" />
            </div>
            {renderTrendIndicator(overview.trends.openRate)}
          </div>
          <div className="text-2xl font-black text-white mb-1">
            {formatPercentage(openRate, { decimals: 1 })}
          </div>
          <div className="text-xs uppercase tracking-wider text-white/60">Avg Open Rate</div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-2xl p-6"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <MousePointerClick className="w-5 h-5 text-purple-400" />
            </div>
            {renderTrendIndicator(overview.trends.clickRate)}
          </div>
          <div className="text-2xl font-black text-white mb-1">
            {formatPercentage(clickRate, { decimals: 1 })}
          </div>
          <div className="text-xs uppercase tracking-wider text-white/60">Avg Click Rate</div>
        </motion.div>

        <motion.div
          className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-2xl p-6"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-yellow-400" />
            </div>
            {renderTrendIndicator(overview.trends.revenue)}
          </div>
          <div className="text-2xl font-black text-white mb-1">
            {formatCurrency(overview.totalRevenue, { decimals: 0 })}
          </div>
          <div className="text-xs uppercase tracking-wider text-white/60">Total Revenue</div>
        </motion.div>
      </div>

      {/* Channel Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-bold">Email Performance</h3>
              <p className="text-xs text-white/60">
                {data.channel_performance.email.campaigns} campaigns
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Messages Sent</span>
              <span className="text-white font-bold">
                {formatNumber(channelPerformance.email.sent)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Opened</span>
              <span className="text-white font-bold">
                {formatNumber(channelPerformance.email.opened || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Clicked</span>
              <span className="text-white font-bold">
                {formatNumber(channelPerformance.email.clicked)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <span className="text-sm text-white/60">Revenue</span>
              <span className="text-green-400 font-bold text-lg">
                {formatCurrency(channelPerformance.email.revenue, { decimals: 0 })}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-white font-bold">SMS Performance</h3>
              <p className="text-xs text-white/60">
                {channelPerformance.sms.campaigns} campaigns
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Messages Sent</span>
              <span className="text-white font-bold">
                {formatNumber(channelPerformance.sms.sent)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Delivered</span>
              <span className="text-white font-bold">
                {formatNumber(channelPerformance.sms.delivered || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Clicked</span>
              <span className="text-white font-bold">
                {formatNumber(channelPerformance.sms.clicked)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <span className="text-sm text-white/60">Revenue</span>
              <span className="text-green-400 font-bold text-lg">
                {formatCurrency(channelPerformance.sms.revenue, { decimals: 0 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Campaigns */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-bold text-lg">Top Performing Campaigns</h3>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <TrendingUp className="w-4 h-4" />
            Sorted by revenue
          </div>
        </div>

        <div className="space-y-3">
          {topCampaigns.length === 0 ? (
            <div className="text-center py-8 text-white/40">No campaign data yet</div>
          ) : (
            topCampaigns.map((campaign, index) => (
              <div
                key={campaign.id}
                className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">#{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="text-white font-bold">{campaign.name}</h4>
                        <p className="text-xs text-white/60">
                          {campaign.type.toUpperCase()} •{' '}
                          {new Date(campaign.sentAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm ml-11">
                      <div>
                        <span className="text-white/40">Sent: </span>
                        <span className="text-white font-bold">
                          {formatNumber(campaign.sent)}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/40">Open: </span>
                        <span className="text-white font-bold">
                          {formatPercentage(campaign.openRate * 100, { decimals: 1 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/40">Click: </span>
                        <span className="text-white font-bold">
                          {formatPercentage(campaign.clickRate * 100, { decimals: 1 })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-green-400">
                      {formatCurrency(campaign.revenue, { decimals: 0 })}
                    </div>
                    <div className="text-xs text-white/60">Revenue</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Time Series Chart */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white font-bold text-lg">Performance Over Time</h3>
            <p className="text-white/40 text-xs mt-1">
              Track your campaign metrics across the selected time period
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(['sent', 'opened', 'clicked', 'revenue'] as const).map((metric) => (
              <button
                key={metric}
                onClick={() => setActiveChartMetric(metric)}
                className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition-all ${
                  activeChartMetric === metric
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20'
                }`}
              >
                {metric.charAt(0).toUpperCase() + metric.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <TimeSeriesChart
          data={timeSeries}
          activeMetric={activeChartMetric}
          height={320}
          className="mt-4"
        />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <AnalyticsPageWrapper>
      <MarketingAnalyticsContent />
    </AnalyticsPageWrapper>
  );
}
