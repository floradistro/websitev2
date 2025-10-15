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
    <div className="mb-6 md:mb-8">
      <h3 className="text-xs uppercase tracking-wider font-semibold mb-3 md:mb-4">
        Quantity Pricing
      </h3>
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 overflow-x-auto scrollbar-hide px-2 py-2">
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 py-1">
          {tiers.map((tier, index) => {
            const price = typeof tier.price === "string" 
              ? parseFloat(tier.price) 
              : tier.price;
            
            const isSelected = selectedTierIndex === index;
            
            // Dynamic sizing based on number of tiers
            const tierCount = tiers.length;
            let sizeClasses = "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24";
            if (tierCount >= 6) {
              sizeClasses = "w-14 h-14 sm:w-18 sm:h-18 md:w-24 md:h-24";
            } else if (tierCount >= 5) {
              sizeClasses = "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24";
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
                    ? "border-black bg-black text-white shadow-elevated-lg scale-105" 
                    : "border-[#e5e5e2] bg-[#f5f5f2] hover:border-black shadow-elevated hover:shadow-elevated-lg"
                }`}>
                  <div className={`absolute inset-0 bg-gradient-to-br from-white/50 to-transparent transition-opacity duration-300 rounded-full ${
                    isSelected ? "opacity-20" : "opacity-0 group-hover:opacity-100"
                  }`}></div>
                  <div className="relative text-center px-0.5 sm:px-1">
                    <div className={`text-[8px] sm:text-[10px] md:text-xs font-light uppercase tracking-wider mb-0.5 ${
                      isSelected ? "text-white/80" : "text-[#999]"
                    }`}>
                      {getUnitLabel(tier)}
                    </div>
                    <div className="text-sm sm:text-base md:text-lg font-light">
                      ${price.toFixed(0)}
                    </div>
                    {unitType === "grams" && (
                      <div className={`text-[7px] sm:text-[9px] md:text-[10px] font-light ${
                        isSelected ? "text-white/70" : "text-[#999]"
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
      <p className="text-xs text-[#999] mt-3 font-light text-center">
        Select quantity at checkout for applicable pricing
      </p>
    </div>
  );
}

