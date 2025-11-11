"use client";

import { useEffect, useState } from "react";
import { useAppAuth } from "@/context/AppAuthContext";
import { useRouter } from "next/navigation";
import { Users, TrendingUp, Award, Sparkles } from "lucide-react";

interface LoyaltyStats {
  total_members: number;
  points_issued: number;
  points_redeemed: number;
  active_members: number;
}

export default function LoyaltyPage() {
  const { vendor, isAuthenticated, isLoading } = useAppAuth();
  const router = useRouter();
  const [stats, setStats] = useState<LoyaltyStats>({
    total_members: 0,
    points_issued: 0,
    points_redeemed: 0,
    active_members: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/vendor/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (vendor?.id) {
      loadStats();
    }
  }, [vendor?.id]);

  const loadStats = async () => {
    try {
      const res = await fetch(`/api/vendor/loyalty/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white/40 text-sm tracking-wide">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header - Clean, minimal */}
      <div className="mb-8">
        <h1 className="text-[32px] font-light tracking-tight text-white mb-2">Loyalty Rewards</h1>
        <p className="text-white/40 text-[13px] tracking-wide">
          Reward your best customers. Build lasting relationships.
        </p>
      </div>

      {/* Stats - Minimal cards, Apple-style */}
      <div className="grid grid-cols-4 gap-6 mb-12">
        {/* Total Members */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Users size={20} className="text-blue-400/70" strokeWidth={1.5} />
            </div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium">
              Members
            </div>
          </div>
          <div className="text-[36px] font-light tracking-tight text-white">
            {stats.total_members.toLocaleString()}
          </div>
          <div className="text-[11px] text-white/30 mt-1 tracking-wide">Total enrolled</div>
        </div>

        {/* Points Issued */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Sparkles size={20} className="text-green-400/70" strokeWidth={1.5} />
            </div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium">
              Issued
            </div>
          </div>
          <div className="text-[36px] font-light tracking-tight text-white">
            {stats.points_issued.toLocaleString()}
          </div>
          <div className="text-[11px] text-white/30 mt-1 tracking-wide">Points given</div>
        </div>

        {/* Points Redeemed */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Award size={20} className="text-purple-400/70" strokeWidth={1.5} />
            </div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium">
              Redeemed
            </div>
          </div>
          <div className="text-[36px] font-light tracking-tight text-white">
            {stats.points_redeemed.toLocaleString()}
          </div>
          <div className="text-[11px] text-white/30 mt-1 tracking-wide">Points used</div>
        </div>

        {/* Active Members */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <TrendingUp size={20} className="text-orange-400/70" strokeWidth={1.5} />
            </div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-white/30 font-medium">
              Active
            </div>
          </div>
          <div className="text-[36px] font-light tracking-tight text-white">
            {stats.active_members.toLocaleString()}
          </div>
          <div className="text-[11px] text-white/30 mt-1 tracking-wide">Last 30 days</div>
        </div>
      </div>

      {/* Main Content - Simple, focused on what matters */}
      <div className="grid grid-cols-2 gap-6">
        {/* How it works - Left side */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8">
          <h2 className="text-[20px] font-light tracking-tight text-white mb-6">How It Works</h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0 border border-white/[0.06]">
                <span className="text-[13px] font-medium text-white/60">1</span>
              </div>
              <div>
                <div className="text-white text-[14px] mb-1">Customers earn points automatically</div>
                <div className="text-white/40 text-[12px] leading-relaxed tracking-wide">
                  Every purchase at the POS adds points to their account. No extra steps required.
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0 border border-white/[0.06]">
                <span className="text-[13px] font-medium text-white/60">2</span>
              </div>
              <div>
                <div className="text-white text-[14px] mb-1">Points sync to Apple Wallet</div>
                <div className="text-white/40 text-[12px] leading-relaxed tracking-wide">
                  Balance updates appear instantly on their iPhone lock screen after each visit.
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0 border border-white/[0.06]">
                <span className="text-[13px] font-medium text-white/60">3</span>
              </div>
              <div>
                <div className="text-white text-[14px] mb-1">Redeem at checkout</div>
                <div className="text-white/40 text-[12px] leading-relaxed tracking-wide">
                  Staff can apply points as payment during any transaction at the register.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Settings - Right side */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8">
          <h2 className="text-[20px] font-light tracking-tight text-white mb-6">Program Settings</h2>

          <div className="space-y-5">
            <div className="flex justify-between items-center py-3 border-b border-white/[0.04]">
              <span className="text-white/60 text-[13px] tracking-wide">Points per dollar</span>
              <span className="text-white text-[14px] font-medium">1 point</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-white/[0.04]">
              <span className="text-white/60 text-[13px] tracking-wide">Point value</span>
              <span className="text-white text-[14px] font-medium">$0.01</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-white/[0.04]">
              <span className="text-white/60 text-[13px] tracking-wide">Minimum redemption</span>
              <span className="text-white text-[14px] font-medium">100 points</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-white/[0.04]">
              <span className="text-white/60 text-[13px] tracking-wide">Points expiration</span>
              <span className="text-white text-[14px] font-medium">365 days</span>
            </div>

            <div className="flex justify-between items-center py-3">
              <span className="text-white/60 text-[13px] tracking-wide">Program status</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-green-400 text-[13px] font-medium">Active</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/[0.06]">
            <button className="w-full bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.12] rounded-xl px-4 py-3 text-white text-[13px] font-medium tracking-wide transition-all duration-200">
              Configure Settings
            </button>
          </div>
        </div>
      </div>

      {/* Migration Notice - if needed */}
      {stats.total_members < 100 && (
        <div className="mt-6 bg-blue-500/[0.04] border border-blue-500/[0.08] rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Users size={20} className="text-blue-400/70" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <div className="text-white text-[15px] font-medium mb-1">
                Migrating from Alpine IQ?
              </div>
              <div className="text-white/60 text-[13px] leading-relaxed tracking-wide mb-4">
                You have {(10357 - stats.total_members).toLocaleString()} customers without loyalty
                accounts. Import your existing Alpine IQ members to continue their points and tier
                status seamlessly.
              </div>
              <button className="bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/30 rounded-lg px-4 py-2 text-blue-400 text-[12px] font-medium tracking-wide transition-all duration-200">
                Import Alpine IQ Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
