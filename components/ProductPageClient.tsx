"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Heart, Share2, Check } from "lucide-react";
import { useRecentlyViewedContext } from "@/context/RecentlyViewedContext";
import DeliveryAvailability from "@/components/DeliveryAvailability";
import PricingTiers from "@/components/PricingTiers";
import FloraFields from "@/components/FloraFields";
import ProductInfo from "@/components/ProductInfo";
import ProductGallery from "@/components/ProductGallery";
import CategorySection from "@/components/CategorySection";
import LabResults from "@/components/LabResults";
import ProductReviews from "@/components/ProductReviews";
import ProductCard from "@/components/ProductCard";
import ShippingEstimator from "@/components/ShippingEstimator";
import RecentlyViewed from "@/components/RecentlyViewed";
import { ProductSchema, BreadcrumbSchema } from "@/components/StructuredData";
import { useCart } from "@/context/CartContext";
import { analytics } from "@/lib/analytics";

interface ProductPageClientProps {
  product: any;
  locations: any[];
  inventory: any[];
  pricingRules: any;
  blueprintName: string | null;
  orderType?: string;
  relatedProducts: any[];
  reviews: any[];
}

export default function ProductPageClient({
  product,
  locations,
  inventory,
  pricingRules,
  blueprintName,
  orderType,
  relatedProducts,
  reviews,
}: ProductPageClientProps) {
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
  const [selectedTierName, setSelectedTierName] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  
  const { addToCart } = useCart();
  const { addProduct: addToRecentlyViewed } = useRecentlyViewedContext();

  // Track this product view
  useEffect(() => {
    addToRecentlyViewed({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0]?.src,
    });

    // Track analytics
    analytics.viewProduct({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price) || 0,
      category: product.categories?.[0]?.name,
    });
  }, [product.id, product.name, product.price, product.images, product.categories, addToRecentlyViewed]);

  const handlePriceSelect = useCallback((price: number, quantity: number, tierName: string) => {
    setSelectedPrice(price);
    setSelectedQuantity(quantity);
    setSelectedTierName(tierName);
  }, []);

  const handleOrderDetailsChange = useCallback((details: any) => {
    setOrderDetails((prev: any) => {
      // Only update if actually changed to prevent infinite loops
      if (JSON.stringify(prev) !== JSON.stringify(details)) {
        // Update selected location for shipping calculation
        if (details.locationId) {
          setSelectedLocationId(parseInt(details.locationId));
        }
        return details;
      }
      return prev;
    });
  }, []);

  const handleAddToCart = () => {
    const price = selectedPrice || parseFloat(product.price) || 0;
    const tierName = selectedTierName || "1 unit";

    addToCart({
      productId: product.id,
      name: product.name,
      price: price,
      quantity: selectedQuantity,
      tierName: tierName,
      image: product.images?.[0]?.src,
      orderType: orderDetails?.orderType,
      locationId: orderDetails?.locationId,
      locationName: orderDetails?.locationName,
      deliveryAddress: orderDetails?.deliveryAddress,
    });

    // Show success animation
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  // Build breadcrumb items for schema
  const breadcrumbItems = [
    { name: "Home", url: "https://floradistro.com" },
    { name: "Products", url: "https://floradistro.com/products" },
  ];
  
  if (product.categories && product.categories.length > 0) {
    breadcrumbItems.push({
      name: product.categories[0].name,
      url: `https://floradistro.com/products?category=${product.categories[0].slug}`
    });
  }
  
  breadcrumbItems.push({
    name: product.name,
    url: `https://floradistro.com/products/${product.id}`
  });

  return (
    <div className="bg-[#1a1a1a]">
      {/* Structured Data for SEO */}
      <ProductSchema product={product} />
      <BreadcrumbSchema items={breadcrumbItems} />
      
      {/* Breadcrumb Navigation */}
      <div className="border-b border-white/10 bg-[#1a1a1a]">
        <div className="max-w-[2000px] mx-auto px-4 py-4">
          <nav className="flex items-center space-x-2 text-xs uppercase tracking-wider">
            <Link
              href="/"
              className="text-white/40 hover:text-white transition-colors"
            >
              Home
            </Link>
            <span className="text-white/20">/</span>
            <Link
              href="/products"
              className="text-white/40 hover:text-white transition-colors"
            >
              Products
            </Link>
            {product.categories && product.categories.length > 0 && (
              <>
                <span className="text-white/20">/</span>
                <Link
                  href={`/products?category=${product.categories[0].slug}`}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  {product.categories[0].name}
                </Link>
              </>
            )}
            <span className="text-white/20">/</span>
            <span className="text-white/60 font-medium line-clamp-1">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Product Content */}
      <div className="bg-[#1a1a1a]">
        {/* Mobile Layout */}
        <div className="lg:hidden">
          <ProductGallery images={product.images} productName={product.name} />
          
          <div className="px-4 py-6 space-y-6">
            <ProductInfo
              product={product}
              pricingRules={pricingRules}
              blueprintName={blueprintName}
              onPriceSelect={handlePriceSelect}
            />

            <DeliveryAvailability
              inventory={inventory}
              locations={locations}
              stockStatus={product.stock_status}
              initialOrderType={orderType as "pickup" | "delivery" | undefined}
              onDetailsChange={handleOrderDetailsChange}
            />

            <ShippingEstimator
              productId={product.id}
              quantity={selectedQuantity}
              productPrice={selectedPrice || parseFloat(product.price) || 0}
              locationId={selectedLocationId || undefined}
            />

            <div className="space-y-3">
              <button 
                onClick={handleAddToCart}
                disabled={addedToCart}
                className={`w-full py-4 text-xs uppercase tracking-[0.2em] transition-all duration-300 font-medium relative overflow-hidden ${
                  addedToCart 
                    ? "bg-black text-white border border-white/40" 
                    : "bg-black border border-white/20 text-white hover:bg-white hover:text-black hover:border-white"
                }`}
              >
                <span className={`inline-flex items-center gap-2 transition-all duration-300 ${addedToCart ? "opacity-0" : "opacity-100"}`}>
                  Add to Cart
                </span>
                <span className={`absolute inset-0 flex items-center justify-center gap-2 transition-all duration-300 ${addedToCart ? "opacity-100" : "opacity-0"}`}>
                  <Check size={16} strokeWidth={2} />
                  Added
                </span>
              </button>
              <div className="flex space-x-3">
                <button className="flex-1 border border-white/20 bg-transparent text-white py-4 text-xs uppercase tracking-[0.15em] hover:border-white/40 hover:bg-white/5 transition-all duration-300 flex items-center justify-center space-x-2 active:scale-95">
                  <Heart size={14} strokeWidth={1.5} />
                  <span className="hidden sm:inline">Wishlist</span>
                </button>
                <button className="flex-1 border border-white/20 bg-transparent text-white py-4 text-xs uppercase tracking-[0.15em] hover:border-white/40 hover:bg-white/5 transition-all duration-300 flex items-center justify-center space-x-2 active:scale-95">
                  <Share2 size={14} strokeWidth={1.5} />
                  <span className="hidden sm:inline">Share</span>
                </button>
              </div>
            </div>

            {/* Lab Results */}
            <LabResults metaData={product.meta_data || []} attributes={product.attributes || []} />

            {/* Specifications */}
            {product.meta_data && product.meta_data.length > 0 && (
              <FloraFields metaData={product.meta_data} />
            )}

            {/* Long Description */}
            {product.description && (
              <div className="border border-white/10 bg-[#1a1a1a] p-4">
                <h3 className="text-xs uppercase tracking-[0.2em] font-medium mb-3 text-white/60">
                  Description
                </h3>
                <div
                  className="text-xs text-white/80 leading-relaxed prose prose-sm prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}

            {/* Reviews */}
            <ProductReviews reviews={reviews} />

            {/* Category Features */}
            <CategorySection categories={product.categories || []} />
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block">
          <div className="max-w-[2000px] mx-auto flex">
            {/* Sticky Images - Left Side */}
            <div className="w-1/2 sticky top-0 h-screen overflow-y-auto scrollbar-hide bg-black">
              <ProductGallery images={product.images} productName={product.name} />
            </div>

            {/* Flowing Content - Right Side */}
            <div className="w-1/2 px-12 py-12 bg-[#1a1a1a]">
              {/* Product Info Block */}
              <div className="mb-6 animate-fadeIn">
                <ProductInfo
                  product={product}
                  pricingRules={pricingRules}
                  blueprintName={blueprintName}
                  onPriceSelect={handlePriceSelect}
                />
              </div>

              {/* Delivery Block */}
              <div className="mb-6 animate-fadeIn" style={{animationDelay: '100ms'}}>
                <DeliveryAvailability
                  inventory={inventory}
                  locations={locations}
                  stockStatus={product.stock_status}
                  initialOrderType={orderType as "pickup" | "delivery" | undefined}
                  onDetailsChange={handleOrderDetailsChange}
                />
              </div>

              {/* Shipping Estimator Block */}
              <div className="mb-6 animate-fadeIn" style={{animationDelay: '200ms'}}>
                <ShippingEstimator
                  productId={product.id}
                  quantity={selectedQuantity}
                  productPrice={selectedPrice || parseFloat(product.price) || 0}
                  locationId={selectedLocationId || undefined}
                />
              </div>

              {/* Actions Block */}
              <div className="mb-8 animate-fadeIn" style={{animationDelay: '300ms'}}>
                <div className="space-y-3">
                  <button 
                    onClick={handleAddToCart}
                    disabled={addedToCart}
                    className={`w-full py-4 text-xs uppercase tracking-[0.2em] transition-all duration-300 font-medium relative overflow-hidden ${
                      addedToCart 
                        ? "bg-black text-white border border-white/40" 
                        : "bg-black border border-white/20 text-white hover:bg-white hover:text-black hover:border-white"
                    }`}
                  >
                    <span className={`inline-flex items-center gap-2 transition-all duration-300 ${addedToCart ? "opacity-0" : "opacity-100"}`}>
                      Add to Cart
                    </span>
                    <span className={`absolute inset-0 flex items-center justify-center gap-2 transition-all duration-300 ${addedToCart ? "opacity-100" : "opacity-0"}`}>
                      <Check size={16} strokeWidth={2} />
                      Added
                    </span>
                  </button>
                  <div className="flex space-x-4">
                    <button className="flex-1 border border-white/20 bg-transparent text-white py-4 text-xs uppercase tracking-[0.15em] hover:border-white/40 hover:bg-white/5 transition-all duration-300 flex items-center justify-center space-x-2 active:scale-95">
                      <Heart size={14} strokeWidth={1.5} />
                      <span>Wishlist</span>
                    </button>
                    <button className="flex-1 border border-white/20 bg-transparent text-white py-4 text-xs uppercase tracking-[0.15em] hover:border-white/40 hover:bg-white/5 transition-all duration-300 flex items-center justify-center space-x-2 active:scale-95">
                      <Share2 size={14} strokeWidth={1.5} />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Lab Results Block */}
              <div className="mb-6 animate-fadeIn" style={{animationDelay: '300ms'}}>
                <LabResults metaData={product.meta_data || []} attributes={product.attributes || []} />
              </div>

              {/* Specifications Block */}
              {product.meta_data && product.meta_data.length > 0 && (
                <div className="mb-6 animate-fadeIn" style={{animationDelay: '400ms'}}>
                  <FloraFields metaData={product.meta_data} />
                </div>
              )}

              {/* Long Description Block */}
              {product.description && (
                <div className="mb-6 animate-fadeIn" style={{animationDelay: '500ms'}}>
                  <div className="border border-white/10 bg-[#1a1a1a] p-4">
                    <h3 className="text-xs uppercase tracking-[0.2em] font-medium mb-3 text-white/60">
                      Description
                    </h3>
                    <div
                      className="text-xs text-white/80 leading-relaxed prose prose-sm prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  </div>
                </div>
              )}

              {/* Reviews Block */}
              <div className="mb-6 animate-fadeIn" style={{animationDelay: '550ms'}}>
                <ProductReviews reviews={reviews} />
              </div>

              {/* SKU Block */}
              {product.sku && (
                <div className="mb-6 animate-fadeIn" style={{animationDelay: '600ms'}}>
                  <div className="flex justify-between items-center py-2 border-t border-white/10">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-white/50">SKU</span>
                    <span className="text-xs text-white/80">{product.sku}</span>
                  </div>
                </div>
              )}

              {/* Category Features Block */}
              <div className="animate-fadeIn" style={{animationDelay: '700ms'}}>
                <CategorySection categories={product.categories || []} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Viewed Products */}
      <RecentlyViewed />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-white/10 bg-[#2a2a2a] py-8">
          <div className="px-4 mb-6">
            <h2 className="text-xs uppercase tracking-[0.2em] text-white/60 font-medium">
              You May Also Like
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-px">
            {relatedProducts.map((item: any, idx: number) => {
              // Extract fields from product metadata for each related product
              const metaData = item.meta_data || [];
              const fields: { [key: string]: string } = {};
              
              const fieldKeys = [
                'strain_type', 'thca_%', 'thca_percentage', 'thc_%', 'thc_percentage',
                'lineage', 'nose', 'terpene', 'terpenes', 'effects', 'effect',
                'mg_per_pack', 'mg_per_piece', 'ingredients', 'type'
              ];
              
              metaData.forEach((meta: any) => {
                const key = meta.key?.toLowerCase();
                if (fieldKeys.some(fk => fk === key)) {
                  fields[key] = meta.value;
                }
              });
              
              // Get blueprint name
              let blueprintName = null;
              if (item.categories && item.categories.length > 0) {
                const categoryName = item.categories[0].slug;
                if (categoryName.includes('flower') || categoryName.includes('pre-roll')) {
                  blueprintName = 'flower_blueprint';
                } else if (categoryName.includes('concentrate')) {
                  blueprintName = 'concentrate_blueprint';
                } else if (categoryName.includes('edible')) {
                  blueprintName = 'edible_blueprint';
                } else if (categoryName.includes('vape')) {
                  blueprintName = 'vape_blueprint';
                }
              }
              
              return (
                <ProductCard
                  key={item.id}
                  product={item}
                  index={idx}
                  locations={locations}
                  pricingRules={pricingRules}
                  productFields={{ fields, blueprintName }}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

