'use client';

import { useEffect, useState } from 'react';
import { useAppAuth } from '@/context/AppAuthContext';
import { motion } from 'framer-motion';
import {
  Megaphone,
  Mail,
  MessageSquare,
  Users,
  TrendingUp,
  Gift,
  Zap,
  Calendar,
  BarChart3,
  Send,
  Eye,
  MousePointerClick,
  DollarSign,
  Wallet,
  Settings,
} from 'lucide-react';
import Link from 'next/link';

interface MarketingStats {
  total_campaigns: number;
  active_campaigns: number;
  total_customers: number;
  segment_count: number;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  total_revenue: number;
  loyalty_members?: number;
}

interface RecentCampaign {
  id: string;
  name: string;
  type: string;
  status: string;
  sent_at: string;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
    revenue: number;
  };
}

export default function MarketingPage() {
  const { vendor } = useAppAuth();

  const [stats, setStats] = useState<MarketingStats | null>(null);
  const [recentCampaigns, setRecentCampaigns] = useState<RecentCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<'builtin' | 'alpineiq'>('builtin');

  useEffect(() => {
    if (vendor) {
      loadMarketingData();
    }
  }, [vendor]);

  async function loadMarketingData() {
    if (!vendor) return;
    try {
      // Load marketing stats
      const statsRes = await fetch(`/api/vendor/marketing/stats`, {
        headers: { 'x-vendor-id': vendor.id },
      });
      const statsData = await statsRes.json();
      setStats(statsData);

      // Load recent campaigns
      const campaignsRes = await fetch(`/api/vendor/marketing/campaigns?limit=5`, {
        headers: { 'x-vendor-id': vendor.id },
      });
      const campaignsData = await campaignsRes.json();
      setRecentCampaigns(campaignsData);

      // Set provider
      setProvider(vendor.marketing_provider || 'builtin');
    } catch (error) {
      console.error('Failed to load marketing data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Quick action cards
  const quickActions = [
    {
      name: 'Email Campaign',
      description: 'Create and send email campaigns',
      icon: Mail,
      route: '/vendor/marketing/email/new',
      color: 'from-blue-500/20 to-blue-600/20',
      iconColor: 'text-blue-400',
      available: true,
    },
    {
      name: 'SMS Campaign',
      description: 'Send text message campaigns',
      icon: MessageSquare,
      route: '/vendor/marketing/sms/new',
      color: 'from-green-500/20 to-green-600/20',
      iconColor: 'text-green-400',
      available: true,
    },
    {
      name: 'Customer Segments',
      description: 'Target specific customer groups',
      icon: Users,
      route: '/vendor/marketing/segments',
      color: 'from-purple-500/20 to-purple-600/20',
      iconColor: 'text-purple-400',
      available: true,
    },
    {
      name: 'Automation Rules',
      description: 'Set up automated marketing',
      icon: Zap,
      route: '/vendor/marketing/automation',
      color: 'from-yellow-500/20 to-yellow-600/20',
      iconColor: 'text-yellow-400',
      available: true,
    },
    {
      name: 'Analytics',
      description: 'View campaign performance',
      icon: BarChart3,
      route: '/vendor/marketing/analytics',
      color: 'from-cyan-500/20 to-cyan-600/20',
      iconColor: 'text-cyan-400',
      available: true,
    },
    {
      name: 'Loyalty Program',
      description: provider === 'alpineiq' ? 'Managed by AlpineIQ' : 'Coming soon - Manage rewards & points',
      icon: Gift,
      route: provider === 'alpineiq' ? '#' : '/vendor/marketing/loyalty',
      color: 'from-pink-500/20 to-pink-600/20',
      iconColor: 'text-pink-400',
      available: false, // Disabled for all - AlpineIQ handles their own loyalty
    },
    {
      name: 'Wallet Passes',
      description: 'Coming soon - Apple & Google Wallet cards',
      icon: Wallet,
      route: '/vendor/marketing/wallet',
      color: 'from-indigo-500/20 to-indigo-600/20',
      iconColor: 'text-indigo-400',
      available: false,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 lg:px-0 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xs uppercase tracking-[0.15em] text-white font-black mb-1">
              Marketing Hub
            </h1>
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/40">
              Campaigns · Segments · Automation · Loyalty
            </p>
          </div>

          <div className="flex items-center gap-3">
            {provider === 'alpineiq' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-green-400 font-medium">AlpineIQ Connected</span>
              </div>
            )}

            <Link
              href="/vendor/marketing/settings"
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl transition-all"
            >
              <Settings size={16} className="text-white/60" />
              <span className="text-xs text-white/80">Settings</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Campaigns"
          value={stats?.total_campaigns || 0}
          subtext={`${stats?.active_campaigns || 0} active`}
          icon={Megaphone}
          color="blue"
        />
        <StatCard
          label="Total Customers"
          value={stats?.total_customers || 0}
          subtext={`${stats?.segment_count || 0} segments`}
          icon={Users}
          color="purple"
        />
        <StatCard
          label="Messages Sent"
          value={stats?.total_sent || 0}
          subtext={`${calculateRate(stats?.total_opened, stats?.total_sent)}% open rate`}
          icon={Send}
          color="green"
        />
        <StatCard
          label="Campaign Revenue"
          value={`$${(stats?.total_revenue || 0).toFixed(0)}`}
          subtext={`${calculateRate(stats?.total_clicked, stats?.total_sent)}% click rate`}
          icon={DollarSign}
          color="yellow"
        />
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xs uppercase tracking-[0.15em] text-white/60 font-black mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <QuickActionCard key={action.name} {...action} />
          ))}
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs uppercase tracking-[0.15em] text-white/60 font-black">
            Recent Campaigns
          </h2>
          <Link
            href="/vendor/marketing/campaigns"
            className="text-xs text-white/60 hover:text-white transition-colors"
          >
            View All →
          </Link>
        </div>

        {recentCampaigns.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <Megaphone size={48} className="mx-auto mb-4 text-white/20" />
            <h3 className="text-white/60 font-medium mb-2">No campaigns yet</h3>
            <p className="text-white/40 text-sm mb-4">
              Create your first campaign to reach your customers
            </p>
            <Link
              href="/vendor/marketing/email/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white transition-all"
            >
              <Mail size={16} />
              Create Email Campaign
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  subtext: string;
  icon: any;
  color: 'blue' | 'purple' | 'green' | 'yellow';
}) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/20 text-purple-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/20 text-green-400',
    yellow: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/20 text-yellow-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-gradient-to-br ${colorClasses[color]} border rounded-2xl p-6 overflow-hidden`}
    >
      <Icon size={24} className="mb-4" />
      <div className="text-2xl font-black text-white mb-1">{value}</div>
      <div className="text-xs text-white/60 mb-1">{label}</div>
      <div className="text-[10px] text-white/40">{subtext}</div>
    </motion.div>
  );
}

// Quick Action Card Component
function QuickActionCard({
  name,
  description,
  icon: Icon,
  route,
  color,
  iconColor,
  available,
}: any) {
  const Component = available ? Link : 'div';

  return (
    <Component
      href={available ? route : '#'}
      className={`group relative bg-gradient-to-br ${color} border border-white/10 rounded-2xl p-6 transition-all ${
        available
          ? 'hover:border-white/30 hover:scale-[1.02] cursor-pointer'
          : 'opacity-50 cursor-not-allowed'
      }`}
    >
      <Icon size={32} className={`${iconColor} mb-4`} />
      <h3 className="text-white font-black text-lg mb-1">{name}</h3>
      <p className="text-white/60 text-sm">{description}</p>
      {!available && (
        <div className="absolute top-4 right-4 text-xs text-white/40 bg-white/10 px-2 py-1 rounded">
          Coming Soon
        </div>
      )}
    </Component>
  );
}

// Campaign Card Component
function CampaignCard({ campaign }: { campaign: RecentCampaign }) {
  const openRate = calculateRate(campaign.stats.opened, campaign.stats.sent);
  const clickRate = calculateRate(campaign.stats.clicked, campaign.stats.sent);

  return (
    <Link
      href={`/vendor/marketing/campaigns/${campaign.id}`}
      className="block bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl p-6 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-white font-medium mb-1">{campaign.name}</h3>
          <div className="flex items-center gap-3 text-xs text-white/40">
            <span className="capitalize">{campaign.type}</span>
            <span>•</span>
            <span>{new Date(campaign.sent_at).toLocaleDateString()}</span>
            <span>•</span>
            <span className={`capitalize ${campaign.status === 'sent' ? 'text-green-400' : 'text-yellow-400'}`}>
              {campaign.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
            <Send size={12} />
            Sent
          </div>
          <div className="text-white font-bold">{campaign.stats.sent.toLocaleString()}</div>
        </div>
        <div>
          <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
            <Eye size={12} />
            Opened
          </div>
          <div className="text-white font-bold">{openRate}%</div>
        </div>
        <div>
          <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
            <MousePointerClick size={12} />
            Clicked
          </div>
          <div className="text-white font-bold">{clickRate}%</div>
        </div>
        <div>
          <div className="flex items-center gap-2 text-white/40 text-xs mb-1">
            <DollarSign size={12} />
            Revenue
          </div>
          <div className="text-white font-bold">${campaign.stats.revenue.toFixed(0)}</div>
        </div>
      </div>
    </Link>
  );
}

// Utility function
function calculateRate(numerator?: number, denominator?: number): number {
  if (!numerator || !denominator || denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}
