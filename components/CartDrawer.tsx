"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import Link from "next/link";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

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

interface ProductTiers {
  [productId: number]: {
    tiers: Tier[];
    unitType: string;
    blueprint: string;
  };
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeFromCart, updateCartItem, total, itemCount } = useCart();
  const [productTiers, setProductTiers] = useState<ProductTiers>({});
  const [loading, setLoading] = useState(false);

  const fetchProductTiers = useCallback(async () => {
    if (items.length === 0) return;
    
    setLoading(true);
    try {
      const baseUrl = "https://api.floradistro.com";
      const authParams = "consumer_key=ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5&consumer_secret=cs_38194e74c7ddc5d72b6c32c70485728e7e529678";
      
      const rulesResponse = await fetch(`${baseUrl}/wp-json/fd/v2/pricing/rules?${authParams}`);
      const pricingData = await rulesResponse.json();
      const rules: PricingRule[] = pricingData.rules || [];
      
      const uniqueProductIds = Array.from(new Set(items.map(item => item.productId)));
      const tiersData: ProductTiers = {};
      
      for (const productId of uniqueProductIds) {
        try {
          const fieldsResponse = await fetch(`${baseUrl}/wp-json/fd/v2/products/${productId}/fields?${authParams}`);
          const fields = await fieldsResponse.json();
          const blueprint = fields.fields?.[0]?.name || "";
          
          const matchingRule = rules.find((rule) => {
            if (rule.status !== "active") return false;
            try {
              const conditions = JSON.parse(rule.conditions);
              return conditions.blueprint_name === blueprint;
            } catch {
              return false;
            }
          });
          
          if (matchingRule) {
            try {
              const conditions = JSON.parse(matchingRule.conditions);
              tiersData[productId] = {
                tiers: conditions.tiers || [],
                unitType: conditions.unit_type || "units",
                blueprint: blueprint
              };
            } catch (error) {
              console.error(`Error parsing conditions for product ${productId}:`, error);
            }
          }
        } catch (error) {
          console.error(`Error fetching fields for product ${productId}:`, error);
        }
      }
      
      setProductTiers(tiersData);
    } catch (error) {
      console.error("Error fetching product tiers:", error);
    } finally {
      setLoading(false);
    }
  }, [items]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && items.length > 0) {
      fetchProductTiers();
    }
  }, [isOpen, items, fetchProductTiers]);

  const getUnitLabel = (tier: Tier, unitType: string) => {
    if (unitType === "grams") {
      return tier.name;
    } else if (unitType === "units" || unitType === "pieces") {
      const qty = tier.min_quantity;
      return `${qty} ${qty === 1 ? "unit" : "units"}`;
    }
    return tier.name;
  };

  const handleTierSelect = (productId: number, tier: Tier, tierLabel: string) => {
    const price = typeof tier.price === "string" ? parseFloat(tier.price) : tier.price;
    
    updateCartItem(productId, {
      quantity: tier.min_quantity,
      price: price,
      tierName: tierLabel
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full sm:w-[440px] bg-[#2a2a2a] shadow-2xl flex flex-col animate-slideInRight border-l border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <h2 className="text-sm font-light uppercase tracking-[0.2em] text-white">
            Cart ({itemCount})
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 transition-colors"
          >
            <X size={20} className="text-white/60" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <div className="w-20 h-20 border border-white/10 flex items-center justify-center mb-4">
                <X size={32} className="text-white/20" />
              </div>
              <p className="text-base font-light text-white/50 mb-6">
                Your cart is empty
              </p>
              <Link
                href="/products"
                onClick={onClose}
                className="inline-flex items-center gap-2 bg-black border border-white/20 text-white px-8 py-3 text-xs uppercase tracking-[0.2em] hover:bg-black/70 transition-all"
              >
                <span>Shop Products</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div>
              {items.map((item) => {
                const tiers = productTiers[item.productId]?.tiers || [];
                const unitType = productTiers[item.productId]?.unitType || "units";
                
                return (
                  <div key={`${item.productId}-${item.tierName}`} className="p-6 group hover:bg-[#333333] transition-colors border-b border-white/5">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-[#1a1a1a] flex-shrink-0 flex items-center justify-center">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <img
                            src="/logoprint.png"
                            alt="Flora Distro"
                            className="w-full h-full object-contain opacity-20"
                          />
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xs text-white mb-1 line-clamp-2 uppercase tracking-wider">
                          {item.name}
                        </h3>
                        
                        {item.orderType && (
                          <p className="text-[10px] text-white/40 mb-3 capitalize">
                            {item.orderType === "pickup" 
                              ? `Pickup: ${item.locationName || "Store"}` 
                              : "Delivery"}
                          </p>
                        )}

                        {/* Pricing Tiers Selector */}
                        <div className="mt-3 space-y-2">
                          {loading && tiers.length === 0 ? (
                            <div className="h-10 bg-white/5 animate-pulse"></div>
                          ) : tiers.length > 0 ? (
                            <>
                              <div className="relative">
                                <select
                                  value={tiers.findIndex(t => getUnitLabel(t, unitType) === item.tierName)}
                                  onChange={(e) => {
                                    const selectedIndex = parseInt(e.target.value);
                                    const tier = tiers[selectedIndex];
                                    const tierLabel = getUnitLabel(tier, unitType);
                                    handleTierSelect(item.productId, tier, tierLabel);
                                  }}
                                  className="w-full appearance-none bg-white/5 border border-white/10 px-3 py-2 pr-8 text-[11px] text-white hover:border-white/30 focus:border-white/40 focus:outline-none transition-colors cursor-pointer uppercase tracking-wider"
                                >
                                  {tiers.map((tier, index) => {
                                    const price = typeof tier.price === "string" ? parseFloat(tier.price) : tier.price;
                                    const tierLabel = getUnitLabel(tier, unitType);
                                    const pricePerUnit = unitType === "grams" 
                                      ? ` - $${price.toFixed(0)} ($${(price / tier.min_quantity).toFixed(2)}/g)`
                                      : ` - $${price.toFixed(0)}`;
                                    
                                    return (
                                      <option key={index} value={index}>
                                        {tierLabel}{pricePerUnit}
                                      </option>
                                    );
                                  })}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                  <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>
                              <p className="text-sm font-medium text-white">
                                ${(item.price * item.quantity).toFixed(0)}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-[10px] text-white/40 mb-1">{item.tierName}</p>
                              <p className="text-sm font-medium text-white">
                                ${(item.price * item.quantity).toFixed(0)}
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-white/5 h-fit"
                      >
                        <Trash2 size={14} className="text-white/40 hover:text-white transition-colors" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-white/10 p-6 space-y-4 bg-[#1a1a1a]">
            <div className="flex justify-between items-center text-base font-light text-white">
              <span>Subtotal</span>
              <span>${total.toFixed(0)}</span>
            </div>
            <p className="text-[10px] text-white/40 text-center">
              Shipping calculated at checkout
            </p>
            <Link
              href="/checkout"
              onClick={onClose}
              className="group block w-full bg-black border border-white/20 text-white text-center px-8 py-4 text-xs uppercase tracking-[0.25em] hover:bg-black/70 hover:border-white/40 transition-all font-medium relative overflow-hidden"
            >
              <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <span className="relative z-10">Checkout</span>
            </Link>
            <button
              onClick={onClose}
              className="block w-full text-center text-xs uppercase tracking-wider text-white/50 hover:text-white transition-colors py-2"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
