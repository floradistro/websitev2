"use client";

import { useState } from "react";
import PricingTiers from "./PricingTiers";

interface ProductInfoProps {
  product: any;
  pricingTiers: any[];
  onPriceSelect?: (price: number, quantity: number, tierName: string) => void;
}

export default function ProductInfo({
  product,
  pricingTiers = [],
  onPriceSelect,
}: ProductInfoProps) {
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<string | null>(null);

  // Calculate price range from pricing tiers
  const getPriceRange = () => {
    if (!pricingTiers || pricingTiers.length === 0) {
      return product.price ? parseFloat(product.price) : 0;
    }

    const prices = pricingTiers.map((t: any) => 
      typeof t.price === "string" ? parseFloat(t.price) : t.price
    );
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (minPrice === maxPrice) {
      return `$${minPrice.toFixed(0)}`;
    }
    return `$${minPrice.toFixed(0)} - $${maxPrice.toFixed(0)}`;
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
      <div className="animate-fadeIn space-y-3">
        {/* Product Name - Matches ProductCard */}
        <h1 className="text-2xl sm:text-3xl uppercase tracking-[0.12em] font-normal text-white leading-relaxed">
          {product.name}
        </h1>

        {/* Price - Matches ProductCard */}
        <p className="text-sm font-medium text-white tracking-wide">
          {selectedPrice ? `$${selectedPrice.toFixed(0)}` : (typeof priceDisplay === 'string' ? priceDisplay : `$${priceDisplay}`)}
        </p>

        {/* Stock Status - Matches ProductCard */}
        {product.stock_status === "instock" && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-[11px] uppercase tracking-wider text-white/60">In Stock</span>
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
      {pricingTiers && pricingTiers.length > 0 && (
        <div className="mt-6">
          <PricingTiers 
            tiers={pricingTiers}
            onPriceSelect={handlePriceSelect}
          />
        </div>
      )}
    </>
  );
}

