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
    <div className="min-h-screen bg-[#c5c5c2]">
      {/* Header Section */}
      <div className="border-b border-[#a8a8a5] bg-[#c5c5c2]">
        <div className="px-3 md:px-4 py-6 md:py-8">
          <h1 className="text-2xl md:text-4xl font-light uppercase tracking-[0.2em] mb-4 md:mb-6">
            PRODUCTS
          </h1>
          
          {/* Category Tabs */}
          <nav className="flex items-center space-x-6 md:space-x-8 text-sm overflow-x-auto scrollbar-hide -mx-3 px-3 md:-mx-4 md:px-4">
            <button 
              onClick={() => setCategorySlug(undefined)}
              className={`pb-2 whitespace-nowrap flex-shrink-0 ${!categorySlug ? 'border-b-2 border-black' : 'hover:opacity-60 transition-opacity'}`}
            >
              View all
            </button>
            {categories.slice(0, 6).map((category: any) => (
              <button
                key={category.id}
                onClick={() => setCategorySlug(category.slug)}
                className={`pb-2 whitespace-nowrap flex-shrink-0 ${categorySlug === category.slug ? 'border-b-2 border-black' : 'hover:opacity-60 transition-opacity'}`}
              >
                {category.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="border-b border-[#a8a8a5] bg-[#c5c5c2]">
        <div className="px-3 md:px-4 py-3 md:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <p className="text-sm font-light">
                {products.length} PRODUCTS
              </p>
              <span className="text-[#cccccc] hidden sm:inline">|</span>
              <LocationDropdown
                locations={locations}
                selectedLocation={selectedLocation}
                onLocationChange={setSelectedLocation}
              />
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <p className="text-xs text-[#767676] font-light">
                {selectedLocation 
                  ? `Showing ${activeLocations.find((loc: any) => loc.id.toString() === selectedLocation)?.name || "selected"} store`
                  : `Available at ${activeLocations.length} locations`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="px-0">
        {products.length === 0 ? (
          <div className="text-center py-20 animate-fadeIn">
            <p className="text-lg font-light text-black/60">
              No products available at this location
            </p>
            <button
              onClick={() => setSelectedLocation(null)}
              className="mt-4 text-sm text-black underline hover:no-underline"
            >
              View all locations
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-px md:gap-0.5">
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

