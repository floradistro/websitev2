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
  config?: {
    // Card Container
    card_bg?: string;
    card_padding?: string;
    card_radius?: string;
    card_border_width?: string;
    card_border_color?: string;
    card_hover_bg?: string;
    
    // Image
    image_aspect?: string;
    image_bg?: string;
    image_fit?: string;
    image_padding?: string;
    image_inset?: string;
    image_spacing?: string;
    image_radius?: string;
    image_border_width?: string;
    image_border_color?: string;
    
    // Info Section
    info_bg?: string;
    info_padding?: string;
    name_color?: string;
    price_color?: string;
    field_label_color?: string;
    field_value_color?: string;
    
    // Display Options
    show_quick_add?: boolean;
    show_stock_badge?: boolean;
    show_pricing_tiers?: boolean;
    show_product_fields?: boolean;
    show_hover_overlay?: boolean;
  };
}

function StorefrontProductCard({ product, vendorSlug, locations = [], config = {} }: StorefrontProductCardProps) {
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
      'strain_type': 'Type',
      'lineage': 'Lineage',
      'nose': 'Nose',
      'terpene_profile': 'Terpenes',
      'terpenes': 'Terpenes',
      'effects': 'Effects',
      'effect': 'Effects',
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
    
    // Only show pricing tiers if config allows it
    if (config.show_pricing_tiers !== false && pricingTiers.length > 0) {
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
  
  // Apply config settings - Card Container
  const cardPadding = config.card_padding || 'md';
  const cardPaddingClass = cardPadding === 'none' ? '' :
                           cardPadding === 'sm' ? 'p-2' :
                           cardPadding === 'md' ? 'p-3' :
                           cardPadding === 'lg' ? 'p-4' :
                           cardPadding === 'xl' ? 'p-6' : 'p-3';
  
  const cardRadius = config.card_radius || 'lg';
  const cardRadiusClass = cardRadius === 'none' ? 'rounded-none' :
                          cardRadius === 'sm' ? 'rounded' :
                          cardRadius === 'md' ? 'rounded-lg' :
                          cardRadius === 'lg' ? 'rounded-xl' :
                          cardRadius === 'xl' ? 'rounded-2xl' :
                          cardRadius === '2xl' ? 'rounded-3xl' : 'rounded-xl';
  
  const cardBorderWidth = config.card_border_width || '0';
  const cardBorderClass = cardBorderWidth === '0' ? '' :
                          cardBorderWidth === '1' ? 'border' :
                          cardBorderWidth === '2' ? 'border-2' :
                          'border-4';
  
  // Image settings
  const imageAspect = config.image_aspect || 'square';
  const imageAspectClass = imageAspect === 'portrait' ? 'aspect-[3/4]' :
                           imageAspect === 'landscape' ? 'aspect-[4/3]' :
                           imageAspect === 'wide' ? 'aspect-[16/9]' :
                           'aspect-square';
  
  const imageFit = config.image_fit || 'contain';
  const imageFitClass = imageFit === 'cover' ? 'object-cover' :
                        imageFit === 'fill' ? 'object-fill' :
                        imageFit === 'none' ? 'object-none' :
                        'object-contain';
  
  const imageRadius = config.image_radius || 'lg';
  const imageRadiusClass = imageRadius === 'none' ? 'rounded-none' :
                           imageRadius === 'sm' ? 'rounded' :
                           imageRadius === 'md' ? 'rounded-lg' :
                           imageRadius === 'lg' ? 'rounded-xl' :
                           imageRadius === 'xl' ? 'rounded-2xl' :
                           imageRadius === '2xl' ? 'rounded-3xl' : 'rounded-xl';
  
  const imageBorderWidth = config.image_border_width || '0';
  const imageBorderClass = imageBorderWidth === '0' ? '' :
                           imageBorderWidth === '1' ? 'border' :
                           imageBorderWidth === '2' ? 'border-2' :
                           imageBorderWidth === '4' ? 'border-4' :
                           'border-8';
  
  const imagePadding = config.image_padding || 'none';
  const imagePaddingClass = imagePadding === 'none' ? '' :
                            imagePadding === 'xs' ? 'p-0.5' :
                            imagePadding === 'sm' ? 'p-1' :
                            imagePadding === 'md' ? 'p-2' :
                            imagePadding === 'lg' ? 'p-3' :
                            imagePadding === 'xl' ? 'p-4' :
                            'p-6';
  
  const imageSpacing = config.image_spacing || 'md';
  const imageSpacingClass = imageSpacing === 'none' ? 'mb-0' :
                            imageSpacing === 'xs' ? 'mb-0.5' :
                            imageSpacing === 'sm' ? 'mb-1' :
                            imageSpacing === 'md' ? 'mb-4' :
                            imageSpacing === 'lg' ? 'mb-6' :
                            'mb-8';
  
  const imageInset = config.image_inset || 'none';
  const imageInsetClass = imageInset === 'none' ? '' : // No margin = edge-to-edge
                          imageInset === 'xs' ? 'mx-0.5' :
                          imageInset === 'sm' ? 'mx-1' :
                          imageInset === 'md' ? 'mx-2' :
                          imageInset === 'lg' ? 'mx-3' :
                          'mx-4';
  
  // Info section
  const infoPadding = config.info_padding || 'md';
  const infoPaddingClass = infoPadding === 'none' ? '' :
                           infoPadding === 'sm' ? 'px-2 space-y-1' :
                           infoPadding === 'md' ? 'px-3 space-y-2' :
                           'px-4 space-y-3';
  
  // Build inline styles - handle transparency properly
  const cardStyle: React.CSSProperties = {
    backgroundColor: config.card_bg === 'transparent' || !config.card_bg ? undefined : config.card_bg,
    borderColor: config.card_border_width !== '0' && config.card_border_color ? config.card_border_color : undefined,
  };
  
  const imageStyle: React.CSSProperties = {
    backgroundColor: config.image_bg || '#000000',
    borderColor: config.image_border_width !== '0' && config.image_border_color ? config.image_border_color : undefined,
  };
  
  const infoStyle: React.CSSProperties = {
    backgroundColor: config.info_bg === 'transparent' || !config.info_bg ? undefined : config.info_bg,
  };

  return (
    <Link 
      href={productUrl}
      className={`group block ${cardPaddingClass} ${cardRadiusClass} ${cardBorderClass} transition-all`}
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Container */}
      <div 
        className={`relative ${imageAspectClass} overflow-hidden ${imageSpacingClass} ${imageInsetClass} ${imageRadiusClass} ${imageBorderClass} ${imagePaddingClass}`}
        style={imageStyle}
      >

        {product.images?.[0]?.src ? (
          <Image
            src={product.images[0].src}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 85vw, (max-width: 768px) 45vw, (max-width: 1024px) 32vw, 23vw"
            className={`${imageFitClass} transition-all duration-700 ease-out group-hover:scale-105`}
            loading="lazy"
            quality={85}
          />
        ) : (
          <div className="relative w-full h-full flex items-center justify-center p-12">
            <Image
              src="/yacht-club-logo.png"
              alt="Yacht Club"
              fill
              sizes="(max-width: 640px) 85vw, (max-width: 768px) 45vw, (max-width: 1024px) 32vw, 23vw"
              className={`${imageFitClass} opacity-10 transition-opacity duration-500 group-hover:opacity-15`}
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
        {config.show_stock_badge !== false && (
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
        )}

        {/* Hover Overlay - Desktop */}
        {config.show_hover_overlay !== false && (
          <div className={`hidden md:flex absolute inset-0 items-center justify-center transition-all duration-500 bg-black/60 backdrop-blur-xl ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="flex flex-col items-center gap-2 transform translate-y-3 group-hover:translate-y-0 transition-transform duration-500">
              <div className="bg-white text-black px-6 py-3 text-xs uppercase tracking-[0.2em] font-medium rounded-full shadow-lg">
                View Product
              </div>
              {config.show_quick_add !== false && stockInfo.inStock && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Quick add functionality would go here
                    alert('Quick Add - Coming soon!');
                  }}
                  className="bg-black/80 text-white border border-white/20 px-6 py-2 text-xs uppercase tracking-[0.2em] font-medium rounded-full shadow-lg hover:bg-white hover:text-black transition-all"
                >
                  Quick Add
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className={`flex flex-col ${infoPaddingClass}`} style={infoStyle}>
        {/* Product Name */}
        <h3 
          className="text-sm uppercase tracking-[0.12em] line-clamp-2 leading-relaxed transition-all duration-300"
          style={{ fontWeight: 900, color: config.name_color || '#ffffff' }}
        >
          {product.name}
        </h3>
        
        {/* Stock Status with Locations - Right after name */}
        {config.show_stock_badge !== false && (
          <>
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
          </>
        )}
        
        {/* Product Fields - Stacked vertically */}
        {config.show_product_fields !== false && displayFields.length > 0 && (
          <div className="flex flex-col gap-1">
            {displayFields.map((field, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-[10px]">
                <span className="uppercase tracking-wider whitespace-nowrap" style={{ color: config.field_label_color || '#737373' }}>{field.label}:</span>
                <span className="font-medium leading-tight" style={{ color: config.field_value_color || '#a3a3a3' }}>{field.value}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Price */}
        <p className="text-sm font-medium tracking-wide" style={{ color: config.price_color || '#ffffff' }}>
          {getPriceDisplay()}
        </p>
      </div>
    </Link>
  );
}

export default memo(StorefrontProductCard);

