'use client';

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';

/**
 * Product filter state
 */
export interface ProductFilters {
  search: string;
  status: 'all' | 'published' | 'pending' | 'rejected' | 'draft';
  category: string;
  subcategory: string;
  consistency: string;
  strainType: string;
  pricingTier: string;
  page: number;
  itemsPerPage: number;
}

/**
 * Filter actions
 */
type FilterAction =
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_STATUS'; payload: ProductFilters['status'] }
  | { type: 'SET_CATEGORY'; payload: string }
  | { type: 'SET_SUBCATEGORY'; payload: string }
  | { type: 'SET_CONSISTENCY'; payload: string }
  | { type: 'SET_STRAIN_TYPE'; payload: string }
  | { type: 'SET_PRICING_TIER'; payload: string }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_ITEMS_PER_PAGE'; payload: number }
  | { type: 'RESET_FILTERS' }
  | { type: 'RESET_CATEGORY_FILTERS' };

/**
 * Initial filter state
 */
const initialFilters: ProductFilters = {
  search: '',
  status: 'all',
  category: 'all',
  subcategory: 'all',
  consistency: 'all',
  strainType: 'all',
  pricingTier: 'all',
  page: 1,
  itemsPerPage: 20,
};

/**
 * Filter reducer
 */
function filterReducer(state: ProductFilters, action: FilterAction): ProductFilters {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, search: action.payload, page: 1 }; // Reset to page 1 on search
    case 'SET_STATUS':
      return { ...state, status: action.payload, page: 1 };
    case 'SET_CATEGORY':
      return {
        ...state,
        category: action.payload,
        subcategory: 'all', // Reset subcategory when category changes
        page: 1,
      };
    case 'SET_SUBCATEGORY':
      return { ...state, subcategory: action.payload, page: 1 };
    case 'SET_CONSISTENCY':
      return { ...state, consistency: action.payload, page: 1 };
    case 'SET_STRAIN_TYPE':
      return { ...state, strainType: action.payload, page: 1 };
    case 'SET_PRICING_TIER':
      return { ...state, pricingTier: action.payload, page: 1 };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    case 'SET_ITEMS_PER_PAGE':
      return { ...state, itemsPerPage: action.payload, page: 1 };
    case 'RESET_FILTERS':
      return initialFilters;
    case 'RESET_CATEGORY_FILTERS':
      return {
        ...state,
        category: 'all',
        subcategory: 'all',
        consistency: 'all',
        strainType: 'all',
        pricingTier: 'all',
        page: 1,
      };
    default:
      return state;
  }
}

/**
 * Context type
 */
interface ProductFiltersContextType {
  filters: ProductFilters;
  dispatch: React.Dispatch<FilterAction>;
  // Convenience methods
  setSearch: (search: string) => void;
  setStatus: (status: ProductFilters['status']) => void;
  setCategory: (category: string) => void;
  setSubcategory: (subcategory: string) => void;
  setConsistency: (consistency: string) => void;
  setStrainType: (strainType: string) => void;
  setPricingTier: (tier: string) => void;
  setPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;
  resetFilters: () => void;
  resetCategoryFilters: () => void;
}

/**
 * Create context
 */
const ProductFiltersContext = createContext<ProductFiltersContextType | undefined>(undefined);

/**
 * Provider component
 */
export function ProductFiltersProvider({ children }: { children: ReactNode }) {
  const [filters, dispatch] = useReducer(filterReducer, initialFilters);

  // Memoized convenience methods to prevent infinite loops in useEffect
  const setSearch = useCallback((search: string) => dispatch({ type: 'SET_SEARCH', payload: search }), []);
  const setStatus = useCallback((status: ProductFilters['status']) =>
    dispatch({ type: 'SET_STATUS', payload: status }), []);
  const setCategory = useCallback((category: string) => dispatch({ type: 'SET_CATEGORY', payload: category }), []);
  const setSubcategory = useCallback((subcategory: string) =>
    dispatch({ type: 'SET_SUBCATEGORY', payload: subcategory }), []);
  const setConsistency = useCallback((consistency: string) =>
    dispatch({ type: 'SET_CONSISTENCY', payload: consistency }), []);
  const setStrainType = useCallback((strainType: string) =>
    dispatch({ type: 'SET_STRAIN_TYPE', payload: strainType }), []);
  const setPricingTier = useCallback((tier: string) => dispatch({ type: 'SET_PRICING_TIER', payload: tier }), []);
  const setPage = useCallback((page: number) => dispatch({ type: 'SET_PAGE', payload: page }), []);
  const setItemsPerPage = useCallback((items: number) =>
    dispatch({ type: 'SET_ITEMS_PER_PAGE', payload: items }), []);
  const resetFilters = useCallback(() => dispatch({ type: 'RESET_FILTERS' }), []);
  const resetCategoryFilters = useCallback(() => dispatch({ type: 'RESET_CATEGORY_FILTERS' }), []);

  const value: ProductFiltersContextType = {
    filters,
    dispatch,
    setSearch,
    setStatus,
    setCategory,
    setSubcategory,
    setConsistency,
    setStrainType,
    setPricingTier,
    setPage,
    setItemsPerPage,
    resetFilters,
    resetCategoryFilters,
  };

  return (
    <ProductFiltersContext.Provider value={value}>{children}</ProductFiltersContext.Provider>
  );
}

/**
 * Hook to use product filters
 */
export function useProductFilters() {
  const context = useContext(ProductFiltersContext);

  if (!context) {
    throw new Error('useProductFilters must be used within ProductFiltersProvider');
  }

  return context;
}
