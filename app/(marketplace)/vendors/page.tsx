"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Search, Package, MapPin, Instagram, ExternalLink, CheckCircle, Store } from 'lucide-react';

// Vendor Card Component - Match Site Theme
function VendorCard({ vendor, index }: { vendor: any; index: number }) {
  return (
    <Link
      href={`/vendors/${vendor.slug}`}
      className="group bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-300 border border-transparent hover:border-purple-500/30"
      style={{ animation: `fadeInUp 0.6s ease-out ${index * 0.05}s both` }}
    >
      {/* Logo */}
      <div className="aspect-square bg-[#2a2a2a] flex items-center justify-center p-8 relative overflow-hidden">
        <img 
          src={vendor.logo} 
          alt={vendor.name} 
          className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"
        />
        {vendor.verified && (
          <div className="absolute top-2 right-2 bg-purple-500/20 backdrop-blur-sm border border-purple-500/30 px-2 py-0.5 flex items-center gap-1">
            <CheckCircle size={10} className="text-purple-400" />
            <span className="text-[8px] uppercase tracking-wider text-white/70">Verified</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-xl font-light text-white mb-2 truncate tracking-tight">
          {vendor.name}
        </h3>
        
        {vendor.tagline && (
          <p className="text-white/50 text-xs font-light mb-3 line-clamp-2 leading-relaxed">
            {vendor.tagline}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-[10px] text-white/40 mb-3">
          <span>{vendor.totalProducts} products</span>
          {vendor.totalLocations > 1 && (
            <>
              <span>•</span>
              <span>{vendor.totalLocations} locations</span>
            </>
          )}
        </div>

        {/* Categories */}
        {vendor.categories && vendor.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {vendor.categories.slice(0, 3).map((cat: string, i: number) => (
              <span key={i} className="px-2 py-0.5 bg-white/5 text-white/50 text-[9px] uppercase tracking-wider border border-white/10">
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Contact */}
        {vendor.city && vendor.state && (
          <div className="flex items-center gap-1.5 text-white/40 text-[10px] mb-3">
            <MapPin size={10} />
            <span className="font-light">{vendor.city}, {vendor.state}</span>
          </div>
        )}

        {/* CTA */}
        <div className="flex items-center gap-1.5 text-white/60 group-hover:text-white text-[10px] uppercase tracking-wider transition-colors pt-3 border-t border-white/10">
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
    <div className="bg-[#2a2a2a] min-h-screen overflow-x-hidden w-full text-white">
      {/* Match Site Theme Styles */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* Header - Match Site Theme */}
      <div className="relative py-20 sm:py-28 px-4 sm:px-6 border-b border-white/5" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a]/40 via-[#1a1a1a]/35 to-[#1a1a1a]/30 backdrop-blur-sm"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-white mb-6 leading-none tracking-tight">
            Verified Vendors
          </h1>
          <p className="text-base sm:text-lg font-light text-white/50 leading-relaxed max-w-2xl mb-8">
            Curated partners bringing quality products. Lab tested. Fully licensed. Direct access.
          </p>
          
          <div className="h-[1px] w-16 bg-gradient-to-r from-purple-500/60 to-transparent mb-12"></div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 max-w-3xl">
            <div className="bg-[#3a3a3a]/30 backdrop-blur-md border border-white/10 hover:border-purple-500/30 p-6 transition-all group">
              <div className="text-white text-4xl font-light mb-2 tracking-tight">
                {vendors.length}
              </div>
              <div className="text-white/40 text-xs uppercase tracking-wider">Vendors</div>
            </div>
            
            <div className="bg-[#3a3a3a]/30 backdrop-blur-md border border-white/10 hover:border-purple-500/30 p-6 transition-all group">
              <div className="text-white text-4xl font-light mb-2 tracking-tight">
                {vendors.reduce((sum, v) => sum + v.totalProducts, 0)}
              </div>
              <div className="text-white/40 text-xs uppercase tracking-wider">Products</div>
            </div>
            
            <div className="bg-[#3a3a3a]/30 backdrop-blur-md border border-white/10 hover:border-purple-500/30 p-6 transition-all group">
              <div className="text-white text-4xl font-light mb-2 tracking-tight">
                {vendors.reduce((sum, v) => sum + (v.totalLocations || 0), 0)}
              </div>
              <div className="text-white/40 text-xs uppercase tracking-wider">Locations</div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Shop Here - Match Site Style */}
      <div className="relative py-16 px-4 sm:px-6 border-b border-white/5" style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#3a3a3a]/35 to-[#3a3a3a]/30 backdrop-blur-md"></div>
        
        <div className="max-w-7xl mx-auto relative">
          <h2 className="text-2xl md:text-3xl font-light uppercase tracking-wider text-white mb-3">
            The Vendor Network
          </h2>
          <div className="h-[1px] w-16 bg-gradient-to-r from-purple-500/60 to-transparent mb-12"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px">
            <div className="bg-[#3a3a3a]/30 backdrop-blur-md hover:bg-[#404040]/40 transition-all duration-500 p-8 border border-white/10 hover:border-purple-500/30 group">
              <Store className="w-8 h-8 mb-6 text-purple-400/70 group-hover:text-purple-300 transition-colors" />
              <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Quality Verified</h3>
              <p className="text-xs text-white/50 font-light leading-relaxed">
                Every vendor vetted. All products lab tested. Licensed operations only.
              </p>
            </div>
            
            <div className="bg-[#3a3a3a]/30 backdrop-blur-md hover:bg-[#404040]/40 transition-all duration-500 p-8 border border-white/10 hover:border-purple-500/30 group">
              <Package className="w-8 h-8 mb-6 text-purple-400/70 group-hover:text-purple-300 transition-colors" />
              <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Direct Access</h3>
              <p className="text-xs text-white/50 font-light leading-relaxed">
                Shop straight from suppliers. Better pricing. Fresher inventory. No middlemen.
              </p>
            </div>
            
            <div className="bg-[#3a3a3a]/30 backdrop-blur-md hover:bg-[#404040]/40 transition-all duration-500 p-8 border border-white/10 hover:border-purple-500/30 group">
              <MapPin className="w-8 h-8 mb-6 text-purple-400/70 group-hover:text-purple-300 transition-colors" />
              <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-4 font-normal">Regional Network</h3>
              <p className="text-xs text-white/50 font-light leading-relaxed">
                Multiple locations nationwide. Fast fulfillment. Pickup or delivery options.
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* Search & Filter - Match Site Theme */}
      <div className="relative py-12 px-4 sm:px-6 border-b border-white/5" style={{ animation: 'fadeInUp 0.6s ease-out 0.3s both' }}>
        <div className="absolute inset-0 bg-[#2a2a2a]/30 backdrop-blur-sm"></div>
        
        <div className="max-w-7xl mx-auto relative flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white placeholder-white/40 pl-12 pr-4 py-3 focus:outline-none focus:border-purple-500/50 transition-all text-sm"
            />
          </div>
          
          {/* Region Filter */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedRegion('all')}
              className={`px-4 py-3 text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedRegion === 'all'
                  ? 'bg-white text-black'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              All
            </button>
            {regions.map(region => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`px-4 py-3 text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                  selectedRegion === region
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        {loading ? (
          <div className="text-center py-16">
            <div className="text-white/60">Loading vendors...</div>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="text-center py-16 bg-[#3a3a3a]/30 border border-white/10 p-12">
            <Search size={48} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/60 mb-4">No vendors found</p>
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
          /* Organized by Region - Luxury */
          <div className="space-y-20">
            {regions.map((region, regionIdx) => {
              const regionVendors = vendorsByRegion[region];
              if (regionVendors.length === 0) return null;
              
              return (
                <div key={region} className="fade-in" style={{ animationDelay: `${0.3 + regionIdx * 0.1}s` }}>
                  {/* Region Header */}
                  <div className="mb-6">
                    <h2 className="text-lg font-light uppercase tracking-wider text-white mb-2">
                      {region}
                    </h2>
                    <div className="h-[1px] w-16 bg-gradient-to-r from-purple-500/60 to-transparent"></div>
                  </div>
                  
                  {/* Region Vendors */}
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-px bg-white/5">
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

        {/* Become a Vendor CTA - Match Site Theme */}
        <div className="mt-16 px-4 sm:px-6" style={{ animation: 'fadeInUp 0.6s ease-out 0.6s both' }}>
          <div className="bg-[#3a3a3a]/30 backdrop-blur-md border border-white/10 hover:border-purple-500/30 p-12 text-center transition-all">
            <h2 className="text-3xl font-light text-white mb-4 tracking-tight">
              Interested in selling on Yacht Club?
            </h2>
            <p className="text-white/60 text-sm mb-6 max-w-md mx-auto font-light">
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
    </div>
  );
}
