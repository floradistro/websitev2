"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Users,
  Award,
  TrendingUp,
  DollarSign,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAppAuth } from "@/context/AppAuthContext";
import { PageLoader } from "@/components/vendor/VendorSkeleton";
import { pageLayouts, cardVariants, textPresets } from "@/lib/design-system";

import { logger } from "@/lib/logger";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    withLoyalty: 0,
    avgPoints: 0,
    totalLifetimeValue: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
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
      limit: "50",
      search: searchQuery,
      tier: tierFilter,
    });

    try {
      const response = await fetch(`/api/vendor/customers?${params}`, {
        headers: {
          "x-vendor-id": vendor.id,
        },
      });
      const data = await response.json();

      if (data.error) {
        if (process.env.NODE_ENV === "development") {
          logger.error("Error:", data.error);
        }
      } else {
        setCustomers(data.customers || []);
        setStats(data.stats || stats);
        setPagination(data.pagination || pagination);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Failed to load customers:", error);
      }
    }

    setLoading(false);
  }

  const tierColors = {
    bronze: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    silver: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    gold: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    platinum: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  };

  // Show loading state for initial load
  if (loading && customers.length === 0) {
    return <PageLoader message="Loading customers..." />;
  }

  return (
    <div className={pageLayouts.page}>
      <div className={pageLayouts.content}>
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400/70" strokeWidth={1.5} />
              </div>
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-white/30 font-light">
                Total
              </p>
            </div>
            <p className="text-2xl sm:text-3xl font-light text-white/80 tracking-tight">
              {stats.total.toLocaleString()}
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400/70" strokeWidth={1.5} />
              </div>
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-white/30 font-light">
                Loyalty
              </p>
            </div>
            <p className="text-2xl sm:text-3xl font-light text-white/80 tracking-tight">
              {stats.withLoyalty.toLocaleString()}
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-400/70" strokeWidth={1.5} />
              </div>
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-white/30 font-light">
                Avg Pts
              </p>
            </div>
            <p className="text-2xl sm:text-3xl font-light text-white/80 tracking-tight">
              {stats.avgPoints.toLocaleString()}
            </p>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                <DollarSign
                  className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400/70"
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] text-white/30 font-light">
                LTV
              </p>
            </div>
            <p className="text-2xl sm:text-3xl font-light text-white/80 tracking-tight">
              $
              {stats.totalLifetimeValue.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 sm:p-5 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"
                strokeWidth={1.5}
              />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/[0.06] text-white/80 pl-10 pr-4 py-2.5 rounded-xl text-[11px] tracking-wide font-light focus:outline-none focus:border-white/[0.1] focus:bg-white/[0.04] placeholder:text-white/30 transition-all"
              />
            </div>

            {/* Tier Filter */}
            <div className="relative sm:w-48">
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/[0.06] text-white/80 px-4 py-2.5 rounded-xl text-[11px] tracking-wide font-light focus:outline-none focus:border-white/[0.1] focus:bg-white/[0.04] transition-all cursor-pointer appearance-none pr-10"
              >
                <option value="all">All Tiers</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="w-3 h-3 text-white/40"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Customers Table - Desktop */}
        <div className="hidden xl:block bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/[0.04]">
                <tr>
                  <th className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.15em] text-white/30 font-light">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.15em] text-white/30 font-light">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.15em] text-white/30 font-light">
                    Loyalty
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.15em] text-white/30 font-light">
                    Orders
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.15em] text-white/30 font-light">
                    Total Spent
                  </th>
                  <th className="px-6 py-4 text-left text-[11px] uppercase tracking-[0.15em] text-white/30 font-light">
                    Last Order
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {customers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-white/30 text-[11px] tracking-wide font-light"
                    >
                      No customers found
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 h-10 w-10 bg-white/[0.04] rounded-2xl flex items-center justify-center border border-white/[0.06]">
                            <span className="text-white/40 font-light text-sm">
                              {customer.first_name?.[0] || "?"}
                              {customer.last_name?.[0] || ""}
                            </span>
                          </div>
                          <div>
                            <div className="text-[11px] tracking-wide font-light text-white/80">
                              {customer.first_name || "Unknown"} {customer.last_name || ""}
                            </div>
                            <div className="text-[10px] text-white/30 truncate max-w-[200px]">
                              {customer.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1.5">
                          {customer.email &&
                            !customer.email.includes("@phone.local") && (
                              <div className="flex items-center text-[10px] text-white/40 gap-2">
                                <Mail className="w-3 h-3" strokeWidth={1.5} />
                                <span className="truncate max-w-[200px]">{customer.email}</span>
                              </div>
                            )}
                          {customer.phone && (
                            <div className="flex items-center text-[10px] text-white/40 gap-2">
                              <Phone className="w-3 h-3" strokeWidth={1.5} />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.15em] font-light border ${tierColors[customer.loyalty_tier as keyof typeof tierColors] || "bg-gray-500/20 text-gray-300 border-gray-500/30"}`}
                          >
                            {customer.loyalty_tier || "bronze"}
                          </span>
                          <span className="text-[11px] text-white/60 tracking-wide font-light">
                            {(customer.loyalty_points || 0).toLocaleString()} PTS
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[11px] tracking-wide text-white/60 font-light">
                        {customer.total_orders || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[11px] tracking-wide text-white/60 font-light">
                        ${(customer.total_spent || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[10px] text-white/40 tracking-wide font-light">
                        {customer.last_order_date
                          ? new Date(customer.last_order_date).toLocaleDateString()
                          : "Never"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customers Cards - Mobile/Tablet */}
        <div className="xl:hidden space-y-3 mb-6">
          {loading ? (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 text-center">
              <p className="text-white/30 text-[11px] tracking-wide font-light">
                Loading customers...
              </p>
            </div>
          ) : customers.length === 0 ? (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 text-center">
              <p className="text-white/30 text-[11px] tracking-wide font-light">
                No customers found
              </p>
            </div>
          ) : (
            customers.map((customer) => (
              <div
                key={customer.id}
                className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4"
              >
                {/* Customer Header */}
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/[0.04]">
                  <div className="flex-shrink-0 h-12 w-12 bg-white/[0.04] rounded-2xl flex items-center justify-center border border-white/[0.06]">
                    <span className="text-white/40 font-light text-base">
                      {customer.first_name?.[0] || "?"}
                      {customer.last_name?.[0] || ""}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-light text-white/80 tracking-tight">
                      {customer.first_name || "Unknown"} {customer.last_name || ""}
                    </div>
                    <div className="text-[10px] text-white/30 truncate">{customer.email}</div>
                  </div>
                </div>

                {/* Customer Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Contact */}
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.15em] text-white/30 mb-2 font-light">
                      Contact
                    </p>
                    <div className="flex flex-col gap-2">
                      {customer.email &&
                        !customer.email.includes("@phone.local") && (
                          <div className="flex items-center text-[10px] text-white/40 gap-2">
                            <Mail className="w-3 h-3 flex-shrink-0" strokeWidth={1.5} />
                            <span className="truncate">{customer.email}</span>
                          </div>
                        )}
                      {customer.phone && (
                        <div className="flex items-center text-[10px] text-white/40 gap-2">
                          <Phone className="w-3 h-3 flex-shrink-0" strokeWidth={1.5} />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Loyalty */}
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.15em] text-white/30 mb-2 font-light">
                      Loyalty
                    </p>
                    <div className="flex flex-col gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.15em] font-light border w-fit ${tierColors[customer.loyalty_tier as keyof typeof tierColors] || "bg-gray-500/20 text-gray-300 border-gray-500/30"}`}
                      >
                        {customer.loyalty_tier || "bronze"}
                      </span>
                      <span className="text-[11px] text-white/60 tracking-wide font-light">
                        {(customer.loyalty_points || 0).toLocaleString()} PTS
                      </span>
                    </div>
                  </div>

                  {/* Orders */}
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.15em] text-white/30 mb-2 font-light">
                      Orders
                    </p>
                    <p className="text-base font-light text-white/80">
                      {customer.total_orders || 0}
                    </p>
                  </div>

                  {/* Total Spent */}
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.15em] text-white/30 mb-2 font-light">
                      Total Spent
                    </p>
                    <p className="text-base font-light text-white/80">
                      ${(customer.total_spent || 0).toFixed(2)}
                    </p>
                  </div>

                  {/* Last Order */}
                  <div className="col-span-2">
                    <p className="text-[11px] uppercase tracking-[0.15em] text-white/30 mb-2 font-light">
                      Last Order
                    </p>
                    <p className="text-[10px] text-white/40 tracking-wide font-light">
                      {customer.last_order_date
                        ? new Date(customer.last_order_date).toLocaleDateString()
                        : "Never"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/[0.04]">
            <div className="text-[11px] tracking-wide text-white/30 text-center sm:text-left font-light">
              Showing <span className="text-white/60">{(page - 1) * pagination.limit + 1}</span> to{" "}
              <span className="text-white/60">
                {Math.min(page * pagination.limit, pagination.total)}
              </span>{" "}
              of <span className="text-white/60">{pagination.total}</span> customers
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="bg-white/[0.02] border border-white/[0.06] px-3 sm:px-4 py-2 rounded-xl text-[11px] tracking-wide font-light text-white/60 hover:bg-white/[0.04] hover:text-white/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <span className="text-[11px] tracking-wide text-white/30 px-3 font-light">
                <span className="text-white/60">{page}</span> /{" "}
                <span className="text-white/60">{pagination.totalPages}</span>
              </span>

              <button
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page === pagination.totalPages}
                className="bg-white/[0.02] border border-white/[0.06] px-3 sm:px-4 py-2 rounded-xl text-[11px] tracking-wide font-light text-white/60 hover:bg-white/[0.04] hover:text-white/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
