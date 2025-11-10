"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { useAppAuth } from "@/context/AppAuthContext";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";

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
type StatusFilter =
  | "all"
  | "completed"
  | "processing"
  | "pending"
  | "cancelled";
type LocationFilter = "all" | string;

export default function VendorOrders() {
  const { isAuthenticated, isLoading: authLoading, vendor } = useAppAuth();

  // Data state
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [orderTypeFilter, setOrderTypeFilter] =
    useState<OrderTypeFilter>("all");
  const [locationFilter, setLocationFilter] = useState<LocationFilter>("all");

  // UI state - using force update pattern to prevent re-render loops
  const [, forceUpdate] = useState({});
  const selectedOrderRef = useRef<Order | null>(null);
  const modalOpenRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  // Detect if component is mounted (for portal)
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
          location: locationFilter,
          ...(orderTypeFilter !== "all" && { order_type: orderTypeFilter }),
          ...(statusFilter !== "all" && { status: statusFilter }),
          date_range: "last_30_days",
        });

        const response = await fetch(`/api/vendor/orders?${params}`, {
          headers: {
            "x-vendor-id": vendor.id,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load orders");
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
          console.error("Error loading orders:", error);
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
  const getStatusVariant = (
    status: string,
  ): "success" | "warning" | "error" | "neutral" => {
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
        return <Store size={14} className="text-white/40" />;
      case "shipping":
        return <Truck size={14} className="text-white/40" />;
      default:
        return <ShoppingBag size={14} className="text-white/40" />;
    }
  };

  // Location names for filter
  const locations = stats ? Object.keys(stats.by_location) : [];

  return (
    <div className="w-full px-4 lg:px-0">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-white/5">
        <h1
          className="text-xs uppercase tracking-[0.15em] text-white font-black mb-1"
          style={{ fontWeight: 900 }}
        >
          Orders Hub
        </h1>
        <p className="text-[10px] uppercase tracking-[0.15em] text-white/40">
          All Locations · Real-Time Updates
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 spacing-grid mb-8">
        <StatCard
          label="Total Orders"
          value={loading ? "—" : stats?.total_orders || 0}
          sublabel="Last 30 Days"
          icon={Package}
          loading={loading}
          delay="0s"
        />
        <StatCard
          label="Gross Revenue"
          value={loading ? "—" : `$${(stats?.total_revenue || 0).toFixed(2)}`}
          sublabel="Before Commission"
          icon={DollarSign}
          loading={loading}
          delay="0.1s"
        />
        <StatCard
          label="Commission"
          value={
            loading ? "—" : `$${(stats?.total_commission || 0).toFixed(2)}`
          }
          sublabel="Platform Fee"
          icon={TrendingUp}
          loading={loading}
          delay="0.2s"
        />
        <StatCard
          label="Net Earnings"
          value={loading ? "—" : `$${(stats?.net_earnings || 0).toFixed(2)}`}
          sublabel="Your Payout"
          icon={DollarSign}
          loading={loading}
          delay="0.3s"
        />
      </div>

      {/* Location Stats */}
      {stats && Object.keys(stats.by_location).length > 1 && (
        <div className="mb-8">
          <h3 className="text-xs uppercase tracking-wider text-white/60 mb-4">
            By Location
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 spacing-grid">
            {Object.entries(stats.by_location).map(
              ([locationName, locationStats]) => (
                <div key={locationName} className="minimal-glass p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-white/40" />
                      <h4 className="text-white text-sm font-medium">
                        {locationName}
                      </h4>
                    </div>
                    <Badge variant="neutral">{locationStats.order_count}</Badge>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-white/60">
                      <span>Revenue</span>
                      <span className="text-white">
                        ${locationStats.revenue.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>Net Earnings</span>
                      <span className="text-green-500/80">
                        ${locationStats.net_earnings.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="minimal-glass p-6 mb-8">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              type="text"
              placeholder="Search by customer, order number, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/20 border border-white/10 text-white placeholder-white/30 pl-10 pr-4 py-3 focus:outline-none focus:border-white/30 transition-all rounded-2xl text-base"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Order Type Filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <FilterButton
                active={orderTypeFilter === "all"}
                onClick={() => setOrderTypeFilter("all")}
                icon={<Package size={14} />}
              >
                All Orders
              </FilterButton>
              <FilterButton
                active={orderTypeFilter === "pickup"}
                onClick={() => setOrderTypeFilter("pickup")}
                icon={<Store size={14} />}
                count={stats?.by_type.pickup}
              >
                Pickup
              </FilterButton>
              <FilterButton
                active={orderTypeFilter === "delivery"}
                onClick={() => setOrderTypeFilter("delivery")}
                icon={<Truck size={14} />}
                count={stats?.by_type.delivery}
              >
                Shipping
              </FilterButton>
              <FilterButton
                active={orderTypeFilter === "instore"}
                onClick={() => setOrderTypeFilter("instore")}
                icon={<ShoppingBag size={14} />}
                count={stats?.by_type.instore}
              >
                In-Store
              </FilterButton>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <FilterButton
                active={statusFilter === "all"}
                onClick={() => setStatusFilter("all")}
              >
                All Status
              </FilterButton>
              <FilterButton
                active={statusFilter === "completed"}
                onClick={() => setStatusFilter("completed")}
              >
                Completed
              </FilterButton>
              <FilterButton
                active={statusFilter === "processing"}
                onClick={() => setStatusFilter("processing")}
              >
                Processing
              </FilterButton>
              <FilterButton
                active={statusFilter === "pending"}
                onClick={() => setStatusFilter("pending")}
              >
                Pending
              </FilterButton>
            </div>

            {/* Location Filter */}
            {locations.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <FilterButton
                  active={locationFilter === "all"}
                  onClick={() => setLocationFilter("all")}
                  icon={<MapPin size={14} />}
                >
                  All Locations
                </FilterButton>
                {locations.map((location) => (
                  <FilterButton
                    key={location}
                    active={locationFilter === location}
                    onClick={() => setLocationFilter(location)}
                  >
                    {location}
                  </FilterButton>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="minimal-glass p-12 text-center">
          <div className="text-white/40 text-xs uppercase tracking-wider">
            Loading orders...
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="minimal-glass p-12">
          <div className="text-center">
            <Package size={48} className="text-white/20 mx-auto mb-4" />
            <div className="text-white/60 mb-2">No orders found</div>
            <div className="text-white/40 text-sm">
              {search
                ? "Try adjusting your search"
                : "Orders will appear here once customers make purchases"}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile List View */}
          <div
            className="lg:hidden divide-y divide-white/5 -mx-4"
            style={{ animation: "fadeInUp 0.6s ease-out 0.3s both" }}
          >
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={(e) => {
                  e.preventDefault();
                  openModal(order);
                }}
                className="px-4 py-4 hover:bg-white/[0.02] transition-all bg-black cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium mb-1">
                      {order.customerName}
                    </div>
                    <div className="text-white/40 text-xs font-mono">
                      {order.orderNumber}
                    </div>
                  </div>
                  <Badge variant={getStatusVariant(order.status)}>
                    {order.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2 text-white/60">
                    {getOrderTypeIcon(order.orderType)}
                    <span>{order.orderType}</span>
                  </div>
                  <div className="text-white/60">{order.locationName}</div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/60">
                    {new Date(order.date).toLocaleDateString()}
                  </span>
                  <span className="text-white font-medium">
                    ${order.vendorNetEarnings.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block minimal-glass overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-white/5 bg-black/40">
                <tr>
                  <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">
                    Order
                  </th>
                  <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">
                    Date
                  </th>
                  <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">
                    Customer
                  </th>
                  <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">
                    Type
                  </th>
                  <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">
                    Location
                  </th>
                  <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">
                    Items
                  </th>
                  <th className="text-right text-xs font-medium text-white/60 uppercase tracking-wider p-4">
                    Revenue
                  </th>
                  <th className="text-right text-xs font-medium text-white/60 uppercase tracking-wider p-4">
                    Net
                  </th>
                  <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-white/60 uppercase tracking-wider p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-white/[0.02] transition-all group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-white/40" />
                        <span className="text-white font-mono text-sm">
                          {order.orderNumber}
                        </span>
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
                        <span className="text-white text-sm">
                          {order.customerName}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getOrderTypeIcon(order.orderType)}
                        <span className="text-white/60 text-sm">
                          {order.orderType}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-white/40" />
                        <span className="text-white/60 text-sm">
                          {order.locationName}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-white/60 text-sm">
                        {order.itemCount} item{order.itemCount !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-white text-sm font-medium">
                        ${order.vendorSubtotal.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-green-500/80 text-sm font-medium">
                        ${order.vendorNetEarnings.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge variant={getStatusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openModal(order);
                        }}
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
      {isMounted &&
        selectedOrderRef.current &&
        modalOpenRef.current &&
        createPortal(
          <OrderDetailModal
            order={selectedOrderRef.current}
            onClose={closeModal}
            getStatusVariant={getStatusVariant}
            getOrderTypeIcon={getOrderTypeIcon}
          />,
          document.body,
        )}
    </div>
  );
}

// Filter Button Component
function FilterButton({
  active,
  onClick,
  children,
  icon,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-xs uppercase tracking-wider transition-all whitespace-nowrap rounded-2xl flex items-center gap-2 ${
        active
          ? "bg-gradient-to-r from-white/10 to-white/5 text-white border border-white/20"
          : "bg-black/20 text-white/50 border border-white/10 hover:border-white/20 hover:text-white/70"
      }`}
    >
      {icon}
      {children}
      {count !== undefined && count > 0 && (
        <span className={`ml-1 ${active ? "text-white/60" : "text-white/40"}`}>
          ({count})
        </span>
      )}
    </button>
  );
}

// Order Detail Modal Component
function OrderDetailModal({
  order,
  onClose,
  getStatusVariant,
  getOrderTypeIcon,
}: {
  order: Order;
  onClose: () => void;
  getStatusVariant: (
    status: string,
  ) => "success" | "warning" | "error" | "neutral";
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
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-black/95 backdrop-blur-xl border border-white/10 rounded-[20px] max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 animate-fadeIn"
        onClick={handleContentClick}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6 pb-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-light text-white mb-2">
              {order.orderNumber}
            </h2>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-white/60">
                <User size={14} />
                {order.customerName}
              </div>
              <div className="flex items-center gap-2 text-white/60">
                {getOrderTypeIcon(order.orderType)}
                {order.orderType}
              </div>
              <div className="flex items-center gap-2 text-white/60">
                <MapPin size={14} />
                {order.locationName}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Customer Info */}
        <div className="mb-6 p-4 bg-white/5 border border-white/5 rounded-2xl">
          <h3 className="text-xs uppercase tracking-wider text-white/60 mb-3">
            Customer Details
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-white/60 text-xs mb-1">Email</div>
              <div className="text-white">{order.customerEmail}</div>
            </div>
            {order.customerPhone && (
              <div>
                <div className="text-white/60 text-xs mb-1">Phone</div>
                <div className="text-white">{order.customerPhone}</div>
              </div>
            )}
          </div>
        </div>

        {/* Shipping Info (for delivery orders) */}
        {order.deliveryType === "delivery" && order.shippingAddress && (
          <div className="mb-6 p-4 bg-white/5 border border-white/5 rounded-2xl">
            <h3 className="text-xs uppercase tracking-wider text-white/60 mb-3">
              Shipping Information
            </h3>
            <div className="space-y-2 text-sm">
              {order.trackingNumber && (
                <div>
                  <span className="text-white/60">Tracking: </span>
                  <span className="text-white font-mono">
                    {order.trackingNumber}
                  </span>
                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-400 hover:text-blue-300 text-xs"
                    >
                      Track Package →
                    </a>
                  )}
                </div>
              )}
              {order.shippingCarrier && (
                <div>
                  <span className="text-white/60">Carrier: </span>
                  <span className="text-white">{order.shippingCarrier}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-wider text-white/60 mb-3">
            Order Items
          </h3>
          <div className="space-y-2">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl"
              >
                {item.productImage && (
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="text-white text-sm font-medium mb-1">
                    {item.productName}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/60">
                    <span>Qty: {item.quantityDisplay || item.quantity}</span>
                    <span>@${item.unitPrice.toFixed(2)}</span>
                    {item.tierName && (
                      <Badge variant="neutral">{item.tierName}</Badge>
                    )}
                  </div>
                </div>
                <div className="text-white font-medium">
                  ${item.lineTotal.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="mb-6 p-4 bg-white/5 border border-white/5 rounded-2xl">
          <h3 className="text-xs uppercase tracking-wider text-white/60 mb-3">
            Financial Summary
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Subtotal</span>
              <span className="text-white font-medium">
                ${order.vendorSubtotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Platform Commission</span>
              <span className="text-red-500/80">
                -${order.vendorCommission.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-white/10">
              <span className="text-white font-medium">Your Net Earnings</span>
              <span className="text-green-500 font-semibold text-lg">
                ${order.vendorNetEarnings.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Order Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-white/60 text-xs mb-1">Order Date</div>
            <div className="text-white">
              {new Date(order.date).toLocaleDateString()}
            </div>
          </div>
          <div>
            <div className="text-white/60 text-xs mb-1">Order Status</div>
            <Badge variant={getStatusVariant(order.status)}>
              {order.status}
            </Badge>
          </div>
          <div>
            <div className="text-white/60 text-xs mb-1">Payment</div>
            <Badge
              variant={order.paymentStatus === "paid" ? "success" : "warning"}
            >
              {order.paymentStatus}
            </Badge>
          </div>
          <div>
            <div className="text-white/60 text-xs mb-1">Fulfillment</div>
            <Badge
              variant={
                order.fulfillmentStatus === "fulfilled" ? "success" : "neutral"
              }
            >
              {order.fulfillmentStatus}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
