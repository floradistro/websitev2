"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Search, Package, MapPin, Instagram, ExternalLink, CheckCircle } from 'lucide-react';

// Vendor Card Component - Street Style  
function VendorCard({ vendor, index }: { vendor, any; index: number }) {
  return (
    <Link
      href={`/vendors/${vendor.slug}`}
      className="group relative overflow-hidden fade-in"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="bg-black border-2 border-white/20 hover:border-white/50 transition-all duration-300">
        {/* Logo */}
        <div className="relative aspect-square bg-[#0f0f0f] flex items-center justify-center p-12 border-b-2 border-white/20">
          <img 
            src={vendor.logo} 
            alt={vendor.name} 
            className="w-full h-full object-contain opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
          />
          {vendor.verified && (
            <div className="absolute top-3 right-3 bg-black border border-white/40 px-2 py-1 flex items-center gap-1.5">
              <CheckCircle size={12} className="text-white" />
              <span className="text-[8px] uppercase tracking-wider text-white font-bold">✓</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-6">
          <h3 className="text-2xl font-bold text-white mb-2 truncate uppercase tracking-tight">
            {vendor.name}
          </h3>
          
          {vendor.tagline && (
            <p className="text-white/60 text-sm mb-4 line-clamp-2">
              {vendor.tagline}
            </p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-white/20">
            <div className="bg-[#0a0a0a] border border-white/15 p-3 text-center">
              <div className="text-white text-3xl font-black mb-1">{vendor.totalProducts}</div>
              <div className="text-white/50 text-[9px] uppercase font-bold">Products</div>
            </div>
            {vendor.totalLocations > 1 && (
              <div className="bg-[#0a0a0a] border border-white/15 p-3 text-center">
                <div className="text-white text-3xl font-black mb-1">{vendor.totalLocations}</div>
                <div className="text-white/50 text-[9px] uppercase font-bold">Spots</div>
              </div>
            )}
          </div>

          {/* Categories */}
          {vendor.categories && vendor.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {vendor.categories.slice(0, 3).map((cat: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-white/10 text-white text-[9px] font-bold uppercase">
                  {cat}
                </span>
              ))}
            </div>
          )}

          {/* Contact */}
          <div className="space-y-2 text-xs text-white/50 mb-4">
            {vendor.city && vendor.state && (
              <div className="flex items-center gap-2">
                <MapPin size={12} />
                <span>{vendor.city}, {vendor.state}</span>
              </div>
            )}
            {vendor.instagram && (
              <div className="flex items-center gap-2">
                <Instagram size={12} />
                <span>{vendor.instagram}</span>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="flex items-center justify-between text-white group-hover:text-white text-xs uppercase tracking-wide font-bold pt-4 border-t border-white/20">
            <span>Shop</span>
            <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform duration-300" />
          </div>
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
        console.log('🔵 Loading vendors via bulk endpoint...');
        
        // Use bulk endpoint - returns ALL vendor data in ONE call
        const response = await fetch('/api/page-data/vendors');
        const result = await response.json();
        
        if (result.success) {
          console.log(`✅ Vendors loaded in ${result.meta.responseTime}`);
          setVendors(result.data.vendors || []);
        } else {
          console.error('Failed to load vendors:', result.error);
          setVendors([]);
        }
      } catch (error) {
        console.error('Error loading vendors:', error);
        setVendors([]);
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
    name: 'Yacht Club',
    slug: 'yacht-club',
    logo: '/yacht-club-logo.png',
    tagline: 'Premium Cannabis Marketplace',
    rating: 0,
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
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] text-white">
      {/* Luxury Styles */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes subtle-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .fade-in {
          animation: fade-in 0.8s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        .subtle-pulse {
          animation: subtle-pulse 3s ease-in-out infinite;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Street Style Header - Cannabis Culture */}
      <div className="relative border-b border-white/20">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0f0f0f] to-[#1a1a1a]"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-20 fade-in">
          <div className="mb-16">
            <h1 className="text-8xl md:text-9xl font-black text-white tracking-tighter mb-4 uppercase">
              THE PLUG
            </h1>
            <p className="text-white/70 text-lg font-medium max-w-2xl">
              Real brands. Real product. No middlemen. All vendors verified & licensed. We only work with the best.
            </p>
          </div>

          {/* Stats - Bold Street Style */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-black border-2 border-white/30 p-8 hover:border-white/50 transition-all">
              <div className="text-white text-7xl font-black mb-2 tracking-tighter">
                {vendors.length}
              </div>
              <div className="text-white/60 text-sm font-bold uppercase tracking-wider">VENDORS</div>
              <div className="text-white/40 text-xs mt-1">Verified ✓</div>
            </div>
            
            <div className="bg-black border-2 border-white/30 p-8 hover:border-white/50 transition-all">
              <div className="text-white text-7xl font-black mb-2 tracking-tighter">
                {vendors.reduce((sum, v) => sum + v.totalProducts, 0)}
              </div>
              <div className="text-white/60 text-sm font-bold uppercase tracking-wider">PRODUCTS</div>
              <div className="text-white/40 text-xs mt-1">In Stock</div>
            </div>
            
            <div className="bg-black border-2 border-white/30 p-8 hover:border-white/50 transition-all">
              <div className="text-white text-7xl font-black mb-2 tracking-tighter">
                {vendors.reduce((sum, v) => sum + (v.totalLocations || 0), 0)}
              </div>
              <div className="text-white/60 text-sm font-bold uppercase tracking-wider">SPOTS</div>
              <div className="text-white/40 text-xs mt-1">Nationwide</div>
            </div>
          </div>
        </div>
      </div>

      {/* What We About - Street Language */}
      <div className="max-w-7xl mx-auto px-6 py-16 fade-in" style={{ animationDelay: '0.15s' }}>
        <div className="bg-black border-2 border-white/20">
          <div className="p-12">
            <h2 className="text-4xl font-black text-white tracking-tight mb-8 uppercase">
              Why Shop With Us
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Quality */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                  <h3 className="text-xl font-bold text-white uppercase">Quality</h3>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">
                  Everything lab tested. All vendors licensed. We don't play about quality.
                </p>
              </div>
              
              {/* Direct */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                  <h3 className="text-xl font-bold text-white uppercase">Direct</h3>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">
                  Straight from the source. No middlemen cutting into your pockets. Better prices, fresher product.
                </p>
              </div>
              
              {/* Network */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                  <h3 className="text-xl font-bold text-white uppercase">Network</h3>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">
                  Multiple spots across the map. Pick up or we deliver. We got you covered.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Vendor - Street Showcase */}
      {featuredVendor && featuredVendor.slug !== 'yacht-club' && (
        <div className="max-w-7xl mx-auto px-6 py-16 fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="mb-6">
            <h2 className="text-4xl font-black text-white tracking-tight uppercase">
              Spotlight
            </h2>
            <p className="text-white/50 text-sm">Featured vendor bringing heat</p>
          </div>
          
          <Link 
            href={`/vendors/${featuredVendor.slug}`}
            className="group relative block overflow-hidden"
          >
            <div className="bg-black border-2 border-white/30 hover:border-white/60 transition-all">
              <div className="grid grid-cols-1 lg:grid-cols-3">
                {/* Logo */}
                <div className="bg-[#0f0f0f] p-16 flex items-center justify-center border-r-2 border-white/30">
                  <img 
                    src={featuredVendor.logo}
                    alt={featuredVendor.name}
                    className="w-48 h-48 object-contain opacity-95 group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                
                {/* Info */}
                <div className="lg:col-span-2 p-12">
                  <h3 className="text-5xl font-black text-white tracking-tight mb-3 uppercase">
                    {featuredVendor.name}
                  </h3>
                  {featuredVendor.tagline && (
                    <p className="text-white/60 text-lg mb-8">
                      {featuredVendor.tagline}
                    </p>
                  )}
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="bg-[#0a0a0a] border border-white/20 p-5">
                      <div className="text-white text-4xl font-black mb-1">{featuredVendor.totalProducts}</div>
                      <div className="text-white/50 text-xs uppercase font-bold">Products</div>
                    </div>
                    <div className="bg-[#0a0a0a] border border-white/20 p-5">
                      <div className="text-white text-4xl font-black mb-1">{featuredVendor.totalLocations || 1}</div>
                      <div className="text-white/50 text-xs uppercase font-bold">Spots</div>
                    </div>
                    <div className="bg-[#0a0a0a] border border-white/20 p-5">
                      <div className="text-white text-4xl font-black mb-1">{featuredVendor.categories?.length || 0}</div>
                      <div className="text-white/50 text-xs uppercase font-bold">Categories</div>
                    </div>
                  </div>
                  
                  {/* Categories */}
                  {featuredVendor.categories && featuredVendor.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                      {featuredVendor.categories.map((cat: string, i: number) => (
                        <span key={i} className="px-3 py-1.5 bg-white/10 text-white text-xs font-bold uppercase">
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black hover:bg-white/90 text-sm font-bold uppercase tracking-wide transition-all">
                    <span>Shop Now</span>
                    <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Search & Filter - Street Style */}
      <div className="max-w-7xl mx-auto px-6 py-10 fade-in" style={{ animationDelay: '0.4s' }}>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black border-2 border-white/20 hover:border-white/30 focus:border-white/50 text-white placeholder-white/40 pl-12 pr-4 py-4 focus:outline-none transition-all text-sm font-medium"
            />
          </div>
          
          {/* Region Filter */}
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedRegion('all')}
              className={`px-6 py-4 text-xs font-bold tracking-wider transition-all whitespace-nowrap uppercase ${
                selectedRegion === 'all'
                  ? 'bg-white text-black'
                  : 'bg-black border-2 border-white/20 text-white/70 hover:text-white hover:border-white/40'
              }`}
            >
              ALL
            </button>
            {regions.map(region => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`px-6 py-4 text-xs font-bold tracking-wider transition-all whitespace-nowrap uppercase ${
                  selectedRegion === region
                    ? 'bg-white text-black'
                    : 'bg-black border-2 border-white/20 text-white/70 hover:text-white hover:border-white/40'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {loading ? (
          <div className="bg-black border-2 border-white/20 p-24 text-center">
            <div className="w-3 h-3 bg-white rounded-full subtle-pulse mx-auto mb-4" />
            <p className="text-white/60 text-sm font-bold uppercase tracking-wider">LOADING</p>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="bg-black border-2 border-white/20 p-24 text-center">
            <Search size={48} className="text-white/30 mx-auto mb-6" />
            <p className="text-white/70 text-lg font-bold mb-6 uppercase">No Vendors Found</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedRegion('all');
              }}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white text-xs uppercase font-bold tracking-wider transition-all border border-white/20"
            >
              Clear Filters
            </button>
          </div>
        ) : selectedRegion === 'all' ? (
          /* Organized by Region - Luxury */
          <div className="space-y-20">
            {regions.map((region, regionIdx) => {
              const regionVendors = vendorsByRegion[region];
              if (regionVendors.length === 0) return null;
              
              return (
                <div key={region} className="fade-in" style={{ animationDelay: `${0.3 + regionIdx * 0.1}s` }}>
                  {/* Region Header */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-3xl font-black text-white tracking-tight uppercase">
                        {region}
                      </h2>
                      <div className="text-white/50 text-sm font-bold">
                        {regionVendors.length} {regionVendors.length === 1 ? 'Vendor' : 'Vendors'}
                      </div>
                    </div>
                    <div className="h-1 bg-white/20"></div>
                  </div>
                  
                  {/* Region Vendors */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {regionVendors.map((vendor: any, index: number) => (
                      <VendorCard key={vendor.id || vendor.uuid || `vendor-${index}`} vendor={vendor} index={index} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Single Region View - Luxury */
          <div className="fade-in">
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-1 h-8 bg-gradient-to-b from-white/30 via-white/10 to-transparent"></div>
                <div className="flex-1">
                  <h2 className="text-2xl font-light text-white/90 tracking-tight mb-1">
                    {selectedRegion}
                  </h2>
                  <div className="text-white/30 text-[10px] font-light tracking-widest">
                    {filteredVendors.length} {filteredVendors.length === 1 ? 'Vendor' : 'Vendors'}
                  </div>
                </div>
              </div>
              <div className="h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent ml-5"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVendors.map((vendor, index) => (
                <VendorCard key={vendor.id || vendor.uuid || index} vendor={vendor} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* Sell With Us - Street CTA */}
        <div className="mt-20 fade-in" style={{ animationDelay: '0.8s' }}>
          <div className="bg-black border-2 border-white/30">
            <div className="p-16 text-center">
              <h2 className="text-5xl font-black text-white tracking-tight mb-4 uppercase">
                Want In?
              </h2>
              <p className="text-white/60 text-base mb-10 max-w-xl mx-auto">
                Join the network. Reach customers nationwide. Grow your brand. No BS.
              </p>
              
              <Link
                href="/vendor/dashboard"
                className="inline-flex items-center gap-3 px-10 py-5 bg-white text-black hover:bg-white/90 transition-all group/cta"
              >
                <span className="text-sm uppercase tracking-wider font-black">Become a Vendor</span>
                <ArrowRight size={16} className="group-hover/cta:translate-x-1 transition-transform duration-300" />
              </Link>
              
              <div className="flex items-center justify-center gap-12 mt-10 pt-10 border-t-2 border-white/20">
                <div className="text-center">
                  <div className="text-white/70 text-sm font-bold">Licensed</div>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <div className="text-center">
                  <div className="text-white/70 text-sm font-bold">No Fees</div>
                </div>
                <div className="w-px h-8 bg-white/20"></div>
                <div className="text-center">
                  <div className="text-white/70 text-sm font-bold">Volume Deals</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
