'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAppAuth } from '@/context/AppAuthContext';
import { showNotification } from '@/components/NotificationToast';
import { ds, cn, Button } from '@/components/ds';
import { InventoryStats } from './InventoryStats';
import { InventoryFilters } from './InventoryFilters';
import { InventoryList } from './InventoryList';
import { ProductsPagination } from '../ProductsPagination';
import axios from 'axios';

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

/**
 * InventoryTab - Comprehensive inventory management
 * Clean, Jobs-worthy design matching products page aesthetic
 */
export function InventoryTab() {
  const { vendor } = useAppAuth();

  // Data state
  const [products, setProducts] = useState<ProductInventory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  // Pagination state
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  // Adjustment state
  const [adjusting, setAdjusting] = useState<Record<string, boolean>>({});

  // Load inventory data
  const loadInventory = useCallback(async () => {
    if (!vendor?.id) return;

    try {
      setLoading(true);
      const response = await axios.get('/api/vendor/inventory/grouped', {
        headers: { 'x-vendor-id': vendor.id },
        timeout: 20000
      });

      if (response.data.success) {
        setProducts(response.data.products || []);
        setLocations(response.data.locations || []);
      }
    } catch (error: any) {
      console.error('Inventory load error:', error);
      showNotification({
        type: 'error',
        title: 'Load Failed',
        message: error.response?.data?.error || 'Failed to load inventory'
      });
    } finally {
      setLoading(false);
    }
  }, [vendor?.id]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

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

    if (locationFilter !== 'all') {
      items = items.filter(p =>
        p.locations.some(loc => loc.location_id === locationFilter)
      );
    }

    return items;
  }, [products, search, stockFilter, categoryFilter, locationFilter]);

  // Paginate
  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, page]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Get categories
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return Array.from(cats);
  }, [products]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter(p => p.total_quantity > 10).length;
    const lowStock = products.filter(p => p.total_quantity > 0 && p.total_quantity <= 10).length;
    const outOfStock = products.filter(p => p.total_quantity === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.total_quantity), 0);

    return { total, inStock, lowStock, outOfStock, totalValue };
  }, [products]);

  // Handle stock adjustment
  const handleAdjust = useCallback(async (
    productId: string,
    locationId: string,
    inventoryId: string,
    amount: number
  ) => {
    const key = `${productId}-${locationId}`;
    setAdjusting(prev => ({ ...prev, [key]: true }));

    try {
      const response = await axios.post('/api/vendor/inventory/adjust', {
        inventoryId,
        productId,
        locationId,
        adjustment: amount,
        reason: amount > 0 ? `Added ${amount}g` : `Removed ${Math.abs(amount)}g`
      }, {
        headers: { 'x-vendor-id': vendor?.id }
      });

      if (response.data.success) {
        await loadInventory();
        showNotification({
          type: 'success',
          title: 'Stock Updated',
          message: `Stock ${amount > 0 ? 'increased' : 'decreased'} by ${Math.abs(amount)}g`
        });
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.response?.data?.error || 'Failed to adjust stock'
      });
    } finally {
      setAdjusting(prev => ({ ...prev, [key]: false }));
    }
  }, [vendor?.id, loadInventory]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className={cn(ds.typography.size.xs, ds.typography.transform.uppercase, ds.typography.tracking.wide, ds.colors.text.quaternary)}>
            {filteredProducts.length} of {products.length} items · {locations.length} locations
          </p>
        </div>
        <Button
          onClick={loadInventory}
          className="flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <InventoryStats
        total={stats.total}
        inStock={stats.inStock}
        lowStock={stats.lowStock}
        outOfStock={stats.outOfStock}
        totalValue={stats.totalValue}
        isLoading={loading}
      />

      {/* Filters */}
      <InventoryFilters
        search={search}
        stockFilter={stockFilter}
        categoryFilter={categoryFilter}
        locationFilter={locationFilter}
        categories={categories}
        locations={locations}
        onSearchChange={setSearch}
        onStockFilterChange={setStockFilter}
        onCategoryFilterChange={setCategoryFilter}
        onLocationFilterChange={setLocationFilter}
      />

      {/* Inventory List */}
      <InventoryList
        products={paginatedProducts}
        isLoading={loading}
        onAdjust={handleAdjust}
        isAdjusting={adjusting}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <ProductsPagination
          currentPage={page}
          totalPages={totalPages}
          total={filteredProducts.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setPage}
          isLoading={loading}
        />
      )}
    </div>
  );
}
