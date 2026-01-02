import { ds, cn } from "@/components/ds";
import { InventoryItem } from "./InventoryItem";
import { FocusedInventoryItem } from "./FocusedInventoryItem";

interface LocationInventory {
  inventory_id: string;
  location_id: string;
  location_name: string;
  quantity: number;
}

interface ProductInventory {
  product_id: string;
  product_name: string;
  sku: string;
  category: string;
  price: number;
  cost_price?: number;
  total_quantity: number;
  locations: LocationInventory[];
}

interface InventoryListProps {
  products: ProductInventory[];
  isLoading: boolean;
  onAdjust: (
    productId: string,
    locationId: string,
    inventoryId: string,
    amount: number,
  ) => Promise<void>;
  isAdjusting: Record<string, boolean>;
  selectedItems: Set<string>;
  onToggleSelect: (productId: string, locationId: string) => void;
  isSingleLocationMode?: boolean;
}

export function InventoryList({
  products,
  isLoading,
  onAdjust,
  isAdjusting,
  selectedItems,
  onToggleSelect,
  isSingleLocationMode = false,
}: InventoryListProps) {
  if (isLoading && products.length === 0) {
    return (
      <div className={cn("rounded-2xl border p-8 text-center", ds.colors.bg.secondary, ds.colors.border.default)}>
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
        <p className={cn(ds.typography.size.sm, ds.colors.text.tertiary)}>Loading inventory...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={cn("rounded-2xl border p-8 text-center", ds.colors.bg.secondary, ds.colors.border.default)}>
        <p className={cn(ds.typography.size.sm, ds.colors.text.tertiary)}>
          No products found
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mb-6">
      {products.map((product) => {
        // Use focused view when filtering by single location
        if (isSingleLocationMode && product.locations.length === 1) {
          const location = product.locations[0];
          return (
            <FocusedInventoryItem
              key={`${product.product_id}-${location.location_id}`}
              productId={product.product_id}
              productName={product.product_name}
              sku={product.sku}
              category={product.category}
              price={product.price}
              costPrice={product.cost_price}
              location={location}
              onAdjust={onAdjust}
              isAdjusting={isAdjusting[`${product.product_id}-${location.location_id}`] || false}
              isSelected={selectedItems.has(`${product.product_id}-${location.location_id}`)}
              onToggleSelect={() => onToggleSelect(product.product_id, location.location_id)}
            />
          );
        }

        // Use normal expandable view for multi-location
        return (
          <InventoryItem
            key={product.product_id}
            productId={product.product_id}
            productName={product.product_name}
            sku={product.sku}
            category={product.category}
            price={product.price}
            costPrice={product.cost_price}
            totalQuantity={product.total_quantity}
            locations={product.locations}
            onAdjust={onAdjust}
            isAdjusting={isAdjusting}
            selectedItems={selectedItems}
            onToggleSelect={onToggleSelect}
            isSingleLocationMode={isSingleLocationMode}
          />
        );
      })}
    </div>
  );
}
