"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Star, ArrowRight, CheckCircle, ArrowLeft, Search, Package, Users, Award, MapPin } from 'lucide-react';
import { getAllVendorsProxy as getAllVendors } from '@/lib/wordpress-vendor-proxy';

const VendorWhaleAnimation = dynamic(() => import("@/components/VendorWhaleAnimation"), { ssr: false });

// Vendor Card Component
function VendorCard({ vendor, index }: { vendor: any; index: number }) {
  return (
    <Link
      href={`/vendors/${vendor.slug}`}
      className="group bg-[#2a2a2a] hover:bg-[#303030] transition-all duration-300 relative overflow-hidden"
      style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both` }}
    >
      {/* Logo Container */}
      <div className="aspect-square bg-[#1a1a1a] flex items-center justify-center p-8 lg:p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <img 
          src={vendor.logo} 
          alt={vendor.name} 
          className="relative w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"
        />
      </div>

      {/* Info */}
      <div className="p-4 lg:p-6">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 
            className="text-xl lg:text-2xl text-white truncate tracking-wide flex-1"
            style={{ 
              fontFamily: vendor.id === 1 ? 'Lobster' : vendor.id === 2 ? 'Monkey Act' : vendor.id === 3 ? 'monospace' : 'inherit' 
            }}
          >
            {vendor.id === 3 ? `[${vendor.name.toUpperCase()}]` : vendor.name}
          </h3>
          {vendor.featured && (
            <Award size={14} className="text-white/60 flex-shrink-0" />
          )}
        </div>
        
        <p className="text-white/50 text-xs mb-3 lg:mb-4 line-clamp-2 leading-relaxed">{vendor.tagline}</p>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-white/40 text-xs mb-3">
          <MapPin size={10} />
          <span>{vendor.location}, {vendor.state}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 text-[10px] text-white/40 mb-3">
          <Star size={12} className="text-white fill-white" />
          <span className="text-white/60">{vendor.rating}</span>
          <span>•</span>
          <span>{vendor.totalProducts} products</span>
          {vendor.verified && (
            <>
              <span>•</span>
              <CheckCircle size={12} className="text-white/60" />
            </>
          )}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-1.5 text-white/60 group-hover:text-white text-[10px] uppercase tracking-[0.15em] transition-colors">
          <span>View Store</span>
          <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-300" />
        </div>
      </div>
    </Link>
  );
}

export default function VendorsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVendors() {
      try {
        setLoading(true);
        const data = await getAllVendors();
        
        // Ensure data is an array
        if (!Array.isArray(data)) {
          console.error('API returned non-array:', data);
          setVendors([]);
          setLoading(false);
          return;
        }
        
        // Map API data to component format
        const mappedVendors = data.map((v: any) => ({
          id: parseInt(v.id),
          name: v.store_name,
          slug: v.slug,
          logo: v.logo_url || '/logoprint.png',
          tagline: v.tagline || 'Quality cannabis products',
          location: v.region || 'California',
          state: v.state || 'California',
          region: v.region || 'California',
          rating: parseFloat(v.rating) || 0,
          totalReviews: parseInt(v.review_count) || 0,
          totalProducts: parseInt(v.product_count) || 0,
          verified: parseInt(v.verified) === 1,
          featured: parseInt(v.featured) === 1,
        }));
        
        setVendors(mappedVendors);
      } catch (error) {
        console.error('Error loading vendors:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadVendors();
  }, []);

  // Get unique regions
  const regions = [...new Set(vendors.map(v => v.region))].sort();

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         vendor.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vendor.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = selectedRegion === 'all' || vendor.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  const featuredVendor = vendors.find(v => v.featured) || vendors[0] || {
    name: 'Flora Distro',
    slug: 'flora-distro',
    logo: '/logoprint.png',
    tagline: 'Premium Cannabis Marketplace',
    rating: 5.0,
    totalReviews: 0,
    totalProducts: 0,
    location: 'California',
    verified: true,
    featured: false
  };

  // Group vendors by region for organized display
  const vendorsByRegion = regions.reduce((acc, region) => {
    acc[region] = filteredVendors.filter(v => v.region === region);
    return acc;
  }, {} as { [key: string]: typeof vendors });

  return (
    <div className="min-h-screen bg-[#2a2a2a] relative overflow-x-hidden overflow-y-auto max-w-full">
      {/* Vendor Whale Animation Background */}
      <VendorWhaleAnimation />

      {/* Hero */}
      <div className="border-b border-white/10 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#2a2a2a]/40 via-[#2a2a2a]/35 to-[#2a2a2a]/30 backdrop-blur-sm"></div>
        {/* Flora Distro Logo - Hero */}
        <div className="absolute top-8 right-8 md:top-16 md:right-16 lg:top-20 lg:right-20 z-10" style={{ animation: 'logoEntrance 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards', opacity: 0 }}>
          <Link href="/" className="group block">
            <div className="relative logo-float">
              {/* Outer glow ring */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl animate-pulse-slow"></div>
                <div className="absolute inset-0 bg-white/3 rounded-full blur-3xl" style={{ animation: 'spin-slow 20s linear infinite' }}></div>
              </div>
              
              {/* Spinning accent ring */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-700">
                <div className="absolute inset-0 border border-white/20 rounded-full" style={{ animation: 'spin-slow 8s linear infinite' }}></div>
              </div>
              
              {/* Logo */}
              <img 
                src="/logoprint.png" 
                alt="Flora Distro Marketplace" 
                className="relative w-24 h-24 md:w-40 md:h-40 lg:w-56 lg:h-56 object-contain opacity-50 group-hover:opacity-100 transition-all duration-1000 filter group-hover:brightness-110 group-hover:drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]" 
                style={{ animation: 'gentle-float 6s ease-in-out infinite' }}
              />
            </div>
          </Link>
        </div>
        
        <div className="max-w-[2000px] mx-auto px-4 sm:px-6 md:px-8 py-12 md:py-24 relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <Link 
              href="/products"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Back to Products</span>
            </Link>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-light text-white mb-3 tracking-tight uppercase">
            Verified Vendors
          </h1>
          <div className="h-[1px] w-16 bg-white/20 mb-8"></div>
          
          {/* Trust Message */}
          <div className="inline-block bg-white/5 border border-white/10 px-6 py-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-1 h-10 bg-gradient-to-b from-white/40 via-white/20 to-transparent"></div>
              <p className="text-white/70 text-sm font-light leading-relaxed max-w-lg">
                Every vendor is thoroughly examined and held to our highest standards.<br/>
                <span className="text-white/50">Lab tested. Quality verified. Trusted partners.</span>
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-8 grid grid-cols-3 gap-4 max-w-xl">
            <div className="bg-white/5 border border-white/10 p-4 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-white/40" />
                <div className="text-white/40 text-[10px] uppercase tracking-wider">Vendors</div>
              </div>
              <div className="text-white text-2xl font-light">{vendors.length}</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Package size={16} className="text-white/40" />
                <div className="text-white/40 text-[10px] uppercase tracking-wider">Products</div>
              </div>
              <div className="text-white text-2xl font-light">{vendors.reduce((sum, v) => sum + v.totalProducts, 0)}</div>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Award size={16} className="text-white/40" />
                <div className="text-white/40 text-[10px] uppercase tracking-wider">Avg Rating</div>
              </div>
              <div className="text-white text-2xl font-light">
                {(vendors.reduce((sum, v) => sum + v.rating, 0) / vendors.length).toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Vendor */}
      <div className="border-b border-white/10 relative">
        <div className="absolute inset-0 bg-[#2a2a2a]/35 backdrop-blur-sm"></div>
        <div className="max-w-[2000px] mx-auto px-4 sm:px-6 md:px-8 py-12 relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <Award size={18} className="text-white/60" />
            <h2 className="text-sm uppercase tracking-[0.2em] text-white/60">Featured Vendor</h2>
          </div>
          
            <Link 
              href={`/vendors/${featuredVendor.slug}`}
              className="group block bg-[#1a1a1a] border border-white/10 hover:border-white/20 transition-all duration-500 overflow-hidden"
            >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
              {/* Logo Section */}
              <div className="bg-black/40 flex items-center justify-center p-12 lg:p-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <img 
                  src={featuredVendor.logo} 
                  alt={featuredVendor.name} 
                  className="relative w-32 h-32 lg:w-48 lg:h-48 object-contain opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
                />
              </div>
              
              {/* Info Section */}
              <div className="lg:col-span-2 p-8 lg:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-3xl lg:text-4xl text-white tracking-wide" style={{ fontFamily: 'Lobster' }}>
                    {featuredVendor.name}
                  </h3>
                  <CheckCircle size={24} className="text-white/60" />
                </div>
                
                <p className="text-white/60 text-base mb-6 leading-relaxed max-w-2xl">
                  {featuredVendor.tagline}
                </p>
                
                <div className="flex flex-wrap items-center gap-6 mb-6">
                  <div className="flex items-center gap-2">
                    <Star size={18} className="text-white fill-white" />
                    <span className="text-white text-xl font-light">{featuredVendor.rating}</span>
                    <span className="text-white/40 text-sm">({featuredVendor.totalReviews} reviews)</span>
                  </div>
                  <div className="text-white/40 text-sm">
                    {featuredVendor.totalProducts} products available
                  </div>
                  <div className="text-white/40 text-sm">
                    {featuredVendor.location}
                  </div>
                </div>
                
                <div className="inline-flex items-center gap-2 text-white/60 group-hover:text-white text-sm uppercase tracking-wider transition-colors">
                  <span>Visit Store</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="border-b border-white/10 relative">
        <div className="absolute inset-0 bg-[#2a2a2a]/30 backdrop-blur-sm"></div>
        <div className="max-w-[2000px] mx-auto px-4 sm:px-6 md:px-8 py-6 relative z-10">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search vendors by name, location, or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/40 pl-12 pr-4 py-2.5 focus:outline-none focus:border-white/30 transition-all text-xs rounded"
              />
            </div>
            
            {/* Region Filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setSelectedRegion('all')}
                className={`px-4 py-2.5 text-xs uppercase tracking-[0.15em] transition-all whitespace-nowrap flex-shrink-0 rounded ${
                  selectedRegion === 'all'
                    ? 'bg-white text-black border border-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                All Regions
              </button>
              {regions.map(region => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-4 py-2.5 text-xs uppercase tracking-[0.15em] transition-all whitespace-nowrap flex-shrink-0 rounded ${
                    selectedRegion === region
                      ? 'bg-white text-black border border-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
            
            {/* Results Count */}
            <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider whitespace-nowrap">
              <span className="hidden md:inline">Showing</span>
              <span className="text-white font-medium">{filteredVendors.length}</span>
              <span>{filteredVendors.length === 1 ? 'Vendor' : 'Vendors'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vendors by Region */}
      <div className="max-w-[2000px] mx-auto px-4 sm:px-6 md:px-8 py-12 relative z-10">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white/60 mb-4"></div>
            <p className="text-white/60">Loading vendors...</p>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="text-center py-16 bg-[#1a1a1a] border border-white/10">
            <Search size={48} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/60 mb-2">No vendors found in {selectedRegion === 'all' ? 'your search' : selectedRegion}</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedRegion('all');
              }}
              className="text-white/40 hover:text-white text-sm transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : selectedRegion === 'all' ? (
          /* Organized by Region */
          <div className="space-y-12">
            {regions.map(region => {
              const regionVendors = vendorsByRegion[region];
              if (regionVendors.length === 0) return null;
              
              return (
                <div key={region}>
                  {/* Region Header */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-lg font-light uppercase tracking-[0.2em] text-white">
                        {region}
                      </h2>
                      <button
                        onClick={() => setSelectedRegion(region)}
                        className="text-white/40 hover:text-white text-xs uppercase tracking-wider transition-colors"
                      >
                        View All ({regionVendors.length})
                      </button>
                    </div>
                    <div className="h-[1px] bg-white/10"></div>
                  </div>
                  
                  {/* Region Vendors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-px bg-white/5">
                    {regionVendors.map((vendor: any, index: number) => (
                      <VendorCard key={vendor.id} vendor={vendor} index={index} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Single Region View */
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-light uppercase tracking-[0.2em] text-white mb-2">
                {selectedRegion}
              </h2>
              <div className="h-[1px] bg-white/10"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-px bg-white/5">
          {filteredVendors.map((vendor, index) => (
            <VendorCard key={vendor.id} vendor={vendor} index={index} />
          ))}
        </div>
          </div>
        )}

        {/* Become a Vendor CTA */}
        <div className="mt-16 text-center">
          <div className="inline-block bg-white/5 border border-white/10 px-8 py-6 backdrop-blur-sm">
            <h3 className="text-white text-xl font-light mb-2">Interested in selling on Flora Distro?</h3>
            <p className="text-white/60 text-sm mb-4 max-w-md mx-auto">
              Join our curated marketplace and reach customers across the region
            </p>
            <Link 
              href="/vendor/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black hover:bg-black hover:text-white border border-white hover:border-white/20 text-xs uppercase tracking-[0.2em] transition-all duration-300"
            >
              Become a Vendor
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Inject Fonts & Animations */}
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
        
        /* Logo entrance animation */
        @keyframes logoEntrance {
          0% {
            opacity: 0;
            transform: scale(0.5) translateY(-50px) rotate(-10deg);
            filter: blur(10px);
          }
          60% {
            transform: scale(1.05) translateY(5px) rotate(2deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0) rotate(0deg);
            filter: blur(0);
          }
        }
        
        /* Gentle floating */
        @keyframes gentle-float {
          0%, 100% { 
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-8px) rotate(1deg);
          }
          50% { 
            transform: translateY(-12px) rotate(0deg);
          }
          75% {
            transform: translateY(-8px) rotate(-1deg);
          }
        }
        
        /* Slow spin */
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Slow pulse */
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        
        /* Background float */
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
