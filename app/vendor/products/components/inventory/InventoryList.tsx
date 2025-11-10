import { Package } from "lucide-react";
import { ds, cn } from "@/components/ds";
import { InventoryItem } from "./InventoryItem";

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
}

export function InventoryList({
  products,
  isLoading,
  onAdjust,
  isAdjusting,
}: InventoryListProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          "rounded-2xl border p-12 text-center",
          ds.colors.bg.secondary,
          ds.colors.border.default,
        )}
      >
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
        <p
          className={cn(
            ds.typography.size.xs,
            ds.typography.transform.uppercase,
            ds.typography.tracking.wide,
            ds.colors.text.quaternary,
          )}
        >
          Loading inventory...
        </p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl border p-16 text-center",
          ds.colors.bg.secondary,
          ds.colors.border.default,
        )}
      >
        <Package
          size={48}
          className="text-white/10 mx-auto mb-4"
          strokeWidth={1}
        />
        <p className={cn(ds.typography.size.sm, "text-white/60 mb-2")}>
          No inventory found
        </p>
        <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary)}>
          Try adjusting your filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((product) => (
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
        />
      ))}
    </div>
  );
}
