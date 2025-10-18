"use client";

import Link from 'next/link';
import { Star, MapPin, Package, ArrowRight, TrendingUp, Award, CheckCircle } from 'lucide-react';

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
      {/* Hero Header */}
      <div className="border-b border-white/5 bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-light text-white mb-4 tracking-tight">
              Marketplace Vendors
            </h1>
            <p className="text-white/60 text-lg leading-relaxed mb-6">
              Discover curated cannabis brands on Flora Distro. Each vendor is verified, lab-tested, and committed to quality.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-white/80">Verified Sellers</span>
              </div>
              <div className="flex items-center gap-2">
                <Award size={16} className="text-yellow-500" />
                <span className="text-white/80">Quality Guaranteed</span>
              </div>
              <div className="flex items-center gap-2">
                <Package size={16} className="text-white/60" />
                <span className="text-white/80">{vendors.length} Active Vendors</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vendors Grid - Amazon Style */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vendors.map((vendor) => (
            <Link
              key={vendor.id}
              href={`/vendors/${vendor.slug}`}
              className="group bg-[#1a1a1a] border border-white/5 hover:border-white/10 p-8 transition-all duration-300 relative overflow-hidden"
            >
              {/* Gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative flex gap-6">
                {/* Logo */}
                <div className="w-24 h-24 bg-black border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:border-white/20 transition-colors">
                  <img src={vendor.logo} alt={vendor.name} className="w-full h-full object-contain p-2" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {/* Vendor Name */}
                  <h2 
                    className="text-2xl text-white mb-2 tracking-wide truncate" 
                    style={{ 
                      fontFamily: vendor.id === 1 ? 'Lobster' : vendor.id === 2 ? 'Monkey Act' : vendor.id === 3 ? 'monospace' : 'inherit' 
                    }}
                  >
                    {vendor.id === 3 ? `[${vendor.name.toUpperCase()}]` : vendor.name}
                  </h2>
                  
                  {/* Tagline */}
                  <p className="text-white/60 text-sm mb-4">{vendor.tagline}</p>

                  {/* Stats Row */}
                  <div className="flex flex-wrap gap-4 text-xs mb-4">
                    <div className="flex items-center gap-1.5">
                      <Star size={14} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-white font-medium">{vendor.rating}</span>
                      <span className="text-white/40">({vendor.totalReviews})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/60">
                      <Package size={14} />
                      <span>{vendor.totalProducts} Products</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/60">
                      <MapPin size={14} />
                      <span>{vendor.location}</span>
                    </div>
                    {vendor.verified && (
                      <div className="flex items-center gap-1.5 text-green-500">
                        <CheckCircle size={14} />
                        <span>Verified</span>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="flex items-center gap-2 text-white/60 group-hover:text-white text-xs uppercase tracking-wider transition-colors mt-auto">
                    <span>Visit Store</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-[#1a1a1a] border border-white/5 p-8">
          <div className="max-w-2xl">
            <h3 className="text-white text-lg font-light mb-3 uppercase tracking-wider">Become a Vendor</h3>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Interested in selling on Flora Distro? We're looking for quality vendors with lab-tested products. 
              Apply to join our marketplace and reach thousands of customers.
            </p>
            <Link
              href="/vendor/apply"
              className="inline-flex items-center gap-2 bg-white text-black border border-white px-6 py-3 text-xs uppercase tracking-wider hover:bg-black hover:text-white hover:border-white/20 transition-all duration-300"
            >
              Apply to Become a Vendor
              <ArrowRight size={14} />
            </Link>
          </div>
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

