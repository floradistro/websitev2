"use client";

import { useEffect, useState } from "react";
import { useAppAuth } from "@/context/AppAuthContext";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import {
  Wallet,
  Smartphone,
  Download,
  Send,
  Eye,
  RefreshCw,
  Copy,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface WalletStats {
  total_passes: number;
  active_passes: number;
  total_devices: number;
  passes_added_today: number;
  passes_added_this_week: number;
  passes_added_this_month: number;
}

export default function MarketingDashboard() {
  const { vendor } = useAppAuth();
  const [stats, setStats] = useState<WalletStats>({
    total_passes: 0,
    active_passes: 0,
    total_devices: 0,
    passes_added_today: 0,
    passes_added_this_week: 0,
    passes_added_this_month: 0,
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [testCustomers, setTestCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [generatingTest, setGeneratingTest] = useState(false);

  useEffect(() => {
    if (vendor) {
      loadData();
    }
  }, [vendor]);

  async function loadData() {
    if (!vendor) return;
    try {
      // Load stats
      const statsRes = await fetch(`/api/vendor/apple-wallet/stats?vendor_id=${vendor.id}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.stats);
        }
      }

      // Load test customers
      const { data: customers } = await supabase
        .from("customers")
        .select("id, first_name, last_name, email, loyalty_points, loyalty_tier")
        .limit(5);

      if (customers?.length) {
        setTestCustomers(customers);
        setSelectedCustomer(customers[0].id);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Failed to load data:", error);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateTestPass() {
    if (!selectedCustomer || !vendor) return;

    setGeneratingTest(true);
    try {
      const url = `/api/customer/wallet-pass?customer_id=${selectedCustomer}&vendor_id=${vendor.id}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to generate pass");
      }

      // Download the pass
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "test-loyalty-pass.pkpass";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      // Refresh stats
      await loadData();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Failed to generate test pass:", error);
      }
      alert("Failed to generate test pass. Check console for errors.");
    } finally {
      setGeneratingTest(false);
    }
  }

  const shareUrl = vendor ? `${window.location.origin}/customer/wallet?vendor=${vendor.slug}` : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-xs text-white/40">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">Marketing</h1>
              <p className="text-sm text-white/40 mt-1">
                Digital loyalty cards with automatic updates
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-12">
          <StatCard label="Total Passes" value={stats.total_passes} sublabel="All time" />
          <StatCard
            label="Active Passes"
            value={stats.active_passes}
            sublabel="In customer wallets"
          />
          <StatCard
            label="This Week"
            value={stats.passes_added_this_week}
            sublabel={`${stats.passes_added_today} today`}
          />
          <StatCard label="Devices" value={stats.total_devices} sublabel="Registered for updates" />
        </div>

        {/* Test Pass Generation + Preview */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Pass Preview */}
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8">
            <h2 className="text-lg font-medium text-white mb-2">Wallet Pass Preview</h2>
            <p className="text-sm text-white/40 mb-6">
              How your loyalty card will look in Apple Wallet
            </p>

            {/* Pass Card Preview */}
            <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-2xl overflow-hidden shadow-2xl border border-emerald-800/30">
              {/* Header with Logo */}
              <div className="px-6 py-4 flex items-center gap-3 border-b border-white/10">
                {vendor?.logo_url ? (
                  <img
                    src={vendor.logo_url}
                    alt={vendor.store_name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="text-white font-medium text-sm">
                    {vendor?.store_name || "Your Store"}
                  </div>
                  <div className="text-white/60 text-xs">Loyalty Card</div>
                </div>
              </div>

              {/* Points Section */}
              <div className="px-6 py-8 text-center border-b border-white/10">
                <div className="text-6xl font-bold text-white tracking-tight mb-1">
                  2,392 <span className="text-2xl font-normal">PTS</span>
                </div>
              </div>

              {/* Details Row */}
              <div className="px-6 py-4 grid grid-cols-3 gap-4 text-center border-b border-white/10">
                <div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
                    Tier
                  </div>
                  <div className="text-sm text-white font-medium">🥉 Bronze</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
                    Member
                  </div>
                  <div className="text-sm text-white font-medium">Customer</div>
                </div>
                <div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
                    Since
                  </div>
                  <div className="text-sm text-white font-medium">Oct 2025</div>
                </div>
              </div>

              {/* Member ID */}
              <div className="px-6 py-3 text-center border-b border-white/10">
                <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
                  Member #
                </div>
                <div className="text-xs text-white/80 font-mono">CUSTOMER-EC6E5597</div>
              </div>

              {/* QR Code - Beautiful Edge to Edge */}
              <div className="p-6 flex flex-col items-center gap-2 bg-gradient-to-b from-transparent to-black/20">
                <div className="w-full aspect-square max-w-[200px] bg-white rounded-xl overflow-hidden shadow-lg p-4">
                  <svg
                    viewBox="0 0 29 29"
                    className="w-full h-full"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Beautiful QR Code Pattern */}
                    <rect width="29" height="29" fill="white" />
                    {/* Corner squares */}
                    <rect x="0" y="0" width="7" height="7" fill="black" />
                    <rect x="22" y="0" width="7" height="7" fill="black" />
                    <rect x="0" y="22" width="7" height="7" fill="black" />
                    <rect x="1" y="1" width="5" height="5" fill="white" />
                    <rect x="23" y="1" width="5" height="5" fill="white" />
                    <rect x="1" y="23" width="5" height="5" fill="white" />
                    <rect x="2" y="2" width="3" height="3" fill="black" />
                    <rect x="24" y="2" width="3" height="3" fill="black" />
                    <rect x="2" y="24" width="3" height="3" fill="black" />
                    {/* Pattern blocks */}
                    <rect x="9" y="0" width="1" height="1" fill="black" />
                    <rect x="11" y="0" width="1" height="1" fill="black" />
                    <rect x="13" y="0" width="1" height="1" fill="black" />
                    <rect x="15" y="0" width="1" height="1" fill="black" />
                    <rect x="9" y="2" width="1" height="1" fill="black" />
                    <rect x="13" y="2" width="1" height="1" fill="black" />
                    <rect x="9" y="4" width="1" height="1" fill="black" />
                    <rect x="11" y="4" width="1" height="1" fill="black" />
                    <rect x="13" y="4" width="3" height="1" fill="black" />
                    <rect x="9" y="6" width="1" height="1" fill="black" />
                    <rect x="12" y="6" width="2" height="1" fill="black" />
                    <rect x="16" y="6" width="3" height="1" fill="black" />
                    {/* Center pattern */}
                    <rect x="10" y="10" width="9" height="9" fill="black" />
                    <rect x="11" y="11" width="7" height="7" fill="white" />
                    <rect x="13" y="13" width="3" height="3" fill="black" />
                    {/* More pattern */}
                    <rect x="0" y="9" width="1" height="1" fill="black" />
                    <rect x="2" y="9" width="1" height="1" fill="black" />
                    <rect x="4" y="9" width="2" height="1" fill="black" />
                    <rect x="20" y="9" width="1" height="1" fill="black" />
                    <rect x="22" y="11" width="2" height="1" fill="black" />
                    <rect x="25" y="11" width="2" height="1" fill="black" />
                    <rect x="22" y="13" width="1" height="1" fill="black" />
                    <rect x="24" y="13" width="3" height="1" fill="black" />
                    <rect x="20" y="15" width="2" height="1" fill="black" />
                    <rect x="24" y="15" width="1" height="1" fill="black" />
                    <rect x="26" y="15" width="1" height="1" fill="black" />
                    <rect x="20" y="17" width="1" height="1" fill="black" />
                    <rect x="22" y="17" width="2" height="1" fill="black" />
                    <rect x="25" y="17" width="2" height="1" fill="black" />
                    <rect x="9" y="20" width="1" height="1" fill="black" />
                    <rect x="11" y="20" width="2" height="1" fill="black" />
                    <rect x="15" y="20" width="1" height="1" fill="black" />
                    <rect x="9" y="22" width="1" height="1" fill="black" />
                    <rect x="13" y="22" width="1" height="1" fill="black" />
                    <rect x="15" y="22" width="2" height="1" fill="black" />
                    <rect x="9" y="24" width="2" height="1" fill="black" />
                    <rect x="13" y="24" width="1" height="1" fill="black" />
                    <rect x="9" y="26" width="1" height="1" fill="black" />
                    <rect x="11" y="26" width="2" height="1" fill="black" />
                    <rect x="15" y="26" width="2" height="1" fill="black" />
                  </svg>
                </div>
                <div className="text-xs text-white/60 font-medium">
                  {testCustomers[0]?.first_name || "Member"} {testCustomers[0]?.last_name || "Name"}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 p-3 bg-white/[0.02] border border-white/10 rounded-xl">
              <AlertCircle className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-white/60">
                Colors automatically match your brand. QR code positioned at bottom for easy
                scanning.
              </div>
            </div>
          </div>

          {/* Test Pass Generation */}
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8">
            <div className="mb-8">
              <h2 className="text-lg font-medium text-white mb-2">Test Pass Generation</h2>
              <p className="text-sm text-white/40">
                Generate a test wallet pass to preview how it looks
              </p>
            </div>

            {testCustomers.length > 0 ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs text-white/60 mb-3">Select Test Customer</label>
                  <select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20"
                  >
                    {testCustomers.map((customer) => (
                      <option key={customer.id} value={customer.id} className="bg-black">
                        {customer.first_name} {customer.last_name} • {customer.loyalty_points || 0}{" "}
                        pts • {customer.loyalty_tier || "Bronze"}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleGenerateTestPass}
                  disabled={generatingTest}
                  className="w-full bg-white text-black rounded-xl px-6 py-4 text-sm font-medium hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {generatingTest ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      Generating Pass...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Generate & Download Test Pass
                    </>
                  )}
                </button>

                <div className="flex items-start gap-3 p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-white/60">
                    The pass will download as a <span className="text-white">.pkpass</span> file.
                    Double-click it to open in Apple Wallet. On Mac, it will open in Simulator or
                    prompt to send to iPhone.
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-sm text-white/40">No customers available for testing</p>
              </div>
            )}
          </div>
        </div>

        {/* Customer Share Link */}
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-white mb-2">Customer Wallet Link</h2>
            <p className="text-sm text-white/40">
              Share this link with customers to let them add their loyalty card
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-xs text-white/60 overflow-x-auto">
              {shareUrl}
            </div>
            <button
              onClick={handleCopyLink}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium hover:bg-white/10 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Link
                </>
              )}
            </button>
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Preview
            </a>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-4">
          <ActionCard
            icon={Send}
            title="Send to Customers"
            description="Email wallet pass links to all customers"
            onClick={() => alert("Coming soon: Bulk email campaign")}
          />
          <ActionCard
            icon={Eye}
            title="View Analytics"
            description="Detailed insights and usage patterns"
            onClick={() => alert("Coming soon: Analytics dashboard")}
          />
          <ActionCard
            icon={RefreshCw}
            title="Update All Passes"
            description="Push notification to all active passes"
            onClick={() => alert("Coming soon: Bulk pass update")}
          />
        </div>

        {/* How It Works */}
        <div className="mt-16 border-t border-white/10 pt-16">
          <h2 className="text-lg font-medium text-white mb-8">How It Works</h2>
          <div className="grid grid-cols-4 gap-8">
            <Step
              number="1"
              title="Customer Gets Link"
              description="Via email, QR code, or your website"
            />
            <Step number="2" title="Download Pass" description="Tap to download .pkpass file" />
            <Step
              number="3"
              title="Add to Wallet"
              description="Opens in Apple Wallet automatically"
            />
            <Step number="4" title="Auto Updates" description="Pass updates when points change" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sublabel }: { label: string; value: number; sublabel: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6">
      <div className="text-3xl font-semibold text-white mb-2">{value}</div>
      <div className="text-xs font-medium text-white mb-1">{label}</div>
      <div className="text-xs text-white/40">{sublabel}</div>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: any;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 text-left hover:bg-white/[0.04] transition-all group"
    >
      <Icon className="w-5 h-5 text-white/60 mb-4" />
      <div className="text-sm font-medium text-white mb-1 group-hover:text-white/90">{title}</div>
      <div className="text-xs text-white/40">{description}</div>
      <ChevronRight className="w-4 h-4 text-white/20 mt-4 group-hover:text-white/40 group-hover:translate-x-1 transition-all" />
    </button>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-sm font-medium text-white mb-4">
        {number}
      </div>
      <div className="text-sm font-medium text-white mb-2">{title}</div>
      <div className="text-xs text-white/40 leading-relaxed">{description}</div>
    </div>
  );
}
