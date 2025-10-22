"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Download, Eye, RefreshCw, CreditCard, Package, TruckIcon, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  transaction_id: string;
  payment_method: string;
  delivery_type: string;
  order_date: string;
  customer: {
    email: string;
    first_name: string;
    last_name: string;
  };
  order_items: any[];
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter, paymentFilter]);

  async function loadOrders() {
    try {
      setLoading(true);
      let url = `/api/supabase/orders?page=${page}&per_page=20`;
      
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      if (paymentFilter !== 'all') {
        url += `&payment_status=${paymentFilter}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      
      if (data.success) {
        setOrders(data.orders || []);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      processing: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      completed: 'bg-green-500/10 text-green-500 border-green-500/20',
      cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
      failed: 'bg-red-500/10 text-red-500 border-red-500/20',
      'on-hold': 'bg-orange-500/10 text-orange-500 border-orange-500/20'
    };

    return (
      <span className={`px-2 py-1 text-xs border ${styles[status] || 'bg-white/5 text-white/50 border-white/10'}`}>
        {status.toUpperCase()}
      </span>
    );
  }

  function getPaymentBadge(status: string) {
    const styles: Record<string, string> = {
      paid: 'bg-green-500/10 text-green-500 border-green-500/20',
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      failed: 'bg-red-500/10 text-red-500 border-red-500/20',
      refunded: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      partially_refunded: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      disputed: 'bg-red-500/10 text-red-500 border-red-500/20'
    };

    return (
      <span className={`px-2 py-1 text-xs border ${styles[status] || 'bg-white/5 text-white/50 border-white/10'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="w-full animate-fadeIn px-4 lg:px-0">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl text-white mb-2 font-light tracking-tight">
            Orders & Transactions
          </h1>
          <p className="text-white/50 text-sm">
            Manage orders, payments, and fulfillment
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={loadOrders}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-red-500/30 transition-all text-sm flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-red-500/30 transition-all text-sm flex items-center gap-2"
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <CreditCard size={20} className="text-green-500" />
            <span className="text-2xl font-light text-white">
              ${orders.reduce((sum, o) => sum + parseFloat(o.total_amount.toString()), 0).toFixed(2)}
            </span>
          </div>
          <p className="text-white/50 text-xs uppercase tracking-wider">Total Revenue</p>
        </div>

        <div className="bg-white/5 border border-white/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <Package size={20} className="text-blue-500" />
            <span className="text-2xl font-light text-white">
              {orders.filter(o => o.payment_status === 'paid').length}
            </span>
          </div>
          <p className="text-white/50 text-xs uppercase tracking-wider">Paid Orders</p>
        </div>

        <div className="bg-white/5 border border-white/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <TruckIcon size={20} className="text-yellow-500" />
            <span className="text-2xl font-light text-white">
              {orders.filter(o => o.status === 'processing').length}
            </span>
          </div>
          <p className="text-white/50 text-xs uppercase tracking-wider">Processing</p>
        </div>

        <div className="bg-white/5 border border-white/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle size={20} className="text-green-500" />
            <span className="text-2xl font-light text-white">
              {orders.filter(o => o.status === 'completed').length}
            </span>
          </div>
          <p className="text-white/50 text-xs uppercase tracking-wider">Completed</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={18} />
          <input
            type="text"
            placeholder="Search orders, emails, transaction IDs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-red-500/50 focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 bg-white/5 border border-white/10 text-white focus:border-red-500/50 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="on-hold">On Hold</option>
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => {
            setPaymentFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 bg-white/5 border border-white/10 text-white focus:border-red-500/50 focus:outline-none"
        >
          <option value="all">All Payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
          <option value="disputed">Disputed</option>
        </select>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white/5 border border-white/10 p-12 text-center">
          <Package size={48} className="mx-auto mb-4 text-white/20" />
          <p className="text-white/50">No orders found</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white/5 border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-white/50 font-normal">Order</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-white/50 font-normal">Customer</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-white/50 font-normal">Date</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-white/50 font-normal">Status</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-white/50 font-normal">Payment</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-white/50 font-normal">Total</th>
                    <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-white/50 font-normal">Transaction ID</th>
                    <th className="text-center px-4 py-3 text-xs uppercase tracking-wider text-white/50 font-normal">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-white font-medium">{order.order_number}</p>
                          <p className="text-white/50 text-xs">{order.order_items?.length || 0} items</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-white text-sm">{order.customer?.first_name} {order.customer?.last_name}</p>
                          <p className="text-white/50 text-xs">{order.customer?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-white/70 text-sm">
                        {new Date(order.order_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-4 py-4">
                        {getPaymentBadge(order.payment_status)}
                      </td>
                      <td className="px-4 py-4 text-white font-medium">
                        ${parseFloat(order.total_amount.toString()).toFixed(2)}
                      </td>
                      <td className="px-4 py-4">
                        {order.transaction_id ? (
                          <code className="text-xs text-green-500 bg-green-500/10 px-2 py-1 border border-green-500/20">
                            {order.transaction_id.substring(0, 12)}...
                          </code>
                        ) : (
                          <span className="text-white/30 text-xs">No transaction</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/30 transition-all text-xs"
                        >
                          <Eye size={14} />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white/5 border border-white/10 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-medium">{order.order_number}</p>
                    <p className="text-white/50 text-xs">
                      {new Date(order.order_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(order.status)}
                    {getPaymentBadge(order.payment_status)}
                  </div>
                </div>

                <div className="space-y-2 mb-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/50">Customer:</span>
                    <span className="text-white">{order.customer?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Total:</span>
                    <span className="text-white font-medium">${parseFloat(order.total_amount.toString()).toFixed(2)}</span>
                  </div>
                  {order.transaction_id && (
                    <div className="flex justify-between">
                      <span className="text-white/50">Transaction:</span>
                      <code className="text-xs text-green-500">{order.transaction_id.substring(0, 12)}...</code>
                    </div>
                  )}
                </div>

                <Link
                  href={`/admin/orders/${order.id}`}
                  className="block w-full text-center px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 hover:border-red-500/30 transition-all text-sm"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-white/50 text-sm">
                Page {pagination.page} of {pagination.total_pages} ({pagination.total} total orders)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-red-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
                  disabled={page === pagination.total_pages}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-red-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm"
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

