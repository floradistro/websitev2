'use client';

import { useEffect, useState, useMemo } from 'react';
import { ArrowDown, ArrowUp, Plus } from 'lucide-react';
import { useAppAuth } from '@/context/AppAuthContext';
import { ds, cn, Button } from '@/components/ds';
import axios from 'axios';

// Import the same components we use in the Products tab
import { POStats } from '../products/components/purchase-orders/POStats';
import { POFilters } from '../products/components/purchase-orders/POFilters';
import { POList } from '../products/components/purchase-orders/POList';

interface PurchaseOrder {
  id: string;
  po_number: string;
  po_type: 'inbound' | 'outbound';
  status: string;
  total: number;
  created_at: string;
  supplier?: { external_name: string };
  wholesale_customer?: { external_company_name: string };
  items?: any[];
}

/**
 * Standalone Purchase Orders Page
 * Manages both inbound (supplier) and outbound (wholesale) orders
 * Clean, Jobs-worthy design matching products page
 */
export default function PurchaseOrdersPage() {
  const { vendor } = useAppAuth();
  const [activeType, setActiveType] = useState<'inbound' | 'outbound'>('inbound');
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Load data
  const loadOrders = async () => {
    if (!vendor?.id) return;

    try {
      setLoading(true);
      const response = await axios.get(`/api/vendor/purchase-orders`, {
        params: {
          vendor_id: vendor.id,
          po_type: activeType
        }
      });
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error loading POs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [vendor?.id, activeType]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(po => {
      // Status filter
      if (statusFilter !== 'all' && po.status !== statusFilter) return false;

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const poNumber = po.po_number?.toLowerCase() || '';
        const partner = activeType === 'inbound'
          ? po.supplier?.external_name?.toLowerCase() || ''
          : po.wholesale_customer?.external_company_name?.toLowerCase() || '';
        return poNumber.includes(searchLower) || partner.includes(searchLower);
      }

      return true;
    });
  }, [orders, statusFilter, search, activeType]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = orders.length;
    const draft = orders.filter(po => po.status === 'draft').length;
    const active = orders.filter(po => ['sent', 'confirmed'].includes(po.status)).length;
    const completed = orders.filter(po => ['fulfilled', 'received'].includes(po.status)).length;
    const totalValue = orders.reduce((sum, po) => sum + (parseFloat(po.total?.toString() || '0')), 0);

    return { total, draft, active, completed, totalValue };
  }, [orders]);

  return (
    <main className={cn(ds.colors.bg.primary, "min-h-screen px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-6")}>
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className={cn(ds.typography.size.xl, "text-white font-light mb-2")}>
            Purchase Orders
          </h1>
          <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary, ds.typography.transform.uppercase, ds.typography.tracking.wide)}>
            Manage supplier purchases & wholesale sales
          </p>
        </div>

        {/* Type Switcher + Create Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveType('inbound')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
                ds.typography.size.xs,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
                activeType === 'inbound'
                  ? 'bg-white text-black'
                  : cn(ds.colors.bg.hover, ds.colors.text.quaternary, 'hover:bg-white/10')
              )}
            >
              <ArrowDown size={14} strokeWidth={1.5} />
              Inbound
              <span className={cn("px-1.5 py-0.5 rounded text-[8px]", activeType === 'inbound' ? 'bg-black/10' : ds.colors.bg.hover)}>
                {orders.filter(o => o.po_type === 'inbound').length}
              </span>
            </button>
            <button
              onClick={() => setActiveType('outbound')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
                ds.typography.size.xs,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
                activeType === 'outbound'
                  ? 'bg-white text-black'
                  : cn(ds.colors.bg.hover, ds.colors.text.quaternary, 'hover:bg-white/10')
              )}
            >
              <ArrowUp size={14} strokeWidth={1.5} />
              Outbound
              <span className={cn("px-1.5 py-0.5 rounded text-[8px]", activeType === 'outbound' ? 'bg-black/10' : ds.colors.bg.hover)}>
                {orders.filter(o => o.po_type === 'outbound').length}
              </span>
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              // TODO: Open create PO modal
              alert(`Create ${activeType} PO - Coming soon!`);
            }}
          >
            <Plus size={14} strokeWidth={1.5} />
            Create {activeType === 'inbound' ? 'Purchase' : 'Sales'} Order
          </Button>
        </div>

        {/* Info Banner */}
        <div className={cn("rounded-2xl border p-4 mb-6", ds.colors.bg.secondary, ds.colors.border.default)}>
          <p className={cn(ds.typography.size.xs, "text-white/80")}>
            {activeType === 'inbound' ? (
              <>
                <strong>Inbound:</strong> Purchase orders for buying inventory from suppliers
              </>
            ) : (
              <>
                <strong>Outbound:</strong> Sales orders for wholesale customers (B2B sales)
              </>
            )}
          </p>
        </div>

        {/* Stats */}
        <POStats
          total={stats.total}
          draft={stats.draft}
          active={stats.active}
          completed={stats.completed}
          totalValue={stats.totalValue}
          isLoading={loading}
        />

        {/* Filters */}
        <POFilters
          search={search}
          statusFilter={statusFilter}
          onSearchChange={setSearch}
          onStatusFilterChange={setStatusFilter}
        />

        {/* Orders List */}
        <POList
          orders={filteredOrders}
          isLoading={loading}
          type={activeType}
        />
      </div>
    </main>
  );
}
