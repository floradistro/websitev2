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
  inventory?: any[];
}

export default function ProductCard({ product, index, locations, pricingRules, productFields, inventory = [] }: ProductCardProps) {
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
      quantity: 1,
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
      'effect': 'Effects',
      'mg_per_pack': 'Per Pack',
      'mg_per_piece': 'Per Piece',
      'ingredients': 'Made With',
      'type': 'Type'
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
    // If we have tiers, use them
    if (tiers.length > 0) {
      if (selectedTierIndex !== null && tiers[selectedTierIndex]) {
        const tier = tiers[selectedTierIndex];
        const price = typeof tier.price === "string" ? parseFloat(tier.price) : tier.price;
        return `$${price.toFixed(0)}`;
      }
      
      // Show price range from tiers
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
    
    // Fallback to product.price from WooCommerce
    const basePrice = product.price ? parseFloat(product.price) : 0;
    
    // If product has no price set, return empty/contact message
    if (basePrice === 0 || !product.price) {
      return 'Contact for Pricing';
    }
    
    return `$${basePrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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

  // Get locations where product is in stock
  const getStockLocations = () => {
    if (!inventory || inventory.length === 0) {
      return { inStock: false, locations: [], count: 0 };
    }

    const activeLocations = locations.filter((loc: any) => loc.is_active === "1");
    const stockLocations: any[] = [];

    inventory.forEach((inv: any) => {
      const qty = parseFloat(inv.stock_quantity || inv.quantity || inv.stock || 0);
      const status = inv.status?.toLowerCase();
      const hasStock = qty > 0 || status === 'instock' || status === 'in_stock';

      if (hasStock) {
        const location = activeLocations.find((loc: any) => 
          loc.id === parseInt(inv.location_id) || loc.id.toString() === inv.location_id?.toString()
        );
        if (location && !stockLocations.find(l => l.id === location.id)) {
          stockLocations.push(location);
        }
      }
    });

    return {
      inStock: stockLocations.length > 0,
      locations: stockLocations,
      count: stockLocations.length
    };
  };

  const stockInfo = getStockLocations();

  return (
    <div
      className="group block relative bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 cursor-pointer hover:shadow-2xl hover:-translate-y-1 border border-transparent hover:border-white/10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      style={{
        animation: `fadeInUp 0.6s ease-out ${index * 0.05}s both`,
      }}
    >
      {/* Product Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[#2a2a2a] transition-all duration-500">
        {product.images?.[0] ? (
          <>
            {/* Main Image */}
            <img
              src={product.images[0].src}
              alt={product.name}
              loading="lazy"
              className="w-full h-full object-contain transition-all duration-700 ease-out group-hover:scale-105"
            />
          </>
        ) : (
          <>
            {/* Logo Fallback */}
            <div className="w-full h-full flex items-center justify-center p-12">
              <img
                src="/logoprint.png"
                alt="Flora Distro"
                loading="lazy"
                className="w-full h-full object-contain opacity-10 transition-opacity duration-500 group-hover:opacity-15"
              />
            </div>
          </>
        )}

        {/* Badges Overlay - Top Left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {/* New Arrival Badge - Products created within last 7 days */}
          {product.date_created && new Date(product.date_created).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 && (
            <div className="bg-black border border-white/30 text-white px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider">
              New
            </div>
          )}
          
          {/* Best Seller Badge - Products with >10 sales */}
          {product.total_sales && product.total_sales > 10 && (
            <div className="bg-black border border-white/30 text-white px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider">
              Popular
            </div>
          )}
          
          {/* Low Stock Badge - When stock is available but low */}
          {product.stock_status === 'instock' && product.stock_quantity && product.stock_quantity <= 5 && product.stock_quantity > 0 && (
            <div className="bg-red-600/90 text-white px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider">
              Only {product.stock_quantity} Left
            </div>
          )}
        </div>

        {/* Quick Actions Overlay - Desktop */}
        <div className={`hidden md:flex absolute inset-0 bg-black/40 backdrop-blur-[3px] items-center justify-center transition-all duration-500 ${
          isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <div className="flex flex-col items-center gap-2 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-500">
            <button
              onClick={handleQuickBuy}
              className="flex items-center gap-2 bg-black border border-white/20 text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-white hover:text-black hover:border-white transition-all duration-300 font-medium"
            >
              <ShoppingBag size={12} strokeWidth={1.5} />
              <span>View Product</span>
            </button>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handlePickup}
                className="flex items-center gap-1.5 bg-black border border-white/20 text-white px-4 py-2.5 hover:bg-white hover:text-black hover:border-white transition-all duration-300 text-[9px] uppercase tracking-[0.2em] font-medium"
              >
                <Store size={11} strokeWidth={1.5} />
                <span>Pickup</span>
              </button>
              
              <button
                onClick={handleDelivery}
                className="flex items-center gap-1.5 bg-black border border-white/20 text-white px-4 py-2.5 hover:bg-white hover:text-black hover:border-white transition-all duration-300 text-[9px] uppercase tracking-[0.2em] font-medium"
              >
                <Truck size={11} strokeWidth={1.5} />
                <span>Delivery</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Product Info */}
      <div className="space-y-3 px-3 py-4">
        <h3 className="text-xs uppercase tracking-[0.15em] font-normal text-white line-clamp-2 leading-relaxed transition-all duration-300 group-hover:tracking-[0.2em]">
          {product.name}
        </h3>
        
        {/* Price */}
        <p className="text-sm font-medium text-white tracking-wide transition-all duration-300 group-hover:text-white/80">
          {getPriceDisplay()}
        </p>
        
        {/* Multi-Location Stock Status */}
        {stockInfo.inStock ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-[10px] uppercase tracking-wider text-white/60">
                {stockInfo.count === 1 ? 'In Stock' : `In Stock at ${stockInfo.count} locations`}
              </span>
            </div>
            {stockInfo.count <= 2 && (
              <span className="text-[9px] text-white/40 truncate">
                {stockInfo.locations.map((loc: any) => loc.name).join(', ')}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span className="text-[10px] uppercase tracking-wider text-white/60">Out of Stock</span>
          </div>
        )}
        
        {/* Blueprint Fields */}
        {displayFields.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            {displayFields.map((field, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2">
                <span className="uppercase tracking-[0.12em] font-medium text-white/60 text-[10px] whitespace-nowrap">
                  {field.label}
                </span>
                <span className="text-[11px] tracking-wide text-white/90 font-normal text-right truncate">
                  {field.value}
                </span>
              </div>
            ))}
          </div>
        )}
        
        {/* Pricing Tier Selector */}
        {tiers.length > 0 && (
          <div className="space-y-2 pt-2" onClick={handleDropdownClick}>
            <div className="relative">
                <select
                value={selectedTierIndex ?? ""}
                onChange={handleTierSelect}
                onClick={handleDropdownClick}
                className="w-full appearance-none bg-transparent border border-white/20 px-3 py-2.5 md:py-2 pr-7 text-[11px] font-normal text-white hover:border-white/40 hover:bg-white/5 focus:border-white focus:outline-none transition-all duration-300 cursor-pointer touch-manipulation uppercase tracking-[0.1em]"
                style={{ minHeight: '40px' }}
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
              <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                <svg className="w-3.5 h-3.5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {showAddToCart && (
              <button
                onClick={handleAddToCart}
                className="w-full bg-black border border-white/20 text-white px-3 py-2.5 md:py-2 text-[10px] uppercase tracking-[0.15em] hover:bg-white hover:text-black hover:border-white transition-all duration-300 font-medium flex items-center justify-center gap-2 animate-fadeIn touch-manipulation hover:shadow-lg active:scale-95"
                style={{ minHeight: '40px' }}
              >
                <ShoppingBag size={13} strokeWidth={2} />
                Add to Cart
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

