"use client";

import Link from 'next/link';
import { Star, ArrowRight } from 'lucide-react';

// Mock vendor data
const vendors = [
  {
    id: 1,
    name: 'Yacht Club',
    slug: 'yacht-club',
    logo: '/yachtclub.png',
    tagline: 'Premium Cannabis from the Coast',
    location: 'Newport Beach',
    rating: 4.9,
    totalReviews: 47,
    totalProducts: 9,
    verified: true,
  },
  {
    id: 2,
    name: 'CannaBoyz',
    slug: 'cannaboyz',
    logo: '/CannaBoyz.png',
    tagline: 'Street Certified, Lab Tested',
    location: 'Los Angeles',
    rating: 4.8,
    totalReviews: 38,
    totalProducts: 6,
    verified: true,
  },
  {
    id: 3,
    name: 'Moonwater',
    slug: 'moonwater',
    logo: '/moonwater.png',
    tagline: 'Premium THC Beverages',
    location: 'San Diego',
    rating: 4.9,
    totalReviews: 52,
    totalProducts: 4,
    verified: true,
  },
  {
    id: 4,
    name: 'Zarati',
    slug: 'zarati',
    logo: '/zarati.png',
    tagline: 'Exotic Genetics, Premium Quality',
    location: 'Oakland',
    rating: 4.7,
    totalReviews: 29,
    totalProducts: 5,
    verified: true,
  }
];

export default function VendorsPage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Hero */}
      <div className="border-b border-white/5 relative overflow-hidden">
        {/* Subtle animated gradient */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float"></div>
        </div>
        
        <div className="max-w-[2000px] mx-auto px-4 sm:px-6 md:px-8 py-16 md:py-24 relative">
          <h1 className="text-3xl md:text-5xl font-light text-white mb-3 tracking-tight uppercase">
            Vendors
          </h1>
          <div className="h-[1px] w-16 bg-white/20 mb-8"></div>
          
          {/* Trust Message */}
          <div className="inline-block bg-white/5 border border-white/10 px-6 py-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-1 h-10 bg-gradient-to-b from-white/40 via-white/20 to-transparent"></div>
              <p className="text-white/70 text-sm font-light leading-relaxed max-w-lg">
                Every vendor is thoroughly examined and held to our highest standards.<br/>
                <span className="text-white/50">Lab tested. Quality verified.</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="max-w-[2000px] mx-auto px-4 sm:px-6 md:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-white/5">
          {vendors.map((vendor, index) => (
            <Link
              key={vendor.id}
              href={`/vendors/${vendor.slug}`}
              className="group bg-[#2a2a2a] hover:bg-[#303030] transition-all duration-300 relative overflow-hidden"
              style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both` }}
            >
              {/* Logo Container */}
              <div className="aspect-square bg-[#1a1a1a] flex items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <img 
                  src={vendor.logo} 
                  alt={vendor.name} 
                  className="relative w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"
                />
              </div>

              {/* Info */}
              <div className="p-6">
                <h3 
                  className="text-2xl md:text-3xl text-white mb-3 truncate tracking-wide"
                  style={{ 
                    fontFamily: vendor.id === 1 ? 'Lobster' : vendor.id === 2 ? 'Monkey Act' : vendor.id === 3 ? 'monospace' : 'inherit' 
                  }}
                >
                  {vendor.id === 3 ? `[${vendor.name.toUpperCase()}]` : vendor.name}
                </h3>
                
                <p className="text-white/50 text-xs mb-4 line-clamp-2 leading-relaxed">{vendor.tagline}</p>

                {/* Stats */}
                <div className="flex items-center gap-2 text-[10px] text-white/40 mb-3">
                  <Star size={10} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-white/60">{vendor.rating}</span>
                  <span>•</span>
                  <span>{vendor.totalProducts} products</span>
                </div>

                {/* CTA */}
                <div className="flex items-center gap-1.5 text-white/60 group-hover:text-white text-[10px] uppercase tracking-[0.15em] transition-colors">
                  <span>Visit</span>
                  <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform duration-300" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Inject Fonts */}
      <style jsx global>{`
        @font-face {
          font-family: 'Lobster';
          src: url('/Lobster 1.4.otf') format('opentype');
          font-weight: normal;
          font-style: normal;
        }
        @font-face {
          font-family: 'Monkey Act';
          src: url('/Monkey Act - Personal Use.otf') format('opentype');
          font-weight: normal;
          font-style: normal;
        }
      `}</style>
    </div>
  );
}
