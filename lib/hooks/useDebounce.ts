import { useEffect, useState } from "react";

/**
 * Debounce a value to reduce API calls
 *
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 500ms)
 * @returns The debounced value
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 500);
 *
 * useEffect(() => {
 *   // This will only run 500ms after the user stops typing
 *   fetchProducts(debouncedSearch);
 * }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for debounced search with loading state
 *
 * @param initialValue - Initial search value
 * @param delay - Debounce delay in milliseconds
 * @returns Object with search value, debounced value, setter, and loading state
 *
 * @example
 * const { searchValue, debouncedValue, setSearchValue, isDebouncing } = useDebouncedSearch('', 300);
 *
 * <input
 *   value={searchValue}
 *   onChange={(e) => setSearchValue(e.target.value)}
 *   disabled={isDebouncing}
 * />
 */
export function useDebouncedSearch(
  initialValue: string = "",
  delay: number = 500,
) {
  const [searchValue, setSearchValue] = useState(initialValue);
  const debouncedValue = useDebounce(searchValue, delay);
  const isDebouncing = searchValue !== debouncedValue;

  return {
    searchValue,
    debouncedValue,
    setSearchValue,
    isDebouncing,
  };
}
