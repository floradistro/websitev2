"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Package, ArrowLeft, CheckCircle, AlertCircle, Search, Scan } from "lucide-react";
import { useRouter } from "next/navigation";

import { logger } from "@/lib/logger";
interface PurchaseOrder {
  id: string;
  po_number: string;
  status: string;
  supplier?: { external_name: string };
  items: POItem[];
  total: number;
  created_at: string;
}

interface POItem {
  id: string;
  product_id: string;
  quantity: number;
  quantity_received: number;
  quantity_remaining: number;
  unit_price: number;
  product?: {
    id: string;
    name: string;
    sku?: string;
  };
}

export default function POSReceivingPage() {
  const router = useRouter();
  const [locationId, setLocationId] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string>("");
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [receiving, setReceiving] = useState(false);
  const [searchSKU, setSearchSKU] = useState("");
  const [receiveQuantities, setReceiveQuantities] = useState<Record<string, number>>({});
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skuInputRef = useRef<HTMLInputElement>(null);

  // Load location from localStorage (set by POS register)
  useEffect(() => {
    const savedLocation = localStorage.getItem("pos_selected_location");
    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        setLocationId(location.id);
        setLocationName(location.name);
      } catch (e) {
        if (process.env.NODE_ENV === "development") {
          logger.error("Failed to parse location:", e);
        }
      }
    }
  }, []);

  // Load POs for this location
  const loadPurchaseOrders = useCallback(async () => {
    if (!locationId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/pos/receiving?location_id=${locationId}`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setPurchaseOrders(data.data || []);
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error loading POs:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    loadPurchaseOrders();
  }, [loadPurchaseOrders]);

  // Initialize receive quantities when PO is selected
  useEffect(() => {
    if (selectedPO) {
      const quantities: Record<string, number> = {};
      selectedPO.items
        .filter((item) => item.quantity_remaining > 0)
        .forEach((item) => {
          quantities[item.id] = item.quantity_remaining; // Default to full quantity
        });
      setReceiveQuantities(quantities);
      setSearchSKU("");
      setError(null);
      setSuccess(false);
    }
  }, [selectedPO]);

  // Handle barcode scan
  useEffect(() => {
    if (!selectedPO || !skuInputRef.current) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Enter key triggers SKU lookup
      if (e.key === "Enter" && searchSKU.trim()) {
        e.preventDefault();
        handleSKULookup();
      }
    };

    const input = skuInputRef.current;
    input.addEventListener("keypress", handleKeyPress);

    return () => {
      input.removeEventListener("keypress", handleKeyPress);
    };
  }, [selectedPO, searchSKU]);

  const handleSKULookup = () => {
    if (!selectedPO) return;

    const item = selectedPO.items.find(
      (i) => i.product?.sku?.toLowerCase() === searchSKU.trim().toLowerCase(),
    );

    if (item) {
      // Scroll to item
      const element = document.getElementById(`item-${item.id}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("ring-2", "ring-emerald-400");
        setTimeout(() => {
          element.classList.remove("ring-2", "ring-emerald-400");
        }, 2000);
      }
      setSearchSKU("");
      setError(null);
    } else {
      setError(`SKU "${searchSKU}" not found in this PO`);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleReceive = async () => {
    if (!selectedPO) return;

    const itemsToReceive = Object.entries(receiveQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([po_item_id, quantity_received]) => ({
        po_item_id,
        quantity_received,
        condition: "good" as const,
        quality_notes: "",
        notes: "Received via POS",
      }));

    if (itemsToReceive.length === 0) {
      setError("No items to receive");
      return;
    }

    setReceiving(true);
    setError(null);

    try {
      const response = await fetch("/api/vendor/purchase-orders/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          po_id: selectedPO.id,
          items: itemsToReceive,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to receive items");
      }

      setSuccess(true);

      // Reload POs after 1.5 seconds and go back to list
      setTimeout(() => {
        loadPurchaseOrders();
        setSelectedPO(null);
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to receive items");
    } finally {
      setReceiving(false);
    }
  };

  const receivableItems = selectedPO?.items.filter((item) => item.quantity_remaining > 0) || [];
  const totalReceiving = Object.values(receiveQuantities).reduce((sum, qty) => sum + qty, 0);

  // No location selected
  if (!locationId) {
    return (
      <div className="h-full bg-black text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <Package size={64} className="mx-auto mb-4 text-white/20" />
          <h2 className="text-xl font-light mb-2">No Location Selected</h2>
          <p className="text-sm text-white/60 mb-6">
            Please select a location from the POS register to access receiving.
          </p>
          <button
            onClick={() => router.push("/pos/register")}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-light transition-colors"
          >
            Go to Register
          </button>
        </div>
      </div>
    );
  }

  // PO Detail View
  if (selectedPO) {
    return (
      <div className="h-full bg-black text-white flex flex-col">
        {/* Header */}
        <div className="bg-white/5 border-b border-white/5 p-4">
          <button
            onClick={() => setSelectedPO(null)}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-3"
          >
            <ArrowLeft size={16} />
            <span className="text-xs uppercase tracking-wider">Back to Purchase Orders</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-light mb-1">{selectedPO.po_number}</h1>
              <p className="text-xs text-white/60">
                {selectedPO.supplier?.external_name} • {receivableItems.length} items remaining
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/60 uppercase tracking-wider mb-1">Receiving</div>
              <div className="text-2xl font-light">{totalReceiving} units</div>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mx-4 mt-4 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />
            <span className="text-sm text-emerald-400">
              Items received successfully! Inventory updated.
            </span>
          </div>
        )}

        {error && (
          <div className="mx-4 mt-4 flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}

        {/* SKU Scanner */}
        <div className="mx-4 mt-4">
          <div className="relative">
            <Scan size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              ref={skuInputRef}
              type="text"
              value={searchSKU}
              onChange={(e) => setSearchSKU(e.target.value)}
              placeholder="Scan or type SKU to find item..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              autoFocus
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {receivableItems.length === 0 ? (
            <div className="text-center py-16">
              <Package size={64} className="mx-auto mb-4 text-white/10" />
              <p className="text-white/60">All items have been received</p>
            </div>
          ) : (
            receivableItems.map((item) => (
              <div
                key={item.id}
                id={`item-${item.id}`}
                className="bg-white/5 border border-white/5 rounded-xl p-4 transition-all"
              >
                {/* Product Info */}
                <div className="mb-3">
                  <h3 className="text-sm font-light text-white mb-1">
                    {item.product?.name || "Unknown Product"}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-white/60">
                    {item.product?.sku && <span>SKU: {item.product.sku}</span>}
                    <span>•</span>
                    <span>Ordered: {item.quantity}</span>
                    <span>•</span>
                    <span>Remaining: {item.quantity_remaining}</span>
                  </div>
                </div>

                {/* Quantity Input */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-white/60 mb-1">Receiving Quantity</label>
                    <input
                      type="number"
                      value={receiveQuantities[item.id] || 0}
                      onChange={(e) => {
                        const value = Math.min(
                          Math.max(0, parseFloat(e.target.value) || 0),
                          item.quantity_remaining,
                        );
                        setReceiveQuantities((prev) => ({
                          ...prev,
                          [item.id]: value,
                        }));
                      }}
                      min={0}
                      max={item.quantity_remaining}
                      step={0.01}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setReceiveQuantities((prev) => ({
                          ...prev,
                          [item.id]: 0,
                        }))
                      }
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition-colors"
                    >
                      Skip
                    </button>
                    <button
                      onClick={() =>
                        setReceiveQuantities((prev) => ({
                          ...prev,
                          [item.id]: item.quantity_remaining,
                        }))
                      }
                      className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs transition-colors"
                    >
                      Full
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-white/5 p-4 bg-white/5">
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedPO(null)}
              disabled={receiving}
              className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-light transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleReceive}
              disabled={receiving || totalReceiving === 0 || success}
              className="flex-1 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-sm font-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {receiving
                ? "Receiving..."
                : success
                  ? "Received!"
                  : `Receive ${totalReceiving} Units`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PO List View
  return (
    <div className="h-full bg-black text-white flex flex-col">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/5 p-4">
        <button
          onClick={() => router.push("/pos/register")}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-3"
        >
          <ArrowLeft size={16} />
          <span className="text-xs uppercase tracking-wider">Back to Register</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-light mb-1">Receive Inventory</h1>
            <p className="text-xs text-white/60">{locationName}</p>
          </div>
          <Package size={32} className="text-white/20" />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xs text-white/60 uppercase tracking-wider">
              Loading purchase orders...
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && purchaseOrders.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <Package size={64} className="mx-auto mb-4 text-white/20" />
            <h2 className="text-xl font-light mb-2">No Purchase Orders</h2>
            <p className="text-sm text-white/60">
              There are no purchase orders to receive for this location.
            </p>
          </div>
        </div>
      )}

      {/* PO List */}
      {!loading && purchaseOrders.length > 0 && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {purchaseOrders.map((po) => {
            const receivableCount = po.items.filter((i) => i.quantity_remaining > 0).length;

            return (
              <button
                key={po.id}
                onClick={() => setSelectedPO(po)}
                className="w-full bg-white/5 border border-white/5 hover:border-white/20 rounded-xl p-4 text-left transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-light text-white mb-1">{po.po_number}</h3>
                    <p className="text-xs text-white/60">
                      {po.supplier?.external_name || "Unknown Supplier"}
                    </p>
                  </div>
                  <div className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-xs uppercase tracking-wider">
                    {po.status}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>{receivableCount} items to receive</span>
                  <span className="text-white font-light">
                    ${parseFloat(po.total?.toString() || "0").toFixed(2)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
