import Link from "next/link";
import { Plus } from "lucide-react";
import { Button, ds, cn } from "@/components/ds";

interface ProductsHeaderProps {
  totalProducts: number;
  isLoading: boolean;
}

export function ProductsHeader({
  totalProducts,
  isLoading,
}: ProductsHeaderProps) {
  return (
    <header className="flex items-center justify-between mb-6" role="banner">
      <div>
        <h1
          className={cn(
            ds.typography.size.xs,
            ds.typography.weight.light,
            ds.typography.transform.uppercase,
            ds.typography.tracking.wide,
            "text-white mb-1",
          )}
        >
          Products
        </h1>
        <p
          className={cn(
            ds.colors.text.quaternary,
            ds.typography.size.xs,
            ds.typography.transform.uppercase,
            ds.typography.tracking.wide,
          )}
          aria-live="polite"
          aria-atomic="true"
        >
          {isLoading
            ? "Loading..."
            : `${totalProducts} ${totalProducts === 1 ? "product" : "products"}`}
        </p>
      </div>

      <Link
        href="/vendor/products/new"
        aria-label="Add a new product to your catalog"
      >
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
          Add Product
        </Button>
      </Link>
    </header>
  );
}
