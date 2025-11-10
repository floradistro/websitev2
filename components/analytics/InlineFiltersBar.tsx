"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  PieChart,
  Users,
  CreditCard,
  RefreshCw,
} from "@/lib/icons";

// =====================================================
// Types
// =====================================================

export interface FilterState {
  dateRange: { start: Date; end: Date };
  locationIds: string[];
  categoryIds: string[];
  employeeIds: string[];
  paymentMethods: string[];
  productIds: string[];
  includeRefunds: boolean;
  includeDiscounts: boolean;
}

interface InlineFiltersBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  locations: any[];
  categories: any[];
  employees: any[];
  onApply?: () => void;
}

// =====================================================
// Sub-Components
// =====================================================

/**
 * iOS Toggle Switch
 */
function IOSToggle({
  label,
  isOn,
  onToggle,
}: {
  label: string;
  isOn: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center justify-between px-4 py-2.5 rounded-[10px] bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-200 group"
    >
      <span className="text-[13px] text-white/80 group-hover:text-white transition-colors">
        {label}
      </span>
      <div
        className={`relative w-[51px] h-[31px] rounded-full transition-all duration-300 ${
          isOn ? "bg-[#34C759]" : "bg-white/20"
        }`}
      >
        <div
          className={`absolute top-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-lg transition-all duration-300 ${
            isOn ? "left-[22px]" : "left-[2px]"
          }`}
        />
      </div>
    </button>
  );
}

/**
 * Custom Checkbox with iOS styling
 */
function FilterCheckbox({
  label,
  isSelected,
  onClick,
  color = "blue",
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  color?: "blue" | "green" | "orange" | "purple";
}) {
  const colorClasses = {
    blue: "bg-[#007AFF] border-[#007AFF]",
    green: "bg-[#34C759] border-[#34C759]",
    orange: "bg-[#FF9500] border-[#FF9500]",
    purple: "bg-[#AF52DE] border-[#AF52DE]",
  };

  const hoverColorClasses = {
    blue: "group-hover:border-[#007AFF]/40",
    green: "group-hover:border-[#34C759]/40",
    orange: "group-hover:border-[#FF9500]/40",
    purple: "group-hover:border-[#AF52DE]/40",
  };

  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 px-4 py-2.5 rounded-[10px] transition-all duration-200 ${
        isSelected
          ? "bg-white/[0.08] hover:bg-white/[0.10]"
          : "bg-white/[0.03] hover:bg-white/[0.06]"
      }`}
    >
      <div className="relative flex items-center justify-center">
        <div
          className={`w-5 h-5 rounded-[6px] border-2 transition-all duration-200 ${
            isSelected
              ? `${colorClasses[color]} shadow-lg`
              : `border-white/20 ${hoverColorClasses[color]}`
          }`}
        >
          {isSelected && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-3 h-3 text-white"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M10 3L4.5 8.5L2 6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>
      </div>
      <span
        className={`text-[13px] transition-colors duration-200 ${
          isSelected
            ? "text-white font-medium"
            : "text-white/70 group-hover:text-white/90"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

/**
 * Radio Button for All Locations
 */
function FilterRadio({
  label,
  isSelected,
  onClick,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 px-4 py-2.5 rounded-[10px] transition-all duration-200 ${
        isSelected
          ? "bg-white/[0.08] hover:bg-white/[0.10]"
          : "bg-white/[0.03] hover:bg-white/[0.06]"
      }`}
    >
      <div className="relative flex items-center justify-center">
        <div
          className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
            isSelected
              ? "bg-[#007AFF] border-[#007AFF] shadow-lg"
              : "border-white/20 group-hover:border-[#007AFF]/40"
          }`}
        >
          {isSelected && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          )}
        </div>
      </div>
      <span
        className={`text-[13px] transition-colors duration-200 ${
          isSelected
            ? "text-white font-medium"
            : "text-white/70 group-hover:text-white/90"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

/**
 * Filter Section Header
 */
function FilterSectionHeader({
  icon: Icon,
  label,
  count,
}: {
  icon: any;
  label: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="w-8 h-8 rounded-[8px] bg-[#007AFF]/12 flex items-center justify-center">
        <Icon className="w-4 h-4 text-[#007AFF]" strokeWidth={2} />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-semibold text-white/90 tracking-tight">
          {label}
        </span>
        {count !== undefined && count > 0 && (
          <div className="px-2 py-0.5 bg-[#007AFF]/15 rounded-full">
            <span className="text-[11px] font-semibold text-[#007AFF]">
              {count}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// Main Component
// =====================================================

export function InlineFiltersBar({
  filters,
  onChange,
  locations,
  categories,
  employees,
  onApply,
}: InlineFiltersBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Payment methods
  const paymentMethods = [
    { id: "cash", label: "Cash" },
    { id: "card", label: "Card" },
    { id: "debit", label: "Debit" },
  ];

  // Handlers
  const toggleLocation = (locationId: string) => {
    const newLocationIds = filters.locationIds.includes(locationId)
      ? filters.locationIds.filter((id) => id !== locationId)
      : [...filters.locationIds, locationId];

    onChange({ ...filters, locationIds: newLocationIds });
  };

  const selectAllLocations = () => {
    onChange({ ...filters, locationIds: [] });
  };

  const toggleCategory = (categoryId: string) => {
    const newCategoryIds = filters.categoryIds.includes(categoryId)
      ? filters.categoryIds.filter((id) => id !== categoryId)
      : [...filters.categoryIds, categoryId];

    onChange({ ...filters, categoryIds: newCategoryIds });
  };

  const toggleEmployee = (employeeId: string) => {
    const newEmployeeIds = filters.employeeIds.includes(employeeId)
      ? filters.employeeIds.filter((id) => id !== employeeId)
      : [...filters.employeeIds, employeeId];

    onChange({ ...filters, employeeIds: newEmployeeIds });
  };

  const togglePaymentMethod = (method: string) => {
    const newMethods = filters.paymentMethods.includes(method)
      ? filters.paymentMethods.filter((m) => m !== method)
      : [...filters.paymentMethods, method];

    onChange({ ...filters, paymentMethods: newMethods });
  };

  const handleReset = () => {
    onChange({
      ...filters,
      locationIds: [],
      categoryIds: [],
      employeeIds: [],
      paymentMethods: [],
      includeRefunds: true,
      includeDiscounts: true,
    });
  };

  const getActiveFilterCount = () => {
    return (
      filters.locationIds.length +
      filters.categoryIds.length +
      filters.employeeIds.length +
      filters.paymentMethods.length +
      (filters.includeRefunds ? 0 : 1) +
      (filters.includeDiscounts ? 0 : 1)
    );
  };

  return (
    <div className="relative w-full">
      {/* Toggle Button Row */}
      <div className="flex items-center justify-between px-6 py-4 bg-white/[0.03] hover:bg-white/[0.05] border-b border-white/5 transition-all duration-200">
        {/* Left: Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-[8px] bg-[#007AFF]/12 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
            <svg
              className="w-4 h-4 text-[#007AFF]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-medium text-white tracking-tight">
                Advanced Filters
              </span>
              {getActiveFilterCount() > 0 && (
                <div className="px-2.5 py-1 bg-[#007AFF]/15 rounded-full">
                  <span className="text-[11px] font-semibold text-[#007AFF]">
                    {getActiveFilterCount()} Active
                  </span>
                </div>
              )}
            </div>
            <span className="text-[11px] text-white/40 mt-0.5 block">
              {isExpanded
                ? "Click to hide filters"
                : "Click to show filters"}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-white/40 group-hover:text-white/60 transition-colors ml-2" />
          ) : (
            <ChevronDown className="w-5 h-5 text-white/40 group-hover:text-white/60 transition-colors ml-2" />
          )}
        </button>

        {/* Right: Reset Button (separate, not nested) */}
        <div>
          {getActiveFilterCount() > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-white/60 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200"
            >
              <RefreshCw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Dropdown Overlay */}
      {isExpanded && (
        <>
          {/* Transparent Backdrop - click to close */}
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => setIsExpanded(false)}
          />

          {/* Dropdown Panel */}
          <div className="absolute left-0 right-0 top-full z-[101] bg-gradient-to-b from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a] border border-white/10 border-t-0 shadow-2xl animate-in slide-in-from-top-2 duration-300">
            <div className="px-6 py-6 max-h-[500px] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-4 gap-6">
                {/* Column 1: Locations */}
                <div>
                  <FilterSectionHeader
                    icon={MapPin}
                    label="Locations"
                    count={filters.locationIds.length}
                  />
                  <div className="space-y-2">
                    <FilterRadio
                      label="All Locations"
                      isSelected={filters.locationIds.length === 0}
                      onClick={selectAllLocations}
                    />
                    {locations.map((location) => (
                      <FilterCheckbox
                        key={location.id}
                        label={location.name}
                        isSelected={filters.locationIds.includes(location.id)}
                        onClick={() => toggleLocation(location.id)}
                        color="blue"
                      />
                    ))}
                  </div>
                </div>

                {/* Column 2: Categories */}
                <div>
                  <FilterSectionHeader
                    icon={PieChart}
                    label="Categories"
                    count={filters.categoryIds.length}
                  />
                  <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {categories.map((category) => (
                      <FilterCheckbox
                        key={category.id}
                        label={category.name}
                        isSelected={filters.categoryIds.includes(category.id)}
                        onClick={() => toggleCategory(category.id)}
                        color="green"
                      />
                    ))}
                  </div>
                </div>

                {/* Column 3: Payment Methods */}
                <div>
                  <FilterSectionHeader
                    icon={CreditCard}
                    label="Payment Methods"
                    count={filters.paymentMethods.length}
                  />
                  <div className="space-y-2">
                    {paymentMethods.map((method) => (
                      <FilterCheckbox
                        key={method.id}
                        label={method.label}
                        isSelected={filters.paymentMethods.includes(method.id)}
                        onClick={() => togglePaymentMethod(method.id)}
                        color="purple"
                      />
                    ))}
                  </div>
                </div>

                {/* Column 4: Options */}
                <div>
                  <FilterSectionHeader
                    icon={Users}
                    label="Options"
                    count={
                      (!filters.includeRefunds ? 1 : 0) +
                      (!filters.includeDiscounts ? 1 : 0)
                    }
                  />
                  <div className="space-y-2">
                    <IOSToggle
                      label="Include Refunds"
                      isOn={filters.includeRefunds}
                      onToggle={() =>
                        onChange({
                          ...filters,
                          includeRefunds: !filters.includeRefunds,
                        })
                      }
                    />
                    <IOSToggle
                      label="Include Discounts"
                      isOn={filters.includeDiscounts}
                      onToggle={() =>
                        onChange({
                          ...filters,
                          includeDiscounts: !filters.includeDiscounts,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        @keyframes slide-in-from-top {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-in {
          animation: slide-in-from-top 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
      `}</style>
    </div>
  );
}
