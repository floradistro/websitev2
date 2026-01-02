"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Package,
  DollarSign,
  MapPin,
  Truck,
  Store,
  ShoppingBag,
  Calendar,
  User,
  X,
  ChevronDown,
} from "lucide-react";
import { useAppAuth, UserRole } from "@/context/AppAuthContext";
import { PageLoader } from "@/components/vendor/VendorSkeleton";
import { pageLayouts } from "@/lib/design-system";
import { logger } from "@/lib/logger";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  quantityDisplay: string | null;
  unitPrice: number;
  lineTotal: number;
  tierName: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  status: "completed" | "processing" | "pending" | "cancelled";
  fulfillmentStatus: string;
  paymentStatus: string;
  orderType: string;
  deliveryType: string;
  locationId: string | null;
  locationName: string;
  items: OrderItem[];
  itemCount: number;
  vendorSubtotal: number;
  vendorCommission: number;
  vendorNetEarnings: number;
  trackingNumber?: string;
  trackingUrl?: string;
  shippingCarrier?: string;
  shippingAddress?: any;
  completedDate?: string;
}

interface OrderStats {
  total_orders: number;
  total_revenue: number;
  total_commission: number;
  net_earnings: number;
  by_location: Record<
    string,
    {
      order_count: number;
      revenue: number;
      commission: number;
      net_earnings: number;
    }
  >;
  by_type: {
    pickup: number;
    delivery: number;
    instore: number;
  };
}

type OrderTypeFilter = "all" | "pickup" | "delivery" | "instore";
type StatusFilter = "all" | "completed" | "processing" | "pending" | "cancelled";

// Helper to check if user is admin
const isAdminRole = (role: UserRole | null): boolean => {
  return role === "vendor_owner" || role === "vendor_manager" || role === "admin";
};

export default function VendorOrders() {
  const { isAuthenticated, isLoading: authLoading, vendor, role, locations, primaryLocation } =
    useAppAuth();

  // Data state
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [orderTypeFilter, setOrderTypeFilter] = useState<OrderTypeFilter>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all"); // Location ID or "all"
  const [dateRange, setDateRange] = useState<string>("last_30_days");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Determine user's location access
  const isAdmin = useMemo(() => isAdminRole(role), [role]);
  const userLocationName = useMemo(() => {
    if (isAdmin) return null;
    return primaryLocation?.name || (locations[0]?.name ?? null);
  }, [isAdmin, primaryLocation, locations]);

  // Show location filter for admins with multiple locations
  const showLocationFilter = useMemo(() => {
    return isAdmin && locations.length > 1;
  }, [isAdmin, locations]);

  // Calculate date range for display
  const dateRangeDisplay = useMemo(() => {
    if (dateRange === "custom" && customStartDate && customEndDate) {
      const start = new Date(customStartDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const end = new Date(customEndDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      return `${start} - ${end}`;
    }
    switch (dateRange) {
      case "today":
        return "Today";
      case "yesterday":
        return "Yesterday";
      case "last_7_days":
        return "Last 7 Days";
      case "last_30_days":
        return "Last 30 Days";
      case "this_month":
        return "This Month";
      case "last_month":
        return "Last Month";
      default:
        return "Last 30 Days";
    }
  }, [dateRange, customStartDate, customEndDate]);

  // UI state - using force update pattern to prevent re-render loops
  const [, forceUpdate] = useState({});
  const selectedOrderRef = useRef<Order | null>(null);
  const modalOpenRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  // Detect if component is mounted (for portal)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close date picker on click outside
  useEffect(() => {
    if (!showDatePicker) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".date-picker-container")) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDatePicker]);

  const openModal = useCallback((order: Order) => {
    selectedOrderRef.current = order;
    modalOpenRef.current = true;
    forceUpdate({});
  }, []);

  const closeModal = useCallback(() => {
    modalOpenRef.current = false;
    forceUpdate({});
    setTimeout(() => {
      selectedOrderRef.current = null;
      forceUpdate({});
    }, 300);
  }, []);

  // Load orders
  useEffect(() => {
    async function loadOrders() {
      if (authLoading || !isAuthenticated || !vendor?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const params = new URLSearchParams({
          ...(orderTypeFilter !== "all" && { order_type: orderTypeFilter }),
          ...(statusFilter !== "all" && { status: statusFilter }),
          ...(locationFilter !== "all" && { location: locationFilter }),
          date_range: dateRange,
          ...(dateRange === "custom" && customStartDate && { start_date: customStartDate }),
          ...(dateRange === "custom" && customEndDate && { end_date: customEndDate }),
        });

        const response = await fetch(`/api/vendor/orders?${params}`, {
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to load orders");
        }

        const data = await response.json();

        if (data.success) {
          setOrders(data.orders || []);
          setStats(data.stats || null);
        } else {
          throw new Error(data.error || "Failed to load orders");
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          logger.error("Error loading orders:", error);
        }
        setOrders([]);
        setStats(null);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, [
    authLoading,
    isAuthenticated,
    vendor?.id,
    statusFilter,
    orderTypeFilter,
    locationFilter,
    dateRange,
    customStartDate,
    customEndDate,
  ]);

  // Filter orders by search
  const filteredOrders = orders.filter((order) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      order.customerName.toLowerCase().includes(searchLower) ||
      order.orderNumber.toLowerCase().includes(searchLower) ||
      order.customerEmail.toLowerCase().includes(searchLower)
    );
  });

  // Get status badge variant
  const getStatusVariant = (status: string): "success" | "warning" | "error" | "neutral" => {
    switch (status) {
      case "completed":
        return "success";
      case "cancelled":
        return "error";
      case "processing":
        return "warning";
      default:
        return "neutral";
    }
  };

  // Get order type icon
  const getOrderTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pickup":
        return <Store size={9} strokeWidth={2.5} className="text-white/40" />;
      case "shipping":
      case "delivery":
        return <Truck size={9} strokeWidth={2.5} className="text-white/40" />;
      default:
        return <ShoppingBag size={9} strokeWidth={2.5} className="text-white/40" />;
    }
  };


  return (
    <div className="h-full w-full flex flex-col bg-[#0a0a0a] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-start justify-between">
          <div>
            <h3
              className="text-xs uppercase tracking-[0.15em] text-white font-black"
              style={{ fontWeight: 900 }}
            >
              Orders
            </h3>
            <div className="flex items-center gap-1.5 text-white/40 text-[10px] mt-1 uppercase tracking-wider">
              {!isAdmin && userLocationName && (
                <>
                  <MapPin size={10} strokeWidth={2} />
                  <span>{userLocationName}</span>
                  <span className="text-white/20">·</span>
                </>
              )}
              <Calendar size={10} strokeWidth={2} />
              <span>{dateRangeDisplay}</span>
            </div>
          </div>

          {/* Stats Summary & Filters */}
          <div className="flex items-center gap-3">
            {/* Date Range Picker */}
            <div className="relative date-picker-container">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-1.5 bg-black/40 border border-white/10 text-white text-[9px] uppercase tracking-[0.12em] font-black px-2.5 py-1.5 rounded-lg hover:bg-black/60 hover:border-white/20 transition-all"
                style={{ fontWeight: 900 }}
              >
                <Calendar size={10} strokeWidth={2.5} />
                <span>{dateRangeDisplay}</span>
                <ChevronDown size={10} strokeWidth={2.5} className="text-white/40" />
              </button>

              {/* Date Picker Dropdown */}
              {showDatePicker && (
                <div className="absolute right-0 top-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl p-2 shadow-xl z-50 min-w-[200px] shadow-2xl"
                  style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
                >
                  {/* Quick Filters */}
                  <div className="space-y-0.5 mb-2 pb-2 border-b border-white/5">
                    {[
                      { value: "today", label: "Today" },
                      { value: "yesterday", label: "Yesterday" },
                      { value: "last_7_days", label: "Last 7 Days" },
                      { value: "last_30_days", label: "Last 30 Days" },
                      { value: "this_month", label: "This Month" },
                      { value: "last_month", label: "Last Month" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setDateRange(option.value);
                          setShowDatePicker(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 text-[9px] uppercase tracking-[0.12em] font-black rounded-lg transition-all ${
                          dateRange === option.value
                            ? "bg-white/10 text-white"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        }`}
                        style={{ fontWeight: 900 }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Date Range */}
                  <div className="space-y-2">
                    <div
                      className="text-[9px] uppercase tracking-[0.12em] font-black text-white/40 px-2.5"
                      style={{ fontWeight: 900 }}
                    >
                      Custom Range
                    </div>
                    <div className="space-y-1.5 px-2.5">
                      <div>
                        <label className="text-[8px] uppercase tracking-wider text-white/40 block mb-1">
                          From
                        </label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => {
                            setCustomStartDate(e.target.value);
                            setDateRange("custom");
                          }}
                          className="w-full bg-black/60 border border-white/10 text-white text-[9px] px-2 py-1 rounded-lg focus:outline-none focus:border-white/20 transition-all"
                          style={{ colorScheme: "dark" }}
                        />
                      </div>
                      <div>
                        <label className="text-[8px] uppercase tracking-wider text-white/40 block mb-1">
                          To
                        </label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => {
                            setCustomEndDate(e.target.value);
                            setDateRange("custom");
                          }}
                          className="w-full bg-black/60 border border-white/10 text-white text-[9px] px-2 py-1 rounded-lg focus:outline-none focus:border-white/20 transition-all"
                          style={{ colorScheme: "dark" }}
                        />
                      </div>
                      {dateRange === "custom" && customStartDate && customEndDate && (
                        <button
                          onClick={() => setShowDatePicker(false)}
                          className="w-full bg-white/10 hover:bg-white/20 text-white text-[9px] uppercase tracking-[0.12em] font-black px-2 py-1.5 rounded-lg transition-all mt-2"
                          style={{ fontWeight: 900 }}
                        >
                          Apply
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Location Filter Dropdown (Admins Only) */}
            {showLocationFilter && (
              <>
                <div className="h-6 w-px bg-white/10" />
                <div className="relative">
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="appearance-none bg-black/40 border border-white/10 text-white text-[9px] uppercase tracking-[0.12em] font-black px-2.5 pr-6 py-1.5 rounded-lg focus:outline-none focus:border-white/20 transition-all cursor-pointer hover:bg-black/60"
                    style={{
                      fontWeight: 900,
                      colorScheme: "dark",
                    }}
                  >
                    <option value="all" className="bg-[#0a0a0a] text-white">
                      All Locations
                    </option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id} className="bg-[#0a0a0a] text-white">
                        {loc.name}
                      </option>
                    ))}
                  </select>
                  <MapPin
                    size={10}
                    strokeWidth={2.5}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                  />
                </div>
              </>
            )}

            <div className="h-6 w-px bg-white/10" />

            <div className="text-right">
              <div className="text-white/40 text-[9px] uppercase tracking-[0.15em]">Orders</div>
              <div
                className="text-white text-sm font-black"
                style={{ fontWeight: 900 }}
              >
                {loading ? "—" : stats?.total_orders || 0}
              </div>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="text-right">
              <div className="text-white/40 text-[9px] uppercase tracking-[0.15em]">Revenue</div>
              <div
                className="text-white text-sm font-black"
                style={{ fontWeight: 900 }}
              >
                {loading ? "—" : `$${(stats?.total_revenue || 0).toFixed(2)}`}
              </div>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="text-right">
              <div className="text-white/40 text-[9px] uppercase tracking-[0.15em]">Net</div>
              <div
                className="text-white text-sm font-black"
                style={{ fontWeight: 900 }}
              >
                {loading ? "—" : `$${(stats?.net_earnings || 0).toFixed(2)}`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="px-4 py-2.5 border-b border-white/5 space-y-2">
        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" strokeWidth={2} />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-white/5 text-white placeholder-white/20 pl-8 pr-3 py-1.5 focus:outline-none focus:border-white/10 focus:bg-black/60 transition-all rounded-lg text-[10px] font-medium"
          />
        </div>

        {/* Filters Row */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-0.5">
          {/* Status */}
          <FilterPill active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
            All
          </FilterPill>
          <FilterPill
            active={statusFilter === "completed"}
            onClick={() => setStatusFilter("completed")}
          >
            Done
          </FilterPill>
          <FilterPill
            active={statusFilter === "processing"}
            onClick={() => setStatusFilter("processing")}
          >
            Active
          </FilterPill>
          <FilterPill
            active={statusFilter === "pending"}
            onClick={() => setStatusFilter("pending")}
          >
            Pending
          </FilterPill>

          <div className="h-3 w-px bg-white/10" />

          {/* Type */}
          <FilterPill
            active={orderTypeFilter === "pickup"}
            onClick={() => setOrderTypeFilter("pickup")}
            icon={<Store size={9} strokeWidth={2.5} />}
          >
            Pickup
          </FilterPill>
          <FilterPill
            active={orderTypeFilter === "delivery"}
            onClick={() => setOrderTypeFilter("delivery")}
            icon={<Truck size={9} strokeWidth={2.5} />}
          >
            Ship
          </FilterPill>
          <FilterPill
            active={orderTypeFilter === "instore"}
            onClick={() => setOrderTypeFilter("instore")}
            icon={<ShoppingBag size={9} strokeWidth={2.5} />}
          >
            Store
          </FilterPill>
        </div>
      </div>

      {/* Orders List - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0 bg-[#0a0a0a]">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-white/40 text-[10px] uppercase tracking-[0.15em]">
              Loading orders...
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Package size={32} className="text-white/20 mx-auto mb-3" strokeWidth={1} />
              <div className="text-white/60 text-[10px] uppercase tracking-[0.15em] mb-1">
                No orders found
              </div>
              <div className="text-white/40 text-[9px]">
                {search ? "Try adjusting your search" : "Orders will appear here"}
              </div>
            </div>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => openModal(order)}
              className="bg-black/40 border border-white/5 hover:border-white/10 rounded-xl p-2.5 transition-all cursor-pointer group"
            >
              {/* Single Line: Customer + Status */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className="text-white font-black text-[10px] uppercase tracking-tight truncate"
                    style={{ fontWeight: 900 }}
                  >
                    {order.customerName}
                  </div>
                  <div className="text-white/30 text-[9px] font-mono">
                    {order.orderNumber.split("-").pop()}
                  </div>
                </div>
                <div className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[8px] uppercase tracking-wider text-white/60 font-black">
                  {order.status}
                </div>
              </div>

              {/* Meta Row */}
              <div className="flex items-center justify-between text-[9px] text-white/40 mb-2">
                <div className="flex items-center gap-2">
                  <span>{new Date(order.date).toLocaleDateString()}</span>
                  <span>·</span>
                  <div className="flex items-center gap-1">
                    {getOrderTypeIcon(order.orderType)}
                    <span>{order.orderType}</span>
                  </div>
                  {isAdmin && (
                    <>
                      <span>·</span>
                      <span>{order.locationName}</span>
                    </>
                  )}
                </div>
                <span>{order.itemCount} item{order.itemCount !== 1 ? "s" : ""}</span>
              </div>

              {/* Totals - Single Line */}
              <div className="flex items-center justify-between text-[9px] pt-2 border-t border-white/5">
                <div className="flex items-center gap-2 text-white/30">
                  <span>${order.vendorSubtotal.toFixed(2)}</span>
                  <span>-${order.vendorCommission.toFixed(2)}</span>
                </div>
                <div
                  className="text-white font-black text-xs"
                  style={{ fontWeight: 900 }}
                >
                  ${order.vendorNetEarnings.toFixed(2)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order Detail Modal */}
      {isMounted &&
        selectedOrderRef.current &&
        modalOpenRef.current &&
        createPortal(
          <OrderDetailModal
            order={selectedOrderRef.current}
            onClose={closeModal}
            getOrderTypeIcon={getOrderTypeIcon}
          />,
          document.body,
        )}
    </div>
  );
}

// Filter Pill Component - Pure Monochrome
function FilterPill({
  active,
  onClick,
  children,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: "success" | "warning" | "neutral"; // Keep for backwards compatibility but don't use
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-[9px] uppercase tracking-[0.12em] font-black transition-all whitespace-nowrap rounded-md flex items-center gap-1 border ${
        active
          ? "border-white/20 bg-white/5 text-white"
          : "bg-black/40 text-white/40 border-white/5 hover:border-white/10 hover:text-white/60"
      }`}
      style={{ fontWeight: 900 }}
    >
      {icon}
      {children}
    </button>
  );
}

// Order Detail Modal Component
function OrderDetailModal({
  order,
  onClose,
  getOrderTypeIcon,
}: {
  order: Order;
  onClose: () => void;
  getOrderTypeIcon: (type: string) => React.ReactNode;
}) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking directly on the backdrop, not on child elements
    if (e.target === e.currentTarget) {
      e.preventDefault();

      onClose();
    }
  };

  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent clicks inside modal from bubbling to backdrop
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-[#0a0a0a] backdrop-blur-xl border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={handleContentClick}
        style={{
          transition: "opacity 0.3s ease-out, transform 0.3s ease-out",
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-start p-4 border-b border-white/5">
          <div>
            <h2
              className="text-sm font-black uppercase text-white tracking-tight mb-2"
              style={{ fontWeight: 900 }}
            >
              {order.orderNumber}
            </h2>
            <div className="flex items-center gap-2.5 text-[9px]">
              <div className="flex items-center gap-1 text-white/50">
                <User size={9} strokeWidth={2.5} />
                {order.customerName}
              </div>
              <span className="text-white/20">·</span>
              <div className="flex items-center gap-1 text-white/50">
                {getOrderTypeIcon(order.orderType)}
                {order.orderType}
              </div>
              <span className="text-white/20">·</span>
              <div className="flex items-center gap-1 text-white/50">
                <MapPin size={9} strokeWidth={2.5} />
                {order.locationName}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Customer Info */}
          <div className="bg-[#141414] border border-white/5 rounded-2xl p-3">
            <h3 className="text-[9px] uppercase tracking-[0.15em] text-white/40 mb-2 font-black">
              Customer
            </h3>
            <div className="grid grid-cols-2 gap-3 text-[10px]">
              <div>
                <div className="text-white/40 uppercase tracking-[0.15em] mb-1">Email</div>
                <div className="text-white">{order.customerEmail}</div>
              </div>
              {order.customerPhone && (
                <div>
                  <div className="text-white/40 uppercase tracking-[0.15em] mb-1">Phone</div>
                  <div className="text-white">{order.customerPhone}</div>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Info (for delivery orders) */}
          {order.deliveryType === "delivery" && order.shippingAddress && (
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-3">
              <h3 className="text-[9px] uppercase tracking-[0.15em] text-white/40 mb-2 font-black">
                Shipping
              </h3>
              <div className="space-y-2 text-[10px]">
                {order.trackingNumber && (
                  <div>
                    <span className="text-white/40 uppercase tracking-[0.15em]">Tracking: </span>
                    <span className="text-white font-mono">{order.trackingNumber}</span>
                    {order.trackingUrl && (
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-400 hover:text-blue-300 text-[9px]"
                      >
                        Track →
                      </a>
                    )}
                  </div>
                )}
                {order.shippingCarrier && (
                  <div>
                    <span className="text-white/40 uppercase tracking-[0.15em]">Carrier: </span>
                    <span className="text-white">{order.shippingCarrier}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="bg-[#141414] border border-white/5 rounded-2xl p-3">
            <h3 className="text-[9px] uppercase tracking-[0.15em] text-white/40 mb-2 font-black">
              Items ({order.itemCount})
            </h3>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-2 bg-black/40 border border-white/5 rounded-xl"
                >
                  {item.productImage && (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-white text-[10px] font-black uppercase tracking-tight truncate"
                      style={{ fontWeight: 900 }}
                    >
                      {item.productName}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-white/60 mt-1">
                      <span>Qty: {item.quantityDisplay || item.quantity}</span>
                      <span>@${item.unitPrice.toFixed(2)}</span>
                      {item.tierName && (
                        <span className="text-white/40">· {item.tierName}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-white font-black text-xs" style={{ fontWeight: 900 }}>
                    ${item.lineTotal.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-[#141414] border border-white/5 rounded-2xl p-3">
            <h3 className="text-[9px] uppercase tracking-[0.15em] text-white/40 mb-2 font-black">
              Totals
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px]">
                <span className="text-white/60 uppercase tracking-[0.15em]">Subtotal</span>
                <span className="text-white">${order.vendorSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-white/60 uppercase tracking-[0.15em]">Platform Fee</span>
                <span className="text-white/60">-${order.vendorCommission.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10">
                <span
                  className="text-white/60 text-[9px] uppercase tracking-[0.15em] font-black"
                  style={{ fontWeight: 900 }}
                >
                  Net Earnings
                </span>
                <span className="text-white font-black text-sm" style={{ fontWeight: 900 }}>
                  ${order.vendorNetEarnings.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Order Metadata */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#141414] border border-white/5 rounded-xl p-2">
              <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1">
                Date
              </div>
              <div className="text-white text-[10px]">
                {new Date(order.date).toLocaleDateString()}
              </div>
            </div>
            <div className="bg-[#141414] border border-white/5 rounded-xl p-2">
              <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1">
                Status
              </div>
              <div className="text-white text-[10px] uppercase tracking-wider font-black">
                {order.status}
              </div>
            </div>
            <div className="bg-[#141414] border border-white/5 rounded-xl p-2">
              <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1">
                Payment
              </div>
              <div className="text-white text-[10px] uppercase tracking-wider font-black">
                {order.paymentStatus}
              </div>
            </div>
            <div className="bg-[#141414] border border-white/5 rounded-xl p-2">
              <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1">
                Fulfillment
              </div>
              <div className="text-white text-[10px] uppercase tracking-wider font-black">
                {order.fulfillmentStatus}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
