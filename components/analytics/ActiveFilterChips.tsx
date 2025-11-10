'use client';

import { X } from 'lucide-react';
import { FilterState } from './AdvancedFiltersPanel';

type ActiveFilterChipsProps = {
  filters: FilterState;
  locations: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
  employees: Array<{ id: string; name: string }>;
  onRemoveLocation: (id: string) => void;
  onRemoveCategory: (id: string) => void;
  onRemoveEmployee: (id: string) => void;
  onRemovePaymentMethod: (method: string) => void;
  onClearAll: () => void;
};

export function ActiveFilterChips({
  filters,
  locations,
  categories,
  employees,
  onRemoveLocation,
  onRemoveCategory,
  onRemoveEmployee,
  onRemovePaymentMethod,
  onClearAll,
}: ActiveFilterChipsProps) {
  const hasActiveFilters =
    filters.locationIds.length > 0 ||
    filters.categoryIds.length > 0 ||
    filters.employeeIds.length > 0 ||
    filters.paymentMethods.length > 0 ||
    !filters.includeRefunds ||
    !filters.includeDiscounts;

  if (!hasActiveFilters) return null;

  const getLocationName = (id: string) => locations.find(l => l.id === id)?.name || id;
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || id;
  const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || id;

  const paymentMethodLabels: Record<string, string> = {
    card: 'Card',
    cash: 'Cash',
    integrated_payment: 'Integrated Payment',
    online_payment: 'Online Payment',
  };

  return (
    <div className="flex items-center gap-2 flex-wrap animate-in">
      <span className="text-xs text-white/50 uppercase tracking-wider font-medium">Active Filters:</span>

      {/* Location Chips */}
      {filters.locationIds.map(id => (
        <button
          key={`location-${id}`}
          onClick={() => onRemoveLocation(id)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#007AFF]/10 text-[#007AFF] rounded-full text-xs font-medium border border-[#007AFF]/30 hover:bg-[#007AFF]/20 transition-all group"
        >
          <span>{getLocationName(id)}</span>
          <X className="w-3 h-3 opacity-70 group-hover:opacity-100" />
        </button>
      ))}

      {/* Category Chips */}
      {filters.categoryIds.map(id => (
        <button
          key={`category-${id}`}
          onClick={() => onRemoveCategory(id)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#34C759]/10 text-[#34C759] rounded-full text-xs font-medium border border-[#34C759]/30 hover:bg-[#34C759]/20 transition-all group"
        >
          <span>{getCategoryName(id)}</span>
          <X className="w-3 h-3 opacity-70 group-hover:opacity-100" />
        </button>
      ))}

      {/* Employee Chips */}
      {filters.employeeIds.map(id => (
        <button
          key={`employee-${id}`}
          onClick={() => onRemoveEmployee(id)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#FF9500]/10 text-[#FF9500] rounded-full text-xs font-medium border border-[#FF9500]/30 hover:bg-[#FF9500]/20 transition-all group"
        >
          <span>{getEmployeeName(id)}</span>
          <X className="w-3 h-3 opacity-70 group-hover:opacity-100" />
        </button>
      ))}

      {/* Payment Method Chips */}
      {filters.paymentMethods.map(method => (
        <button
          key={`payment-${method}`}
          onClick={() => onRemovePaymentMethod(method)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#AF52DE]/10 text-[#AF52DE] rounded-full text-xs font-medium border border-[#AF52DE]/30 hover:bg-[#AF52DE]/20 transition-all group"
        >
          <span>{paymentMethodLabels[method] || method}</span>
          <X className="w-3 h-3 opacity-70 group-hover:opacity-100" />
        </button>
      ))}

      {/* Options Chips */}
      {!filters.includeRefunds && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 text-white/70 rounded-full text-xs font-medium border border-white/10">
          <span>Excluding Refunds</span>
        </div>
      )}

      {!filters.includeDiscounts && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 text-white/70 rounded-full text-xs font-medium border border-white/10">
          <span>Excluding Discounts</span>
        </div>
      )}

      {/* Clear All Button */}
      {hasActiveFilters && (
        <button
          onClick={onClearAll}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/5 text-white/50 rounded-full text-xs font-medium border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all ml-2"
        >
          Clear All
        </button>
      )}

      <style jsx>{`
        .animate-in {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
