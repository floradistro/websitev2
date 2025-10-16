"use client";

import { useState, useEffect } from "react";
import LocationDropdown from "./LocationDropdown";
import ProductCard from "./ProductCard";

interface ProductsClientProps {
  categories: any[];
  locations: any[];
  initialProducts: any[];
  inventoryMap: { [key: number]: any[] };
  initialCategory?: string;
  pricingRules: any;
  productFieldsMap: { [key: number]: any };
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

export default function ProductsClient({
  categories,
  locations,
  initialProducts,
  inventoryMap,
  initialCategory,
  pricingRules,
  productFieldsMap,
}: ProductsClientProps) {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [categorySlug, setCategorySlug] = useState<string | undefined>(initialCategory);
  const [products, setProducts] = useState(initialProducts);
  const [selectedStrainType, setSelectedStrainType] = useState<string | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("default");
  const [showFilters, setShowFilters] = useState(false);

  const activeLocations = locations.filter((loc: any) => loc.is_active === "1");

  // Filter products based on all selected filters
  useEffect(() => {
    let filtered = initialProducts;

    // Filter by category
    if (categorySlug) {
      const selectedCategory = categories.find((cat: any) => cat.slug === categorySlug);
      
      if (selectedCategory) {
        filtered = filtered.filter((product: any) => 
          product.categories?.some((cat: any) => cat.id === selectedCategory.id)
        );
      }
    }

    // Filter by location if selected
    if (selectedLocation) {
      filtered = filtered.filter((product: any) => {
        const productInventory = inventoryMap[product.id] || [];
        
        return productInventory.some((inv: any) => {
          const locationMatch = inv.location_id === parseInt(selectedLocation) || 
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

    setProducts(filtered);
  }, [selectedLocation, categorySlug, selectedStrainType, selectedEffect, priceRange, sortBy, initialProducts, categories, inventoryMap, productFieldsMap]);

  return (
    <div className="min-h-screen bg-[#2a2a2a]">
      {/* Header Section */}
      <div className="border-b border-white/10">
        <div className="px-6 md:px-8 py-8 md:py-12 max-w-[2000px] mx-auto">
          <h1 className="text-2xl md:text-3xl font-normal uppercase tracking-[0.25em] mb-6 md:mb-8 text-white">
            Products
          </h1>
          
          {/* Category Tabs */}
          <nav className="flex items-center space-x-8 md:space-x-10 text-xs overflow-x-auto scrollbar-hide -mx-6 px-6 md:-mx-8 md:px-8">
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
      <div className="border-b border-white/10">
        <div className="px-6 md:px-8 py-4 max-w-[2000px] mx-auto">
          <div className="flex flex-col gap-4">
            {/* Top row - Count, Location, and Sort */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-white/70">
                  {products.length} Items
                </p>
                <span className="text-white/20 hidden sm:inline">|</span>
                <LocationDropdown
                  locations={locations}
                  selectedLocation={selectedLocation}
                  onLocationChange={setSelectedLocation}
                />
              </div>
              
              <div className="flex items-center gap-4">
                {/* Sort Dropdown - Always Visible */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider text-white/60 hover:bg-white/10 hover:text-white transition-all cursor-pointer focus:outline-none focus:border-white/30"
                >
                  <option value="default">Default</option>
                  <option value="newest">Newest</option>
                  <option value="popularity">Popular</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name">Name: A-Z</option>
                </select>
                
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-[11px] uppercase tracking-wider text-white/60 hover:text-white transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                  </svg>
                  Filters
                </button>
              </div>
            </div>

            {/* Filter Pills Row */}
            {showFilters && (
              <div className="flex flex-wrap gap-2 pb-2 animate-fadeIn">
                {/* Strain Type */}
                <div className="flex items-center gap-1">
                  {strainTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedStrainType(selectedStrainType === type ? null : type)}
                      className={`px-3 py-1.5 text-[10px] uppercase tracking-wider transition-all ${
                        selectedStrainType === type
                          ? 'bg-white text-black'
                          : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <span className="text-white/10">|</span>

                {/* Effects */}
                <select
                  value={selectedEffect || ""}
                  onChange={(e) => setSelectedEffect(e.target.value || null)}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider text-white/60 hover:bg-white/10 hover:text-white transition-all cursor-pointer focus:outline-none focus:border-white/30"
                >
                  <option value="">All Effects</option>
                  {commonEffects.map((effect) => (
                    <option key={effect} value={effect}>
                      {effect}
                    </option>
                  ))}
                </select>

                {/* Price Range */}
                <select
                  value={priceRange || ""}
                  onChange={(e) => setPriceRange(e.target.value || null)}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 text-[10px] uppercase tracking-wider text-white/60 hover:bg-white/10 hover:text-white transition-all cursor-pointer focus:outline-none focus:border-white/30"
                >
                  <option value="">All Prices</option>
                  {priceRanges.map((range) => (
                    <option key={range.label} value={range.label}>
                      {range.label}
                    </option>
                  ))}
                </select>

                {/* Clear Filters */}
                {(selectedStrainType || selectedEffect || priceRange || sortBy !== "default") && (
                  <>
                    <span className="text-white/10">|</span>
                    <button
                      onClick={() => {
                        setSelectedStrainType(null);
                        setSelectedEffect(null);
                        setPriceRange(null);
                        setSortBy("default");
                      }}
                      className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-white/40 hover:text-white/60 transition-colors underline"
                    >
                      Clear All
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Active Filters Display */}
            {(selectedLocation || selectedStrainType || selectedEffect || priceRange) && (
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-white/40 uppercase tracking-wider">Active:</span>
                {selectedLocation && (
                  <span className="px-2 py-1 bg-white/10 text-white/60">
                    {activeLocations.find((loc: any) => loc.id.toString() === selectedLocation)?.name}
                  </span>
                )}
                {selectedStrainType && (
                  <span className="px-2 py-1 bg-white/10 text-white/60">{selectedStrainType}</span>
                )}
                {selectedEffect && (
                  <span className="px-2 py-1 bg-white/10 text-white/60">{selectedEffect}</span>
                )}
                {priceRange && (
                  <span className="px-2 py-1 bg-white/10 text-white/60">{priceRange}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-[2000px] mx-auto">
        {products.length === 0 ? (
          <div className="text-center py-32 animate-fadeIn px-6">
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-px">
            {products.map((product: any, index: number) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                index={index} 
                locations={locations}
                pricingRules={pricingRules}
                productFields={productFieldsMap[product.id]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

