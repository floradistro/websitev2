"use client";

import { useState, memo } from "react";
import { ShoppingBag, Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface ProductCardProps {
  product: any;
  index: number;
  locations?: any[];
  pricingTiers?: any[];
  productFields?: {
    fields: { [key: string]: string };
  };
  inventory?: any[];
}

function ProductCard({ product, index, locations = [], pricingTiers = [], productFields, inventory = [] }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedTierIndex, setSelectedTierIndex] = useState<number | null>(null);
  const [showAddToCart, setShowAddToCart] = useState(false);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const router = useRouter();
  
  const inWishlist = isInWishlist(product.id);
  
  const tiers = pricingTiers || [];
  
  const getUnitLabel = (tier: any) => {
    if (tier.label) return tier.label;
    if (tier.weight) return tier.weight;
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
    const tierLabel = getUnitLabel(tier);
    
    addToCart({
      productId: product.id,
      name: product.name,
      price: price,
      quantity: 1,
      tierName: tierLabel,
      image: product.images?.[0]?.src,
    });
    
    setSelectedTierIndex(null);
    setShowAddToCart(false);
  };

  const getDisplayFields = () => {
    if (!productFields?.fields) {
      console.log('No productFields for', product.name);
      return [];
    }
    
    const fields = productFields.fields;
    console.log('Product fields for', product.name, ':', fields);
    const displayFields: Array<{ label: string; value: string }> = [];
    
    const fieldConfig: { [key: string]: string } = {
      'strain_type': 'Type',
      'lineage': 'Lineage',
      'terpene_profile': 'Terpenes',
      'terpenes': 'Terpenes',
      'effects': 'Effects',
      'effect': 'Effects',
      'thca_percentage': 'THCa %',
      'thc_percentage': 'THC %',
      'delta_9_percentage': 'Δ9 %',
      'cbd_percentage': 'CBD %',
      'nose': 'Nose',
      'flavors': 'Flavors',
    };
    
    Object.keys(fields).forEach((key) => {
      const value = fields[key];
      const label = fieldConfig[key];
      
      if (!label) return;
      
      const existingField = displayFields.find(f => f.label === label);
      if (!existingField && value !== null && value !== undefined) {
        let displayValue: string;
        
        if (Array.isArray(value)) {
          displayValue = value.length > 0 ? value.join(', ') : '—';
        } else if (typeof value === 'number') {
          displayValue = String(value);
        } else if (typeof value === 'string') {
          displayValue = value.trim() !== '' ? value : '—';
        } else {
          displayValue = String(value);
        }
        
        displayFields.push({ label, value: displayValue });
      }
    });
    
    console.log('Display fields for', product.name, ':', displayFields);
    return displayFields.slice(0, 5);
  };

  const displayFields = getDisplayFields();
  console.log('Product', product.name, 'has', pricingTiers?.length || 0, 'pricing tiers');
  
  const getPriceDisplay = () => {
    if (tiers.length > 0) {
      if (selectedTierIndex !== null && tiers[selectedTierIndex]) {
        const tier = tiers[selectedTierIndex];
        const price = typeof tier.price === "string" ? parseFloat(tier.price) : tier.price;
        return `$${price.toFixed(0)}`;
      }
      
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
    
    const basePrice = product.price ? parseFloat(product.price) : 0;
    
    if (basePrice === 0 || !product.price) {
      return 'Contact for Pricing';
    }
    
    return `$${basePrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const handleCardClick = () => {
    router.push(`/products/${product.uuid || product.id}`);
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
    const totalStockFromProduct = parseFloat(product.total_stock || product.stock_quantity || 0);
    
    if (!inventory || inventory.length === 0) {
      return { 
        inStock: totalStockFromProduct > 0 || product.stock_status === 'instock', 
        locations: [], 
        count: 0,
        showGenericStock: totalStockFromProduct > 0
      };
    }
    
    const activeLocations = locations.filter((loc: any) => loc.is_active);
    const stockLocations: any[] = [];

    inventory.forEach((inv: any) => {
      const qty = parseFloat(inv.quantity || inv.stock || 0);
      
      if (qty > 0) {
        const location = activeLocations.find((loc: any) => 
          loc.id === inv.location_id || 
          loc.id.toString() === inv.location_id?.toString()
        );
        if (location && !stockLocations.find(l => l.id === location.id)) {
          stockLocations.push({
            ...location,
            quantity: qty
          });
        }
      }
    });

    return {
      inStock: stockLocations.length > 0,
      locations: stockLocations,
      count: stockLocations.length,
      showGenericStock: false
    };
  };

  const stockInfo = getStockLocations();
  const totalStock = product.stock_quantity || product.total_stock || 0;
  const inStock = stockInfo.inStock;

  return (
    <div
      className={`group flex flex-col relative bg-[#3a3a3a] md:hover:bg-[#404040] cursor-pointer md:hover:shadow-2xl md:hover:-translate-y-1 border border-transparent md:hover:border-white/10 transition-all duration-300 ${!inStock ? 'opacity-75' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      style={{
        animation: `fadeInUp 0.6s ease-out ${index * 0.05}s both`,
      }}
    >
      {/* Product Image */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[#2a2a2a]">
        {product.images?.[0] ? (
          <Image
            src={product.images[0].src || product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 85vw, (max-width: 768px) 45vw, (max-width: 1024px) 32vw, 23vw"
            className="object-contain transition-all duration-700 ease-out group-hover:scale-105"
            loading="lazy"
            quality={85}
          />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center p-12">
            <div className="text-white/10 text-xs">No Image</div>
          </div>
        )}

        {/* Wishlist Heart */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2 right-2 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${
            inWishlist 
              ? "bg-white text-black" 
              : "bg-black/40 backdrop-blur-sm text-white hover:bg-black/60"
          }`}
        >
          <Heart 
            size={16} 
            className={`transition-all duration-300 ${inWishlist ? "fill-black" : "fill-none"}`}
            strokeWidth={2}
          />
        </button>

        {/* Low Stock Badge */}
        {inStock && totalStock <= 5 && totalStock > 0 && (
          <div className="absolute top-2 left-2 bg-red-600/90 text-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
            Only {totalStock} Left
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-col flex-1 px-3 py-4">
        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-[0.12em] font-normal text-white line-clamp-2 leading-relaxed">
            {product.name}
          </h3>
          
          <p className="text-sm font-medium text-white tracking-wide">
            {getPriceDisplay()}
          </p>
          
          {/* Stock Status with Locations */}
          {stockInfo.inStock ? (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-white/60">
                  In Stock
                </span>
                {!stockInfo.showGenericStock && stockInfo.locations.length > 0 && (
                  <span className="text-[10px] tracking-wider text-white/40">
                    {stockInfo.locations.slice(0, 2).map((loc: any) => loc.name).join(', ')}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500/60 flex-shrink-0"></div>
                <span className="text-[11px] uppercase tracking-wider text-white/40">Out of Stock</span>
              </div>
              <span className="text-[10px] text-white/30">Check back soon</span>
            </div>
          )}
          
          {/* Fields */}
          {displayFields.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              {displayFields.map((field, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2">
                  <span className="uppercase tracking-[0.12em] font-medium text-white/60 text-[10px]">
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
        
        {/* Pricing Tier Selector */}
        {tiers.length > 0 && (
          <div className="space-y-2 pt-3 mt-auto border-t border-white/10">
            <div className="relative">
              <select
                value={selectedTierIndex ?? ""}
                onChange={handleTierSelect}
                onClick={(e) => e.stopPropagation()}
                className="w-full appearance-none bg-transparent border border-white/20 px-3 py-2.5 pr-7 text-[11px] font-normal text-white hover:border-white/40 hover:bg-white/5 focus:border-white focus:outline-none transition-all cursor-pointer uppercase tracking-[0.1em]"
              >
                <option value="">Select Quantity</option>
                {tiers.map((tier, idx) => {
                  const price = typeof tier.price === "string" ? parseFloat(tier.price) : tier.price;
                  const tierLabel = getUnitLabel(tier);
                  const displayPrice = price > 0 ? `$${price.toFixed(2)}` : 'TBD';
                  
                  return (
                    <option key={idx} value={idx}>
                      {tierLabel} - {displayPrice}
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
                className="w-full bg-black border border-white/20 text-white px-3 py-3 text-[10px] uppercase tracking-[0.15em] hover:bg-white hover:text-black hover:border-white font-medium flex items-center justify-center gap-2 transition-all"
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

export default memo(ProductCard);

