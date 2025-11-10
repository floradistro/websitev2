import { Search } from "lucide-react";
import { ds, cn, Input } from "@/components/ds";

interface Location {
  id: string;
  name: string;
  is_primary: boolean;
}

interface InventoryFiltersProps {
  search: string;
  stockFilter: "all" | "in_stock" | "low_stock" | "out_of_stock";
  categoryFilter: string;
  locationFilter: string;
  categories: string[];
  locations: Location[];
  onSearchChange: (value: string) => void;
  onStockFilterChange: (value: "all" | "in_stock" | "low_stock" | "out_of_stock") => void;
  onCategoryFilterChange: (value: string) => void;
  onLocationFilterChange: (value: string) => void;
}

export function InventoryFilters({
  search,
  stockFilter,
  categoryFilter,
  locationFilter,
  categories,
  locations,
  onSearchChange,
  onStockFilterChange,
  onCategoryFilterChange,
  onLocationFilterChange,
}: InventoryFiltersProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 mb-6",
        ds.colors.bg.secondary,
        ds.colors.border.default,
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search
            size={14}
            className={cn("absolute left-3 top-1/2 -translate-y-1/2", ds.colors.text.quaternary)}
          />
          <Input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stock Level Filter */}
        <select
          value={stockFilter}
          onChange={(e) => onStockFilterChange(e.target.value as any)}
          className={cn(
            "rounded-xl border px-3 py-2 transition-colors w-full",
            ds.colors.bg.secondary,
            ds.colors.border.default,
            ds.colors.text.primary,
            ds.typography.size.xs,
            "hover:border-white/20 focus:border-white/20 focus:outline-none",
          )}
        >
          <option value="all">All Stock Levels</option>
          <option value="in_stock">In Stock (&gt; 10g)</option>
          <option value="low_stock">Low Stock (1-10g)</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
          className={cn(
            "rounded-xl border px-3 py-2 transition-colors w-full",
            ds.colors.bg.secondary,
            ds.colors.border.default,
            ds.colors.text.primary,
            ds.typography.size.xs,
            "hover:border-white/20 focus:border-white/20 focus:outline-none",
          )}
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Location Filter */}
        <select
          value={locationFilter}
          onChange={(e) => onLocationFilterChange(e.target.value)}
          className={cn(
            "rounded-xl border px-3 py-2 transition-colors w-full",
            ds.colors.bg.secondary,
            ds.colors.border.default,
            ds.colors.text.primary,
            ds.typography.size.xs,
            "hover:border-white/20 focus:border-white/20 focus:outline-none",
          )}
        >
          <option value="all">All Locations</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name} {loc.is_primary ? "(Primary)" : ""}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
