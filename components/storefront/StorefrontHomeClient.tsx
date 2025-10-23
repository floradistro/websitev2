"use client";

import { memo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Store, Truck, Shield, Package, CheckCircle } from "lucide-react";
import { VendorStorefront } from "@/lib/storefront/get-vendor";

// Removed LuxuryHero - replaced with vendor-specific hero below

const ProductsCarousel = dynamic(() => import("@/components/ProductsCarousel"), {
  ssr: false,
  loading: () => (
    <div className="flex gap-4 px-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[300px] h-[400px] bg-[#3a3a3a]" />
      ))}
    </div>
  ),
});

const GlobalAnimation = dynamic(() => import("@/components/GlobalAnimation"), { ssr: false });

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
  return (
    <div 
      className="bg-[#2a2a2a] overflow-x-hidden w-full max-w-full relative"
      style={{ minHeight: 'calc(100vh - env(safe-area-inset-top, 0px))' }}
    >
      {/* Global Floating Animation Background */}
      <GlobalAnimation />
      
      {/* Hero Section - Vendor Specific */}
      <section className="relative h-[85vh] flex items-center justify-center text-center overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 opacity-0 animate-fadeInUp">
            <div className="text-xs uppercase tracking-[0.3em] text-white/60 mb-4 font-light">
              Premium Cannabis
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-white mb-8 leading-none tracking-tight">
              {vendor.store_name}
            </h1>
          </div>
          
          <div className="max-w-3xl mx-auto mb-12 opacity-0 animate-fadeInUp animation-delay-300">
            <p className="text-xl sm:text-2xl md:text-3xl font-light text-white/70 leading-relaxed">
              {vendor.store_tagline || 'Premium Cannabis Products'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fadeInUp animation-delay-600">
            <Link 
              href="/test-storefront/shop"
              className="group inline-flex items-center gap-3 bg-white text-black px-10 py-4 text-xs uppercase tracking-[0.25em] hover:bg-white/90 transition-all duration-300 font-medium"
            >
              <span>Explore Collection</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            
            <Link 
              href="/test-storefront/about"
              className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-10 py-4 text-xs uppercase tracking-[0.25em] hover:bg-white/15 hover:border-white/30 transition-all duration-300 font-medium"
            >
              <span>Our Story</span>
            </Link>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 animate-fadeInUp animation-delay-1000">
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-white/40 uppercase tracking-wider font-light">Scroll</span>
              <div className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Vendor Mission Statement */}
      <section className="relative py-20 sm:py-28 md:py-32 px-4 sm:px-6 overflow-hidden w-full border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a]/40 via-[#1a1a1a]/35 to-[#1a1a1a]/30 backdrop-blur-sm"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-white mb-8 leading-none tracking-tight">
            {vendor.store_tagline || vendor.store_name}
          </h2>
          <p className="text-base sm:text-lg md:text-xl font-light text-white/50 leading-relaxed max-w-2xl mx-auto mb-12">
            {vendor.store_description || `Premium cannabis products curated for you.`}
          </p>
          <Link 
            href="/test-storefront/shop"
            className="group inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-10 py-4 text-xs uppercase tracking-[0.25em] hover:bg-white/15 hover:border-white/30 transition-all duration-300 font-medium"
          >
            <Store size={16} />
            <span>Shop Collection</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
      </section>

      {/* Features Grid - Yacht Club Style */}
      <section className="relative py-16 overflow-x-hidden w-full border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#3a3a3a]/35 to-[#3a3a3a]/30 backdrop-blur-md"></div>
        <div className="px-4 sm:px-6 mb-12 relative z-10">
          <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider text-white mb-3">
            Why Shop With Us
          </h2>
          <div className="h-[1px] w-16 bg-gradient-to-r from-purple-500/60 to-transparent"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px relative z-10">
          <div className="bg-[#3a3a3a]/30 backdrop-blur-md hover:bg-[#404040]/40 transition-all duration-500 p-8 lg:p-10 border border-white/10 hover:border-purple-500/30 group">
            <Package className="w-8 h-8 mb-6 text-purple-400/70 group-hover:text-purple-300 transition-colors" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Premium Quality</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              Hand-picked products. Every item verified. Only the finest quality.
            </p>
          </div>
          <div className="bg-[#3a3a3a]/30 backdrop-blur-md hover:bg-[#404040]/40 transition-all duration-500 p-8 lg:p-10 border border-white/10 hover:border-purple-500/30 group">
            <Truck className="w-8 h-8 mb-6 text-purple-400/70 group-hover:text-purple-300 transition-colors" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Fast Delivery</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              Quick turnaround. Discreet packaging. Track every order in real-time.
            </p>
          </div>
          <div className="bg-[#3a3a3a]/30 backdrop-blur-md hover:bg-[#404040]/40 transition-all duration-500 p-8 lg:p-10 border border-white/10 hover:border-purple-500/30 group">
            <Shield className="w-8 h-8 mb-6 text-purple-400/70 group-hover:text-purple-300 transition-colors" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Secure Shopping</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              Your data protected. Encrypted checkout. Industry-standard security.
            </p>
          </div>
          <div className="bg-[#3a3a3a]/30 backdrop-blur-md hover:bg-[#404040]/40 transition-all duration-500 p-8 lg:p-10 border border-white/10 hover:border-purple-500/30 group">
            <CheckCircle className="w-8 h-8 mb-6 text-purple-400/70 group-hover:text-purple-300 transition-colors" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Lab Tested</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              Full compliance. Third-party tested. Certificates available.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Products Carousel */}
      {products.length > 0 && (
        <section className="relative py-16 sm:py-20 md:py-24 overflow-x-hidden w-full border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a]/60 to-[#1a1a1a]/40"></div>
          
          <div className="px-4 sm:px-6 mb-12 sm:mb-16 relative z-10">
            <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider text-white mb-3">
              Featured Collection
            </h2>
            <div className="h-[1px] w-16 bg-gradient-to-r from-purple-500/60 to-transparent"></div>
          </div>

          <div className="relative z-10">
            <ProductsCarousel 
              products={products}
              locations={locations}
              inventoryMap={inventoryMap}
              productFieldsMap={productFieldsMap}
            />
          </div>

          <div className="px-4 sm:px-6 mt-12 text-center relative z-10">
            <Link
              href="/test-storefront/shop"
              className="inline-flex items-center gap-3 bg-white text-black px-10 py-4 text-xs uppercase tracking-[0.25em] hover:bg-white/90 transition-all duration-300 font-medium"
            >
              <span>View Full Collection</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </section>
      )}

      {/* About Section */}
      {vendor.store_description && (
        <section className="relative py-20 sm:py-24 md:py-32 px-4 sm:px-6 overflow-hidden w-full">
          <div className="absolute inset-0 bg-gradient-to-b from-[#2a2a2a]/80 to-[#1a1a1a]/60"></div>
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="mb-6">
              <div className="text-xs uppercase tracking-[0.3em] text-white/40 mb-4 font-light">Our Story</div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-light text-white mb-8 leading-tight tracking-tight">
                About {vendor.store_name}
              </h2>
              <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-purple-500/60 to-transparent mx-auto mb-12"></div>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-light text-white/60 leading-relaxed">
              {vendor.store_description}
            </p>
            <Link
              href="/test-storefront/about"
              className="inline-flex items-center gap-3 mt-12 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-10 py-4 text-xs uppercase tracking-[0.25em] hover:bg-white/15 hover:border-white/30 transition-all duration-300 font-medium"
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

