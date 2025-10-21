"use client";

import { useState } from "react";
import { useLoyalty } from "@/context/LoyaltyContext";
import { useAuth } from "@/context/AuthContext";
import { Coins, Check, X } from "lucide-react";
import { showNotification } from "@/components/NotificationToast";

interface ChipRedemptionProps {
  cartTotal: number;
  onApplyDiscount: (discount: number, chipsUsed: number) => void;
}

export default function ChipRedemption({ cartTotal, onApplyDiscount }: ChipRedemptionProps) {
  const { points, pointsLabel, settings, refreshPoints } = useLoyalty();
  const { user } = useAuth();
  const [chipsToUse, setChipsToUse] = useState<number>(0);
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [isApplied, setIsApplied] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user || !settings || points === 0) return null;

  const [singularLabel, pluralLabel] = pointsLabel.split(':');
  const chipLabel = pluralLabel || singularLabel;
  const minRedeem = settings.min_redeem_points;
  const maxChipsAvailable = Math.min(points, Math.floor(cartTotal * 20)); // Max 5% discount typically
  
  // Calculate discount based on chips
  const calculateDiscount = (chips: number): number => {
    if (!settings) return 0;
    const [chipAmount, dollarAmount] = settings.redeem_ratio.split(':').map(n => parseFloat(n));
    return Math.min(cartTotal * 0.5, (chips / chipAmount) * dollarAmount); // Cap at 50% of cart
  };

  const handleApply = async () => {
    if (chipsToUse < minRedeem) {
      showNotification({
        type: 'warning',
        title: 'Minimum Required',
        message: `Minimum ${minRedeem} ${chipLabel.toLowerCase()} required`,
      });
      return;
    }

    if (chipsToUse > points) {
      showNotification({
        type: 'error',
        title: 'Insufficient Chips',
        message: `You only have ${points} ${chipLabel.toLowerCase()}`,
      });
      return;
    }

    setLoading(true);

    try {
      // Calculate discount locally
      const discount = calculateDiscount(chipsToUse);
      
      setAppliedDiscount(discount);
      setIsApplied(true);
      onApplyDiscount(discount, chipsToUse);
      
      showNotification({
        type: 'success',
        title: 'Chips Applied',
        message: `$${discount.toFixed(2)} discount applied!`,
      });
    } catch (error) {
      console.error("Error applying chips:", error);
      showNotification({
        type: 'error',
        title: 'Redemption Failed',
        message: 'Failed to apply chips. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setChipsToUse(0);
    setAppliedDiscount(0);
    setIsApplied(false);
    onApplyDiscount(0, 0);
  };

  const handleUseMax = () => {
    setChipsToUse(maxChipsAvailable);
  };

  if (points < minRedeem) {
    return (
      <div className="bg-[#2a2a2a] border border-white/10 p-4">
        <div className="flex items-center gap-3">
          <Coins size={16} className="text-white/40" />
          <div className="flex-1">
            <p className="text-xs text-white/60 mb-1">Loyalty Rewards</p>
            <p className="text-[10px] text-white/40">
              You have {points} {chipLabel.toLowerCase()}. Need {minRedeem - points} more to redeem.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border border-amber-500/20 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Coins size={20} className="text-amber-400" />
        <div className="flex-1">
          <h3 className="text-sm uppercase tracking-[0.2em] text-amber-400 font-medium">Use Your {chipLabel}</h3>
          <p className="text-[10px] text-white/60 mt-1">
            You have {points.toLocaleString()} {chipLabel.toLowerCase()} (${calculateDiscount(points).toFixed(2)} value)
          </p>
        </div>
      </div>

      {!isApplied ? (
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-white/60 mb-2 font-medium">
              {chipLabel} to Use
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min={minRedeem}
                max={maxChipsAvailable}
                step={100}
                value={chipsToUse || ''}
                onChange={(e) => setChipsToUse(parseInt(e.target.value) || 0)}
                className="flex-1 px-4 py-3 text-sm bg-black/20 border border-white/10 text-white focus:border-amber-500/30 focus:outline-none transition-all"
                placeholder={`Min. ${minRedeem}`}
              />
              <button
                onClick={handleUseMax}
                className="px-4 py-3 bg-white/10 border border-white/10 text-white text-[10px] uppercase tracking-[0.2em] hover:bg-white/20 transition-all font-medium"
              >
                Max
              </button>
            </div>
            {chipsToUse >= minRedeem && (
              <p className="text-[10px] text-amber-400 mt-2">
                Discount: ${calculateDiscount(chipsToUse).toFixed(2)}
              </p>
            )}
          </div>

          <button
            onClick={handleApply}
            disabled={loading || chipsToUse < minRedeem}
            className="interactive-button w-full bg-white text-black px-6 py-3 text-[11px] uppercase tracking-[0.2em] hover:bg-white/90 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? "Applying..." : "Apply Chips"}
            <Check size={14} />
          </button>
        </div>
      ) : (
        <div className="bg-black/20 border border-amber-500/30 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-white font-medium mb-1">Chips Applied</p>
              <p className="text-[10px] text-white/60">{chipsToUse.toLocaleString()} {chipLabel.toLowerCase()} used</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-light text-green-400">-${appliedDiscount.toFixed(2)}</p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Discount</p>
            </div>
          </div>
          <button
            onClick={handleRemove}
            className="w-full bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 text-[10px] uppercase tracking-[0.2em] hover:bg-red-500/30 transition-all font-medium flex items-center justify-center gap-2"
          >
            <X size={12} />
            Remove Chips
          </button>
        </div>
      )}
    </div>
  );
}

