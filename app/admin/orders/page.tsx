"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, Download, Eye, RefreshCw, CreditCard, Package, TruckIcon, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { TableSkeleton } from '@/components/AdminSkeleton';

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
      pending: 'bg-white/5 text-white/40 border-white/10',
      processing: 'bg-white/5 text-white/50 border-white/15',
      completed: 'bg-white/5 text-white/50 border-white/15',
      cancelled: 'bg-white/5 text-white/30 border-white/10',
      failed: 'bg-white/5 text-white/30 border-white/10',
      'on-hold': 'bg-white/5 text-white/40 border-white/10'
    };

    return (
      <span className={`px-2 py-0.5 text-[10px] border tracking-wider uppercase font-light ${styles[status] || 'bg-white/5 text-white/30 border-white/10'}`}>
        {status.toUpperCase()}
      </span>
    );
  }

  function getPaymentBadge(status: string) {
    const styles: Record<string, string> = {
      paid: 'bg-white/5 text-white/50 border-white/15',
      pending: 'bg-white/5 text-white/40 border-white/10',
      failed: 'bg-white/5 text-white/30 border-white/10',
      refunded: 'bg-white/5 text-white/40 border-white/10',
      partially_refunded: 'bg-white/5 text-white/40 border-white/10',
      disputed: 'bg-white/5 text-white/30 border-white/10'
    };

    return (
      <span className={`px-2 py-0.5 text-[10px] border tracking-wider uppercase font-light ${styles[status] || 'bg-white/5 text-white/30 border-white/10'}`}>
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
    <div className="w-full px-4 lg:px-0">
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .minimal-glass {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .subtle-glow {
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.02);
        }
        /* Modern minimal checkbox */
        input[type="checkbox"] {
          appearance: none;
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.03);
          cursor: pointer;
          position: relative;
          transition: all 0.3s ease;
        }
        input[type="checkbox"]:hover {
          border-color: rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.05);
        }
        input[type="checkbox"]:checked {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
        }
        input[type="checkbox"]:checked::after {
          content: '';
          position: absolute;
          left: 5px;
          top: 2px;
          width: 4px;
          height: 8px;
          border: solid rgba(255, 255, 255, 0.9);
          border-width: 0 1.5px 1.5px 0;
          transform: rotate(45deg);
        }
      `}</style>

      {/* Header */}
      <div className="mb-12 flex items-center justify-between gap-4 flex-wrap fade-in">
        <div>
          <h1 className="text-3xl font-thin text-white/90 tracking-tight mb-2">
            Transactions
          </h1>
          <p className="text-white/40 text-xs font-light tracking-wide">
            ORDER MANAGEMENT · PAYMENTS · FULFILLMENT
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={loadOrders}
            className="px-4 py-2 bg-black/20 hover:bg-white/[0.03] text-white border border-white/10 hover:border-white/20 transition-all duration-300 text-[11px] font-light tracking-wide uppercase flex items-center gap-2"
          >
            <RefreshCw size={14} strokeWidth={1.5} />
            Refresh
          </button>
          <button
            className="px-4 py-2 bg-black/20 hover:bg-white/[0.03] text-white border border-white/10 hover:border-white/20 transition-all duration-300 text-[11px] font-light tracking-wide uppercase flex items-center gap-2"
          >
            <Download size={14} strokeWidth={1.5} />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <div className="minimal-glass subtle-glow p-6 hover:bg-white/[0.03] transition-all duration-300 fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-4">
            <CreditCard size={16} className="text-white/20" strokeWidth={1.5} />
            <span className="text-3xl font-thin text-white">
              ${orders.reduce((sum, o) => sum + parseFloat(o.total_amount.toString()), 0).toFixed(2)}
            </span>
          </div>
          <p className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">Total Revenue</p>
        </div>

        <div className="minimal-glass subtle-glow p-6 hover:bg-white/[0.03] transition-all duration-300 fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <Package size={16} className="text-white/20" strokeWidth={1.5} />
            <span className="text-3xl font-thin text-white">
              {orders.filter(o => o.payment_status === 'paid').length}
            </span>
          </div>
          <p className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">Paid Orders</p>
        </div>

        <div className="minimal-glass subtle-glow p-6 hover:bg-white/[0.03] transition-all duration-300 fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <TruckIcon size={16} className="text-white/20" strokeWidth={1.5} />
            <span className="text-3xl font-thin text-white">
              {orders.filter(o => o.status === 'processing').length}
            </span>
          </div>
          <p className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">Processing</p>
        </div>

        <div className="minimal-glass subtle-glow p-6 hover:bg-white/[0.03] transition-all duration-300 fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-4">
            <CheckCircle size={16} className="text-white/20" strokeWidth={1.5} />
            <span className="text-3xl font-thin text-white">
              {orders.filter(o => o.status === 'completed').length}
            </span>
          </div>
          <p className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">Completed</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-3 fade-in" style={{ animationDelay: '0.5s' }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search orders, emails, transaction IDs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black/20 border border-white/10 text-white placeholder-white/30 focus:border-white/20 focus:outline-none transition-all duration-300 text-xs font-light"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2.5 bg-black/20 border border-white/10 text-white focus:border-white/20 focus:outline-none transition-all duration-300 text-xs font-light"
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
          className="px-4 py-2.5 bg-black/20 border border-white/10 text-white focus:border-white/20 focus:outline-none transition-all duration-300 text-xs font-light"
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
          <div className="text-white/20 text-xs font-light tracking-wider">LOADING ORDERS...</div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="minimal-glass subtle-glow p-12 text-center fade-in">
          <Package size={32} className="mx-auto mb-4 text-white/10" strokeWidth={1.5} />
          <p className="text-white/30 text-xs font-light tracking-wider uppercase">No Orders Found</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block minimal-glass subtle-glow overflow-hidden fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/20 border-b border-white/5">
                  <tr>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-white/40 font-light">Order</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-white/40 font-light">Customer</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-white/40 font-light">Date</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-white/40 font-light">Status</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-white/40 font-light">Payment</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-white/40 font-light">Total</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-white/40 font-light">Transaction ID</th>
                    <th className="text-center px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-white/40 font-light">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-white/[0.02] transition-all duration-300">
                      <td className="px-4 lg:px-6 py-4">
                        <div>
                          <p className="text-white/90 font-light text-sm">{order.order_number}</p>
                          <p className="text-white/30 text-xs font-light">{order.order_items?.length || 0} items</p>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        <div>
                          <p className="text-white/90 text-sm font-light">{order.customer?.first_name} {order.customer?.last_name}</p>
                          <p className="text-white/30 text-xs font-light">{order.customer?.email}</p>
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-white/50 text-xs font-light">
                        {new Date(order.order_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        {getPaymentBadge(order.payment_status)}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-white/90 font-light">
                        ${parseFloat(order.total_amount.toString()).toFixed(2)}
                      </td>
                      <td className="px-4 lg:px-6 py-4">
                        {order.transaction_id ? (
                          <code className="text-[10px] text-white/40 bg-white/5 px-2 py-1 border border-white/10 font-light tracking-wider">
                            {order.transaction_id.substring(0, 12)}...
                          </code>
                        ) : (
                          <span className="text-white/20 text-xs font-light">—</span>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-4 text-center">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition-all duration-300 text-[10px] tracking-wider uppercase font-light"
                        >
                          <Eye size={12} strokeWidth={1.5} />
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
          <div className="lg:hidden space-y-3">
            {filteredOrders.map((order) => (
              <div key={order.id} className="minimal-glass subtle-glow p-4 hover:bg-white/[0.02] transition-all duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white/90 font-light text-sm">{order.order_number}</p>
                    <p className="text-white/30 text-xs font-light">
                      {new Date(order.order_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(order.status)}
                    {getPaymentBadge(order.payment_status)}
                  </div>
                </div>

                <div className="space-y-2 mb-3 text-xs font-light">
                  <div className="flex justify-between">
                    <span className="text-white/40">Customer:</span>
                    <span className="text-white/70">{order.customer?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Total:</span>
                    <span className="text-white/90">${parseFloat(order.total_amount.toString()).toFixed(2)}</span>
                  </div>
                  {order.transaction_id && (
                    <div className="flex justify-between">
                      <span className="text-white/40">Transaction:</span>
                      <code className="text-[10px] text-white/40">{order.transaction_id.substring(0, 12)}...</code>
                    </div>
                  )}
                </div>

                <Link
                  href={`/admin/orders/${order.id}`}
                  className="block w-full text-center px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition-all duration-300 text-[10px] tracking-wider uppercase font-light"
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-white/40 text-xs font-light tracking-wide">
                PAGE {pagination.page} OF {pagination.total_pages} · {pagination.total} TOTAL
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-black/20 hover:bg-white/[0.03] text-white/60 hover:text-white border border-white/10 hover:border-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-300 text-[11px] uppercase tracking-[0.2em] font-light"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
                  disabled={page === pagination.total_pages}
                  className="px-4 py-2 bg-black/20 hover:bg-white/[0.03] text-white/60 hover:text-white border border-white/10 hover:border-white/20 disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-300 text-[11px] uppercase tracking-[0.2em] font-light"
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


