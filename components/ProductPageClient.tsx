"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, Heart, Share2, Check } from "lucide-react";
import DeliveryAvailability from "@/components/DeliveryAvailability";
import PricingTiers from "@/components/PricingTiers";
import FloraFields from "@/components/FloraFields";
import ProductInfo from "@/components/ProductInfo";
import ProductGallery from "@/components/ProductGallery";
import CategorySection from "@/components/CategorySection";
import LabResults from "@/components/LabResults";
import ProductReviews from "@/components/ProductReviews";
import { useCart } from "@/context/CartContext";

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
  
  const { addToCart } = useCart();

  const handlePriceSelect = useCallback((price: number, quantity: number, tierName: string) => {
    setSelectedPrice(price);
    setSelectedQuantity(quantity);
    setSelectedTierName(tierName);
  }, []);

  const handleOrderDetailsChange = useCallback((details: any) => {
    setOrderDetails((prev: any) => {
      // Only update if actually changed to prevent infinite loops
      if (JSON.stringify(prev) !== JSON.stringify(details)) {
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

  return (
    <div>
      {/* Breadcrumb - Enhanced */}
      <div className="border-b border-white/10 bg-gradient-to-br from-[#2a2a2a] via-[#2d2d2d] to-[#2a2a2a] backdrop-blur-sm">
        <div className="px-3 md:px-6 py-4 flex items-center justify-between">
          <Link
            href="/products"
            className="group inline-flex items-center space-x-2 text-sm text-white/80 hover:text-white transition-all duration-300 font-light"
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 group-hover:bg-white/10 transition-all duration-300">
              <ChevronLeft size={16} strokeWidth={1.5} />
            </div>
            <span className="tracking-wide">Back to Products</span>
          </Link>
          
          {/* Optional product category badge */}
          {product.categories && product.categories.length > 0 && (
            <div className="hidden md:flex items-center gap-2">
              <div className="h-px w-8 bg-white/10"></div>
              <span className="text-xs uppercase tracking-[0.2em] text-white/40 font-light">
                {product.categories[0].name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Product Content - Prada Style Layout */}
      <div className="bg-[#2a2a2a]">
        {/* Mobile Layout */}
        <div className="lg:hidden px-3 md:px-4 py-6 space-y-6">
          <ProductGallery images={product.images} productName={product.name} />
          
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

          <div className="space-y-3">
            <button 
              onClick={handleAddToCart}
              disabled={addedToCart}
              className={`w-full py-4 rounded-full text-sm uppercase tracking-[0.15em] shadow-elevated transition-all duration-300 font-light relative overflow-hidden ${
                addedToCart 
                  ? "bg-green-600 text-white" 
                  : "bg-white text-black hover:bg-white/90 hover:shadow-elevated-lg"
              }`}
            >
              <span className={`inline-flex items-center gap-2 transition-all duration-300 ${addedToCart ? "opacity-0" : "opacity-100"}`}>
                Add to Shopping Bag
              </span>
              <span className={`absolute inset-0 flex items-center justify-center gap-2 transition-all duration-300 ${addedToCart ? "opacity-100" : "opacity-0"}`}>
                <Check size={18} strokeWidth={2} />
                Added to Bag
              </span>
            </button>
            <div className="flex space-x-3">
              <button className="flex-1 border border-white/20 bg-white/10 text-white py-4 rounded-full text-sm uppercase tracking-[0.15em] shadow-subtle hover:border-white/40 hover:bg-white/20 hover:shadow-elevated transition-all duration-300 flex items-center justify-center space-x-2 font-light">
                <Heart size={16} strokeWidth={1.5} />
                <span>Wishlist</span>
              </button>
              <button className="flex-1 border border-white/20 bg-white/10 text-white py-4 rounded-full text-sm uppercase tracking-[0.15em] shadow-subtle hover:border-white/40 hover:bg-white/20 hover:shadow-elevated transition-all duration-300 flex items-center justify-center space-x-2 font-light">
                <Share2 size={16} strokeWidth={1.5} />
                <span>Share</span>
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
            <div className="border border-white/10 rounded-lg overflow-hidden bg-white/5 backdrop-blur-sm p-6">
              <h3 className="text-sm uppercase tracking-[0.15em] font-semibold mb-4 text-white text-center">
                Description
              </h3>
              <div
                className="text-base text-white/90 leading-relaxed prose prose-sm prose-invert max-w-none text-center"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}

          {/* Reviews */}
          <ProductReviews reviews={reviews} />

          <div className="pt-4">
            <CategorySection categories={product.categories || []} />
          </div>
        </div>

        {/* Desktop Layout - Prada Style */}
        <div className="hidden lg:block">
          <div className="flex">
            {/* Sticky Images - Left Side */}
            <div className="w-1/2 sticky top-0 h-screen overflow-y-auto scrollbar-hide">
              <ProductGallery images={product.images} productName={product.name} />
            </div>

            {/* Flowing Content Blocks - Right Side */}
            <div className="w-1/2 px-8 py-12">
              {/* Product Info Block */}
              <div className="mb-16 animate-fadeIn">
                <ProductInfo
                  product={product}
                  pricingRules={pricingRules}
                  blueprintName={blueprintName}
                  onPriceSelect={handlePriceSelect}
                />
              </div>

              {/* Delivery Block */}
              <div className="mb-16 animate-fadeIn" style={{animationDelay: '100ms'}}>
                <DeliveryAvailability
                  inventory={inventory}
                  locations={locations}
                  stockStatus={product.stock_status}
                  initialOrderType={orderType as "pickup" | "delivery" | undefined}
                  onDetailsChange={handleOrderDetailsChange}
                />
              </div>

              {/* Actions Block */}
              <div className="mb-16 animate-fadeIn" style={{animationDelay: '300ms'}}>
                <div className="space-y-4">
                  <button 
                    onClick={handleAddToCart}
                    disabled={addedToCart}
                    className={`w-full py-5 rounded-full text-sm uppercase tracking-[0.15em] shadow-elevated transition-all duration-300 font-light relative overflow-hidden ${
                      addedToCart 
                        ? "bg-green-600 text-white" 
                        : "bg-white text-black hover:bg-white/90 hover:shadow-elevated-lg"
                    }`}
                  >
                    <span className={`inline-flex items-center gap-2 transition-all duration-300 ${addedToCart ? "opacity-0" : "opacity-100"}`}>
                      Add to Shopping Bag
                    </span>
                    <span className={`absolute inset-0 flex items-center justify-center gap-2 transition-all duration-300 ${addedToCart ? "opacity-100" : "opacity-0"}`}>
                      <Check size={18} strokeWidth={2} />
                      Added to Bag
                    </span>
                  </button>
                  <div className="flex space-x-4">
                    <button className="flex-1 border border-white/20 bg-white/10 text-white py-5 rounded-full text-sm uppercase tracking-[0.15em] shadow-subtle hover:border-white/40 hover:bg-white/20 hover:shadow-elevated transition-all duration-300 flex items-center justify-center space-x-2 font-light">
                      <Heart size={16} strokeWidth={1.5} />
                      <span>Wishlist</span>
                    </button>
                    <button className="flex-1 border border-white/20 bg-white/10 text-white py-5 rounded-full text-sm uppercase tracking-[0.15em] shadow-subtle hover:border-white/40 hover:bg-white/20 hover:shadow-elevated transition-all duration-300 flex items-center justify-center space-x-2 font-light">
                      <Share2 size={16} strokeWidth={1.5} />
                      <span>Share</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Lab Results Block */}
              <div className="mb-16 animate-fadeIn" style={{animationDelay: '300ms'}}>
                <LabResults metaData={product.meta_data || []} attributes={product.attributes || []} />
              </div>

              {/* Specifications Block */}
              {product.meta_data && product.meta_data.length > 0 && (
                <div className="mb-16 animate-fadeIn" style={{animationDelay: '400ms'}}>
                  <FloraFields metaData={product.meta_data} />
                </div>
              )}

              {/* Long Description Block */}
              {product.description && (
                <div className="mb-16 animate-fadeIn" style={{animationDelay: '500ms'}}>
                  <div className="border border-white/10 rounded-lg overflow-hidden bg-white/5 backdrop-blur-sm p-8">
                    <h3 className="text-sm uppercase tracking-[0.2em] font-semibold mb-6 text-white text-center">
                      Description
                    </h3>
                    <div
                      className="text-base text-white/90 leading-relaxed prose prose-sm prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: product.description }}
                    />
                  </div>
                </div>
              )}

              {/* Reviews Block */}
              <div className="mb-16 animate-fadeIn" style={{animationDelay: '550ms'}}>
                <ProductReviews reviews={reviews} />
              </div>

              {/* SKU Block */}
              {product.sku && (
                <div className="mb-16 animate-fadeIn" style={{animationDelay: '600ms'}}>
                  <div className="flex justify-between items-center py-4 border-b border-white/20">
                    <span className="text-xs uppercase tracking-wider text-white/50">SKU</span>
                    <span className="font-light text-sm text-white">{product.sku}</span>
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

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-white/10 bg-[#2a2a2a] py-8 md:py-12">
          <div className="px-3 md:px-4 mb-6">
            <h2 className="text-xl md:text-2xl font-light uppercase tracking-[0.2em] animate-fadeIn text-white">
              You May Also Like
            </h2>
          </div>
          <div className="w-full">
            {/* Mobile: Horizontal Scroll */}
            <div className="md:hidden overflow-x-auto scrollbar-hide -mx-0.5">
              <div className="flex gap-px">
                {relatedProducts.map((item: any, idx: number) => (
                  <Link
                    key={item.id}
                    href={`/products/${item.id}`}
                    style={{ animationDelay: `${idx * 100}ms` }}
                    className="group block animate-fadeIn flex-shrink-0 w-[50vw]"
                  >
                    <div className="relative aspect-[4/5] bg-white/10 mb-2 overflow-hidden shadow-sm active:shadow-md transition-all duration-300">
                      {item.images?.[0] ? (
                        <>
                          <img
                            src={item.images[0].src}
                            alt={item.name}
                            className="w-full h-full object-contain transition-all duration-500"
                          />
                          {item.images?.[1] && (
                            <img
                              src={item.images[1].src}
                              alt={item.name}
                              className="absolute inset-0 w-full h-full object-contain opacity-0 transition-all duration-500"
                            />
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full bg-white/10" />
                      )}
                    </div>
                    <div className="space-y-0.5 px-2">
                      <h3 className="text-xs leading-tight line-clamp-2 font-light text-white">
                        {item.name}
                      </h3>
                      <p className="text-xs font-light text-white/80">
                        ${item.price ? parseFloat(item.price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Desktop: Grid */}
            <div className="hidden md:grid grid-cols-4 lg:grid-cols-6 gap-px md:gap-0.5">
              {relatedProducts.map((item: any, idx: number) => (
                <Link
                  key={item.id}
                  href={`/products/${item.id}`}
                  style={{ animationDelay: `${idx * 100}ms` }}
                  className="group block animate-fadeIn"
                >
                  <div className="relative aspect-[4/5] bg-white/10 mb-3 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                    {item.images?.[0] ? (
                      <>
                        <img
                          src={item.images[0].src}
                          alt={item.name}
                          className="w-full h-full object-contain transition-all duration-500 group-hover:scale-105"
                        />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-8 bg-white/10">
                        <img
                          src="/logoprint.png"
                          alt="Flora Distro"
                          className="w-full h-full object-contain opacity-40"
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 px-2 md:px-3">
                    <h3 className="text-xs md:text-sm leading-tight line-clamp-2 font-light text-white group-hover:opacity-60 transition-opacity duration-200">
                      {item.name}
                    </h3>
                    <p className="text-xs md:text-sm font-light text-white/80">
                      ${item.price ? parseFloat(item.price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

