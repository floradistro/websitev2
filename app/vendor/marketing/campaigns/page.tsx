"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  Sparkles,
  Send,
  Eye,
  MousePointerClick,
  Calendar,
  Users,
  Zap,
  Settings,
  ShoppingBag,
  Gift,
  Heart,
  Package,
  Star,
  Percent,
  PartyPopper,
  Plus,
  ArrowRight,
} from "lucide-react";
import { useAppAuth } from "@/context/AppAuthContext";
import Image from "next/image";
import { PageLoader } from "@/components/vendor/VendorSkeleton";
import { pageLayouts } from "@/lib/design-system";

type TabType = "overview" | "campaigns" | "automation" | "settings";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "paused" | "cancelled";
  total_recipients: number;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  send_at: string | null;
  sent_at: string | null;
  created_at: string;
}

// Campaign templates with visual previews
const campaignTemplates = [
  {
    id: "sale",
    name: "Flash Sale",
    description: "Limited time discount",
    icon: Percent,
    preview: {
      subject: "⚡ Flash Sale: 30% Off Everything",
      previewText: "24 hours only. Your favorite products, massive savings.",
      gradient: "from-orange-500/20 to-red-500/20",
    },
  },
  {
    id: "new-product",
    name: "New Arrivals",
    description: "Product launch announcement",
    icon: Package,
    preview: {
      subject: "🌟 Just Dropped: New Premium Strains",
      previewText: "GMO, Blue Zushi, and Lemon Cherry Gelato now available.",
      gradient: "from-blue-500/20 to-purple-500/20",
    },
  },
  {
    id: "loyalty",
    name: "Reward Members",
    description: "Exclusive loyalty perks",
    icon: Star,
    preview: {
      subject: "⭐ Double Points Weekend Starts Now",
      previewText: "Earn 2x loyalty points on every purchase this weekend.",
      gradient: "from-yellow-500/20 to-orange-500/20",
    },
  },
  {
    id: "win-back",
    name: "Win Back",
    description: "Re-engage inactive customers",
    icon: Heart,
    preview: {
      subject: "💚 We Miss You — Come Back for 20% Off",
      previewText: "It's been a while. Here's something special to welcome you back.",
      gradient: "from-green-500/20 to-emerald-500/20",
    },
  },
  {
    id: "event",
    name: "Special Event",
    description: "Holiday & event promotions",
    icon: PartyPopper,
    preview: {
      subject: "🎉 420 Celebration: Biggest Sale of the Year",
      previewText: "Join us for exclusive deals, free gifts, and surprise drops.",
      gradient: "from-purple-500/20 to-pink-500/20",
    },
  },
  {
    id: "custom",
    name: "Custom Campaign",
    description: "AI writes anything you want",
    icon: Sparkles,
    preview: {
      subject: "Tell AI what you want to send...",
      previewText: "Describe your campaign and AI creates it in seconds.",
      gradient: "from-white/10 to-white/5",
    },
  },
];

export default function MarketingPage() {
  const { vendor } = useAppAuth();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    avgOpenRate: 0,
    avgClickRate: 0,
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    if (vendor) {
      loadCampaigns();
    }
  }, [vendor]);

  async function loadCampaigns() {
    if (!vendor) return;

    setLoading(true);

    try {
      const response = await fetch("/api/vendor/campaigns", {
        headers: {
          "x-vendor-id": vendor.id,
        },
      });
      const data = await response.json();

      if (!data.error) {
        setCampaigns(data.campaigns || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error("Failed to load campaigns:", error);
    }

    setLoading(false);
  }

  const statusColors = {
    draft: "bg-white/5 text-white/40 border-white/10",
    scheduled: "bg-white/10 text-white/70 border-white/20",
    sending: "bg-white/10 text-white/70 border-white/20",
    sent: "bg-white/10 text-white/70 border-white/20",
    paused: "bg-white/5 text-white/50 border-white/10",
    cancelled: "bg-white/5 text-white/30 border-white/10",
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Not scheduled";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const calculateRate = (count: number, total: number) => {
    if (total === 0) return 0;
    return ((count / total) * 100).toFixed(1);
  };

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: Sparkles },
    { id: "campaigns" as TabType, label: "Campaigns", icon: Send },
    { id: "automation" as TabType, label: "Automation", icon: Zap },
    { id: "settings" as TabType, label: "Settings", icon: Settings },
  ];

  return (
    <div className={pageLayouts.page}>
      <div className={pageLayouts.content}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">

            {/* Quick Stats */}
            <div className="hidden lg:flex items-center gap-6">
              <div className="text-right">
                <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Open Rate</div>
                <div className="text-2xl font-light text-white/80">{stats.avgOpenRate}%</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Click Rate</div>
                <div className="text-2xl font-light text-white/80">{stats.avgClickRate}%</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-white/30 uppercase tracking-wider mb-1">Total Sent</div>
                <div className="text-2xl font-light text-white/80">{stats.sent.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-white/[0.04]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-[11px] uppercase tracking-[0.15em] font-medium transition-all duration-200 relative ${
                    isActive ? "text-white" : "text-white/40 hover:text-white/60"
                  }`}
                >
                  <Icon size={14} strokeWidth={isActive ? 2 : 1.5} />
                  {tab.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-t-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Template Gallery */}
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-light text-white/90 tracking-tight mb-2">
                  Create a Campaign
                </h2>
                <p className="text-xs text-white/40 font-light">
                  Choose a template and AI will write compelling copy in seconds
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {campaignTemplates.map((template) => {
                  const Icon = template.icon;
                  const isSelected = selectedTemplate === template.id;

                  return (
                    <Link
                      key={template.id}
                      href={`/vendor/marketing/campaigns/new?template=${template.id}`}
                      onMouseEnter={() => setSelectedTemplate(template.id)}
                      onMouseLeave={() => setSelectedTemplate(null)}
                      className="group relative bg-white/[0.02] border border-white/[0.06] rounded-3xl overflow-hidden hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300"
                    >
                      {/* Preview Section */}
                      <div className={`bg-gradient-to-br ${template.preview.gradient} p-8 border-b border-white/[0.06] relative overflow-hidden`}>
                        {/* Email Preview Card */}
                        <div className="bg-[#0a0a0a] rounded-2xl p-5 border border-white/[0.1] shadow-2xl transform group-hover:scale-[1.02] transition-transform duration-300">
                          <div className="flex items-center gap-2 mb-4">
                            {/* Vendor Logo or Icon */}
                            {vendor?.logo_url ? (
                              <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center overflow-hidden flex-shrink-0">
                                <Image
                                  src={vendor.logo_url}
                                  alt={vendor.store_name || "Store"}
                                  width={32}
                                  height={32}
                                  className="object-contain w-full h-full p-1"
                                />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center flex-shrink-0">
                                <Icon className="w-4 h-4 text-white/60" strokeWidth={1.5} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5">
                                {vendor?.store_name || "Your Store"}
                              </div>
                              <div className="text-xs text-white/90 font-light truncate">
                                {template.preview.subject}
                              </div>
                            </div>
                          </div>
                          <p className="text-[10px] text-white/60 leading-relaxed font-light line-clamp-2">
                            {template.preview.previewText}
                          </p>
                        </div>

                        {/* Floating Icon */}
                        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/[0.03] blur-2xl" />
                      </div>

                      {/* Info Section */}
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-light text-white/90 mb-1 tracking-tight group-hover:text-white transition-colors">
                              {template.name}
                            </h3>
                            <p className="text-xs text-white/40 font-light">
                              {template.description}
                            </p>
                          </div>
                          <ArrowRight
                            className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all"
                            strokeWidth={1.5}
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Recent Campaigns */}
            {campaigns.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-light text-white/90 tracking-tight">
                    Recent Campaigns
                  </h2>
                  <button
                    onClick={() => setActiveTab("campaigns")}
                    className="text-xs text-white/40 hover:text-white/70 uppercase tracking-[0.15em] transition-colors"
                  >
                    View All
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {campaigns.slice(0, 4).map((campaign) => (
                    <Link
                      key={campaign.id}
                      href={`/vendor/marketing/campaigns/${campaign.id}`}
                      className="group bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-sm font-light text-white/90 tracking-tight truncate">
                              {campaign.name}
                            </h3>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-light border flex-shrink-0 ${
                                statusColors[campaign.status]
                              }`}
                            >
                              {campaign.status}
                            </span>
                          </div>
                          <p className="text-xs text-white/40 truncate">{campaign.subject}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-[10px] text-white/30">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3 h-3" strokeWidth={1.5} />
                            <span>{campaign.total_recipients.toLocaleString()}</span>
                          </div>
                          {campaign.status === "sent" && campaign.total_sent > 0 && (
                            <>
                              <div className="flex items-center gap-1.5">
                                <Eye className="w-3 h-3" strokeWidth={1.5} />
                                <span>{calculateRate(campaign.total_opened, campaign.total_sent)}%</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MousePointerClick className="w-3 h-3" strokeWidth={1.5} />
                                <span>{calculateRate(campaign.total_clicked, campaign.total_sent)}%</span>
                              </div>
                            </>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all" strokeWidth={1.5} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State for First Time */}
            {campaigns.length === 0 && !loading && (
              <div className="mt-8 bg-gradient-to-br from-white/[0.02] to-white/[0.01] border border-white/[0.06] rounded-3xl p-16 text-center">
                <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-white/30" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-light text-white/70 mb-3 tracking-tight">
                  Ready to send your first campaign?
                </h3>
                <p className="text-xs text-white/40 max-w-md mx-auto tracking-wide font-light leading-relaxed">
                  Pick a template above and AI will create beautiful, converting emails in seconds
                </p>
              </div>
            )}
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === "campaigns" && (
          <div>
            {!loading && campaigns.length === 0 ? (
              <div className="bg-gradient-to-br from-white/[0.02] to-white/[0.01] border border-white/[0.06] rounded-3xl p-16 text-center">
                <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-6">
                  <Send className="w-10 h-10 text-white/30" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-light text-white/70 mb-3 tracking-tight">
                  No campaigns yet
                </h3>
                <p className="text-xs text-white/40 mb-8 max-w-md mx-auto tracking-wide font-light leading-relaxed">
                  Create your first campaign from the Overview tab
                </p>
                <button
                  onClick={() => setActiveTab("overview")}
                  className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl text-[11px] uppercase tracking-[0.15em] font-medium hover:bg-white/90 transition-all duration-200"
                >
                  <Sparkles size={14} strokeWidth={2} />
                  Choose Template
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    href={`/vendor/marketing/campaigns/${campaign.id}`}
                    className="block bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-sm font-light text-white/90 tracking-tight">
                            {campaign.name}
                          </h3>
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] uppercase tracking-[0.15em] font-light border ${
                              statusColors[campaign.status]
                            }`}
                          >
                            {campaign.status}
                          </span>
                        </div>
                        <p className="text-xs text-white/40 mb-4 truncate">{campaign.subject}</p>

                        <div className="flex items-center gap-4 text-[10px] text-white/30">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" strokeWidth={1.5} />
                            <span>
                              {campaign.status === "sent"
                                ? formatDate(campaign.sent_at)
                                : formatDate(campaign.send_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3 h-3" strokeWidth={1.5} />
                            <span>{campaign.total_recipients.toLocaleString()} recipients</span>
                          </div>
                        </div>
                      </div>

                      {campaign.status === "sent" && campaign.total_sent > 0 && (
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className="text-[10px] text-white/30 mb-1 uppercase tracking-wider">Opens</div>
                            <div className="text-lg font-light text-white/80">
                              {calculateRate(campaign.total_opened, campaign.total_sent)}%
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] text-white/30 mb-1 uppercase tracking-wider">Clicks</div>
                            <div className="text-lg font-light text-white/80">
                              {calculateRate(campaign.total_clicked, campaign.total_sent)}%
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Automation Tab */}
        {activeTab === "automation" && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-light text-white/90 mb-2 tracking-tight">
                Automated Emails
              </h2>
              <p className="text-xs text-white/40 font-light leading-relaxed">
                Configure transactional emails sent automatically. Click to customize design and sender settings.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[
                {
                  id: "order_confirmation",
                  name: "Order Confirmation",
                  description: "Sent immediately after purchase",
                  icon: ShoppingBag,
                  critical: true,
                },
                {
                  id: "order_ready",
                  name: "Order Ready",
                  description: "Pickup notification",
                  icon: Package,
                  critical: true,
                },
                {
                  id: "welcome",
                  name: "Welcome Email",
                  description: "New customer onboarding",
                  icon: Sparkles,
                  critical: false,
                },
                {
                  id: "loyalty_earned",
                  name: "Points Earned",
                  description: "Loyalty point notification",
                  icon: Star,
                  critical: false,
                },
              ].map((email) => {
                const Icon = email.icon;
                return (
                  <Link
                    key={email.id}
                    href={`/vendor/marketing/automation/${email.id}`}
                    className="group bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-white/40 group-hover:text-white/60 transition-colors" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-light text-white/80 tracking-tight group-hover:text-white transition-colors">
                            {email.name}
                          </h3>
                          {email.critical && (
                            <span className="text-[9px] uppercase tracking-wider text-white/30 bg-white/[0.04] px-2 py-0.5 rounded">
                              Critical
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/40 font-light mb-3">{email.description}</p>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500/60" />
                          <span className="text-[10px] text-white/40 uppercase tracking-wider">Active</span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all flex-shrink-0" strokeWidth={1.5} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="max-w-2xl">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8">
              <h3 className="text-sm font-light text-white/80 mb-2 tracking-tight">
                Default Email Settings
              </h3>
              <p className="text-xs text-white/40 font-light mb-6 leading-relaxed">
                These are the default settings for all campaigns. System emails can override these.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="text-[11px] uppercase tracking-[0.15em] text-white/40 mb-2 block font-light">
                    From Name
                  </label>
                  <input
                    type="text"
                    defaultValue={vendor?.store_name || "Your Store"}
                    className="w-full bg-white/[0.02] border border-white/[0.06] text-white/80 px-4 py-3 rounded-xl text-sm font-light focus:outline-none focus:border-white/[0.1] focus:bg-white/[0.04] transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-[0.15em] text-white/40 mb-2 block font-light">
                    From Email
                  </label>
                  <input
                    type="email"
                    defaultValue="noreply@floradistro.com"
                    className="w-full bg-white/[0.02] border border-white/[0.06] text-white/80 px-4 py-3 rounded-xl text-sm font-light focus:outline-none focus:border-white/[0.1] focus:bg-white/[0.04] transition-all"
                  />
                  <p className="text-[10px] text-white/20 mt-2 font-light">
                    Must be verified in Resend dashboard
                  </p>
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-[0.15em] text-white/40 mb-2 block font-light">
                    Reply-To Email
                  </label>
                  <input
                    type="email"
                    placeholder="support@floradistro.com"
                    className="w-full bg-white/[0.02] border border-white/[0.06] text-white/80 px-4 py-3 rounded-xl text-sm font-light focus:outline-none focus:border-white/[0.1] focus:bg-white/[0.04] placeholder:text-white/20 transition-all"
                  />
                </div>

                <div className="pt-4">
                  <button className="bg-white text-black px-6 py-3 rounded-xl text-[11px] uppercase tracking-[0.15em] font-medium hover:bg-white/90 transition-all duration-200">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
