"use client";

import { useState, useEffect } from "react";

interface Tier {
  weight?: string;
  qty: number;
  price: string | number;
}

interface PricingTiersProps {
  tiers: Tier[];
  onPriceSelect?: (price: number, quantity: number, tierName: string) => void;
}

export default function PricingTiers({
  tiers = [],
  onPriceSelect,
}: PricingTiersProps) {
  const [selectedTierIndex, setSelectedTierIndex] = useState<number>(0);

  if (!tiers || tiers.length === 0) {
    return null;
  }

  const getUnitLabel = (tier: Tier) => {
    if (tier.weight) {
      return tier.weight; // e.g., "1g", "3.5g", "7g"
    }
    const qty = tier.qty;
    return `${qty} ${qty === 1 ? "unit" : "units"}`;
  };

  // Set initial price on mount
  useEffect(() => {
    if (tiers.length > 0 && onPriceSelect) {
      const tier = tiers[0];
      const price = typeof tier.price === "string" ? parseFloat(tier.price) : tier.price;
      onPriceSelect(price, tier.qty, getUnitLabel(tier));
    }
  }, []);

  return (
    <div className="space-y-2">
      <div className="relative">
        <select
          value={selectedTierIndex}
          onChange={(e) => {
            const index = parseInt(e.target.value);
            setSelectedTierIndex(index);
            const tier = tiers[index];
            const price = typeof tier.price === "string" ? parseFloat(tier.price) : tier.price;
            if (onPriceSelect) {
              onPriceSelect(price, tier.qty, getUnitLabel(tier));
            }
          }}
          className="w-full appearance-none bg-transparent border border-white/20 rounded-full px-4 py-3 pr-8 text-sm font-normal text-white hover:border-white/40 hover:bg-white/5 focus:border-white focus:outline-none transition-all duration-300 cursor-pointer uppercase tracking-[0.1em]"
          style={{
            colorScheme: 'dark'
          }}
        >
          {tiers.map((tier, index) => {
            const price = typeof tier.price === "string" ? parseFloat(tier.price) : tier.price;
            const tierLabel = getUnitLabel(tier);
            const pricePerUnit = tier.weight
              ? ` - $${price.toFixed(0)} ($${(price / tier.qty).toFixed(2)}/g)`
              : ` - $${price.toFixed(0)}`;
            
            return (
              <option key={index} value={index} className="bg-[#1a1a1a] text-white">
                {tierLabel}{pricePerUnit}
              </option>
            );
          })}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
          <svg className="w-3.5 h-3.5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

