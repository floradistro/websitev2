"use client";

import { useState, useMemo, memo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import LocationDropdown from "./LocationDropdown";
import ProductCard from "./ProductCard";

const ProductGridAnimation = dynamic(() => import("@/components/ProductGridAnimation"), { ssr: false });

interface ProductsClientProps {
  categories: any[];
  locations: any[];
  vendorProducts: any[];
  vendors: any[];
}

const strainTypes = ["Sativa", "Indica", "Hybrid"];
const commonEffects = ["Relaxing", "Energize", "Euphoric", "Happy", "Creative", "Uplifting", "Calming", "Focus"];
const priceRanges = [
  { label: "Under $50", min: 0, max: 50 },
  { label: "$50 - $100", min: 50, max: 100 },
  { label: "$100 - $150", min: 100, max: 150 },
  { label: "Over $150", min: 150, max: 999999 },
];

function ProductsClient({
  categories,
  locations,
  vendorProducts = [],
  vendors = [],
}: ProductsClientProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [categorySlug, setCategorySlug] = useState<string | undefined>(undefined);
  const [selectedStrainType, setSelectedStrainType] = useState<string | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("default");
  const [showFilters, setShowFilters] = useState(false);

  const activeLocations = useMemo(
    () => locations.filter((loc: any) => loc.is_active === "1" || loc.is_active === 1 || loc.is_active === true),
    [locations]
  );

  const products = useMemo(() => {
    let filtered = vendorProducts;
    
    // Filter by vendor
    if (selectedVendor) {
      filtered = filtered.filter((product: any) => product.vendorSlug === selectedVendor);
    }
    
    // Filter by location
    if (selectedLocation) {
      filtered = filtered.filter((product: any) => {
        const productInventory = product.inventory || [];
        if (productInventory.length === 0) return false;
        
        return productInventory.some((inv: any) => {
          const locationMatch = inv.location_id === selectedLocation || 
                               inv.location_id?.toString() === selectedLocation;
          const qty = parseFloat(inv.quantity || 0);
          return locationMatch && qty > 0;
        });
      });
    }

    // Filter by strain type
    if (selectedStrainType) {
      filtered = filtered.filter((product: any) => {
        const strainType = product.fields?.strain_type || '';
        return strainType.toLowerCase().includes(selectedStrainType.toLowerCase());
      });
    }

    // Filter by effect
    if (selectedEffect) {
      filtered = filtered.filter((product: any) => {
        const effects = (product.fields?.effects || product.fields?.effect || '').toLowerCase();
        return effects.includes(selectedEffect.toLowerCase());
      });
    }

    // Filter by price range
    if (priceRange) {
      const range = priceRanges.find(r => r.label === priceRange);
      if (range) {
        filtered = filtered.filter((product: any) => {
          const price = parseFloat(product.price || 0);
          return price >= range.min && price <= range.max;
        });
      }
    }

    // Sort products
    if (sortBy === "price-asc") {
      filtered = [...filtered].sort((a: any, b: any) => 
        parseFloat(a.price || 0) - parseFloat(b.price || 0)
      );
    } else if (sortBy === "price-desc") {
      filtered = [...filtered].sort((a: any, b: any) => 
        parseFloat(b.price || 0) - parseFloat(a.price || 0)
      );
    } else if (sortBy === "name") {
      filtered = [...filtered].sort((a: any, b: any) => 
        a.name.localeCompare(b.name)
      );
    }

    return filtered;
  }, [selectedLocation, categorySlug, selectedStrainType, selectedEffect, priceRange, selectedVendor, sortBy, vendorProducts]);

  return (
    <div 
      className="bg-[#2a2a2a] relative overflow-x-hidden overflow-y-auto max-w-full"
      style={{ minHeight: 'calc(100vh - env(safe-area-inset-top, 0px))' }}
    >
      <ProductGridAnimation />
      
      <div className="border-b border-white/10 relative">
        <div className="px-4 sm:px-6 md:px-8 pt-20 pb-6 sm:py-8 md:pt-24 md:pb-12 max-w-[2000px] mx-auto relative z-10">
          <div className="flex items-baseline gap-2.5 mb-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-normal uppercase tracking-[0.15em] sm:tracking-[0.25em] text-white">
              Products
            </h1>
            <span className="text-[11px] font-medium tracking-[0.12em] uppercase text-white/40">
              {products.length} Items
            </span>
          </div>
          <div className="h-[1px] w-16 bg-white/20 mb-6"></div>
          
          {/* Vendor Filter */}
          <div className="mb-6 pb-6 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs uppercase tracking-[0.2em] text-white/60">Shop By Vendor</h3>
              <Link 
                href="/vendors"
                className="text-[10px] uppercase tracking-wider text-white/60 hover:text-white transition-colors flex items-center gap-1"
              >
                View All Vendors
                <ArrowRight size={12} />
              </Link>
            </div>
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
              <button
                onClick={() => setSelectedVendor(null)}
                className={`px-4 py-2.5 text-xs uppercase tracking-[0.15em] transition-all whitespace-nowrap flex-shrink-0 ${
                  !selectedVendor
                    ? 'bg-white text-black border border-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                All Products
              </button>
              {vendors.map((vendor: any) => (
                <button
                  key={vendor.slug}
                  onClick={() => setSelectedVendor(vendor.slug)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-[0.15em] transition-all whitespace-nowrap flex-shrink-0 ${
                    selectedVendor === vendor.slug
                      ? 'bg-white text-black border border-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  <img src={vendor.logo} alt={vendor.name} className="w-5 h-5 object-contain opacity-80" />
                  {vendor.name}
                </button>
              ))}
            </div>
          </div>

          {/* Category Tabs */}
          <nav className="flex items-center gap-6 sm:gap-8 md:gap-10 text-[11px] sm:text-xs overflow-x-auto scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
            <button 
              onClick={() => setCategorySlug(undefined)}
              className={`pb-3 whitespace-nowrap flex-shrink-0 uppercase tracking-[0.15em] transition-all ${!categorySlug ? 'border-b-2 border-white font-medium text-white' : 'text-white/50 hover:text-white/80 font-normal'}`}
            >
              All
            </button>
            {categories.map((category: any) => (
              <button
                key={category.id}
                onClick={() => setCategorySlug(category.slug)}
                className={`pb-3 whitespace-nowrap flex-shrink-0 uppercase tracking-[0.15em] transition-all ${categorySlug === category.slug ? 'border-b-2 border-white font-medium text-white' : 'text-white/50 hover:text-white/80 font-normal'}`}
              >
                {category.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="border-b border-white/10 relative">
        <div className="absolute inset-0 bg-[#2a2a2a]/30 backdrop-blur-sm"></div>
        <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 max-w-[2000px] mx-auto relative z-50">
          <div className="flex items-center justify-between gap-2 relative z-50">
            <LocationDropdown
              locations={locations}
              selectedLocation={selectedLocation}
              onLocationChange={setSelectedLocation}
            />
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2 sm:px-2.5 py-1.5 sm:py-2 bg-white/5 border border-white/10 text-[10px] sm:text-[11px] uppercase tracking-wider text-white/60 hover:bg-white/10 hover:text-white transition-all cursor-pointer focus:outline-none focus:border-white/30 rounded"
            >
              <option value="default">Default</option>
              <option value="name">A-Z</option>
              <option value="price-asc">Low-High</option>
              <option value="price-desc">High-Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-[2000px] mx-auto relative">
        {products.length === 0 ? (
          <div className="text-center py-32 animate-fadeIn px-6 relative z-10">
            <p className="text-sm font-light text-white/40 tracking-wide uppercase">
              No products available
            </p>
            {selectedLocation && (
              <button
                onClick={() => setSelectedLocation(null)}
                className="mt-6 text-[11px] text-white border-b border-white/20 hover:border-white pb-0.5 transition-all uppercase tracking-[0.15em] font-light"
              >
                View All Locations
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-px relative z-10">
            {products.map((product: any, index: number) => {
              const vendorInfo = product.vendor ? {
                name: product.vendor.store_name || product.vendor.name,
                logo: product.vendor.logo_url || product.vendor.logo || '/yacht-club-logo.png',
                slug: product.vendorSlug
              } : undefined;
              
              return (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  index={index} 
                  locations={locations}
                  pricingTiers={product.pricingTiers || []}
                  productFields={{ fields: product.fields || {} }}
                  inventory={product.inventory || []}
                  vendorInfo={vendorInfo}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ProductsClient);
