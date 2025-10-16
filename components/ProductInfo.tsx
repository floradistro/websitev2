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
      <div className="animate-fadeIn space-y-4">
        {/* Product Name */}
        <h1 className="text-xs uppercase tracking-[0.15em] font-normal text-white leading-relaxed">
          {product.name}
        </h1>

        {/* Price */}
        <p className="text-sm font-medium text-white tracking-wide">
          {selectedPrice ? `$${selectedPrice.toFixed(0)}` : (typeof priceDisplay === 'string' ? priceDisplay : `$${priceDisplay}`)}
        </p>

        {/* Stock Status */}
        {product.stock_status === "instock" && (
          <div className="flex items-center gap-2 text-white/60 text-xs">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
            In Stock
          </div>
        )}

        {/* Short Description */}
        {product.short_description && (
          <div className="pt-2 border-t border-white/10">
            <div
              className="text-xs text-white/80 leading-relaxed prose prose-sm prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: product.short_description }}
            />
          </div>
        )}
      </div>

      {/* Pricing Tiers */}
      {blueprintName && pricingRules && (
        <div className="mt-6">
          <PricingTiers 
            pricingRules={pricingRules}
            productBlueprint={blueprintName}
            onPriceSelect={handlePriceSelect}
          />
        </div>
      )}
    </>
  );
}

