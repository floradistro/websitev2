"use client";

import { useState, useEffect, useRef } from "react";
import { Modal, Button, Input } from "@/components/ds";
import { ds, cn } from "@/components/ds";
import {
  Trash2,
  Package,
  Building2,
  CheckCircle2,
  XCircle,
  Search,
  X,
} from "lucide-react";
import { useAppAuth } from "@/context/AppAuthContext";

interface Supplier {
  id: string;
  external_name: string;
  external_company?: string;
  supplier_vendor?: {
    store_name: string;
  };
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  regular_price?: number;
  created_at?: string;
  primary_category?: {
    name: string;
    slug: string;
  };
}

interface POLineItem {
  product_id: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
}

interface CreatePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePOModal({
  isOpen,
  onClose,
  onSuccess,
}: CreatePOModalProps) {
  const { vendor, locations: contextLocations } = useAppAuth();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [lineItems, setLineItems] = useState<POLineItem[]>([]);

  const [productSearch, setProductSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && vendor?.id) {
      loadSuppliers();
      loadProducts();
      // Load locations if not in context
      if (!contextLocations || contextLocations.length === 0) {
        loadLocations();
      } else {
        setLocations(contextLocations);
      }
    }
  }, [isOpen, vendor?.id, contextLocations]);

  const loadSuppliers = async () => {
    if (!vendor?.id) return;
    setLoadingSuppliers(true);
    try {
      const response = await fetch(
        `/api/vendor/suppliers?vendor_id=${vendor.id}`,
        {
          credentials: "include",
        },
      );
      const data = await response.json();
      if (data.success) {
        setSuppliers(data.data || []);
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to load suppliers:", err);
      }
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const loadProducts = async () => {
    if (!vendor?.id) return;
    setLoadingProducts(true);
    try {
      const response = await fetch(
        `/api/vendor/products/full?vendor_id=${vendor.id}&limit=all`,
        {
          credentials: "include",
        },
      );
      const data = await response.json();
      if (data.success) {
        setAllProducts(data.products || []);
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to load products:", err);
      }
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadLocations = async () => {
    if (!vendor?.id) return;
    setLoadingLocations(true);
    try {
      const response = await fetch(
        `/api/vendor/locations?vendor_id=${vendor.id}`,
        {
          credentials: "include",
        },
      );
      const data = await response.json();
      if (data.success) {
        setLocations(data.locations || []);
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to load locations:", err);
      }
    } finally {
      setLoadingLocations(false);
    }
  };

  // Filter products based on search
  const getFilteredProducts = () => {
    if (!productSearch.trim()) {
      // No search - show all products
      return allProducts;
    }

    // Search across name, SKU, and category
    const searchLower = productSearch.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.sku?.toLowerCase().includes(searchLower) ||
        p.primary_category?.name.toLowerCase().includes(searchLower),
    );
  };

  const filteredProducts = getFilteredProducts();

  const addProduct = (product: Product) => {
    // Check if already added
    if (lineItems.some((item) => item.product_id === product.id)) {
      return;
    }

    const newItem: POLineItem = {
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku || "",
      quantity: 1,
      unit_price: parseFloat(product.regular_price?.toString() || "0"),
    };

    setLineItems([...lineItems, newItem]);
    setProductSearch("");
    setShowDropdown(false);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (
    index: number,
    field: keyof POLineItem,
    value: any,
  ) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const calculateSubtotal = () => {
    return lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0,
    );
  };

  const validateForm = () => {
    if (!selectedSupplier) {
      setError("Please select a supplier");
      return false;
    }

    if (!selectedLocation) {
      setError("Please select a location");
      return false;
    }

    if (lineItems.length === 0) {
      setError("Please add at least one product");
      return false;
    }

    const validItems = lineItems.filter(
      (item) => item.product_id && item.quantity > 0 && item.unit_price >= 0,
    );

    if (validItems.length === 0) {
      setError("Please add valid quantities and prices");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!vendor?.id) {
      setError("Vendor not found");
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const validItems = lineItems
        .filter((item) => item.product_id && item.quantity > 0)
        .map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: item.quantity * item.unit_price,
        }));

      const response = await fetch("/api/vendor/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "create",
          vendor_id: vendor.id,
          po_type: "inbound",
          supplier_id: selectedSupplier,
          location_id: selectedLocation,
          expected_delivery_date: expectedDeliveryDate || null,
          internal_notes: internalNotes || null,
          items: validItems,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create purchase order");
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        resetForm();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to create purchase order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedSupplier("");
    setSelectedLocation("");
    setExpectedDeliveryDate("");
    setInternalNotes("");
    setLineItems([]);
    setProductSearch("");
    setShowDropdown(false);
    setError(null);
    setSuccess(false);
  };

  const subtotal = calculateSubtotal();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Purchase Order"
      size="xl"
      footer={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || success}
          >
            {isSubmitting ? "Creating..." : success ? "Created!" : "Create PO"}
          </Button>
        </>
      }
    >
      {/* Success Message */}
      {success && (
        <div
          className={cn(
            "flex items-center gap-2 p-3 rounded-lg mb-4",
            "bg-green-500/10 border border-green-500/20",
          )}
        >
          <CheckCircle2 size={16} className="text-green-400" />
          <span className={cn(ds.typography.size.xs, "text-green-400")}>
            Purchase order created successfully!
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className={cn(
            "flex items-center gap-2 p-3 rounded-lg mb-4",
            "bg-red-500/10 border border-red-500/20",
          )}
        >
          <XCircle size={16} className="text-red-400" />
          <span className={cn(ds.typography.size.xs, "text-red-400")}>
            {error}
          </span>
        </div>
      )}

      {/* Supplier Selection */}
      <div className="mb-4">
        <label
          className={cn(
            ds.typography.size.xs,
            ds.colors.text.quaternary,
            "mb-2 block flex items-center gap-1",
          )}
        >
          <Building2 size={12} />
          Supplier *
        </label>
        <select
          value={selectedSupplier}
          onChange={(e) => setSelectedSupplier(e.target.value)}
          disabled={loadingSuppliers}
          className={cn(
            "w-full rounded-lg px-3 py-2 text-sm",
            "bg-white/5 border border-white/10",
            "text-white placeholder:text-white/30",
            "focus:outline-none focus:ring-2 focus:ring-primary-500/50",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <option value="">
            {loadingSuppliers ? "Loading suppliers..." : "Select supplier"}
          </option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.external_name ||
                supplier.external_company ||
                "Unknown Supplier"}
              {supplier.supplier_vendor &&
                ` (${supplier.supplier_vendor.store_name})`}
            </option>
          ))}
        </select>
        {suppliers.length === 0 && !loadingSuppliers && (
          <p
            className={cn(
              ds.typography.size.xs,
              ds.colors.text.quaternary,
              "mt-1",
            )}
          >
            No suppliers found. Create a supplier first.
          </p>
        )}
      </div>

      {/* Location Selection */}
      <div className="mb-4">
        <label
          className={cn(
            ds.typography.size.xs,
            ds.colors.text.quaternary,
            "mb-2 block flex items-center gap-1",
          )}
        >
          <Package size={12} />
          Receiving Location *
        </label>
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          disabled={loadingLocations}
          className={cn(
            "w-full rounded-lg px-3 py-2 text-sm",
            "bg-white/5 border border-white/10",
            "text-white placeholder:text-white/30",
            "focus:outline-none focus:ring-2 focus:ring-primary-500/50",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <option value="">
            {loadingLocations ? "Loading locations..." : "Select location"}
          </option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
        {locations.length === 0 && !loadingLocations && (
          <p
            className={cn(
              ds.typography.size.xs,
              ds.colors.text.quaternary,
              "mt-1",
            )}
          >
            No locations found. Create a location first.
          </p>
        )}
      </div>

      {/* Expected Delivery Date */}
      <div className="mb-4">
        <label
          className={cn(
            ds.typography.size.xs,
            ds.colors.text.quaternary,
            "mb-2 block",
          )}
        >
          Expected Delivery Date
        </label>
        <Input
          type="date"
          value={expectedDeliveryDate}
          onChange={(e) => setExpectedDeliveryDate(e.target.value)}
        />
      </div>

      {/* Product Search */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <label
            className={cn(
              ds.typography.size.xs,
              ds.colors.text.quaternary,
              "flex items-center gap-1",
            )}
          >
            <Package size={12} />
            Products *
          </label>
          <span
            className={cn(ds.typography.size.xs, ds.colors.text.quaternary)}
          >
            {lineItems.length} items
          </span>
        </div>

        {/* Search Input */}
        <div className="relative mb-3">
          <Search
            size={16}
            className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2",
              ds.colors.text.quaternary,
            )}
          />
          <input
            ref={searchInputRef}
            type="text"
            value={productSearch}
            onChange={(e) => {
              setProductSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => {
              // Delay to allow clicking on dropdown items
              setTimeout(() => setShowDropdown(false), 200);
            }}
            placeholder="Search products..."
            className={cn(
              "w-full rounded-lg pl-10 pr-10 py-2.5 text-sm",
              "bg-white/5 border border-white/10",
              "text-white placeholder:text-white/30",
              "focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50",
            )}
          />
          {productSearch && (
            <button
              onClick={() => {
                setProductSearch("");
                searchInputRef.current?.focus();
              }}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10",
              )}
            >
              <X size={14} className={ds.colors.text.quaternary} />
            </button>
          )}

          {/* Dropdown Results */}
          {showDropdown && (
            <div
              className={cn(
                "absolute z-10 w-full mt-2 rounded-lg border max-h-80 overflow-y-auto",
                "bg-black/95 backdrop-blur-xl",
                ds.colors.border.default,
                "shadow-2xl",
              )}
            >
              <div className="p-2">
                {loadingProducts ? (
                  <div
                    className={cn(
                      "px-3 py-4 text-center",
                      ds.colors.text.quaternary,
                      ds.typography.size.sm,
                    )}
                  >
                    Loading products...
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div
                    className={cn(
                      "px-3 py-4 text-center",
                      ds.colors.text.quaternary,
                      ds.typography.size.sm,
                    )}
                  >
                    {productSearch.trim()
                      ? "No products found"
                      : "No products available"}
                  </div>
                ) : (
                  <>
                    <div
                      className={cn(
                        ds.typography.size.xs,
                        ds.colors.text.quaternary,
                        "px-2 py-1 mb-1",
                      )}
                    >
                      {filteredProducts.length} product
                      {filteredProducts.length === 1 ? "" : "s"}
                    </div>
                    {filteredProducts.map((product) => {
                      const isAdded = lineItems.some(
                        (item) => item.product_id === product.id,
                      );
                      return (
                        <button
                          key={product.id}
                          onClick={() => addProduct(product)}
                          disabled={isAdded}
                          className={cn(
                            "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left",
                            "hover:bg-white/10 transition-colors",
                            "disabled:opacity-40 disabled:cursor-not-allowed",
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div
                              className={cn(
                                ds.typography.size.sm,
                                "text-white/90 truncate",
                              )}
                            >
                              {product.name}
                            </div>
                            <div
                              className={cn(
                                ds.typography.size.xs,
                                ds.colors.text.quaternary,
                                "flex items-center gap-2",
                              )}
                            >
                              {product.sku && <span>SKU: {product.sku}</span>}
                              {product.primary_category && (
                                <>
                                  <span>•</span>
                                  <span>{product.primary_category.name}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {product.regular_price && (
                            <div
                              className={cn(
                                ds.typography.size.sm,
                                ds.colors.text.secondary,
                              )}
                            >
                              $
                              {parseFloat(
                                product.regular_price.toString(),
                              ).toFixed(2)}
                            </div>
                          )}
                          {isAdded && (
                            <div
                              className={cn(
                                ds.typography.size.xs,
                                "text-green-400",
                              )}
                            >
                              Added
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Selected Products List */}
        {lineItems.length > 0 ? (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {lineItems.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "rounded-lg border p-3",
                  ds.colors.bg.secondary,
                  ds.colors.border.default,
                )}
              >
                <div className="flex items-start gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        ds.typography.size.sm,
                        "text-white/90 truncate",
                      )}
                    >
                      {item.product_name}
                    </div>
                    {item.product_sku && (
                      <div
                        className={cn(
                          ds.typography.size.xs,
                          ds.colors.text.quaternary,
                        )}
                      >
                        SKU: {item.product_sku}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => removeLineItem(index)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      className={cn(
                        ds.typography.size.xs,
                        ds.colors.text.quaternary,
                        "mb-1 block",
                      )}
                    >
                      Quantity
                    </label>
                    <Input
                      type="number"
                      value={item.quantity || ""}
                      onChange={(e) =>
                        updateLineItem(
                          index,
                          "quantity",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label
                      className={cn(
                        ds.typography.size.xs,
                        ds.colors.text.quaternary,
                        "mb-1 block",
                      )}
                    >
                      Unit Price
                    </label>
                    <Input
                      type="number"
                      value={item.unit_price || ""}
                      onChange={(e) =>
                        updateLineItem(
                          index,
                          "unit_price",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {item.quantity > 0 && item.unit_price > 0 && (
                  <div
                    className={cn(
                      "text-right mt-2",
                      ds.typography.size.xs,
                      ds.colors.text.tertiary,
                    )}
                  >
                    Line Total: ${(item.quantity * item.unit_price).toFixed(2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div
            className={cn(
              "rounded-lg border-2 border-dashed p-8 text-center",
              ds.colors.border.default,
              "bg-white/[0.02]",
            )}
          >
            <Search
              size={32}
              className={cn(
                "mx-auto mb-2 opacity-20",
                ds.colors.text.quaternary,
              )}
            />
            <p className={cn(ds.typography.size.sm, ds.colors.text.tertiary)}>
              Search and add products to your purchase order
            </p>
          </div>
        )}
      </div>

      {/* Internal Notes */}
      <div className="mb-4">
        <label
          className={cn(
            ds.typography.size.xs,
            ds.colors.text.quaternary,
            "mb-2 block",
          )}
        >
          Internal Notes
        </label>
        <Input
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          placeholder="Optional internal notes..."
        />
      </div>

      {/* Subtotal */}
      {subtotal > 0 && (
        <div className={cn("rounded-lg p-3", ds.colors.bg.secondary)}>
          <div className="flex items-center justify-between">
            <span
              className={cn(ds.typography.size.sm, ds.colors.text.secondary)}
            >
              Subtotal
            </span>
            <span
              className={cn(ds.typography.size.lg, "text-white font-light")}
            >
              ${subtotal.toFixed(2)}
            </span>
          </div>
          <div
            className={cn(
              ds.typography.size.xs,
              ds.colors.text.quaternary,
              "mt-1",
            )}
          >
            {lineItems.length} items • Tax and shipping can be added after PO is
            created
          </div>
        </div>
      )}
    </Modal>
  );
}
