"use client";

import { memo, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LiveEditingProvider, useLiveEditing } from './LiveEditingProvider';
import { LiveEditableStorefront } from './LiveEditableStorefront';
import { ArrowRight, Store, Truck, Shield, Package, Leaf, Award, Users, FlaskConical, CheckCircle, Star, MapPin, Phone, Clock, Sparkles } from "lucide-react";
import { VendorStorefront } from "@/lib/storefront/get-vendor";
// import ProductsCarousel from "@/components/ProductsCarousel";
import dynamic from "next/dynamic";
import WaveBackground from "@/components/storefront/WaveBackground";
import HeroAnimation from "@/components/storefront/HeroAnimation";

const FlowerAnimation = dynamic(() => import("@/components/storefront/FlowerAnimation"), {
  ssr: false,
  loading: () => null
});

interface StorefrontHomeClientProps {
  vendor: VendorStorefront;
  products: any[];
  inventoryMap: { [key: number]: any[] };
  productFieldsMap: { [key: number]: any };
  locations?: any[];
  reviews?: any[];
}

export function StorefrontHomeClient({
  vendor,
  products,
  inventoryMap,
  productFieldsMap,
  locations = [],
  reviews = [],
}: StorefrontHomeClientProps) {
  const pathname = usePathname();
  const { sections: liveSections, isLiveEditMode } = useLiveEditing();
  const [localSections, setLocalSections] = useState(liveSections);
  
  // Determine base path based on current path
  const basePath = pathname?.startsWith('/storefront') ? '/storefront' : '';
  
  // Update local sections when live sections change
  useEffect(() => {
    if (isLiveEditMode && liveSections.length > 0) {
      console.log('🔄 Live sections updated:', liveSections.length);
      setLocalSections(liveSections);
    }
  }, [liveSections, isLiveEditMode]);
  
  // Organize live sections if in edit mode
  const liveContentMap = isLiveEditMode && localSections.length > 0
    ? localSections.reduce((acc: any, section: any) => {
        acc[section.section_key] = section.content_data;
        return acc;
      }, {})
    : {};
  
  // Debug logging
  useEffect(() => {
    if (isLiveEditMode) {
      console.log('🎨 StorefrontHomeClient in LIVE EDIT MODE');
      console.log('📊 Live sections count:', localSections.length);
      console.log('🗂️ Live content map:', liveContentMap);
      if (liveContentMap.hero) {
        console.log('🎯 Hero headline:', liveContentMap.hero.headline);
      }
    }
  }, [isLiveEditMode, localSections, liveContentMap]);
  
  // Sample data for template (uses live content if available)
  const sampleData = {
    hero: liveContentMap.hero || {
      headline: "Fresh. Fast. Fire.",
      subheadline: "Same day shipping before 2PM. Regional delivery hits next day.",
      ctaPrimary: "Shop now",
      ctaSecondary: "Our story"
    },
    brandStory: [
      {
        title: "Cultivated",
        description: "Small-batch grows. Sustainable practices. Every plant receives individual attention.",
        icon: Leaf
      },
      {
        title: "Verified",
        description: "Third-party lab testing. Complete transparency. No compromises on safety.",
        icon: FlaskConical
      },
      {
        title: "Delivered",
        description: "Fast shipping. Discreet packaging. Your privacy is our priority.",
        icon: Shield
      }
    ],
    stats: [
      { number: "15K+", label: "Customers" },
      { number: "99.9%", label: "Purity" },
      { number: "100%", label: "Tested" },
      { number: "<48h", label: "Shipping" }
    ]
  };
  
  // Format real reviews for display
  const displayReviews = reviews.length > 0 
    ? reviews.map((review: any) => ({
        name: review.customer 
          ? `${review.customer.first_name} ${review.customer.last_name?.charAt(0)}.`
          : 'Anonymous',
        rating: review.rating,
        quote: review.review_text || review.title || '',
        product: review.product?.name || '',
        verified: review.verified_purchase,
        date: review.created_at
      }))
    : [
        {
          name: "Sarah M.",
          rating: 5,
          quote: "The quality is exceptional. Finally found a brand I trust completely.",
          product: "Blue Dream",
          verified: true
        },
        {
          name: "Michael R.",
          rating: 5,
          quote: "Clean, consistent, reliable. Everything I look for in a cannabis brand.",
          product: "OG Kush",
          verified: true
        },
        {
          name: "Jessica L.",
          rating: 5,
          quote: "From ordering to delivery, the entire experience is seamless.",
          product: "Purple Haze",
          verified: true
        }
      ];
  
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* UHD Gradient Background - iOS 26 */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-black to-[#141414]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-neutral-950/50 via-transparent to-neutral-900/50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,black_100%)]" />
        {/* iOS 26 animated wave shapes */}
        <WaveBackground />
      </div>
      
      {/* Scattered Color Orbs - Maximum Spacing */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Red orbs - Extreme corners only */}
        <div className="absolute top-[3%] left-[2%] w-[80px] h-[80px] md:w-[280px] md:h-[280px] bg-red-500/[0.20] rounded-full blur-[25px] md:blur-[45px] animate-pulse" style={{ animationDuration: '9s' }} />
        <div className="absolute bottom-[3%] right-[2%] w-[75px] h-[75px] md:w-[260px] md:h-[260px] bg-red-500/[0.18] rounded-full blur-[24px] md:blur-[42px] animate-pulse" style={{ animationDuration: '11s', animationDelay: '3s' }} />
        
        {/* Blue orbs - Opposite extreme corners */}
        <div className="absolute top-[5%] right-[2%] w-[78px] h-[78px] md:w-[270px] md:h-[270px] bg-blue-500/[0.19] rounded-full blur-[25px] md:blur-[44px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
        <div className="absolute bottom-[5%] left-[2%] w-[72px] h-[72px] md:w-[250px] md:h-[250px] bg-blue-500/[0.17] rounded-full blur-[24px] md:blur-[43px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '5s' }} />
        
        {/* Yellow orbs - Far from others, more subtle */}
        <div className="absolute top-[35%] right-[75%] w-[85px] h-[85px] md:w-[290px] md:h-[290px] bg-yellow-500/[0.10] rounded-full blur-[26px] md:blur-[46px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }} />
        <div className="absolute bottom-[35%] right-[15%] w-[76px] h-[76px] md:w-[265px] md:h-[265px] bg-yellow-500/[0.08] rounded-full blur-[25px] md:blur-[44px] animate-pulse" style={{ animationDuration: '13s', animationDelay: '4s' }} />
      </div>
      
      {/* Hero Section - iOS 26 Dark with Animated Background */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-6 -mt-[72px] pt-[72px] overflow-hidden">
        {/* Animated Canvas Background */}
        <HeroAnimation />
        
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h1 className="text-7xl sm:text-8xl md:text-[120px] font-bold text-white mb-8 leading-[0.95] tracking-[-0.04em] uppercase animate-fadeIn">
            {sampleData.hero.headline}
          </h1>
          
          <p className="text-lg sm:text-xl text-neutral-400 leading-relaxed mb-12 max-w-xl mx-auto font-medium tracking-wide animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            {sampleData.hero.subheadline}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            <Link 
              href={`${basePath}/shop`}
              className="inline-flex items-center gap-3 bg-white text-black px-10 py-5 rounded-full text-base font-bold uppercase tracking-wider hover:bg-neutral-100 transition-all duration-300 group shadow-2xl shadow-white/20 hover:shadow-white/30 hover:scale-105"
            >
              <span>{sampleData.hero.ctaPrimary}</span>
              <ArrowRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              href={`${basePath}/about`}
              className="inline-flex items-center gap-2.5 bg-transparent border-2 border-white text-white hover:bg-white hover:text-black px-10 py-5 rounded-full text-base font-bold uppercase tracking-wider transition-all duration-300 hover:scale-105"
            >
              <span>{sampleData.hero.ctaSecondary}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Delivery - iOS 26 Dark */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 bg-black/65 backdrop-blur-xl" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-light text-white mb-3 tracking-[-0.02em]">
            Order before 2PM.<br/>Delivered same day.
          </h2>
          <p className="text-xl text-neutral-500 mb-20 font-light">
            Farm to your door.
          </p>
          
            <div className="flex flex-wrap md:flex-nowrap items-center justify-center gap-3">
              <div className="flex-1 min-w-[140px] bg-transparent border-2 border-white rounded-full px-6 py-8 hover:bg-white hover:text-black transition-all duration-300 hover:scale-105 group flex flex-col items-center justify-center">
                <Leaf className="w-8 h-8 text-white group-hover:text-black mb-3 transition-colors" strokeWidth={2.5} />
                <div className="text-xs text-white group-hover:text-black font-bold uppercase tracking-wider transition-colors">Cultivated</div>
              </div>
              
              <ArrowRight className="hidden md:block w-5 h-5 text-white/30 flex-shrink-0" strokeWidth={2} />
              
              <div className="flex-1 min-w-[140px] bg-transparent border-2 border-white rounded-full px-6 py-8 hover:bg-white hover:text-black transition-all duration-300 hover:scale-105 group flex flex-col items-center justify-center">
                <FlaskConical className="w-8 h-8 text-white group-hover:text-black mb-3 transition-colors" strokeWidth={2.5} />
                <div className="text-xs text-white group-hover:text-black font-bold uppercase tracking-wider transition-colors">Tested</div>
              </div>
              
              <ArrowRight className="hidden md:block w-5 h-5 text-white/30 flex-shrink-0" strokeWidth={2} />
              
              <div className="flex-1 min-w-[140px] bg-transparent border-2 border-white rounded-full px-6 py-8 hover:bg-white hover:text-black transition-all duration-300 hover:scale-105 group flex flex-col items-center justify-center">
                <Package className="w-8 h-8 text-white group-hover:text-black mb-3 transition-colors" strokeWidth={2.5} />
                <div className="text-xs text-white group-hover:text-black font-bold uppercase tracking-wider transition-colors">Packed</div>
              </div>
              
              <ArrowRight className="hidden md:block w-5 h-5 text-white/30 flex-shrink-0" strokeWidth={2} />
              
              <div className="flex-1 min-w-[140px] bg-transparent border-2 border-white rounded-full px-6 py-8 hover:bg-white hover:text-black transition-all duration-300 hover:scale-105 group flex flex-col items-center justify-center">
                <Truck className="w-8 h-8 text-white group-hover:text-black mb-3 transition-colors" strokeWidth={2.5} />
                <div className="text-xs text-white group-hover:text-black font-bold uppercase tracking-wider transition-colors">Delivered</div>
              </div>
          </div>
        </div>
      </section>

      {/* Locations - iOS 26 Dark */}
      {locations && locations.length > 0 && (
        <section className="py-24 px-6 relative">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="mb-16 text-center">
              <h2 className="text-4xl md:text-6xl font-light text-white mb-4 tracking-[-0.02em]">
                Visit us in person
              </h2>
              <p className="text-xl text-neutral-400 font-light">
                {locations.filter((l: any) => l.type === 'retail').length} locations across North Carolina
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {locations
                .filter((location: any) => location.type === 'retail')
                .map((location: any, idx: number) => {
                  const fullAddress = `${location.address_line1}, ${location.city}, ${location.state} ${location.zip}`;
                  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
                  
                  return (
                    <div
                      key={location.id}
                      className="group bg-black/80 backdrop-blur-xl hover:bg-black/90 rounded-[32px] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-white/10 hover:-translate-y-1"
                    >
                      {/* Logo Header */}
                      <div className="aspect-[4/3] bg-black/20 flex items-center justify-center p-8 border-b border-white/10 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
                        {vendor.logo_url ? (
                          <img 
                            src={vendor.logo_url} 
                            alt={vendor.store_name}
                            className="w-full h-full object-contain opacity-40 group-hover:opacity-60 transition-all duration-700 relative z-10"
                          />
                        ) : (
                          <div className="text-4xl font-light text-white/20">{vendor.store_name[0]}</div>
                        )}
                      </div>
                      
                      {/* Location Info */}
                      <div className="p-8">
                        <div className="flex items-start gap-3 mb-6">
                          <div className="w-10 h-10 rounded-[16px] bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-1.5 tracking-tight">
                              {location.name}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-neutral-500">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Open daily</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-sm text-neutral-400 mb-6 font-light">
                          <div>{location.address_line1}</div>
                          <div>{location.city}, {location.state} {location.zip}</div>
                        </div>

                        {location.phone && (
                          <div className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
                            <Phone className="w-4 h-4" />
                            <span>{location.phone}</span>
                          </div>
                        )}

                        {/* Action Badges */}
                        <div className="flex gap-2 mb-6">
                          <div className="flex-1 bg-white/5 border border-white/20 rounded-full px-3 py-2 flex items-center justify-center gap-1.5">
                            <Store className="w-3.5 h-3.5 text-white" />
                            <span className="text-xs text-white font-medium">Pickup</span>
                          </div>
                          <div className="flex-1 bg-white/5 border border-white/20 rounded-full px-3 py-2 flex items-center justify-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-white" />
                            <span className="text-xs text-white font-medium">Delivery</span>
                          </div>
                        </div>

                        <a
                          href={mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-white font-semibold group-hover:gap-3 transition-all"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span>Get directions</span>
                          <ArrowRight className="w-4 h-4 transition-transform" />
                        </a>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Shipping Options Below */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 pt-12 border-t border-white/10">
              <div className="flex items-center gap-4 bg-transparent border-2 border-white rounded-full px-8 py-5 hover:bg-white hover:text-black transition-all duration-300 hover:scale-105 group">
                <Truck className="w-6 h-6 text-white group-hover:text-black transition-colors" strokeWidth={2.5} />
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white group-hover:text-black tracking-wider uppercase transition-colors">Same-day ship</h3>
                  <p className="text-xs text-neutral-400 group-hover:text-black/70 font-medium transition-colors">Before 2PM. Ships today.</p>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-transparent border-2 border-white rounded-full px-8 py-5 hover:bg-white hover:text-black transition-all duration-300 hover:scale-105 group">
                <Store className="w-6 h-6 text-white group-hover:text-black transition-colors" strokeWidth={2.5} />
                <div className="flex-1">
                  <h3 className="text-base font-bold text-white group-hover:text-black tracking-wider uppercase transition-colors">Pickup ready</h3>
                  <p className="text-xs text-neutral-400 group-hover:text-black/70 font-medium transition-colors">Order online. Grab today.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {products.length > 0 && (
        <section className="py-24 px-0 sm:px-6 relative">
          <div className="absolute inset-0 bg-black/65 backdrop-blur-xl" />
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex items-center justify-between mb-12 px-6 sm:px-0">
              <h2 className="text-4xl md:text-5xl font-light text-white tracking-[-0.02em]">
                Featured
              </h2>
              <Link
                href={`${basePath}/shop`}
                className="inline-flex items-center gap-2 text-base text-neutral-400 hover:text-white transition-colors font-semibold"
              >
                View all
                <ArrowRight size={18} />
              </Link>
            </div>

            <div className="py-8 overflow-visible">
              
            </div>
          </div>
        </section>
      )}

      {/* Testimonials - Real Reviews Carousel - iOS 26 Dark */}
      {displayReviews.length > 0 && (
        <section className="py-24 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-4xl md:text-5xl font-light text-white tracking-[-0.02em]">
                Reviews
              </h2>
              {reviews.length > 0 && (
                <p className="text-neutral-500 text-sm font-light">
                  {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            
            <div className="overflow-x-auto overflow-y-visible scrollbar-hide -mx-6 px-6">
              <div className="flex gap-4 pb-4">
                {displayReviews.map((review, idx) => (
                  <div 
                    key={idx} 
                    className="flex-shrink-0 w-[85vw] sm:w-[60vw] md:w-[45vw] lg:w-[32vw] bg-black/80 backdrop-blur-xl rounded-[32px] p-8 hover:bg-black/90 hover:shadow-2xl hover:shadow-white/10 transition-all duration-300"
                  >
                    <div className="flex items-center gap-1.5 mb-5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-white text-white' : 'fill-none text-white/20'}`} 
                        />
                      ))}
                      {review.verified && (
                        <CheckCircle className="w-3.5 h-3.5 text-white/40 ml-1" />
                      )}
                    </div>
                    <p className="text-sm text-white/90 leading-relaxed mb-6 font-light line-clamp-4">
                      "{review.quote}"
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="text-sm text-white font-medium">{review.name}</div>
                      {review.product && (
                        <div className="text-xs text-neutral-500">{review.product}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* About - iOS 26 Dark with Flower Animation */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/65 backdrop-blur-xl" />
        {/* Flower Animation Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 z-[5]">
          <FlowerAnimation />
        </div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-light text-white mb-12 tracking-[-0.02em]">
            Farm fresh.<br/>
            Hand selected. Never stale.
          </h2>
          
          <div className="space-y-6 text-lg text-neutral-400 leading-relaxed font-light max-w-2xl mx-auto mb-12">
            <p>
              We source nationwide from the best cultivators. Every strain hand-selected and curated.
            </p>
            <p>
              Direct from farm. No distributors. No compromise on quality.
            </p>
            <p>
              Five locations. Order online. Pick up same day.
            </p>
          </div>
          
          <Link
            href={`${basePath}/about`}
            className="inline-flex items-center gap-2 text-base text-white/60 hover:text-white font-light hover:gap-3 transition-all"
          >
            Learn more
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}

