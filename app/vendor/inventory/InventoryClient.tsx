"use client";

import { useEffect, useState, useMemo } from 'react';
import { 
  Search, Package, RefreshCw, ChevronDown, ChevronUp, 
  MapPin, TrendingUp
} from 'lucide-react';
import { useVendorAuth } from '@/context/VendorAuthContext';
import { showNotification } from '@/components/NotificationToast';
import axios from 'axios';

// Types
interface LocationInventory {
  inventory_id: string;
  location_id: string;
  location_name: string;
  quantity: number;
}

interface ProductInventory {
  product_id: string;
  product_name: string;
  sku: string;
  category: string;
  price: number;
  cost_price?: number;
  total_quantity: number;
  locations: LocationInventory[];
}

interface Location {
  id: string;
  name: string;
  is_primary: boolean;
}

export default function InventoryClient() {
  const { isAuthenticated } = useVendorAuth();
  
  const [products, setProducts] = useState<ProductInventory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adjusting, setAdjusting] = useState<Record<string, boolean>>({});
  const [customAmount, setCustomAmount] = useState<Record<string, string>>({});
  
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Load inventory
  const loadInventory = async () => {
    try {
      const vendorId = localStorage.getItem('vendor_id');
      if (!vendorId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const response = await axios.get('/api/vendor/inventory/grouped', {
        headers: { 'x-vendor-id': vendorId },
        timeout: 20000
      });

      if (response.data.success) {
        setProducts(response.data.products || []);
        setLocations(response.data.locations || []);
        setLoading(false);
      } else {
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Inventory load error:', error);
      showNotification({
        type: 'error',
        title: 'Load Failed',
        message: error.response?.data?.error || 'Failed to load inventory'
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadInventory();
    }
  }, [isAuthenticated]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let items = [...products];

    if (search) {
      const s = search.toLowerCase();
      items = items.filter(p => 
        p.product_name.toLowerCase().includes(s) ||
        (p.sku && p.sku.toLowerCase().includes(s))
      );
    }

    if (stockFilter !== 'all') {
      items = items.filter(p => {
        if (stockFilter === 'out_of_stock') return p.total_quantity === 0;
        if (stockFilter === 'low_stock') return p.total_quantity > 0 && p.total_quantity <= 10;
        if (stockFilter === 'in_stock') return p.total_quantity > 10;
        return true;
      });
    }

    if (categoryFilter !== 'all') {
      items = items.filter(p => p.category === categoryFilter);
    }

    return items;
  }, [products, search, stockFilter, categoryFilter]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, page]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  // Get categories
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['all', ...Array.from(cats)];
  }, [products]);

  // Stats
  const stats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter(p => p.total_quantity > 10).length;
    const lowStock = products.filter(p => p.total_quantity > 0 && p.total_quantity <= 10).length;
    const outOfStock = products.filter(p => p.total_quantity === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.total_quantity), 0);
    const totalCost = products.reduce((sum, p) => sum + ((p.cost_price || 0) * p.total_quantity), 0);

    return { total, inStock, lowStock, outOfStock, totalValue, totalCost };
  }, [products]);

  // Adjust stock for specific location
  const handleLocationAdjust = async (productId: string, locationId: string, inventoryId: string, change: number) => {
    const key = `${productId}-${locationId}`;
    setAdjusting(prev => ({ ...prev, [key]: true }));

    try {
      const vendorId = localStorage.getItem('vendor_id');
      const response = await axios.post('/api/vendor/inventory/adjust', {
        inventoryId,
        productId,
        locationId,
        adjustment: change,
        reason: change > 0 ? `Added ${change}g` : `Removed ${Math.abs(change)}g`
      }, {
        headers: { 'x-vendor-id': vendorId }
      });

      if (response.data.success) {
        await loadInventory();
        
        showNotification({
          type: 'success',
          title: 'Updated',
          message: `Stock ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change)}g`
        });
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Failed',
        message: error.response?.data?.error || 'Failed to adjust stock'
      });
    } finally {
      setAdjusting(prev => ({ ...prev, [key]: false }));
    }
  };

  // Handle custom amount adjustment
  const handleCustomAdjust = async (productId: string, locationId: string, inventoryId: string) => {
    const key = `${productId}-${locationId}`;
    const amount = parseFloat(customAmount[key] || '0');
    
    if (isNaN(amount) || amount === 0) {
      showNotification({
        type: 'warning',
        title: 'Invalid Amount',
        message: 'Enter a valid amount'
      });
      return;
    }

    await handleLocationAdjust(productId, locationId, inventoryId, amount);
    setCustomAmount(prev => ({ ...prev, [key]: '' }));
  };

  if (loading) {
    return (
      <div className="w-full px-4 lg:px-0 py-12">
        <div className="minimal-glass p-12 text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 text-sm uppercase tracking-wider">Loading Inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 lg:px-0">
      {/* Header */}
      <div className="mb-8 fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-thin text-white/90 tracking-tight mb-2">
              Stock Management
            </h1>
            <p className="text-white/40 text-xs font-light tracking-wide uppercase">
              {filteredProducts.length} of {products.length} Products · {locations.length} Locations
            </p>
          </div>
          <button
            onClick={loadInventory}
            className="px-6 py-3 bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white transition-all duration-300 rounded-[14px] text-xs uppercase tracking-wider flex items-center gap-2"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {/* Stats - Monochrome */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="minimal-glass p-6">
            <div className="text-white/40 text-[10px] uppercase tracking-wider mb-3">Total</div>
            <div className="text-3xl font-thin text-white">{stats.total}</div>
            <div className="text-white/30 text-[9px] uppercase tracking-wider mt-1">Products</div>
          </div>
          <div className="minimal-glass p-6">
            <div className="text-white/40 text-[10px] uppercase tracking-wider mb-3">In Stock</div>
            <div className="text-3xl font-thin text-white">{stats.inStock}</div>
            <div className="text-white/30 text-[9px] uppercase tracking-wider mt-1">&gt; 10g</div>
          </div>
          <div className="minimal-glass p-6">
            <div className="text-white/40 text-[10px] uppercase tracking-wider mb-3">Low</div>
            <div className="text-3xl font-thin text-white/70">{stats.lowStock}</div>
            <div className="text-white/30 text-[9px] uppercase tracking-wider mt-1">1-10g</div>
          </div>
          <div className="minimal-glass p-6">
            <div className="text-white/40 text-[10px] uppercase tracking-wider mb-3">Empty</div>
            <div className="text-3xl font-thin text-white/50">{stats.outOfStock}</div>
            <div className="text-white/30 text-[9px] uppercase tracking-wider mt-1">0g</div>
          </div>
          <div className="minimal-glass p-6">
            <div className="text-white/40 text-[10px] uppercase tracking-wider mb-3">Stock Value</div>
            <div className="text-3xl font-thin text-white">${stats.totalValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
            {stats.totalCost > 0 && (
              <div className="text-white/30 text-[9px] uppercase tracking-wider mt-1">
                Cost: ${stats.totalCost.toLocaleString(undefined, {maximumFractionDigits: 0})}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="minimal-glass p-6 mb-6 fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/20 border border-white/10 text-white placeholder-white/30 pl-10 pr-4 py-3 focus:outline-none focus:border-white/30 transition-all rounded-[14px] text-sm"
            />
          </div>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="bg-black/20 border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/30 transition-all rounded-[14px] text-sm"
          >
            <option value="all">All Stock Levels</option>
            <option value="in_stock">In Stock (&gt; 10g)</option>
            <option value="low_stock">Low Stock (1-10g)</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-black/20 border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/30 transition-all rounded-[14px] text-sm"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product List */}
      {filteredProducts.length === 0 ? (
        <div className="minimal-glass p-16 text-center">
          <Package size={64} className="text-white/20 mx-auto mb-6" />
          <p className="text-white/60 text-lg mb-2">No inventory found</p>
          <p className="text-white/40 text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 fade-in" style={{ animationDelay: '0.2s' }}>
            {paginatedProducts.map((product) => {
            const isExpanded = expandedId === product.product_id;
            const margin = product.cost_price 
              ? ((product.price - product.cost_price) / product.price * 100)
              : null;

            const stockStatus = product.total_quantity === 0 ? 'EMPTY' : 
                               product.total_quantity <= 10 ? 'LOW' : 'OK';
            
            return (
              <div key={product.product_id} className="minimal-glass overflow-hidden">
                {/* Main Row */}
                <div className="p-6 hover:bg-white/[0.02] transition-all cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : product.product_id)}>
                  <div className="flex items-center gap-6">
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-medium text-lg">{product.product_name}</h3>
                        <span className="px-2 py-1 text-[10px] uppercase tracking-wider border border-white/20 text-white/60 rounded-[8px]">
                          {stockStatus}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-white/60">
                        <span>{product.category}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {product.locations.length} location{product.locations.length !== 1 ? 's' : ''}
                        </span>
                        <span>•</span>
                        <span>${product.price.toFixed(2)}/g</span>
                      </div>
                    </div>

                    {/* Stock Info */}
                    <div className="text-right">
                      <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Total Stock</div>
                      <div className="text-3xl font-thin text-white mb-1">{product.total_quantity.toFixed(2)}g</div>
                      {margin !== null && (
                        <div className="text-xs text-white/50">
                          {margin.toFixed(1)}% margin
                        </div>
                      )}
                    </div>

                    {/* Value */}
                    <div className="text-right min-w-[120px]">
                      <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Value</div>
                      <div className="text-2xl font-thin text-white">
                        ${(product.price * product.total_quantity).toLocaleString(undefined, {maximumFractionDigits: 0})}
                      </div>
                    </div>

                    {/* Expand */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(isExpanded ? null : product.product_id);
                      }}
                      className="text-white/40 hover:text-white transition-colors p-2"
                    >
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>

                {/* Expanded - Location Stock Management */}
                {isExpanded && (
                  <div className="border-t border-white/10 bg-black/20 p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <MapPin size={16} className="text-white/60" />
                      <h4 className="text-white/60 text-xs uppercase tracking-wider font-medium">Stock by Location</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {product.locations.map((loc) => {
                        const locKey = `${product.product_id}-${loc.location_id}`;
                        const isAdjusting = adjusting[locKey];
                        const customVal = customAmount[locKey] || '';
                        
                        return (
                          <div key={loc.inventory_id} className="bg-white/5 border border-white/10 p-5 rounded-[14px]">
                            {/* Location Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <div className="text-white font-medium text-base mb-1">{loc.location_name}</div>
                                <div className="text-white/40 text-xs">Current Stock</div>
                              </div>
                              <div className="text-right">
                                <div className="text-3xl font-thin text-white">{loc.quantity.toFixed(2)}</div>
                                <div className="text-white/40 text-xs">grams</div>
                              </div>
                            </div>

                            {/* Quick Select Weights */}
                            <div className="space-y-3">
                              <div className="grid grid-cols-4 gap-2">
                                <button
                                  onClick={() => handleLocationAdjust(product.product_id, loc.location_id, loc.inventory_id, 1)}
                                  disabled={isAdjusting}
                                  className="px-3 py-2.5 bg-white/10 border border-white/20 text-white hover:bg-white/20 disabled:opacity-20 transition-all rounded-[10px] text-sm font-medium"
                                >
                                  +1g
                                </button>
                                <button
                                  onClick={() => handleLocationAdjust(product.product_id, loc.location_id, loc.inventory_id, 3.5)}
                                  disabled={isAdjusting}
                                  className="px-3 py-2.5 bg-white/10 border border-white/20 text-white hover:bg-white/20 disabled:opacity-20 transition-all rounded-[10px] text-sm font-medium"
                                >
                                  +⅛oz
                                </button>
                                <button
                                  onClick={() => handleLocationAdjust(product.product_id, loc.location_id, loc.inventory_id, 7)}
                                  disabled={isAdjusting}
                                  className="px-3 py-2.5 bg-white/10 border border-white/20 text-white hover:bg-white/20 disabled:opacity-20 transition-all rounded-[10px] text-sm font-medium"
                                >
                                  +¼oz
                                </button>
                                <button
                                  onClick={() => handleLocationAdjust(product.product_id, loc.location_id, loc.inventory_id, 14)}
                                  disabled={isAdjusting}
                                  className="px-3 py-2.5 bg-white/10 border border-white/20 text-white hover:bg-white/20 disabled:opacity-20 transition-all rounded-[10px] text-sm font-medium"
                                >
                                  +½oz
                                </button>
                                <button
                                  onClick={() => handleLocationAdjust(product.product_id, loc.location_id, loc.inventory_id, 28)}
                                  disabled={isAdjusting}
                                  className="px-3 py-2.5 bg-white/10 border border-white/20 text-white hover:bg-white/20 disabled:opacity-20 transition-all rounded-[10px] text-sm font-medium"
                                >
                                  +1oz
                                </button>
                                <button
                                  onClick={() => handleLocationAdjust(product.product_id, loc.location_id, loc.inventory_id, 112)}
                                  disabled={isAdjusting}
                                  className="px-3 py-2.5 bg-white/10 border border-white/20 text-white hover:bg-white/20 disabled:opacity-20 transition-all rounded-[10px] text-sm font-medium"
                                >
                                  +¼lb
                                </button>
                                <button
                                  onClick={() => handleLocationAdjust(product.product_id, loc.location_id, loc.inventory_id, 224)}
                                  disabled={isAdjusting}
                                  className="px-3 py-2.5 bg-white/10 border border-white/20 text-white hover:bg-white/20 disabled:opacity-20 transition-all rounded-[10px] text-sm font-medium"
                                >
                                  +½lb
                                </button>
                                <button
                                  onClick={() => handleLocationAdjust(product.product_id, loc.location_id, loc.inventory_id, 453.6)}
                                  disabled={isAdjusting}
                                  className="px-3 py-2.5 bg-white/10 border border-white/20 text-white hover:bg-white/20 disabled:opacity-20 transition-all rounded-[10px] text-sm font-medium"
                                >
                                  +1lb
                                </button>
                              </div>

                              {/* Custom Amount */}
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="Custom amount (g)"
                                  value={customVal}
                                  onChange={(e) => setCustomAmount(prev => ({ ...prev, [locKey]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleCustomAdjust(product.product_id, loc.location_id, loc.inventory_id);
                                    }
                                  }}
                                  className="flex-1 bg-black/40 border border-white/10 text-white px-3 py-2 rounded-[10px] focus:outline-none focus:border-white/30 text-sm"
                                />
                                <button
                                  onClick={() => handleCustomAdjust(product.product_id, loc.location_id, loc.inventory_id)}
                                  disabled={isAdjusting || !customVal}
                                  className="px-4 py-2 bg-white/10 border border-white/20 text-white hover:bg-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all rounded-[10px] text-sm uppercase tracking-wider"
                                >
                                  {isAdjusting ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                  ) : (
                                    'Set'
                                  )}
                                </button>
                              </div>

                              {/* Remove Weights */}
                              <div className="grid grid-cols-4 gap-2">
                                <button
                                  onClick={() => handleLocationAdjust(product.product_id, loc.location_id, loc.inventory_id, -1)}
                                  disabled={isAdjusting || loc.quantity < 1}
                                  className="px-3 py-2 bg-black/40 border border-white/10 text-white/50 hover:bg-white/5 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all rounded-[10px] text-sm"
                                >
                                  −1g
                                </button>
                                <button
                                  onClick={() => handleLocationAdjust(product.product_id, loc.location_id, loc.inventory_id, -3.5)}
                                  disabled={isAdjusting || loc.quantity < 3.5}
                                  className="px-3 py-2 bg-black/40 border border-white/10 text-white/50 hover:bg-white/5 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all rounded-[10px] text-sm"
                                >
                                  −⅛oz
                                </button>
                                <button
                                  onClick={() => handleLocationAdjust(product.product_id, loc.location_id, loc.inventory_id, -28)}
                                  disabled={isAdjusting || loc.quantity < 28}
                                  className="px-3 py-2 bg-black/40 border border-white/10 text-white/50 hover:bg-white/5 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all rounded-[10px] text-sm"
                                >
                                  −1oz
                                </button>
                                <button
                                  onClick={() => handleLocationAdjust(product.product_id, loc.location_id, loc.inventory_id, -453.6)}
                                  disabled={isAdjusting || loc.quantity < 453.6}
                                  className="px-3 py-2 bg-black/40 border border-white/10 text-white/50 hover:bg-white/5 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all rounded-[10px] text-sm"
                                >
                                  −1lb
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="minimal-glass p-4 mt-6 flex items-center justify-between">
              <div className="text-white/60 text-sm">
                Showing {((page - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(page * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all rounded-[10px] text-sm"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-10 h-10 rounded-[10px] text-sm transition-all ${
                          page === pageNum
                            ? 'bg-white/10 text-white border border-white/20'
                            : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <span className="text-white/40 px-2">...</span>
                      <button
                        onClick={() => setPage(totalPages)}
                        className={`w-10 h-10 rounded-[10px] text-sm transition-all ${
                          page === totalPages
                            ? 'bg-white/10 text-white border border-white/20'
                            : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all rounded-[10px] text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
