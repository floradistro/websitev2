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
  initialProducts: any[];
  inventoryMap: { [key: number]: any[] };
  initialCategory?: string;
  productFieldsMap: { [key: number]: any };
  vendorProducts?: any[];
  vendors?: any[];
}

// Move static data outside component to prevent re-creation
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
  initialProducts,
  inventoryMap,
  initialCategory,
  productFieldsMap,
  vendorProducts = [],
  vendors = [],
}: ProductsClientProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [categorySlug, setCategorySlug] = useState<string | undefined>(initialCategory);
  const [selectedStrainType, setSelectedStrainType] = useState<string | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("default");
  const [showFilters, setShowFilters] = useState(false);

  const activeLocations = useMemo(
    () => locations.filter((loc: any) => loc.is_active === "1"),
    [locations]
  );

  // Optimized filter and sort with useMemo to prevent unnecessary recalculations
  const products = useMemo(() => {
    // Combine Flora products with vendor products
    let allProducts = [...initialProducts, ...vendorProducts];
    let filtered = allProducts;

    // Filter by category
    if (categorySlug) {
      const selectedCategory = categories.find((cat: any) => cat.slug === categorySlug);
      
      if (selectedCategory) {
        filtered = filtered.filter((product: any) => 
          product.categories?.some((cat: any) => 
            parseInt(cat.id) === parseInt(selectedCategory.id) || cat.slug === categorySlug
          )
        );
      }
    }

    // Filter by location if selected
    if (selectedLocation) {
      filtered = filtered.filter((product: any) => {
        const productInventory = inventoryMap[product.id] || [];
        
        return productInventory.some((inv: any) => {
          const locationMatch = parseInt(inv.location_id) === parseInt(selectedLocation) || 
                               inv.location_id?.toString() === selectedLocation;
          
          const qty = parseFloat(inv.stock_quantity || inv.quantity || inv.stock || 0);
          const status = inv.status?.toLowerCase();
          
          return locationMatch && (qty > 0 || status === 'instock' || status === 'in_stock');
        });
      });
    }

    // Filter by strain type
    if (selectedStrainType) {
      filtered = filtered.filter((product: any) => {
        const fields = productFieldsMap[product.id]?.fields || {};
        const strainType = fields['strain_type'] || '';
        return strainType.toLowerCase().includes(selectedStrainType.toLowerCase());
      });
    }

    // Filter by effect
    if (selectedEffect) {
      filtered = filtered.filter((product: any) => {
        const fields = productFieldsMap[product.id]?.fields || {};
        const effects = (fields['effects'] || fields['effect'] || '').toLowerCase();
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

    // Filter by vendor
    if (selectedVendor === 'flora') {
      // Show only Flora products (no vendorId)
      filtered = filtered.filter((product: any) => !product.vendorId);
    } else if (selectedVendor && selectedVendor !== null) {
      // Show only selected vendor's products
      filtered = filtered.filter((product: any) => product.vendorSlug === selectedVendor);
    }
    // If selectedVendor is null, show ALL products (Flora + all vendors) - no filter needed

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
    } else if (sortBy === "newest") {
      filtered = [...filtered].sort((a: any, b: any) => 
        new Date(b.date_created || 0).getTime() - new Date(a.date_created || 0).getTime()
      );
    } else if (sortBy === "popularity") {
      filtered = [...filtered].sort((a: any, b: any) => 
        (b.total_sales || 0) - (a.total_sales || 0)
      );
    }

    return filtered;
  }, [selectedLocation, categorySlug, selectedStrainType, selectedEffect, priceRange, selectedVendor, sortBy, initialProducts, vendorProducts, categories, inventoryMap, productFieldsMap]);

  return (
    <div 
      className="bg-[#2a2a2a] relative overflow-x-hidden overflow-y-auto max-w-full"
      style={{ minHeight: 'calc(100vh - env(safe-area-inset-top, 0px))' }}
    >
      {/* Product Grid Animation Background */}
      <ProductGridAnimation />
      
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
      {/* Header Section */}
      <div className="border-b border-white/10 relative">
        <div className="px-4 sm:px-6 md:px-8 pt-20 pb-6 sm:py-8 md:pt-24 md:pb-12 max-w-[2000px] mx-auto relative z-10">
          {/* Title with Item Count */}
          <div className="flex items-baseline gap-2.5 mb-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-normal uppercase tracking-[0.15em] sm:tracking-[0.25em] text-white">
              Products
            </h1>
            <span className="text-[11px] font-medium tracking-[0.12em] uppercase text-white/40">
              {products.length} Items
            </span>
          </div>
          <div className="h-[1px] w-16 bg-white/20 mb-6"></div>
          
          {/* Vendor Filter - MAIN FEATURE - Always Visible */}
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
              <button
                onClick={() => setSelectedVendor('flora')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-[0.15em] transition-all whitespace-nowrap flex-shrink-0 ${
                  selectedVendor === 'flora'
                    ? 'bg-white text-black border border-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                <img src="/logoprint.png" alt="Flora" className="w-5 h-5 object-contain opacity-80" />
                Flora Distro
              </button>
              {vendors.map((vendor: any) => {
                let fontFamily = 'inherit';
                let displayName = vendor.name;
                
                if (selectedVendor === vendor.slug) {
                  if (vendor.id === 1) fontFamily = 'Lobster';
                  else if (vendor.id === 2) fontFamily = 'Monkey Act';
                  else if (vendor.id === 3) {
                    fontFamily = 'monospace';
                    displayName = `[${vendor.name.toUpperCase()}]`;
                  }
                }
                
                return (
                  <button
                    key={vendor.slug}
                    onClick={() => setSelectedVendor(vendor.slug)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-[0.15em] transition-all whitespace-nowrap flex-shrink-0 ${
                      selectedVendor === vendor.slug
                        ? 'bg-white text-black border border-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                    }`}
                    style={{ fontFamily }}
                  >
                    <img src={vendor.logo} alt={vendor.name} className="w-5 h-5 object-contain" />
                    {displayName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Tabs - Edge to Edge on Mobile */}
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

      {/* Filter Bar - Compact Single Row */}
      <div className="border-b border-white/10 relative">
        <div className="absolute inset-0 bg-[#2a2a2a]/30 backdrop-blur-sm"></div>
        <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-4 max-w-[2000px] mx-auto relative z-50">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Single Row - All Controls */}
            <div className="flex items-center justify-between gap-2 relative z-50">
              {/* Location Dropdown */}
              <LocationDropdown
                locations={locations}
                selectedLocation={selectedLocation}
                onLocationChange={setSelectedLocation}
              />
              
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 sm:px-2.5 py-1.5 sm:py-2 bg-white/5 border border-white/10 text-[10px] sm:text-[11px] uppercase tracking-wider text-white/60 hover:bg-white/10 hover:text-white transition-all cursor-pointer focus:outline-none focus:border-white/30 rounded"
              >
                <option value="default">Default</option>
                <option value="newest">Newest</option>
                <option value="popularity">Popular</option>
                <option value="price-asc">Low-High</option>
                <option value="price-desc">High-Low</option>
                <option value="name">A-Z</option>
              </select>
              
              {/* Filters Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`text-[11px] uppercase tracking-wider transition-colors flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 sm:py-2 rounded flex-shrink-0 ${showFilters ? 'text-white bg-white/5' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                aria-label="Toggle filters"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                </svg>
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>

            {/* Filter Pills Row - Compact Mobile Layout */}
            {showFilters && (
              <div className="space-y-2.5 pb-2 animate-fadeIn">
                {/* Strain Type - Horizontal Scroll on Mobile */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
                  {strainTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedStrainType(selectedStrainType === type ? null : type)}
                      className={`px-2.5 sm:px-3 py-1.5 text-[11px] uppercase tracking-wide transition-all whitespace-nowrap flex-shrink-0 rounded ${
                        selectedStrainType === type
                          ? 'bg-white text-black'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Effects and Price - Side by Side */}
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedEffect || ""}
                    onChange={(e) => setSelectedEffect(e.target.value || null)}
                    className="px-2 sm:px-2.5 py-1.5 bg-white/5 border border-white/10 text-[11px] uppercase tracking-wide text-white/60 hover:bg-white/10 hover:text-white transition-all cursor-pointer focus:outline-none focus:border-white/30 rounded"
                  >
                    <option value="">All Effects</option>
                    {commonEffects.map((effect) => (
                      <option key={effect} value={effect}>
                        {effect}
                      </option>
                    ))}
                  </select>

                  <select
                    value={priceRange || ""}
                    onChange={(e) => setPriceRange(e.target.value || null)}
                    className="px-2 sm:px-2.5 py-1.5 bg-white/5 border border-white/10 text-[11px] uppercase tracking-wide text-white/60 hover:bg-white/10 hover:text-white transition-all cursor-pointer focus:outline-none focus:border-white/30 rounded"
                  >
                    <option value="">All Prices</option>
                    {priceRanges.map((range) => (
                      <option key={range.label} value={range.label}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                {(selectedStrainType || selectedEffect || priceRange || sortBy !== "default") && (
                  <button
                    onClick={() => {
                      setSelectedStrainType(null);
                      setSelectedEffect(null);
                      setPriceRange(null);
                      setSortBy("default");
                    }}
                    className="text-[11px] uppercase tracking-wide text-white/40 hover:text-white/60 transition-colors underline"
                  >
                    Clear All
                  </button>
                )}
              </div>
            )}

            {/* Active Filters Display - Horizontal Scroll on Mobile */}
            {(selectedLocation || selectedStrainType || selectedEffect || priceRange) && !showFilters && (
              <div className="flex items-center gap-2 text-[11px] overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                <span className="text-white/40 uppercase tracking-wide whitespace-nowrap">Active:</span>
                {selectedLocation && (
                  <span className="px-2 py-0.5 bg-white/10 text-white/60 rounded whitespace-nowrap text-[10px] sm:text-[11px]">
                    {activeLocations.find((loc: any) => loc.id.toString() === selectedLocation)?.name}
                  </span>
                )}
                {selectedStrainType && (
                  <span className="px-2 py-0.5 bg-white/10 text-white/60 rounded whitespace-nowrap text-[10px] sm:text-[11px]">{selectedStrainType}</span>
                )}
                {selectedEffect && (
                  <span className="px-2 py-0.5 bg-white/10 text-white/60 rounded whitespace-nowrap text-[10px] sm:text-[11px]">{selectedEffect}</span>
                )}
                {priceRange && (
                  <span className="px-2 py-0.5 bg-white/10 text-white/60 rounded whitespace-nowrap text-[10px] sm:text-[11px]">{priceRange}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-[2000px] mx-auto relative">
        {products.length === 0 ? (
          <div className="text-center py-32 animate-fadeIn px-6 relative z-10">
            <p className="text-sm font-light text-white/40 tracking-wide uppercase">
              No products available at this location
            </p>
            <button
              onClick={() => setSelectedLocation(null)}
              className="mt-6 text-[11px] text-white border-b border-white/20 hover:border-white pb-0.5 transition-all uppercase tracking-[0.15em] font-light"
            >
              View All Locations
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-px relative z-10">
            {products.map((product: any, index: number) => {
              // Get vendor info if product is from a vendor
              const vendorInfo = product.vendorId ? vendors.find((v: any) => v.id === product.vendorId) : null;
              
              return (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  index={index} 
                  locations={locations}
                  pricingTiers={productFieldsMap[product.id]?.pricingTiers || []}
                  productFields={productFieldsMap[product.id]}
                  inventory={inventoryMap[product.id] || []}
                  vendorInfo={vendorInfo ? {
                    name: vendorInfo.name,
                    logo: vendorInfo.logo,
                    slug: vendorInfo.slug
                  } : undefined}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders when parent re-renders
export default memo(ProductsClient);

