
"use client";

import React, { useEffect, useState } from 'react';
import { SmartComponentWrapper, SmartComponentBaseProps } from '@/lib/smart-component-base';

export interface FloraDistroHalloweenHomepageProps extends SmartComponentBaseProps {
  heroHeadline?: string;
  heroSubheadline?: string;
  featuredTitle?: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
}

export function FloraDistroHalloweenHomepage({ vendorId, ...props }: FloraDistroHalloweenHomepageProps) {
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [featuredProducts, setFeaturedProducts] = useState(null);
  
  useEffect(() => {
    fetch('/api/products/halloween-featured')
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
      componentName="FloraDistroHalloweenHomepage"
      loading={loading}
      error={error}
    >
      
      <>
        
      {activeState === 'FirstTimeVisitor' && dataLoaded && (
        <div className="bg-gradient-to-b from-black via-purple-950/20 to-black min-h-screen">
          {/* Hero Section */}
          <section className="relative overflow-hidden border-b border-orange-500/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,0,255,0.1),transparent)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,100,0,0.08),transparent)]"></div>
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-20 sm:py-28 md:py-36 lg:py-44">
              <div className="text-center">
                <div className="inline-block mb-4 sm:mb-6">
                  <span className="text-orange-500 text-xs sm:text-sm md:text-base font-black uppercase tracking-wider px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full">
                    🎃 Limited Edition Halloween Collection
                  </span>
                </div>
                
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white mb-4 sm:mb-6 leading-none">
                  {props.heroHeadline}
                </h1>
                
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/70 mb-6 sm:mb-8 max-w-3xl mx-auto font-light">
                  {props.heroSubheadline}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-500 text-white px-8 sm:px-10 md:px-12 py-4 sm:py-5 rounded-2xl font-black uppercase text-sm sm:text-base tracking-wide hover:from-orange-500 hover:to-orange-400 transition-all transform hover:scale-105 shadow-lg shadow-orange-500/20">
                    {props.ctaPrimary || "Get Started"} 🍂
                  </button>
                  <button className="w-full sm:w-auto bg-white/5 text-white border border-white/10 px-8 sm:px-10 md:px-12 py-4 sm:py-5 rounded-2xl font-black uppercase text-sm sm:text-base tracking-wide hover:bg-white/10 hover:border-white/20 transition-all">
                    FIRST VISIT: 20% OFF
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Featured Products */}
          <section className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-20 md:py-24 lg:py-32">
            <div className="text-center mb-12 sm:mb-16 md:mb-20">
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white mb-4 sm:mb-6">
                {props.featuredTitle}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-white/60 max-w-2xl mx-auto">
                Curated strains for a mystical Halloween experience
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
              {featuredProducts.map(product => (
                <div key={product.id} className="group bg-gradient-to-br from-purple-950/30 via-black to-black border border-orange-500/10 rounded-3xl overflow-hidden hover:border-orange-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/10 transform hover:-translate-y-2">
                  <div className="aspect-square bg-gradient-to-br from-purple-900/20 to-orange-900/20 relative overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 right-4">
                      <span className="bg-orange-500 text-black text-xs font-black uppercase px-3 py-1.5 rounded-full">
                        🎃 Halloween
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 sm:p-8">
                    <div className="mb-3 sm:mb-4">
                      <span className="text-orange-400/80 text-xs sm:text-sm uppercase tracking-wider font-bold">
                        {product.strain_type}
                      </span>
                    </div>
                    
                    <h3 className="text-2xl sm:text-3xl font-black uppercase text-white mb-3 sm:mb-4 tracking-tight">
                      {product.name}
                    </h3>
                    
                    {/* THC/CBD */}
                    <div className="flex gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div className="flex-1 bg-white/5 border border-white/5 rounded-xl p-3 sm:p-4">
                        <div className="text-xs sm:text-sm text-white/40 uppercase tracking-wider mb-1">THC</div>
                        <div className="text-lg sm:text-xl font-black text-orange-400">{product.thc_percent}%</div>
                      </div>
                      <div className="flex-1 bg-white/5 border border-white/5 rounded-xl p-3 sm:p-4">
                        <div className="text-xs sm:text-sm text-white/40 uppercase tracking-wider mb-1">CBD</div>
                        <div className="text-lg sm:text-xl font-black text-purple-400">{product.cbd_percent}%</div>
                      </div>
                    </div>
                    
                    {/* Effects */}
                    <div className="mb-4 sm:mb-6">
                      <div className="text-xs sm:text-sm text-white/40 uppercase tracking-wider mb-2">Effects</div>
                      <div className="flex flex-wrap gap-2">
                        {product.effects.map(effect => (
                          <span key={effect} className="text-xs sm:text-sm bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2.5 sm:px-3 py-1 rounded-full">
                            {effect}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Terpenes */}
                    <div className="mb-6 sm:mb-8">
                      <div className="text-xs sm:text-sm text-white/40 uppercase tracking-wider mb-2">Terpenes</div>
                      <div className="text-sm sm:text-base text-white/70">
                        {product.terpenes.join(', ')}
                      </div>
                    </div>
                    
                    {/* Price & CTA */}
                    <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-white/5">
                      <div>
                        <div className="text-xs sm:text-sm text-white/40 uppercase mb-1">Price</div>
                        <div className="text-2xl sm:text-3xl font-black text-white">${product.price}</div>
                      </div>
                      <button className="bg-orange-500 text-black px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl font-black uppercase text-xs sm:text-sm hover:bg-orange-400 transition-colors">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Halloween Banner */}
          <section className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-20 md:py-24">
            <div className="bg-gradient-to-r from-orange-950/40 via-purple-950/40 to-orange-950/40 border border-orange-500/20 rounded-3xl p-8 sm:p-12 md:p-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,100,0,0.1),transparent)]"></div>
              <div className="relative">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase text-white mb-4 sm:mb-6">
                  New Customer Offer
                </h2>
                <p className="text-lg sm:text-xl md:text-2xl text-white/70 mb-6 sm:mb-8 max-w-2xl mx-auto">
                  Get 20% off your first purchase this Halloween season
                </p>
                <button className="bg-white text-black px-8 sm:px-12 md:px-16 py-4 sm:py-5 md:py-6 rounded-2xl font-black uppercase text-sm sm:text-base md:text-lg tracking-wide hover:bg-orange-100 transition-all transform hover:scale-105">
                  CLAIM YOUR TREAT
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeState === 'ReturningCustomer' && dataLoaded && (
        <div className="bg-gradient-to-b from-black via-purple-950/20 to-black min-h-screen">
          {/* Hero Section */}
          <section className="relative overflow-hidden border-b border-orange-500/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,0,255,0.1),transparent)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,100,0,0.08),transparent)]"></div>
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-20 sm:py-28 md:py-36 lg:py-44">
              <div className="text-center">
                <div className="inline-block mb-4 sm:mb-6">
                  <span className="text-purple-400 text-xs sm:text-sm md:text-base font-black uppercase tracking-wider px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
                    👻 Welcome Back, Creature of the Night
                  </span>
                </div>
                
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white mb-4 sm:mb-6 leading-none">
                  WELCOME BACK
                </h1>
                
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/70 mb-6 sm:mb-8 max-w-3xl mx-auto font-light">
                  Your favorite Halloween strains are waiting
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-500 text-white px-8 sm:px-10 md:px-12 py-4 sm:py-5 rounded-2xl font-black uppercase text-sm sm:text-base tracking-wide hover:from-purple-500 hover:to-purple-400 transition-all transform hover:scale-105 shadow-lg shadow-purple-500/20">
                    VIEW YOUR FAVORITES
                  </button>
                  <button className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-500 text-white px-8 sm:px-10 md:px-12 py-4 sm:py-5 rounded-2xl font-black uppercase text-sm sm:text-base tracking-wide hover:from-orange-500 hover:to-orange-400 transition-all transform hover:scale-105 shadow-lg shadow-orange-500/20">
                    {props.ctaPrimary || "Get Started"} 🍂
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Featured Products */}
          <section className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-20 md:py-24 lg:py-32">
            <div className="text-center mb-12 sm:mb-16 md:mb-20">
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white mb-4 sm:mb-6">
                {props.featuredTitle}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-white/60 max-w-2xl mx-auto">
                Curated strains for a mystical Halloween experience
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
              {featuredProducts.map(product => (
                <div key={product.id} className="group bg-gradient-to-br from-purple-950/30 via-black to-black border border-orange-500/10 rounded-3xl overflow-hidden hover:border-orange-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/10 transform hover:-translate-y-2">
                  <div className="aspect-square bg-gradient-to-br from-purple-900/20 to-orange-900/20 relative overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 right-4">
                      <span className="bg-orange-500 text-black text-xs font-black uppercase px-3 py-1.5 rounded-full">
                        🎃 Halloween
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 sm:p-8">
                    <div className="mb-3 sm:mb-4">
                      <span className="text-orange-400/80 text-xs sm:text-sm uppercase tracking-wider font-bold">
                        {product.strain_type}
                      </span>
                    </div>
                    
                    <h3 className="text-2xl sm:text-3xl font-black uppercase text-white mb-3 sm:mb-4 tracking-tight">
                      {product.name}
                    </h3>
                    
                    {/* THC/CBD */}
                    <div className="flex gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div className="flex-1 bg-white/5 border border-white/5 rounded-xl p-3 sm:p-4">
                        <div className="text-xs sm:text-sm text-white/40 uppercase tracking-wider mb-1">THC</div>
                        <div className="text-lg sm:text-xl font-black text-orange-400">{product.thc_percent}%</div>
                      </div>
                      <div className="flex-1 bg-white/5 border border-white/5 rounded-xl p-3 sm:p-4">
                        <div className="text-xs sm:text-sm text-white/40 uppercase tracking-wider mb-1">CBD</div>
                        <div className="text-lg sm:text-xl font-black text-purple-400">{product.cbd_percent}%</div>
                      </div>
                    </div>
                    
                    {/* Effects */}
                    <div className="mb-4 sm:mb-6">
                      <div className="text-xs sm:text-sm text-white/40 uppercase tracking-wider mb-2">Effects</div>
                      <div className="flex flex-wrap gap-2">
                        {product.effects.map(effect => (
                          <span key={effect} className="text-xs sm:text-sm bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2.5 sm:px-3 py-1 rounded-full">
                            {effect}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Terpenes */}
                    <div className="mb-6 sm:mb-8">
                      <div className="text-xs sm:text-sm text-white/40 uppercase tracking-wider mb-2">Terpenes</div>
                      <div className="text-sm sm:text-base text-white/70">
                        {product.terpenes.join(', ')}
                      </div>
                    </div>
                    
                    {/* Price & CTA */}
                    <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-white/5">
                      <div>
                        <div className="text-xs sm:text-sm text-white/40 uppercase mb-1">Price</div>
                        <div className="text-2xl sm:text-3xl font-black text-white">${product.price}</div>
                      </div>
                      <button className="bg-orange-500 text-black px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl font-black uppercase text-xs sm:text-sm hover:bg-orange-400 transition-colors">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeState === 'CartAbandoned' && dataLoaded && (
        <div className="bg-gradient-to-b from-black via-orange-950/20 to-black min-h-screen">
          {/* Urgent Hero Section */}
          <section className="relative overflow-hidden border-b border-orange-500/30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,100,0,0.15),transparent)]"></div>
            <div className="absolute inset-0 animate-pulse bg-[radial-gradient(circle_at_80%_20%,rgba(255,100,0,0.1),transparent)]"></div>
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-20 sm:py-28 md:py-36 lg:py-44">
              <div className="text-center">
                <div className="inline-block mb-4 sm:mb-6 animate-pulse">
                  <span className="text-orange-300 text-xs sm:text-sm md:text-base font-black uppercase tracking-wider px-4 py-2 bg-orange-500/20 border border-orange-500/40 rounded-full">
                    ⚡ YOUR CART IS WAITING
                  </span>
                </div>
                
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-orange-400 mb-4 sm:mb-6 leading-none">
                  DON'T MISS OUT
                </h1>
                
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/70 mb-6 sm:mb-8 max-w-3xl mx-auto font-light">
                  Complete your order now and get 15% off Halloween specials
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-500 text-white px-8 sm:px-10 md:px-12 py-4 sm:py-5 rounded-2xl font-black uppercase text-sm sm:text-base tracking-wide hover:from-orange-500 hover:to-orange-400 transition-all transform hover:scale-105 shadow-lg shadow-orange-500/30 animate-pulse">
                    CHECKOUT NOW - SAVE 15%
                  </button>
                  <button className="w-full sm:w-auto bg-white/5 text-white border border-white/10 px-8 sm:px-10 md:px-12 py-4 sm:py-5 rounded-2xl font-black uppercase text-sm sm:text-base tracking-wide hover:bg-white/10 hover:border-white/20 transition-all">
                    VIEW CART
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Featured Products */}
          <section className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-20 md:py-24 lg:py-32">
            <div className="text-center mb-12 sm:mb-16 md:mb-20">
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white mb-4 sm:mb-6">
                {props.featuredTitle}
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-white/60 max-w-2xl mx-auto">
                Complete your Halloween collection before it's too late
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
              {featuredProducts.map(product => (
                <div key={product.id} className="group bg-gradient-to-br from-orange-950/30 via-black to-black border border-orange-500/20 rounded-3xl overflow-hidden hover:border-orange-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/20 transform hover:-translate-y-2">
                  <div className="aspect-square bg-gradient-to-br from-orange-900/20 to-purple-900/20 relative overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 right-4">
                      <span className="bg-orange-500 text-black text-xs font-black uppercase px-3 py-1.5 rounded-full animate-pulse">
                        🎃 15% OFF
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 sm:p-8">
                    <div className="mb-3 sm:mb-4">
                      <span className="text-orange-400/80 text-xs sm:text-sm uppercase tracking-wider font-bold">
                        {product.strain_type}
                      </span>
                    </div>
                    
                    <h3 className="text-2xl sm:text-3xl font-black uppercase text-white mb-3 sm:mb-4 tracking-tight">
                      {product.name}
                    </h3>
                    
                    {/* THC/CBD */}
                    <div className="flex gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div className="flex-1 bg-white/5 border border-white/5 rounded-xl p-3 sm:p-4">
                        <div className="text-xs sm:text-sm text-white/40 uppercase tracking-wider mb-1">THC</div>
                        <div className="text-lg sm:text-xl font-black text-orange-400">{product.thc_percent}%</div>
                      </div>
                      <div className="flex-1 bg-white/5 border border-white/5 rounded-xl p-3 sm:p-4">
                        <div className="text-xs sm:text-sm text-white/40 uppercase tracking-wider mb-1">CBD</div>
                        <div className="text-lg sm:text-xl font-black text-purple-400">{product.cbd_percent}%</div>
                      </div>
                    </div>
                    
                    {/* Effects */}
                    <div className="mb-4 sm:mb-6">
                      <div className="text-xs sm:text-sm text-white/40 uppercase tracking-wider mb-2">Effects</div>
                      <div className="flex flex-wrap gap-2">
                        {product.effects.map(effect => (
                          <span key={effect} className="text-xs sm:text-sm bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2.5 sm:px-3 py-1 rounded-full">
                            {effect}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Terpenes */}
                    <div className="mb-6 sm:mb-8">
                      <div className="text-xs sm:text-sm text-white/40 uppercase tracking-wider mb-2">Terpenes</div>
                      <div className="text-sm sm:text-base text-white/70">
                        {product.terpenes.join(', ')}
                      </div>
                    </div>
                    
                    {/* Price & CTA */}
                    <div className="flex items-center justify-between pt-4 sm:pt-6 border-t border-white/5">
                      <div>
                        <div className="text-xs sm:text-sm text-white/40 uppercase mb-1">Price</div>
                        <div className="flex items-baseline gap-2">
                          <div className="text-2xl sm:text-3xl font-black text-orange-400">${(product.price * 0.85).toFixed(2)}</div>
                          <div className="text-lg sm:text-xl text-white/40 line-through">${product.price}</div>
                        </div>
                      </div>
                      <button className="bg-orange-500 text-black px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl font-black uppercase text-xs sm:text-sm hover:bg-orange-400 transition-colors">
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Urgency Banner */}
          <section className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-16 sm:py-20 md:py-24">
            <div className="bg-gradient-to-r from-orange-900/40 via-orange-950/40 to-orange-900/40 border border-orange-500/30 rounded-3xl p-8 sm:p-12 md:p-16 text-center relative overflow-hidden animate-pulse">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,100,0,0.15),transparent)]"></div>
              <div className="relative">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase text-orange-400 mb-4 sm:mb-6">
                  YOUR CART EXPIRES SOON
                </h2>
                <p className="text-lg sm:text-xl md:text-2xl text-white/70 mb-6 sm:mb-8 max-w-2xl mx-auto">
                  Complete your purchase in the next 30 minutes to lock in 15% off
                </p>
                <button className="bg-orange-500 text-black px-8 sm:px-12 md:px-16 py-4 sm:py-5 md:py-6 rounded-2xl font-black uppercase text-sm sm:text-base md:text-lg tracking-wide hover:bg-orange-400 transition-all transform hover:scale-105">
                  COMPLETE ORDER NOW
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
      </>
    
    </SmartComponentWrapper>
  );
}
