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

  const activeLocations = locations.filter((loc: any) => loc.is_active === "1");

  // Filter products based on selected location and category
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
        
        // Check if product has any inventory record at the selected location
        return productInventory.some((inv: any) => {
          const locationMatch = inv.location_id === parseInt(selectedLocation) || 
                               inv.location_id?.toString() === selectedLocation;
          
          // Check multiple possible stock field names and statuses
          const qty = parseFloat(inv.stock_quantity || inv.quantity || inv.stock || 0);
          const status = inv.status?.toLowerCase();
          
          // Show products that have inventory records AND either have stock OR are not marked as out of stock
          return locationMatch && (qty > 0 || status === 'instock' || status === 'in_stock');
        });
      });
    }

    setProducts(filtered);
  }, [selectedLocation, categorySlug, initialProducts, categories, inventoryMap]);

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
            {categories.slice(0, 6).map((category: any) => (
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
            <div className="flex items-center space-x-4 text-sm">
              <p className="text-[11px] text-white/50 font-normal tracking-wide">
                {selectedLocation 
                  ? `${activeLocations.find((loc: any) => loc.id.toString() === selectedLocation)?.name || "Selected"} Location`
                  : `${activeLocations.length} Locations Available`}
              </p>
            </div>
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

