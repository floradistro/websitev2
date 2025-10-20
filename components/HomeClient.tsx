"use client";

import { memo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Store, Users, Truck, Shield, Leaf, Package, CheckCircle, Star } from "lucide-react";

// Client-side dynamic imports with ssr: false
const LuxuryHero = dynamic(() => import("@/components/LuxuryHero"), {
  ssr: false,
  loading: () => <div className="w-full h-[600px] bg-[#2a2a2a] animate-pulse" />,
});

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

const CategoriesCarousel = dynamic(() => import("@/components/CategoriesCarousel"), {
  ssr: false,
  loading: () => <div className="w-full h-[200px] bg-[#3a3a3a] animate-pulse" />,
});

const LocationsCarousel = dynamic(() => import("@/components/LocationsCarousel"), {
  ssr: false,
  loading: () => <div className="w-full h-[200px] bg-[#2a2a2a] animate-pulse" />,
});

const GlobalAnimation = dynamic(() => import("@/components/GlobalAnimation"), { ssr: false });

interface HomeClientProps {
  products: any[];
  categories: any[];
  locations: any[];
  inventoryMap: { [key: number]: any[] };
  productFieldsMap: { [key: number]: any };
}

function HomeClient({
  products,
  categories,
  locations,
  inventoryMap,
  productFieldsMap,
}: HomeClientProps) {
  return (
    <div 
      className="bg-[#2a2a2a] overflow-x-hidden w-full max-w-full relative"
      style={{ minHeight: 'calc(100vh - env(safe-area-inset-top, 0px))' }}
    >
      {/* Global Floating Animation Background */}
      <GlobalAnimation />
      
      {/* Hero Section - Animated Luxury */}
      <LuxuryHero />

      {/* Marketplace Mission Statement */}
      <section className="relative py-20 sm:py-28 md:py-32 px-4 sm:px-6 overflow-hidden w-full border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a]/40 via-[#1a1a1a]/35 to-[#1a1a1a]/30 backdrop-blur-sm"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-white mb-8 leading-none tracking-tight">
            Shop Smarter.
          </h2>
          <p className="text-base sm:text-lg md:text-xl font-light text-white/50 leading-relaxed max-w-2xl mx-auto mb-12">
            Compare vendors. Mix and match. Save on bulk. All in one cart.
          </p>
          <Link 
            href="/vendors"
            className="group inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white px-10 py-4 text-xs uppercase tracking-[0.25em] hover:bg-white/15 hover:border-white/30 transition-all duration-300 font-medium"
          >
            <Store size={16} />
            <span>Explore Network</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
      </section>

      {/* Marketplace Features Grid */}
      <section className="relative py-16 overflow-x-hidden w-full border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#3a3a3a]/35 to-[#3a3a3a]/30 backdrop-blur-md"></div>
        <div className="px-4 sm:px-6 mb-12 relative z-10">
          <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider text-white mb-3">
            The Flora Difference
          </h2>
          <div className="h-[1px] w-16 bg-gradient-to-r from-purple-500/60 to-transparent"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px relative z-10">
          <div className="bg-[#3a3a3a]/30 backdrop-blur-md hover:bg-[#404040]/40 transition-all duration-500 p-8 lg:p-10 border border-white/10 hover:border-purple-500/30 group">
            <Store className="w-8 h-8 mb-6 text-purple-400/70 group-hover:text-purple-300 transition-colors" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Only The Real</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              Hand-picked vendors. Every brand verified. No trash, no mids, no excuses.
            </p>
          </div>
          
          <div className="bg-[#3a3a3a]/50 backdrop-blur-lg hover:bg-[#404040]/60 transition-all duration-500 p-8 lg:p-10 border border-white/10 hover:border-rose-500/30 group">
            <Users className="w-8 h-8 mb-6 text-rose-400/70 group-hover:text-rose-300 transition-colors" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">One Cart. All Brands.</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              Mix and match from any vendor. One checkout. One delivery. Zero hassle.
            </p>
          </div>
          
          <div className="bg-[#3a3a3a]/30 backdrop-blur-md hover:bg-[#404040]/40 transition-all duration-500 p-8 lg:p-10 border border-white/10 hover:border-purple-500/30 group">
            <Truck className="w-8 h-8 mb-6 text-purple-400/70 group-hover:text-purple-300 transition-colors" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Fast & Tracked</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              Order by 2PM, ships same day. Next-day for locals. Tracked door to door.
            </p>
          </div>
          
          <div className="bg-[#3a3a3a]/30 backdrop-blur-md hover:bg-[#404040]/40 transition-all duration-500 p-8 lg:p-10 border border-white/10 hover:border-rose-500/30 group">
            <Shield className="w-8 h-8 mb-6 text-rose-400/70 group-hover:text-rose-300 transition-colors" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Lab Verified</h3>
            <p className="text-xs text-white/50 font-light leading-relaxed">
              COAs on everything. Third-party tested. Quality you can trust, every time.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Products - Carousel */}
      <section className="relative py-12 sm:py-16 overflow-x-hidden w-full border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#2a2a2a]/40 to-[#2a2a2a]/35 backdrop-blur-sm"></div>
        <div className="px-4 sm:px-6 mb-8 sm:mb-12 relative z-10">
          <div className="flex justify-between items-center sm:items-end gap-4">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-light uppercase tracking-wider text-white mb-2 sm:mb-3">
                Featured Products
              </h2>
              <div className="h-[1px] w-12 sm:w-16 bg-white/20"></div>
            </div>
            <Link
              href="/products"
              className="text-[11px] sm:text-xs uppercase tracking-wider text-white/60 hover:text-white transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0"
            >
              <span>View All</span>
              <ArrowRight size={12} className="sm:w-3.5 sm:h-3.5" />
            </Link>
          </div>
        </div>

        <div className="relative z-10">
          <ProductsCarousel 
          products={products}
          locations={locations}
          productFieldsMap={productFieldsMap}
          inventoryMap={inventoryMap}
          />
        </div>
      </section>

      {/* Categories - Carousel */}
      <section className="relative py-12 sm:py-16 overflow-x-hidden w-full border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#3a3a3a]/35 to-[#3a3a3a]/30 backdrop-blur-md"></div>
        <div className="px-4 sm:px-6 mb-8 sm:mb-12 relative z-10">
          <div className="flex justify-between items-center sm:items-end gap-4">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-light uppercase tracking-wider text-white mb-2 sm:mb-3">
                Shop by Category
              </h2>
              <div className="h-[1px] w-12 sm:w-16 bg-white/20"></div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <CategoriesCarousel categories={categories} />
        </div>
      </section>

      {/* Value Proposition */}
      <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 overflow-hidden w-full border-b border-white/5">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <div className="flex items-center justify-center mb-6 sm:mb-8">
            <div className="h-[1px] w-12 sm:w-16 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent"></div>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-light text-white mb-4 sm:mb-6 leading-tight tracking-tight">
            Transparent.<br/>Every Step.
          </h2>
          
          <div className="h-[1px] w-16 sm:w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-8 sm:mb-12"></div>
          
          <p className="text-sm sm:text-base md:text-lg lg:text-xl font-light text-white/60 mb-12 sm:mb-16 md:mb-20 leading-relaxed max-w-2xl mx-auto">
            Every vendor vetted. Every product verified. Every detail visible.
          </p>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            <div className="group bg-white/5 backdrop-blur-sm border border-purple-500/20 p-6 sm:p-8 hover:bg-purple-500/5 hover:border-purple-500/40 transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 mb-4 sm:mb-6 mx-auto border border-purple-500/30 rounded-full flex items-center justify-center group-hover:border-purple-400/60 transition-colors duration-500 bg-purple-500/5">
                  <div className="text-lg sm:text-xl text-purple-400">1</div>
                </div>
                <h3 className="text-xs sm:text-sm font-normal mb-3 sm:mb-4 text-white uppercase tracking-[0.2em] sm:tracking-[0.25em]">
                  Rigorous Vetting
                </h3>
                <p className="text-[11px] sm:text-xs font-light text-white/60 leading-relaxed">
                  Every vendor is thoroughly verified. Quality standards. No exceptions.
                </p>
              </div>
            </div>
            
            <div className="group bg-white/5 backdrop-blur-md border border-rose-500/30 p-6 sm:p-8 hover:bg-rose-500/10 hover:border-rose-500/50 transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 mb-4 sm:mb-6 mx-auto border border-rose-500/30 rounded-full flex items-center justify-center group-hover:border-rose-400/60 transition-colors duration-500 bg-rose-500/5">
                  <div className="text-lg sm:text-xl text-rose-400">2</div>
                </div>
                <h3 className="text-xs sm:text-sm font-normal mb-3 sm:mb-4 text-white uppercase tracking-[0.2em] sm:tracking-[0.25em]">
                  Full Transparency
                </h3>
                <p className="text-[11px] sm:text-xs font-light text-white/60 leading-relaxed">
                  See everything. Source, stock, tests. No hidden fees, no surprises.
                </p>
              </div>
            </div>

            <div className="group bg-white/5 backdrop-blur-md border border-purple-500/30 p-6 sm:p-8 hover:bg-purple-500/10 hover:border-purple-500/50 transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 mb-4 sm:mb-6 mx-auto border border-purple-500/30 rounded-full flex items-center justify-center group-hover:border-purple-400/60 transition-colors duration-500 bg-purple-500/5">
                  <div className="text-lg sm:text-xl text-purple-400">3</div>
                </div>
                <h3 className="text-xs sm:text-sm font-normal mb-3 sm:mb-4 text-white uppercase tracking-[0.2em] sm:tracking-[0.25em]">
                  Quality Assured
                </h3>
                <p className="text-[11px] sm:text-xs font-light text-white/60 leading-relaxed">
                  Third-party lab tested. COAs on demand. Quality you can verify.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sustainability Commitment */}
      <section className="relative py-16 overflow-x-hidden w-full border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#2a2a2a]/40 to-[#2a2a2a]/35 backdrop-blur-sm"></div>
        <div className="px-4 sm:px-6 mb-12 relative z-10">
          <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider text-white mb-3">
            How We Protect You
          </h2>
          <div className="h-[1px] w-16 bg-white/20"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px relative z-10">
          <div className="bg-[#2a2a2a]/30 backdrop-blur-md hover:bg-[#303030]/40 transition-all duration-500 p-10 lg:p-12 border border-white/10 hover:border-white/20">
            <Shield className="w-8 h-8 mb-6 text-white/60" />
            <h3 className="text-lg uppercase tracking-[0.2em] text-white mb-6 font-normal">Verified Vendors Only</h3>
            <div className="space-y-3">
              <p className="text-xs text-white/50 font-light">✓ Background checks on all vendors</p>
              <p className="text-xs text-white/50 font-light">✓ License verification required</p>
              <p className="text-xs text-white/50 font-light">✓ Product quality standards enforced</p>
              <p className="text-xs text-white/50 font-light">✓ Customer reviews monitored</p>
            </div>
          </div>

          <div className="bg-[#2a2a2a]/30 backdrop-blur-md hover:bg-[#303030]/40 transition-all duration-500 p-10 lg:p-12 border border-white/10 hover:border-white/20">
            <Package className="w-8 h-8 mb-6 text-white/60" />
            <h3 className="text-lg uppercase tracking-[0.2em] text-white mb-6 font-normal">Your Order Guaranteed</h3>
            <div className="space-y-3">
              <p className="text-xs text-white/50 font-light">✓ Secure encrypted payment processing</p>
              <p className="text-xs text-white/50 font-light">✓ Money-back guarantee on quality issues</p>
              <p className="text-xs text-white/50 font-light">✓ Package tracking from warehouse to door</p>
              <p className="text-xs text-white/50 font-light">✓ Customer support 7 days a week</p>
            </div>
          </div>
        </div>
      </section>

      {/* Locations - Carousel */}
      <section className="relative py-12 sm:py-16 overflow-x-hidden w-full border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#3a3a3a]/35 to-[#3a3a3a]/30 backdrop-blur-md"></div>
        <div className="px-4 sm:px-6 mb-8 sm:mb-12 relative z-10">
          <div className="flex justify-between items-center sm:items-end gap-4">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-light uppercase tracking-wider text-white mb-2 sm:mb-3">
                Fulfillment Locations
              </h2>
              <div className="h-[1px] w-12 sm:w-16 bg-white/20"></div>
            </div>
            <p className="text-[10px] sm:text-xs uppercase tracking-wider text-white/50 whitespace-nowrap flex-shrink-0">
              {locations.filter((loc: any) => {
                const isActive = loc.is_active === "1";
                const isAllowed = !['hamas', 'warehouse'].includes(loc.name.toLowerCase());
                return isActive && isAllowed;
              }).length} Stores
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <LocationsCarousel locations={locations} />
        </div>
      </section>

      {/* Shipping - Split Layout */}
      <section className="relative py-0 overflow-x-hidden w-full border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a]/40 to-[#1a1a1a]/35 backdrop-blur-sm"></div>
        <div className="grid md:grid-cols-2 relative z-10">
          {/* Left - Content */}
          <div className="flex items-center px-4 sm:px-6 md:px-12 py-16 sm:py-20 md:py-32 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10 w-full">
              <div className="mb-6 sm:mb-8">
                <div className="inline-block px-3 sm:px-4 py-1.5 bg-white/5 border border-white/10 text-[9px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-white/60 mb-6 sm:mb-8">
                  Shipping
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light text-white mb-4 sm:mb-6 leading-tight">
                  Get It Fast.
                </h2>
                <p className="text-sm sm:text-base font-light text-white/50 mb-8 sm:mb-12 leading-relaxed">
                  Order by 2PM, ships today. Free shipping over $45. Track your package in real-time.
                </p>
              </div>

              <div className="space-y-4 sm:space-y-6 mb-8 sm:mb-12">
                <div className="flex items-start gap-3 sm:gap-4 group">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 border border-white/20 flex items-center justify-center group-hover:border-white/40 transition-colors duration-300">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-normal text-white uppercase tracking-[0.15em] mb-1">Same-Day Shipping</h3>
                    <p className="text-[11px] sm:text-xs text-white/50 font-light">Order by 2PM EST, ships today from nearest location</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4 group">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 border border-white/20 flex items-center justify-center group-hover:border-white/40 transition-colors duration-300">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-normal text-white uppercase tracking-[0.15em] mb-1">Free Shipping $45+</h3>
                    <p className="text-[11px] sm:text-xs text-white/50 font-light">No minimum hassles. Just spend $45, shipping's on us.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4 group">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0 border border-white/20 flex items-center justify-center group-hover:border-white/40 transition-colors duration-300">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-normal text-white uppercase tracking-[0.15em] mb-1">Track Your Order</h3>
                    <p className="text-[11px] sm:text-xs text-white/50 font-light">Real-time updates from warehouse to your door</p>
                  </div>
                </div>
              </div>

              <Link
                href="/shipping"
                className="group inline-flex items-center gap-2 sm:gap-3 text-white text-[10px] sm:text-xs uppercase tracking-[0.2em] hover:text-white/80 transition-colors duration-300"
              >
                <span>View Shipping Policy</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </div>
          </div>

          {/* Right - Visual */}
          <div className="relative bg-gradient-to-br from-[#2a2a2a] via-[#252525] to-[#1f1f1f] min-h-[400px] md:min-h-[600px] flex items-center justify-center overflow-hidden">
            <div className="relative z-10 text-center">
              <div className="relative w-40 h-40 mx-auto mb-8">
                <div className="absolute inset-0 border border-white/10 rounded-full animate-ping" style={{ animationDuration: "3s" }}></div>
                <div className="absolute inset-0 border border-white/10 rounded-full animate-ping" style={{ animationDuration: "3s", animationDelay: "1s" }}></div>
                
                <div className="absolute inset-0 border-2 border-white/20 rounded-full flex items-center justify-center backdrop-blur-sm bg-white/5">
                  <div className="relative">
                    <svg className="w-20 h-20 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40 font-light">Coordinated fulfillment</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-white/20"></div>
                  <p className="text-sm tracking-[0.25em] text-white/60 font-medium">2PM EST</p>
                  <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-white/20"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vendor Partnership CTA */}
      <section className="relative py-20 sm:py-28 px-4 sm:px-6 overflow-hidden w-full border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#2a2a2a]/40 to-[#2a2a2a]/35 backdrop-blur-sm"></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 mb-6">
                <Users size={14} className="text-white/60" />
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">For Vendors</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-6 leading-tight">
                Sell on Flora
              </h2>
              <p className="text-sm sm:text-base font-light text-white/50 leading-relaxed mb-8">
                Reach thousands of customers. We handle the platform, payments, and logistics. You focus on quality.
              </p>
              <Link 
                href="/vendor/dashboard"
                className="group inline-flex items-center gap-3 bg-white text-black px-8 py-4 text-xs uppercase tracking-[0.2em] hover:bg-white/90 transition-all duration-300 font-medium"
              >
                <span>Become a Vendor</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 group">
                <CheckCircle size={20} className="text-white/60 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm uppercase tracking-wider text-white mb-1 font-normal">Instant Reach</h4>
                  <p className="text-xs text-white/50 font-light">List your products, reach customers immediately</p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <CheckCircle size={20} className="text-white/60 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm uppercase tracking-wider text-white mb-1 font-normal">Get Paid Fast</h4>
                  <p className="text-xs text-white/50 font-light">Weekly payouts. No waiting 30+ days for your money</p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <CheckCircle size={20} className="text-white/60 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm uppercase tracking-wider text-white mb-1 font-normal">We Handle Shipping</h4>
                  <p className="text-xs text-white/50 font-light">No dealing with carriers. We coordinate all deliveries</p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <CheckCircle size={20} className="text-white/60 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm uppercase tracking-wider text-white mb-1 font-normal">Zero Upfront Costs</h4>
                  <p className="text-xs text-white/50 font-light">No listing fees. No monthly fees. Just a small cut when you sell</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logo Mark */}
      <section className="relative py-12 sm:py-16 md:py-20 px-4 overflow-x-hidden w-full border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a]/40 to-[#1a1a1a]/35 backdrop-blur-sm"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center justify-center">
            <img 
              src="/logoprint.png" 
              alt="Flora Distro Marketplace" 
              className="h-16 sm:h-20 md:h-24 w-auto opacity-30 grayscale"
            />
          </div>
        </div>
      </section>

      {/* Final CTA - Dramatic */}
      <section className="relative py-20 sm:py-28 md:py-40 px-4 sm:px-6 overflow-hidden w-full">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a2a]/40 via-[#1f1f1f]/45 to-[#2a2a2a]/40 backdrop-blur-sm"></div>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-light text-white mb-6 sm:mb-8 leading-none tracking-tight">
              Start Shopping
            </h2>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-light text-white/40 max-w-2xl mx-auto leading-relaxed">
              Browse products. Compare vendors. Save on volume. Free shipping over $45.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-12 sm:mb-16">
            <Link
              href="/register"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 bg-white text-black px-10 sm:px-12 md:px-16 py-3.5 sm:py-4 md:py-5 text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em] hover:bg-white/90 transition-all duration-300 font-medium"
            >
              <span>Create Account</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
            <Link
              href="/login"
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 bg-transparent border border-white/30 text-white px-10 sm:px-12 md:px-16 py-3.5 sm:py-4 md:py-5 text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em] hover:bg-white/5 hover:border-white/50 transition-all duration-300 font-medium"
            >
              <span>Sign In</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>

          <div className="text-center">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-white/30">
              Or browse as guest
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export default memo(HomeClient);

