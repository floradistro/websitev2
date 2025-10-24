"use client";

import { memo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Store, Truck, Shield, Package } from "lucide-react";
import { VendorStorefront } from "@/lib/storefront/get-vendor";
import ProductsCarousel from "@/components/ProductsCarousel";

interface StorefrontHomeClientProps {
  vendor: VendorStorefront;
  products: any[];
  inventoryMap: { [key: number]: any[] };
  productFieldsMap: { [key: number]: any };
  locations?: any[];
}

export function StorefrontHomeClient({
  vendor,
  products,
  inventoryMap,
  productFieldsMap,
  locations = [],
}: StorefrontHomeClientProps) {
  const pathname = usePathname();
  
  // Determine base path based on current path
  // If we're under /storefront, use '/storefront' prefix
  // Otherwise (custom domains), use '' (root)
  const basePath = pathname?.startsWith('/storefront') ? '/storefront' : '';
  
  return (
    <div className="bg-[#2a2a2a] min-h-screen">
      {/* Clean Hero Section - Yacht Club Style */}
      <section className="relative py-20 sm:py-28 md:py-32 px-4 sm:px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white mb-6 leading-tight tracking-tight">
              {vendor.store_name}
            </h1>
            <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-6"></div>
          </div>
          
          {vendor.store_tagline && (
            <p className="text-xl sm:text-2xl md:text-3xl font-light text-white/70 leading-relaxed mb-12">
              {vendor.store_tagline}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href={`${basePath}/shop`}
              className="inline-flex items-center gap-3 bg-white text-black px-10 py-4 text-xs uppercase tracking-[0.25em] hover:bg-white/90 transition-all font-medium"
            >
              <span>Shop Now</span>
              <ArrowRight size={14} />
            </Link>
            
            {vendor.store_description && (
              <Link 
                href={`${basePath}/about`}
                className="inline-flex items-center gap-3 bg-white/10 border border-white/20 text-white px-10 py-4 text-xs uppercase tracking-[0.25em] hover:bg-white/15 hover:border-white/30 transition-all font-medium"
              >
                <span>Our Story</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid - Clean Yacht Club Style */}
      <section className="py-12 sm:py-16 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider text-white mb-8 text-center">
            Why Shop With Us
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <Package className="w-8 h-8 mx-auto mb-4 text-white/60" />
              <h3 className="text-sm uppercase tracking-wider text-white mb-2 font-medium">Premium Quality</h3>
              <p className="text-xs text-white/50 font-light">
                Hand-picked products. Only the finest quality.
              </p>
            </div>
            <div className="text-center">
              <Truck className="w-8 h-8 mx-auto mb-4 text-white/60" />
              <h3 className="text-sm uppercase tracking-wider text-white mb-2 font-medium">Fast Delivery</h3>
              <p className="text-xs text-white/50 font-light">
                Quick turnaround. Track every order.
              </p>
            </div>
            <div className="text-center">
              <Shield className="w-8 h-8 mx-auto mb-4 text-white/60" />
              <h3 className="text-sm uppercase tracking-wider text-white mb-2 font-medium">Secure Shopping</h3>
              <p className="text-xs text-white/50 font-light">
                Your data protected. Encrypted checkout.
              </p>
            </div>
            <div className="text-center">
              <Store className="w-8 h-8 mx-auto mb-4 text-white/60" />
              <h3 className="text-sm uppercase tracking-wider text-white mb-2 font-medium">Lab Tested</h3>
              <p className="text-xs text-white/50 font-light">
                Third-party tested. Certificates available.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products - Clean Yacht Club Style */}
      {products.length > 0 && (
        <section className="py-12 sm:py-16 md:py-20 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider text-white mb-2">
                  Featured Products
                </h2>
                <div className="h-[1px] w-16 bg-white/20"></div>
              </div>
              <Link
                href={`${basePath}/shop`}
                className="text-xs uppercase tracking-wider text-white/60 hover:text-white transition-colors flex items-center gap-2"
              >
                <span>View All</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            <ProductsCarousel 
              products={products}
              locations={locations}
              inventoryMap={inventoryMap}
              productFieldsMap={productFieldsMap}
            />
          </div>
        </section>
      )}

      {/* About Section - Simple */}
      {vendor.store_description && (
        <section className="py-16 sm:py-20 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-6">
              About {vendor.store_name}
            </h2>
            <p className="text-lg font-light text-white/60 leading-relaxed mb-8">
              {vendor.store_description}
            </p>
            <Link
              href={`${basePath}/about`}
              className="inline-flex items-center gap-3 bg-white/10 border border-white/20 text-white px-8 py-3 text-xs uppercase tracking-wider hover:bg-white/15 hover:border-white/30 transition-all font-medium"
            >
              <span>Learn More</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

