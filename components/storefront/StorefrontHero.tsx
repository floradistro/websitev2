'use client';

import { VendorStorefront } from '@/lib/storefront/get-vendor';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface StorefrontHeroProps {
  vendor: VendorStorefront;
}

export function StorefrontHero({ vendor }: StorefrontHeroProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hasCustomBanner = vendor.banner_url;
  
  const bannerStyle = hasCustomBanner ? {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3)), url(${vendor.banner_url})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  } : {};

  return (
    <section 
      className={`relative h-[85vh] flex items-center justify-center text-center overflow-hidden ${
        mounted ? 'animate-fadeIn' : 'opacity-0'
      }`}
      style={{
        ...bannerStyle,
        backgroundColor: hasCustomBanner ? 'transparent' : '#1a1a1a',
      }}
    >
      {/* Animated Gradient Background (if no custom banner) */}
      {!hasCustomBanner && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
      )}

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
            {vendor.store_tagline || 'Curated Selection of Premium Products'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fadeInUp animation-delay-600">
          <Link 
            href="/shop"
            className="group inline-flex items-center gap-3 bg-white text-black px-10 py-4 text-xs uppercase tracking-[0.25em] hover:bg-white/90 transition-all duration-300 font-medium"
          >
            <span>Explore Collection</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
          
          <Link 
            href="/about"
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
  );
}

