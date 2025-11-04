/**
 * Minimal loading state for products list
 * Clean, simple, matches monochrome dark theme
 */
export function ProductsListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex items-center justify-center py-32" role="status" aria-label="Loading products">
      <div className="text-center space-y-4">
        {/* Spinner */}
        <div className="w-8 h-8 mx-auto border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />

        {/* Loading text */}
        <p className="text-white/40 text-xs uppercase tracking-[0.15em] font-light">
          Loading products...
        </p>
      </div>
    </div>
  );
}

/**
 * @deprecated Use ProductsListSkeleton instead
 */
export function ProductCardSkeleton() {
  return <ProductsListSkeleton count={1} />;
}

/**
 * Minimal loading state for stats cards
 */
export function ProductStatsSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6"
          role="status"
          aria-label="Loading stats"
        >
          <div className="space-y-3">
            <div className="h-3 bg-white/5 rounded w-16 animate-pulse" />
            <div className="h-8 bg-white/5 rounded w-12 animate-pulse" style={{ animationDelay: '150ms' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Minimal loading state for filters bar
 */
export function FiltersSkeleton() {
  return (
    <div className="flex items-center gap-4 mb-4" role="status" aria-label="Loading filters">
      {/* Search */}
      <div className="flex-1 h-10 bg-white/5 rounded-lg animate-pulse" />

      {/* Filter dropdowns */}
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="w-40 h-10 bg-white/5 rounded-lg animate-pulse"
          style={{ animationDelay: `${index * 100}ms` }}
        />
      ))}
    </div>
  );
}

/**
 * Minimal full page loading state
 * Shows centered spinner instead of fake content
 */
export function ProductsPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center space-y-4">
        {/* Spinner */}
        <div className="w-12 h-12 mx-auto border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />

        {/* Loading text */}
        <div className="space-y-1">
          <p className="text-white/60 text-sm font-light">
            Loading Products
          </p>
          <p className="text-white/30 text-xs uppercase tracking-[0.15em] font-light">
            Please wait...
          </p>
        </div>
      </div>
    </div>
  );
}
