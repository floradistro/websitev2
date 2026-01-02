"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import { useAppAuth } from "@/context/AppAuthContext";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { InlineFiltersBar, FilterState } from "@/components/analytics/InlineFiltersBar";
import { ActiveFilterChips } from "@/components/analytics/ActiveFilterChips";
import { ComparisonSelector, ComparisonType } from "@/components/analytics/ComparisonSelector";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  MapPin,
  Users,
  Package,
  Download,
  Filter,
  X,
  ChevronRight,
  Calendar,
  CreditCard,
  Receipt,
  BarChart3,
  PieChart,
  FileText,
  Clock,
  Target,
} from "@/lib/icons";

// =====================================================
// Types
// =====================================================

type ReportTab =
  | "overview"
  | "sales"
  | "products"
  | "locations"
  | "employees"
  | "categories"
  | "payments"
  | "profitloss"
  | "tax"
  | "sessions";

// =====================================================
// Fetcher
// =====================================================

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// =====================================================
// Animation Variants
// =====================================================

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as any }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
} as any;

// =====================================================
// Components
// =====================================================

function MetricCard({
  label,
  value,
  sublabel,
  icon: Icon,
  trend,
  trendValue,
  onClick,
  delay = 0,
}: {
  label: string;
  value: string;
  sublabel?: string;
  icon: any;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  onClick?: () => void;
  delay?: number;
}) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
      onClick={onClick}
      className={`
        bg-black/40 backdrop-blur-sm
        border border-white/5
        rounded-2xl p-6
        hover:border-white/10 hover:bg-black/50
        transition-all duration-300
        ${onClick ? 'cursor-pointer' : ''}
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="text-white/40 text-xs font-medium uppercase tracking-[0.15em] mb-3">
            {label}
          </div>
          <div className="text-white text-3xl sm:text-4xl font-light mb-2" style={{ fontWeight: 300 }}>
            {value}
          </div>
          {sublabel && (
            <div className="text-white/30 text-sm">{sublabel}</div>
          )}
        </div>
        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/5">
          <Icon className="w-6 h-6 text-white/40" strokeWidth={1.5} />
        </div>
      </div>

      {trend && trendValue && (
        <div className="flex items-center gap-2 pt-3 border-t border-white/5">
          {trend === "up" && (
            <>
              <div className="flex items-center gap-1 text-green-400 text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                <span>{trendValue}</span>
              </div>
              <span className="text-white/30 text-sm">vs previous</span>
            </>
          )}
          {trend === "down" && (
            <>
              <div className="flex items-center gap-1 text-red-400 text-sm font-medium">
                <TrendingDown className="w-4 h-4" />
                <span>{trendValue}</span>
              </div>
              <span className="text-white/30 text-sm">vs previous</span>
            </>
          )}
          {trend === "neutral" && (
            <span className="text-white/40 text-sm">No change</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={cardVariants}
      className="bg-black/40 backdrop-blur-sm border border-white/5 rounded-2xl p-6 sm:p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-xl font-medium">{title}</h2>
        {action}
      </div>
      {children}
    </motion.div>
  );
}

function TableRow({
  columns,
  isHeader = false,
}: {
  columns: { value: string | React.ReactNode; className?: string }[];
  isHeader?: boolean;
}) {
  return (
    <div
      className={`
        grid gap-4 px-4 py-3
        ${isHeader ? 'border-b border-white/10' : 'border-b border-white/5 hover:bg-white/[0.02]'}
        transition-colors
      `}
      style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
    >
      {columns.map((col, idx) => (
        <div
          key={idx}
          className={`
            ${isHeader 
              ? 'text-white/40 text-xs font-medium uppercase tracking-[0.15em]' 
              : 'text-white/90 text-sm font-light'
            }
            ${col.className || ''}
          `}
        >
          {col.value}
        </div>
      ))}
    </div>
  );
}

function MobileCard({
  title,
  data,
  icon: Icon,
}: {
  title: string;
  data: { label: string; value: string }[];
  icon?: any;
}) {
  return (
    <div className="bg-black/20 border border-white/5 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="w-4 h-4 text-white/40" />}
        <div className="text-white font-medium text-sm">{title}</div>
      </div>
      <div className="space-y-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center">
            <span className="text-white/40 text-xs uppercase tracking-wider">{item.label}</span>
            <span className="text-white/90 text-sm font-light">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================================================
// Main Analytics Page
// =====================================================

export default function AnalyticsPage() {
  const { user } = useAppAuth();
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const [showFilters, setShowFilters] = useState(false);

  // Initialize date range
  const getInitialDateRange = () => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  };

  const [dateRange, setDateRange] = useState(getInitialDateRange());
  const [comparisonType, setComparisonType] = useState<ComparisonType>('none');
  const [filters, setFilters] = useState<FilterState>({
    dateRange: getInitialDateRange(),
    locationIds: [],
    categoryIds: [],
    employeeIds: [],
    paymentMethods: [],
    productIds: [],
    includeRefunds: true,
    includeDiscounts: true,
  });

  // Fetch filter data
  const { data: locationsData } = useSWR('/api/vendor/locations', fetcher);
  const { data: categoriesData } = useSWR(
    user?.vendor_id ? `/api/categories?vendor_id=${user.vendor_id}` : null,
    fetcher
  );

  const locations = locationsData?.locations || [];
  const categories = categoriesData?.categories || [];
  const employees: any[] = [];

  // Build query params
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.append('start_date', dateRange.start.toISOString());
    params.append('end_date', dateRange.end.toISOString());

    if (filters.locationIds.length > 0) {
      params.append('location_ids', filters.locationIds.join(','));
    }
    if (filters.categoryIds.length > 0) {
      params.append('category_ids', filters.categoryIds.join(','));
    }
    if (filters.employeeIds.length > 0) {
      params.append('employee_ids', filters.employeeIds.join(','));
    }
    if (filters.paymentMethods.length > 0) {
      params.append('payment_methods', filters.paymentMethods.join(','));
    }

    params.append('include_refunds', String(filters.includeRefunds));
    params.append('include_discounts', String(filters.includeDiscounts));

    return `?${params.toString()}`;
  };

  const queryParams = buildQueryParams();

  // Fetch data
  const { data: overview } = useSWR(`/api/vendor/analytics/v2/overview${queryParams}`, fetcher, {
    refreshInterval: 60000,
  });
  const { data: salesByDay } = useSWR(`/api/vendor/analytics/v2/sales/by-day${queryParams}`, fetcher);
  const { data: salesByLocation } = useSWR(`/api/vendor/analytics/v2/sales/by-location${queryParams}`, fetcher);
  const { data: salesByEmployee } = useSWR(`/api/vendor/analytics/v2/sales/by-employee${queryParams}`, fetcher);
  const { data: productPerformance } = useSWR(`/api/vendor/analytics/v2/products/performance${queryParams}`, fetcher);
  const { data: salesByCategory } = useSWR(`/api/vendor/analytics/v2/sales/by-category${queryParams}`, fetcher);
  const { data: salesByPayment } = useSWR(`/api/vendor/analytics/v2/sales/by-payment-method${queryParams}`, fetcher);
  const { data: profitLoss } = useSWR(`/api/vendor/analytics/v2/financial/profit-loss${queryParams}`, fetcher);
  const { data: taxReport } = useSWR(`/api/vendor/analytics/v2/financial/tax-report${queryParams}`, fetcher);
  const { data: sessions } = useSWR(`/api/vendor/analytics/v2/sessions/summary${queryParams}`, fetcher);
  const { data: profitMetrics } = useSWR(`/api/vendor/analytics/v2/profit${queryParams}`, fetcher);

  // Filter helpers
  const getActiveFilterCount = () => {
    return (
      filters.locationIds.length +
      filters.categoryIds.length +
      filters.employeeIds.length +
      filters.paymentMethods.length +
      (filters.includeRefunds ? 0 : 1) +
      (filters.includeDiscounts ? 0 : 1)
    );
  };

  const handleDateRangeChange = (range: { start: Date; end: Date }) => {
    setDateRange(range);
    setFilters({ ...filters, dateRange: range });
  };

  const tabs = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "sales", label: "Sales", icon: Calendar },
    { key: "products", label: "Products", icon: Package },
    { key: "locations", label: "Locations", icon: MapPin },
    { key: "employees", label: "Team", icon: Users },
    { key: "categories", label: "Categories", icon: PieChart },
    { key: "payments", label: "Payments", icon: CreditCard },
    { key: "profitloss", label: "P&L", icon: DollarSign },
    { key: "tax", label: "Tax", icon: Receipt },
    { key: "sessions", label: "Sessions", icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      {/* Header - Minimal & Mobile Friendly */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <DateRangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="relative p-2.5 bg-black/40 border border-white/10 rounded-xl hover:bg-black/60 hover:border-white/20 transition-all"
            >
              <Filter className="w-5 h-5 text-white/60" />
              {getActiveFilterCount() > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {getActiveFilterCount()}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filters Drawer */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-40"
              onClick={() => setShowFilters(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-[#0a0a0a] border-l border-white/10 z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-white text-xl font-medium">Filters</h2>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-white/60 text-sm font-medium mb-3 block">Comparison</label>
                    <ComparisonSelector
                      value={comparisonType}
                      onChange={setComparisonType}
                    />
                  </div>

                  <div>
                    <label className="text-white/60 text-sm font-medium mb-3 block">Advanced Filters</label>
                    <InlineFiltersBar
                      filters={filters}
                      onChange={setFilters}
                      locations={locations}
                      categories={categories}
                      employees={employees}
                      onApply={() => setShowFilters(false)}
                    />
                  </div>

                  {getActiveFilterCount() > 0 && (
                    <ActiveFilterChips
                      filters={filters}
                      locations={locations}
                      categories={categories}
                      employees={employees}
                      onRemoveLocation={(id) =>
                        setFilters({ ...filters, locationIds: filters.locationIds.filter(x => x !== id) })
                      }
                      onRemoveCategory={(id) =>
                        setFilters({ ...filters, categoryIds: filters.categoryIds.filter(x => x !== id) })
                      }
                      onRemoveEmployee={(id) =>
                        setFilters({ ...filters, employeeIds: filters.employeeIds.filter(x => x !== id) })
                      }
                      onRemovePaymentMethod={(method) =>
                        setFilters({ ...filters, paymentMethods: filters.paymentMethods.filter(x => x !== method) })
                      }
                      onClearAll={() =>
                        setFilters({
                          ...filters,
                          locationIds: [],
                          categoryIds: [],
                          employeeIds: [],
                          paymentMethods: [],
                          productIds: [],
                          includeRefunds: true,
                          includeDiscounts: true,
                        })
                      }
                    />
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Tabs - Horizontal Scroll on Mobile */}
      <div className="sticky top-0 z-20 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex gap-2 px-4 sm:px-6 py-3 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as ReportTab)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap
                  transition-all duration-300 flex-shrink-0
                  ${activeTab === tab.key
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="px-4 sm:px-6 py-6 space-y-6"
      >
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* KPI Grid - Mobile Optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Revenue"
                value={`$${(overview?.data?.gross_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={DollarSign}
                trend="up"
                trendValue="+12.5%"
                onClick={() => setActiveTab("sales")}
                delay={0}
              />
              <MetricCard
                label="Profit"
                value={`$${(profitMetrics?.metrics?.grossProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                icon={TrendingUp}
                trend="up"
                trendValue="+8.3%"
                onClick={() => setActiveTab("profitloss")}
                delay={0.1}
              />
              <MetricCard
                label="Avg Order"
                value={`$${(overview?.data?.avg_transaction || 0).toFixed(2)}`}
                icon={ShoppingCart}
                trend="neutral"
                onClick={() => setActiveTab("sales")}
                delay={0.2}
              />
              <MetricCard
                label="Transactions"
                value={(overview?.data?.transaction_count || 0).toLocaleString()}
                icon={Receipt}
                trend="up"
                trendValue="+5.2%"
                onClick={() => setActiveTab("sales")}
                delay={0.3}
              />
            </div>

            {/* Quick Insights */}
            <SectionCard title="Top Performers" action={
              <button className="text-white/60 hover:text-white text-sm flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            }>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-white/40" />
                    <span className="text-white/40 text-xs uppercase tracking-wider">Top Product</span>
                  </div>
                  <div className="text-white text-lg font-medium mb-1">
                    {overview?.data?.top_product?.name || "N/A"}
                  </div>
                  <div className="text-white/60 text-sm">
                    ${(overview?.data?.top_product?.revenue || 0).toLocaleString()}
                  </div>
                </div>

                <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-white/40" />
                    <span className="text-white/40 text-xs uppercase tracking-wider">Top Location</span>
                  </div>
                  <div className="text-white text-lg font-medium mb-1">
                    {salesByLocation?.data?.[0]?.location_name || "N/A"}
                  </div>
                  <div className="text-white/60 text-sm">
                    ${(salesByLocation?.data?.[0]?.gross_sales || 0).toLocaleString()}
                  </div>
                </div>

                <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <PieChart className="w-4 h-4 text-white/40" />
                    <span className="text-white/40 text-xs uppercase tracking-wider">Top Category</span>
                  </div>
                  <div className="text-white text-lg font-medium mb-1">
                    {salesByCategory?.data?.[0]?.category_name || "N/A"}
                  </div>
                  <div className="text-white/60 text-sm">
                    ${(salesByCategory?.data?.[0]?.gross_sales || 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </SectionCard>
          </motion.div>
        )}

        {/* Sales Tab */}
        {activeTab === "sales" && (
          <SectionCard title="Sales by Day" action={
            <button className="text-white/60 hover:text-white text-sm flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          }>
            {/* Mobile: Cards, Desktop: Table */}
            <div className="block sm:hidden space-y-3">
              {(salesByDay?.data || []).slice(0, 10).map((day: any, idx: number) => (
                <MobileCard
                  key={idx}
                  title={new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  icon={Calendar}
                  data={[
                    { label: "Revenue", value: `$${(day.gross_sales || 0).toLocaleString()}` },
                    { label: "Profit", value: `$${(day.gross_profit || 0).toLocaleString()}` },
                    { label: "Trans", value: String(day.transaction_count || 0) },
                    { label: "Avg", value: `$${(day.avg_transaction || 0).toFixed(2)}` },
                  ]}
                />
              ))}
            </div>

            <div className="hidden sm:block overflow-x-auto -mx-8">
              <div className="min-w-full inline-block align-middle px-8">
                <TableRow
                  isHeader
                  columns={[
                    { value: "Date" },
                    { value: "Revenue", className: "text-right" },
                    { value: "Profit", className: "text-right" },
                    { value: "Trans", className: "text-right" },
                    { value: "Avg Order", className: "text-right" },
                  ]}
                />
                {(salesByDay?.data || []).map((day: any, idx: number) => (
                  <TableRow
                    key={idx}
                    columns={[
                      { value: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) },
                      { value: `$${(day.gross_sales || 0).toLocaleString()}`, className: "text-right font-medium" },
                      { value: `$${(day.gross_profit || 0).toLocaleString()}`, className: "text-right text-green-400" },
                      { value: String(day.transaction_count || 0), className: "text-right text-white/60" },
                      { value: `$${(day.avg_transaction || 0).toFixed(2)}`, className: "text-right text-white/60" },
                    ]}
                  />
                ))}
              </div>
            </div>
          </SectionCard>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <SectionCard title="Product Performance" action={
            <button className="text-white/60 hover:text-white text-sm flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          }>
            <div className="block sm:hidden space-y-3">
              {(productPerformance?.data || []).slice(0, 10).map((product: any, idx: number) => (
                <MobileCard
                  key={idx}
                  title={product.product_name}
                  icon={Package}
                  data={[
                    { label: "Revenue", value: `$${(product.gross_sales || 0).toLocaleString()}` },
                    { label: "Profit", value: `$${(product.gross_profit || 0).toLocaleString()}` },
                    { label: "Units", value: String(product.units_sold || 0) },
                    { label: "Margin", value: `${(product.margin || 0).toFixed(1)}%` },
                  ]}
                />
              ))}
            </div>

            <div className="hidden sm:block overflow-x-auto -mx-8">
              <div className="min-w-full inline-block align-middle px-8">
                <TableRow
                  isHeader
                  columns={[
                    { value: "Product" },
                    { value: "Units", className: "text-right" },
                    { value: "Revenue", className: "text-right" },
                    { value: "Profit", className: "text-right" },
                    { value: "Margin", className: "text-right" },
                  ]}
                />
                {(productPerformance?.data || []).map((product: any, idx: number) => (
                  <TableRow
                    key={idx}
                    columns={[
                      { value: product.product_name },
                      { value: String(product.units_sold || 0), className: "text-right text-white/60" },
                      { value: `$${(product.gross_sales || 0).toLocaleString()}`, className: "text-right font-medium" },
                      { value: `$${(product.gross_profit || 0).toLocaleString()}`, className: "text-right text-green-400" },
                      { value: `${(product.margin || 0).toFixed(1)}%`, className: "text-right text-white/60" },
                    ]}
                  />
                ))}
              </div>
            </div>
          </SectionCard>
        )}

        {/* Locations Tab */}
        {activeTab === "locations" && (
          <SectionCard title="Sales by Location" action={
            <button className="text-white/60 hover:text-white text-sm flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          }>
            <div className="block sm:hidden space-y-3">
              {(salesByLocation?.data || []).map((location: any, idx: number) => (
                <MobileCard
                  key={idx}
                  title={location.location_name}
                  icon={MapPin}
                  data={[
                    { label: "Revenue", value: `$${(location.gross_sales || 0).toLocaleString()}` },
                    { label: "Profit", value: `$${(location.gross_profit || 0).toLocaleString()}` },
                    { label: "Trans", value: String(location.transaction_count || 0) },
                    { label: "% Total", value: `${(location.percent_of_total || 0).toFixed(1)}%` },
                  ]}
                />
              ))}
            </div>

            <div className="hidden sm:block overflow-x-auto -mx-8">
              <div className="min-w-full inline-block align-middle px-8">
                <TableRow
                  isHeader
                  columns={[
                    { value: "Location" },
                    { value: "Revenue", className: "text-right" },
                    { value: "Profit", className: "text-right" },
                    { value: "Trans", className: "text-right" },
                    { value: "% Total", className: "text-right" },
                  ]}
                />
                {(salesByLocation?.data || []).map((location: any, idx: number) => (
                  <TableRow
                    key={idx}
                    columns={[
                      { value: location.location_name },
                      { value: `$${(location.gross_sales || 0).toLocaleString()}`, className: "text-right font-medium" },
                      { value: `$${(location.gross_profit || 0).toLocaleString()}`, className: "text-right text-green-400" },
                      { value: String(location.transaction_count || 0), className: "text-right text-white/60" },
                      { value: `${(location.percent_of_total || 0).toFixed(1)}%`, className: "text-right text-white/60" },
                    ]}
                  />
                ))}
              </div>
            </div>
          </SectionCard>
        )}

        {/* Employees Tab */}
        {activeTab === "employees" && (
          <SectionCard title="Team Performance" action={
            <button className="text-white/60 hover:text-white text-sm flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          }>
            <div className="block sm:hidden space-y-3">
              {(salesByEmployee?.data || []).map((employee: any, idx: number) => (
                <MobileCard
                  key={idx}
                  title={employee.employee_name}
                  icon={Users}
                  data={[
                    { label: "Revenue", value: `$${(employee.gross_sales || 0).toLocaleString()}` },
                    { label: "Trans", value: String(employee.transaction_count || 0) },
                    { label: "Avg", value: `$${(employee.avg_transaction || 0).toFixed(2)}` },
                    { label: "% Total", value: `${(employee.percent_of_total || 0).toFixed(1)}%` },
                  ]}
                />
              ))}
            </div>

            <div className="hidden sm:block overflow-x-auto -mx-8">
              <div className="min-w-full inline-block align-middle px-8">
                <TableRow
                  isHeader
                  columns={[
                    { value: "Employee" },
                    { value: "Revenue", className: "text-right" },
                    { value: "Trans", className: "text-right" },
                    { value: "Avg Order", className: "text-right" },
                    { value: "% Total", className: "text-right" },
                  ]}
                />
                {(salesByEmployee?.data || []).map((employee: any, idx: number) => (
                  <TableRow
                    key={idx}
                    columns={[
                      { value: employee.employee_name },
                      { value: `$${(employee.gross_sales || 0).toLocaleString()}`, className: "text-right font-medium" },
                      { value: String(employee.transaction_count || 0), className: "text-right text-white/60" },
                      { value: `$${(employee.avg_transaction || 0).toFixed(2)}`, className: "text-right text-white/60" },
                      { value: `${(employee.percent_of_total || 0).toFixed(1)}%`, className: "text-right text-white/60" },
                    ]}
                  />
                ))}
              </div>
            </div>
          </SectionCard>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <SectionCard title="Sales by Category" action={
            <button className="text-white/60 hover:text-white text-sm flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          }>
            <div className="block sm:hidden space-y-3">
              {(salesByCategory?.data || []).map((category: any, idx: number) => (
                <MobileCard
                  key={idx}
                  title={category.category_name}
                  icon={PieChart}
                  data={[
                    { label: "Revenue", value: `$${(category.gross_sales || 0).toLocaleString()}` },
                    { label: "Profit", value: `$${(category.profit || 0).toLocaleString()}` },
                    { label: "Units", value: String(category.items_sold || 0) },
                    { label: "Margin", value: `${(category.margin || 0).toFixed(1)}%` },
                  ]}
                />
              ))}
            </div>

            <div className="hidden sm:block overflow-x-auto -mx-8">
              <div className="min-w-full inline-block align-middle px-8">
                <TableRow
                  isHeader
                  columns={[
                    { value: "Category" },
                    { value: "Revenue", className: "text-right" },
                    { value: "Profit", className: "text-right" },
                    { value: "Units", className: "text-right" },
                    { value: "Margin", className: "text-right" },
                  ]}
                />
                {(salesByCategory?.data || []).map((category: any, idx: number) => (
                  <TableRow
                    key={idx}
                    columns={[
                      { value: category.category_name },
                      { value: `$${(category.gross_sales || 0).toLocaleString()}`, className: "text-right font-medium" },
                      { value: `$${(category.profit || 0).toLocaleString()}`, className: "text-right text-green-400" },
                      { value: String(category.items_sold || 0), className: "text-right text-white/60" },
                      { value: `${(category.margin || 0).toFixed(1)}%`, className: "text-right text-white/60" },
                    ]}
                  />
                ))}
              </div>
            </div>
          </SectionCard>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <SectionCard title="Payment Methods" action={
            <button className="text-white/60 hover:text-white text-sm flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          }>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(salesByPayment?.data || []).map((payment: any, idx: number) => (
                <div key={idx} className="bg-black/20 border border-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-4 h-4 text-white/40" />
                    <div className="text-white font-medium">{payment.method}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white/40 text-xs">Amount</span>
                      <span className="text-white text-lg font-light">
                        ${(payment.amount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/40 text-xs">Transactions</span>
                      <span className="text-white/60 text-sm">{payment.transactions || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/40 text-xs">% of Total</span>
                      <span className="text-white/60 text-sm">{(payment.percent || 0).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* P&L Tab */}
        {activeTab === "profitloss" && (
          <div className="space-y-4">
            <SectionCard title="Revenue">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-white/60">Gross Sales</span>
                  <span className="text-white text-lg font-light">
                    ${(profitLoss?.data?.revenue?.gross_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-white/5">
                  <span className="text-white/60">Refunds</span>
                  <span className="text-red-400">
                    ${(Math.abs(profitLoss?.data?.revenue?.refunds) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-white/5">
                  <span className="text-white font-medium">Net Sales</span>
                  <span className="text-white text-xl font-light">
                    ${(profitLoss?.data?.revenue?.net_sales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Cost & Profit">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-white/60">Cost of Goods Sold</span>
                  <span className="text-white/60">
                    ${(profitLoss?.data?.cost_of_goods || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-white/5">
                  <span className="text-white font-medium">Gross Profit</span>
                  <span className="text-green-400 text-xl font-light">
                    ${(profitLoss?.data?.gross_profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-white/60">Gross Margin</span>
                  <span className="text-white/60">{(profitLoss?.data?.gross_margin || 0).toFixed(1)}%</span>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* Tax Tab */}
        {activeTab === "tax" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Taxable Sales"
                value={`$${(taxReport?.data?.summary?.total_taxable_sales || 0).toLocaleString()}`}
                icon={DollarSign}
              />
              <MetricCard
                label="Tax Collected"
                value={`$${(taxReport?.data?.summary?.total_tax_collected || 0).toLocaleString()}`}
                icon={Receipt}
              />
              <MetricCard
                label="Tax Exempt"
                value={`$${(taxReport?.data?.summary?.total_tax_exempt || 0).toLocaleString()}`}
                icon={FileText}
              />
              <MetricCard
                label="Effective Rate"
                value={`${(taxReport?.data?.summary?.effective_rate || 0).toFixed(2)}%`}
                icon={Target}
              />
            </div>

            <SectionCard title="Tax by Location">
              <div className="block sm:hidden space-y-3">
                {(taxReport?.data?.by_location || []).map((location: any, idx: number) => (
                  <MobileCard
                    key={idx}
                    title={location.location_name}
                    icon={MapPin}
                    data={[
                      { label: "Taxable", value: `$${(location.taxable_sales || 0).toLocaleString()}` },
                      { label: "Collected", value: `$${(location.tax_collected || 0).toLocaleString()}` },
                      { label: "Exempt", value: `$${(location.tax_exempt || 0).toLocaleString()}` },
                      { label: "Rate", value: `${(location.rate || 0).toFixed(2)}%` },
                    ]}
                  />
                ))}
              </div>

              <div className="hidden sm:block overflow-x-auto -mx-8">
                <div className="min-w-full inline-block align-middle px-8">
                  <TableRow
                    isHeader
                    columns={[
                      { value: "Location" },
                      { value: "Taxable Sales", className: "text-right" },
                      { value: "Collected", className: "text-right" },
                      { value: "Exempt", className: "text-right" },
                      { value: "Rate", className: "text-right" },
                    ]}
                  />
                  {(taxReport?.data?.by_location || []).map((location: any, idx: number) => (
                    <TableRow
                      key={idx}
                      columns={[
                        { value: location.location_name },
                        { value: `$${(location.taxable_sales || 0).toLocaleString()}`, className: "text-right text-white/60" },
                        { value: `$${(location.tax_collected || 0).toLocaleString()}`, className: "text-right text-green-400" },
                        { value: `$${(location.tax_exempt || 0).toLocaleString()}`, className: "text-right text-white/60" },
                        { value: `${(location.rate || 0).toFixed(2)}%`, className: "text-right text-white/60" },
                      ]}
                    />
                  ))}
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === "sessions" && (
          <div className="space-y-4">
            {sessions?.summary && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <MetricCard
                  label="Sessions"
                  value={String(sessions.summary.total_sessions || 0)}
                  icon={Clock}
                />
                <MetricCard
                  label="Total Sales"
                  value={`$${(sessions.summary.total_sales || 0).toLocaleString()}`}
                  icon={DollarSign}
                />
                <MetricCard
                  label="Trans"
                  value={String(sessions.summary.total_transactions || 0)}
                  icon={Receipt}
                />
                <MetricCard
                  label="Variance"
                  value={`$${(sessions.summary.total_variance || 0).toFixed(2)}`}
                  icon={Target}
                />
                <MetricCard
                  label="w/ Variance"
                  value={String(sessions.summary.sessions_with_variance || 0)}
                  icon={TrendingDown}
                />
              </div>
            )}

            <SectionCard title="Recent Sessions">
              <div className="block sm:hidden space-y-3">
                {(sessions?.data || []).map((session: any, idx: number) => (
                  <div key={idx} className="bg-black/20 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-white/40" />
                        <span className="text-white font-medium">#{session.session_number}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        session.status === 'closed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-white/40 text-xs">Location</span>
                        <span className="text-white/90 text-sm">{session.location_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40 text-xs">Sales</span>
                        <span className="text-white/90 text-sm">${session.total_sales?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/40 text-xs">Trans</span>
                        <span className="text-white/90 text-sm">{session.total_transactions}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden sm:block overflow-x-auto -mx-8">
                <div className="min-w-full inline-block align-middle px-8">
                  <TableRow
                    isHeader
                    columns={[
                      { value: "Session" },
                      { value: "Location" },
                      { value: "Sales", className: "text-right" },
                      { value: "Trans", className: "text-right" },
                      { value: "Status", className: "text-center" },
                    ]}
                  />
                  {(sessions?.data || []).map((session: any, idx: number) => (
                    <TableRow
                      key={idx}
                      columns={[
                        { value: `#${session.session_number}` },
                        { value: session.location_name, className: "text-white/60" },
                        { value: `$${session.total_sales?.toLocaleString()}`, className: "text-right font-medium" },
                        { value: String(session.total_transactions), className: "text-right text-white/60" },
                        { 
                          value: (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              session.status === 'closed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {session.status}
                            </span>
                          ),
                          className: "text-center"
                        },
                      ]}
                    />
                  ))}
                </div>
              </div>
            </SectionCard>
          </div>
        )}
      </motion.div>
    </div>
  );
}
