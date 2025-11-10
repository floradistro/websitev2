"use client";

import { useEffect, useState } from "react";
import { useAppAuth } from "@/context/AppAuthContext";
import { createClient } from "@supabase/supabase-js";
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
      const statsRes = await fetch(
        `/api/vendor/apple-wallet/stats?vendor_id=${vendor.id}`,
      );
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.stats);
        }
      }

      // Load test customers
      const { data: customers } = await supabase
        .from("customers")
        .select(
          "id, first_name, last_name, email, loyalty_points, loyalty_tier",
        )
        .limit(5);

      if (customers?.length) {
        setTestCustomers(customers);
        setSelectedCustomer(customers[0].id);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to load data:", error);
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
        console.error("Failed to generate test pass:", error);
      }
      alert("Failed to generate test pass. Check console for errors.");
    } finally {
      setGeneratingTest(false);
    }
  }

  const shareUrl = vendor
    ? `${window.location.origin}/customer/wallet?vendor=${vendor.slug}`
    : "";

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
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                Marketing
              </h1>
              <p className="text-sm text-white/40 mt-1">
                Digital loyalty cards with automatic updates
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-12">
          <StatCard
            label="Total Passes"
            value={stats.total_passes}
            sublabel="All time"
          />
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
          <StatCard
            label="Devices"
            value={stats.total_devices}
            sublabel="Registered for updates"
          />
        </div>

        {/* Test Pass Generation */}
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 mb-6">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-lg font-medium text-white mb-2">
                Test Pass Generation
              </h2>
              <p className="text-sm text-white/40">
                Generate a test wallet pass to preview how it looks
              </p>
            </div>
          </div>

          {testCustomers.length > 0 ? (
            <div className="space-y-6">
              <div>
                <label className="block text-xs text-white/60 mb-3">
                  Select Test Customer
                </label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20"
                >
                  {testCustomers.map((customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                      className="bg-black"
                    >
                      {customer.first_name} {customer.last_name} •{" "}
                      {customer.loyalty_points || 0} pts •{" "}
                      {customer.loyalty_tier || "Bronze"}
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
                  The pass will download as a{" "}
                  <span className="text-white">.pkpass</span> file. Double-click
                  it to open in Apple Wallet. On Mac, it will open in Simulator
                  or prompt to send to iPhone.
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-white/40">
                No customers available for testing
              </p>
            </div>
          )}
        </div>

        {/* Customer Share Link */}
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-white mb-2">
              Customer Wallet Link
            </h2>
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
            <Step
              number="2"
              title="Download Pass"
              description="Tap to download .pkpass file"
            />
            <Step
              number="3"
              title="Add to Wallet"
              description="Opens in Apple Wallet automatically"
            />
            <Step
              number="4"
              title="Auto Updates"
              description="Pass updates when points change"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: number;
  sublabel: string;
}) {
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
      <div className="text-sm font-medium text-white mb-1 group-hover:text-white/90">
        {title}
      </div>
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
