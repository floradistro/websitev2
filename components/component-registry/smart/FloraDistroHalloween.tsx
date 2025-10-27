
"use client";

import React, { useEffect, useState } from 'react';
import { SmartComponentWrapper, SmartComponentBaseProps } from '@/lib/smart-component-base';

export interface FloraDistroHalloweenProps extends SmartComponentBaseProps {
  heroHeadline?: string;
  heroSubheadline?: string;
  featuredTitle?: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
}

export function FloraDistroHalloween({ vendorId, ...props }: FloraDistroHalloweenProps) {
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [featuredProducts, setFeaturedProducts] = useState(null);
  
  useEffect(() => {
    fetch('/api/products/halloween-specials')
      .then(res => res.json())
      .then(data => {
        setFeaturedProducts(data);
      })
      .catch(() => {
        // Mock data for testing - set empty data to prevent null errors
        setFeaturedProducts({});
      });
  }, [vendorId]);

  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    fetch('/api/user/context')
      .then(res => res.json())
      .then(data => {
        setUser(data);
      })
      .catch(() => {
        // Mock data for testing - set empty data to prevent null errors
        setUser({ device: "desktop", cartAbandoned: false });
      });
  }, [vendorId]);
  
  // Check if data is loaded
  const dataLoaded = featuredProducts !== null && user !== null;
  
  useEffect(() => {
    if (dataLoaded) {
      setLoading(false);
    }
  }, [dataLoaded]);
  
  
  
  // Quantum state management
  const [activeState, setActiveState] = useState('FirstTimeVisitor');
  
  useEffect(() => {
    // Evaluate conditions and collapse quantum state
    
    if (user?.visits == 1) {
      setActiveState('FirstTimeVisitor');
    } else 
    if (user?.visits > 1 && !user?.cartAbandoned) {
      setActiveState('ReturningCustomer');
    } else 
    if (user?.cartAbandoned) {
      setActiveState('CartAbandoned');
    }
  }, [props]);
  
  
  return (
    <SmartComponentWrapper 
      componentName="FloraDistroHalloween"
      loading={loading}
      error={error}
    >
      
      <>
        
      {activeState === 'FirstTimeVisitor' && dataLoaded && (
        <div className="bg-black min-h-screen">
          {/* Hero Section */}
          <section className="relative overflow-hidden bg-gradient-to-b from-orange-950/30 via-purple-950/20 to-black border-b border-orange-500/10">
            <div className="absolute inset-0 bg-[url('/patterns/spiderweb.svg')] opacity-5"></div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-32 lg:py-40">
              <div className="text-center">
                <div className="inline-block mb-4 sm:mb-6 px-4 sm:px-6 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full">
                  <span className="text-orange-400 text-xs sm:text-sm font-black uppercase tracking-wider">🎃 New Customer Special - 25% Off</span>
                </div>
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-white mb-4 sm:mb-6 leading-none">
                  {props.heroHeadline}
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl text-white/60 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed">
                  {props.heroSubheadline}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-500 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black uppercase text-sm sm:text-base tracking-wide hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg shadow-orange-500/20">
                    {props.ctaPrimary || "Get Started"} - 25% OFF
                  </button>
                  <button className="w-full sm:w-auto bg-white/5 border border-white/10 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black uppercase text-sm sm:text-base tracking-wide hover:bg-white/10 transition-all">
                    Browse Collection
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Featured Products */}
          <section className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-black via-purple-950/10 to-black">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12 sm:mb-16 md:mb-20">
                <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter text-white mb-4 sm:mb-6">
                  {props.featuredTitle}
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-white/40 max-w-2xl mx-auto">
                  Limited-edition strains curated for the haunting season
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {featuredProducts.map(product => (
                  <div key={product.id} className="group bg-gradient-to-br from-orange-950/20 via-purple-950/20 to-black border border-orange-500/20 rounded-3xl p-6 sm:p-8 hover:border-orange-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10">
                    <div className="aspect-square bg-black/50 rounded-2xl mb-6 overflow-hidden border border-white/5">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    
                    <div className="mb-4">
                      <span className="inline-block px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-xs font-black uppercase tracking-wide mb-3">
                        {product.strain_type}
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-black uppercase text-white mb-2 tracking-tight">
                        {product.name}
                      </h3>
                      <p className="text-sm sm:text-base text-white/40 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-black/50 border border-white/5 rounded-xl p-3">
                        <div className="text-xs text-white/40 uppercase tracking-wider mb-1">THC</div>
                        <div className="text-lg sm:text-xl font-black text-orange-400">{product.thc_percentage}%</div>
                      </div>
                      <div className="bg-black/50 border border-white/5 rounded-xl p-3">
                        <div className="text-xs text-white/40 uppercase tracking-wider mb-1">CBD</div>
                        <div className="text-lg sm:text-xl font-black text-purple-400">{product.cbd_percentage}%</div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Effects</div>
                      <div className="flex flex-wrap gap-2">
                        {product.effects.map(effect => (
                          <span key={effect} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/60 text-xs">
                            {effect}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Dominant Terpenes</div>
                      <div className="text-sm text-white/60">
                        {product.terpenes.join(", ")}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      <div>
                        <div className="text-3xl sm:text-4xl font-black text-white">${product.price}</div>
                        <div className="text-xs text-white/40">per 3.5g</div>
                      </div>
                      <button className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-3 rounded-xl font-black uppercase text-xs sm:text-sm tracking-wide hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg shadow-orange-500/20">
                        {props.ctaSecondary || "Learn More"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Trust Bar */}
          <section className="py-12 sm:py-16 px-4 sm:px-6 md:px-8 bg-gradient-to-r from-orange-950/20 via-purple-950/20 to-orange-950/20 border-y border-orange-500/10">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-black text-orange-400 mb-2">21+</div>
                  <div className="text-sm sm:text-base text-white/60 uppercase tracking-wide">Age Verified</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-black text-purple-400 mb-2">Lab</div>
                  <div className="text-sm sm:text-base text-white/60 uppercase tracking-wide">Tested & Certified</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-black text-orange-400 mb-2">🎃</div>
                  <div className="text-sm sm:text-base text-white/60 uppercase tracking-wide">Halloween Exclusive</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-black text-purple-400 mb-2">24h</div>
                  <div className="text-sm sm:text-base text-white/60 uppercase tracking-wide">Discreet Delivery</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeState === 'ReturningCustomer' && dataLoaded && (
        <div className="bg-black min-h-screen">
          {/* Hero Section - Returning */}
          <section className="relative overflow-hidden bg-gradient-to-b from-purple-950/30 via-orange-950/20 to-black border-b border-purple-500/10">
            <div className="absolute inset-0 bg-[url('/patterns/spiderweb.svg')] opacity-5"></div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-32 lg:py-40">
              <div className="text-center">
                <div className="inline-block mb-4 sm:mb-6 px-4 sm:px-6 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
                  <span className="text-purple-400 text-xs sm:text-sm font-black uppercase tracking-wider">👻 Welcome Back, Creature of the Night</span>
                </div>
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-white mb-4 sm:mb-6 leading-none">
                  MORE TREATS AWAIT
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl text-white/60 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed">
                  Your refined taste returns. Discover new haunting flavors added just for you.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-500 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black uppercase text-sm sm:text-base tracking-wide hover:from-purple-500 hover:to-purple-400 transition-all shadow-lg shadow-purple-500/20">
                    View Your Favorites
                  </button>
                  <button className="w-full sm:w-auto bg-white/5 border border-white/10 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black uppercase text-sm sm:text-base tracking-wide hover:bg-white/10 transition-all">
                    What's New
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Featured Products */}
          <section className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-black via-purple-950/10 to-black">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12 sm:mb-16 md:mb-20">
                <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter text-white mb-4 sm:mb-6">
                  {props.featuredTitle}
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-white/40 max-w-2xl mx-auto">
                  Limited-edition strains curated for the haunting season
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {featuredProducts.map(product => (
                  <div key={product.id} className="group bg-gradient-to-br from-orange-950/20 via-purple-950/20 to-black border border-orange-500/20 rounded-3xl p-6 sm:p-8 hover:border-orange-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10">
                    <div className="aspect-square bg-black/50 rounded-2xl mb-6 overflow-hidden border border-white/5">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    
                    <div className="mb-4">
                      <span className="inline-block px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-xs font-black uppercase tracking-wide mb-3">
                        {product.strain_type}
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-black uppercase text-white mb-2 tracking-tight">
                        {product.name}
                      </h3>
                      <p className="text-sm sm:text-base text-white/40 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-black/50 border border-white/5 rounded-xl p-3">
                        <div className="text-xs text-white/40 uppercase tracking-wider mb-1">THC</div>
                        <div className="text-lg sm:text-xl font-black text-orange-400">{product.thc_percentage}%</div>
                      </div>
                      <div className="bg-black/50 border border-white/5 rounded-xl p-3">
                        <div className="text-xs text-white/40 uppercase tracking-wider mb-1">CBD</div>
                        <div className="text-lg sm:text-xl font-black text-purple-400">{product.cbd_percentage}%</div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Effects</div>
                      <div className="flex flex-wrap gap-2">
                        {product.effects.map(effect => (
                          <span key={effect} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/60 text-xs">
                            {effect}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Dominant Terpenes</div>
                      <div className="text-sm text-white/60">
                        {product.terpenes.join(", ")}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      <div>
                        <div className="text-3xl sm:text-4xl font-black text-white">${product.price}</div>
                        <div className="text-xs text-white/40">per 3.5g</div>
                      </div>
                      <button className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-3 rounded-xl font-black uppercase text-xs sm:text-sm tracking-wide hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg shadow-orange-500/20">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Trust Bar */}
          <section className="py-12 sm:py-16 px-4 sm:px-6 md:px-8 bg-gradient-to-r from-orange-950/20 via-purple-950/20 to-orange-950/20 border-y border-orange-500/10">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-black text-orange-400 mb-2">21+</div>
                  <div className="text-sm sm:text-base text-white/60 uppercase tracking-wide">Age Verified</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-black text-purple-400 mb-2">Lab</div>
                  <div className="text-sm sm:text-base text-white/60 uppercase tracking-wide">Tested & Certified</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-black text-orange-400 mb-2">🎃</div>
                  <div className="text-sm sm:text-base text-white/60 uppercase tracking-wide">Halloween Exclusive</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-black text-purple-400 mb-2">24h</div>
                  <div className="text-sm sm:text-base text-white/60 uppercase tracking-wide">Discreet Delivery</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeState === 'CartAbandoned' && dataLoaded && (
        <div className="bg-black min-h-screen">
          {/* Hero Section - Urgency */}
          <section className="relative overflow-hidden bg-gradient-to-b from-red-950/30 via-orange-950/20 to-black border-b border-red-500/20">
            <div className="absolute inset-0 bg-[url('/patterns/spiderweb.svg')] opacity-5"></div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-24 md:py-32 lg:py-40">
              <div className="text-center">
                <div className="inline-block mb-4 sm:mb-6 px-4 sm:px-6 py-2 bg-red-500/20 border border-red-500/30 rounded-full animate-pulse">
                  <span className="text-red-400 text-xs sm:text-sm font-black uppercase tracking-wider">⚡ Your Cart Expires Soon - 15% OFF</span>
                </div>
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-white mb-4 sm:mb-6 leading-none">
                  DON'T MISS OUT
                </h1>
                <p className="text-lg sm:text-xl md:text-2xl text-white/60 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed">
                  Your Halloween treats are waiting. Complete your order in the next 30 minutes and save 15%.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-500 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black uppercase text-sm sm:text-base tracking-wide hover:from-red-500 hover:to-red-400 transition-all shadow-lg shadow-red-500/20 animate-pulse">
                    Complete Order - Save 15%
                  </button>
                  <button className="w-full sm:w-auto bg-white/5 border border-white/10 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black uppercase text-sm sm:text-base tracking-wide hover:bg-white/10 transition-all">
                    View Cart
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Featured Products */}
          <section className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-black via-purple-950/10 to-black">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12 sm:mb-16 md:mb-20">
                <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter text-white mb-4 sm:mb-6">
                  {props.featuredTitle}
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-white/40 max-w-2xl mx-auto">
                  Limited-edition strains curated for the haunting season
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {featuredProducts.map(product => (
                  <div key={product.id} className="group bg-gradient-to-br from-orange-950/20 via-purple-950/20 to-black border border-orange-500/20 rounded-3xl p-6 sm:p-8 hover:border-orange-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/10">
                    <div className="aspect-square bg-black/50 rounded-2xl mb-6 overflow-hidden border border-white/5">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    
                    <div className="mb-4">
                      <span className="inline-block px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300 text-xs font-black uppercase tracking-wide mb-3">
                        {product.strain_type}
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-black uppercase text-white mb-2 tracking-tight">
                        {product.name}
                      </h3>
                      <p className="text-sm sm:text-base text-white/40 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-black/50 border border-white/5 rounded-xl p-3">
                        <div className="text-xs text-white/40 uppercase tracking-wider mb-1">THC</div>
                        <div className="text-lg sm:text-xl font-black text-orange-400">{product.thc_percentage}%</div>
                      </div>
                      <div className="bg-black/50 border border-white/5 rounded-xl p-3">
                        <div className="text-xs text-white/40 uppercase tracking-wider mb-1">CBD</div>
                        <div className="text-lg sm:text-xl font-black text-purple-400">{product.cbd_percentage}%</div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Effects</div>
                      <div className="flex flex-wrap gap-2">
                        {product.effects.map(effect => (
                          <span key={effect} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/60 text-xs">
                            {effect}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Dominant Terpenes</div>
                      <div className="text-sm text-white/60">
                        {product.terpenes.join(", ")}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      <div>
                        <div className="text-3xl sm:text-4xl font-black text-white">${product.price}</div>
                        <div className="text-xs text-white/40">per 3.5g</div>
                      </div>
                      <button className="bg-gradient-to-r from-orange-600 to-orange-500 text-white px-6 py-3 rounded-xl font-black uppercase text-xs sm:text-sm tracking-wide hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg shadow-orange-500/20">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Trust Bar */}
          <section className="py-12 sm:py-16 px-4 sm:px-6 md:px-8 bg-gradient-to-r from-orange-950/20 via-purple-950/20 to-orange-950/20 border-y border-orange-500/10">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-black text-orange-400 mb-2">21+</div>
                  <div className="text-sm sm:text-base text-white/60 uppercase tracking-wide">Age Verified</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-black text-purple-400 mb-2">Lab</div>
                  <div className="text-sm sm:text-base text-white/60 uppercase tracking-wide">Tested & Certified</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-black text-orange-400 mb-2">🎃</div>
                  <div className="text-sm sm:text-base text-white/60 uppercase tracking-wide">Halloween Exclusive</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-black text-purple-400 mb-2">24h</div>
                  <div className="text-sm sm:text-base text-white/60 uppercase tracking-wide">Discreet Delivery</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
      </>
    
    </SmartComponentWrapper>
  );
}
