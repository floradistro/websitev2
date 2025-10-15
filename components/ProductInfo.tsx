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
      <div className="animate-fadeIn space-y-6">
        {/* Product Name & Price */}
        <div>
          <div className="relative inline-block mb-4 product-name-animate">
            <h1 
              className="logo-font text-3xl md:text-5xl leading-tight tracking-[0.08em] text-white relative"
              style={{ 
                fontWeight: 300
              }}
            >
              {product.name}
            </h1>
            {/* Subtle glow effect */}
            <div 
              className="absolute -inset-2 bg-gradient-to-r from-transparent via-white/5 to-transparent blur-xl opacity-30 -z-10"
              style={{
                animation: 'pulse 3s ease-in-out infinite'
              }}
            />
          </div>

          <div className="flex items-baseline gap-3 mb-2">
            <div className="text-3xl md:text-4xl font-light text-white">
              {selectedPrice ? `$${selectedPrice.toFixed(2)}` : (typeof priceDisplay === 'string' ? priceDisplay : `$${priceDisplay}`)}
            </div>
            {!selectedPrice && hasPricingTiers && (
              <span className="text-sm text-white/50 font-light">per unit</span>
            )}
          </div>
          
          {selectedQuantity && (
            <div className="inline-flex items-center gap-2 bg-white text-black px-3 py-1.5 rounded-full text-xs font-light">
              {selectedQuantity} selected
            </div>
          )}
          
          {!selectedPrice && hasPricingTiers && (
            <p className="text-sm text-white/60 font-light mt-2 italic">
              Price varies by quantity - select below
            </p>
          )}
        </div>

        {/* Short Description */}
        {product.short_description && (
          <div className="border-l-2 border-white/30 pl-4 py-2 bg-white/5 backdrop-blur-sm rounded-r-lg pr-4">
            <div
              className="text-sm md:text-base text-white/90 leading-relaxed font-light prose prose-sm prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: product.short_description }}
            />
          </div>
        )}

        {/* Stock Status Badge */}
        {product.stock_status === "instock" && (
          <div className="inline-flex items-center gap-2 text-green-300 text-xs font-light bg-green-950/80 border border-green-800/50 px-3 py-1.5 rounded-full backdrop-blur-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            In Stock
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

