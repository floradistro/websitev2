import { useState } from "react";
import { ChevronDown, ChevronUp, MapPin, CheckSquare, Square } from "lucide-react";
import { ds, cn } from "@/components/ds";
import { LocationStock } from "./LocationStock_NEW";

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
  selectedItems: Set<string>;
  onToggleSelect: (productId: string, locationId: string) => void;
  isSingleLocationMode?: boolean; // NEW: Don't show expand when filtering by location
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
  selectedItems,
  onToggleSelect,
  isSingleLocationMode = false,
}: InventoryItemProps) {
  // Auto-expand when in single-location mode (ALWAYS)
  const shouldAutoExpand = isSingleLocationMode;
  const [isExpanded, setIsExpanded] = useState(shouldAutoExpand);

  const stockStatus = totalQuantity === 0 ? "Empty" : totalQuantity <= 10 ? "Low" : "In Stock";
  const stockColor =
    totalQuantity === 0 ? "text-white/30" : totalQuantity <= 10 ? "text-white/60" : "text-white/80";

  const margin = costPrice ? ((price - costPrice) / price) * 100 : null;
  const stockValue = price * totalQuantity;

  return (
    <div
      className={cn(
        "rounded-2xl border overflow-hidden transition-all",
        ds.colors.bg.secondary,
        ds.colors.border.default,
      )}
    >
      {/* Main Row */}
      <div className="flex items-center gap-4 p-4">
        {/* Checkbox for bulk selection */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Toggle all locations for this product
            locations.forEach((loc) => onToggleSelect(productId, loc.location_id));
          }}
          className="flex-shrink-0"
        >
          {locations.every((loc) => selectedItems.has(`${productId}-${loc.location_id}`)) ? (
            <CheckSquare size={18} className="text-white" />
          ) : locations.some((loc) => selectedItems.has(`${productId}-${loc.location_id}`)) ? (
            <Square size={18} className="text-white/50" />
          ) : (
            <Square size={18} className="text-white/30" />
          )}
        </button>

        {/* Product Info - Clickable (unless single location mode) */}
        <button
          onClick={() => !shouldAutoExpand && setIsExpanded(!isExpanded)}
          disabled={shouldAutoExpand}
          className={cn(
            "flex-1 min-w-0 transition-colors text-left flex items-center gap-4",
            !shouldAutoExpand && "hover:bg-white/[0.02]",
            shouldAutoExpand && "cursor-default"
          )}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={cn(ds.typography.size.sm, "text-white font-light")}>{productName}</h3>
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
              {/* Hide location count in single-location mode */}
              {!shouldAutoExpand && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin size={10} />
                    {locations.length} location{locations.length !== 1 ? "s" : ""}
                  </span>
                </>
              )}
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
            <div className="text-2xl font-light text-white">{totalQuantity.toFixed(2)}g</div>
            {margin !== null && (
              <div className={cn(ds.typography.size.xs, ds.colors.text.tertiary)}>
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

          {/* Expand Icon - Hide in single location mode */}
          {!shouldAutoExpand && (
            <div className={cn(ds.colors.text.quaternary, "transition-colors")}>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          )}
        </button>
      </div>

      {/* Expanded - Locations (always show in single location mode) */}
      {(isExpanded || shouldAutoExpand) && (
        <div>
          {/* Only show header when there are multiple locations */}
          {!shouldAutoExpand && locations.length > 1 && (
            <div className={cn("border-t p-4 flex items-center gap-2", ds.colors.border.default, "bg-black/20")}>
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
          )}

          {/* FULL WIDTH LIST - No grid, no padding */}
          <div>
            {locations.map((location) => (
              <LocationStock
                key={location.inventory_id}
                productId={productId}
                locationId={location.location_id}
                inventoryId={location.inventory_id}
                locationName={location.location_name}
                quantity={location.quantity}
                onAdjust={onAdjust}
                isAdjusting={isAdjusting[`${productId}-${location.location_id}`] || false}
                isSelected={selectedItems.has(`${productId}-${location.location_id}`)}
                onToggleSelect={() => onToggleSelect(productId, location.location_id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
