"use client";

/**
 * Composite Component: ProductCard
 * Yacht Club design - Premium cannabis product card
 * Features: Hover effects, badges, stock status, pricing tiers, wishlist, quick actions
 */

import React, { useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Heart, ShoppingBag } from 'lucide-react';
import NextImage from 'next/image';

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    primary_image_url?: string | null;
    featured_image_storage?: string | null;
    image_url?: string | null;
    images?: Array<{ src: string }>;
    base_price?: number;
    price?: number;
    stock_quantity?: number;
    stock_status?: string;
    date_created?: string;
    total_sales?: number;
    pricing_tiers?: any[];
    fields?: any;
    inventory?: any[];
  };
  index?: number;
  locations?: any[];
  showPrice?: boolean;
  showQuickAdd?: boolean;
  imageAspect?: '1:1' | '4:3' | '3:4';
  cardStyle?: 'minimal' | 'bordered' | 'elevated';
  onQuickAdd?: (productId: string) => void;
  basePath?: string;
  className?: string;
}

export function ProductCard({
  product,
  index = 0,
  locations = [],
  showPrice = true,
  showQuickAdd = true,
  imageAspect = '1:1',
  cardStyle = 'minimal',
  onQuickAdd,
  basePath = '/storefront/products',
  className = '',
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [selectedTierIndex, setSelectedTierIndex] = useState<number | null>(null);
  const [showAddToCart, setShowAddToCart] = useState(false);
  const stockRef = useRef<HTMLDivElement>(null);
  
  // Preserve vendor params
  let productUrl = `${basePath}/${product.slug}`;
  
  try {
    const searchParams = useSearchParams();
    const vendor = searchParams?.get('vendor');
    const preview = searchParams?.get('preview');
    
    if (vendor) {
      productUrl += `?vendor=${vendor}`;
      if (preview) productUrl += `&preview=${preview}`;
    }
  } catch (e) {
    // Fallback
  }

  // Get stock status - simpler logic
  const getStockInfo = () => {
    // Primary check: product-level stock status
    const inStock = product.stock_status === 'instock' || 
                    product.stock_status === 'in_stock';
    
    // If we have inventory AND locations, show detailed info
    if (product.inventory && product.inventory.length > 0 && locations.length > 0) {
      const activeLocations = locations.filter((loc: any) => 
        loc.is_active === "1" || loc.is_active === 1 || loc.is_active === true
      );
      const stockLocations: any[] = [];

      product.inventory.forEach((inv: any) => {
        const qty = parseFloat(inv.stock_quantity || inv.quantity || inv.stock || 0);
        const status = inv.status?.toLowerCase();
        const hasStock = qty > 0 || status === 'instock' || status === 'in_stock';

        if (hasStock) {
          const location = activeLocations.find((loc: any) => 
            loc.id === parseInt(inv.location_id) || 
            loc.id.toString() === inv.location_id?.toString()
          );
          if (location && !stockLocations.find(l => l.id === location.id)) {
            stockLocations.push(location);
          }
        }
      });

      if (stockLocations.length > 0) {
        return {
          inStock: true,
          locations: stockLocations,
          count: stockLocations.length
        };
      }
    }
    
    // Default: simple in stock based on product status
    return {
      inStock,
      locations: [],
      count: inStock ? 1 : 0
    };
  };

  const stockInfo = getStockInfo();
  
  // Get pricing tiers
  const tiers = product.pricing_tiers || [];
  
  const getUnitLabel = (tier: any) => {
    if (tier.weight) {
      return tier.weight; // e.g., "1g", "3.5g", "7g"
    }
    const qty = tier.qty || tier.min_quantity || 1;
    return `${qty} ${qty === 1 ? "unit" : "units"}`;
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
    
    // Trigger onQuickAdd with tier info
    onQuickAdd?.(product.id);
    
    // Reset selection after adding
    setSelectedTierIndex(null);
    setShowAddToCart(false);
  };
  
  // Get price display
  const getPriceDisplay = () => {
    // If tier is selected, show that price
    if (selectedTierIndex !== null && tiers[selectedTierIndex]) {
      const tier = tiers[selectedTierIndex];
      const price = typeof tier.price === "string" ? parseFloat(tier.price) : tier.price;
      return `$${price.toFixed(0)}`;
    }
    
    // If we have tiers, show price range
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
    
    // Fallback to base price
    const basePrice = product.base_price || product.price || 0;
    return basePrice > 0 ? `$${basePrice.toFixed(0)}` : 'Contact for Pricing';
  };
  

  // Get product fields (THC%, Strain, etc)
  const getDisplayFields = () => {
    if (!product.fields) return [];
    
    const fields = product.fields;
    const displayFields: Array<{ label: string; value: string }> = [];
    
    const fieldConfig: { [key: string]: string } = {
      'thc_%': 'THC %',
      'thc_percentage': 'THC %',
      'thca_%': 'THCa %',
      'thca_percentage': 'THCa %',
      'delta9_percentage': 'Δ9',
      'thc_content': 'THC',
      'cbd_content': 'CBD',
      'strain_type': 'Type',
      'lineage': 'Lineage',
      'genetics': 'Genetics',
      'terpenes': 'Terpenes',
      'terpene_profile': 'Terpenes',
      'effects': 'Effects',
      'flavors': 'Flavors',
      'nose': 'Nose',
    };
    
    Object.keys(fields).forEach((key) => {
      const label = fieldConfig[key];
      if (label && fields[key]) {
        displayFields.push({ label, value: fields[key] });
      }
    });
    
    return displayFields; // Show all fields
  };

  const displayFields = getDisplayFields();
  
  // Check if product is new (created within last 7 days)
  const isNew = product.date_created && 
    new Date(product.date_created).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
  
  // Check if popular (>10 sales)
  const isPopular = product.total_sales && product.total_sales > 10;
  
  // Check stock level
  const isLowStock = product.stock_status === 'instock' && 
    product.stock_quantity && 
    product.stock_quantity <= 5 && 
    product.stock_quantity > 0;
  
  const isOutOfStock = product.stock_status === 'outofstock' || 
    (product.stock_quantity !== undefined && product.stock_quantity <= 0);

  const imageUrl = product.images?.[0]?.src || 
    product.primary_image_url || 
    product.featured_image_storage || 
    product.image_url;

  return (
    <div
      className={`group flex flex-col relative bg-[#0a0a0a] hover:bg-[#141414] cursor-pointer hover:shadow-2xl hover:shadow-white/5 sm:hover:-translate-y-1 border border-white/5 hover:border-white/10 transition-all duration-300 rounded-xl sm:rounded-2xl overflow-hidden ${!stockInfo.inStock ? 'opacity-60' : ''} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        animation: `fadeInUp 0.6s ease-out ${index * 0.05}s both`,
      }}
    >
      {/* Product Image */}
      <a href={productUrl} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-black rounded-t-2xl">
          {imageUrl ? (
            <NextImage
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 85vw, (max-width: 768px) 45vw, (max-width: 1024px) 32vw, 23vw"
              className="object-contain transition-all duration-700 ease-out group-hover:scale-105"
              loading="lazy"
              quality={85}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">
              No Image
            </div>
          )}

          {/* Wishlist Heart - Top Right */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setInWishlist(!inWishlist);
            }}
            className={`absolute top-3 right-3 z-10 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 backdrop-blur-xl ${
              inWishlist 
                ? "bg-white text-black" 
                : "bg-black/60 border border-white/10 text-white hover:bg-black/80 hover:border-white/20"
            }`}
          >
            <Heart 
              size={16} 
              className={inWishlist ? "fill-black" : "fill-none"}
              strokeWidth={2}
            />
          </button>

          {/* Badges - Top Left */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {isNew && (
              <div className="bg-black/80 backdrop-blur-xl border border-white/20 text-white px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider rounded-lg">
                New
              </div>
            )}
            
            {isPopular && (
              <div className="bg-black/80 backdrop-blur-xl border border-white/20 text-white px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider rounded-lg">
                Popular
              </div>
            )}
            
            {isLowStock && (
              <div className="bg-red-600/90 backdrop-blur-xl border border-red-500/30 text-white px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider rounded-lg">
                Only {product.stock_quantity} Left
              </div>
            )}
          </div>

          {/* Quick Actions Overlay - Desktop */}
          <div className={`hidden md:flex absolute inset-0 bg-black/60 backdrop-blur-xl items-center justify-center transition-all duration-500 ${
            isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}>
            <button
              onClick={(e) => {
                e.preventDefault();
                window.location.href = productUrl;
              }}
              className="flex items-center gap-2 bg-white text-black border-2 border-white rounded-2xl px-6 py-3 text-xs uppercase tracking-[0.15em] hover:bg-black hover:text-white hover:border-white font-bold transition-all duration-300 shadow-2xl shadow-white/20"
            >
              <ShoppingBag size={14} strokeWidth={2} />
              <span>View Product</span>
            </button>
          </div>
        </div>
      </a>

      {/* Product Info */}
      <div className="flex flex-col flex-1 px-3 sm:px-4 py-3 sm:py-4">
        <div className="space-y-3">
          {/* Product Name */}
          <a href={productUrl}>
            <h3 className="text-sm sm:text-xs uppercase tracking-[0.12em] text-white line-clamp-2 leading-relaxed hover:text-white/80 transition-colors" style={{ fontWeight: 900 }}>
              {product.name}
            </h3>
          </a>
          
          {/* Price */}
          {showPrice && (
            <p className="text-sm font-medium text-white tracking-wide">
              {getPriceDisplay()}
            </p>
          )}
          
          {/* Multi-Location Stock Status */}
          {stockInfo.inStock ? (
            <div className="flex flex-col gap-0.5">
              <div 
                ref={stockRef}
                className="flex items-center gap-1.5"
              >
                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                <span className="text-[11px] uppercase tracking-wider text-white/60 truncate">
                  {stockInfo.count === 1 ? 'In Stock' : `In Stock · ${stockInfo.count} locations`}
                </span>
              </div>
              
              {/* Show first 2 locations only */}
              {stockInfo.locations.length > 0 && (
                <span className="text-[10px] text-white/40 truncate ml-3.5">
                  {stockInfo.locations.slice(0, 2).map((loc: any) => loc.name).join(', ')}
                  {stockInfo.locations.length > 2 && ` +${stockInfo.locations.length - 2} more`}
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
          
          {/* Product Fields (THC%, Strain, etc) */}
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
        </div>
        
        {/* Pricing Tier Selector - If product has tiers */}
        {tiers.length > 0 && stockInfo.inStock && (
          <div className="space-y-2 pt-3 mt-auto border-t border-white/10">
            <div className="relative">
              <select
                value={selectedTierIndex ?? ""}
                onChange={handleTierSelect}
                onClick={(e) => e.stopPropagation()}
                className="w-full appearance-none bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-3 pr-7 text-[11px] font-normal text-white hover:border-white/20 hover:bg-white/10 focus:border-white/20 focus:bg-white/10 focus:outline-none transition-all cursor-pointer uppercase tracking-[0.1em]"
              >
                <option value="" className="bg-black">Select Quantity</option>
                {tiers.map((tier, index) => {
                  const price = typeof tier.price === "string" ? parseFloat(tier.price) : tier.price;
                  const tierLabel = getUnitLabel(tier);
                  const qty = tier.qty || tier.min_quantity || 1;
                  const pricePerUnit = tier.weight
                    ? ` - $${price.toFixed(0)} ($${(price / qty).toFixed(2)}/g)`
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
                className="w-full bg-white text-black border-2 border-white rounded-2xl px-3 py-3 text-[10px] uppercase tracking-[0.15em] hover:bg-black hover:text-white hover:border-white font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-white/10"
              >
                <ShoppingBag size={13} strokeWidth={2.5} />
                Add to Cart
              </button>
            )}
          </div>
        )}
        
        {/* Quick Add Button - Only if NO pricing tiers */}
        {tiers.length === 0 && showQuickAdd && stockInfo.inStock && (
          <div className="pt-3 mt-auto">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickAdd?.(product.id);
              }}
              className="w-full bg-white text-black border-2 border-white rounded-2xl px-3 py-3 text-[10px] uppercase tracking-[0.15em] hover:bg-black hover:text-white hover:border-white font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-white/10"
            >
              <ShoppingBag size={13} strokeWidth={2.5} />
              Quick Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

