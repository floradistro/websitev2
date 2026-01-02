import { useState } from "react";
import { ds, cn, Button } from "@/components/ds";
import { CheckSquare, Square } from "lucide-react";
import { formatQuantity, round2, subtract, validateNumber } from "@/lib/utils/precision";

interface LocationStockProps {
  productId: string;
  locationId: string;
  inventoryId: string;
  locationName: string;
  quantity: number;
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

export function LocationStock({
  productId,
  locationId,
  inventoryId,
  locationName,
  quantity,
  onAdjust,
  isAdjusting,
  isSelected,
  onToggleSelect,
}: LocationStockProps) {
  const [editMode, setEditMode] = useState(false);
  const [editValue, setEditValue] = useState(quantity.toString());

  const handleQuickAdd = async (amount: number) => {
    await onAdjust(productId, locationId, inventoryId, amount);
  };

  const handleDirectEdit = async () => {
    // VALIDATION FIX: Comprehensive validation
    const validation = validateNumber(editValue, {
      min: 0,
      max: 999999,
      allowNegative: false,
      allowZero: true,
      label: 'Quantity'
    });

    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    const newQty = validation.value!;
    // PRECISION FIX: Use precise subtraction and round to 2 decimal places
    const change = round2(subtract(newQty, quantity));
    if (change !== 0) {
      await onAdjust(productId, locationId, inventoryId, change);
    }
    setEditMode(false);
  };

  const handleClearStock = async () => {
    if (confirm(`Set ${locationName} stock to 0g?`)) {
      // PRECISION FIX: Use precise calculation to avoid floating point issues
      // Always set to exactly 0 by subtracting the exact current quantity
      const preciseAdjustment = round2(subtract(0, quantity));
      await onAdjust(productId, locationId, inventoryId, preciseAdjustment);
    }
  };

  return (
    <div
      className={cn(
        "border-t p-4 transition-all relative",
        ds.colors.border.default,
        "bg-black/20",
        isSelected && "ring-2 ring-inset ring-white/20"
      )}
    >
      {/* HORIZONTAL LIST LAYOUT - Full Width */}
      <div className="flex items-center gap-6">
        {/* Checkbox */}
        <button onClick={onToggleSelect} className="flex-shrink-0">
          {isSelected ? (
            <CheckSquare size={18} className="text-white" />
          ) : (
            <Square size={18} className="text-white/30" />
          )}
        </button>

        {/* Location Name */}
        <div className="flex-shrink-0 min-w-[140px]">
          <div className={cn(ds.typography.size.sm, "text-white font-light")}>
            {locationName}
          </div>
        </div>

        {/* Editable Quantity */}
        <div className="flex-shrink-0 min-w-[120px]">
          {editMode ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="0"
                max="999999"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleDirectEdit();
                  if (e.key === "Escape") {
                    setEditMode(false);
                    setEditValue(quantity.toString());
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
                aria-label="Edit quantity"
                aria-describedby="quantity-hint"
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
              className="text-left hover:bg-white/5 px-2 py-1 rounded transition-colors"
            >
              <div className={cn(ds.typography.size.xs, ds.colors.text.quaternary, "mb-0.5")}>
                Current Stock
              </div>
              <div className="text-lg font-light text-white">{formatQuantity(quantity)}g</div>
            </button>
          )}
        </div>

        {/* Quick Adjust Buttons - HORIZONTAL */}
        <div className="flex items-center gap-2 flex-1">
          {/* Remove buttons */}
          <button
            onClick={() => handleQuickAdd(-7)}
            disabled={isAdjusting || quantity < 7}
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
            disabled={isAdjusting || quantity < 14}
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
            disabled={isAdjusting || quantity < 28}
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

          <button
            onClick={() => handleQuickAdd(112)}
            disabled={isAdjusting}
            className={cn(
              "px-2 py-1 rounded border text-[10px]",
              ds.colors.bg.hover,
              ds.colors.border.default,
              "text-white hover:bg-white/10 hover:border-white/20",
              "disabled:opacity-20 disabled:cursor-not-allowed"
            )}
          >
            +¼lb
          </button>

          <div className="flex-1"></div>

          {/* Clear button */}
          <button
            onClick={handleClearStock}
            disabled={isAdjusting || quantity === 0}
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
      </div>

      {/* Loading Overlay */}
      {isAdjusting && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
}
