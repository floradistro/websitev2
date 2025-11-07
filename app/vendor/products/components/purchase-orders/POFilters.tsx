import { Search, MapPin } from 'lucide-react';
import { ds, cn, Input } from '@/components/ds';

interface Location {
  id: string;
  name: string;
}

interface POFiltersProps {
  search: string;
  statusFilter: string;
  locationFilter: string;
  locations: Location[];
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onLocationFilterChange: (value: string) => void;
}

export function POFilters({
  search,
  statusFilter,
  locationFilter,
  locations,
  onSearchChange,
  onStatusFilterChange,
  onLocationFilterChange
}: POFiltersProps) {
  return (
    <div className={cn("rounded-2xl border p-4 mb-6", ds.colors.bg.secondary, ds.colors.border.default)}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search size={14} className={cn("absolute left-3 top-1/2 -translate-y-1/2", ds.colors.text.quaternary)} />
          <Input
            type="text"
            placeholder="Search PO number, customer..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

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
            "hover:border-white/20 focus:border-white/20 focus:outline-none"
          )}
        >
          <option value="all">All Locations</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className={cn(
            "rounded-xl border px-3 py-2 transition-colors w-full",
            ds.colors.bg.secondary,
            ds.colors.border.default,
            ds.colors.text.primary,
            ds.typography.size.xs,
            "hover:border-white/20 focus:border-white/20 focus:outline-none"
          )}
        >
          <option value="all">All Status</option>
          <option value="ordered">Ordered</option>
          <option value="confirmed">Confirmed (Supplier)</option>
          <option value="shipped">Shipped</option>
          <option value="receiving">Receiving</option>
          <option value="received">Received</option>
        </select>
      </div>
    </div>
  );
}
