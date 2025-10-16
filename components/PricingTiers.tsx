"use client";

import { useState, useEffect } from "react";

interface Tier {
  name: string;
  min_quantity: number;
  max_quantity: number | null;
  price: string | number;
}

interface PricingRule {
  id: string;
  rule_name: string;
  rule_type: string;
  conditions: string;
  status: string;
}

interface PricingTiersProps {
  pricingRules: { rules: PricingRule[] };
  productBlueprint?: string;
  onPriceSelect?: (price: number, quantity: number, tierName: string) => void;
}

export default function PricingTiers({
  pricingRules,
  productBlueprint,
  onPriceSelect,
}: PricingTiersProps) {
  const [selectedTierIndex, setSelectedTierIndex] = useState<number>(0);
  // Find the pricing rule that matches the product's blueprint
  const matchingRule = pricingRules.rules.find((rule) => {
    if (rule.status !== "active") return false;
    
    try {
      const conditions = JSON.parse(rule.conditions);
      return conditions.blueprint_name === productBlueprint;
    } catch {
      return false;
    }
  });

  if (!matchingRule) {
    return null;
  }

  let tiers: Tier[] = [];
  let unitType = "units";

  try {
    const conditions = JSON.parse(matchingRule.conditions);
    tiers = conditions.tiers || [];
    unitType = conditions.unit_type || "units";
  } catch (error) {
    console.error("Failed to parse pricing conditions", error);
    return null;
  }

  if (tiers.length === 0) {
    return null;
  }

  const getUnitLabel = (tier: Tier) => {
    if (unitType === "grams") {
      return tier.name; // Already formatted as "1g", "3.5g", etc.
    } else if (unitType === "units" || unitType === "pieces") {
      const qty = tier.min_quantity;
      return `${qty} ${qty === 1 ? "unit" : "units"}`;
    }
    return tier.name;
  };

  // Set initial price on mount
  useEffect(() => {
    if (tiers.length > 0 && onPriceSelect) {
      const tier = tiers[0];
      const price = typeof tier.price === "string" ? parseFloat(tier.price) : tier.price;
      onPriceSelect(price, tier.min_quantity, getUnitLabel(tier));
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
              onPriceSelect(price, tier.min_quantity, getUnitLabel(tier));
            }
          }}
          className="w-full appearance-none bg-transparent border border-white/20 px-3 py-3 pr-7 text-sm font-normal text-white hover:border-white/40 hover:bg-white/5 focus:border-white focus:outline-none transition-all duration-300 cursor-pointer uppercase tracking-[0.1em] rounded-sm"
          style={{
            colorScheme: 'dark'
          }}
        >
          {tiers.map((tier, index) => {
            const price = typeof tier.price === "string" ? parseFloat(tier.price) : tier.price;
            const tierLabel = getUnitLabel(tier);
            const pricePerUnit = unitType === "grams" 
              ? ` - $${price.toFixed(0)} ($${(price / tier.min_quantity).toFixed(2)}/g)`
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

