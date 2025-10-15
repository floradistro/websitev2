"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Store, Truck } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: any;
  index: number;
  locations: any[];
  pricingRules?: any;
  productFields?: {
    fields: { [key: string]: string };
    blueprintName?: string | null;
  };
}

export default function ProductCard({ product, index, locations, pricingRules, productFields }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedTierIndex, setSelectedTierIndex] = useState<number | null>(null);
  const [showAddToCart, setShowAddToCart] = useState(false);
  const { addToCart } = useCart();
  
  // Get pricing tiers for this product
  const [tiers, setTiers] = useState<any[]>([]);
  const [unitType, setUnitType] = useState<string>("units");
  
  useEffect(() => {
    if (!pricingRules || !productFields) return;
    
    const blueprintName = productFields.blueprintName;
    if (!blueprintName) return;
    
    // Find matching pricing rule
    const matchingRule = pricingRules.rules?.find((rule: any) => {
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
        setTiers(conditions.tiers || []);
        setUnitType(conditions.unit_type || "units");
      } catch (error) {
        console.error("Error parsing tier conditions:", error);
      }
    }
  }, [pricingRules, productFields, product]);
  
  const getUnitLabel = (tier: any) => {
    if (unitType === "grams") {
      return tier.name;
    } else if (unitType === "units" || unitType === "pieces") {
      const qty = tier.min_quantity;
      return `${qty} ${qty === 1 ? "unit" : "units"}`;
    }
    return tier.name;
  };
  
  const handleTierSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const index = parseInt(e.target.value);
    setSelectedTierIndex(index);
    setShowAddToCart(index >= 0);
  };
  
  const handleDropdownClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (selectedTierIndex === null || !tiers[selectedTierIndex]) return;
    
    const tier = tiers[selectedTierIndex];
    const price = typeof tier.price === "string" ? parseFloat(tier.price) : tier.price;
    const tierLabel = getUnitLabel(tier);
    
    addToCart({
      productId: product.id,
      name: product.name,
      price: price,
      quantity: tier.min_quantity,
      tierName: tierLabel,
      image: product.images?.[0]?.src,
    });
    
    // Reset selection after adding
    setSelectedTierIndex(null);
    setShowAddToCart(false);
  };

  // Get all product fields to display
  const getDisplayFields = () => {
    if (!productFields?.fields) return [];
    
    const fields = productFields.fields;
    const displayFields: Array<{ label: string; value: string }> = [];
    
    // Field configuration with proper labels (only real fields)
    const fieldConfig: { [key: string]: string } = {
      'thc_%': 'THC',
      'thc_percentage': 'THC',
      'thca_%': 'THCa',
      'thca_percentage': 'THCa',
      'strain_type': 'Strain',
      'lineage': 'Lineage',
      'nose': 'Aroma',
      'terpene': 'Terpenes',
      'terpenes': 'Terpenes',
      'effects': 'Effects',
      'effect': 'Effects'
    };
    
    // Iterate through all fields and add those with values
    Object.keys(fields).forEach((key) => {
      const value = fields[key];
      const label = fieldConfig[key];
      
      // Only add if field has a value and label exists
      if (value && value.trim() !== '' && label) {
        // Check if we already added this label (e.g., THC from different keys)
        const existingField = displayFields.find(f => f.label === label);
        if (!existingField) {
          displayFields.push({ label, value });
        }
      }
    });
    
    return displayFields;
  };

  const displayFields = getDisplayFields();
  
  // Get price range from tiers
  const getPriceDisplay = () => {
    if (tiers.length === 0) {
      return `$${product.price ? parseFloat(product.price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}`;
    }
    
    if (selectedTierIndex !== null && tiers[selectedTierIndex]) {
      const tier = tiers[selectedTierIndex];
      const price = typeof tier.price === "string" ? parseFloat(tier.price) : tier.price;
      return `$${price.toFixed(0)}`;
    }
    
    // Show price range
    const prices = tiers.map((t: any) => 
      typeof t.price === "string" ? parseFloat(t.price) : t.price
    );
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (minPrice === maxPrice) {
      return `$${minPrice.toFixed(0)}`;
    }
    
    return `$${minPrice.toFixed(0)} - $${maxPrice.toFixed(0)}`;
  };

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/products/${product.id}`;
  };

  const handlePickup = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/products/${product.id}?type=pickup`;
  };

  const handleDelivery = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = `/products/${product.id}?type=delivery`;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.tagName === 'SELECT' || target.tagName === 'BUTTON' || target.tagName === 'OPTION' || target.closest('select') || target.closest('button')) {
      return;
    }
    window.location.href = `/products/${product.id}`;
  };

  return (
    <div
      className="group block relative bg-[#2a2a2a] hover:bg-[#333333] transition-colors duration-300 border border-white/5 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      style={{
        animation: `fadeInUp 0.6s ease-out ${index * 0.05}s both`,
      }}
    >
      {/* Product Image Container */}
      <div className="relative aspect-[4/5] mb-2 overflow-hidden bg-[#1a1a1a] shadow-md group-hover:shadow-2xl transition-all duration-500 border-b border-white/5">
        {product.images?.[0] ? (
          <>
            {/* Main Image */}
            <img
              src={product.images[0].src}
              alt={product.name}
              className="w-full h-full object-contain transition-all duration-700 ease-out group-hover:scale-110"
            />
          </>
        ) : (
          <>
            {/* Logo Fallback */}
            <div className="w-full h-full flex items-center justify-center p-8">
              <img
                src="/logoprint.png"
                alt="Flora Distro"
                className="w-full h-full object-contain opacity-20 transition-opacity duration-300 group-hover:opacity-30"
              />
            </div>
          </>
        )}

        {/* Quick Actions Overlay - Desktop */}
        <div className={`hidden md:flex absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent items-end justify-center pb-6 transition-all duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <div className="flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleQuickBuy}
              className="flex items-center gap-2 bg-white text-black px-4 py-2.5 text-xs uppercase tracking-wider hover:bg-white/90 transition-all font-medium shadow-lg"
            >
              <ShoppingBag size={14} />
              <span>Quick Buy</span>
            </button>
            
            <button
              onClick={handlePickup}
              className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-white px-3 py-2.5 hover:bg-white/20 transition-all shadow-lg border border-white/20 text-xs uppercase tracking-wider font-medium"
            >
              <Store size={14} />
              <span>Pickup</span>
            </button>
            
            <button
              onClick={handleDelivery}
              className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-white px-3 py-2.5 hover:bg-white/20 transition-all shadow-lg border border-white/20 text-xs uppercase tracking-wider font-medium"
            >
              <Truck size={14} />
              <span>Delivery</span>
            </button>
          </div>
        </div>

      </div>

      {/* Product Info */}
      <div className="space-y-2.5 px-3 md:px-2 py-3 md:py-2.5 transform transition-transform duration-300 group-hover:translate-x-1">
        <h3 className="text-3xl md:text-3xl leading-snug line-clamp-2 font-thin group-hover:opacity-70 transition-opacity duration-200 logo-font tracking-wider text-white">
          {product.name}
        </h3>
        
        {/* Blueprint Fields */}
        {displayFields.length > 0 && (
          <div className="space-y-1.5 bg-white/5 backdrop-blur-sm px-2.5 py-2 rounded-sm border border-white/10 w-full">
            {displayFields.map((field, idx) => (
              <div key={idx} className="flex items-baseline gap-2 w-full">
                <span className="uppercase tracking-[0.15em] font-medium text-white/40 text-[10px] md:text-[9px] min-w-[70px] md:min-w-[60px] whitespace-nowrap">
                  {field.label}
                </span>
                <span className="text-sm md:text-xs tracking-wide text-white/70 font-light flex-1 text-right truncate">
                  {field.value}
                </span>
              </div>
            ))}
          </div>
        )}
        
        {/* Pricing Tier Selector */}
        {tiers.length > 0 && (
          <div className="space-y-2" onClick={handleDropdownClick}>
            <div className="relative">
              <select
                value={selectedTierIndex ?? ""}
                onChange={handleTierSelect}
                onClick={handleDropdownClick}
                className="w-full appearance-none bg-white/5 border border-white/10 px-3 py-3 md:py-2 pr-8 text-sm md:text-xs font-light text-white/90 hover:border-white/30 focus:border-white/50 focus:outline-none transition-colors cursor-pointer touch-manipulation"
                style={{ minHeight: '44px' }}
              >
                <option value="">Select Quantity</option>
                {tiers.map((tier, index) => {
                  const price = typeof tier.price === "string" ? parseFloat(tier.price) : tier.price;
                  const tierLabel = getUnitLabel(tier);
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
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 md:pr-2 pointer-events-none">
                <svg className="w-5 h-5 md:w-4 md:h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {showAddToCart && (
              <button
                onClick={handleAddToCart}
                className="w-full bg-white text-black px-3 py-3 md:py-2.5 text-sm md:text-xs uppercase tracking-wider hover:bg-white/90 active:bg-white/80 transition-all font-medium flex items-center justify-center gap-2 animate-fadeIn shadow-lg touch-manipulation"
                style={{ minHeight: '44px' }}
              >
                <ShoppingBag size={16} className="md:w-3.5 md:h-3.5" />
                Add to Cart
              </button>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between pt-1.5 border-t border-white/10">
          <p className="text-lg md:text-lg font-light tracking-wide text-white">
            {getPriceDisplay()}
          </p>
          
          {/* Availability Indicator */}
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-sm shadow-green-400/50"></div>
            <span className="text-[10px] text-white/50 uppercase tracking-[0.15em] font-light">In Stock</span>
          </div>
        </div>
      </div>
    </div>
  );
}

