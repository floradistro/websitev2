'use client';

import { useState, useEffect } from 'react';
import { X, ChevronDown, Search, MapPin, Users, CreditCard, Tag, Package } from 'lucide-react';

export type FilterState = {
  dateRange: { start: Date; end: Date };
  locationIds: string[];
  categoryIds: string[];
  employeeIds: string[];
  paymentMethods: string[];
  productIds: string[];
  includeRefunds: boolean;
  includeDiscounts: boolean;
};

type AdvancedFiltersPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  locations: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string; parent_id?: string }>;
  employees: Array<{ id: string; name: string }>;
  onApply: () => void;
};

export function AdvancedFiltersPanel({
  isOpen,
  onClose,
  filters,
  onChange,
  locations,
  categories,
  employees,
  onApply,
}: AdvancedFiltersPanelProps) {
  const [localFilters, setLocalFilters] = useState(filters);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    locations: true,
    categories: false,
    employees: false,
    payments: false,
    options: false,
  });

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const paymentMethods = [
    { id: 'card', label: 'Card' },
    { id: 'cash', label: 'Cash' },
    { id: 'integrated_payment', label: 'Integrated Payment' },
    { id: 'online_payment', label: 'Online Payment' },
  ];

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleLocation = (locationId: string) => {
    const newLocationIds = localFilters.locationIds.includes(locationId)
      ? localFilters.locationIds.filter(id => id !== locationId)
      : [...localFilters.locationIds, locationId];
    setLocalFilters({ ...localFilters, locationIds: newLocationIds });
  };

  const toggleCategory = (categoryId: string) => {
    const newCategoryIds = localFilters.categoryIds.includes(categoryId)
      ? localFilters.categoryIds.filter(id => id !== categoryId)
      : [...localFilters.categoryIds, categoryId];
    setLocalFilters({ ...localFilters, categoryIds: newCategoryIds });
  };

  const toggleEmployee = (employeeId: string) => {
    const newEmployeeIds = localFilters.employeeIds.includes(employeeId)
      ? localFilters.employeeIds.filter(id => id !== employeeId)
      : [...localFilters.employeeIds, employeeId];
    setLocalFilters({ ...localFilters, employeeIds: newEmployeeIds });
  };

  const togglePaymentMethod = (method: string) => {
    const newMethods = localFilters.paymentMethods.includes(method)
      ? localFilters.paymentMethods.filter(m => m !== method)
      : [...localFilters.paymentMethods, method];
    setLocalFilters({ ...localFilters, paymentMethods: newMethods });
  };

  const handleApply = () => {
    onChange(localFilters);
    onApply();
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterState = {
      ...localFilters,
      locationIds: [],
      categoryIds: [],
      employeeIds: [],
      paymentMethods: [],
      productIds: [],
      includeRefunds: true,
      includeDiscounts: true,
    };
    setLocalFilters(resetFilters);
    onChange(resetFilters);
  };

  const getActiveFilterCount = () => {
    return (
      localFilters.locationIds.length +
      localFilters.categoryIds.length +
      localFilters.employeeIds.length +
      localFilters.paymentMethods.length +
      (localFilters.includeRefunds ? 0 : 1) +
      (localFilters.includeDiscounts ? 0 : 1)
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Glass Morphism Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[100] panel-fade-in"
        onClick={onClose}
      />

      {/* Slide-in Panel with Glass Effect */}
      <div className="fixed right-0 top-0 h-full w-[440px] z-[101] panel-slide-in">
        {/* Frosted Glass Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1d1d1f]/95 via-[#1d1d1f]/90 to-[#1d1d1f]/95 backdrop-blur-3xl" />

        {/* Subtle Inner Glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

        {/* Content */}
        <div className="relative h-full flex flex-col">
          {/* Header with Frosted Glass */}
          <div className="flex-none">
            <div className="px-8 pt-8 pb-6 border-b border-white/[0.08]">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-[28px] font-semibold text-white tracking-tight leading-none">
                    Filters
                  </h2>
                  {getActiveFilterCount() > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="px-2.5 py-1 bg-[#007AFF]/15 rounded-full">
                        <p className="text-xs font-semibold text-[#007AFF]">
                          {getActiveFilterCount()} Active
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-white/[0.08] text-white/60 hover:bg-white/[0.12] hover:text-white transition-all duration-200 hover:scale-105"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Premium Search Bar */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#007AFF]/20 to-[#5856D6]/20 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/30 group-focus-within:text-[#007AFF] transition-colors duration-200" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search filters..."
                    className="w-full pl-12 pr-5 py-3.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-[15px] text-white placeholder-white/30 focus:outline-none focus:border-[#007AFF]/50 focus:bg-white/[0.08] transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable Filter Sections */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6 space-y-6">
            {/* Locations - Blue */}
            <FilterSection
              icon={<MapPin className="w-[18px] h-[18px]" />}
              title="Locations"
              color="blue"
              count={localFilters.locationIds.length}
              isExpanded={expandedSections.locations}
              onToggle={() => toggleSection('locations')}
            >
              <FilterOption
                label="All Locations"
                isSelected={localFilters.locationIds.length === 0}
                onClick={() => setLocalFilters({ ...localFilters, locationIds: [] })}
                color="blue"
                isRadio
              />
              {locations.map(location => (
                <FilterOption
                  key={location.id}
                  label={location.name}
                  isSelected={localFilters.locationIds.includes(location.id)}
                  onClick={() => toggleLocation(location.id)}
                  color="blue"
                />
              ))}
            </FilterSection>

            {/* Categories - Green */}
            <FilterSection
              icon={<Tag className="w-[18px] h-[18px]" />}
              title="Categories"
              color="green"
              count={localFilters.categoryIds.length}
              isExpanded={expandedSections.categories}
              onToggle={() => toggleSection('categories')}
            >
              {categories.filter(c => !c.parent_id).map(category => (
                <FilterOption
                  key={category.id}
                  label={category.name}
                  isSelected={localFilters.categoryIds.includes(category.id)}
                  onClick={() => toggleCategory(category.id)}
                  color="green"
                />
              ))}
            </FilterSection>

            {/* Employees - Orange */}
            <FilterSection
              icon={<Users className="w-[18px] h-[18px]" />}
              title="Employees"
              color="orange"
              count={localFilters.employeeIds.length}
              isExpanded={expandedSections.employees}
              onToggle={() => toggleSection('employees')}
            >
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {employees.map(employee => (
                  <FilterOption
                    key={employee.id}
                    label={employee.name}
                    isSelected={localFilters.employeeIds.includes(employee.id)}
                    onClick={() => toggleEmployee(employee.id)}
                    color="orange"
                  />
                ))}
              </div>
            </FilterSection>

            {/* Payment Methods - Purple */}
            <FilterSection
              icon={<CreditCard className="w-[18px] h-[18px]" />}
              title="Payment Methods"
              color="purple"
              count={localFilters.paymentMethods.length}
              isExpanded={expandedSections.payments}
              onToggle={() => toggleSection('payments')}
            >
              {paymentMethods.map(method => (
                <FilterOption
                  key={method.id}
                  label={method.label}
                  isSelected={localFilters.paymentMethods.includes(method.id)}
                  onClick={() => togglePaymentMethod(method.id)}
                  color="purple"
                />
              ))}
            </FilterSection>

            {/* Options with iOS Toggle Switches */}
            <FilterSection
              icon={<Package className="w-[18px] h-[18px]" />}
              title="Options"
              color="gray"
              count={0}
              isExpanded={expandedSections.options}
              onToggle={() => toggleSection('options')}
            >
              <IOSToggle
                label="Include Refunds"
                isOn={localFilters.includeRefunds}
                onToggle={() => setLocalFilters({ ...localFilters, includeRefunds: !localFilters.includeRefunds })}
              />
              <IOSToggle
                label="Include Discounts"
                isOn={localFilters.includeDiscounts}
                onToggle={() => setLocalFilters({ ...localFilters, includeDiscounts: !localFilters.includeDiscounts })}
              />
            </FilterSection>
          </div>

          {/* Premium Footer Buttons */}
          <div className="flex-none px-8 pb-8 pt-6 border-t border-white/[0.08] space-y-3">
            <button
              onClick={handleApply}
              className="w-full group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#007AFF] to-[#0051D5] rounded-[14px]" />
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative px-6 py-4 flex items-center justify-center">
                <span className="text-[17px] font-semibold text-white tracking-tight">
                  Apply Filters
                </span>
              </div>
            </button>

            <button
              onClick={handleReset}
              className="w-full px-6 py-4 bg-white/[0.06] hover:bg-white/[0.10] rounded-[14px] transition-all duration-200 hover:scale-[1.02]"
            >
              <span className="text-[17px] font-medium text-white/80 hover:text-white transition-colors">
                Reset All
              </span>
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes panelSlideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes panelFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes filterExpand {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .panel-slide-in {
          animation: panelSlideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        .panel-fade-in {
          animation: panelFadeIn 0.3s ease-out;
        }

        .filter-expand {
          animation: filterExpand 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </>
  );
}

// Premium Filter Section Component
function FilterSection({
  icon,
  title,
  color,
  count,
  isExpanded,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'gray';
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const colorClasses = {
    blue: 'bg-[#007AFF]/12 text-[#007AFF]',
    green: 'bg-[#34C759]/12 text-[#34C759]',
    orange: 'bg-[#FF9500]/12 text-[#FF9500]',
    purple: 'bg-[#AF52DE]/12 text-[#AF52DE]',
    gray: 'bg-white/10 text-white/70',
  };

  return (
    <div className="space-y-3">
      <button
        onClick={onToggle}
        className="w-full group"
      >
        <div className="flex items-center justify-between p-4 rounded-[14px] bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-200">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-[12px] ${colorClasses[color]} flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}>
              {icon}
            </div>
            <div className="text-left">
              <h3 className="text-[17px] font-semibold text-white tracking-tight leading-none">
                {title}
              </h3>
              {count > 0 && (
                <p className="text-[13px] text-white/40 mt-1">
                  {count} selected
                </p>
              )}
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-white/30 transition-all duration-300 ${
              isExpanded ? 'rotate-180 text-white/50' : ''
            }`}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="space-y-2 filter-expand">
          {children}
        </div>
      )}
    </div>
  );
}

// Premium Filter Option Component
function FilterOption({
  label,
  isSelected,
  onClick,
  color,
  isRadio = false,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  color: 'blue' | 'green' | 'orange' | 'purple';
  isRadio?: boolean;
}) {
  const colorClasses = {
    blue: 'border-[#007AFF] bg-[#007AFF]',
    green: 'border-[#34C759] bg-[#34C759]',
    orange: 'border-[#FF9500] bg-[#FF9500]',
    purple: 'border-[#AF52DE] bg-[#AF52DE]',
  };

  const hoverColorClasses = {
    blue: 'group-hover:border-[#007AFF]/30',
    green: 'group-hover:border-[#34C759]/30',
    orange: 'group-hover:border-[#FF9500]/30',
    purple: 'group-hover:border-[#AF52DE]/30',
  };

  return (
    <button
      onClick={onClick}
      className={`w-full group flex items-center gap-4 px-4 py-3 rounded-[12px] transition-all duration-200 ${
        isSelected
          ? 'bg-white/[0.08] hover:bg-white/[0.10]'
          : 'bg-white/[0.03] hover:bg-white/[0.06]'
      }`}
    >
      {/* Custom Checkbox/Radio */}
      <div className="relative flex items-center justify-center">
        <div
          className={`w-5 h-5 rounded-${isRadio ? 'full' : '[6px]'} border-2 transition-all duration-200 ${
            isSelected
              ? `${colorClasses[color]} shadow-lg`
              : `border-white/20 ${hoverColorClasses[color]}`
          }`}
        >
          {isSelected && (
            <div className="absolute inset-0 flex items-center justify-center">
              {isRadio ? (
                <div className="w-2 h-2 rounded-full bg-white" />
              ) : (
                <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M10 3L4.5 8.5L2 6"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          )}
        </div>
      </div>

      <span className={`text-[15px] transition-colors duration-200 ${
        isSelected ? 'text-white font-medium' : 'text-white/70 group-hover:text-white/90'
      }`}>
        {label}
      </span>
    </button>
  );
}

// iOS-Style Toggle Switch
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
      className="w-full flex items-center justify-between px-4 py-3 rounded-[12px] bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-200 group"
    >
      <span className="text-[15px] text-white/80 group-hover:text-white transition-colors">
        {label}
      </span>

      {/* iOS Toggle */}
      <div
        className={`relative w-[51px] h-[31px] rounded-full transition-all duration-300 ${
          isOn ? 'bg-[#34C759]' : 'bg-white/20'
        }`}
      >
        <div
          className={`absolute top-[2px] w-[27px] h-[27px] bg-white rounded-full shadow-lg transition-all duration-300 ${
            isOn ? 'left-[22px]' : 'left-[2px]'
          }`}
        />
      </div>
    </button>
  );
}
