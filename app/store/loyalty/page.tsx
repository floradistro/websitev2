"use client";

import { useEffect, useState } from "react";
import { useAppAuth } from "@/context/AppAuthContext";
import { useRouter } from "next/navigation";
import {
  Users,
  TrendingUp,
  Sparkles,
  Gift,
  Star,
  Zap,
  Settings,
  Wallet,
  Smartphone,
  Download,
  Copy,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { PageLoader } from "@/components/vendor/VendorSkeleton";
import { pageLayouts } from "@/lib/design-system";

interface LoyaltyStats {
  total_members: number;
  points_issued: number;
  points_redeemed: number;
  active_members: number;
}

interface TopMember {
  id: string;
  name: string;
  email: string;
  points: number;
  lifetime_points: number;
  tier: string;
}

interface LoyaltyProgram {
  id?: string;
  name: string;
  points_per_dollar: number;
  point_value: number;
  min_redemption_points: number;
  points_expiry_days: number | null;
  is_active: boolean;
}

interface WalletStats {
  total_passes: number;
  active_passes: number;
  total_devices: number;
  passes_added_today: number;
  passes_added_this_week: number;
  passes_added_this_month: number;
}

type TabType = "overview" | "configuration" | "wallet";

export default function LoyaltyPage() {
  const { vendor, isAuthenticated, isLoading } = useAppAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Overview tab state
  const [stats, setStats] = useState<LoyaltyStats>({
    total_members: 0,
    points_issued: 0,
    points_redeemed: 0,
    active_members: 0,
  });
  const [topMembers, setTopMembers] = useState<TopMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Configuration tab state
  const [program, setProgram] = useState<LoyaltyProgram>({
    name: "Loyalty Rewards",
    points_per_dollar: 1,
    point_value: 0.01,
    min_redemption_points: 100,
    points_expiry_days: 365,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  // Wallet tab state
  const [walletStats, setWalletStats] = useState<WalletStats>({
    total_passes: 0,
    active_passes: 0,
    total_devices: 0,
    passes_added_today: 0,
    passes_added_this_week: 0,
    passes_added_this_month: 0,
  });
  const [copied, setCopied] = useState(false);
  const [testCustomers, setTestCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [generatingTest, setGeneratingTest] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/vendor/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (vendor?.id) {
      loadAllData();
    }
  }, [vendor?.id]);

  const loadAllData = async () => {
    await Promise.all([loadStats(), loadProgram(), loadWalletData()]);
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const res = await fetch(`/api/vendor/loyalty/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        if (data.topMembers) {
          setTopMembers(data.topMembers);
        }
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const loadProgram = async () => {
    try {
      const res = await fetch(`/api/vendor/loyalty/program`);
      if (res.ok) {
        const data = await res.json();
        if (data.program) {
          setProgram(data.program);
        }
      }
    } catch (error) {
      console.error("Failed to load program:", error);
    }
  };

  const loadWalletData = async () => {
    if (!vendor) return;
    try {
      const statsRes = await fetch(`/api/vendor/apple-wallet/stats?vendor_id=${vendor.id}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setWalletStats(statsData.stats);
        }
      }

      // Load ALL customers
      const res = await fetch(`/api/vendor/customers?limit=1000`);
      if (res.ok) {
        const data = await res.json();
        if (data.customers?.length) {
          setTestCustomers(data.customers);
          setFilteredCustomers(data.customers);
          setSelectedCustomer(data.customers[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load wallet data:", error);
    }
  };

  const handleSaveProgram = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/vendor/loyalty/program`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(program),
      });

      if (res.ok) {
        // Success - maybe show a toast
        await loadProgram();
      } else {
        alert("Failed to save configuration");
      }
    } catch (error) {
      console.error("Failed to save program:", error);
      alert("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateTestPass = async () => {
    if (!selectedCustomer || !vendor) return;

    setGeneratingTest(true);
    try {
      const url = `/api/customer/wallet-pass?customer_id=${selectedCustomer}&vendor_id=${vendor.id}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to generate pass");
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "test-loyalty-pass.pkpass";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      await loadWalletData();
    } catch (error) {
      console.error("Failed to generate test pass:", error);
      alert("Failed to generate test pass. Check console for errors.");
    } finally {
      setGeneratingTest(false);
    }
  };

  const shareUrl = vendor
    ? `${process.env.NEXT_PUBLIC_APP_URL || ""}/customer/wallet?vendor=${vendor.slug}`
    : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCustomerSearch = (search: string) => {
    setCustomerSearch(search);
    if (!search.trim()) {
      setFilteredCustomers(testCustomers);
      return;
    }
    const filtered = testCustomers.filter((c) => {
      const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
      const email = (c.email || "").toLowerCase();
      const searchLower = search.toLowerCase();
      return fullName.includes(searchLower) || email.includes(searchLower);
    });
    setFilteredCustomers(filtered);
  };

  if (loading || isLoading) {
    return <PageLoader message="Loading loyalty program..." />;
  }

  const tierColors = {
    platinum: "text-purple-400",
    gold: "text-yellow-400",
    silver: "text-gray-400",
    bronze: "text-orange-400",
  };

  return (
    <div className={pageLayouts.page}>
      <div className={pageLayouts.content}>
      {/* Tab Navigation */}
      <div className="minimal-glass subtle-glow border-b border-white/5">
        <div className="flex gap-1 p-1">
          <TabButton
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
            icon={TrendingUp}
            label="Overview"
          />
          <TabButton
            active={activeTab === "configuration"}
            onClick={() => setActiveTab("configuration")}
            icon={Settings}
            label="Configuration"
          />
          <TabButton
            active={activeTab === "wallet"}
            onClick={() => setActiveTab("wallet")}
            icon={Wallet}
            label="Apple Wallet"
          />
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <OverviewTab stats={stats} topMembers={topMembers} tierColors={tierColors} router={router} />
      )}

      {activeTab === "configuration" && (
        <ConfigurationTab
          program={program}
          setProgram={setProgram}
          saving={saving}
          onSave={handleSaveProgram}
        />
      )}

      {activeTab === "wallet" && (
        <WalletTab
          vendor={vendor}
          stats={walletStats}
          shareUrl={shareUrl}
          copied={copied}
          onCopyLink={handleCopyLink}
          testCustomers={filteredCustomers}
          customerSearch={customerSearch}
          onCustomerSearch={handleCustomerSearch}
          selectedCustomer={selectedCustomer}
          setSelectedCustomer={setSelectedCustomer}
          generatingTest={generatingTest}
          onGenerateTestPass={handleGenerateTestPass}
        />
      )}
      </div>
    </div>
  );
}

// ============================================================================
// TAB BUTTON COMPONENT
// ============================================================================

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-3
        text-[11px] font-light tracking-wide
        transition-all
        ${
          active
            ? "bg-white/[0.06] text-white border-b-2 border-white/20"
            : "text-white/40 hover:text-white/60 hover:bg-white/[0.02]"
        }
      `}
    >
      <Icon className="w-4 h-4" strokeWidth={1.5} />
      {label}
    </button>
  );
}

// ============================================================================
// OVERVIEW TAB
// ============================================================================

function OverviewTab({
  stats,
  topMembers,
  tierColors,
  router,
}: {
  stats: LoyaltyStats;
  topMembers: TopMember[];
  tierColors: any;
  router: any;
}) {
  return (
    <>
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="minimal-glass subtle-glow p-6 border-l-2 border-blue-500/20">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="text-white/40 text-[10px] font-light tracking-[0.2em] uppercase mb-2">
                Total Members
              </div>
              <div className="text-white text-2xl font-light mb-1">
                {stats.total_members.toLocaleString()}
              </div>
              <div className="text-white/30 text-[10px]">Enrolled customers</div>
            </div>
            <div className="w-10 h-10 bg-white/5 flex items-center justify-center border border-white/10 flex-shrink-0">
              <Users className="w-5 h-5 text-blue-400/60" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <div className="minimal-glass subtle-glow p-6 border-l-2 border-green-500/20">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="text-white/40 text-[10px] font-light tracking-[0.2em] uppercase mb-2">
                Points Issued
              </div>
              <div className="text-white text-2xl font-light mb-1">
                {stats.points_issued.toLocaleString()}
              </div>
              <div className="text-white/30 text-[10px]">Total rewards given</div>
            </div>
            <div className="w-10 h-10 bg-white/5 flex items-center justify-center border border-white/10 flex-shrink-0">
              <Sparkles className="w-5 h-5 text-green-400/60" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <div className="minimal-glass subtle-glow p-6 border-l-2 border-purple-500/20">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="text-white/40 text-[10px] font-light tracking-[0.2em] uppercase mb-2">
                Redeemed
              </div>
              <div className="text-white text-2xl font-light mb-1">
                {stats.points_redeemed.toLocaleString()}
              </div>
              <div className="text-white/30 text-[10px]">Points used</div>
            </div>
            <div className="w-10 h-10 bg-white/5 flex items-center justify-center border border-white/10 flex-shrink-0">
              <Gift className="w-5 h-5 text-purple-400/60" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <div className="minimal-glass subtle-glow p-6 border-l-2 border-orange-500/20">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="text-white/40 text-[10px] font-light tracking-[0.2em] uppercase mb-2">
                Active Members
              </div>
              <div className="text-white text-2xl font-light mb-1">
                {stats.active_members.toLocaleString()}
              </div>
              <div className="text-white/30 text-[10px]">Last 30 days</div>
            </div>
            <div className="w-10 h-10 bg-white/5 flex items-center justify-center border border-white/10 flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-orange-400/60" strokeWidth={1.5} />
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Program Details */}
        <div className="col-span-2 minimal-glass subtle-glow p-6 space-y-6">
          <div>
            <div className="text-white/40 text-[10px] font-light tracking-[0.2em] uppercase mb-4">
              Program Status
            </div>
            <h2 className="text-white text-xl font-light mb-6">How Points Work</h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-white/60 text-[11px] tracking-wide">Points per dollar</span>
                <span className="text-white text-sm font-light">1 point</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-white/60 text-[11px] tracking-wide">Point value</span>
                <span className="text-white text-sm font-light">$0.01 USD</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-white/60 text-[11px] tracking-wide">Min. redemption</span>
                <span className="text-white text-sm font-light">100 pts</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-white/60 text-[11px] tracking-wide">Points expiration</span>
                <span className="text-white text-sm font-light">365 days</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-white/60 text-[11px] tracking-wide">Program status</span>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span className="text-green-400 text-[11px] font-light">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <span className="text-white/60 text-[11px] tracking-wide">Wallet integration</span>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  <span className="text-blue-400 text-[11px] font-light">Enabled</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Members */}
        <div className="minimal-glass subtle-glow p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-white/40 text-[10px] font-light tracking-[0.2em] uppercase mb-1">
                Leaderboard
              </div>
              <h2 className="text-white text-xl font-light">Top Members</h2>
            </div>
            <Zap className="w-5 h-5 text-white/30" strokeWidth={1.5} />
          </div>

          <div className="space-y-3">
            {topMembers.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-white/30 text-[11px] mb-2">No members yet</div>
                <div className="text-white/20 text-[10px]">Members will appear as they earn points</div>
              </div>
            ) : (
              topMembers.map((member, idx) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 py-3 px-3 bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.03] transition-all"
                >
                  <div className="w-8 h-8 bg-white/5 flex items-center justify-center border border-white/10 flex-shrink-0">
                    <span className="text-white/60 text-[11px] font-light">#{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-[12px] font-light truncate mb-0.5">
                      {member.name}
                    </div>
                    <div className="text-white/40 text-[10px] truncate">{member.email}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-white text-[13px] font-light">
                      {member.points.toLocaleString()}
                    </div>
                    <div
                      className={`text-[10px] ${
                        tierColors[member.tier?.toLowerCase() as keyof typeof tierColors] ||
                        "text-white/40"
                      }`}
                    >
                      {member.tier || "Bronze"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {topMembers.length > 0 && (
            <button
              onClick={() => router.push("/vendor/customers?tab=loyalty")}
              className="w-full mt-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 py-3 text-white/60 hover:text-white text-[11px] font-light tracking-wide transition-all"
            >
              View All Members
            </button>
          )}
        </div>
      </div>

      {/* How It Works */}
      <div className="minimal-glass subtle-glow p-6">
        <div className="text-white/40 text-[10px] font-light tracking-[0.2em] uppercase mb-4">
          Integration
        </div>
        <h2 className="text-white text-xl font-light mb-6">How It Works</h2>

        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="w-10 h-10 bg-white/5 flex items-center justify-center border border-white/10">
              <span className="text-white/60 text-[12px] font-light">1</span>
            </div>
            <div>
              <div className="text-white text-[13px] font-light mb-2">Automatic Points</div>
              <div className="text-white/40 text-[11px] leading-relaxed">
                Every purchase at the POS automatically adds points to the customer's account. No
                manual entry required.
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="w-10 h-10 bg-white/5 flex items-center justify-center border border-white/10">
              <span className="text-white/60 text-[12px] font-light">2</span>
            </div>
            <div>
              <div className="text-white text-[13px] font-light mb-2">Apple Wallet Sync</div>
              <div className="text-white/40 text-[11px] leading-relaxed">
                Balance updates instantly sync to the customer's iPhone lock screen pass after each
                transaction.
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="w-10 h-10 bg-white/5 flex items-center justify-center border border-white/10">
              <span className="text-white/60 text-[12px] font-light">3</span>
            </div>
            <div>
              <div className="text-white text-[13px] font-light mb-2">Easy Redemption</div>
              <div className="text-white/40 text-[11px] leading-relaxed">
                Staff can apply points as payment during checkout. Points are deducted instantly from
                the balance.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// CONFIGURATION TAB
// ============================================================================

function ConfigurationTab({
  program,
  setProgram,
  saving,
  onSave,
}: {
  program: LoyaltyProgram;
  setProgram: (p: LoyaltyProgram) => void;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Settings Form */}
      <div className="minimal-glass subtle-glow p-8">
        <div className="text-white/40 text-[10px] font-light tracking-[0.2em] uppercase mb-4">
          Program Settings
        </div>
        <h2 className="text-white text-xl font-light mb-8">Configure Your Loyalty Program</h2>

        <div className="grid grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <div>
              <label className="block text-white/60 text-[11px] tracking-wide mb-3">
                Program Name
              </label>
              <input
                type="text"
                value={program.name}
                onChange={(e) => setProgram({ ...program, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white text-[13px] font-light focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-white/60 text-[11px] tracking-wide mb-3">
                Points per Dollar Spent
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={program.points_per_dollar}
                onChange={(e) =>
                  setProgram({ ...program, points_per_dollar: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white text-[13px] font-light focus:outline-none focus:border-white/20 transition-colors"
              />
              <div className="text-white/30 text-[10px] mt-2">
                Example: 1 = customer earns 1 point per $1 spent
              </div>
            </div>

            <div>
              <label className="block text-white/60 text-[11px] tracking-wide mb-3">
                Point Value (USD)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={program.point_value}
                onChange={(e) =>
                  setProgram({ ...program, point_value: parseFloat(e.target.value) || 0 })
                }
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white text-[13px] font-light focus:outline-none focus:border-white/20 transition-colors"
              />
              <div className="text-white/30 text-[10px] mt-2">
                Example: 0.01 = each point worth $0.01 (100 pts = $1)
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div>
              <label className="block text-white/60 text-[11px] tracking-wide mb-3">
                Minimum Points to Redeem
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={program.min_redemption_points}
                onChange={(e) =>
                  setProgram({ ...program, min_redemption_points: parseInt(e.target.value) || 0 })
                }
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white text-[13px] font-light focus:outline-none focus:border-white/20 transition-colors"
              />
              <div className="text-white/30 text-[10px] mt-2">
                Minimum points required before customers can redeem
              </div>
            </div>

            <div>
              <label className="block text-white/60 text-[11px] tracking-wide mb-3">
                Points Expiration (Days)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={program.points_expiry_days || ""}
                onChange={(e) =>
                  setProgram({
                    ...program,
                    points_expiry_days: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="Never expire"
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white text-[13px] font-light focus:outline-none focus:border-white/20 transition-colors placeholder:text-white/20"
              />
              <div className="text-white/30 text-[10px] mt-2">
                Leave empty for points that never expire
              </div>
            </div>

            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={program.is_active}
                  onChange={(e) => setProgram({ ...program, is_active: e.target.checked })}
                  className="w-5 h-5 bg-white/5 border border-white/10 checked:bg-white checked:border-white"
                />
                <div>
                  <div className="text-white text-[13px] font-light">Program Active</div>
                  <div className="text-white/40 text-[10px]">
                    Customers can earn and redeem points
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
          <div className="text-white/40 text-[11px]">
            Changes take effect immediately after saving
          </div>
          <button
            onClick={onSave}
            disabled={saving}
            className="bg-white text-black px-6 py-3 text-[12px] font-light tracking-wide hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Configuration
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview Card */}
      <div className="minimal-glass subtle-glow p-6">
        <div className="text-white/40 text-[10px] font-light tracking-[0.2em] uppercase mb-4">
          Preview
        </div>
        <h2 className="text-white text-xl font-light mb-6">Customer Experience</h2>

        <div className="grid grid-cols-3 gap-6 text-center">
          <div className="bg-white/[0.02] border border-white/5 p-6">
            <div className="text-white text-3xl font-light mb-2">
              ${(100 * program.point_value).toFixed(2)}
            </div>
            <div className="text-white/60 text-[11px] mb-1">Spending $100 earns</div>
            <div className="text-white/40 text-[10px]">
              {(100 * program.points_per_dollar).toFixed(0)} points ≈ $
              {(100 * program.points_per_dollar * program.point_value).toFixed(2)} reward
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-6">
            <div className="text-white text-3xl font-light mb-2">
              {program.min_redemption_points}
            </div>
            <div className="text-white/60 text-[11px] mb-1">Minimum to redeem</div>
            <div className="text-white/40 text-[10px]">
              Worth ${(program.min_redemption_points * program.point_value).toFixed(2)}
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 p-6">
            <div className="text-white text-3xl font-light mb-2">
              {program.points_expiry_days || "∞"}
            </div>
            <div className="text-white/60 text-[11px] mb-1">Days until expiry</div>
            <div className="text-white/40 text-[10px]">
              {program.points_expiry_days ? `${program.points_expiry_days} days` : "Never expires"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// WALLET TAB
// ============================================================================

function WalletTab({
  vendor,
  stats,
  shareUrl,
  copied,
  onCopyLink,
  testCustomers,
  customerSearch,
  onCustomerSearch,
  selectedCustomer,
  setSelectedCustomer,
  generatingTest,
  onGenerateTestPass,
}: {
  vendor: any;
  stats: WalletStats;
  shareUrl: string;
  copied: boolean;
  onCopyLink: () => void;
  testCustomers: any[];
  customerSearch: string;
  onCustomerSearch: (search: string) => void;
  selectedCustomer: string;
  setSelectedCustomer: (id: string) => void;
  generatingTest: boolean;
  onGenerateTestPass: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="minimal-glass subtle-glow p-6 border-l-2 border-blue-500/20">
          <div className="text-white/40 text-[10px] font-light tracking-[0.2em] uppercase mb-2">
            Total Passes
          </div>
          <div className="text-white text-2xl font-light mb-1">
            {stats.total_passes.toLocaleString()}
          </div>
          <div className="text-white/30 text-[10px]">All time</div>
        </div>

        <div className="minimal-glass subtle-glow p-6 border-l-2 border-green-500/20">
          <div className="text-white/40 text-[10px] font-light tracking-[0.2em] uppercase mb-2">
            Active Passes
          </div>
          <div className="text-white text-2xl font-light mb-1">
            {stats.active_passes.toLocaleString()}
          </div>
          <div className="text-white/30 text-[10px]">In customer wallets</div>
        </div>

        <div className="minimal-glass subtle-glow p-6 border-l-2 border-purple-500/20">
          <div className="text-white/40 text-[10px] font-light tracking-[0.2em] uppercase mb-2">
            This Week
          </div>
          <div className="text-white text-2xl font-light mb-1">
            {stats.passes_added_this_week.toLocaleString()}
          </div>
          <div className="text-white/30 text-[10px]">{stats.passes_added_today} today</div>
        </div>

        <div className="minimal-glass subtle-glow p-6 border-l-2 border-orange-500/20">
          <div className="text-white/40 text-[10px] font-light tracking-[0.2em] uppercase mb-2">
            Devices
          </div>
          <div className="text-white text-2xl font-light mb-1">
            {stats.total_devices.toLocaleString()}
          </div>
          <div className="text-white/30 text-[10px]">Registered for updates</div>
        </div>
      </div>

      {/* Test Pass Generation */}
      <div className="minimal-glass subtle-glow p-8">
        <div className="text-white/40 text-[10px] font-light tracking-[0.2em] uppercase mb-4">
          Testing
        </div>
        <h2 className="text-white text-xl font-light mb-6">Test Pass Generation</h2>

        {testCustomers.length > 0 ? (
          <div className="space-y-6">
            {/* Search Input */}
            <div>
              <label className="block text-white/60 text-[11px] tracking-wide mb-3">
                Search Customer
              </label>
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => onCustomerSearch(e.target.value)}
                placeholder="Type name or email..."
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white text-[13px] font-light placeholder:text-white/20 focus:outline-none focus:border-white/20"
              />
            </div>

            {/* Customer Dropdown */}
            <div>
              <label className="block text-white/60 text-[11px] tracking-wide mb-3">
                Select Customer ({testCustomers.length} found)
              </label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white text-[13px] font-light focus:outline-none focus:border-white/20"
              >
                {testCustomers.map((customer) => (
                  <option key={customer.id} value={customer.id} className="bg-black">
                    {customer.first_name} {customer.last_name} • {customer.loyalty_points || 0} pts
                  </option>
                ))}
              </select>
            </div>

            {/* Pass Preview & QR Code */}
            {selectedCustomer && vendor && (
              <div className="grid grid-cols-2 gap-6">
                {/* Pass Preview */}
                <div className="flex flex-col items-center gap-4 p-6 bg-white/[0.02] border border-white/10">
                  <div className="text-white/60 text-[11px] tracking-wide text-center mb-2">
                    Pass Preview
                  </div>

                  {/* Mock Apple Wallet Pass */}
                  <div className="w-full max-w-[320px] bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-2xl border border-white/10">
                    {/* Pass Header */}
                    <div className="bg-black/40 px-5 py-4 border-b border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                            <Wallet className="w-6 h-6 text-white/60" />
                          </div>
                          <div>
                            <div className="text-white text-sm font-medium">{vendor.business_name}</div>
                            <div className="text-white/40 text-[10px]">Loyalty Card</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pass Body */}
                    <div className="px-5 py-6">
                      {/* Points Balance - Big */}
                      <div className="text-center mb-6">
                        <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Points Balance</div>
                        <div className="text-white text-4xl font-light">
                          {testCustomers.find(c => c.id === selectedCustomer)?.loyalty_points || 0}
                        </div>
                      </div>

                      {/* Customer Details */}
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-xs">
                          <span className="text-white/40">Member</span>
                          <span className="text-white">
                            {testCustomers.find(c => c.id === selectedCustomer)?.first_name} {testCustomers.find(c => c.id === selectedCustomer)?.last_name}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-white/40">Tier</span>
                          <span className="text-yellow-400">
                            {testCustomers.find(c => c.id === selectedCustomer)?.loyalty_tier || "Bronze"}
                          </span>
                        </div>
                      </div>

                      {/* Barcode */}
                      <div className="bg-white p-3 rounded-lg">
                        <div className="h-16 bg-gradient-to-r from-black via-gray-700 to-black bg-[length:4px_100%] rounded"></div>
                        <div className="text-center text-[9px] text-black/60 mt-1 font-mono">
                          {selectedCustomer.substring(0, 12).toUpperCase()}
                        </div>
                      </div>
                    </div>

                    {/* Pass Footer */}
                    <div className="bg-black/40 px-5 py-3 border-t border-white/10">
                      <div className="text-white/30 text-[9px] text-center">
                        Tap to view more details
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center gap-4 p-6 bg-white/[0.02] border border-white/10">
                  <div className="text-white/60 text-[11px] tracking-wide text-center mb-2">
                    Scan with iPhone
                  </div>
                  <div className="p-4 bg-white rounded-lg">
                    <QRCodeSVG
                      value={`${typeof window !== 'undefined' ? window.location.origin : 'https://whaletools.dev'}/api/customer/wallet-pass?customer_id=${selectedCustomer}&vendor_id=${vendor.id}`}
                      size={200}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <div className="text-white/40 text-[10px] text-center max-w-sm">
                    Point your iPhone camera at this QR code to instantly download and add the pass
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={onGenerateTestPass}
              disabled={generatingTest}
              className="w-full bg-white text-black px-6 py-4 text-[13px] font-light hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {generatingTest ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                  Generating Pass...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Generate & Download Test Pass
                </>
              )}
            </button>

            <div className="flex items-start gap-3 p-4 bg-white/[0.02] border border-white/10">
              <AlertCircle className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] text-white/60">
                The pass will download as a <span className="text-white">.pkpass</span> file.
                Double-click it to open in Apple Wallet.
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-[11px] text-white/40">No customers available for testing</p>
          </div>
        )}
      </div>

      {/* Customer Share Link */}
      <div className="minimal-glass subtle-glow p-8">
        <div className="text-white/40 text-[10px] font-light tracking-[0.2em] uppercase mb-4">
          Distribution
        </div>
        <h2 className="text-white text-xl font-light mb-6">Customer Wallet Link</h2>
        <p className="text-[11px] text-white/40 mb-6">
          Share this link with customers to let them add their loyalty card
        </p>

        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white/5 border border-white/10 px-4 py-3 font-mono text-[11px] text-white/60 overflow-x-auto">
            {shareUrl}
          </div>
          <button
            onClick={onCopyLink}
            className="bg-white/5 border border-white/10 px-4 py-3 text-[12px] font-light hover:bg-white/10 transition-all flex items-center gap-2 whitespace-nowrap"
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
            className="bg-white/5 border border-white/10 px-4 py-3 text-[12px] font-light hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Preview
          </a>
        </div>
      </div>

      {/* Advanced Features Info */}
      <div className="minimal-glass subtle-glow p-8">
        <div className="text-white/40 text-[10px] font-light tracking-[0.2em] uppercase mb-4">
          Advanced Features
        </div>
        <h2 className="text-white text-xl font-light mb-6">Apple Wallet Capabilities</h2>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500/60 mt-1.5 flex-shrink-0"></div>
              <div>
                <div className="text-white text-[12px] font-light mb-1">
                  Location-Based Lock Screen
                </div>
                <div className="text-white/40 text-[10px] leading-relaxed">
                  Pass automatically appears when customer is near your store (500m radius)
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500/60 mt-1.5 flex-shrink-0"></div>
              <div>
                <div className="text-white text-[12px] font-light mb-1">
                  Real-Time Push Updates
                </div>
                <div className="text-white/40 text-[10px] leading-relaxed">
                  Balance updates appear instantly on lock screen after each purchase
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500/60 mt-1.5 flex-shrink-0"></div>
              <div>
                <div className="text-white text-[12px] font-light mb-1">Time-Based Relevance</div>
                <div className="text-white/40 text-[10px] leading-relaxed">
                  Pass appears during happy hour or special event times automatically
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-500/60 mt-1.5 flex-shrink-0"></div>
              <div>
                <div className="text-white text-[12px] font-light mb-1">Deep Links</div>
                <div className="text-white/40 text-[10px] leading-relaxed">
                  One-tap to call store, view menu, get directions, or refer friends
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-yellow-500/60 mt-1.5 flex-shrink-0"></div>
              <div>
                <div className="text-white text-[12px] font-light mb-1">
                  Multi-Location Support
                </div>
                <div className="text-white/40 text-[10px] leading-relaxed">
                  Single pass works for all your locations with location-specific messages
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-pink-500/60 mt-1.5 flex-shrink-0"></div>
              <div>
                <div className="text-white text-[12px] font-light mb-1">Change Notifications</div>
                <div className="text-white/40 text-[10px] leading-relaxed">
                  Custom messages like "You earned 50 points!" shown on lock screen
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
