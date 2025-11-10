/**
 * Smart Shop Controls
 * Exact Yacht Club marketplace design: Product count, location filter, sort, category tabs
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapPin, ChevronDown, Check } from "lucide-react";

export interface SmartShopControlsProps {
  vendorId: string;
  onCategoryChange?: (category: string | null) => void;
  onSortChange?: (sort: string) => void;
  onLocationChange?: (locationId: string | null) => void;
  className?: string;
}

export function SmartShopControls({
  vendorId,
  onCategoryChange,
  onSortChange,
  onLocationChange,
  className = "",
}: SmartShopControlsProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("default");
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch data using page-data endpoint (same as old marketplace)
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/page-data/products");
        if (res.ok) {
          const result = await res.json();
          if (result.success) {
            const products = result.data.products || [];
            const vendorProducts = products.filter(
              (p: any) => p.vendor_id === vendorId,
            );
            setAllProducts(vendorProducts);

            // Extract categories
            const categoryMap = new Map();
            vendorProducts.forEach((product: any) => {
              if (product.categories && Array.isArray(product.categories)) {
                product.categories.forEach((cat: any) => {
                  if (cat && cat.slug && !categoryMap.has(cat.slug)) {
                    categoryMap.set(cat.slug, {
                      id: cat.id,
                      name: cat.name,
                      slug: cat.slug,
                    });
                  }
                });
              }
            });
            setCategories(
              Array.from(categoryMap.values()).sort((a, b) =>
                a.name.localeCompare(b.name),
              ),
            );

            // Get locations - ONLY for this vendor (CRITICAL)
            const allLocations = result.data.locations || [];

            // Find which location IDs are actually used by this vendor's products
            const vendorLocationIds = new Set<string>();
            vendorProducts.forEach((product: any) => {
              if (product.inventory && Array.isArray(product.inventory)) {
                product.inventory.forEach((inv: any) => {
                  if (inv.location_id) {
                    vendorLocationIds.add(inv.location_id.toString());
                  }
                });
              }
            });

            // Filter to only active locations that this vendor actually uses
            const vendorLocations = allLocations.filter((loc: any) => {
              const isActive =
                loc.is_active === "1" ||
                loc.is_active === 1 ||
                loc.is_active === true;
              const isVendorLocation = vendorLocationIds.has(loc.id.toString());
              return isActive && isVendorLocation;
            });

            setLocations(vendorLocations);
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to load shop data:", err);
        }
      }
    }

    loadData();
  }, [vendorId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLocationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCategoryClick = (categorySlug: string | null) => {
    setSelectedCategory(categorySlug);
    onCategoryChange?.(categorySlug);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    onSortChange?.(sort);
  };

  const handleLocationSelect = (locationId: string | null) => {
    setSelectedLocation(locationId);
    setIsLocationOpen(false);
    onLocationChange?.(locationId);
  };

  const selectedLocationData = locations.find(
    (loc) => loc.id?.toString() === selectedLocation,
  );

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Category Tabs - Exact Yacht Club marketplace style */}
      {categories.length > 0 && (
        <nav className="flex items-center gap-4 overflow-x-auto scrollbar-hide -mx-6 px-6 sm:mx-0 sm:px-0">
          <button
            onClick={() => handleCategoryClick(null)}
            className={`pb-3 px-2 whitespace-nowrap flex-shrink-0 uppercase tracking-[0.12em] text-xs transition-all ${
              !selectedCategory
                ? "border-b-2 border-white font-black text-white"
                : "text-white/60 hover:text-white font-black"
            }`}
            style={{ fontWeight: 900 }}
          >
            All
          </button>
          {categories.map((category: any) => (
            <button
              key={category.slug}
              onClick={() => handleCategoryClick(category.slug)}
              className={`pb-3 px-2 whitespace-nowrap flex-shrink-0 uppercase tracking-[0.12em] text-xs transition-all ${
                selectedCategory === category.slug
                  ? "border-b-2 border-white font-black text-white"
                  : "text-white/60 hover:text-white font-black"
              }`}
              style={{ fontWeight: 900 }}
            >
              {category.name}
            </button>
          ))}
        </nav>
      )}

      {/* Controls Bar - Exact Yacht Club marketplace layout */}
      <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
        {/* Product Count */}
        <div className="flex-shrink-0 text-white/60 text-sm font-light">
          {allProducts.length} Products
        </div>

        {/* Location Dropdown (Vendor-specific) */}
        {locations.length > 0 && (
          <div ref={locationDropdownRef} className="relative flex-1 min-w-0">
            <button
              onClick={() => setIsLocationOpen(!isLocationOpen)}
              className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-white/5 border border-white/20 rounded-2xl text-xs uppercase tracking-wider text-white hover:bg-white/10 transition-all group"
            >
              <div className="flex items-center gap-2 truncate">
                <MapPin size={14} className="flex-shrink-0 text-white/60" />
                <span className="truncate">
                  {selectedLocationData
                    ? selectedLocationData.name
                    : "All Locations"}
                </span>
              </div>
              <ChevronDown
                size={14}
                className={`flex-shrink-0 transition-transform ${isLocationOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isLocationOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 border border-white/20 rounded-2xl overflow-hidden shadow-2xl z-[9999] backdrop-blur-xl">
                <div className="max-h-[280px] overflow-y-auto">
                  <button
                    onClick={() => handleLocationSelect(null)}
                    className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center justify-between border-b border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-white/40" />
                      <p className="text-xs font-medium uppercase tracking-wider text-white">
                        All Locations
                      </p>
                    </div>
                    {!selectedLocation && (
                      <Check size={14} strokeWidth={2} className="text-white" />
                    )}
                  </button>

                  {locations.map((location: any) => (
                    <button
                      key={location.id}
                      onClick={() =>
                        handleLocationSelect(location.id.toString())
                      }
                      className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin size={16} className="text-white/40" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-wider text-white">
                            {location.name}
                          </p>
                          {(location.city || location.state) && (
                            <p className="text-[10px] text-white/50 font-light tracking-wide mt-0.5 truncate">
                              {location.city}
                              {location.city && location.state && ", "}
                              {location.state}
                            </p>
                          )}
                        </div>
                      </div>
                      {selectedLocation === location.id.toString() && (
                        <Check
                          size={14}
                          strokeWidth={2}
                          className="text-white"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          className="flex-1 min-w-0 px-4 py-2.5 bg-white/5 border border-white/20 rounded-2xl text-xs uppercase tracking-wider text-white hover:bg-white/10 transition-all cursor-pointer focus:outline-none focus:border-white appearance-none text-center"
        >
          <option value="default">Default</option>
          <option value="name">A-Z</option>
          <option value="price-asc">Price: Low-High</option>
          <option value="price-desc">Price: High-Low</option>
        </select>
      </div>
    </div>
  );
}
