"use client";

import { useEffect, useState } from "react";
import { useAppAuth } from "@/context/AppAuthContext";
import { useRouter } from "next/navigation";
import { Save, TrendingUp, Gift, Award, Settings as SettingsIcon } from "lucide-react";

interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  points_per_dollar: number;
  point_value: number;
  min_redemption_points: number;
  points_expiry_days: number | null;
  tiers: LoyaltyTier[];
  allow_points_on_discounted_items: boolean;
  points_on_tax: boolean;
  is_active: boolean;
}

interface LoyaltyTier {
  name: string;
  min_points: number;
  multiplier: number;
  color?: string;
  perks?: string[];
}

export default function LoyaltySettingsPage() {
  const { vendor, isAuthenticated, isLoading } = useAppAuth();
  const router = useRouter();
  const [program, setProgram] = useState<LoyaltyProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    total_members: 0,
    points_issued: 0,
    points_redeemed: 0,
    active_members: 0,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/vendor/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (vendor?.id) {
      loadProgram();
      loadStats();
    }
  }, [vendor?.id]);

  const loadProgram = async () => {
    try {
      const res = await fetch(`/api/vendor/loyalty/program`);
      if (res.ok) {
        const data = await res.json();
        setProgram(data.program);
      }
    } catch (error) {
      console.error("Failed to load loyalty program:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch(`/api/vendor/loyalty/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleSave = async () => {
    if (!program) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/vendor/loyalty/program`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(program),
      });

      if (res.ok) {
        alert("Loyalty program settings saved successfully!");
      } else {
        const error = await res.json();
        alert(`Failed to save: ${error.error}`);
      }
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-xl">Loading loyalty settings...</div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex items-center justify-center">
        <div className="text-xl">No loyalty program configured</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Loyalty Rewards</h1>
              <p className="text-white/60 mt-1">Configure your customer loyalty program</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={20} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="text-blue-400" size={32} />
              <div className="text-blue-400 text-xs font-bold uppercase tracking-wider">Members</div>
            </div>
            <div className="text-4xl font-black">{stats.total_members.toLocaleString()}</div>
            <div className="text-white/60 text-sm mt-2">Total enrolled</div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Gift className="text-green-400" size={32} />
              <div className="text-green-400 text-xs font-bold uppercase tracking-wider">Issued</div>
            </div>
            <div className="text-4xl font-black">{stats.points_issued.toLocaleString()}</div>
            <div className="text-white/60 text-sm mt-2">Points given</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Award className="text-purple-400" size={32} />
              <div className="text-purple-400 text-xs font-bold uppercase tracking-wider">Redeemed</div>
            </div>
            <div className="text-4xl font-black">{stats.points_redeemed.toLocaleString()}</div>
            <div className="text-white/60 text-sm mt-2">Points used</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="text-orange-400" size={32} />
              <div className="text-orange-400 text-xs font-bold uppercase tracking-wider">Active</div>
            </div>
            <div className="text-4xl font-black">{stats.active_members.toLocaleString()}</div>
            <div className="text-white/60 text-sm mt-2">Last 30 days</div>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Settings */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-black mb-6 flex items-center gap-3">
              <SettingsIcon size={24} />
              Basic Settings
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-white/80 mb-2">Program Name</label>
                <input
                  type="text"
                  value={program.name}
                  onChange={(e) => setProgram({ ...program, name: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-white/80 mb-2">Description</label>
                <textarea
                  value={program.description}
                  onChange={(e) => setProgram({ ...program, description: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-white/80 mb-2">Points per $1</label>
                  <input
                    type="number"
                    step="0.1"
                    value={program.points_per_dollar}
                    onChange={(e) =>
                      setProgram({ ...program, points_per_dollar: parseFloat(e.target.value) })
                    }
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                  <p className="text-xs text-white/50 mt-1">e.g. 1.0 = 1 pt per dollar</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-white/80 mb-2">Point Value ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={program.point_value}
                    onChange={(e) => setProgram({ ...program, point_value: parseFloat(e.target.value) })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                  <p className="text-xs text-white/50 mt-1">e.g. 0.01 = 1¢ per point</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-white/80 mb-2">Min Redemption Points</label>
                  <input
                    type="number"
                    value={program.min_redemption_points}
                    onChange={(e) =>
                      setProgram({ ...program, min_redemption_points: parseInt(e.target.value) })
                    }
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-white/80 mb-2">Points Expire (days)</label>
                  <input
                    type="number"
                    value={program.points_expiry_days || ""}
                    onChange={(e) =>
                      setProgram({
                        ...program,
                        points_expiry_days: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-all"
                    placeholder="Never"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={program.allow_points_on_discounted_items}
                    onChange={(e) =>
                      setProgram({ ...program, allow_points_on_discounted_items: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-white/20 bg-white/10"
                  />
                  <span className="text-sm">Award points on discounted items</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={program.points_on_tax}
                    onChange={(e) => setProgram({ ...program, points_on_tax: e.target.checked })}
                    className="w-5 h-5 rounded border-white/20 bg-white/10"
                  />
                  <span className="text-sm">Award points on tax amount</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={program.is_active}
                    onChange={(e) => setProgram({ ...program, is_active: e.target.checked })}
                    className="w-5 h-5 rounded border-white/20 bg-white/10"
                  />
                  <span className="text-sm font-bold">Program Active</span>
                </label>
              </div>
            </div>
          </div>

          {/* Loyalty Tiers */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-black mb-6 flex items-center gap-3">
              <Award size={24} />
              Loyalty Tiers
            </h2>

            <div className="space-y-4">
              {program.tiers.map((tier, index) => (
                <div
                  key={index}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <input
                      type="text"
                      value={tier.name}
                      onChange={(e) => {
                        const newTiers = [...program.tiers];
                        newTiers[index].name = e.target.value;
                        setProgram({ ...program, tiers: newTiers });
                      }}
                      className="text-lg font-bold bg-transparent border-none focus:outline-none"
                    />
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{
                        background:
                          tier.name === "Bronze"
                            ? "#CD7F32"
                            : tier.name === "Silver"
                              ? "#C0C0C0"
                              : tier.name === "Gold"
                                ? "#FFD700"
                                : "#E5E4E2",
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-white/60 block mb-1">Min Points</label>
                      <input
                        type="number"
                        value={tier.min_points}
                        onChange={(e) => {
                          const newTiers = [...program.tiers];
                          newTiers[index].min_points = parseInt(e.target.value);
                          setProgram({ ...program, tiers: newTiers });
                        }}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-white/60 block mb-1">Multiplier</label>
                      <input
                        type="number"
                        step="0.25"
                        value={tier.multiplier}
                        onChange={(e) => {
                          const newTiers = [...program.tiers];
                          newTiers[index].multiplier = parseFloat(e.target.value);
                          setProgram({ ...program, tiers: newTiers });
                        }}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-sm text-blue-300 font-bold mb-2">How Tiers Work:</p>
              <ul className="text-xs text-white/70 space-y-1">
                <li>• Customers automatically upgrade based on lifetime points</li>
                <li>• Higher tiers earn bonus points on every purchase</li>
                <li>• Example: Gold (1.5x) earns 15 pts on $10 purchase instead of 10</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Apple Wallet Integration Status */}
        <div className="mt-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl p-6">
          <h3 className="text-lg font-black mb-3">🍎 Apple Wallet Integration</h3>
          <p className="text-white/80 text-sm mb-4">
            Loyalty points automatically sync to customer Apple Wallet passes. Balance updates appear
            instantly after each purchase.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-bold text-green-400">Active</span>
            </div>
            <span className="text-white/40 text-sm">
              Pass updates sent via Apple Push Notification service
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
