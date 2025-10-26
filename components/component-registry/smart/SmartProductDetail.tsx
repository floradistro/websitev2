/**
 * Smart Component: SmartProductDetail
 * Wilson's Template Product Detail - Premium Cannabis Storefront
 * Features: iOS 26 rounded-2xl buttons, pure black background, water ripples, luxury dark glow
 */

"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Share2, Check, FlaskConical } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

export interface SmartProductDetailProps {
  productSlug?: string; // If not provided, extract from URL
  vendorId: string;
  vendorSlug?: string;
  showGallery?: boolean;
  showPricingTiers?: boolean;
  showFields?: boolean;
  showAddToCart?: boolean;
  showBreadcrumbs?: boolean;
  showWishlistButton?: boolean;
  showShareButton?: boolean;
  showLabResults?: boolean;
  showRelatedProducts?: boolean;
  className?: string;
}

export function SmartProductDetail({
  productSlug: propsSlug,
  vendorId,
  vendorSlug = 'shop',
  showGallery = true,
  showPricingTiers = true,
  showFields = true,
  showAddToCart = true,
  showBreadcrumbs = true,
  showWishlistButton = true,
  showShareButton = true,
  showLabResults = true,
  showRelatedProducts = false,
  className = '',
}: SmartProductDetailProps) {
  const pathname = usePathname();
  const [product, setProduct] = useState<any>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [pricingTiers, setPricingTiers] = useState<any[]>([]);
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [selectedTierName, setSelectedTierName] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [pickupLocationId, setPickupLocationId] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationsWithDistance, setLocationsWithDistance] = useState<any[]>([]);

  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  
  // Get user's geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Geolocation not available');
        }
      );
    }
  }, []);
  
  // Calculate distances and sort locations when user location is available
  useEffect(() => {
    if (!userLocation || !inventory || inventory.length === 0) {
      setLocationsWithDistance(
        inventory
          .filter((inv: any) => inv.quantity > 0 && inv.location?.name)
          .map((inv: any) => ({ ...inv, distance: null }))
      );
      return;
    }
    
    // Calculate distance using Haversine formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 3959; // Earth's radius in miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };
    
    const locationsWithDist = inventory
      .filter((inv: any) => inv.quantity > 0 && inv.location?.name && inv.location?.latitude && inv.location?.longitude)
      .map((inv: any) => {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          parseFloat(inv.location.latitude),
          parseFloat(inv.location.longitude)
        );
        return { ...inv, distance };
      })
      .sort((a, b) => (a.distance || 999) - (b.distance || 999));
    
    setLocationsWithDistance(locationsWithDist);
    
    // Auto-select nearest location for pickup
    if (locationsWithDist.length > 0 && !pickupLocationId) {
      setPickupLocationId(locationsWithDist[0].location.id);
    }
  }, [userLocation, inventory, pickupLocationId]);

  // Extract slug from URL if not provided
  const productSlug = propsSlug || pathname?.split('/').pop();

  useEffect(() => {
    if (!productSlug || !vendorId) {
      console.log('⚠️ Missing required props:', { productSlug, vendorId, vendorSlug });
      return;
    }

    async function loadProduct() {
      try {
        setLoading(true);
        
        // Fetch products via the page-data API with vendor context
        // Use vendorSlug for the API call
        const apiUrl = `/api/page-data/products${vendorSlug ? `?vendor=${vendorSlug}` : ''}`;
        console.log('🔄 Fetching products from:', apiUrl);
        
        const res = await fetch(apiUrl);
        if (!res.ok) {
          console.error('❌ Failed to fetch products:', res.status);
          return;
        }

        const data = await res.json();
        if (!data.success) {
          console.error('❌ API returned error:', data);
          return;
        }

        console.log('✅ Fetched products:', data.data.products.length);

        // Store all data
        setAllProducts(data.data.products || []);
        setLocations(data.data.locations || []);

        // Find this product
        const foundProduct = data.data.products.find((p: any) => 
          p.vendor_id === vendorId && (p.slug === productSlug || p.id === productSlug)
        );

        if (!foundProduct) {
          console.error('❌ Product not found:', { productSlug, vendorId, availableProducts: data.data.products.map((p: any) => ({ id: p.id, slug: p.slug, vendor_id: p.vendor_id })) });
          return;
        }

        console.log('✅ Found product:', foundProduct.name);
        setProduct(foundProduct);

        // Set pricing tiers
        if (foundProduct.pricing_tiers && foundProduct.pricing_tiers.length > 0) {
          setPricingTiers(foundProduct.pricing_tiers);
          setSelectedTier(foundProduct.pricing_tiers[0]);
          setSelectedPrice(foundProduct.pricing_tiers[0].price);
          setSelectedTierName(foundProduct.pricing_tiers[0].label || foundProduct.pricing_tiers[0].tier_name);
          setSelectedQuantity(foundProduct.pricing_tiers[0].quantity || 1);
          console.log('💰 Set pricing tiers:', foundProduct.pricing_tiers.length);
        }
      } catch (error) {
        console.error('❌ Error loading product:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [productSlug, vendorId, vendorSlug]);

  const inWishlist = product ? isInWishlist(product.id) : false;

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!product) return;
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0]?.src || product.featured_image_storage,
        slug: product.slug
      });
    }
  };

  const handlePriceSelect = (tier: any) => {
    setSelectedTier(tier);
    setSelectedPrice(tier.price);
    setSelectedQuantity(tier.quantity || 1);
    setSelectedTierName(tier.label || tier.tier_name);
  };

  const handleAddToCart = () => {
    if (!product || !selectedPrice) return;

    addToCart({
      productId: product.id,
      name: product.name,
      price: selectedPrice,
      quantity: selectedQuantity,
      tierName: selectedTierName || "",
      image: product.images?.[0]?.src || product.featured_image_storage,
      orderType: orderDetails?.orderType,
      locationId: orderDetails?.locationId,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  // Debug logging
  useEffect(() => {
    console.log('🔍 SmartProductDetail Debug:', {
      loading,
      productSlug,
      vendorId,
      vendorSlug,
      productFound: !!product,
      productName: product?.name,
      allProductsCount: allProducts.length,
      pricingTiersCount: pricingTiers.length,
      formattedImagesCount: product ? 'Product exists' : 'No product'
    });
  }, [loading, product, allProducts, pricingTiers, productSlug, vendorId, vendorSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/60 text-lg font-light">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 text-lg font-light mb-4">Product not found</p>
          <p className="text-white/40 text-sm mb-4">Slug: {productSlug}, Vendor: {vendorId}</p>
          <p className="text-white/40 text-sm mb-4">Products loaded: {allProducts.length}</p>
          <Link href={`/storefront/shop?vendor=${vendorSlug}`} className="text-white underline">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const categoryName = product.categories?.[0]?.name;
  const categorySlug = product.categories?.[0]?.slug;
  
  // Format images for gallery
  const formattedImages = [];
  if (product.featured_image_storage) {
    formattedImages.push({ src: product.featured_image_storage, id: 0, name: product.name });
  }
  if (product.image_gallery_storage && product.image_gallery_storage.length > 0) {
    product.image_gallery_storage.forEach((img: string, idx: number) => {
      formattedImages.push({ src: img, id: formattedImages.length, name: product.name });
    });
  }
  if (formattedImages.length === 0 && product.images && product.images.length > 0) {
    formattedImages.push(...product.images);
  }
  
  // Fallback to Yacht Club logo if no images
  if (formattedImages.length === 0) {
    formattedImages.push({ src: '/yacht-club-logo.png', id: 0, name: 'Yacht Club' });
  }

  const inventory = product?.inventory || [];
  const isInStock = product.stock_status === "instock" || product.total_stock > 0;

  // Get location stock info
  const getLocationStockInfo = () => {
    if (!inventory || inventory.length === 0) {
      return { hasLocations: false, locationNames: [], totalStock: 0 };
    }

    const locationsWithStock = inventory
      .filter((inv: any) => inv.quantity > 0 && inv.location?.name)
      .map((inv: any) => ({
        name: inv.location.name,
        quantity: inv.quantity
      }));

    return {
      hasLocations: locationsWithStock.length > 0,
      locationNames: locationsWithStock.map((l: any) => l.name),
      totalStock: locationsWithStock.reduce((sum: number, l: any) => sum + l.quantity, 0)
    };
  };

  const stockInfo = getLocationStockInfo();

  return (
    <div className={`min-h-screen bg-black ${className}`}>

      {/* Breadcrumb Navigation */}
      {showBreadcrumbs && (
        <div className="sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-3">
            <nav className="flex items-center gap-x-2 text-xs uppercase tracking-wider overflow-x-auto scrollbar-hide">
              <Link
                href="/storefront"
                className="text-white/40 hover:text-white transition-colors whitespace-nowrap"
              >
                Home
              </Link>
              <span className="text-white/20">/</span>
              <Link
                href="/storefront/shop"
                className="text-white/40 hover:text-white transition-colors whitespace-nowrap"
              >
                Shop
              </Link>
              {categoryName && (
                <>
                  <span className="text-white/20">/</span>
                  <Link
                    href={`/storefront/shop?category=${categorySlug}`}
                    className="text-white/40 hover:text-white transition-colors whitespace-nowrap"
                  >
                    {categoryName}
                  </Link>
                </>
              )}
              <span className="text-white/20">/</span>
              <span className="text-white/60 font-medium">{product.name}</span>
            </nav>
          </div>
        </div>
      )}

      {/* Product Content */}
      <div className="relative bg-black" style={{ minHeight: '100vh' }}>
        {/* Mobile Layout - Matches Product Card Style */}
        <div className="lg:hidden relative bg-black">
          {/* Main Product Card Container */}
          <div className="bg-[#0a0a0a] border-b border-white/5">
            
            {/* Gallery */}
            {showGallery && (
              <div className="relative">
                <div className="relative aspect-[4/5] overflow-hidden bg-black">
                  {formattedImages[selectedImageIndex] && (
                    <Image
                      src={formattedImages[selectedImageIndex].src}
                      alt={product.name}
                      fill
                      className="object-contain"
                      sizes="100vw"
                      priority
                    />
                  )}
                </div>
                
                {/* Thumbnail Gallery */}
                {formattedImages.length > 1 && (
                  <div className="flex gap-2 p-4 overflow-x-auto bg-black border-t border-white/5">
                    {formattedImages.map((img: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative w-16 h-16 flex-shrink-0 bg-black border-2 rounded-xl overflow-hidden transition-all ${
                          selectedImageIndex === idx ? 'border-white' : 'border-white/10'
                        }`}
                      >
                        <Image
                          src={img.src}
                          alt={`${product.name} ${idx + 1}`}
                          fill
                          className="object-contain"
                          sizes="64px"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Product Info - Exactly Like Product Card */}
            <div className="px-4 py-4 space-y-3">
              {/* Product Name */}
              <h1 className="text-xs uppercase tracking-[0.12em] font-normal text-white line-clamp-2 leading-relaxed">
                {product.name}
              </h1>
              
              {/* Price */}
              <p className="text-sm font-medium text-white tracking-wide">
                {selectedPrice 
                  ? `$${selectedPrice.toFixed(0)}` 
                  : pricingTiers.length > 0
                  ? `$${Math.min(...pricingTiers.map((t: any) => t.price)).toFixed(0)} - $${Math.max(...pricingTiers.map((t: any) => t.price)).toFixed(0)}`
                  : `$${product.price || 0}`
                }
              </p>

              {/* Stock Status - Exactly Like Product Card */}
              {isInStock ? (
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                    <span className="text-[11px] uppercase tracking-wider text-white/60 truncate">
                      In Stock
                      {stockInfo.hasLocations && stockInfo.locationNames.length > 0 && ` · ${stockInfo.locationNames.length} locations`}
                    </span>
                  </div>
                  {stockInfo.hasLocations && stockInfo.locationNames.length > 0 && (
                    <span className="text-[10px] text-white/40 truncate ml-3.5">
                      {stockInfo.locationNames.slice(0, 2).join(', ')}
                      {stockInfo.locationNames.length > 2 && ` +${stockInfo.locationNames.length - 2} more`}
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
              
              {/* Product Fields - Like Product Card */}
              {product.fields && Object.keys(product.fields).length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-white/10">
                  {Object.entries(product.fields).slice(0, 3).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between gap-2">
                      <span className="uppercase tracking-[0.12em] font-medium text-white/60 text-[10px] whitespace-nowrap">
                        {key}
                      </span>
                      <span className="text-[11px] tracking-wide text-white/90 font-normal text-right truncate">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Additional Details Below - Minimal Cards */}
          <div className="px-4 py-6 space-y-4">
            
            {/* Pickup Location Selector - Geo-Sorted */}
            {stockInfo.hasLocations && stockInfo.locationNames.length > 0 && (
              <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-white/40">Pickup Location</div>
                  {userLocation && locationsWithDistance.length > 0 && (
                    <div className="text-[9px] uppercase tracking-wider text-green-500/60">Nearest First</div>
                  )}
                </div>
                <select 
                  value={pickupLocationId}
                  onChange={(e) => setPickupLocationId(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:border-white/20 transition-all"
                >
                  <option value="" className="bg-black">Choose location...</option>
                  {(locationsWithDistance.length > 0 ? locationsWithDistance : inventory.filter((inv: any) => inv.quantity > 0 && inv.location?.name))
                    .map((inv: any, idx: number) => (
                      <option key={idx} value={inv.location.id} className="bg-black">
                        {inv.location.name}
                        {inv.distance !== null && inv.distance !== undefined ? ` (${inv.distance.toFixed(1)} mi)` : ''}
                        {' · '}
                        {inv.quantity} in stock
                      </option>
                    ))}
                </select>
                <div className="text-[9px] text-white/30 mt-2">
                  {userLocation ? 'Sorted by distance from you' : 'Enable location for distance info'}
                </div>
              </div>
            )}
            
            {/* Pricing Tiers */}
            {showPricingTiers && pricingTiers.length > 0 && (
              <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4">
                <div className="text-[10px] uppercase tracking-[0.15em] text-white/40 mb-3">Select Quantity</div>
                <select
                  value={selectedTier?.break_id || ''}
                  onChange={(e) => {
                    const tier = pricingTiers.find(t => t.break_id === e.target.value);
                    if (tier) handlePriceSelect(tier);
                  }}
                  className="w-full bg-black border border-white/10 rounded-xl px-3 py-3 text-sm text-white focus:border-white/20 transition-all"
                >
                  {pricingTiers.map((tier: any) => (
                    <option key={tier.break_id} value={tier.break_id} className="bg-black">
                      {tier.label || tier.tier_name} - ${tier.price}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Add to Cart */}
            {showAddToCart && (
              <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 space-y-3">
                <button 
                  onClick={handleAddToCart}
                  disabled={addedToCart || !selectedPrice}
                  className={`w-full py-4 text-sm uppercase tracking-[0.15em] transition-all duration-300 font-bold rounded-2xl relative overflow-hidden ${
                    addedToCart 
                      ? "bg-white text-black border-2 border-white" 
                      : selectedPrice
                      ? "bg-white text-black active:scale-95 shadow-2xl shadow-white/20"
                      : "bg-white/20 text-white/40 cursor-not-allowed"
                  }`}
                >
                  <span className={`transition-all duration-300 ${addedToCart ? "opacity-0" : "opacity-100"}`}>
                    Add to Cart
                  </span>
                  <span className={`absolute inset-0 flex items-center justify-center gap-2 transition-all duration-300 ${addedToCart ? "opacity-100" : "opacity-0"}`}>
                    <Check size={16} strokeWidth={2.5} />
                    Added
                  </span>
                </button>
                
                {(showWishlistButton || showShareButton) && (
                  <div className="flex gap-2">
                    {showWishlistButton && (
                      <button 
                        onClick={handleToggleWishlist}
                        className={`flex-1 border-2 ${inWishlist ? 'border-white bg-white text-black' : 'border-white/10 text-white'} py-3 text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 rounded-2xl`}
                      >
                        <Heart size={14} className={inWishlist ? 'fill-current' : ''} strokeWidth={2} />
                      </button>
                    )}
                    {showShareButton && (
                      <button className="flex-1 border-2 border-white/10 text-white py-3 text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 rounded-2xl">
                        <Share2 size={14} strokeWidth={2} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* All Fields - If More Than 3 */}
            {showFields && product.fields && Object.keys(product.fields).length > 3 && (
              <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4">
                <div className="space-y-2">
                  {Object.entries(product.fields).slice(3).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between gap-2 py-1">
                      <span className="uppercase tracking-[0.12em] font-medium text-white/60 text-[10px] whitespace-nowrap">
                        {key}
                      </span>
                      <span className="text-[11px] tracking-wide text-white/90 font-normal text-right truncate">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4">
                <div
                  className="text-xs text-white/60 leading-relaxed prose prose-sm prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}

            {/* Lab Testing CTA */}
            {showLabResults && (
              <Link href={`/storefront/lab-results?vendor=${vendorSlug}`}>
                <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    <FlaskConical size={16} className="text-white/60" strokeWidth={1.5} />
                    <div className="flex-1">
                      <div className="text-xs uppercase tracking-[0.12em] text-white/90">Lab Tested</div>
                      <div className="text-[10px] text-white/40">View test results →</div>
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="max-w-[2000px] mx-auto flex">
            {/* Sticky Images - Left Side */}
            <div className="w-1/2 sticky top-0 h-screen overflow-y-auto scrollbar-hide bg-black relative z-10">
              {showGallery && (
                <div className="p-12">
                  <div className="relative aspect-square bg-black rounded-2xl overflow-hidden mb-6">
                    {formattedImages[selectedImageIndex] && (
                      <Image
                        src={formattedImages[selectedImageIndex].src}
                        alt={product.name}
                        fill
                        className="object-contain"
                        sizes="50vw"
                        priority
                      />
                    )}
                  </div>
                  
                  {/* Thumbnail Gallery */}
                  {formattedImages.length > 1 && (
                    <div className="grid grid-cols-4 gap-3">
                      {formattedImages.map((img: any, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`relative aspect-square bg-black border-2 rounded-2xl overflow-hidden transition-all hover:border-white/40 ${
                            selectedImageIndex === idx ? 'border-white' : 'border-white/20'
                          }`}
                        >
                          <Image
                            src={img.src}
                            alt={`${product.name} ${idx + 1}`}
                            fill
                            className="object-contain"
                            sizes="200px"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Flowing Content - Right Side */}
            <div className="w-1/2 px-12 py-12 relative">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xl"></div>
              <div className="relative z-10 space-y-6 max-w-2xl">
                {/* Product Name & Price */}
                <div className="">
                  <h1 className="text-4xl uppercase tracking-[0.12em] text-white leading-relaxed mb-3" style={{ fontWeight: 900 }}>
                    {product.name}
                  </h1>
                  
                  <p className="text-xl font-medium text-white tracking-wide mb-4">
                    {selectedPrice 
                      ? `$${selectedPrice.toFixed(0)}` 
                      : pricingTiers.length > 0
                      ? `$${Math.min(...pricingTiers.map((t: any) => t.price)).toFixed(0)} - $${Math.max(...pricingTiers.map((t: any) => t.price)).toFixed(0)}`
                      : `$${product.price || 0}`
                    }
                  </p>

                  {/* Stock Status */}
                  {isInStock ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs uppercase tracking-wider text-neutral-400">In Stock</span>
                      {stockInfo.hasLocations && (
                        <span className="text-xs text-white/40">
                          • {stockInfo.locationNames.join(', ')}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500/60" />
                      <span className="text-xs uppercase tracking-wider text-neutral-400">Out of Stock</span>
                    </div>
                  )}
                </div>

                {/* Pricing Tiers */}
                {showPricingTiers && pricingTiers.length > 0 && (
                  <div className="">
                    <label className="block text-xs uppercase tracking-wider text-white/60 mb-2">Select Quantity</label>
                    <select
                      value={selectedTier?.break_id || ''}
                      onChange={(e) => {
                        const tier = pricingTiers.find(t => t.break_id === e.target.value);
                        if (tier) handlePriceSelect(tier);
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white backdrop-blur-xl hover:bg-white/10 focus:bg-white/10 focus:border-white/20 transition-all"
                    >
                      {pricingTiers.map((tier: any) => (
                        <option key={tier.break_id} value={tier.break_id} className="bg-black">
                          {tier.label || tier.tier_name} - ${tier.price} {tier.price_per_gram && `($${tier.price_per_gram.toFixed(2)}/g)`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Actions */}
                {showAddToCart && (
                  <div className="">
                    <div className="space-y-3">
                      <button 
                        onClick={handleAddToCart}
                        disabled={addedToCart || !selectedPrice}
                        className={`w-full py-5 text-base uppercase tracking-wider transition-all duration-300 font-bold rounded-2xl relative overflow-hidden ${
                          addedToCart 
                            ? "bg-white text-black border-2 border-white" 
                            : selectedPrice
                            ? "bg-white text-black hover:bg-neutral-100 hover:scale-105 shadow-2xl shadow-white/20"
                            : "bg-white/20 text-white/40 cursor-not-allowed"
                        }`}
                      >
                        <span className={`inline-flex items-center gap-2 transition-all duration-300 ${addedToCart ? "opacity-0" : "opacity-100"}`}>
                          Add to Cart
                        </span>
                        <span className={`absolute inset-0 flex items-center justify-center gap-2 transition-all duration-300 ${addedToCart ? "opacity-100" : "opacity-0"}`}>
                          <Check size={18} strokeWidth={2.5} />
                          Added
                        </span>
                      </button>
                      
                      <div className="flex space-x-3">
                        {showWishlistButton && (
                          <button 
                            onClick={handleToggleWishlist}
                            className="flex-1 border-2 border-white bg-transparent text-white py-4 text-xs uppercase tracking-wider hover:bg-white hover:text-black transition-all duration-300 flex items-center justify-center space-x-2 rounded-2xl"
                          >
                            <Heart size={16} className={inWishlist ? 'fill-current' : ''} strokeWidth={2} />
                            <span>Wishlist</span>
                          </button>
                        )}
                        {showShareButton && (
                          <button className="flex-1 border-2 border-white bg-transparent text-white py-4 text-xs uppercase tracking-wider hover:bg-white hover:text-black transition-all duration-300 flex items-center justify-center space-x-2 rounded-2xl">
                            <Share2 size={16} strokeWidth={2} />
                            <span>Share</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Blueprint Fields */}
                {showFields && product.fields && Object.keys(product.fields).length > 0 && (
                  <div className="">
                    <div className="border border-white/10 bg-white/5 backdrop-blur-xl rounded-2xl p-6">
                      <h3 className="text-xs uppercase tracking-wider font-semibold mb-4 text-white/60">
                        Product Details
                      </h3>
                      <dl className="space-y-3">
                        {Object.entries(product.fields).map(([key, value]: [string, any]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <dt className="text-white/60">{key}:</dt>
                            <dd className="text-white font-medium">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>
                )}

                {/* Description */}
                {product.description && (
                  <div className="">
                    <div className="border border-white/10 bg-white/5 backdrop-blur-xl rounded-2xl p-6">
                      <h3 className="text-xs uppercase tracking-wider font-semibold mb-4 text-white/60">
                        Description
                      </h3>
                      <div
                        className="text-sm text-white/80 leading-relaxed prose prose-sm prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: product.description }}
                      />
                    </div>
                  </div>
                )}

                {/* Lab Testing CTA */}
                {showLabResults && (
                  <div className="">
                    <Link href={`/storefront/lab-results?vendor=${vendorSlug}`}>
                      <div className="border border-white/20 bg-white/5 backdrop-blur-xl rounded-2xl p-6 hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <FlaskConical className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm uppercase tracking-wider font-semibold mb-1 text-white/90 group-hover:text-white transition-colors">
                              Lab Tested
                            </h3>
                            <p className="text-xs text-white/60 font-light">
                              View our complete library of third-party test results →
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
