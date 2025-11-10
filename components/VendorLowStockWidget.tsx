"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Package,
  TrendingDown,
  DollarSign,
  RefreshCw,
  Settings,
} from "lucide-react";
import Link from "next/link";

interface LowStockItem {
  inventory_id: string;
  product_id: string;
  product: {
    id: string;
    name: string;
    sku: string;
    featured_image?: string;
    cost_price?: number;
    regular_price?: number;
    categories?: {
      name: string;
    };
  };
  location: {
    id: string;
    name: string;
    city?: string;
    state?: string;
  };
  quantity: number;
  available_quantity: number;
  reserved_quantity: number;
  stock_status: string;
  reorder_point: number;
  urgency: "critical" | "high" | "medium";
}

interface LowStockStats {
  total_low_stock: number;
  critical: number;
  high: number;
  medium: number;
  total_value_at_risk: number;
}

interface VendorLowStockWidgetProps {
  vendorId: string;
  locationId?: string;
  threshold?: number;
  maxItems?: number;
}

export function VendorLowStockWidget({
  vendorId,
  locationId,
  threshold = 10,
  maxItems = 5,
}: VendorLowStockWidgetProps) {
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [stats, setStats] = useState<LowStockStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLowStock = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams({
        vendor_id: vendorId,
        threshold: threshold.toString(),
      });

      if (locationId) {
        params.append("location_id", locationId);
      }

      const response = await fetch(`/api/vendor/inventory/low-stock?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch low stock items");
      }

      setLowStockItems(data.low_stock_items || []);
      setStats(data.stats || null);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLowStock();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchLowStock, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [vendorId, locationId, threshold]);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "text-red-400 bg-red-500/20 border-red-500/30";
      case "high":
        return "text-orange-400 bg-orange-500/20 border-orange-500/30";
      case "medium":
        return "text-yellow-400 bg-yellow-500/20 border-yellow-500/30";
      default:
        return "text-white/60 bg-white/10 border-white/20";
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return <AlertTriangle size={16} className="text-red-400" />;
      case "high":
        return <TrendingDown size={16} className="text-orange-400" />;
      default:
        return <Package size={16} className="text-yellow-400" />;
    }
  };

  if (loading && !refreshing) {
    return (
      <div className="bg-black/50 border border-white/10 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={20} className="text-yellow-400" />
          <h3 className="text-lg font-medium text-white">Low Stock Alerts</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-white/20 border-t-white rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black/50 border border-red-500/30 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={20} className="text-red-400" />
          <h3 className="text-lg font-medium text-white">Low Stock Alerts</h3>
        </div>
        <div className="text-red-400 text-sm">{error}</div>
        <button
          onClick={fetchLowStock}
          className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 text-sm transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-black/50 border border-white/10 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} className="text-yellow-400" />
          <h3 className="text-lg font-medium text-white">Low Stock Alerts</h3>
          {refreshing && (
            <RefreshCw size={16} className="text-white/60 animate-spin" />
          )}
        </div>
        <button
          onClick={fetchLowStock}
          disabled={refreshing}
          className="p-2 hover:bg-white/10 rounded-lg transition-all disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={16} className="text-white/60" />
        </button>
      </div>

      {/* Stats Overview */}
      {stats && stats.total_low_stock > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="text-xs text-white/60 mb-1">Total</div>
            <div className="text-xl font-semibold text-white">
              {stats.total_low_stock}
            </div>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <div className="text-xs text-red-400 mb-1">Critical</div>
            <div className="text-xl font-semibold text-red-400">
              {stats.critical}
            </div>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
            <div className="text-xs text-orange-400 mb-1">High</div>
            <div className="text-xl font-semibold text-orange-400">
              {stats.high}
            </div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <div className="text-xs text-yellow-400 mb-1">Medium</div>
            <div className="text-xl font-semibold text-yellow-400">
              {stats.medium}
            </div>
          </div>
        </div>
      )}

      {/* Value at Risk */}
      {stats && stats.total_value_at_risk > 0 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={16} className="text-blue-400" />
            <div className="text-xs text-blue-400">Total Value at Risk</div>
          </div>
          <div className="text-2xl font-bold text-blue-400">
            ${stats.total_value_at_risk.toFixed(2)}
          </div>
        </div>
      )}

      {/* Low Stock Items List */}
      {lowStockItems.length === 0 ? (
        <div className="text-center py-8">
          <Package size={48} className="mx-auto mb-3 text-green-400/50" />
          <p className="text-white/60">All inventory levels are healthy!</p>
          <p className="text-xs text-white/40 mt-1">
            No items below reorder point
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {lowStockItems.slice(0, maxItems).map((item) => (
            <div
              key={item.inventory_id}
              className={`border rounded-lg p-4 ${getUrgencyColor(item.urgency)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start gap-3 flex-1">
                  {getUrgencyIcon(item.urgency)}
                  <div className="flex-1">
                    <div className="font-medium text-white mb-1">
                      {item.product.name}
                    </div>
                    <div className="text-xs text-white/60 space-y-1">
                      {item.product.sku && <div>SKU: {item.product.sku}</div>}
                      <div>{item.location?.name}</div>
                      {item.product.categories && (
                        <div className="text-white/40">
                          {item.product.categories.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">
                    {item.available_quantity} left
                  </div>
                  <div className="text-xs text-white/60">
                    of {item.quantity} total
                  </div>
                  {item.reserved_quantity > 0 && (
                    <div className="text-xs text-white/40">
                      {item.reserved_quantity} reserved
                    </div>
                  )}
                </div>
              </div>

              {/* Reorder Point */}
              <div className="text-xs text-white/40 mt-2 pt-2 border-t border-white/10">
                Reorder at: {item.reorder_point} units
              </div>
            </div>
          ))}

          {lowStockItems.length > maxItems && (
            <Link
              href="/vendor/inventory"
              className="block text-center text-sm text-blue-400 hover:text-blue-300 py-2 transition-colors"
            >
              View all {lowStockItems.length} low stock items →
            </Link>
          )}
        </div>
      )}

      {/* Footer Actions */}
      {lowStockItems.length > 0 && (
        <div className="mt-6 pt-4 border-t border-white/10 flex gap-3">
          <Link
            href="/vendor/purchase-orders"
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium text-center transition-all"
          >
            Create Purchase Order
          </Link>
          <Link
            href="/vendor/inventory"
            className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white text-sm font-medium text-center transition-all"
          >
            Manage Inventory
          </Link>
        </div>
      )}
    </div>
  );
}
