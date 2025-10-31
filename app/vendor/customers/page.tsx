'use client';

import { useState, useEffect } from 'react';
import { Search, Users, Award, TrendingUp, DollarSign, Mail, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppAuth } from '@/context/AppAuthContext';

interface Customer {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  loyalty_points: number;
  loyalty_tier: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string | null;
  created_at: string;
}

export default function CustomersPage() {
  const { vendor } = useAppAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    withLoyalty: 0,
    avgPoints: 0,
    totalLifetimeValue: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    if (vendor) {
      loadCustomers();
    }
  }, [page, tierFilter, vendor]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        loadCustomers();
      } else {
        setPage(1); // Reset to page 1 on search
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function loadCustomers() {
    if (!vendor) return; // Wait for vendor to load

    setLoading(true);

    const params = new URLSearchParams({
      page: page.toString(),
      limit: '50',
      search: searchQuery,
      tier: tierFilter,
    });

    try {
      const response = await fetch(`/api/vendor/customers?${params}`, {
        headers: {
          'x-vendor-id': vendor.id,
        },
      });
      const data = await response.json();

      if (data.error) {
        console.error('Error:', data.error);
      } else {
        setCustomers(data.customers || []);
        setStats(data.stats || stats);
        setPagination(data.pagination || pagination);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
    }

    setLoading(false);
  }

  const tierColors = {
    bronze: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    silver: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    gold: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    platinum: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-white/5">
        <div className="flex items-center gap-4 mb-2">
          <Users size={32} className="text-white" strokeWidth={2} />
          <div>
            <h1 className="text-xs uppercase tracking-[0.15em] text-white font-black" style={{ fontWeight: 900 }}>
              Customers
            </h1>
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 mt-1">
              {stats.total.toLocaleString()} total customers
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 mb-2">Total Customers</p>
              <p className="text-3xl font-black text-white">{stats.total.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 mb-2">Loyalty Members</p>
              <p className="text-3xl font-black text-white">{stats.withLoyalty.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
              <Award className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 mb-2">Avg Loyalty Points</p>
              <p className="text-3xl font-black text-white">{stats.avgPoints.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-xl border border-green-500/30">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 mb-2">Lifetime Value</p>
              <p className="text-3xl font-black text-white">${stats.totalLifetimeValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="p-3 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
              <DollarSign className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white pl-10 pr-4 py-2.5 rounded-2xl text-[10px] uppercase tracking-[0.15em] focus:outline-none focus:border-white/20 placeholder:text-white/40 hover:bg-white/10 transition-all"
            />
          </div>

          {/* Tier Filter */}
          <div className="relative">
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="bg-white/5 border border-white/10 text-white px-4 py-2.5 rounded-2xl text-[10px] uppercase tracking-[0.15em] focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all cursor-pointer appearance-none pr-10"
            >
              <option value="all">All Tiers</option>
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-3 h-3 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-[0.15em] text-white/40 font-black">
                  Customer
                </th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-[0.15em] text-white/40 font-black">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-[0.15em] text-white/40 font-black">
                  Loyalty
                </th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-[0.15em] text-white/40 font-black">
                  Orders
                </th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-[0.15em] text-white/40 font-black">
                  Total Spent
                </th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-[0.15em] text-white/40 font-black">
                  Last Order
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-white/40 text-[10px] uppercase tracking-[0.15em]">
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-white/40 text-[10px] uppercase tracking-[0.15em]">
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 h-10 w-10 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                          <span className="text-white/60 font-medium text-sm">
                            {customer.first_name?.[0] || '?'}{customer.last_name?.[0] || ''}
                          </span>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.15em] font-black text-white">
                            {customer.first_name || 'Unknown'} {customer.last_name || ''}
                          </div>
                          <div className="text-[10px] text-white/40">
                            {customer.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-2">
                        {customer.email && !customer.email.includes('@phone.local') && !customer.email.includes('@alpine.local') && (
                          <div className="flex items-center text-[10px] text-white/60 gap-2">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center text-[10px] text-white/60 gap-2">
                            <Phone className="w-3 h-3" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-2">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.15em] font-black border ${tierColors[customer.loyalty_tier as keyof typeof tierColors]}`}>
                          {customer.loyalty_tier}
                        </span>
                        <span className="text-[10px] text-white/40 uppercase tracking-[0.15em]">
                          {customer.loyalty_points.toLocaleString()} pts
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[10px] uppercase tracking-[0.15em] text-white font-black">
                      {customer.total_orders || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[10px] uppercase tracking-[0.15em] text-white font-black">
                      ${(customer.total_spent || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[10px] text-white/40 uppercase tracking-[0.15em]">
                      {customer.last_order_date
                        ? new Date(customer.last_order_date).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-[0.15em] text-white/40">
            Showing <span className="text-white font-black">{((page - 1) * pagination.limit) + 1}</span> to{' '}
            <span className="text-white font-black">{Math.min(page * pagination.limit, pagination.total)}</span> of{' '}
            <span className="text-white font-black">{pagination.total}</span> customers
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[10px] uppercase tracking-[0.15em] font-black hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <span className="text-[10px] uppercase tracking-[0.15em] text-white/60">
              Page <span className="text-white font-black">{page}</span> of <span className="text-white font-black">{pagination.totalPages}</span>
            </span>

            <button
              onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
              disabled={page === pagination.totalPages}
              className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[10px] uppercase tracking-[0.15em] font-black hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
