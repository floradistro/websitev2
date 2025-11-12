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
    <div className="mb-6">
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={14}
            className={cn("absolute left-3 top-1/2 -translate-y-1/2", ds.colors.text.quaternary)}
          />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              "w-full pl-10 pr-3 py-2 rounded-lg border transition-colors",
              ds.colors.bg.secondary,
              ds.colors.border.default,
              ds.colors.text.primary,
              ds.typography.size.xs,
              "placeholder:text-white/30",
              "hover:border-white/20 focus:border-white/20 focus:outline-none",
            )}
          />
        </div>

        {/* Stock Level Filter */}
        <select
          value={stockFilter}
          onChange={(e) => onStockFilterChange(e.target.value as any)}
          className={cn(
            "px-3 py-2 rounded-lg border transition-colors appearance-none bg-no-repeat bg-right pr-8",
            "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMUw2IDZMMTEgMSIgc3Ryb2tlPSIjOTk5IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')]",
            ds.colors.bg.secondary,
            ds.colors.border.default,
            ds.colors.text.primary,
            ds.typography.size.xs,
            "hover:border-white/20 focus:border-white/20 focus:outline-none cursor-pointer",
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
            "px-3 py-2 rounded-lg border transition-colors appearance-none bg-no-repeat bg-right pr-8",
            "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMUw2IDZMMTEgMSIgc3Ryb2tlPSIjOTk5IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')]",
            ds.colors.bg.secondary,
            ds.colors.border.default,
            ds.colors.text.primary,
            ds.typography.size.xs,
            "hover:border-white/20 focus:border-white/20 focus:outline-none cursor-pointer",
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
            "px-3 py-2 rounded-lg border transition-colors appearance-none bg-no-repeat bg-right pr-8",
            "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMUw2IDZMMTEgMSIgc3Ryb2tlPSIjOTk5IiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')]",
            ds.colors.bg.secondary,
            ds.colors.border.default,
            ds.colors.text.primary,
            ds.typography.size.xs,
            "hover:border-white/20 focus:border-white/20 focus:outline-none cursor-pointer",
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
