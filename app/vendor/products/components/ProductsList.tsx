import { ProductCard } from './ProductCard';
import { ProductsListSkeleton } from '@/components/skeletons/ProductsListSkeleton';
import { AlertCircle } from 'lucide-react';
import { ds, cn } from '@/components/ds';
import { Product } from '@/lib/types/product';

interface ProductsListProps {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
  onViewProduct: (productId: string) => void;
  onRetry?: () => void;
}

export function ProductsList({ products, isLoading, error, onViewProduct, onRetry }: ProductsListProps) {
  if (isLoading) {
    return (
      <div role="status" aria-live="polite" aria-label="Loading products">
        <ProductsListSkeleton count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn("border rounded-lg p-6 text-center", "bg-white/5 border-white/20")}
        role="alert"
        aria-live="assertive"
      >
        <AlertCircle className={cn("w-12 h-12 mx-auto mb-3 text-white/60")} strokeWidth={1} aria-hidden="true" />
        <h3 className={cn(ds.typography.size.base, ds.typography.weight.medium, "text-white/90 mb-2")}>Failed to Load Products</h3>
        <p className={cn(ds.typography.size.xs, "text-white/60 mb-4")}>{error.message}</p>
        <button
          onClick={onRetry || (() => window.location.reload())}
          className={cn(
            "px-4 py-2 rounded-lg transition-colors",
            "bg-white/10 hover:bg-white/20",
            "text-white/80",
            ds.typography.size.xs,
            ds.typography.transform.uppercase,
            ds.typography.tracking.wide,
            "focus:outline-none focus:ring-2 focus:ring-white/30"
          )}
          aria-label="Retry loading products"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div
        className={cn("border-2 border-dashed rounded-lg p-12 text-center", ds.colors.bg.elevated, ds.colors.border.default)}
        role="status"
        aria-live="polite"
      >
        <div className="max-w-md mx-auto">
          <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4", ds.colors.bg.hover)}>
            <svg
              className={cn("w-8 h-8", ds.colors.text.quaternary)}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h3 className={cn(ds.typography.size.sm, ds.typography.weight.medium, "text-white/90 mb-2")}>No Products Found</h3>
          <p className={cn(ds.typography.size.xs, ds.colors.text.tertiary)}>
            No products match your current filters. Try adjusting your search or filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="products-list" className="space-y-4" role="list" aria-label={`${products.length} products`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onView={onViewProduct} />
      ))}
    </div>
  );
}
