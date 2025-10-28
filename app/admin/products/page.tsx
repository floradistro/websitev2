"use client";

import { useState, useEffect } from 'react';
import { Search, Package, TrendingUp, AlertTriangle, Store, DollarSign, Eye, X, Grid3x3, List, FileText, Flask, Tag, ArrowUpDown, Download, CheckCircle, Clock } from 'lucide-react';
import Image from 'next/image';
import AdminPageWrapper from '@/components/AdminPageWrapper';

interface PricingTier {
  id: string;
  label: string;
  quantity: number;
  unit: string;
  price: number;
  min_quantity?: number;
  max_quantity?: number;
  blueprint_name?: string;
}

interface COA {
  id: string;
  file_name: string;
  file_url: string;
  lab_name: string;
  test_date: string;
  batch_number: string;
  test_results: any;
  is_verified: boolean;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  status: string;
  vendor_id: string;
  vendor?: {
    store_name: string;
    logo_url?: string;
  };
  images?: string[];
  category?: {
    name: string;
  };
  description?: string;
  created_at: string;
  custom_fields?: Record<string, string>;
  pricing_tiers?: PricingTier[];
  coas?: COA[];
  tier_count?: number;
}

export default function MasterCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [sortBy, setSortBy] = useState<'recent' | 'price-low' | 'price-high' | 'vendor' | 'category'>('recent');

  // Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalValue: 0,
    lowStock: 0,
  });

  useEffect(() => {
    loadCatalog();
  }, []);

  async function loadCatalog() {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/products?limit=500&with_vendor=true');
      const data = await response.json();
      const productsData = data.products || [];
      setProducts(productsData);

      // Calculate stats
      const active = productsData.filter((p: Product) => p.status === 'active').length;
      const value = productsData.reduce((sum: number, p: Product) => sum + (p.price * (p.stock_quantity || 0)), 0);
      const lowStock = productsData.filter((p: Product) => p.stock_quantity > 0 && p.stock_quantity < 10).length;

      setStats({
        totalProducts: productsData.length,
        activeProducts: active,
        totalValue: value,
        lowStock: lowStock,
      });
    } catch (error) {
      console.error('Error loading catalog:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesVendor = vendorFilter === 'all' || p.vendor_id === vendorFilter;
    const matchesCategory = categoryFilter === 'all' || p.category?.name === categoryFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesVendor && matchesCategory && matchesStatus;
  });

  // Apply sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': {
        const priceA = a.pricing_tiers?.length ? Math.min(...a.pricing_tiers.map(t => t.price)) : (a.price || 0);
        const priceB = b.pricing_tiers?.length ? Math.min(...b.pricing_tiers.map(t => t.price)) : (b.price || 0);
        return priceA - priceB;
      }
      case 'price-high': {
        const priceA = a.pricing_tiers?.length ? Math.min(...a.pricing_tiers.map(t => t.price)) : (a.price || 0);
        const priceB = b.pricing_tiers?.length ? Math.min(...b.pricing_tiers.map(t => t.price)) : (b.price || 0);
        return priceB - priceA;
      }
      case 'vendor':
        return (a.vendor?.store_name || '').localeCompare(b.vendor?.store_name || '');
      case 'category':
        return (a.category?.name || '').localeCompare(b.category?.name || '');
      case 'recent':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const uniqueVendors = Array.from(new Set(products.map(p => p.vendor_id))).map(id => {
    const product = products.find(p => p.vendor_id === id);
    return {
      id,
      name: product?.vendor?.store_name || 'Unknown Vendor'
    };
  });

  const uniqueCategories = Array.from(
    new Set(products.map(p => p.category?.name).filter(Boolean))
  ).sort();

  // Platform-level intelligence metrics
  const productsWithPricingTiers = products.filter(p => p.pricing_tiers && p.pricing_tiers.length > 0).length;
  const productsWithCOAs = products.filter(p => p.coas && p.coas.length > 0).length;
  const pricingTierAdoptionRate = products.length > 0 ? Math.round((productsWithPricingTiers / products.length) * 100) : 0;
  const coaComplianceRate = products.length > 0 ? Math.round((productsWithCOAs / products.length) * 100) : 0;

  // Export to CSV functionality
  const exportToCSV = () => {
    const headers = [
      'Product Name',
      'SKU',
      'Vendor',
      'Category',
      'Status',
      'Stock',
      'Base Price',
      'Pricing Tiers',
      'Has COA',
      'Created Date',
      'Last Updated'
    ];

    const rows = sortedProducts.map(product => {
      const minPrice = product.pricing_tiers?.length
        ? Math.min(...product.pricing_tiers.map(t => t.price))
        : product.price;

      return [
        product.name,
        product.sku || '',
        product.vendor?.store_name || '',
        product.category?.name || '',
        product.status,
        product.stock_quantity || 0,
        product.price?.toFixed(2) || '',
        product.pricing_tiers?.length ? `${product.pricing_tiers.length} tiers (from $${minPrice.toFixed(2)})` : 'No tiers',
        product.coas?.length > 0 ? 'Yes' : 'No',
        new Date(product.created_at).toLocaleDateString(),
        new Date(product.updated_at).toLocaleDateString()
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `master-catalog-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminPageWrapper>
      <div className="min-h-screen">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <h1 className="text-xl md:text-3xl font-black text-white/90 tracking-tight mb-1 uppercase" style={{ fontWeight: 900 }}>
            Master Catalog
          </h1>
          <p className="text-white/40 text-[9px] md:text-[10px] font-light tracking-[0.15em] uppercase">
            Platform-Wide Product Intelligence · {stats.totalProducts} Total Products
          </p>
        </div>

        {/* Stats Grid - POS Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6">
          <div className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-3 md:p-5 hover:bg-white/[0.07] transition-all">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <span className="text-white/40 text-[8px] md:text-[9px] uppercase tracking-[0.15em]">Total Products</span>
              <Package size={12} className="text-white/20 md:hidden" strokeWidth={1.5} />
              <Package size={14} className="text-white/20 hidden md:block" strokeWidth={1.5} />
            </div>
            <div className="text-2xl md:text-3xl font-black text-white mb-0.5 md:mb-1" style={{ fontWeight: 900 }}>
              {stats.totalProducts.toLocaleString()}
            </div>
            <div className="text-white/30 text-[8px] md:text-[9px] font-light tracking-wider uppercase">Across All Tenants</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-3 md:p-5 hover:bg-white/[0.07] transition-all">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <span className="text-white/40 text-[8px] md:text-[9px] uppercase tracking-[0.15em]">Active</span>
              <TrendingUp size={12} className="text-white/40 md:hidden" strokeWidth={1.5} />
              <TrendingUp size={14} className="text-white/40 hidden md:block" strokeWidth={1.5} />
            </div>
            <div className="text-2xl md:text-3xl font-black text-white mb-0.5 md:mb-1" style={{ fontWeight: 900 }}>
              {stats.activeProducts.toLocaleString()}
            </div>
            <div className="text-white/30 text-[8px] md:text-[9px] font-light tracking-wider uppercase">Live Products</div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-3 md:p-5 hover:bg-white/[0.07] transition-all">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <span className="text-white/40 text-[8px] md:text-[9px] uppercase tracking-[0.15em]">Pricing Tiers</span>
              <DollarSign size={12} className="text-white/20 md:hidden" strokeWidth={1.5} />
              <DollarSign size={14} className="text-white/20 hidden md:block" strokeWidth={1.5} />
            </div>
            <div className="text-2xl md:text-3xl font-black text-white mb-0.5 md:mb-1" style={{ fontWeight: 900 }}>
              {pricingTierAdoptionRate}%
            </div>
            <div className="text-white/30 text-[8px] md:text-[9px] font-light tracking-wider uppercase">
              {productsWithPricingTiers} of {products.length} Products
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-3 md:p-5 hover:bg-white/[0.07] transition-all">
            <div className="flex items-center justify-between mb-2 md:mb-3">
              <span className="text-white/40 text-[8px] md:text-[9px] uppercase tracking-[0.15em]">COA Compliance</span>
              <CheckCircle size={12} className="text-white/40 md:hidden" strokeWidth={1.5} />
              <CheckCircle size={14} className="text-white/40 hidden md:block" strokeWidth={1.5} />
            </div>
            <div className="text-2xl md:text-3xl font-black text-white mb-0.5 md:mb-1" style={{ fontWeight: 900 }}>
              {coaComplianceRate}%
            </div>
            <div className="text-white/30 text-[8px] md:text-[9px] font-light tracking-wider uppercase">
              {productsWithCOAs} with Lab Results
            </div>
          </div>
        </div>

        {/* Filters - POS Style */}
        <div className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-3 md:p-5 mb-4 md:mb-6">
          <div className="flex flex-col gap-2 md:gap-3">
            {/* Search - Full width on mobile */}
            <div className="w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={12} strokeWidth={1.5} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-white/5 border border-white/10 pl-9 pr-3 py-2 md:py-2.5 text-white text-[11px] md:text-xs font-light placeholder-white/30 rounded-lg md:rounded-xl focus:outline-none focus:border-white/20 transition-all"
              />
            </div>

            {/* Filters Row - Stacked on mobile, side-by-side on tablet+ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {/* Vendor Filter */}
              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="bg-white/5 border border-white/10 px-2 md:px-4 py-2 md:py-2.5 text-white text-[10px] md:text-xs font-light rounded-lg md:rounded-xl focus:outline-none focus:border-white/20 transition-all"
              >
                <option value="all">All Tenants</option>
                {uniqueVendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white/5 border border-white/10 px-2 md:px-4 py-2 md:py-2.5 text-white text-[10px] md:text-xs font-light rounded-lg md:rounded-xl focus:outline-none focus:border-white/20 transition-all"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white/5 border border-white/10 px-2 md:px-4 py-2 md:py-2.5 text-white text-[10px] md:text-xs font-light rounded-lg md:rounded-xl focus:outline-none focus:border-white/20 transition-all"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white/5 border border-white/10 px-2 md:px-4 py-2 md:py-2.5 text-white text-[10px] md:text-xs font-light rounded-lg md:rounded-xl focus:outline-none focus:border-white/20 transition-all"
              >
                <option value="recent">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="vendor">Vendor A-Z</option>
                <option value="category">Category A-Z</option>
              </select>
            </div>

            {/* Actions Row - Export + View Toggle */}
            <div className="flex items-center justify-between gap-2">
              {/* Export Button - Compact on mobile */}
              <button
                onClick={exportToCSV}
                className="px-3 md:px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[8px] md:text-[9px] uppercase tracking-[0.15em] font-black rounded-lg md:rounded-xl transition-all flex items-center gap-1.5 md:gap-2"
                style={{ fontWeight: 900 }}
              >
                <Download size={10} className="md:hidden" />
                <Download size={12} className="hidden md:block" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </button>

              {/* View Toggle - Compact on mobile */}
              <div className="flex gap-1 md:gap-2 bg-white/5 border border-white/10 p-0.5 md:p-1 rounded-lg md:rounded-xl">
                <button
                  onClick={() => setView('grid')}
                  className={`px-2 md:px-4 py-1.5 md:py-2 text-[8px] md:text-[9px] uppercase tracking-[0.15em] font-black rounded-md md:rounded-lg transition-all ${
                    view === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
                  }`}
                  style={{ fontWeight: 900 }}
                >
                  <Grid3x3 size={10} className="inline mr-0.5 md:mr-1 md:hidden" />
                  <Grid3x3 size={12} className="hidden md:inline mr-1" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`px-2 md:px-4 py-1.5 md:py-2 text-[8px] md:text-[9px] uppercase tracking-[0.15em] font-black rounded-md md:rounded-lg transition-all ${
                    view === 'list' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'
                  }`}
                  style={{ fontWeight: 900 }}
                >
                  <List size={10} className="inline mr-0.5 md:mr-1 md:hidden" />
                  <List size={12} className="hidden md:inline mr-1" />
                  <span className="hidden sm:inline">List</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-3 md:mb-4">
          <p className="text-white/40 text-[8px] md:text-[9px] font-light tracking-[0.15em] uppercase">
            Showing {sortedProducts.length} of {products.length} Products
          </p>
        </div>

        {/* Products Grid - POS Style */}
        {loading ? (
          <div className="text-center py-12 md:py-16">
            <div className="animate-spin rounded-full h-6 md:h-8 w-6 md:w-8 border-t-2 border-b-2 border-white/40 mx-auto"></div>
            <p className="text-white/40 text-[8px] md:text-[9px] font-light mt-3 md:mt-4 uppercase tracking-wider">Loading Catalog...</p>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl p-8 md:p-16 text-center">
            <Package size={32} className="text-white/10 mx-auto mb-3 md:mb-4 md:hidden" strokeWidth={1.5} />
            <Package size={48} className="text-white/10 mx-auto mb-4 hidden md:block" strokeWidth={1.5} />
            <p className="text-white/40 text-xs md:text-sm font-light uppercase tracking-wider">No products found</p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 md:gap-3">
            {sortedProducts.map((product) => (
              <div
                key={product.id}
                className="bg-[#0a0a0a] border border-white/10 rounded-xl md:rounded-2xl overflow-hidden group hover:border-white/20 hover:bg-white/[0.02] transition-all cursor-pointer"
                onClick={() => setQuickViewProduct(product)}
              >
                {/* Product Image */}
                <div className="aspect-square bg-white/5 relative">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-contain p-3"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package size={32} className="text-white/10" strokeWidth={1.5} />
                    </div>
                  )}

                  {/* Vendor Logo Overlay - Bigger */}
                  {product.vendor?.logo_url && (
                    <div className="absolute top-2 left-2 w-12 h-12 bg-black/70 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden shadow-lg">
                      <Image
                        src={product.vendor.logo_url}
                        alt={product.vendor.store_name}
                        fill
                        className="object-contain p-1.5"
                      />
                    </div>
                  )}

                  {/* Stock Badge - Monochrome */}
                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg">
                    <span className="text-white text-[9px] font-black uppercase tracking-wider" style={{ fontWeight: 900 }}>
                      {product.stock_quantity}
                    </span>
                  </div>

                  {/* Strategic Badges */}
                  <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
                    {(() => {
                      const isNew = new Date(product.created_at).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000);
                      const hasNoPricing = !product.pricing_tiers || product.pricing_tiers.length === 0;
                      const hasNoCOA = !product.coas || product.coas.length === 0;
                      const isVerified = product.pricing_tiers?.length > 0 && product.coas?.length > 0;

                      return (
                        <>
                          {isNew && (
                            <div className="px-1.5 py-0.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded text-[7px] text-white/60 font-black uppercase tracking-wider" style={{ fontWeight: 900 }}>
                              New
                            </div>
                          )}
                          {hasNoPricing && (
                            <div className="px-1.5 py-0.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded text-[7px] text-white/40 font-black uppercase tracking-wider" style={{ fontWeight: 900 }}>
                              No Pricing
                            </div>
                          )}
                          {hasNoCOA && (
                            <div className="px-1.5 py-0.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded text-[7px] text-white/40 font-black uppercase tracking-wider" style={{ fontWeight: 900 }}>
                              No COA
                            </div>
                          )}
                          {isVerified && (
                            <div className="px-1.5 py-0.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded text-[7px] text-white/60 font-black uppercase tracking-wider flex items-center gap-0.5" style={{ fontWeight: 900 }}>
                              <CheckCircle size={8} />
                              Verified
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Quick View Overlay */}
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                    <div className="flex items-center gap-2 text-white text-[9px] uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>
                      <Eye size={12} />
                      Quick View
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-3">
                  {/* Vendor + Category */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1 text-[8px] text-white/30 uppercase tracking-wider">
                      <Store size={9} strokeWidth={1.5} />
                      {product.vendor?.store_name || 'Unknown'}
                    </div>
                    {product.category?.name && (
                      <div className="text-[7px] text-white/20 uppercase tracking-wider px-1.5 py-0.5 bg-white/5 rounded">
                        {product.category.name}
                      </div>
                    )}
                  </div>

                  {/* Product Name */}
                  <h3 className="text-xs font-black text-white line-clamp-2 mb-2 uppercase tracking-tight" style={{ fontWeight: 900 }}>
                    {product.name}
                  </h3>

                  {/* Status Only */}
                  <div className="flex items-center justify-end">
                    <div className={`text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider font-black ${
                      product.status === 'active' ? 'bg-white/10 text-white' :
                      product.status === 'draft' ? 'bg-white/5 text-white/40' :
                      'bg-white/5 text-white/30'
                    }`} style={{ fontWeight: 900 }}>
                      {product.status}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-xl md:rounded-2xl overflow-x-auto">
              <table className="w-full min-w-[580px]">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left px-2 md:px-5 py-1.5 md:py-3 text-[7px] md:text-[9px] text-white/40 uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>Product</th>
                    <th className="text-left px-2 md:px-5 py-1.5 md:py-3 text-[7px] md:text-[9px] text-white/40 uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>Tenant</th>
                    <th className="text-left px-2 md:px-5 py-1.5 md:py-3 text-[7px] md:text-[9px] text-white/40 uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>Category</th>
                    <th className="text-left px-2 md:px-5 py-1.5 md:py-3 text-[7px] md:text-[9px] text-white/40 uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>Price</th>
                    <th className="text-left px-2 md:px-5 py-1.5 md:py-3 text-[7px] md:text-[9px] text-white/40 uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>Stock</th>
                    <th className="text-left px-2 md:px-5 py-1.5 md:py-3 text-[7px] md:text-[9px] text-white/40 uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>Status</th>
                    <th className="text-left px-2 md:px-5 py-1.5 md:py-3 text-[7px] md:text-[9px] text-white/40 uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-all"
                  >
                    <td className="px-2 md:px-5 py-2 md:py-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-8 h-8 md:w-12 md:h-12 bg-white/5 border border-white/10 rounded-lg md:rounded-xl relative flex-shrink-0">
                          {product.images && product.images.length > 0 ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-contain p-1"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Package size={10} className="text-white/10 md:hidden" strokeWidth={1.5} />
                              <Package size={14} className="text-white/10 hidden md:block" strokeWidth={1.5} />
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] md:text-xs font-black text-white uppercase" style={{ fontWeight: 900 }}>{product.name}</span>
                      </div>
                    </td>
                    <td className="px-2 md:px-5 py-2 md:py-4">
                      <div className="flex items-center gap-1 md:gap-2">
                        {product.vendor?.logo_url && (
                          <div className="w-6 h-6 md:w-8 md:h-8 bg-white/5 border border-white/10 rounded-md md:rounded-lg overflow-hidden relative">
                            <Image src={product.vendor.logo_url} alt="" fill className="object-contain p-1" />
                          </div>
                        )}
                        <span className="text-[10px] md:text-xs font-light text-white/60">
                          {product.vendor?.store_name || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 md:px-5 py-2 md:py-4">
                      {product.category?.name ? (
                        <span className="text-[9px] md:text-xs font-light text-white/40 uppercase tracking-wide">
                          {product.category.name}
                        </span>
                      ) : (
                        <span className="text-[9px] md:text-xs font-light text-white/20">—</span>
                      )}
                    </td>
                    <td className="px-2 md:px-5 py-2 md:py-4">
                      {product.pricing_tiers && product.pricing_tiers.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1 md:gap-2">
                            <span className="text-[7px] md:text-[8px] text-white/40 uppercase tracking-wider font-black" style={{ fontWeight: 900 }}>From</span>
                            <span className="text-xs md:text-sm font-black text-white" style={{ fontWeight: 900 }}>
                              ${Math.min(...product.pricing_tiers.map(t => t.price)).toFixed(2)}
                            </span>
                          </div>
                          <div className="text-[7px] md:text-[8px] text-white/30 uppercase tracking-wider font-black" style={{ fontWeight: 900 }}>
                            {product.pricing_tiers.length} Tiers
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs md:text-sm font-black text-white" style={{ fontWeight: 900 }}>
                          ${product.price.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="px-2 md:px-5 py-2 md:py-4">
                      <span className="text-xs md:text-sm font-black text-white" style={{ fontWeight: 900 }}>
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="px-2 md:px-5 py-2 md:py-4">
                      <div className="flex flex-wrap items-center gap-1 md:gap-1.5">
                        <span className={`px-1.5 md:px-2 py-0.5 md:py-1 text-[7px] md:text-[8px] uppercase tracking-wider font-black rounded ${
                          product.status === 'active' ? 'bg-white/10 text-white' :
                          product.status === 'draft' ? 'bg-white/5 text-white/40' :
                          'bg-white/5 text-white/30'
                        }`} style={{ fontWeight: 900 }}>
                          {product.status}
                        </span>

                        {/* Strategic Badges */}
                        {(() => {
                          const isNew = new Date(product.created_at).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000);
                          const hasNoPricing = !product.pricing_tiers || product.pricing_tiers.length === 0;
                          const hasNoCOA = !product.coas || product.coas.length === 0;
                          const isVerified = product.pricing_tiers?.length > 0 && product.coas?.length > 0;

                          return (
                            <>
                              {isNew && (
                                <span className="px-1 md:px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-[6px] md:text-[7px] text-white/60 font-black uppercase tracking-wider" style={{ fontWeight: 900 }}>
                                  New
                                </span>
                              )}
                              {hasNoPricing && (
                                <span className="px-1 md:px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[6px] md:text-[7px] text-white/40 font-black uppercase tracking-wider" style={{ fontWeight: 900 }}>
                                  No Pricing
                                </span>
                              )}
                              {hasNoCOA && (
                                <span className="px-1 md:px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[6px] md:text-[7px] text-white/40 font-black uppercase tracking-wider" style={{ fontWeight: 900 }}>
                                  No COA
                                </span>
                              )}
                              {isVerified && (
                                <span className="px-1 md:px-1.5 py-0.5 bg-white/10 border border-white/20 rounded text-[6px] md:text-[7px] text-white/60 font-black uppercase tracking-wider inline-flex items-center gap-0.5" style={{ fontWeight: 900 }}>
                                  <CheckCircle size={7} className="md:hidden" />
                                  <CheckCircle size={8} className="hidden md:block" />
                                  Verified
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-2 md:px-5 py-2 md:py-4">
                      <button
                        onClick={() => setQuickViewProduct(product)}
                        className="px-2 md:px-3 py-1 md:py-1.5 bg-white/5 border border-white/10 rounded-md md:rounded-lg text-[8px] md:text-[9px] text-white uppercase tracking-wider font-black hover:bg-white/10 transition-all flex items-center gap-1 md:gap-1.5"
                        style={{ fontWeight: 900 }}
                      >
                        <Eye size={9} className="md:hidden" />
                        <Eye size={10} className="hidden md:block" />
                        <span className="hidden sm:inline">View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4"
          onClick={() => setQuickViewProduct(null)}
        >
          <div
            className="bg-[#0a0a0a] border border-white/10 rounded-xl md:rounded-2xl w-full max-w-4xl max-h-[calc(100vh-140px)] md:max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 md:p-6 border-b border-white/10 flex-shrink-0 rounded-t-xl md:rounded-t-2xl">
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                {quickViewProduct.vendor?.logo_url && (
                  <div className="relative w-8 h-8 md:w-10 md:h-10 flex-shrink-0 bg-white/10 rounded-lg md:rounded-xl overflow-hidden border border-white/10">
                    <Image
                      src={quickViewProduct.vendor.logo_url}
                      alt={quickViewProduct.vendor.store_name || 'Vendor'}
                      fill
                      className="object-contain p-1"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-sm md:text-xl font-black text-white uppercase tracking-tight truncate" style={{ fontWeight: 900 }}>
                    Quick View
                  </h2>
                  {quickViewProduct.vendor && (
                    <div className="text-white/40 text-[8px] md:text-[10px] uppercase tracking-wider truncate">
                      {quickViewProduct.vendor.store_name}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setQuickViewProduct(null)}
                className="w-7 h-7 md:w-8 md:h-8 bg-white/5 hover:bg-white/10 rounded-lg md:rounded-xl flex items-center justify-center transition-all flex-shrink-0"
              >
                <X size={14} className="text-white/60 md:hidden" />
                <X size={16} className="text-white/60 hidden md:block" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto rounded-b-xl md:rounded-b-2xl">
              <div className="p-3 md:p-6 pb-6 md:pb-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6">
                {/* Left: Image */}
                {quickViewProduct.images && quickViewProduct.images.length > 0 && (
                  <div className="md:col-span-4">
                    <div className="aspect-square bg-white/5 rounded-xl md:rounded-2xl overflow-hidden relative border border-white/10">
                      <Image
                        src={quickViewProduct.images[0]}
                        alt={quickViewProduct.name}
                        fill
                        className="object-contain p-2 md:p-4"
                      />
                    </div>
                  </div>
                )}

                {/* Right: Product Info */}
                <div className={quickViewProduct.images?.length ? "md:col-span-8" : "md:col-span-12"}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                    {/* Column 1: Basic Info */}
                    <div className="md:col-span-2">
                      <h3 className="text-lg md:text-2xl font-black text-white uppercase tracking-tight mb-1 md:mb-2" style={{ fontWeight: 900 }}>
                        {quickViewProduct.name}
                      </h3>

                      {quickViewProduct.category?.name && (
                        <div className="text-white/40 text-[10px] md:text-xs uppercase tracking-[0.15em] mb-2 md:mb-4">
                          {quickViewProduct.category.name}
                        </div>
                      )}

                      {quickViewProduct.description && (
                        <div className="mb-3 md:mb-4">
                          <div className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-[0.15em] mb-1 md:mb-2">Description</div>
                          <p className="text-white/70 text-[11px] md:text-xs leading-relaxed">
                            {quickViewProduct.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Column 2: Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-1 gap-2 md:gap-0">
                      {/* Stock */}
                      <div className="bg-white/5 border border-white/10 rounded-lg md:rounded-xl p-2 md:p-3 mb-2 md:mb-3">
                        <div className="text-white/40 text-[8px] md:text-[9px] uppercase tracking-wider mb-0.5 md:mb-1">Stock</div>
                        <div className="text-white font-black text-lg md:text-xl" style={{ fontWeight: 900 }}>
                          {quickViewProduct.stock_quantity}
                        </div>
                      </div>

                      {/* Price - Smart Display */}
                      {quickViewProduct.pricing_tiers && quickViewProduct.pricing_tiers.length > 0 ? (
                        <div className="bg-white/5 border border-white/10 rounded-lg md:rounded-xl p-2 md:p-3 mb-2 md:mb-3">
                          <div className="text-white/40 text-[8px] md:text-[9px] uppercase tracking-wider mb-0.5 md:mb-1">Pricing</div>
                          <div className="flex items-baseline gap-1 md:gap-2">
                            <div className="text-white font-black text-lg md:text-xl" style={{ fontWeight: 900 }}>
                              ${Math.min(...quickViewProduct.pricing_tiers.map(t => t.price)).toFixed(2)}
                            </div>
                            <div className="text-white/40 text-[8px] md:text-[9px] uppercase tracking-wider font-black" style={{ fontWeight: 900 }}>
                              From
                            </div>
                          </div>
                          <div className="text-white/30 text-[7px] md:text-[8px] uppercase tracking-wider mt-0.5 md:mt-1 font-black" style={{ fontWeight: 900 }}>
                            {quickViewProduct.pricing_tiers.length} Tiers
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white/5 border border-white/10 rounded-lg md:rounded-xl p-2 md:p-3 mb-2 md:mb-3">
                          <div className="text-white/40 text-[8px] md:text-[9px] uppercase tracking-wider mb-0.5 md:mb-1">Price</div>
                          <div className="text-white font-black text-lg md:text-xl" style={{ fontWeight: 900 }}>
                            ${quickViewProduct.price.toFixed(2)}
                          </div>
                        </div>
                      )}

                      {/* Status */}
                      <div className="bg-white/5 border border-white/10 rounded-lg md:rounded-xl p-2 md:p-3">
                        <div className="text-white/40 text-[8px] md:text-[9px] uppercase tracking-wider mb-0.5 md:mb-1">Status</div>
                        <div className={`text-[10px] md:text-xs font-black uppercase tracking-wider ${
                          quickViewProduct.status === 'active' ? 'text-white' :
                          quickViewProduct.status === 'draft' ? 'text-white/60' :
                          'text-white/40'
                        }`} style={{ fontWeight: 900 }}>
                          {quickViewProduct.status}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product Blueprint Fields */}
                  {quickViewProduct.custom_fields && Object.keys(quickViewProduct.custom_fields).length > 0 && (
                    <div className="col-span-full mt-3 md:mt-6">
                      <div className="flex items-center gap-2 mb-2 md:mb-3">
                        <Tag size={12} className="text-white/40 md:hidden" strokeWidth={1.5} />
                        <Tag size={14} className="text-white/40 hidden md:block" strokeWidth={1.5} />
                        <h4 className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>
                          Product Fields
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                        {Object.entries(quickViewProduct.custom_fields).map(([key, value]) => (
                          <div key={key} className="bg-white/5 border border-white/10 rounded-lg md:rounded-xl p-2 md:p-3">
                            <div className="text-white/40 text-[9px] uppercase tracking-wider mb-1">
                              {key}
                            </div>
                            <div className="text-white text-sm font-black" style={{ fontWeight: 900 }}>
                              {value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pricing Tiers */}
                  {quickViewProduct.pricing_tiers && quickViewProduct.pricing_tiers.length > 0 && (
                    <div className="col-span-full mt-3 md:mt-6">
                      <div className="flex items-center gap-2 mb-2 md:mb-3">
                        <DollarSign size={12} className="text-white/40 md:hidden" strokeWidth={1.5} />
                        <DollarSign size={14} className="text-white/40 hidden md:block" strokeWidth={1.5} />
                        <h4 className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>
                          Pricing Tiers ({quickViewProduct.pricing_tiers.length})
                        </h4>
                      </div>
                      <div className="space-y-3 md:space-y-4">
                        {/* Group tiers by blueprint */}
                        {Object.entries(
                          quickViewProduct.pricing_tiers.reduce((acc, tier) => {
                            const blueprintName = tier.blueprint_name || 'Other';
                            if (!acc[blueprintName]) acc[blueprintName] = [];
                            acc[blueprintName].push(tier);
                            return acc;
                          }, {} as Record<string, PricingTier[]>)
                        ).map(([blueprintName, tiers]) => (
                          <div key={blueprintName}>
                            <div className="text-white/30 text-[8px] uppercase tracking-[0.15em] mb-2 font-black" style={{ fontWeight: 900 }}>
                              {blueprintName}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3">
                              {tiers.map(tier => (
                                <div key={tier.id} className="bg-white/5 border border-white/10 rounded-lg md:rounded-xl p-2 md:p-3">
                                  <div className="text-white/40 text-[9px] uppercase tracking-wider mb-1">
                                    {tier.label}
                                  </div>
                                  <div className="text-white text-lg font-black mb-1" style={{ fontWeight: 900 }}>
                                    ${tier.price.toFixed(2)}
                                  </div>
                                  <div className="text-white/60 text-[10px]">
                                    {tier.quantity}{tier.unit}
                                    {tier.min_quantity && tier.max_quantity && (
                                      <span className="text-white/40"> • {tier.min_quantity}-{tier.max_quantity}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lab Results / COAs */}
                  {quickViewProduct.coas && quickViewProduct.coas.length > 0 && (
                    <div className="col-span-full mt-3 md:mt-6">
                      <div className="flex items-center gap-2 mb-2 md:mb-3">
                        <Flask size={12} className="text-white/40 md:hidden" strokeWidth={1.5} />
                        <Flask size={14} className="text-white/40 hidden md:block" strokeWidth={1.5} />
                        <h4 className="text-white/40 text-[9px] md:text-[10px] uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>
                          Lab Results ({quickViewProduct.coas.length})
                        </h4>
                      </div>
                      <div className="space-y-2 md:space-y-3">
                        {quickViewProduct.coas.map(coa => (
                          <div key={coa.id} className="bg-white/5 border border-white/10 rounded-lg md:rounded-xl p-3 md:p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="text-white text-sm font-black" style={{ fontWeight: 900 }}>
                                    {coa.file_name}
                                  </div>
                                  {coa.is_verified && (
                                    <div className="px-2 py-0.5 bg-white/10 text-white text-[8px] uppercase tracking-wider rounded font-black" style={{ fontWeight: 900 }}>
                                      Verified
                                    </div>
                                  )}
                                </div>
                                <div className="text-white/40 text-[10px] uppercase tracking-wider">
                                  {coa.lab_name} • {new Date(coa.test_date).toLocaleDateString()}
                                </div>
                                {coa.batch_number && (
                                  <div className="text-white/40 text-[9px] mt-1">
                                    Batch: {coa.batch_number}
                                  </div>
                                )}
                              </div>
                              {coa.file_url && (
                                <a
                                  href={coa.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[9px] uppercase tracking-wider rounded-lg transition-all border border-white/10"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <FileText size={10} />
                                  View
                                </a>
                              )}
                            </div>
                            {coa.test_results && typeof coa.test_results === 'object' && Object.keys(coa.test_results).length > 0 && (
                              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
                                {Object.entries(coa.test_results).slice(0, 6).map(([key, value]) => (
                                  <div key={key} className="text-[10px]">
                                    <div className="text-white/40 uppercase tracking-wider mb-0.5">{key}</div>
                                    <div className="text-white font-black" style={{ fontWeight: 900 }}>{String(value)}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminPageWrapper>
  );
}
