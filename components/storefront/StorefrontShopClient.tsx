"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { MapPin, ChevronDown, Check } from "lucide-react";
import Link from "next/link";
import StorefrontProductCard from "./StorefrontProductCard";

interface StorefrontShopClientProps {
  vendorId: string;
  config?: {
    page_title?: string;
    page_subtitle?: string;
    grid_columns?: number;
    grid_gap?: string;
    
    // Card Container
    card_bg?: string;
    card_padding?: string;
    card_radius?: string;
    card_border_width?: string;
    card_border_color?: string;
    card_hover_bg?: string;
    
    // Image
    image_aspect?: string;
    image_bg?: string;
    image_fit?: string;
    image_padding?: string;
    image_spacing?: string;
    image_radius?: string;
    image_border_width?: string;
    image_border_color?: string;
    
    // Info Section
    info_bg?: string;
    info_padding?: string;
    name_color?: string;
    price_color?: string;
    field_label_color?: string;
    field_value_color?: string;
    
    // Display Options
    show_quick_add?: boolean;
    show_stock_badge?: boolean;
    show_pricing_tiers?: boolean;
    show_product_fields?: boolean;
    show_hover_overlay?: boolean;
    show_categories?: boolean;
    show_location_filter?: boolean;
    show_sort?: boolean;
  };
}

export function StorefrontShopClient({ vendorId, config }: StorefrontShopClientProps) {
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [vendorSlug, setVendorSlug] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("default");
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const dataFetched = useRef(false);

  // Fetch data using same endpoint as Yacht Club
  useEffect(() => {
    if (dataFetched.current) return;
    dataFetched.current = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Use bulk endpoint - same as Yacht Club
        const response = await fetch('/api/page-data/products');
        const result = await response.json();
        
        if (result.success) {
          const apiProducts = result.data.products || [];
          const apiVendors = result.data.vendors || [];
          
          // Get vendor slug
          const vendor = apiVendors.find((v: any) => v.id === vendorId);
          if (vendor) {
            setVendorSlug(vendor.slug);
          }
          
          // Filter to only this vendor's products
          const vendorProducts = apiProducts.filter((p: any) => p.vendor_id === vendorId);
          
          // Map to component format
          const mappedProducts = vendorProducts.map((p: any) => {
            const imageUrl = p.featured_image_storage || 
                            (p.image_gallery_storage && p.image_gallery_storage[0]);
            
            return {
              id: p.id,
              name: p.name,
              slug: p.slug,
              price: p.price,
              regular_price: p.regular_price,
              sale_price: p.sale_price,
              images: imageUrl ? [{ src: imageUrl, id: 0, name: p.name }] : [],
              stock_quantity: p.stock_quantity,
              stock_status: p.stock_status,
              inventory: p.inventory || [],
              total_stock: p.total_stock,
              categories: p.categories || [],
              pricingTiers: p.pricing_tiers || [],
              fields: p.fields || {},
              date_created: p.date_created,
              total_sales: p.total_sales,
            };
          });
          
          setAllProducts(mappedProducts);
          setLocations(result.data.locations || []);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [vendorId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Extract unique categories from products
  const categories = useMemo(() => {
    const categoryMap = new Map();
    
    allProducts.forEach((product) => {
      if (product.categories && Array.isArray(product.categories)) {
        product.categories.forEach((cat: any) => {
          if (cat && cat.slug && !categoryMap.has(cat.slug)) {
            categoryMap.set(cat.slug, {
              id: cat.id,
              name: cat.name,
              slug: cat.slug
            });
          }
        });
      }
    });
    
    return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [allProducts]);

  // Filter active locations
  const activeLocations = useMemo(
    () => locations.filter((loc: any) => loc.is_active === "1" || loc.is_active === 1 || loc.is_active === true),
    [locations]
  );

  const selectedLocationData = activeLocations.find(
    (loc: any) => loc.id?.toString() === selectedLocation
  );

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = allProducts;
    
    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((product: any) => {
        return product.categories?.some((cat: any) => cat.slug === selectedCategory);
      });
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
  }, [allProducts, selectedCategory, selectedLocation, sortBy]);

  if (loading) {
    return (
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 text-center">
        <p className="text-white/60 text-lg font-light">Loading products...</p>
      </div>
    );
  }

  // Get selected category name for breadcrumb
  const selectedCategoryName = categories.find(c => c.slug === selectedCategory)?.name;

  // Apply config settings
  const gridCols = config?.grid_columns || 3;
  const gridClass = gridCols === 2 ? 'grid-cols-1 md:grid-cols-2' :
                    gridCols === 4 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' :
                    'grid-cols-2 md:grid-cols-3'; // default 3
  
  const gridGap = config?.grid_gap || 'md';
  const gapClass = gridGap === 'none' ? 'gap-0' :
                   gridGap === 'sm' ? 'gap-2' :
                   gridGap === 'md' ? 'gap-4' :
                   gridGap === 'lg' ? 'gap-6' :
                   gridGap === 'xl' ? 'gap-8' : 'gap-4';

  return (
    <>
      {/* Breadcrumb Navigation */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-3">
          <nav className="flex items-center gap-x-2 text-xs uppercase tracking-wider overflow-x-auto scrollbar-hide">
            <Link
              href="/storefront"
              className="text-white/40 hover:text-white transition-colors whitespace-nowrap"
            >
              Home
            </Link>
            <span className="text-white/20">/</span>
            <Link
              href="/storefront/shop"
              className="text-white/40 hover:text-white transition-colors whitespace-nowrap"
            >
              Shop
            </Link>
            {selectedCategory && selectedCategoryName && (
              <>
                <span className="text-white/20">/</span>
                <span className="text-white/60 font-medium">{selectedCategoryName}</span>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-0 sm:px-6 lg:px-10 py-16">
      <div className="mb-12 px-6 sm:px-0">
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-2 uppercase tracking-[-0.03em]">
            {config?.page_title || 'Shop All'}
          </h1>
          {(config?.page_subtitle || filteredProducts.length > 0) && (
            <p className="text-lg sm:text-xl text-neutral-400 font-light tracking-wide">
              {config?.page_subtitle || `${filteredProducts.length} ${filteredProducts.length === 1 ? 'Product' : 'Products'}`}
            </p>
          )}
        </div>

        {/* Filter Bar - Location & Sort */}
        {(config?.show_location_filter !== false || config?.show_sort !== false) && (
          <div className="flex items-center gap-3 mb-8 max-w-xl">
            {/* Location Dropdown */}
            {config?.show_location_filter !== false && (
              <div className="relative flex-1 min-w-0" ref={locationDropdownRef}>
            <button
              onClick={() => setIsLocationOpen(!isLocationOpen)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 border border-white/20 hover:border-white rounded-full text-xs uppercase tracking-wider text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <MapPin size={14} strokeWidth={2} className="text-white/60 flex-shrink-0" />
              <span className="flex-1 text-center truncate">
                {selectedLocationData ? selectedLocationData.name : "All Locations"}
              </span>
              <ChevronDown
                size={14}
                strokeWidth={2}
                className={`text-white/60 transition-transform duration-300 flex-shrink-0 ${
                  isLocationOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isLocationOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 min-w-[250px] bg-black/90 backdrop-blur-xl shadow-2xl border border-white/20 rounded-[20px] z-[999] animate-fadeIn overflow-hidden">
                <div className="p-2">
                  <button
                    onClick={() => {
                      setSelectedLocation(null);
                      setIsLocationOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-[16px] hover:bg-white/10 transition-colors duration-200 text-left group"
                  >
                    <div className="flex items-center space-x-3">
                      <MapPin size={14} strokeWidth={2} className="text-white/60 group-hover:text-white transition-colors" />
                      <span className="text-xs font-medium uppercase tracking-wider text-white">All Locations</span>
                    </div>
                    {!selectedLocation && (
                      <Check size={14} strokeWidth={2} className="text-white" />
                    )}
                  </button>

                  <div className="h-px bg-white/10 my-1"></div>

                  {activeLocations.map((location: any) => (
                    <button
                      key={location.id}
                      onClick={() => {
                        setSelectedLocation(location.id.toString());
                        setIsLocationOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-[16px] hover:bg-white/10 transition-colors duration-200 text-left group"
                    >
                      <div className="flex items-center space-x-3">
                        <MapPin size={14} strokeWidth={2} className="text-white/60 group-hover:text-white transition-colors" />
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-white">{location.name}</p>
                          {(location.city || location.state) && (
                            <p className="text-[10px] text-white/50 font-light tracking-wide mt-0.5">
                              {location.city}
                              {location.city && location.state && ", "}
                              {location.state}
                            </p>
                          )}
                        </div>
                      </div>
                      {selectedLocation === location.id.toString() && (
                        <Check size={14} strokeWidth={2} className="text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
              </div>
            )}

            {/* Sort Dropdown */}
            {config?.show_sort !== false && (
              <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="flex-1 min-w-0 px-4 py-2.5 bg-white/5 border border-white/20 rounded-full text-xs uppercase tracking-wider text-white hover:bg-white/10 transition-all cursor-pointer focus:outline-none focus:border-white appearance-none text-center"
          >
            <option value="default">Default</option>
            <option value="name">A-Z</option>
            <option value="price-asc">Low-High</option>
            <option value="price-desc">High-Low</option>
              </select>
            )}
          </div>
        )}

        {/* Category Tabs */}
        {config?.show_categories !== false && categories.length > 0 && (
          <nav className="flex items-center gap-4 overflow-x-auto scrollbar-hide -mx-6 px-6 sm:mx-0 sm:px-0">
            <button 
              onClick={() => setSelectedCategory(null)}
              className={`pb-3 px-2 whitespace-nowrap flex-shrink-0 uppercase tracking-[0.15em] text-sm transition-all ${
                !selectedCategory 
                  ? 'border-b-2 border-white font-semibold text-white' 
                  : 'text-neutral-400 hover:text-white font-light'
              }`}
            >
              All
            </button>
            {categories.map((category: any) => (
              <button
                key={category.slug}
                onClick={() => setSelectedCategory(category.slug)}
                className={`pb-3 px-2 whitespace-nowrap flex-shrink-0 uppercase tracking-[0.15em] text-sm transition-all ${
                  selectedCategory === category.slug 
                    ? 'border-b-2 border-white font-semibold text-white' 
                    : 'text-neutral-400 hover:text-white font-light'
                }`}
              >
                {category.name}
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-white/60 text-lg font-light">No products available at the moment.</p>
        </div>
      ) : (
        <div className={`grid ${gapClass} ${gridClass}`}>
          {filteredProducts.map((product: any) => (
            <StorefrontProductCard 
              key={product.id} 
              product={product}
              vendorSlug={vendorSlug}
              locations={locations}
              config={config}
            />
          ))}
        </div>
      )}
      </div>
    </>
  );
}

