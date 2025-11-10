"use client";

import { useState } from "react";
import { X, ShoppingBag, Package, Tag, Info } from "lucide-react";
import Image from "next/image";

interface PricingTier {
  break_id: string;
  label: string;
  qty: number;
  unit: string;
  price?: number;
  sort_order?: number;
}

interface ProductField {
  label: string;
  value: string;
  type: string;
}

interface Vendor {
  id: string;
  store_name: string;
  logo_url: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string | null;
  description?: string | null;
  short_description?: string | null;
  fields?: ProductField[];
  inventory_quantity: number;
  inventory_id: string;
  pricing_tiers?: PricingTier[];
  vendor?: Vendor | null;
}

interface POSQuickViewProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export function POSQuickView({ product, onClose, onAddToCart }: POSQuickViewProps) {
  const [selectedTier, setSelectedTier] = useState<string>("custom");
  const [customQuantity, setCustomQuantity] = useState<string>("1");

  const sortedTiers = product.pricing_tiers
    ? [...product.pricing_tiers].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    : [];

  const handleQuickAdd = () => {
    let quantity = 0;

    if (selectedTier === "custom") {
      quantity = parseFloat(customQuantity);
    } else {
      const tier = sortedTiers.find((t) => t.break_id === selectedTier);
      if (tier) {
        quantity = tier.qty;
      }
    }

    if (quantity > 0) {
      onAddToCart(product, quantity);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            {product.vendor?.logo_url && (
              <div className="relative w-10 h-10 flex-shrink-0 bg-white/10 rounded-xl overflow-hidden border border-white/10">
                <Image
                  src={product.vendor.logo_url}
                  alt={product.vendor.store_name || "Vendor"}
                  fill
                  className="object-contain p-1"
                />
              </div>
            )}
            <div>
              <h2
                className="text-xl font-black text-white uppercase tracking-tight"
                style={{ fontWeight: 900 }}
              >
                Quick View
              </h2>
              {product.vendor && (
                <div className="text-white/40 text-[10px] uppercase tracking-wider">
                  {product.vendor.store_name}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all"
          >
            <X size={16} className="text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {/* Top Section: Image + Basic Info */}
          <div className="grid grid-cols-12 gap-6 mb-6">
            {/* Left: Image */}
            {product.image_url && (
              <div className="col-span-3">
                <div className="aspect-square bg-white/5 rounded-2xl overflow-hidden relative">
                  <Image
                    src={product.image_url}
                    alt={product.name}
                    fill
                    className="object-contain p-2"
                  />
                </div>
              </div>
            )}

            {/* Right: Product Info */}
            <div className={product.image_url ? "col-span-9" : "col-span-12"}>
              <div className="grid grid-cols-3 gap-4">
                {/* Column 1: Basic Info */}
                <div className="col-span-2">
                  <h3
                    className="text-2xl font-black text-white uppercase tracking-tight mb-2"
                    style={{ fontWeight: 900 }}
                  >
                    {product.name}
                  </h3>

                  {product.category && (
                    <div className="text-white/40 text-xs uppercase tracking-[0.15em] mb-3">
                      {product.category}
                    </div>
                  )}

                  {/* Short Description */}
                  {product.short_description && (
                    <p className="text-white/60 text-sm mb-4 leading-relaxed">
                      {product.short_description}
                    </p>
                  )}

                  {/* Full Description */}
                  {product.description && (
                    <div className="mb-4">
                      <div className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2">
                        Full Description
                      </div>
                      <p className="text-white/70 text-xs leading-relaxed">{product.description}</p>
                    </div>
                  )}
                </div>

                {/* Column 2: Stock & Price */}
                <div>
                  {/* Stock Status */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-3">
                    <div className="text-white/40 text-[9px] uppercase tracking-wider mb-1">
                      Stock
                    </div>
                    <div
                      className={`text-lg font-black ${
                        product.inventory_quantity > 10
                          ? "text-green-400"
                          : product.inventory_quantity > 0
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                      style={{ fontWeight: 900 }}
                    >
                      {product.inventory_quantity}
                    </div>
                  </div>

                  {/* Base Price */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-3">
                    <div className="text-white/40 text-[9px] uppercase tracking-wider mb-1">
                      Base Price
                    </div>
                    <div className="text-white font-black text-xl" style={{ fontWeight: 900 }}>
                      ${product.price.toFixed(2)}
                    </div>
                  </div>

                  {/* Pricing Tier Dropdown */}
                  {sortedTiers.length > 0 && (
                    <div className="mb-3">
                      <div className="text-white/40 text-[9px] uppercase tracking-wider mb-2">
                        Select Quantity
                      </div>
                      <select
                        value={selectedTier}
                        onChange={(e) => setSelectedTier(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all cursor-pointer appearance-none"
                      >
                        <option value="custom" className="bg-black text-white">
                          Custom Quantity
                        </option>
                        {sortedTiers.map((tier) => (
                          <option
                            key={tier.break_id}
                            value={tier.break_id}
                            className="bg-black text-white"
                          >
                            {tier.label} - {tier.qty} {tier.unit}
                            {tier.price !== undefined ? ` ($${tier.price.toFixed(2)})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Custom Quantity Input */}
                  {selectedTier === "custom" && (
                    <div className="mb-3">
                      <div className="text-white/40 text-[9px] uppercase tracking-wider mb-2">
                        Quantity
                      </div>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={customQuantity}
                        onChange={(e) => setCustomQuantity(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-xl text-xs focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all"
                        placeholder="Enter quantity"
                      />
                    </div>
                  )}

                  {/* Quick Add */}
                  <button
                    onClick={handleQuickAdd}
                    className="w-full bg-white/10 text-white border-2 border-white/20 rounded-xl py-3 text-xs font-black uppercase tracking-[0.15em] hover:bg-white/20 hover:border-white/30 transition-all duration-300 flex items-center justify-center gap-2"
                    style={{ fontWeight: 900 }}
                  >
                    <ShoppingBag size={14} />
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Product Fields - Enhanced Grid */}
          {product.fields && product.fields.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Info size={12} className="text-white/40" />
                <div className="text-white/40 text-[10px] uppercase tracking-[0.15em]">
                  Product Information
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {product.fields.map((field, index) => (
                  <div
                    key={index}
                    className="bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/[0.07] hover:border-white/15 transition-all"
                  >
                    <div className="flex items-start gap-2 mb-1.5">
                      <Tag size={10} className="text-white/30 mt-0.5 flex-shrink-0" />
                      <div className="text-white/40 text-[9px] uppercase tracking-wider leading-tight">
                        {field.label}
                      </div>
                    </div>
                    <div className="text-white text-sm font-semibold pl-4">
                      {field.value || "N/A"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
