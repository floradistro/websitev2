"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Instagram,
  Facebook,
  Wallet,
  Sparkles,
  Send,
  Calendar,
  Users,
  TrendingUp,
  Eye,
  MousePointerClick,
  DollarSign,
  Settings,
  Play,
  Pause,
  Copy,
  Trash2,
  BarChart3,
  Target,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { useAppAuth } from "@/context/AppAuthContext";
import { showSuccess, showError } from "@/components/NotificationToast";
import { PageLoader } from "@/components/vendor/VendorSkeleton";

type TabType = "overview" | "channels" | "audience" | "analytics" | "settings";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "paused" | "cancelled";
  objective: "awareness" | "engagement" | "conversion" | "retention" | "loyalty";
  channels: string[];
  total_recipients: number;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  total_engaged: number;
  total_revenue: number;
  send_at: string | null;
  sent_at: string | null;
  ai_prompt?: string;
  ai_generated_at?: string;
  created_at: string;
  updated_at: string;
}

interface ChannelData {
  id: string;
  channel: "email" | "instagram" | "facebook" | "wallet";
  content: any;
  sent_count: number;
  opened_count: number;
  engaged_count: number;
  converted_count: number;
  revenue: number;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  ai_generated: boolean;
}

const channelConfig = {
  email: {
    icon: Mail,
    label: "Email",
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30",
    iconColor: "text-blue-400",
  },
  instagram: {
    icon: Instagram,
    label: "Instagram",
    color: "from-pink-500/20 to-purple-500/20",
    borderColor: "border-pink-500/30",
    iconColor: "text-pink-400",
  },
  facebook: {
    icon: Facebook,
    label: "Facebook",
    color: "from-blue-600/20 to-indigo-500/20",
    borderColor: "border-blue-600/30",
    iconColor: "text-blue-500",
  },
  wallet: {
    icon: Wallet,
    label: "Apple Wallet",
    color: "from-gray-500/20 to-slate-500/20",
    borderColor: "border-gray-500/30",
    iconColor: "text-gray-400",
  },
};

const objectiveConfig = {
  awareness: { icon: Eye, label: "Brand Awareness", color: "text-purple-400" },
  engagement: { icon: MousePointerClick, label: "Engagement", color: "text-blue-400" },
  conversion: { icon: DollarSign, label: "Conversion", color: "text-green-400" },
  retention: { icon: Users, label: "Retention", color: "text-orange-400" },
  loyalty: { icon: Sparkles, label: "Loyalty", color: "text-yellow-400" },
};

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { vendor } = useAppAuth();
  const campaignId = params.campaignId as string;

  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  useEffect(() => {
    if (vendor && campaignId) {
      loadCampaignData();
    }
  }, [vendor, campaignId]);

  async function loadCampaignData() {
    try {
      setLoading(true);

      // Load campaign
      const campaignRes = await fetch(`/api/vendor/campaigns/${campaignId}`, {
        headers: { "x-vendor-id": vendor!.id },
      });
      const campaignData = await campaignRes.json();

      if (campaignData.error) {
        showError(campaignData.error);
        return;
      }

      setCampaign(campaignData.campaign);

      // Load channels
      const channelsRes = await fetch(`/api/vendor/campaigns/${campaignId}/channels`, {
        headers: { "x-vendor-id": vendor!.id },
      });
      const channelsData = await channelsRes.json();

      if (!channelsData.error) {
        setChannels(channelsData.channels || []);
      }
    } catch (error) {
      console.error("Failed to load campaign:", error);
      showError("Failed to load campaign");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <PageLoader />;
  }

  if (!campaign) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Campaign Not Found</h2>
          <p className="text-gray-400 mb-4">The campaign you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push("/vendor/marketing/campaigns")}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
          >
            ← Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  const ObjectiveIcon = objectiveConfig[campaign.objective].icon;
  const statusColor = {
    draft: "text-gray-400",
    scheduled: "text-blue-400",
    sending: "text-yellow-400",
    sent: "text-green-400",
    paused: "text-orange-400",
    cancelled: "text-red-400",
  }[campaign.status];

  const engagementRate = campaign.total_sent > 0
    ? ((campaign.total_engaged / campaign.total_sent) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/vendor/marketing/campaigns")}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </button>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{campaign.name}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${statusColor} bg-white/5`}>
                {campaign.status}
              </span>
              {campaign.ai_generated_at && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  ✨ AI Generated
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <ObjectiveIcon className={`w-4 h-4 ${objectiveConfig[campaign.objective].color}`} />
                {objectiveConfig[campaign.objective].label}
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                {campaign.total_recipients.toLocaleString()} recipients
              </div>
              {campaign.send_at && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(campaign.send_at).toLocaleDateString()}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all flex items-center gap-2">
              <Copy className="w-4 h-4" />
              Duplicate
            </button>
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </button>
            {campaign.status === "draft" && (
              <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all flex items-center gap-2 font-medium">
                <Send className="w-4 h-4" />
                Send Campaign
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10 mb-8">
        <div className="flex gap-6">
          {[
            { id: "overview" as TabType, label: "Overview", icon: BarChart3 },
            { id: "channels" as TabType, label: "Channels", icon: Zap },
            { id: "audience" as TabType, label: "Audience", icon: Users },
            { id: "analytics" as TabType, label: "Analytics", icon: TrendingUp },
            { id: "settings" as TabType, label: "Settings", icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-2 border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-purple-500 text-white"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Performance Overview */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Total Sent</span>
                <Send className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {campaign.total_sent.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">
                {campaign.total_recipients > 0 &&
                  `${((campaign.total_sent / campaign.total_recipients) * 100).toFixed(0)}% of recipients`}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Engaged</span>
                <MousePointerClick className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {campaign.total_engaged.toLocaleString()}
              </div>
              <div className="text-xs text-green-400 font-medium">{engagementRate}% rate</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Clicked</span>
                <Target className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {campaign.total_clicked.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">
                {campaign.total_sent > 0 &&
                  `${((campaign.total_clicked / campaign.total_sent) * 100).toFixed(1)}% CTR`}
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Revenue</span>
                <DollarSign className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                ${campaign.total_revenue.toFixed(0)}
              </div>
              <div className="text-xs text-gray-400">
                {campaign.total_sent > 0 &&
                  `$${(campaign.total_revenue / campaign.total_sent).toFixed(2)} per send`}
              </div>
            </div>
          </div>

          {/* Multi-Channel Performance */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              Multi-Channel Performance
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {channels.map((channelData) => {
                const config = channelConfig[channelData.channel];
                const Icon = config.icon;
                const channelEngagement = channelData.sent_count > 0
                  ? ((channelData.engaged_count / channelData.sent_count) * 100).toFixed(1)
                  : "0.0";

                return (
                  <div
                    key={channelData.id}
                    className={`bg-gradient-to-br ${config.color} border ${config.borderColor} rounded-xl p-6`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-black/20`}>
                          <Icon className={`w-5 h-5 ${config.iconColor}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{config.label}</h3>
                          <p className="text-xs text-gray-400">{channelData.status}</p>
                        </div>
                      </div>
                      {channelData.ai_generated && (
                        <span className="text-xs text-purple-400">
                          <Sparkles className="w-4 h-4" />
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-400 mb-1">Sent</div>
                        <div className="text-lg font-bold text-white">
                          {channelData.sent_count.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-1">Engaged</div>
                        <div className="text-lg font-bold text-white">
                          {channelEngagement}%
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400 mb-1">Revenue</div>
                        <div className="text-lg font-bold text-white">
                          ${channelData.revenue.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {channels.length === 0 && (
                <div className="col-span-2 text-center py-12 text-gray-400">
                  <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No channel data available yet</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Generation Info */}
          {campaign.ai_prompt && (
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-2">AI-Generated Campaign</h3>
                  <p className="text-sm text-gray-300 mb-2">{campaign.ai_prompt}</p>
                  <p className="text-xs text-gray-400">
                    Generated on {new Date(campaign.ai_generated_at!).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "channels" && (
        <div className="text-center py-12 text-gray-400">
          <Zap className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Channel editor coming soon</p>
          <p className="text-sm">Manage content for each channel: Email, Instagram, Facebook, Wallet</p>
        </div>
      )}

      {activeTab === "audience" && (
        <div className="text-center py-12 text-gray-400">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Audience targeting coming soon</p>
          <p className="text-sm">Smart segmentation with AI-powered insights</p>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="text-center py-12 text-gray-400">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Advanced analytics coming soon</p>
          <p className="text-sm">Customer journey mapping and attribution</p>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="text-center py-12 text-gray-400">
          <Settings className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Campaign settings coming soon</p>
          <p className="text-sm">Configure scheduling, targeting, and more</p>
        </div>
      )}
    </div>
  );
}
