
"use client";

import React, { useEffect, useState } from 'react';
import { SmartComponentWrapper, SmartComponentBaseProps } from '@/lib/smart-component-base';

export interface FloraDistroHomepageProps extends SmartComponentBaseProps {
  heroHeadline?: string;
  heroSubheadline?: string;
  trustBadges?: any;
}

export function FloraDistroHomepage({ 
  vendorId,
  heroHeadline = "Flora Distro",
  heroSubheadline = "Premium Cannabis Collection",
  trustBadges = [],
  animate = true,
  ...props 
}: FloraDistroHomepageProps) {
  
  const [products, setProducts] = useState<any[]>([]);
  
  useEffect(() => {
    fetch(`/api/products${vendorId ? `?vendor_id=${vendorId}` : ''}`)
      .then(res => res.json())
      .then(data => {
        // API returns {products: [...]} so extract the array
        setProducts(data.products || data || []);
      })
      .catch(() => {
        // Mock data for testing - set empty array to prevent errors
        setProducts([]);
      });
  }, [vendorId]);
  
  
  
  // Quantum state management with responsive detection
  const [activeState, setActiveState] = useState('Desktop');
  
  useEffect(() => {
    // Initial detection
    const updateState = () => {
      const isMobile = window.innerWidth < 768;
      setActiveState(isMobile ? 'Mobile' : 'Desktop');
    };
    
    // Set initial state
    updateState();
    
    // Listen for resize events
    window.addEventListener('resize', updateState);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateState);
  }, []);
  
  
  return (
    <SmartComponentWrapper 
      componentName="FloraDistroHomepage"
      animate={animate}
    >
      <>
      {activeState === 'Mobile' && (
        <div className="relative min-h-screen bg-black overflow-hidden">
          {/* Animated Background Gradients */}
          <div className="fixed inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
          </div>

          {/* Floating Particles */}
          <div className="fixed inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${5 + Math.random() * 10}s`
                }}
              ></div>
            ))}
          </div>

          {/* Hero Section - Optimized for Mobile */}
          <div className="relative flex flex-col items-center justify-center px-4 pt-32 pb-16 text-center">
            <div className="relative z-10">
              <h1 className="text-4xl font-black uppercase tracking-tight mb-4 bg-gradient-to-r from-emerald-400 via-purple-400 to-blue-400 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto] leading-tight">
                {heroHeadline}
              </h1>
              <p className="text-base text-white/80 mb-6 max-w-sm mx-auto">
                {heroSubheadline}
              </p>
              <button className="bg-gradient-to-r from-emerald-500 to-purple-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-tight text-sm shadow-2xl shadow-purple-500/50 active:scale-95 transition-transform">
                Shop Now
              </button>
            </div>
          </div>

          {/* Trust Badges - Compact Mobile Grid */}
          {trustBadges && trustBadges.length > 0 && (
          <div className="relative z-10 px-4 py-8">
            <div className="grid grid-cols-2 gap-3">
              {trustBadges.map((badge: any, i: number) => (
                <div 
                  key={i}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 active:bg-white/10 active:scale-95 transition-all duration-200"
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className="text-3xl">{badge.icon}</span>
                    <span className="text-white font-bold uppercase tracking-tight text-xs">{badge.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Product Carousel */}
          <div className="relative z-10 px-6 py-16">
            <h2 className="text-4xl font-black uppercase tracking-tight mb-8 text-center bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
              Featured Products
            </h2>
            <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scrollbar-hide">
              {products?.slice(0, 8).map((product, i) => (
                <div 
                  key={product.id}
                  className="flex-shrink-0 w-72 snap-center group"
                >
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 hover:border-purple-500/50">
                    <div className="aspect-square bg-gradient-to-br from-emerald-500/20 to-purple-500/20 rounded-xl mb-4 overflow-hidden">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl">🌿</div>
                      )}
                    </div>
                    <h3 className="text-white font-black uppercase text-lg mb-2 truncate">{product.name}</h3>
                    <p className="text-white/60 text-sm mb-4 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-400 font-black text-2xl">${product.price}</span>
                      <button className="bg-gradient-to-r from-emerald-500 to-purple-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:scale-110 transition-transform">
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <style jsx>{`
            @keyframes blob {
              0%, 100% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(30px, -50px) scale(1.1); }
              66% { transform: translate(-20px, 20px) scale(0.9); }
            }
            @keyframes float {
              0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
            }
            @keyframes gradient-x {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
            .animate-blob { animation: blob 7s infinite; }
            .animate-float { animation: float linear infinite; }
            .animate-gradient-x { animation: gradient-x 3s ease infinite; }
            .animation-delay-2000 { animation-delay: 2s; }
            .animation-delay-4000 { animation-delay: 4s; }
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
        </div>
      )}

      {activeState === 'Desktop' && (
        <div className="relative min-h-screen bg-black overflow-hidden">
          {/* Animated Background Gradients */}
          <div className="fixed inset-0 opacity-20">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/2 w-[600px] h-[600px] bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
          </div>

          {/* Floating Particles */}
          <div className="fixed inset-0 pointer-events-none">
            {[...Array(40)].map((_, i) => (
              <div 
                key={i}
                className="absolute w-3 h-3 rounded-full animate-float"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: `radial-gradient(circle, ${['#10b981', '#8b5cf6', '#3b82f6'][i % 3]}40, transparent)`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${8 + Math.random() * 15}s`
                }}
              ></div>
            ))}
          </div>

          {/* Hero Section - Full Screen */}
          <div className="relative min-h-screen flex items-center justify-center px-8 parallax-hero">
            <div className="relative z-10 text-center max-w-5xl">
              <h1 className="text-8xl font-black uppercase tracking-tight mb-8 bg-gradient-to-r from-emerald-400 via-purple-400 to-blue-400 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto] leading-tight">
                {heroHeadline}
              </h1>
              <p className="text-3xl text-white/80 mb-12 max-w-3xl mx-auto font-light">
                {heroSubheadline}
              </p>
              <button className="bg-gradient-to-r from-emerald-500 via-purple-600 to-blue-600 text-white px-12 py-6 rounded-2xl font-black uppercase tracking-tight text-xl hover:scale-110 transition-all duration-300 shadow-2xl shadow-purple-500/50 hover:shadow-emerald-500/50 animate-pulse-slow">
                Explore Collection
              </button>
            </div>
            
            {/* Scroll Indicator */}
            <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-bounce">
              <div className="w-8 h-12 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-scroll"></div>
              </div>
            </div>
          </div>

          {/* Trust Badges - Glassmorphism */}
          {trustBadges && trustBadges.length > 0 && (
          <div className="relative z-10 px-8 py-20">
            <div className="max-w-7xl mx-auto grid grid-cols-4 gap-8">
              {trustBadges.map((badge: any, i: number) => (
                <div 
                  key={i}
                  className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:bg-white/10 hover:scale-110 transition-all duration-500 hover:shadow-2xl cursor-pointer"
                  style={{ 
                    animationDelay: `${i * 100}ms`,
                    boxShadow: `0 0 0 0 ${badge.color}40`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 20px 60px ${badge.color}80`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = `0 0 0 0 ${badge.color}40`;
                  }}
                >
                  <div className="text-center">
                    <div className="text-7xl mb-6 group-hover:scale-125 transition-transform duration-500 inline-block group-hover:rotate-12">
                      {badge.icon}
                    </div>
                    <h3 className="text-white font-black uppercase tracking-tight text-2xl" style={{ color: badge.color }}>
                      {badge.text}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Product Grid with Parallax */}
          <div className="relative z-10 px-8 py-24 parallax-products">
            <h2 className="text-7xl font-black uppercase tracking-tight mb-16 text-center bg-gradient-to-r from-emerald-400 via-purple-400 to-blue-400 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_auto]">
              Premium Selection
            </h2>
            <div className="max-w-7xl mx-auto grid grid-cols-4 gap-8">
              {products?.slice(0, 8).map((product, i) => (
                <div 
                  key={product.id}
                  className="group cursor-pointer"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-500 hover:scale-105 hover:-translate-y-4 relative overflow-hidden"
                    style={{
                      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 30px 80px -15px rgba(139, 92, 246, 0.8), 0 0 60px rgba(16, 185, 129, 0.4)';
                      e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.8)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  >
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-emerald-500/20 group-hover:via-purple-500/20 group-hover:to-blue-500/20 transition-all duration-500 rounded-2xl"></div>
                    
                    <div className="relative z-10">
                      <div className="aspect-square bg-gradient-to-br from-emerald-500/20 to-purple-500/20 rounded-xl mb-4 overflow-hidden">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-125 group-hover:rotate-3 transition-all duration-700"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-7xl group-hover:scale-125 transition-transform duration-700">
                            🌿
                          </div>
                        )}
                      </div>
                      <h3 className="text-white font-black uppercase text-lg mb-2 truncate group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-emerald-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300">
                        {product.name}
                      </h3>
                      <p className="text-white/60 text-sm mb-4 line-clamp-2 group-hover:text-white/80 transition-colors">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-black text-3xl group-hover:scale-110 transition-transform inline-block">
                          ${product.price}
                        </span>
                        <button className="bg-gradient-to-r from-emerald-500 to-purple-600 text-white px-6 py-3 rounded-xl font-black uppercase text-sm hover:scale-110 hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300">
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section with Glassmorphism */}
          <div className="relative z-10 px-8 py-32">
            <div className="max-w-5xl mx-auto bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-16 text-center hover:bg-white/10 transition-all duration-500">
              <h2 className="text-6xl font-black uppercase tracking-tight mb-6 bg-gradient-to-r from-emerald-400 to-purple-400 bg-clip-text text-transparent">
                Join the Experience
              </h2>
              <p className="text-white/80 text-2xl mb-10 max-w-3xl mx-auto">
                Discover premium cannabis products curated for the most discerning tastes
              </p>
              <button className="bg-gradient-to-r from-emerald-500 via-purple-600 to-blue-600 text-white px-16 py-6 rounded-2xl font-black uppercase tracking-tight text-xl hover:scale-110 transition-all duration-300 shadow-2xl shadow-purple-500/50 hover:shadow-emerald-500/70">
                Get Started
              </button>
            </div>
          </div>

          <style jsx>{`
            @keyframes blob {
              0%, 100% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(50px, -80px) scale(1.2); }
              66% { transform: translate(-30px, 40px) scale(0.9); }
            }
            @keyframes float {
              0%, 100% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
              10% { opacity: 0.6; }
              90% { opacity: 0.3; }
              100% { transform: translateY(-100vh) translateX(100px) scale(0.5); opacity: 0; }
            }
            @keyframes gradient-x {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
            @keyframes scroll {
              0% { transform: translateY(0); opacity: 1; }
              100% { transform: translateY(16px); opacity: 0; }
            }
            @keyframes pulse-slow {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.8; }
            }
            .animate-blob { animation: blob 10s infinite; }
            .animate-float { animation: float linear infinite; }
            .animate-gradient-x { animation: gradient-x 4s ease infinite; }
            .animate-scroll { animation: scroll 2s ease-in-out infinite; }
            .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
            .animation-delay-2000 { animation-delay: 2s; }
            .animation-delay-4000 { animation-delay: 4s; }
            .parallax-hero { transform: translateZ(0); }
            .parallax-products { transform: translateZ(0); }
          `}</style>
        </div>
      )}
      </>
    
    </SmartComponentWrapper>
  );
}
