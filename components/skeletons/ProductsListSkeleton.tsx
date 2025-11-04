/**
 * Loading skeleton for products list
 * Provides visual feedback while data is fetching
 */
export function ProductsListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * Skeleton for a single product card
 */
export function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
      <div className="flex items-start gap-4">
        {/* Image skeleton */}
        <div className="w-28 h-28 bg-gray-200 rounded-lg flex-shrink-0" />

        {/* Content skeleton */}
        <div className="flex-1 space-y-3">
          {/* Title */}
          <div className="h-5 bg-gray-200 rounded w-2/3" />

          {/* SKU & Category */}
          <div className="flex gap-4">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="h-4 bg-gray-200 rounded w-20" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
          </div>

          {/* Price & Stock */}
          <div className="flex items-center gap-4 mt-4">
            <div className="h-6 bg-gray-200 rounded w-20" />
            <div className="h-6 bg-gray-200 rounded w-24" />
          </div>
        </div>

        {/* Actions skeleton */}
        <div className="flex flex-col gap-2">
          <div className="w-8 h-8 bg-gray-200 rounded" />
          <div className="w-8 h-8 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for stats cards
 */
export function ProductStatsSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-16 mb-2" />
          <div className="h-8 bg-gray-200 rounded w-12" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for filters bar
 */
export function FiltersSkeleton() {
  return (
    <div className="flex items-center gap-4 mb-4 animate-pulse">
      {/* Search */}
      <div className="flex-1 h-10 bg-gray-200 rounded" />

      {/* Filter dropdowns */}
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="w-40 h-10 bg-gray-200 rounded" />
      ))}
    </div>
  );
}

/**
 * Full page skeleton (combines all elements)
 */
export function ProductsPageSkeleton() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-64" />
      </div>

      {/* Stats */}
      <ProductStatsSkeleton />

      {/* Filters */}
      <FiltersSkeleton />

      {/* Products List */}
      <ProductsListSkeleton count={8} />

      {/* Pagination */}
      <div className="mt-6 flex justify-center animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-64" />
      </div>
    </div>
  );
}
