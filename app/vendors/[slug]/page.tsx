"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import { ArrowLeft, Star, MapPin, Calendar, CheckCircle, ArrowRight, Award, Package, Search, SlidersHorizontal, Grid3x3, List } from "lucide-react";
import { getVendorBySlug, getVendorProducts } from '@/lib/supabase-api';

const VendorWhaleAnimation = dynamic(() => import("@/components/VendorWhaleAnimation"), { ssr: false });

export default function VendorStorefront() {
  const [vendor, setVendor] = useState<any>(null);
  const [vendorProducts, setVendorProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [stockFilter, setStockFilter] = useState('all');

  useEffect(() => {
    async function loadVendor() {
      try {
        setLoading(true);
        // Get slug from URL
        const slug = window.location.pathname.split('/').pop();
        
        if (!slug) {
          setLoading(false);
          return;
        }

        console.log('🔵 Loading vendor storefront:', slug);
        
        // Fetch vendor data from Supabase with inventory
        const response = await fetch(`/api/vendor-storefront/${slug}`);
        const vendorData = await response.json();
        
        console.log('🔵 Vendor data received:', vendorData);
        
        if (!vendorData.success) {
          console.error('❌ Vendor not found');
          setLoading(false);
          return;
        }
        
        console.log('🔵 Products from API:', vendorData.products.length);
        console.log('🔵 Products list:', vendorData.products.map((p: any) => `${p.name} (stock: ${p.total_stock || p.stock_quantity})`));
        
        // Map vendor data from Supabase
        setVendor({
          id: vendorData.vendor.id,
          name: vendorData.vendor.name,
          slug: vendorData.vendor.slug,
          logo: vendorData.vendor.logo_url || '/yacht-club-logo.png',
          banner: vendorData.vendor.banner_url || '',
          tagline: vendorData.vendor.store_tagline || '',
          about: vendorData.vendor.description || `${vendorData.vendor.name} is a verified vendor on Yacht Club marketplace.`,
          primaryColor: vendorData.vendor.brand_colors?.primary || '#0EA5E9',
          location: vendorData.vendor.state || 'North Carolina',
          joinedDate: vendorData.vendor.created_at,
          rating: 0,
          totalReviews: 0,
          verified: true,
          website: vendorData.vendor.social_links?.website || '',
          instagram: vendorData.vendor.social_links?.instagram || '',
          productCount: vendorData.products.length,
          fontFamily: 'inherit',
          useBrackets: false
        });

        // Set products with live inventory (already in vendorData)
        const productsWithStock = vendorData.products.map((p: any) => ({
          ...p,
          images: p.featured_image_storage ? [{ src: p.featured_image_storage }] : 
                 p.featured_image ? [{ src: p.featured_image }] : [],
          categories: p.product_categories?.map((pc: any) => pc.category) || [],
          stock_quantity: p.total_stock || p.stock_quantity || 0,
          stock_status: p.stock_status
        }));
        
        console.log('✅ Mapped products:', productsWithStock.length);
        console.log('✅ Product details:', productsWithStock.map((p: any) => ({ 
          name: p.name, 
          stock: p.stock_quantity,
          image: p.images?.[0]?.src 
        })));
        
        setVendorProducts(productsWithStock);
        setLoading(false);
      } catch (error) {
        console.error('Error loading vendor:', error);
        setLoading(false);
      }
    }
    
    loadVendor();
  }, []);

  if (loading || !vendor) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center pt-20">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  // Get unique categories from products (handle Supabase structure)
  const categories = [...new Set(vendorProducts.map((p: any) => {
    // Supabase: product_categories[{category: {name}}]
    if (p.product_categories && p.product_categories[0]?.category?.name) {
      return p.product_categories[0].category.name;
    }
    // WordPress: categories[{name}]
    if (p.categories && p.categories[0]?.name) {
      return p.categories[0].name;
    }
    // Fallback: primary_category
    if (p.primary_category?.name) {
      return p.primary_category.name;
    }
    return null;
  }))].filter(Boolean) as string[];

  // Filter products
  let filteredProducts = vendorProducts.filter((product: any) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.categories[0]?.name === selectedCategory;
    const matchesStock = stockFilter === 'all' || 
                        (stockFilter === 'instock' && product.stock_status === 'instock') ||
                        (stockFilter === 'lowstock' && product.stock_status === 'lowstock');
    return matchesSearch && matchesCategory && matchesStock;
  });
  

  // Sort products
  filteredProducts = [...filteredProducts].sort((a: any, b: any) => {
    switch (sortBy) {
      case 'price-low':
        return parseFloat(a.price) - parseFloat(b.price);
      case 'price-high':
        return parseFloat(b.price) - parseFloat(a.price);
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      default: // featured
        return 0;
    }
  });

  // Build inventory and fields maps from bulk API data
  const locations: any[] = [];
  const inventoryMap: { [key: number]: any[] } = {};
  const productFieldsMap: { [key: number]: any } = {};
  
  filteredProducts.forEach((product: any) => {
    // Map inventory from bulk API
    inventoryMap[product.id] = product.inventory || [];
    
    // Map fields from bulk API
    const fieldsObj: any = {};
    if (product.fields && Array.isArray(product.fields)) {
      product.fields.forEach((field: any) => {
        fieldsObj[field.name] = field.value;
      });
    }
    
    productFieldsMap[product.id] = { 
      fields: fieldsObj,
      pricingTiers: product.pricing_tiers || []
    };
  });

  return (
    <div 
      className="bg-[#2a2a2a] relative overflow-x-hidden overflow-y-auto max-w-full"
      style={{ minHeight: 'calc(100vh - env(safe-area-inset-top, 0px))' }}
    >
      {/* Vendor Whale Animation Background - DISABLED to prevent memory leaks */}
      {/* <VendorWhaleAnimation /> */}

      {/* Back Navigation */}
      <div className="border-b border-white/10 relative">
        <div className="absolute inset-0 bg-[#2a2a2a]/30 backdrop-blur-sm"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-4 flex items-center justify-between relative z-10">
          <Link 
            href="/vendors"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">All Vendors</span>
          </Link>
          <Link 
            href="/products"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
          >
            <span className="hidden sm:inline">Browse All Products</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Vendor Header */}
      <div className="border-b border-white/10 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#2a2a2a]/40 via-[#2a2a2a]/35 to-[#2a2a2a]/30 backdrop-blur-sm"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-12 relative z-10">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
            {/* Logo */}
            <div className="w-20 h-20 lg:w-24 lg:h-24 bg-black border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src={vendor.logo} alt={vendor.name} className="w-full h-full object-contain p-2" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl lg:text-3xl text-white tracking-wide" style={{ fontFamily: vendor.fontFamily || 'Lobster' }}>
                    {vendor.useBrackets ? `[${vendor.name.toUpperCase()}]` : vendor.name}
                  </h1>
                  {vendor.verified && (
                    <CheckCircle size={18} className="text-white/60 flex-shrink-0" />
                  )}
                </div>
                <p className="text-white/60 text-sm mb-4">{vendor.tagline}</p>
                  
                {/* Meta Info */}
                <div className="flex flex-wrap gap-3 lg:gap-4 text-xs text-white/50">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} />
                    <span>{vendor.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} />
                    <span>Joined {new Date(vendor.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
                </div>

                {/* Rating */}
                <div className="flex lg:flex-col items-center lg:items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Star size={18} className="text-white fill-white" />
                    <span className="text-white text-xl lg:text-2xl font-light">{vendor.rating}</span>
                  </div>
                  <p className="text-white/40 text-xs">{vendor.totalReviews} reviews</p>
                </div>
              </div>

              {/* About */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 mb-6">
                <p className="text-white/70 text-sm leading-relaxed break-words">
                  {vendor.about}
                </p>
              </div>

              {/* Links & Actions */}
              <div className="flex flex-wrap items-center gap-3">
                {vendor.website && (
                  <a 
                    href={vendor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white border border-white/20 hover:bg-white hover:text-black text-xs uppercase tracking-wider transition-all"
                  >
                    <span>Website</span>
                    <ArrowRight size={12} />
                  </a>
                )}
                {vendor.instagram && (
                  <a 
                    href={`https://instagram.com/${vendor.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 text-white/60 hover:text-white border border-white/10 text-xs uppercase tracking-wider transition-all"
                  >
                    <span>{vendor.instagram}</span>
                    <ArrowRight size={12} />
                  </a>
                )}
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 text-white/60 hover:text-white border border-white/10 text-xs uppercase tracking-wider transition-all"
                >
                  <span>All Products</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-[2000px] mx-auto px-4 sm:px-6 md:px-8 py-8 lg:py-12 relative z-10">
        {/* Section Header */}
        <div className="flex items-baseline gap-2.5 mb-6 pb-6 border-b border-white/10">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-normal uppercase tracking-[0.15em] sm:tracking-[0.25em] text-white">
            {vendor.name}
          </h2>
          <span className="text-[11px] font-medium tracking-[0.12em] uppercase text-white/40">
            {filteredProducts.length} Items
          </span>
        </div>

        {/* Category Tabs - Matching Main Products Page */}
        <div className="border-b border-white/10 -mx-4 sm:-mx-6">
          <div className="px-4 sm:px-6">
            <nav className="flex items-center gap-6 sm:gap-8 md:gap-10 text-[11px] sm:text-xs overflow-x-auto scrollbar-hide pb-0.5">
              <button 
                onClick={() => setSelectedCategory('all')}
                className={`pb-3 whitespace-nowrap flex-shrink-0 uppercase tracking-[0.15em] transition-all ${selectedCategory === 'all' ? 'border-b-2 border-white font-medium text-white' : 'text-white/50 hover:text-white/80 font-normal'}`}
              >
                All
              </button>
              {categories.map((category: string) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`pb-3 whitespace-nowrap flex-shrink-0 uppercase tracking-[0.15em] transition-all ${selectedCategory === category ? 'border-b-2 border-white font-medium text-white' : 'text-white/50 hover:text-white/80 font-normal'}`}
                >
                  {category}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Filter Bar - Matching Main Products Page */}
        <div className="border-b border-white/10 mb-8">
          <div className="py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              {/* Left: Search */}
              <div className="flex-1 w-full sm:w-auto relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/40 pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-white/30 transition-all rounded"
                />
              </div>

              {/* Right: Controls */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Stock Filter */}
                <select
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="flex-1 sm:flex-none px-2 sm:px-2.5 py-1.5 sm:py-2 bg-white/5 border border-white/10 text-[10px] sm:text-[11px] uppercase tracking-wider text-white/60 hover:bg-white/10 hover:text-white transition-all cursor-pointer focus:outline-none focus:border-white/30 rounded"
                >
                  <option value="all">All Stock</option>
                  <option value="instock">In Stock</option>
                  <option value="lowstock">Low Stock</option>
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 sm:flex-none px-2 sm:px-2.5 py-1.5 sm:py-2 bg-white/5 border border-white/10 text-[10px] sm:text-[11px] uppercase tracking-wider text-white/60 hover:bg-white/10 hover:text-white transition-all cursor-pointer focus:outline-none focus:border-white/30 rounded"
                >
                  <option value="featured">Featured</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price-low">Low-High</option>
                  <option value="price-high">High-Low</option>
                  <option value="name-asc">A-Z</option>
                  <option value="name-desc">Z-A</option>
                </select>
              </div>
            </div>

            {/* Active Filters Pills */}
            {(searchQuery || selectedCategory !== 'all' || sortBy !== 'featured' || stockFilter !== 'all') && (
              <div className="flex flex-wrap items-center gap-2 text-xs mt-3 pt-3 border-t border-white/5">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-2.5 py-1 bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 transition-all rounded text-[10px] uppercase tracking-wider"
                  >
                    "{searchQuery}" ×
                  </button>
                )}
                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className="px-2.5 py-1 bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 transition-all rounded text-[10px] uppercase tracking-wider"
                  >
                    {selectedCategory} ×
                  </button>
                )}
                {stockFilter !== 'all' && (
                  <button
                    onClick={() => setStockFilter('all')}
                    className="px-2.5 py-1 bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 transition-all rounded text-[10px] uppercase tracking-wider"
                  >
                    {stockFilter === 'instock' ? 'In Stock' : 'Low Stock'} ×
                  </button>
                )}
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSortBy('featured');
                    setStockFilter('all');
                  }}
                  className="px-2.5 py-1 text-white/40 hover:text-white transition-colors text-[10px] uppercase tracking-wider"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-[#1a1a1a] border border-white/10">
            <Search size={48} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/60 mb-2">
              {vendorProducts.length === 0 ? 'No products available from this vendor' : 'No products match your filters'}
            </p>
            {vendorProducts.length > 0 && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSortBy('featured');
                  setStockFilter('all');
                }}
                className="text-white/40 hover:text-white text-sm transition-colors mb-4"
              >
                Clear all filters
              </button>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link 
                href="/vendors"
                className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white border border-white/20 hover:bg-white hover:text-black text-xs uppercase tracking-wider transition-all"
              >
                <ArrowLeft size={14} />
                Browse Other Vendors
              </Link>
              <Link 
                href="/products"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 text-white/60 hover:text-white border border-white/10 text-xs uppercase tracking-wider transition-all"
              >
                View All Products
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-px bg-white/5">
            {filteredProducts.map((product: any, index: number) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                locations={locations}
                pricingTiers={productFieldsMap[product.id]?.pricingTiers || []}
                productFields={productFieldsMap[product.id]}
                inventory={inventoryMap[product.id] || []}
              />
            ))}
          </div>
        )}
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

