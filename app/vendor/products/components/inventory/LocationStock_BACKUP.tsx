import { useState } from "react";
import { ds, cn, Button } from "@/components/ds";

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
}

export function LocationStock({
  productId,
  locationId,
  inventoryId,
  locationName,
  quantity,
  onAdjust,
  isAdjusting,
}: LocationStockProps) {
  const [customAmount, setCustomAmount] = useState("");

  const handleQuickAdd = async (amount: number) => {
    await onAdjust(productId, locationId, inventoryId, amount);
  };

  const handleCustomAdjust = async () => {
    const amount = parseFloat(customAmount);
    if (!isNaN(amount) && amount !== 0) {
      await onAdjust(productId, locationId, inventoryId, amount);
      setCustomAmount("");
    }
  };

  const handleClearStock = async () => {
    if (confirm(`Set ${locationName} stock to 0g?`)) {
      await onAdjust(productId, locationId, inventoryId, -quantity);
    }
  };

  return (
    <div className={cn("rounded-2xl border p-4", ds.colors.bg.secondary, ds.colors.border.default)}>
      {/* Location Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className={cn(ds.typography.size.sm, "text-white font-light mb-1")}>
            {locationName}
          </div>
          <div
            className={cn(
              ds.typography.size.xs,
              ds.colors.text.quaternary,
              ds.typography.transform.uppercase,
              ds.typography.tracking.wide,
            )}
          >
            Current Stock
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-light text-white">{quantity.toFixed(2)}</div>
          <div className={cn(ds.typography.size.xs, ds.colors.text.quaternary)}>grams</div>
        </div>
      </div>

      {/* Quick Adjustments */}
      <div className="space-y-3">
        {/* Preset Dropdown */}
        <div>
          <label
            className={cn(
              ds.typography.size.xs,
              ds.typography.transform.uppercase,
              ds.typography.tracking.wide,
              ds.colors.text.quaternary,
              "block mb-2",
            )}
          >
            Quick Adjust
          </label>
          <select
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (value !== 0) {
                handleQuickAdd(value);
                e.target.value = "0";
              }
            }}
            disabled={isAdjusting}
            className={cn(
              "w-full rounded-xl border px-3 py-2 transition-colors",
              ds.colors.bg.secondary,
              ds.colors.border.default,
              ds.colors.text.primary,
              ds.typography.size.xs,
              "hover:border-white/20 focus:border-white/20 focus:outline-none",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            <option value="0">Select amount...</option>
            <optgroup label="Add Stock">
              <option value="3.5">+ ⅛oz (3.5g)</option>
              <option value="7">+ ¼oz (7g)</option>
              <option value="14">+ ½oz (14g)</option>
              <option value="28">+ 1oz (28g)</option>
              <option value="112">+ ¼lb (112g)</option>
              <option value="224">+ ½lb (224g)</option>
              <option value="453.6">+ 1lb (453.6g)</option>
            </optgroup>
            <optgroup label="Remove Stock">
              <option value="-3.5">- ⅛oz (3.5g)</option>
              <option value="-7">- ¼oz (7g)</option>
              <option value="-14">- ½oz (14g)</option>
              <option value="-28">- 1oz (28g)</option>
              <option value="-112">- ¼lb (112g)</option>
              <option value="-224">- ½lb (224g)</option>
              <option value="-453.6">- 1lb (453.6g)</option>
            </optgroup>
          </select>
        </div>

        {/* Custom Amount */}
        <div>
          <label
            className={cn(
              ds.typography.size.xs,
              ds.typography.transform.uppercase,
              ds.typography.tracking.wide,
              ds.colors.text.quaternary,
              "block mb-2",
            )}
          >
            Custom Amount
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              placeholder="Enter grams"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCustomAdjust();
                }
              }}
              disabled={isAdjusting}
              className={cn(
                "flex-1 rounded-xl border px-3 py-2 transition-colors",
                ds.colors.bg.secondary,
                ds.colors.border.default,
                ds.colors.text.primary,
                ds.typography.size.xs,
                "placeholder:text-white/20",
                "hover:border-white/20 focus:border-white/20 focus:outline-none",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
            />
            <button
              onClick={handleCustomAdjust}
              disabled={isAdjusting || !customAmount}
              className={cn(
                "px-4 py-2 rounded-xl border transition-all",
                ds.colors.bg.hover,
                ds.colors.border.default,
                ds.typography.size.xs,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
                "text-white hover:bg-white/10 hover:border-white/20",
                "disabled:opacity-20 disabled:cursor-not-allowed min-w-[70px]",
              )}
            >
              {isAdjusting ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
              ) : (
                "Apply"
              )}
            </button>
          </div>
        </div>

        {/* Fine Control */}
        <div>
          <label
            className={cn(
              ds.typography.size.xs,
              ds.typography.transform.uppercase,
              ds.typography.tracking.wide,
              ds.colors.text.quaternary,
              "block mb-2",
            )}
          >
            Fine Control
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuickAdd(-1)}
              disabled={isAdjusting || quantity < 1}
              className={cn(
                "px-3 py-2 rounded-xl border transition-all",
                ds.colors.bg.secondary,
                ds.colors.border.default,
                ds.typography.size.xs,
                "text-white/70 hover:bg-white/5 hover:text-white hover:border-white/20",
                "disabled:opacity-20 disabled:cursor-not-allowed",
              )}
            >
              -1g
            </button>
            <button
              onClick={() => handleQuickAdd(1)}
              disabled={isAdjusting}
              className={cn(
                "px-3 py-2 rounded-xl border transition-all",
                ds.colors.bg.hover,
                ds.colors.border.default,
                ds.typography.size.xs,
                "text-white hover:bg-white/10 hover:border-white/20",
                "disabled:opacity-20 disabled:cursor-not-allowed",
              )}
            >
              +1g
            </button>
            <div className="flex-1 h-px bg-white/5"></div>
            <button
              onClick={handleClearStock}
              disabled={isAdjusting || quantity === 0}
              className={cn(
                "px-3 py-2 rounded-xl border transition-all",
                ds.colors.bg.secondary,
                ds.colors.border.default,
                ds.typography.size.xs,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
                "text-white/50 hover:bg-white/5 hover:text-white/70 hover:border-white/20",
                "disabled:opacity-20 disabled:cursor-not-allowed",
              )}
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
