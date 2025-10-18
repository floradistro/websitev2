"use client";

import { useEffect, useState } from 'react';
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import { ArrowLeft, Star, MapPin, Calendar, CheckCircle, ArrowRight, Award, Package, Search, SlidersHorizontal, Grid3x3, List } from "lucide-react";

// Mock vendor data - will be from API later
const vendors: any = {
  'yacht-club': {
    id: 1,
    name: 'Yacht Club',
    slug: 'yacht-club',
    logo: '/yachtclub.png',
    banner: '',
    tagline: 'Premium Cannabis from the Coast',
    about: 'Yacht Club brings you premium coastal cannabis cultivated with the same attention to detail as a luxury yacht. Every product is carefully crafted, lab tested by Quantix Analytics, and delivered with the highest standards of quality and service.',
    primaryColor: '#0EA5E9',
    location: 'Newport Beach, CA',
    joinedDate: '2025-08-01',
    rating: 4.9,
    totalReviews: 47,
    verified: true,
    website: 'https://yachtclubcannabis.com',
    instagram: '@yachtclubcannabis',
    productIds: [50001, 50002, 50003, 50004, 50005, 50006, 50007, 50008, 50009],
    fontFamily: 'Lobster'
  },
  'cannaboyz': {
    id: 2,
    name: 'CannaBoyz',
    slug: 'cannaboyz',
    logo: '/CannaBoyz.png',
    banner: '',
    tagline: 'Street Certified, Lab Tested',
    about: 'CannaBoyz is bringing authentic street culture to the legal cannabis market. Based in LA, we source the realest cuts and provide lab-tested quality without the boutique price tag. Every product is grown with passion and tested by Quantix Analytics for your safety.',
    primaryColor: '#10B981',
    location: 'Los Angeles, CA',
    joinedDate: '2025-09-15',
    rating: 4.8,
    totalReviews: 38,
    verified: true,
    website: 'https://cannaboyz.com',
    instagram: '@cannaboyz',
    productIds: [60001, 60002, 60003, 60004, 60005, 60006],
    fontFamily: 'Monkey Act'
  },
  'moonwater': {
    id: 3,
    name: 'Moonwater',
    slug: 'moonwater',
    logo: '/moonwater.png',
    banner: '',
    tagline: 'Premium THC Beverages',
    about: 'Moonwater crafts premium THC-infused beverages for the modern cannabis consumer. Our drinks feature precise 10mg dosing, zero calories, and fast-acting nano-emulsion technology. Based in San Diego, we\'re redefining cannabis consumption with clean ingredients and sophisticated flavors.',
    primaryColor: '#1e40af',
    location: 'San Diego, CA',
    joinedDate: '2025-07-20',
    rating: 4.9,
    totalReviews: 52,
    verified: true,
    website: 'https://trymoonwater.com',
    instagram: '@moonwater',
    productIds: [70001, 70002, 70003, 70004],
    fontFamily: 'monospace',
    useBrackets: true
  },
  'zarati': {
    id: 4,
    name: 'Zarati',
    slug: 'zarati',
    logo: '/zarati.png',
    banner: '',
    tagline: 'Exotic Genetics, Premium Quality',
    about: 'Zarati specializes in rare exotic genetics and premium indoor cultivation. Based in Oakland, we hunt the latest hype strains and bring them to market with meticulous care. Every batch is small-batch, hand-trimmed, and lab tested by Quantix Analytics for maximum potency and purity.',
    primaryColor: '#8b5cf6',
    location: 'Oakland, CA',
    joinedDate: '2025-09-01',
    rating: 4.7,
    totalReviews: 29,
    verified: true,
    website: 'https://zarati.com',
    instagram: '@zaraticannabis',
    productIds: [80001, 80002, 80003, 80004, 80005],
    fontFamily: 'inherit'
  }
};

export default function VendorStorefront() {
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [stockFilter, setStockFilter] = useState('all');

  useEffect(() => {
    // Get slug from URL
    const slug = window.location.pathname.split('/').pop();
    const vendorData = vendors[slug || 'yacht-club'];
    setVendor(vendorData);
    setLoading(false);
  }, []);

  if (loading || !vendor) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  // Mock product data based on vendor - using vendor logo as placeholder
  const productsByVendor: any = {
    'yacht-club': [
      { id: 50001, name: 'OG Kush', price: '15.99', images: [{ src: vendor.logo }], categories: [{ name: 'Flower' }], meta_data: [], stock_status: 'instock', rating: 4.9 },
      { id: 50002, name: 'Blue Dream', price: '14.99', images: [{ src: vendor.logo }], categories: [{ name: 'Flower' }], meta_data: [], stock_status: 'instock', rating: 4.8 },
      { id: 50003, name: 'Sour Diesel', price: '16.99', images: [{ src: vendor.logo }], categories: [{ name: 'Flower' }], meta_data: [], stock_status: 'instock', rating: 5.0 },
      { id: 50004, name: 'Girl Scout Cookies', price: '17.99', images: [{ src: vendor.logo }], categories: [{ name: 'Flower' }], meta_data: [], stock_status: 'instock', rating: 4.9 },
      { id: 50005, name: 'Gelato', price: '18.99', images: [{ src: vendor.logo }], categories: [{ name: 'Flower' }], meta_data: [], stock_status: 'instock', rating: 4.7 },
      { id: 50006, name: 'Sunset Sherbet', price: '17.99', images: [{ src: vendor.logo }], categories: [{ name: 'Flower' }], meta_data: [], stock_status: 'lowstock', rating: 4.8 },
      { id: 50007, name: 'Purple Punch', price: '16.99', images: [{ src: vendor.logo }], categories: [{ name: 'Flower' }], meta_data: [], stock_status: 'instock', rating: 4.9 },
      { id: 50008, name: 'Zkittlez', price: '15.99', images: [{ src: vendor.logo }], categories: [{ name: 'Flower' }], meta_data: [], stock_status: 'lowstock', rating: 4.6 },
      { id: 50009, name: 'Wedding Cake', price: '18.99', images: [{ src: vendor.logo }], categories: [{ name: 'Flower' }], meta_data: [], stock_status: 'instock', rating: 5.0 },
    ],
    'cannaboyz': [
      { id: 60001, name: 'Gorilla Glue #4', price: '16.99', images: [{ src: vendor.logo }], categories: [{ name: 'Flower' }], meta_data: [], stock_status: 'instock', rating: 4.8 },
      { id: 60002, name: 'White Widow', price: '15.99', images: [{ src: vendor.logo }], categories: [{ name: 'Flower' }], meta_data: [], stock_status: 'instock', rating: 4.7 },
      { id: 60003, name: 'Northern Lights', price: '14.99', images: [{ src: vendor.logo }], categories: [{ name: 'Flower' }], meta_data: [], stock_status: 'instock', rating: 4.9 },
      { id: 60004, name: 'AK-47', price: '16.99', images: [{ src: vendor.logo }], categories: [{ name: 'Flower' }], meta_data: [], stock_status: 'outofstock', rating: 4.6 },
      { id: 60005, name: 'Granddaddy Purple', price: '17.99', images: [{ src: vendor.logo }], categories: [{ name: 'Flower' }], meta_data: [], stock_status: 'instock', rating: 4.8 },
      { id: 60006, name: 'Jack Herer', price: '16.99', images: [{ src: vendor.logo }], categories: [{ name: 'Flower' }], meta_data: [], stock_status: 'instock', rating: 4.9 },
    ],
    'moonwater': [
      { id: 70001, name: '[CITRUS BLEND]', price: '8.99', images: [{ src: vendor.logo }], categories: [{ name: 'Beverages' }], meta_data: [], stock_status: 'instock', rating: 5.0 },
      { id: 70002, name: '[BERRY FUSION]', price: '8.99', images: [{ src: vendor.logo }], categories: [{ name: 'Beverages' }], meta_data: [], stock_status: 'instock', rating: 4.9 },
      { id: 70003, name: '[TROPICAL WAVE]', price: '8.99', images: [{ src: vendor.logo }], categories: [{ name: 'Beverages' }], meta_data: [], stock_status: 'instock', rating: 4.8 },
      { id: 70004, name: '[MINT REFRESH]', price: '8.99', images: [{ src: vendor.logo }], categories: [{ name: 'Beverages' }], meta_data: [], stock_status: 'instock', rating: 4.9 },
    ],
    'zarati': [
      { id: 80001, name: 'Runtz', price: '19.99', images: [{ src: vendor.logo }], categories: [{ name: 'Flower' }], meta_data: [], stock_status: 'instock', rating: 4.7 },
      { id: 80002, name: 'Biscotti', price: '18.99', images: [{ src: vendor.logo }], categories: [{ name: 'Flower' }], meta_data: [], stock_status: 'instock', rating: 4.8 },
      { id: 80003, name: 'Jealousy', price: '20.99', images: [{ src: vendor.logo }], categories: [{ name: 'Flower' }], meta_data: [], stock_status: 'lowstock', rating: 5.0 },
      { id: 80004, name: 'Cereal Milk', price: '19.99', images: [{ src: vendor.logo }], categories: [{ name: 'Flower' }], meta_data: [], stock_status: 'instock', rating: 4.6 },
      { id: 80005, name: 'Ice Cream Cake', price: '18.99', images: [{ src: vendor.logo }], categories: [{ name: 'Flower' }], meta_data: [], stock_status: 'instock', rating: 4.9 },
    ]
  };

  let vendorProducts = productsByVendor[vendor.slug] || [];

  // Get unique categories from products
  const categories = [...new Set(vendorProducts.map((p: any) => p.categories[0]?.name))].filter(Boolean) as string[];

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

  const locations: any[] = [];
  const inventoryMap: { [key: number]: any[] } = {};
  const productFieldsMap: { [key: number]: any } = {};
  
  filteredProducts.forEach((product: any) => {
    productFieldsMap[product.id] = { fields: {}, pricingTiers: [] };
  });

  return (
    <div className="min-h-screen bg-[#2a2a2a] relative overflow-hidden">
      {/* Floating gradient orbs background - Matching Main Products Page */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" style={{ animation: 'float 8s ease-in-out 2s infinite' }}></div>
      </div>

      {/* Back Navigation */}
      <div className="border-b border-white/10 bg-[#2a2a2a] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
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
      <div className="border-b border-white/10 bg-[#2a2a2a] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
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
              <div className="bg-white/5 border border-white/10 p-4 mb-6">
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
      <div className="max-w-[2000px] mx-auto px-4 sm:px-6 md:px-8 py-8 lg:py-12 relative">
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

