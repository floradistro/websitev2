"use client";

import { useState, memo } from "react";
import { Heart } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import Image from "next/image";
import Link from "next/link";

interface StorefrontProductCardProps {
  product: any;
  vendorSlug?: string;
  locations?: any[];
}

function StorefrontProductCard({ product, vendorSlug, locations = [] }: StorefrontProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  
  const inWishlist = isInWishlist(product.id);
  
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

  // Get display fields - same logic as main ProductCard
  const getDisplayFields = () => {
    if (!product.fields) return [];
    
    const fields = product.fields;
    const displayFields: Array<{ label: string; value: string }> = [];
    
    // Field configuration with proper labels - ALL available fields from API
    const fieldConfig: { [key: string]: string } = {
      // Flower fields
      'thca_percentage': 'THCA',
      'delta9_percentage': 'Δ9',
      'thc_content': 'THC',
      'cbd_content': 'CBD',
      'strain_type': 'Type',
      'lineage': 'Lineage',
      'genetics': 'Genetics',
      'nose': 'Nose',
      'terpene_profile': 'Terpenes',
      'terpenes': 'Terpenes',
      'effects': 'Effects',
      'effect': 'Effects',
      'flavors': 'Flavors',
      // Vape fields
      'hardware_type': 'Hardware',
      'oil_type': 'Oil',
      'capacity': 'Capacity',
      // Edible fields
      'dosage_per_serving': 'Dosage',
      'servings_per_package': 'Servings',
      'total_dosage': 'Total',
      'dietary': 'Dietary',
      'ingredients': 'Ingredients',
      // Concentrate fields
      'extract_type': 'Type',
      'extraction_method': 'Method',
    };
    
    // Iterate through all fields with consistent sorting
    const sortedKeys = Object.keys(fields).sort();
    
    sortedKeys.forEach((key) => {
      const value = fields[key];
      const label = fieldConfig[key];
      
      // Only show fields we have labels for
      if (!label) return;
      
      // Check if we already added this label
      const existingField = displayFields.find(f => f.label === label);
      if (!existingField && value !== null && value !== undefined) {
        let displayValue: string;
        
        // Handle arrays (terpenes, effects, etc.)
        if (Array.isArray(value)) {
          displayValue = value.length > 0 ? value.join(', ') : '—';
        } 
        // Handle numbers
        else if (typeof value === 'number') {
          displayValue = String(value);
        }
        // Handle strings
        else if (typeof value === 'string') {
          displayValue = value.trim() !== '' ? value : '—';
        }
        // Handle other types
        else {
          displayValue = String(value);
        }
        
        // Only add if not empty dash
        if (displayValue !== '—' && displayValue.trim() !== '') {
          displayFields.push({ label, value: displayValue });
        }
      }
    });
    
    // Return all fields, not just 3
    return displayFields;
  };

  const displayFields = getDisplayFields();

  // Get price display
  const getPriceDisplay = () => {
    const pricingTiers = product.pricingTiers || [];
    
    if (pricingTiers.length > 0) {
      const prices = pricingTiers.map((t: any) => parseFloat(t.price));
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      if (minPrice === maxPrice) {
        return `$${minPrice.toFixed(0)}`;
      }
      return `$${minPrice.toFixed(0)} - $${maxPrice.toFixed(0)}`;
    }
    
    const price = parseFloat(product.price || product.regular_price || 0);
    return `$${price.toFixed(0)}`;
  };

  // Get product URL
  const productUrl = vendorSlug 
    ? `/storefront/products/${product.slug || product.id}?vendor=${vendorSlug}`
    : `/storefront/products/${product.slug || product.id}`;

  // Get stock locations
  const getStockLocations = () => {
    const totalStockFromProduct = parseFloat(product.total_stock || product.stock_quantity || 0);
    const inventory = product.inventory || [];
    
    if (!inventory || inventory.length === 0) {
      return { 
        inStock: totalStockFromProduct > 0 || product.stock_status === 'instock', 
        locations: [], 
        count: 0,
        showGenericStock: totalStockFromProduct > 0
      };
    }
    
    const activeLocations = locations.filter((loc: any) => 
      loc.is_active === "1" || loc.is_active === 1 || loc.is_active === true
    );
    
    const stockLocations: any[] = [];
    
    inventory.forEach((inv: any) => {
      const qty = parseFloat(inv.quantity || 0);
      
      if (qty > 0) {
        const location = activeLocations.find((loc: any) => 
          String(loc.id) === String(inv.location_id)
        );
        
        if (location) {
          stockLocations.push({
            id: location.id,
            name: location.name || location.location_name,
            quantity: qty
          });
        }
      }
    });
    
    return {
      inStock: stockLocations.length > 0 || totalStockFromProduct > 0,
      locations: stockLocations,
      count: stockLocations.length,
      showGenericStock: stockLocations.length === 0 && totalStockFromProduct > 0
    };
  };

  const stockInfo = getStockLocations();

  return (
    <Link 
      href={productUrl}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Container */}
      <div className="relative aspect-[4/5] bg-black overflow-hidden mb-4">
        {/* Subtle Picture Frame */}
        <div className="absolute inset-0 pointer-events-none z-20 rounded-t-[20px] sm:rounded-t-[32px] overflow-hidden">
          {/* Inner shadow frame */}
          <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.7)]" />
          {/* Thick transparent border glow */}
          <div className="absolute inset-[12px] rounded-[8px] sm:rounded-[20px] border-[8px] border-white/[0.03] shadow-[0_0_15px_rgba(255,255,255,0.04)]" />
        </div>

        {product.images?.[0]?.src ? (
          <Image
            src={product.images[0].src}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 85vw, (max-width: 768px) 45vw, (max-width: 1024px) 32vw, 23vw"
            className="object-contain transition-all duration-700 ease-out group-hover:scale-105"
            loading="lazy"
            quality={85}
          />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center p-12">
            <Image
              src="https://uaednwpxursknmwdeejn.supabase.co/storage/v1/object/public/vendor-logos/cd2e1122-d511-4edb-be5d-98ef274b4baf/1761031336714_Your%20paragraph%20text.png"
              alt="Yacht Club"
              fill
              sizes="(max-width: 640px) 85vw, (max-width: 768px) 45vw, (max-width: 1024px) 32vw, 23vw"
              className="object-contain opacity-10 transition-opacity duration-500 group-hover:opacity-15"
              loading="lazy"
            />
          </div>
        )}

        {/* Wishlist Heart - Top Right */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-2 right-2 z-30 p-2 transition-all duration-300 hover:scale-110"
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart 
            size={20} 
            className={`transition-all duration-300 ${
              inWishlist 
                ? "fill-white text-white drop-shadow-lg" 
                : "fill-none text-white drop-shadow-lg hover:fill-white/50"
            }`}
            strokeWidth={2}
          />
        </button>

        {/* Badges Overlay - Top Left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-20">
          {/* New Arrival Badge */}
          {product.date_created && new Date(product.date_created).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 && (
            <div className="bg-black border border-white/30 text-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
              New
            </div>
          )}
          
          {/* Best Seller Badge */}
          {product.total_sales && product.total_sales > 10 && (
            <div className="bg-black border border-white/30 text-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
              Popular
            </div>
          )}
          
          {/* Low Stock Badge */}
          {stockInfo.inStock && product.total_stock && product.total_stock <= 5 && product.total_stock > 0 && (
            <div className="bg-red-600/90 text-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
              Only {product.total_stock} Left
            </div>
          )}
        </div>

        {/* Hover Overlay - Desktop */}
        <div className={`hidden md:flex absolute inset-0 items-center justify-center transition-all duration-500 bg-black/60 backdrop-blur-xl ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="flex flex-col items-center gap-2 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-500">
            <div className="bg-white text-black px-6 py-3 text-xs uppercase tracking-[0.2em] font-medium rounded-full shadow-lg">
              View Product
            </div>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="flex flex-col px-3 space-y-2">
        {/* Product Name */}
        <h3 
          className="text-sm uppercase tracking-[0.12em] line-clamp-2 leading-relaxed transition-all duration-300 text-white"
          style={{ fontWeight: 900 }}
        >
          {product.name}
        </h3>
        
        {/* Stock Status with Locations - Right after name */}
        {stockInfo.inStock ? (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-wider text-neutral-400">
                In Stock
              </span>
              {!stockInfo.showGenericStock && stockInfo.locations.length > 0 && (
                <span className="text-[11px] tracking-wider text-neutral-500">
                  {stockInfo.count} {stockInfo.count === 1 ? 'location' : 'locations'}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500/60 flex-shrink-0"></div>
            <span className="text-[11px] uppercase tracking-wider text-neutral-400">
              Out of Stock
            </span>
          </div>
        )}
        
        {/* Product Fields - Stacked vertically */}
        {displayFields.length > 0 && (
          <div className="flex flex-col gap-1">
            {displayFields.map((field, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-[10px]">
                <span className="text-neutral-500 uppercase tracking-wider whitespace-nowrap">{field.label}:</span>
                <span className="text-neutral-400 font-medium leading-tight">{field.value}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Price */}
        <p className="text-sm font-medium tracking-wide text-white">
          {getPriceDisplay()}
        </p>
      </div>
    </Link>
  );
}

export default memo(StorefrontProductCard);

