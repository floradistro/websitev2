"use client";

import { useState } from "react";
import PricingTiers from "./PricingTiers";

interface ProductInfoProps {
  product: any;
  pricingRules: any;
  blueprintName: string | null;
  onPriceSelect?: (price: number, quantity: number, tierName: string) => void;
}

export default function ProductInfo({
  product,
  pricingRules,
  blueprintName,
  onPriceSelect,
}: ProductInfoProps) {
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<string | null>(null);

  // Calculate price range from pricing tiers
  const getPriceRange = () => {
    if (!pricingRules || !blueprintName) {
      return product.price ? parseFloat(product.price) : 0;
    }

    const matchingRule = pricingRules.rules.find((rule: any) => {
      if (rule.status !== "active") return false;
      try {
        const conditions = JSON.parse(rule.conditions);
        return conditions.blueprint_name === blueprintName;
      } catch {
        return false;
      }
    });

    if (matchingRule) {
      try {
        const conditions = JSON.parse(matchingRule.conditions);
        const tiers = conditions.tiers || [];
        if (tiers.length > 0) {
          const prices = tiers.map((t: any) => 
            typeof t.price === "string" ? parseFloat(t.price) : t.price
          );
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          
          if (minPrice === maxPrice) {
            return `$${minPrice.toFixed(0)}`;
          }
          return `$${minPrice.toFixed(0)} - $${maxPrice.toFixed(0)}`;
        }
      } catch {
        return product.price ? parseFloat(product.price) : 0;
      }
    }

    return product.price ? parseFloat(product.price) : 0;
  };

  const priceDisplay = getPriceRange();
  const hasPricingTiers = typeof priceDisplay === 'string' && priceDisplay.includes('-');

  const handlePriceSelect = (price: number, quantity: number, tierName: string) => {
    setSelectedPrice(price);
    setSelectedQuantity(tierName);
    if (onPriceSelect) {
      onPriceSelect(price, quantity, tierName);
    }
  };

  return (
    <>
      <div className="animate-fadeIn">
        <h1 className="text-2xl md:text-3xl font-light leading-snug mb-4">
          {product.name}
        </h1>

        <div className="text-2xl font-light mb-2">
          {selectedPrice ? `$${selectedPrice.toFixed(2)}` : (typeof priceDisplay === 'string' ? priceDisplay : `$${priceDisplay}`)}
        </div>
        
        {selectedQuantity && (
          <p className="text-xs text-black font-light mb-2">
            {selectedQuantity} selected
          </p>
        )}
        
        {!selectedPrice && hasPricingTiers && (
          <p className="text-xs text-[#999] font-light mb-8">
            Price varies by quantity
          </p>
        )}
      </div>

      {product.short_description && (
        <div
          className="text-[#767676] leading-relaxed font-light"
          dangerouslySetInnerHTML={{ __html: product.short_description }}
        />
      )}

      {/* Pricing Tiers */}
      {blueprintName && pricingRules && (
        <PricingTiers 
          pricingRules={pricingRules}
          productBlueprint={blueprintName}
          onPriceSelect={handlePriceSelect}
        />
      )}
    </>
  );
}

