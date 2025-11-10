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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300"
        onClick={onClose}
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      />

      {/* Slide-in Panel */}
      <div
        className="fixed right-0 top-0 h-full w-[420px] bg-[#1c1c1e] z-[101] shadow-2xl overflow-y-auto"
        style={{ animation: 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#1c1c1e] border-b border-white/10 p-6 z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Filters</h2>
              {getActiveFilterCount() > 0 && (
                <p className="text-sm text-white/50 mt-1">
                  {getActiveFilterCount()} active {getActiveFilterCount() === 1 ? 'filter' : 'filters'}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search filters..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 text-sm focus:outline-none focus:border-[#007AFF] transition-colors"
            />
          </div>
        </div>

        {/* Filter Sections */}
        <div className="p-6 space-y-6">
          {/* Locations */}
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('locations')}
              className="w-full flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#007AFF]/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-[#007AFF]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Locations</h3>
                  {localFilters.locationIds.length > 0 && (
                    <p className="text-xs text-white/50">
                      {localFilters.locationIds.length} selected
                    </p>
                  )}
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-white/40 transition-transform duration-200 ${
                  expandedSections.locations ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedSections.locations && (
              <div className="space-y-2 pl-11 animate-in">
                <button
                  onClick={() => setLocalFilters({ ...localFilters, locationIds: [] })}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                    localFilters.locationIds.length === 0
                      ? 'bg-[#007AFF]/10 text-white border border-[#007AFF]/30'
                      : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-4 h-4 rounded border ${
                    localFilters.locationIds.length === 0
                      ? 'border-[#007AFF] bg-[#007AFF]'
                      : 'border-white/30'
                  } flex items-center justify-center`}>
                    {localFilters.locationIds.length === 0 && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-sm">All Locations</span>
                </button>
                {locations.map(location => (
                  <button
                    key={location.id}
                    onClick={() => toggleLocation(location.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                      localFilters.locationIds.includes(location.id)
                        ? 'bg-[#007AFF]/10 text-white border border-[#007AFF]/30'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border ${
                      localFilters.locationIds.includes(location.id)
                        ? 'border-[#007AFF] bg-[#007AFF]'
                        : 'border-white/30'
                    } flex items-center justify-center`}>
                      {localFilters.locationIds.includes(location.id) && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className="text-sm">{location.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('categories')}
              className="w-full flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#34C759]/10 flex items-center justify-center">
                  <Tag className="w-4 h-4 text-[#34C759]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Categories</h3>
                  {localFilters.categoryIds.length > 0 && (
                    <p className="text-xs text-white/50">
                      {localFilters.categoryIds.length} selected
                    </p>
                  )}
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-white/40 transition-transform duration-200 ${
                  expandedSections.categories ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedSections.categories && (
              <div className="space-y-2 pl-11 animate-in">
                {categories.filter(c => !c.parent_id).map(category => (
                  <button
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                      localFilters.categoryIds.includes(category.id)
                        ? 'bg-[#34C759]/10 text-white border border-[#34C759]/30'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border ${
                      localFilters.categoryIds.includes(category.id)
                        ? 'border-[#34C759] bg-[#34C759]'
                        : 'border-white/30'
                    } flex items-center justify-center`}>
                      {localFilters.categoryIds.includes(category.id) && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className="text-sm">{category.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Employees */}
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('employees')}
              className="w-full flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FF9500]/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-[#FF9500]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Employees</h3>
                  {localFilters.employeeIds.length > 0 && (
                    <p className="text-xs text-white/50">
                      {localFilters.employeeIds.length} selected
                    </p>
                  )}
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-white/40 transition-transform duration-200 ${
                  expandedSections.employees ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedSections.employees && (
              <div className="space-y-2 pl-11 animate-in max-h-60 overflow-y-auto">
                {employees.map(employee => (
                  <button
                    key={employee.id}
                    onClick={() => toggleEmployee(employee.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                      localFilters.employeeIds.includes(employee.id)
                        ? 'bg-[#FF9500]/10 text-white border border-[#FF9500]/30'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border ${
                      localFilters.employeeIds.includes(employee.id)
                        ? 'border-[#FF9500] bg-[#FF9500]'
                        : 'border-white/30'
                    } flex items-center justify-center`}>
                      {localFilters.employeeIds.includes(employee.id) && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className="text-sm">{employee.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('payments')}
              className="w-full flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#AF52DE]/10 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-[#AF52DE]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Payment Methods</h3>
                  {localFilters.paymentMethods.length > 0 && (
                    <p className="text-xs text-white/50">
                      {localFilters.paymentMethods.length} selected
                    </p>
                  )}
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-white/40 transition-transform duration-200 ${
                  expandedSections.payments ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedSections.payments && (
              <div className="space-y-2 pl-11 animate-in">
                {paymentMethods.map(method => (
                  <button
                    key={method.id}
                    onClick={() => togglePaymentMethod(method.id)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                      localFilters.paymentMethods.includes(method.id)
                        ? 'bg-[#AF52DE]/10 text-white border border-[#AF52DE]/30'
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border ${
                      localFilters.paymentMethods.includes(method.id)
                        ? 'border-[#AF52DE] bg-[#AF52DE]'
                        : 'border-white/30'
                    } flex items-center justify-center`}>
                      {localFilters.paymentMethods.includes(method.id) && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <span className="text-sm">{method.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            <button
              onClick={() => toggleSection('options')}
              className="w-full flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Package className="w-4 h-4 text-white/70" />
                </div>
                <h3 className="text-sm font-semibold text-white">Options</h3>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-white/40 transition-transform duration-200 ${
                  expandedSections.options ? 'rotate-180' : ''
                }`}
              />
            </button>

            {expandedSections.options && (
              <div className="space-y-2 pl-11 animate-in">
                <button
                  onClick={() => setLocalFilters({ ...localFilters, includeRefunds: !localFilters.includeRefunds })}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 transition-all"
                >
                  <div className={`w-4 h-4 rounded border ${
                    localFilters.includeRefunds
                      ? 'border-[#007AFF] bg-[#007AFF]'
                      : 'border-white/30'
                  } flex items-center justify-center`}>
                    {localFilters.includeRefunds && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-sm">Include Refunds</span>
                </button>
                <button
                  onClick={() => setLocalFilters({ ...localFilters, includeDiscounts: !localFilters.includeDiscounts })}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 transition-all"
                >
                  <div className={`w-4 h-4 rounded border ${
                    localFilters.includeDiscounts
                      ? 'border-[#007AFF] bg-[#007AFF]'
                      : 'border-white/30'
                  } flex items-center justify-center`}>
                    {localFilters.includeDiscounts && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-sm">Include Discounts</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#1c1c1e] border-t border-white/10 p-6 space-y-3">
          <button
            onClick={handleApply}
            className="w-full px-4 py-3 bg-[#007AFF] hover:bg-[#0051D5] text-white rounded-xl font-semibold transition-all"
          >
            Apply Filters
          </button>
          <button
            onClick={handleReset}
            className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-all"
          >
            Reset All
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-in {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
