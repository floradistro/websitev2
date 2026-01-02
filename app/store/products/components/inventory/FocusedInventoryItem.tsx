import { useState } from "react";
import { CheckSquare, Square } from "lucide-react";
import { ds, cn } from "@/components/ds";

interface LocationInventory {
  inventory_id: string;
  location_id: string;
  location_name: string;
  quantity: number;
}

interface FocusedInventoryItemProps {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  price: number;
  costPrice?: number;
  location: LocationInventory;
  onAdjust: (
    productId: string,
    locationId: string,
    inventoryId: string,
    amount: number,
  ) => Promise<void>;
  isAdjusting: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
}

/**
 * FOCUSED MODE INVENTORY ITEM
 * Steve Jobs approved: When viewing ONE location, show inline editing immediately
 * No expand/collapse - just the product with direct quantity editing
 */
export function FocusedInventoryItem({
  productId,
  productName,
  sku,
  category,
  price,
  costPrice,
  location,
  onAdjust,
  isAdjusting,
  isSelected,
  onToggleSelect,
}: FocusedInventoryItemProps) {
  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState(location.quantity.toString());

  const stockStatus = location.quantity === 0 ? "Empty" : location.quantity <= 10 ? "Low" : "In Stock";
  const stockColor =
    location.quantity === 0 ? "text-white/30" : location.quantity <= 10 ? "text-white/60" : "text-white/80";

  const margin = costPrice ? ((price - costPrice) / price) * 100 : null;
  const stockValue = price * location.quantity;

  const handleQuickAdd = async (amount: number) => {
    await onAdjust(productId, location.location_id, location.inventory_id, amount);
  };

  const handleDirectEdit = async () => {
    const newQty = parseFloat(editValue);
    if (!isNaN(newQty) && newQty >= 0) {
      const change = newQty - location.quantity;
      if (change !== 0) {
        await onAdjust(productId, location.location_id, location.inventory_id, change);
      }
      setEditMode(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-all",
        ds.colors.bg.secondary,
        ds.colors.border.default,
        isSelected && "ring-2 ring-white/20"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <button onClick={onToggleSelect} className="mt-1 flex-shrink-0">
          {isSelected ? (
            <CheckSquare size={18} className="text-white" />
          ) : (
            <Square size={18} className="text-white/30" />
          )}
        </button>

        {/* Product Info */}
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
          <div className={cn("flex items-center gap-2", ds.typography.size.xs, ds.colors.text.tertiary)}>
            <span>{category}</span>
            <span>•</span>
            <span>${price.toFixed(2)}/g</span>
            {margin !== null && (
              <>
                <span>•</span>
                <span>{margin.toFixed(1)}% margin</span>
              </>
            )}
          </div>
        </div>

        {/* Editable Quantity */}
        <div className="text-right flex-shrink-0">
          {editMode ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleDirectEdit();
                  if (e.key === "Escape") {
                    setEditMode(false);
                    setEditValue(location.quantity.toString());
                  }
                }}
                autoFocus
                className={cn(
                  "w-24 px-2 py-1 rounded border text-right",
                  ds.colors.bg.secondary,
                  ds.colors.border.default,
                  ds.typography.size.sm,
                  "text-white"
                )}
              />
              <button
                onClick={handleDirectEdit}
                className="text-green-400 hover:text-green-300 text-xs"
              >
                ✓
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              className="text-right hover:bg-white/5 px-2 py-1 rounded transition-colors"
            >
              <div className="text-2xl font-light text-white">{location.quantity.toFixed(2)}g</div>
              <div className={cn(ds.typography.size.xs, ds.colors.text.quaternary)}>
                click to edit
              </div>
            </button>
          )}
        </div>

        {/* Value */}
        <div className="text-right min-w-[100px] flex-shrink-0">
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
            ${stockValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>

      {/* Quick Adjustments (compact row) */}
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
        <span className={cn(ds.typography.size.xs, ds.colors.text.quaternary)}>Quick:</span>

        {/* Remove buttons */}
        <button
          onClick={() => handleQuickAdd(-7)}
          disabled={isAdjusting || location.quantity < 7}
          className={cn(
            "px-2 py-1 rounded border text-[10px]",
            ds.colors.bg.secondary,
            ds.colors.border.default,
            "text-white/70 hover:bg-white/5 hover:text-white hover:border-white/20",
            "disabled:opacity-20 disabled:cursor-not-allowed"
          )}
        >
          -¼oz
        </button>
        <button
          onClick={() => handleQuickAdd(-14)}
          disabled={isAdjusting || location.quantity < 14}
          className={cn(
            "px-2 py-1 rounded border text-[10px]",
            ds.colors.bg.secondary,
            ds.colors.border.default,
            "text-white/70 hover:bg-white/5 hover:text-white hover:border-white/20",
            "disabled:opacity-20 disabled:cursor-not-allowed"
          )}
        >
          -½oz
        </button>
        <button
          onClick={() => handleQuickAdd(-28)}
          disabled={isAdjusting || location.quantity < 28}
          className={cn(
            "px-2 py-1 rounded border text-[10px]",
            ds.colors.bg.secondary,
            ds.colors.border.default,
            "text-white/70 hover:bg-white/5 hover:text-white hover:border-white/20",
            "disabled:opacity-20 disabled:cursor-not-allowed"
          )}
        >
          -1oz
        </button>

        <div className="h-4 w-px bg-white/10 mx-1"></div>

        {/* Add buttons */}
        <button
          onClick={() => handleQuickAdd(7)}
          disabled={isAdjusting}
          className={cn(
            "px-2 py-1 rounded border text-[10px]",
            ds.colors.bg.hover,
            ds.colors.border.default,
            "text-white hover:bg-white/10 hover:border-white/20",
            "disabled:opacity-20 disabled:cursor-not-allowed"
          )}
        >
          +¼oz
        </button>
        <button
          onClick={() => handleQuickAdd(14)}
          disabled={isAdjusting}
          className={cn(
            "px-2 py-1 rounded border text-[10px]",
            ds.colors.bg.hover,
            ds.colors.border.default,
            "text-white hover:bg-white/10 hover:border-white/20",
            "disabled:opacity-20 disabled:cursor-not-allowed"
          )}
        >
          +½oz
        </button>
        <button
          onClick={() => handleQuickAdd(28)}
          disabled={isAdjusting}
          className={cn(
            "px-2 py-1 rounded border text-[10px]",
            ds.colors.bg.hover,
            ds.colors.border.default,
            "text-white hover:bg-white/10 hover:border-white/20",
            "disabled:opacity-20 disabled:cursor-not-allowed"
          )}
        >
          +1oz
        </button>

        <div className="flex-1"></div>

        {/* Clear button */}
        <button
          onClick={() => handleQuickAdd(-location.quantity)}
          disabled={isAdjusting || location.quantity === 0}
          className={cn(
            "px-3 py-1 rounded border text-[10px]",
            ds.colors.bg.secondary,
            ds.colors.border.default,
            ds.typography.transform.uppercase,
            ds.typography.tracking.wide,
            "text-white/50 hover:bg-white/5 hover:text-white/70 hover:border-white/20",
            "disabled:opacity-20 disabled:cursor-not-allowed"
          )}
        >
          Zero Out
        </button>
      </div>

      {/* Loading Overlay */}
      {isAdjusting && (
        <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
