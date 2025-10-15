"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, Heart, Share2, Check } from "lucide-react";
import DeliveryAvailability from "@/components/DeliveryAvailability";
import PricingTiers from "@/components/PricingTiers";
import FloraFields from "@/components/FloraFields";
import ProductInfo from "@/components/ProductInfo";
import ProductGallery from "@/components/ProductGallery";
import { useCart } from "@/context/CartContext";

interface ProductPageClientProps {
  product: any;
  locations: any[];
  inventory: any[];
  pricingRules: any;
  blueprintName: string | null;
  orderType?: string;
  relatedProducts: any[];
}

export default function ProductPageClient({
  product,
  locations,
  inventory,
  pricingRules,
  blueprintName,
  orderType,
  relatedProducts,
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
      {/* Breadcrumb */}
      <div className="border-b border-[#a8a8a5] bg-[#c5c5c2]">
        <div className="px-3 md:px-4 py-3">
          <Link
            href="/products"
            className="inline-flex items-center space-x-2 text-sm hover:opacity-60 transition-all duration-200 font-light"
          >
            <ChevronLeft size={16} strokeWidth={1.5} />
            <span>Back to Products</span>
          </Link>
        </div>
      </div>

      {/* Product Content */}
      <div className="px-3 md:px-4 py-6 md:py-8 bg-[#c5c5c2]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Images */}
          <ProductGallery images={product.images} productName={product.name} />

          {/* Product Info */}
          <div className="lg:sticky lg:top-32 h-fit space-y-4 md:space-y-6">
            <ProductInfo
              product={product}
              pricingRules={pricingRules}
              blueprintName={blueprintName}
              onPriceSelect={handlePriceSelect}
            />

            {/* Delivery & Pickup Availability */}
            <DeliveryAvailability
              inventory={inventory}
              locations={locations}
              stockStatus={product.stock_status}
              initialOrderType={orderType as "pickup" | "delivery" | undefined}
              onDetailsChange={handleOrderDetailsChange}
            />

            {/* Flora Fields */}
            {product.meta_data && product.meta_data.length > 0 && (
              <FloraFields metaData={product.meta_data} />
            )}

            {/* Add to Cart */}
            <div className="space-y-3 mb-8 md:mb-12">
              <button 
                onClick={handleAddToCart}
                disabled={addedToCart}
                className={`w-full py-4 rounded-full text-sm uppercase tracking-[0.15em] shadow-elevated transition-all duration-300 font-light relative overflow-hidden ${
                  addedToCart 
                    ? "bg-green-600 text-white" 
                    : "bg-black text-white hover:bg-[#222] hover:shadow-elevated-lg"
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
                <button className="flex-1 border border-[#e5e5e2] bg-[#f5f5f2] py-4 rounded-full text-sm uppercase tracking-[0.15em] shadow-subtle hover:border-black hover:shadow-elevated transition-all duration-300 flex items-center justify-center space-x-2 font-light">
                  <Heart size={16} strokeWidth={1.5} />
                  <span>Wishlist</span>
                </button>
                <button className="flex-1 border border-[#e5e5e2] bg-[#f5f5f2] py-4 rounded-full text-sm uppercase tracking-[0.15em] shadow-subtle hover:border-black hover:shadow-elevated transition-all duration-300 flex items-center justify-center space-x-2 font-light">
                  <Share2 size={16} strokeWidth={1.5} />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Product Details */}
            <div className="border-t border-[#a8a8a5] pt-6 md:pt-8 space-y-4 md:space-y-6">
              <div className="animate-fadeIn">
                <h3 className="text-xs uppercase tracking-wider font-semibold mb-3 md:mb-4">
                  Product Details
                </h3>
                {product.description && (
                  <div
                    className="text-sm text-[#767676] leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                )}
              </div>

              {product.sku && (
                <div className="border-t border-[#a8a8a5] pt-4 md:pt-6">
                  <div className="flex justify-between py-2 px-3 rounded-lg hover:border-[#e5e5e2] hover:shadow-subtle border border-transparent transition-all duration-200">
                    <span className="text-[#999] font-light text-sm">SKU</span>
                    <span className="font-light text-sm">{product.sku}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-[#a8a8a5] bg-[#c5c5c2] py-8 md:py-12">
          <div className="px-3 md:px-4 mb-6">
            <h2 className="text-xl md:text-2xl font-light uppercase tracking-[0.2em] animate-fadeIn">
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
                    <div className="relative aspect-[4/5] bg-[#9a9a97] mb-2 overflow-hidden shadow-sm active:shadow-md transition-all duration-300">
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
                        <div className="w-full h-full bg-[#9a9a97]" />
                      )}
                    </div>
                    <div className="space-y-0.5 px-2">
                      <h3 className="text-xs leading-tight line-clamp-2 font-light">
                        {item.name}
                      </h3>
                      <p className="text-xs font-light">
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
                  <div className="relative aspect-[4/5] bg-[#9a9a97] mb-3 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                    {item.images?.[0] ? (
                      <>
                        <img
                          src={item.images[0].src}
                          alt={item.name}
                          className="w-full h-full object-contain transition-all duration-500 group-hover:scale-105"
                        />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-8 bg-[#b5b5b2]">
                        <img
                          src="/logoprint.png"
                          alt="Flora Distro"
                          className="w-full h-full object-contain opacity-40"
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 px-2 md:px-3">
                    <h3 className="text-xs md:text-sm leading-tight line-clamp-2 font-light group-hover:opacity-60 transition-opacity duration-200">
                      {item.name}
                    </h3>
                    <p className="text-xs md:text-sm font-light">
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

