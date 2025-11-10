import { useState } from "react";
import { ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { ds, cn } from "@/components/ds";
import { LocationStock } from "./LocationStock";

interface LocationInventory {
  inventory_id: string;
  location_id: string;
  location_name: string;
  quantity: number;
}

interface InventoryItemProps {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  price: number;
  costPrice?: number;
  totalQuantity: number;
  locations: LocationInventory[];
  onAdjust: (
    productId: string,
    locationId: string,
    inventoryId: string,
    amount: number,
  ) => Promise<void>;
  isAdjusting: Record<string, boolean>;
}

export function InventoryItem({
  productId,
  productName,
  sku,
  category,
  price,
  costPrice,
  totalQuantity,
  locations,
  onAdjust,
  isAdjusting,
}: InventoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const stockStatus =
    totalQuantity === 0 ? "Empty" : totalQuantity <= 10 ? "Low" : "In Stock";
  const stockColor =
    totalQuantity === 0
      ? "text-white/30"
      : totalQuantity <= 10
        ? "text-white/60"
        : "text-white/80";

  const margin = costPrice ? ((price - costPrice) / price) * 100 : null;
  const stockValue = price * totalQuantity;

  return (
    <div
      className={cn(
        "rounded-2xl border overflow-hidden",
        ds.colors.bg.secondary,
        ds.colors.border.default,
      )}
    >
      {/* Main Row */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full p-4 transition-colors text-left",
          "hover:bg-white/[0.02]",
        )}
      >
        <div className="flex items-center gap-4">
          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3
                className={cn(ds.typography.size.sm, "text-white font-light")}
              >
                {productName}
              </h3>
              <span
                className={cn(
                  "px-2 py-0.5 text-[8px] uppercase tracking-wider border rounded",
                  ds.colors.border.default,
                  stockColor,
                )}
              >
                {stockStatus}
              </span>
            </div>
            <div
              className={cn(
                "flex items-center gap-2",
                ds.typography.size.xs,
                ds.colors.text.tertiary,
              )}
            >
              <span>{category}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin size={10} />
                {locations.length} location{locations.length !== 1 ? "s" : ""}
              </span>
              <span>•</span>
              <span>${price.toFixed(2)}/g</span>
            </div>
          </div>

          {/* Stock Quantity */}
          <div className="text-right">
            <div
              className={cn(
                ds.typography.size.xs,
                ds.colors.text.quaternary,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
                "mb-1",
              )}
            >
              Total Stock
            </div>
            <div className="text-2xl font-light text-white">
              {totalQuantity.toFixed(2)}g
            </div>
            {margin !== null && (
              <div
                className={cn(ds.typography.size.xs, ds.colors.text.tertiary)}
              >
                {margin.toFixed(1)}% margin
              </div>
            )}
          </div>

          {/* Value */}
          <div className="text-right min-w-[100px]">
            <div
              className={cn(
                ds.typography.size.xs,
                ds.colors.text.quaternary,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
                "mb-1",
              )}
            >
              Value
            </div>
            <div className="text-xl font-light text-white">
              $
              {stockValue.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </div>
          </div>

          {/* Expand Icon */}
          <div className={cn(ds.colors.text.quaternary, "transition-colors")}>
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </button>

      {/* Expanded - Locations */}
      {isExpanded && (
        <div
          className={cn(
            "border-t p-4",
            ds.colors.border.default,
            "bg-black/20",
          )}
        >
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={14} className={ds.colors.text.quaternary} />
            <h4
              className={cn(
                ds.typography.size.xs,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
                ds.colors.text.tertiary,
              )}
            >
              Stock by Location
            </h4>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {locations.map((location) => (
              <LocationStock
                key={location.inventory_id}
                productId={productId}
                locationId={location.location_id}
                inventoryId={location.inventory_id}
                locationName={location.location_name}
                quantity={location.quantity}
                onAdjust={onAdjust}
                isAdjusting={
                  isAdjusting[`${productId}-${location.location_id}`] || false
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
