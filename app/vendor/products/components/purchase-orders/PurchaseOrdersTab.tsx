"use client";

import { useEffect, useState, useMemo } from "react";
import { Package, Plus } from "lucide-react";
import { useAppAuth } from "@/context/AppAuthContext";
import { ds, cn, Button } from "@/components/ds";
import { POStats } from "./POStats";
import { POFilters } from "./POFilters";
import { POList } from "./POList";
import { ReceiveModal } from "./ReceiveModal";
import { CreatePOModal } from "./CreatePOModal";
import axios from "axios";
import type { PurchaseOrder } from "./types";

import { logger } from "@/lib/logger";
/**
 * PurchaseOrdersTab - Inbound purchase orders only
 * For purchasing inventory FROM suppliers
 * (Outbound wholesale sales are in Commerce → Orders)
 */
export function PurchaseOrdersTab() {
  const { vendor, locations } = useAppAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Load INBOUND orders only
  const loadOrders = async () => {
    if (!vendor?.id) return;

    try {
      setLoading(true);
      const response = await axios.get(`/api/vendor/purchase-orders`, {
        params: {
          vendor_id: vendor.id,
          po_type: "inbound", // Only load inbound purchase orders
        },
      });
      setOrders(response.data.data || []);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error loading POs:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [vendor?.id]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((po) => {
      // Status filter
      if (statusFilter !== "all" && po.status !== statusFilter) return false;

      // Location filter
      if (locationFilter !== "all" && (po as any).location_id !== locationFilter) return false;

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const poNumber = po.po_number?.toLowerCase() || "";
        // Only inbound orders, so only check supplier
        const partner = po.supplier?.external_name?.toLowerCase() || "";
        return poNumber.includes(searchLower) || partner.includes(searchLower);
      }

      return true;
    });
  }, [orders, statusFilter, locationFilter, search]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = orders.length;
    const draft = 0; // No more draft status
    const active = orders.filter((po) =>
      ["ordered", "confirmed", "shipped", "receiving"].includes(po.status),
    ).length;
    const completed = orders.filter((po) => po.status === "received").length;
    const totalValue = orders.reduce((sum, po) => sum + parseFloat(po.total?.toString() || "0"), 0);

    return { total, draft, active, completed, totalValue };
  }, [orders]);

  const handleReceive = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setShowReceiveModal(true);
  };

  const handleReceiveSuccess = () => {
    loadOrders(); // Refresh list
    setShowReceiveModal(false);
    setSelectedPO(null);
  };

  const handleCreateSuccess = () => {
    loadOrders(); // Refresh list
    setShowCreateModal(false);
  };

  return (
    <div>
      {/* Header Note with Create Button */}
      <div
        className={cn(
          "rounded-2xl border p-4 mb-6 flex items-start justify-between gap-3",
          ds.colors.bg.secondary,
          ds.colors.border.default,
        )}
      >
        <div className="flex items-start gap-3">
          <Package size={16} className={cn(ds.colors.text.quaternary, "mt-0.5")} strokeWidth={1} />
          <div>
            <p className={cn(ds.typography.size.xs, "text-white/80 mb-1")}>
              Purchase orders for buying inventory from suppliers
            </p>
            <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary)}>
              For B2B sales, manage wholesale customers in Commerce → Wholesale
            </p>
          </div>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus size={14} />
          Create PO
        </Button>
      </div>

      {/* Stats */}
      <POStats
        total={stats.total}
        draft={stats.draft}
        active={stats.active}
        completed={stats.completed}
        totalValue={stats.totalValue}
        isLoading={loading}
      />

      {/* Filters */}
      <POFilters
        search={search}
        statusFilter={statusFilter}
        locationFilter={locationFilter}
        locations={locations}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        onLocationFilterChange={setLocationFilter}
      />

      {/* Orders List */}
      <POList
        orders={filteredOrders}
        isLoading={loading}
        type="inbound"
        onReceive={handleReceive}
      />

      {/* Modals */}
      <CreatePOModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <ReceiveModal
        isOpen={showReceiveModal}
        onClose={() => {
          setShowReceiveModal(false);
          setSelectedPO(null);
        }}
        purchaseOrder={selectedPO}
        onSuccess={handleReceiveSuccess}
      />
    </div>
  );
}
