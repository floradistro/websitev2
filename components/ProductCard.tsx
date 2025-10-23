"use client";

import { useState, memo } from "react";
import { ShoppingBag, Store, Truck, Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ProductCardProps {
  product: any;
  index: number;
  locations: any[];
  pricingTiers?: any[];
  productFields?: {
    fields: { [key: string]: string };
  };
  inventory?: any[];
  vendorInfo?: {
    name: string;
    logo: string;
    slug: string;
  };
}

function ProductCard({ product, index, locations, pricingTiers = [], productFields, inventory = [], vendorInfo }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedTierIndex, setSelectedTierIndex] = useState<number | null>(null);
  const [showAddToCart, setShowAddToCart] = useState(false);
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const router = useRouter();
  
  const inWishlist = isInWishlist(product.id);
  
  // Get pricing tiers for this product
  const tiers = pricingTiers || [];
  
  const getUnitLabel = (tier: any) => {
    // Use label if available (e.g., "1 gram", "Eighth (3.5g)")
    if (tier.label) {
      return tier.label;
    }
    // Otherwise use weight (e.g., "1g", "3.5g")
    if (tier.weight) {
      return tier.weight;
    }
    // Fallback to quantity
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
      // Flower fields
      'strain_type': 'Type',
      'lineage': 'Lineage',
      'nose': 'Nose',
      'terpene_profile': 'Terpenes',
      'terpenes': 'Terpenes',
      'effects': 'Effects',
      'effect': 'Effects',
      'thca_percentage': 'THCa %',
      'delta_9_percentage': 'Δ9 %',
      'delta9_percentage': 'Δ9 %',
      // Vape fields
      'hardware_type': 'Hardware',
      'oil_type': 'Oil',
      'capacity': 'Capacity',
      // Edible fields
      'dosage_per_serving': 'Dosage',
      'servings_per_package': 'Servings',
      'total_dosage': 'Total',
      'ingredients': 'Ingredients',
      'allergens': 'Allergens',
      'dietary': 'Dietary',
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
      
      // Check if we already added this label (e.g., THCa from different keys)
      const existingField = displayFields.find(f => f.label === label);
      if (!existingField && value !== null && value !== undefined) {
        let displayValue: string;
        
        // Handle arrays (terpenes, effects, etc.)
        if (Array.isArray(value)) {
          displayValue = value.length > 0 ? value.join(', ') : '—';
        } 
        // Handle numbers
        else if (typeof value === 'number') {
          displayValue = value.toString();
        }
        // Handle strings
        else if (typeof value === 'string') {
          displayValue = value.trim() !== '' ? value : '—';
        }
        // Handle other types
        else {
          displayValue = String(value);
        }
        
        displayFields.push({ label, value: displayValue });
      }
    });
    
    return displayFields.slice(0, 5); // Limit to 5 fields for card display
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
    
    // Fallback to product.price
    const basePrice = product.price ? parseFloat(product.price) : 0;
    
    // If product has no price set, return empty/contact message
    if (basePrice === 0 || !product.price) {
      return 'Contact for Pricing';
    }
    
    return `$${basePrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const handleCardClick = () => {
    // Use UUID for Supabase product detail route
    router.push(`/products/${product.uuid || product.id}`);
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
    // Calculate total stock directly from product data
    const totalStockFromProduct = parseFloat(product.total_stock || product.stock_quantity || 0);
    
    // If no inventory records, use product total_stock
    if (!inventory || inventory.length === 0) {
      console.log(`${product.name}: No inventory array (length=${inventory?.length}), total_stock=${totalStockFromProduct}, stock_status=${product.stock_status}`);
      return { 
        inStock: totalStockFromProduct > 0 || product.stock_status === 'instock', 
        locations: [], 
        count: 0,
        showGenericStock: totalStockFromProduct > 0 // Flag to show "In Stock" without locations
      };
    }
    
    console.log(`${product.name}: HAS inventory (${inventory.length} records), locations available=${locations.length}`);

    const activeLocations = locations.filter((loc: any) => loc.is_active === "1" || loc.is_active === 1 || loc.is_active === true);
    console.log(`${product.name}: Active locations=${activeLocations.length}`);
    
    const stockLocations: any[] = [];

    inventory.forEach((inv: any) => {
      const qty = parseFloat(inv.quantity || 0);
      
      // STRICT: Only count as in stock if quantity > 0
      if (qty > 0) {
        const location = activeLocations.find((loc: any) => 
          loc.id === inv.location_id || 
          loc.id.toString() === inv.location_id?.toString() ||
          parseInt(loc.id) === parseInt(inv.location_id)
        );
        console.log(`${product.name}: Inv qty=${qty}, location_id=${inv.location_id}, found location=${location?.name || 'NOT FOUND'}`);
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
  
  // Calculate total stock for display
  const totalStock = product.stock_quantity || product.total_stock || 0;

  return (
    <div
      className={`group flex flex-col relative bg-[#3a3a3a] md:hover:bg-[#404040] active:bg-[#454545] cursor-pointer md:hover:shadow-2xl md:hover:-translate-y-1 border border-transparent md:hover:border-white/10 transition-none md:transition-all md:duration-300 ${!stockInfo.inStock ? 'opacity-75' : ''}`}
      onMouseEnter={(e) => {
        if (window.innerWidth >= 768) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={(e) => {
        if (window.innerWidth >= 768) {
          setIsHovered(false);
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
            {/* Logo Fallback - Use vendor logo if available */}
            <div className="relative w-full h-full flex items-center justify-center p-12">
              <Image
                src={vendorInfo?.logo || "/yacht-club-logo.png"}
                alt={vendorInfo?.name || "Yacht Club"}
                fill
                sizes="(max-width: 640px) 85vw, (max-width: 768px) 45vw, (max-width: 1024px) 32vw, 23vw"
                className="object-contain opacity-10 transition-opacity duration-500 group-hover:opacity-15"
                loading="lazy"
              />
            </div>
          </>
        )}

        {/* Vendor Badge - Bottom Right */}
        {vendorInfo && (
          <Link
            href={`/vendors/${vendorInfo.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-2 right-2 z-10 block w-8 h-8 transition-all duration-300 group"
            title={`Sold by ${vendorInfo.name}`}
          >
            <img 
              src={vendorInfo.logo} 
              alt={vendorInfo.name} 
              className="w-full h-full object-contain opacity-40 group-hover:opacity-80 group-hover:scale-110 transition-all drop-shadow-lg"
            />
          </Link>
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
          {(product.stock_status === 'instock' || product.stock_status === 'in_stock') && totalStock && totalStock <= 5 && totalStock > 0 && (
            <div className="bg-red-600/90 text-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
              Only {totalStock} Left
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
      <div className="flex flex-col flex-1 px-3 py-4">
        <div className="space-y-3">
          <h3 className="text-xs uppercase tracking-[0.12em] font-normal text-white line-clamp-2 leading-relaxed transition-all duration-300">
            {product.name}
          </h3>
          
          {/* Price */}
          <p className="text-sm font-medium text-white tracking-wide transition-all duration-300 group-hover:text-white/80">
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
                  <span className="text-[11px] tracking-wider text-white/60">
                    {stockInfo.locations.map((loc: any) => loc.name).join(', ')}
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
        </div>
        
        {/* Pricing Tier Selector - Always at bottom */}
        {tiers.length > 0 && (
          <div className="space-y-2 pt-3 mt-auto border-t border-white/10">
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
                  const qty = tier.qty || tier.min_quantity || 1;
                  
                  // Show price and price per gram
                  const displayPrice = price > 0 ? `$${price.toFixed(2)}` : 'TBD';
                  const pricePerGram = (price > 0 && qty > 0) ? ` ($${(price / qty).toFixed(2)}/g)` : '';
                  
                  return (
                    <option key={index} value={index}>
                      {tierLabel} - {displayPrice}{pricePerGram}
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

// Memoize component to prevent unnecessary re-renders
export default memo(ProductCard, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.index === nextProps.index &&
    prevProps.pricingTiers?.length === nextProps.pricingTiers?.length &&
    prevProps.inventory?.length === nextProps.inventory?.length
  );
});

