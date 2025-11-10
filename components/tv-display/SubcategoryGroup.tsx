/**
 * SubcategoryGroup Component
 * Displays a group of products under a subcategory header
 */

import { MinimalProductCard } from "./MinimalProductCard";
import { ListProductCard } from "./ListProductCard";
import { CompactListProductCard } from "./CompactListProductCard";

interface SubcategoryGroupProps {
  subcategoryName: string;
  products: any[];
  theme: any;
  displayMode: "grid" | "list";
  gridColumns: number;
  gridRows: number;
  visiblePriceBreaks: string[];
  customFieldsToShow: string[];
  customFieldsConfig: any;
  hideAllFieldLabels: boolean;
  displayConfig?: any;
  startIndex?: number;
  useCompactCards?: boolean;
  splitSide?: "left" | "right";
}

export function SubcategoryGroup({
  subcategoryName,
  products,
  theme,
  displayMode,
  gridColumns,
  gridRows,
  visiblePriceBreaks,
  customFieldsToShow,
  customFieldsConfig,
  hideAllFieldLabels,
  displayConfig,
  startIndex = 0,
  useCompactCards = false,
  splitSide,
}: SubcategoryGroupProps) {
  // Get pricing from first product (all products in subcategory share same pricing tier)
  const firstProduct = products[0];
  const pricingTiers = firstProduct?.pricing_tiers || {};
  const pricingBlueprint = firstProduct?.pricing_blueprint;
  const priceBreaks = (pricingBlueprint?.price_breaks || []) as Array<{
    break_id: string;
    label: string;
    qty: number;
    unit: string;
    sort_order: number;
  }>;

  // Create a map of break_id to price break info (for labels)
  const priceBreakMap = new Map(priceBreaks.map((pb) => [pb.break_id, pb]));

  // Filter to only show enabled pricing breaks that are in visiblePriceBreaks
  const enabledPrices = Object.entries(pricingTiers)
    .filter(([breakId, breakData]: [string, any]) => {
      const isEnabled = breakData?.enabled !== false;
      const isVisible = visiblePriceBreaks.length === 0 || visiblePriceBreaks.includes(breakId);
      return isEnabled && isVisible;
    })
    .map(([breakId, breakData]: [string, any]) => {
      const priceBreak = priceBreakMap.get(breakId);
      return {
        breakId,
        label: priceBreak?.label || breakId,
        qty: priceBreak?.qty || 1,
        unit: priceBreak?.unit || "",
        price: breakData.price,
        sortOrder: priceBreak?.sort_order || 999,
      };
    })
    .sort((a, b) => {
      // Sort by sort_order from price breaks
      return a.sortOrder - b.sortOrder;
    });

  return (
    <div className="w-full mb-6">
      {/* Subcategory Header with Pricing */}
      <div
        className="mb-3 pb-3 border-b-2"
        style={{
          borderColor: `${theme.styles.productName.color}30`,
        }}
      >
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h3
            className="font-bold uppercase tracking-wider"
            style={{
              color: theme.styles.productName.color,
              fontSize: "clamp(1.25rem, 2.5vw, 2.5rem)",
              lineHeight: 1.2,
              opacity: 0.95,
            }}
          >
            {subcategoryName}
          </h3>

          {/* Pricing Tiers Display */}
          {enabledPrices.length > 0 && (
            <div className="flex items-baseline gap-3 flex-wrap">
              {enabledPrices.map((priceInfo) => {
                // Format the display label
                const displayLabel =
                  priceInfo.unit === "unit"
                    ? `${priceInfo.label}`
                    : `${priceInfo.label}${priceInfo.unit}`;

                return (
                  <div key={priceInfo.breakId} className="flex items-baseline gap-1.5">
                    <span
                      className="font-medium uppercase tracking-wide"
                      style={{
                        color: theme.styles.productDescription.color,
                        fontSize: "clamp(0.75rem, 1.5vw, 1.25rem)",
                        opacity: 0.7,
                      }}
                    >
                      {displayLabel}
                    </span>
                    <span
                      className="font-black"
                      style={{
                        color: theme.styles.price.color,
                        fontSize: "clamp(1rem, 2vw, 1.75rem)",
                      }}
                    >
                      ${priceInfo.price}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Products Grid/List */}
      {displayMode === "list" ? (
        <div className="flex flex-col gap-2">
          {products.map((product: any, idx: number) => {
            const CardComponent = useCompactCards ? CompactListProductCard : ListProductCard;
            return (
              <CardComponent
                key={product.id}
                product={product}
                theme={theme}
                index={startIndex + idx}
                visiblePriceBreaks={visiblePriceBreaks}
                customFieldsToShow={customFieldsToShow}
                customFieldsConfig={customFieldsConfig}
                hideAllFieldLabels={hideAllFieldLabels}
              />
            );
          })}
        </div>
      ) : (
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
            gridAutoRows: "minmax(0, 1fr)",
          }}
        >
          {products.map((product: any, idx: number) => (
            <MinimalProductCard
              key={product.id}
              product={product}
              theme={theme}
              index={startIndex + idx}
              visiblePriceBreaks={visiblePriceBreaks}
              displayConfig={displayConfig}
              customFieldsToShow={customFieldsToShow}
              customFieldsConfig={customFieldsConfig}
              hideAllFieldLabels={hideAllFieldLabels}
              splitSide={splitSide}
              gridColumns={gridColumns}
            />
          ))}
        </div>
      )}
    </div>
  );
}
