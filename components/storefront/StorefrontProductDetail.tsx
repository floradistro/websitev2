"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Share2, Check, FlaskConical } from "lucide-react";
import useSWR from 'swr';
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import ProductGallery from "@/components/ProductGallery";
import PricingTiers from "@/components/PricingTiers";
import DeliveryAvailability from "@/components/DeliveryAvailability";
import ShippingEstimator from "@/components/ShippingEstimator";
import FloraFields from "@/components/FloraFields";
import LabResults from "@/components/LabResults";
import ProductReviews from "@/components/ProductReviews";
import CategorySection from "@/components/CategorySection";
import ProductsCarousel from "@/components/ProductsCarousel";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface StorefrontProductDetailProps {
  productSlug: string;
  vendorId: string;
}

export function StorefrontProductDetail({ productSlug, vendorId }: StorefrontProductDetailProps) {
  console.log('🔴 StorefrontProductDetail MOUNTED with:', { productSlug, vendorId });
  
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [selectedTierName, setSelectedTierName] = useState<string | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();

  // Fetch product using Yacht Club API
  console.log('🔴 Fetching from /api/page-data/products');
  const { data, error, isLoading } = useSWR(
    `/api/page-data/products`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );
  
  console.log('🔴 SWR State:', { isLoading, hasData: !!data, hasError: !!error });

  const product = data?.success 
    ? data.data.products.find((p: any) => 
        p.vendor_id === vendorId && (p.slug === productSlug || p.id === productSlug)
      )
    : null;

  const locations = data?.success ? data.data.locations : [];
  const allProducts = data?.success ? data.data.products : [];
  const vendors = data?.success ? data.data.vendors : [];
  
  // Get vendor info for logo fallback
  const vendor = vendors?.find((v: any) => v.id === vendorId);
  
  // Get related products from same vendor (prioritize same category, then all vendor products)
  const relatedProducts = product && allProducts
    ? allProducts
        .filter((p: any) => 
          p.vendor_id === vendorId && 
          p.id !== product.id
        )
        .sort((a: any, b: any) => {
          // Prioritize same category
          const aInCategory = a.categories?.some((c: any) => 
            product.categories?.some((pc: any) => pc.id === c.id)
          );
          const bInCategory = b.categories?.some((c: any) => 
            product.categories?.some((pc: any) => pc.id === c.id)
          );
          if (aInCategory && !bInCategory) return -1;
          if (!aInCategory && bInCategory) return 1;
          return 0;
        })
        .slice(0, 12)
    : [];
  
  console.log('Related products count:', relatedProducts.length);

  const pricingTiers = product?.pricing_tiers || [];
  const inventory = product?.inventory || [];
  
  // Debug logging for pricing tiers
  console.log('========== STOREFRONT PRODUCT DETAIL DEBUG ==========');
  console.log('1. Product found:', !!product);
  console.log('2. Product name:', product?.name);
  console.log('3. Raw pricing_tiers from product:', product?.pricing_tiers);
  console.log('4. Parsed pricingTiers variable:', pricingTiers);
  console.log('5. Pricing tiers count:', pricingTiers.length);
  console.log('6. Product has these keys:', product ? Object.keys(product).filter(k => k.includes('pric') || k.includes('tier')) : []);
  console.log('====================================================');

  const inWishlist = product ? isInWishlist(product.id) : false;

  const handleToggleWishlist = () => {
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

  const handlePriceSelect = (price: number, quantity: number, tierName: string) => {
    setSelectedPrice(price);
    setSelectedQuantity(quantity);
    setSelectedTierName(tierName);
  };

  const handleOrderDetailsChange = (details: any) => {
    setOrderDetails(details);
    if (details?.locationId) {
      setSelectedLocationId(details.locationId);
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/60 text-lg font-light">Loading...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 text-lg font-light mb-4">Product not found</p>
          <Link href="/storefront/shop?vendor=flora-distro" className="text-white underline">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const categoryName = product.categories?.[0]?.name;
  const categorySlug = product.categories?.[0]?.slug;
  
  // Format images for ProductGallery component
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
  
  // Use vendor logo as fallback if no product images
  if (formattedImages.length === 0) {
    const vendorLogo = vendor?.logo || vendor?.logo_url || '/yacht-club-logo.png';
    formattedImages.push({ src: vendorLogo, id: 0, name: vendor?.name || 'Yacht Club' });
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#1a1a1a]">
      {/* UHD Gradient Background - iOS 26 */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-black to-[#141414]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-neutral-950/50 via-transparent to-neutral-900/50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,black_100%)]" />
      </div>
      
      {/* Scattered Color Orbs - Monochrome */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Red orbs */}
        <div className="absolute top-[3%] left-[2%] w-[80px] h-[80px] md:w-[280px] md:h-[280px] bg-red-500/[0.20] rounded-full blur-[25px] md:blur-[45px] animate-pulse" style={{ animationDuration: '9s' }} />
        <div className="absolute bottom-[3%] right-[2%] w-[75px] h-[75px] md:w-[260px] md:h-[260px] bg-red-500/[0.18] rounded-full blur-[24px] md:blur-[42px] animate-pulse" style={{ animationDuration: '11s', animationDelay: '3s' }} />
        
        {/* Blue orbs */}
        <div className="absolute top-[5%] right-[2%] w-[78px] h-[78px] md:w-[270px] md:h-[270px] bg-blue-500/[0.19] rounded-full blur-[25px] md:blur-[44px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
        <div className="absolute bottom-[5%] left-[2%] w-[72px] h-[72px] md:w-[250px] md:h-[250px] bg-blue-500/[0.17] rounded-full blur-[24px] md:blur-[43px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '5s' }} />
        
        {/* Yellow orbs */}
        <div className="absolute top-[35%] right-[75%] w-[85px] h-[85px] md:w-[290px] md:h-[290px] bg-yellow-500/[0.10] rounded-full blur-[26px] md:blur-[46px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
        <div className="absolute bottom-[35%] right-[15%] w-[76px] h-[76px] md:w-[265px] md:h-[265px] bg-yellow-500/[0.08] rounded-full blur-[25px] md:blur-[44px] animate-pulse" style={{ animationDuration: '13s', animationDelay: '4s' }} />
      </div>

      {/* Breadcrumb Navigation */}
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

      {/* Product Content */}
      <div className="relative">
        {/* Mobile Layout */}
        <div className="lg:hidden relative">
          <ProductGallery images={formattedImages} productName={product.name} />
          
          <div className="px-6 py-8 space-y-6 relative z-10">
            {/* Product Name */}
            <div className="animate-fadeIn">
              <h1 className="text-3xl uppercase tracking-[0.12em] text-white leading-relaxed mb-3" style={{ fontWeight: 900 }}>
                {product.name}
              </h1>
              
              {/* Price */}
              <p className="text-lg font-medium text-white tracking-wide mb-4">
                {selectedPrice ? `$${selectedPrice.toFixed(0)}` : `$${Math.min(...pricingTiers.map((t: any) => t.price)).toFixed(0)} - $${Math.max(...pricingTiers.map((t: any) => t.price)).toFixed(0)}`}
              </p>

              {/* Stock Status */}
              {product.stock_status === "instock" || product.total_stock > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-xs uppercase tracking-wider text-neutral-400">In Stock</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500/60" />
                  <span className="text-xs uppercase tracking-wider text-neutral-400">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Pricing Tiers Dropdown */}
            {pricingTiers.length > 0 ? (
              <div className="animate-fadeIn">
                <PricingTiers
                  tiers={pricingTiers}
                  onPriceSelect={handlePriceSelect}
                />
              </div>
            ) : (
              <div className="text-red-500 text-xs p-2 border border-red-500/30 rounded">
                DEBUG: No pricing tiers found (count: {pricingTiers.length})
              </div>
            )}

            {/* Delivery Options */}
            <div className="animate-fadeIn">
              <DeliveryAvailability
                inventory={inventory}
                locations={locations}
                stockStatus={product.stock_status}
                onDetailsChange={handleOrderDetailsChange}
              />
            </div>

            {/* Shipping Estimator */}
            <div className="animate-fadeIn">
              <ShippingEstimator
                productId={parseInt(product.id) || 0}
                quantity={selectedQuantity}
                productPrice={selectedPrice || parseFloat(product.price) || 0}
                locationId={selectedLocationId || undefined}
              />
            </div>

            {/* Add to Cart & Actions */}
            <div className="space-y-3 animate-fadeIn">
              <button 
                onClick={handleAddToCart}
                disabled={addedToCart || !selectedPrice}
                className={`w-full py-5 text-base uppercase tracking-wider transition-all duration-300 font-bold rounded-full relative overflow-hidden ${
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
                <button 
                  onClick={handleToggleWishlist}
                  className="flex-1 border-2 border-white bg-transparent text-white py-4 text-xs uppercase tracking-wider hover:bg-white hover:text-black transition-all duration-300 flex items-center justify-center space-x-2 rounded-full"
                >
                  <Heart size={16} className={inWishlist ? 'fill-current' : ''} strokeWidth={2} />
                  <span>Wishlist</span>
                </button>
                <button className="flex-1 border-2 border-white bg-transparent text-white py-4 text-xs uppercase tracking-wider hover:bg-white hover:text-black transition-all duration-300 flex items-center justify-center space-x-2 rounded-full">
                  <Share2 size={16} strokeWidth={2} />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Lab Results */}
            <div className="animate-fadeIn">
              <LabResults metaData={product.meta_data || []} attributes={product.attributes || []} />
            </div>

            {/* Blueprint Fields */}
            {product.fields && (
              <div className="animate-fadeIn">
                <FloraFields fields={product.fields} metaData={product.meta_data} />
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="animate-fadeIn">
                <div className="border border-white/10 bg-white/5 backdrop-blur-xl rounded-[24px] p-6">
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
            <div className="animate-fadeIn">
              <Link href="/storefront/lab-results?vendor=flora-distro">
                <div className="border border-white/20 bg-white/5 backdrop-blur-xl rounded-[24px] p-6 hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[16px] bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
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

            {/* Reviews */}
            <div className="animate-fadeIn">
              <ProductReviews reviews={[]} />
            </div>

            {/* Category Features */}
            <div className="animate-fadeIn">
              <CategorySection categories={product.categories || []} />
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="max-w-[2000px] mx-auto flex">
            {/* Sticky Images - Left Side */}
            <div className="w-1/2 sticky top-0 h-screen overflow-y-auto scrollbar-hide bg-black relative z-10">
              <ProductGallery images={formattedImages} productName={product.name} />
            </div>

            {/* Flowing Content - Right Side */}
            <div className="w-1/2 px-12 py-12 relative">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xl"></div>
              <div className="relative z-10 space-y-6">
                {/* Product Name & Price */}
                <div className="animate-fadeIn">
                  <h1 className="text-4xl uppercase tracking-[0.12em] text-white leading-relaxed mb-3" style={{ fontWeight: 900 }}>
                    {product.name}
                  </h1>
                  
                  <p className="text-xl font-medium text-white tracking-wide mb-4">
                    {selectedPrice ? `$${selectedPrice.toFixed(0)}` : `$${Math.min(...pricingTiers.map((t: any) => t.price)).toFixed(0)} - $${Math.max(...pricingTiers.map((t: any) => t.price)).toFixed(0)}`}
                  </p>

                  {/* Stock Status */}
                  {product.stock_status === "instock" || product.total_stock > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-xs uppercase tracking-wider text-neutral-400">In Stock</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500/60" />
                      <span className="text-xs uppercase tracking-wider text-neutral-400">Out of Stock</span>
                    </div>
                  )}
                </div>

                {/* Pricing Tiers */}
                {pricingTiers.length > 0 ? (
                  <div className="animate-fadeIn">
                    <PricingTiers
                      tiers={pricingTiers}
                      onPriceSelect={handlePriceSelect}
                    />
                  </div>
                ) : (
                  <div className="text-red-500 text-xs p-2 border border-red-500/30 rounded">
                    DEBUG: No pricing tiers found (count: {pricingTiers.length})
                  </div>
                )}

                {/* Delivery Options */}
                <div className="animate-fadeIn">
                  <DeliveryAvailability
                    inventory={inventory}
                    locations={locations}
                    stockStatus={product.stock_status}
                    onDetailsChange={handleOrderDetailsChange}
                  />
                </div>

                {/* Shipping Estimator */}
                <div className="animate-fadeIn">
                  <ShippingEstimator
                    productId={parseInt(product.id) || 0}
                    quantity={selectedQuantity}
                    productPrice={selectedPrice || parseFloat(product.price) || 0}
                    locationId={selectedLocationId || undefined}
                  />
                </div>

                {/* Actions */}
                <div className="animate-fadeIn">
                  <div className="space-y-3">
                    <button 
                      onClick={handleAddToCart}
                      disabled={addedToCart || !selectedPrice}
                      className={`w-full py-5 text-base uppercase tracking-wider transition-all duration-300 font-bold rounded-full relative overflow-hidden ${
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
                      <button 
                        onClick={handleToggleWishlist}
                        className="flex-1 border-2 border-white bg-transparent text-white py-4 text-xs uppercase tracking-wider hover:bg-white hover:text-black transition-all duration-300 flex items-center justify-center space-x-2 rounded-full"
                      >
                        <Heart size={16} className={inWishlist ? 'fill-current' : ''} strokeWidth={2} />
                        <span>Wishlist</span>
                      </button>
                      <button className="flex-1 border-2 border-white bg-transparent text-white py-4 text-xs uppercase tracking-wider hover:bg-white hover:text-black transition-all duration-300 flex items-center justify-center space-x-2 rounded-full">
                        <Share2 size={16} strokeWidth={2} />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lab Results */}
                <div className="animate-fadeIn">
                  <LabResults metaData={product.meta_data || []} attributes={product.attributes || []} />
                </div>

                {/* Blueprint Fields */}
                {product.fields && (
                  <div className="animate-fadeIn">
                    <FloraFields fields={product.fields} metaData={product.meta_data} />
                  </div>
                )}

                {/* Description */}
                {product.description && (
                  <div className="animate-fadeIn">
                    <div className="border border-white/10 bg-white/5 backdrop-blur-xl rounded-[24px] p-6">
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
                <div className="animate-fadeIn">
                  <Link href="/storefront/lab-results?vendor=flora-distro">
                    <div className="border border-white/20 bg-white/5 backdrop-blur-xl rounded-[24px] p-6 hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[16px] bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
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

                {/* Reviews */}
                <div className="animate-fadeIn">
                  <ProductReviews reviews={[]} />
                </div>

                {/* Category Features */}
                <div className="animate-fadeIn">
                  <CategorySection categories={product.categories || []} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-white/10 relative py-24 px-0 sm:px-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl"></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="px-6 sm:px-0 mb-12">
              <h2 className="text-4xl md:text-5xl font-light text-white tracking-[-0.02em]">
                You May Also Like
              </h2>
            </div>
            <div className="py-8 overflow-visible">
              <ProductsCarousel 
                products={relatedProducts.map((p: any) => ({
                  ...p,
                  images: p.featured_image_storage 
                    ? [{ src: p.featured_image_storage, id: 0, name: p.name }]
                    : p.images || []
                }))}
                locations={locations}
                inventoryMap={relatedProducts.reduce((acc: any, p: any) => {
                  acc[p.id] = p.inventory || [];
                  return acc;
                }, {})}
                productFieldsMap={relatedProducts.reduce((acc: any, p: any) => {
                  acc[p.id] = {
                    fields: p.fields || {},
                    pricingTiers: p.pricing_tiers || []
                  };
                  return acc;
                }, {})}
                vendorSlug={vendor?.slug}
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
