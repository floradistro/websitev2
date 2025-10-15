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

  return (
    <div className="-mx-3 md:mx-0 mb-6 md:mb-8 bg-white/5 backdrop-blur-sm md:rounded-lg py-4 md:p-8 border-y md:border border-white/10">
      <h3 className="text-sm uppercase tracking-[0.15em] font-semibold mb-4 md:mb-6 text-white text-center px-3">
        Select Quantity
      </h3>
      <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-5 overflow-x-auto scrollbar-hide px-3 py-2">
        <div className="flex items-center gap-2 sm:gap-3 md:gap-5 py-1">
          {tiers.map((tier, index) => {
            const price = typeof tier.price === "string" 
              ? parseFloat(tier.price) 
              : tier.price;
            
            const isSelected = selectedTierIndex === index;
            
            // Dynamic sizing based on number of tiers
            const tierCount = tiers.length;
            let sizeClasses = "w-[72px] h-[72px] sm:w-24 sm:h-24 md:w-28 md:h-28";
            if (tierCount >= 6) {
              sizeClasses = "w-16 h-16 sm:w-20 sm:h-20 md:w-26 md:h-26";
            } else if (tierCount >= 5) {
              sizeClasses = "w-[68px] h-[68px] sm:w-22 sm:h-22 md:w-28 md:h-28";
            }

            return (
              <button
                key={index}
                onClick={() => {
                  setSelectedTierIndex(index);
                  if (onPriceSelect) {
                    onPriceSelect(price, tier.min_quantity, getUnitLabel(tier));
                  }
                }}
                className="relative group flex-shrink-0"
              >
                <div className={`${sizeClasses} rounded-full border-2 transition-all duration-300 flex items-center justify-center overflow-hidden ${
                  isSelected 
                    ? "border-white bg-white text-black shadow-elevated-lg scale-105" 
                    : "border-white/20 bg-white/5 text-white hover:border-white/60 shadow-elevated hover:shadow-elevated-lg"
                }`}>
                  <div className={`absolute inset-0 bg-gradient-to-br from-white/20 to-transparent transition-opacity duration-300 rounded-full ${
                    isSelected ? "opacity-30" : "opacity-0 group-hover:opacity-100"
                  }`}></div>
                  <div className="relative text-center px-1">
                    <div className={`text-[10px] sm:text-xs md:text-sm font-light uppercase tracking-wider mb-1 ${
                      isSelected ? "text-black/70" : "text-white/60"
                    }`}>
                      {getUnitLabel(tier)}
                    </div>
                    <div className="text-base sm:text-lg md:text-xl font-light">
                      ${price.toFixed(0)}
                    </div>
                    {unitType === "grams" && (
                      <div className={`text-[9px] sm:text-[10px] md:text-xs font-light mt-0.5 ${
                        isSelected ? "text-black/60" : "text-white/50"
                      }`}>
                        ${(price / tier.min_quantity).toFixed(2)}/g
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

