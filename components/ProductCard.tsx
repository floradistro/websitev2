"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Store, Truck, Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLinkPrefetch } from "@/hooks/usePrefetch";

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
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const router = useRouter();
  
  const inWishlist = isInWishlist(product.id);
  
  // Aggressive prefetching for instant loads
  const prefetchHandlers = useLinkPrefetch(`/products/${product.id}`);
  
  // Also prefetch the API data
  useEffect(() => {
    // Prefetch API data immediately when card enters viewport
    const timer = setTimeout(() => {
      fetch(`/api/product/${product.id}`).catch(() => {});
    }, 100);
    return () => clearTimeout(timer);
  }, [product.id]);
  
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

  const handleCardClick = () => {
    router.push(`/products/${product.id}`);
  };

  const handleQuickBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/products/${product.id}`);
  };

  const handlePickup = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/products/${product.id}?type=pickup`);
  };

  const handleDelivery = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/products/${product.id}?type=delivery`);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0]?.src,
        slug: product.slug,
      });
    }
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
      className={`group block relative bg-[#3a3a3a] md:hover:bg-[#404040] active:bg-[#454545] cursor-pointer md:hover:shadow-2xl md:hover:-translate-y-1 border border-transparent md:hover:border-white/10 transition-none md:transition-all md:duration-300 ${!stockInfo.inStock ? 'opacity-75' : ''}`}
      onMouseEnter={(e) => {
        if (window.innerWidth >= 768) {
          setIsHovered(true);
          prefetchHandlers.onMouseEnter();
        }
      }}
      onMouseLeave={(e) => {
        if (window.innerWidth >= 768) {
          setIsHovered(false);
          prefetchHandlers.onMouseLeave();
        }
      }}
      onClick={(e) => {
        // Only navigate if not clicking on interactive elements
        const target = e.target as HTMLElement;
        if (!target.closest('button') && !target.closest('select') && !target.closest('a')) {
          handleCardClick();
        }
      }}
      style={{
        animation: `fadeInUp 0.6s ease-out ${index * 0.05}s both`,
      }}
    >
      {/* Product Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[#2a2a2a] md:transition-all md:duration-500">
        {product.images?.[0] ? (
          <>
            {/* Main Image - Optimized with Next.js Image */}
            <Image
              src={product.images[0].src}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 85vw, (max-width: 768px) 45vw, (max-width: 1024px) 32vw, 23vw"
              className="object-contain transition-all duration-700 ease-out group-hover:scale-105"
              loading="lazy"
              quality={85}
            />
          </>
        ) : (
          <>
            {/* Logo Fallback */}
            <div className="w-full h-full flex items-center justify-center p-12">
              <Image
                src="/logoprint.png"
                alt="Flora Distro"
                fill
                className="object-contain opacity-10 transition-opacity duration-500 group-hover:opacity-15"
                loading="lazy"
              />
            </div>
          </>
        )}

        {/* Wishlist Heart - Top Right */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2 right-2 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
            inWishlist 
              ? "bg-white text-black" 
              : "bg-black/40 backdrop-blur-sm text-white hover:bg-black/60"
          }`}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart 
            size={16} 
            className={`transition-all duration-300 ${
              inWishlist ? "fill-black" : "fill-none"
            }`}
            strokeWidth={2}
          />
        </button>

        {/* Badges Overlay - Top Left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {/* New Arrival Badge - Products created within last 7 days */}
          {product.date_created && new Date(product.date_created).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 && (
            <div className="bg-black border border-white/30 text-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
              New
            </div>
          )}
          
          {/* Best Seller Badge - Products with >10 sales */}
          {product.total_sales && product.total_sales > 10 && (
            <div className="bg-black border border-white/30 text-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
              Popular
            </div>
          )}
          
          {/* Low Stock Badge - When stock is available but low */}
          {product.stock_status === 'instock' && product.stock_quantity && product.stock_quantity <= 5 && product.stock_quantity > 0 && (
            <div className="bg-red-600/90 text-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
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
              className="interactive-button flex items-center gap-2 bg-black border border-white/20 text-white px-6 py-3 text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black active:bg-white active:text-black hover:border-white font-medium touch-target"
              style={{ minHeight: '44px' }}
            >
              <ShoppingBag size={12} strokeWidth={1.5} />
              <span>View Product</span>
            </button>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handlePickup}
                className="interactive-button flex items-center gap-1.5 bg-black border border-white/20 text-white px-4 py-3 hover:bg-white hover:text-black active:bg-white active:text-black hover:border-white text-[10px] uppercase tracking-[0.15em] font-medium touch-target"
                style={{ minHeight: '44px' }}
              >
                <Store size={11} strokeWidth={1.5} />
                <span>Pickup</span>
              </button>
              
              <button
                onClick={handleDelivery}
                className="interactive-button flex items-center gap-1.5 bg-black border border-white/20 text-white px-4 py-3 hover:bg-white hover:text-black active:bg-white active:text-black hover:border-white text-[10px] uppercase tracking-[0.15em] font-medium touch-target"
                style={{ minHeight: '44px' }}
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
        <h3 className="text-xs uppercase tracking-[0.12em] font-normal text-white line-clamp-2 leading-relaxed transition-all duration-300">
          {product.name}
        </h3>
        
        {/* Price */}
        <p className="text-sm font-medium text-white tracking-wide transition-all duration-300 group-hover:text-white/80">
          {getPriceDisplay()}
        </p>
        
        {/* Multi-Location Stock Status */}
        {stockInfo.inStock ? (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
              <span className="text-[11px] uppercase tracking-wider text-white/60 truncate">
                {stockInfo.count === 1 ? 'In Stock' : `In Stock · ${stockInfo.count} locations`}
              </span>
            </div>
            {stockInfo.count <= 2 && (
              <span className="text-[10px] text-white/40 truncate ml-3.5">
                {stockInfo.locations.map((loc: any) => loc.name).join(', ')}
              </span>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/60 flex-shrink-0"></div>
              <span className="text-[11px] uppercase tracking-wider text-white/40">Out of Stock</span>
            </div>
            <span className="text-[10px] text-white/30 ml-3.5">Check back soon</span>
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
          <div className="space-y-2 pt-2">
            <div className="relative">
                <select
                value={selectedTierIndex ?? ""}
                onChange={handleTierSelect}
                onClick={(e) => e.stopPropagation()}
                className="w-full appearance-none bg-transparent border border-white/20 px-3 py-2.5 md:py-2 pr-7 text-[11px] font-normal text-white hover:border-white/40 hover:bg-white/5 focus:border-white focus:outline-none transition-smooth cursor-pointer touch-manipulation uppercase tracking-[0.1em] focus-elegant"
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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddToCart(e);
                }}
                className="interactive-button w-full bg-black border border-white/20 text-white px-3 py-3 text-[10px] uppercase tracking-[0.15em] hover:bg-white hover:text-black active:bg-white active:text-black hover:border-white font-medium flex items-center justify-center gap-2 animate-fadeIn touch-manipulation hover:shadow-lg touch-target"
                style={{ minHeight: '44px' }}
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

