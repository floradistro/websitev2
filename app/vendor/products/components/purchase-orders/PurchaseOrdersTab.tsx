'use client';

import { useEffect, useState, useMemo } from 'react';
import { Package } from 'lucide-react';
import { useAppAuth } from '@/context/AppAuthContext';
import { ds, cn } from '@/components/ds';
import { POStats } from './POStats';
import { POFilters } from './POFilters';
import { POList } from './POList';
import axios from 'axios';

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
 * PurchaseOrdersTab - Inbound purchase orders only
 * For purchasing inventory FROM suppliers
 * (Outbound wholesale sales are in Commerce → Orders)
 */
export function PurchaseOrdersTab() {
  const { vendor } = useAppAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Load INBOUND orders only
  const loadOrders = async () => {
    if (!vendor?.id) return;

    try {
      setLoading(true);
      const response = await axios.get(`/api/vendor/purchase-orders`, {
        params: {
          vendor_id: vendor.id,
          po_type: 'inbound' // Only load inbound purchase orders
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
  }, [vendor?.id]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(po => {
      // Status filter
      if (statusFilter !== 'all' && po.status !== statusFilter) return false;

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const poNumber = po.po_number?.toLowerCase() || '';
        // Only inbound orders, so only check supplier
        const partner = po.supplier?.external_name?.toLowerCase() || '';
        return poNumber.includes(searchLower) || partner.includes(searchLower);
      }

      return true;
    });
  }, [orders, statusFilter, search]);

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
    <div>
      {/* Header Note */}
      <div className={cn("rounded-2xl border p-4 mb-6 flex items-start gap-3", ds.colors.bg.secondary, ds.colors.border.default)}>
        <Package size={16} className={cn(ds.colors.text.quaternary, "mt-0.5")} strokeWidth={1} />
        <div>
          <p className={cn(ds.typography.size.xs, "text-white/80 mb-1")}>
            Inbound purchase orders for buying inventory from suppliers
          </p>
          <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary)}>
            For wholesale sales (outbound), create orders for your wholesale customers separately
          </p>
        </div>
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
        type="inbound"
      />
    </div>
  );
}
