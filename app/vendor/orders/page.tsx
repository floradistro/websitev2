"use client";

import { useEffect, useState } from 'react';
import { Search, Package, DollarSign, Calendar, User, ChevronRight } from 'lucide-react';
import { useAppAuth } from '@/context/AppAuthContext';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import axios from 'axios';

interface Order {
  id: number;
  orderNumber: string;
  date: string;
  customerName: string;
  status: 'completed' | 'processing' | 'pending' | 'cancelled';
  items: OrderItem[];
  total: number;
  vendorTotal: number;
  commission: number;
}

interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export default function VendorOrders() {
  const { isAuthenticated, isLoading: authLoading, vendor } = useAppAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    async function loadOrders() {
      if (authLoading || !isAuthenticated) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Orders feature
        const vendorId = vendor?.id;
        const response = { orders: [] }; // TODO: Implement orders API
        
        if (response && response.orders) {
          const mappedOrders = response.orders.map((o: any) => ({
            id: o.order_id,
            orderNumber: `#${o.order_id}`,
            date: o.order_date || o.created_at,
            customerName: o.customer_name || 'Customer',
            status: o.order_status || 'processing',
            items: o.items || [],
            total: parseFloat(o.gross_revenue) || 0,
            vendorTotal: parseFloat(o.net_earnings) || 0,
            commission: parseFloat(o.commission_amount) || 0,
          }));
          setOrders(mappedOrders);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading orders:', error);
        setOrders([]);
        setLoading(false);
      }
    }
    
    loadOrders();
  }, [authLoading, isAuthenticated]);

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'neutral' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'processing':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (search && !order.customerName.toLowerCase().includes(search.toLowerCase()) && !order.orderNumber.includes(search)) return false;
    return true;
  });

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.vendorTotal, 0);
  const totalCommission = filteredOrders.reduce((sum, order) => sum + order.commission, 0);

  return (
    <div className="w-full px-4 lg:px-0">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-white/5">
        <h1 className="text-xs uppercase tracking-[0.15em] text-white font-black mb-1" style={{ fontWeight: 900 }}>
          Orders & Sales
        </h1>
        <p className="text-[10px] uppercase tracking-[0.15em] text-white/40">
          Track Orders · Commission Earnings
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 spacing-grid mb-8">
        <StatCard
          label="Total Orders"
          value={loading ? '—' : filteredOrders.length}
          sublabel="With Your Products"
          icon={Package}
          loading={loading}
          delay="0s"
        />
        <StatCard
          label="Gross Revenue"
          value={loading ? '—' : `$${totalRevenue.toFixed(2)}`}
          sublabel="Before Commission"
          icon={DollarSign}
          loading={loading}
          delay="0.1s"
        />
        <StatCard
          label="Your Earnings"
          value={loading ? '—' : `$${(totalRevenue - totalCommission).toFixed(2)}`}
          sublabel="After Commission"
          icon={DollarSign}
          loading={loading}
          delay="0.2s"
        />
      </div>

      {/* Filters */}
      <div className="minimal-glass p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search by customer name or order number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/20 border border-white/10 text-white placeholder-white/30 pl-10 pr-4 py-3 focus:outline-none focus:border-white/30 transition-all rounded-2xl text-base"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0 lg:pb-0 scrollbar-hide">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all whitespace-nowrap rounded-2xl ${
                statusFilter === 'all'
                  ? 'bg-gradient-to-r from-white/10 to-white/5 text-white border-white/20 border'
                  : 'bg-black/20 text-white/50 border border-white/10 hover:border-white/20 hover:text-white/70'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all whitespace-nowrap rounded-2xl ${
                statusFilter === 'completed'
                  ? 'bg-gradient-to-r from-white/10 to-white/5 text-white border border-white/20'
                  : 'bg-black/20 text-white/50 border border-white/10 hover:border-white/20 hover:text-white/70'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setStatusFilter('processing')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all whitespace-nowrap rounded-2xl ${
                statusFilter === 'processing'
                  ? 'bg-gradient-to-r from-white/10 to-white/5 text-white border border-white/20'
                  : 'bg-black/20 text-white/50 border border-white/10 hover:border-white/20 hover:text-white/70'
              }`}
            >
              Processing
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="minimal-glass p-12 text-center">
          <div className="text-white/40 text-xs">Loading orders...</div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="minimal-glass p-12">
          <div className="text-center">
            <Package size={48} className="text-white/20 mx-auto mb-4" />
            <div className="text-white/60">No orders found</div>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile List View */}
          <div className="lg:hidden divide-y divide-white/5 -mx-4" style={{ animation: 'fadeInUp 0.6s ease-out 0.3s both' }}>
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="px-4 py-3 hover:bg-white/[0.02] transition-all bg-black"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-white text-sm font-medium mb-0.5">{order.customerName}</div>
                    <div className="text-white/40 text-xs font-mono">{order.orderNumber}</div>
                  </div>
                  <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>{new Date(order.date).toLocaleDateString()}</span>
                  <span className="text-white font-medium">${order.vendorTotal.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block minimal-glass overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-white/5 bg-black/40">
              <tr>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Order</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Date</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Customer</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Items</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Your Total</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Commission</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Status</th>
                <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-white/[0.02] transition-all group">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-white/40" />
                      <span className="text-white font-mono text-sm">{order.orderNumber}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <Calendar size={14} className="text-white/40" />
                      {new Date(order.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-white/40" />
                      <span className="text-white text-sm">{order.customerName}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-white/60 text-sm">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-white text-sm font-medium">${order.vendorTotal.toFixed(2)}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-red-500/80 text-sm">-${order.commission.toFixed(2)}</span>
                  </td>
                  <td className="p-4">
                    <Badge variant={getStatusVariant(order.status)}>{order.status}</Badge>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-white/60 hover:text-white text-sm flex items-center gap-1 transition-colors group-hover:gap-2 duration-300"
                    >
                      View
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-black/95 backdrop-blur-xl border border-white/10 rounded-[20px] max-w-2xl w-full p-6 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-light text-white mb-1">Order {selectedOrder.orderNumber}</h2>
                <p className="text-white/60 text-sm">{selectedOrder.customerName}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h3 className="text-xs uppercase tracking-wider text-white/60 mb-3">Order Items</h3>
              <div className="space-y-2">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-[12px]">
                    <div>
                      <div className="text-white text-sm">{item.productName}</div>
                      <div className="text-white/60 text-xs">Qty: {item.quantity}</div>
                    </div>
                    <div className="text-white font-medium">${item.total.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t border-white/10 pt-4">
              <div className="flex justify-between mb-2">
                <span className="text-white/60 text-sm">Order Total</span>
                <span className="text-white font-medium">${selectedOrder.vendorTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-white/60 text-sm">Commission (15%)</span>
                <span className="text-red-500/80">-${selectedOrder.commission.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10">
                <span className="text-white font-medium">Your Earnings</span>
                <span className="text-white font-medium">${(selectedOrder.vendorTotal - selectedOrder.commission).toFixed(2)}</span>
              </div>
            </div>

            {/* Order Info */}
            <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-white/60 text-xs mb-1">Order Date</div>
                <div className="text-white">{new Date(selectedOrder.date).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-white/60 text-xs mb-1">Status</div>
                <Badge variant={getStatusVariant(selectedOrder.status)}>{selectedOrder.status}</Badge>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

