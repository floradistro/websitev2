"use client";

import { useEffect, useState } from 'react';
import { Search, Package, DollarSign, Calendar, User, ChevronRight } from 'lucide-react';

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    // TODO: Fetch actual orders from API: /vendor-marketplace/v1/orders
    // For now, mock data with real customer names
    setTimeout(() => {
      setOrders([
        {
          id: 41778,
          orderNumber: '#41778',
          date: '2025-10-18',
          customerName: 'Zachariah Kryger',
          status: 'completed',
          items: [
            { productId: 50001, productName: 'OG Kush', quantity: 1, price: 39.99, total: 39.99 },
            { productId: 50009, productName: 'Wedding Cake', quantity: 1, price: 39.99, total: 39.99 },
          ],
          total: 79.98,
          vendorTotal: 79.98,
          commission: 12.00,
        },
        {
          id: 41776,
          orderNumber: '#41776',
          date: '2025-10-18',
          customerName: 'Alasia Dayhana Chestnut',
          status: 'completed',
          items: [
            { productId: 50002, productName: 'Blue Dream', quantity: 1, price: 39.99, total: 39.99 },
          ],
          total: 39.99,
          vendorTotal: 39.99,
          commission: 6.00,
        },
        {
          id: 41770,
          orderNumber: '#41770',
          date: '2025-10-17',
          customerName: 'Brendon Balzano',
          status: 'completed',
          items: [
            { productId: 50005, productName: 'Gelato', quantity: 1, price: 69.99, total: 69.99 },
          ],
          total: 69.99,
          vendorTotal: 69.99,
          commission: 10.50,
        },
        {
          id: 41769,
          orderNumber: '#41769',
          date: '2025-10-17',
          customerName: 'Jordan Nicole Cooper',
          status: 'processing',
          items: [
            { productId: 50003, productName: 'Sour Diesel', quantity: 1, price: 69.99, total: 69.99 },
            { productId: 50007, productName: 'Purple Punch', quantity: 1, price: 39.99, total: 39.99 },
          ],
          total: 109.98,
          vendorTotal: 109.98,
          commission: 16.50,
        },
        {
          id: 41765,
          orderNumber: '#41765',
          date: '2025-10-16',
          customerName: 'Marcus Thompson',
          status: 'completed',
          items: [
            { productId: 50004, productName: 'Girl Scout Cookies', quantity: 1, price: 39.99, total: 39.99 },
          ],
          total: 39.99,
          vendorTotal: 39.99,
          commission: 6.00,
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: "bg-green-500/10 text-green-500 border-green-500/20",
      processing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium uppercase tracking-wider border ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    );
  };

  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (search && !order.customerName.toLowerCase().includes(search.toLowerCase()) && !order.orderNumber.includes(search)) return false;
    return true;
  });

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.vendorTotal, 0);
  const totalCommission = filteredOrders.reduce((sum, order) => sum + order.commission, 0);

  return (
    <div className="max-w-7xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="mb-8" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        <h1 className="text-3xl font-light text-white mb-2 tracking-tight">
          Orders & Sales
        </h1>
        <p className="text-white/60 text-sm">
          Track orders containing your products and commission earnings
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" style={{ animation: 'fadeInUp 0.6s ease-out 0.1s both' }}>
        <div className="bg-[#1a1a1a] border border-white/5 p-6 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white/60 text-xs uppercase tracking-wider">Total Orders</div>
              <Package size={20} className="text-white/40" />
            </div>
            <div className="text-3xl font-light text-white mb-1">
              {loading ? '—' : filteredOrders.length}
            </div>
            <div className="text-white/40 text-xs">Orders with your products</div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-white/5 p-6 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white/60 text-xs uppercase tracking-wider">Gross Revenue</div>
              <DollarSign size={20} className="text-green-500/60" />
            </div>
            <div className="text-3xl font-light text-white mb-1">
              {loading ? '—' : `$${totalRevenue.toFixed(2)}`}
            </div>
            <div className="text-green-500/60 text-xs">Before commission</div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-white/5 p-6 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white/60 text-xs uppercase tracking-wider">Your Earnings</div>
              <DollarSign size={20} className="text-green-500/60" />
            </div>
            <div className="text-3xl font-light text-white mb-1">
              {loading ? '—' : `$${(totalRevenue - totalCommission).toFixed(2)}`}
            </div>
            <div className="text-green-500/60 text-xs">After 15% commission</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#1a1a1a] border border-white/5 p-4 mb-6" style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search by customer name or order number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-white/10 transition-colors"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-black border border-white'
                  : 'bg-[#1a1a1a] text-white/60 hover:text-white border border-white/5 hover:border-white/10'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
                statusFilter === 'completed'
                  ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                  : 'bg-[#1a1a1a] text-white/60 hover:text-white border border-white/5 hover:border-white/10'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setStatusFilter('processing')}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all ${
                statusFilter === 'processing'
                  ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                  : 'bg-[#1a1a1a] text-white/60 hover:text-white border border-white/5 hover:border-white/10'
              }`}
            >
              Processing
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="bg-[#1a1a1a] border border-white/5 p-12">
          <div className="text-center text-white/60">Loading orders...</div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-[#1a1a1a] border border-white/5 p-12">
          <div className="text-center">
            <Package size={48} className="text-white/20 mx-auto mb-4" />
            <div className="text-white/60">No orders found</div>
          </div>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] border border-white/5 overflow-hidden" style={{ animation: 'fadeInUp 0.6s ease-out 0.3s both' }}>
          <table className="w-full">
            <thead className="border-b border-white/5 bg-[#1a1a1a]">
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
                <tr key={order.id} className="hover:bg-[#303030] transition-all group">
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
                    {getStatusBadge(order.status)}
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
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-[#1a1a1a] border border-white/10 max-w-2xl w-full p-6 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
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
                  <div key={idx} className="flex justify-between items-center p-3 bg-white/5 border border-white/5">
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
                <span className="text-white/60 text-sm">Flora Commission (15%)</span>
                <span className="text-red-500/80">-${selectedOrder.commission.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10">
                <span className="text-white font-medium">Your Earnings</span>
                <span className="text-green-500 font-medium">${(selectedOrder.vendorTotal - selectedOrder.commission).toFixed(2)}</span>
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
                <div>{getStatusBadge(selectedOrder.status)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

