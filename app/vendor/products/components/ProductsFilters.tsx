import { Search, Filter } from 'lucide-react';
import { Input, ds, cn } from '@/components/ds';
import { useProductFilters } from '@/lib/contexts/ProductFiltersContext';
import { useDebouncedSearch } from '@/lib/hooks/useDebounce';
import { useEffect } from 'react';

interface ProductsFiltersProps {
  categories: string[];
}

export function ProductsFilters({ categories }: ProductsFiltersProps) {
  const { filters, setSearch, setStatus, setCategory } = useProductFilters();
  const { searchValue, debouncedValue, setSearchValue, isDebouncing } = useDebouncedSearch('', 500);

  // Update context when debounced value changes
  useEffect(() => {
    setSearch(debouncedValue);
  }, [debouncedValue, setSearch]);

  return (
    <div className="mb-6 space-y-4" role="search" aria-label="Product filters and search">
      {/* Search Bar */}
      <div className="relative">
        <Search className={cn("absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5", ds.colors.text.quaternary)} strokeWidth={1} aria-hidden="true" />
        <Input
          type="text"
          placeholder="Search products by name, SKU, or description..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-10 pr-4"
          aria-label="Search products"
          aria-describedby="search-help"
        />
        <span id="search-help" className="sr-only">
          Search is debounced with a 500ms delay to reduce server load
        </span>
        {isDebouncing && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2" role="status" aria-label="Searching...">
            <div className="w-4 h-4 border-2 border-white/20 border-t-blue-400/70 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4" role="group" aria-label="Product filters">
        <div className={cn("flex items-center gap-2", ds.typography.size.xs, ds.colors.text.quaternary, "hidden sm:flex")} aria-hidden="true">
          <Filter className="w-4 h-4" strokeWidth={1} />
          <span>Filters:</span>
        </div>

        {/* Status Filter */}
        <label htmlFor="status-filter" className="sr-only">Filter by status</label>
        <select
          id="status-filter"
          value={filters.status}
          onChange={(e) => setStatus(e.target.value as any)}
          className={cn(
            "px-3 py-2 rounded-lg",
            ds.typography.size.xs,
            ds.colors.bg.primary,
            ds.colors.border.default,
            "border",
            "text-white/90",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          )}
          aria-label="Filter products by status"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
          <option value="draft">Draft</option>
        </select>

        {/* Category Filter */}
        <label htmlFor="category-filter" className="sr-only">Filter by category</label>
        <select
          id="category-filter"
          value={filters.category}
          onChange={(e) => setCategory(e.target.value)}
          className={cn(
            "px-3 py-2 rounded-lg",
            ds.typography.size.xs,
            ds.colors.bg.primary,
            ds.colors.border.default,
            "border",
            "text-white/90",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          )}
          aria-label="Filter products by category"
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        {/* Active Filters Count */}
        {(filters.status !== 'all' || filters.category !== 'all' || filters.search) && (
          <button
            onClick={() => {
              setSearchValue('');
              setStatus('all');
              setCategory('all');
            }}
            className={cn(
              ds.typography.size.xs,
              ds.typography.transform.uppercase,
              ds.typography.tracking.wide,
              ds.typography.weight.light,
              "text-white/50 hover:text-white/80",
              "focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]",
              "rounded px-2 py-1"
            )}
            aria-label="Clear all active filters"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
