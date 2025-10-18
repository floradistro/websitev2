"use client";

import Link from 'next/link';
import { Star, MapPin, Package, ArrowRight } from 'lucide-react';

// Mock vendor data - will be from API later
const vendors = [
  {
    id: 1,
    name: 'Yacht Club',
    slug: 'yacht-club',
    logo: '/yachtclub.png',
    tagline: 'Premium Cannabis from the Coast',
    location: 'Newport Beach, CA',
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
    location: 'Los Angeles, CA',
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
    location: 'San Diego, CA',
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
    location: 'Oakland, CA',
    rating: 4.7,
    totalReviews: 29,
    totalProducts: 5,
    verified: true,
  }
];

export default function VendorsPage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <h1 className="text-3xl font-light uppercase tracking-wider text-white mb-2">
            Marketplace Vendors
          </h1>
          <p className="text-white/60 text-sm">
            Browse products from verified vendors on Flora Distro
          </p>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
          {vendors.map((vendor) => (
            <Link
              key={vendor.id}
              href={`/vendors/${vendor.slug}`}
              className="group bg-[#2a2a2a] hover:bg-[#303030] p-8 transition-all duration-300 border border-transparent hover:border-white/10"
            >
              {/* Logo */}
              <div className="w-20 h-20 bg-black border border-white/10 flex items-center justify-center overflow-hidden mb-4">
                <img src={vendor.logo} alt={vendor.name} className="w-full h-full object-contain p-2" />
              </div>

              {/* Info */}
              <h3 
                className="text-xl text-white mb-1 tracking-wide" 
                style={{ 
                  fontFamily: vendor.id === 1 ? 'Lobster' : vendor.id === 2 ? 'Monkey Act' : vendor.id === 3 ? 'monospace' : 'inherit' 
                }}
              >
                {vendor.id === 3 ? `[${vendor.name.toUpperCase()}]` : vendor.name}
              </h3>
              <p className="text-white/60 text-sm mb-4">{vendor.tagline}</p>

              {/* Meta */}
              <div className="space-y-2 text-xs text-white/50 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin size={12} />
                  <span>{vendor.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package size={12} />
                  <span>{vendor.totalProducts} Products</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star size={12} className="text-yellow-500 fill-yellow-500" />
                  <span>{vendor.rating} ({vendor.totalReviews} reviews)</span>
                </div>
              </div>

              {/* CTA */}
              <div className="flex items-center gap-2 text-white/60 group-hover:text-white text-xs uppercase tracking-wider transition-colors">
                <span>View Store</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
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

