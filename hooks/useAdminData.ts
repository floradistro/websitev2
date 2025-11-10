import useSWR from "swr";
import axios from "axios";

// Fetcher function
const fetcher = (url: string) => axios.get(url).then((res) => res.data);

// Products hook with caching and revalidation
export function useProducts(searchParams?: Record<string, any>) {
  const queryString = searchParams
    ? `?${new URLSearchParams(searchParams).toString()}`
    : "?per_page=200";

  const { data, error, isLoading, mutate } = useSWR(
    `/api/supabase/products${queryString}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // Dedupe requests within 2s
    },
  );

  return {
    products: data?.products || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate, // For manual revalidation or optimistic updates
  };
}

// Vendors hook
export function useVendors() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/vendors", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  });

  return {
    vendors: data?.vendors || [],
    isLoading,
    isError: error,
    mutate,
  };
}

// Users hook
export function useUsers() {
  const { data, error, isLoading, mutate } = useSWR("/api/admin/users", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 2000,
  });

  return {
    users: data?.users || [],
    isLoading,
    isError: error,
    mutate,
  };
}

// Orders hook
export function useOrders(page: number = 1, filters?: Record<string, string>) {
  const params = { page: page.toString(), per_page: "20", ...filters };
  const queryString = new URLSearchParams(params).toString();

  const { data, error, isLoading, mutate } = useSWR(
    `/api/supabase/orders?${queryString}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
    },
  );

  return {
    orders: data?.orders || [],
    pagination: data?.pagination,
    isLoading,
    isError: error,
    mutate,
  };
}

// Dashboard stats hook
export function useDashboardStats() {
  const { data, error, isLoading } = useSWR("/api/admin/dashboard-stats", fetcher, {
    refreshInterval: 30000, // Refresh every 30s
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  return {
    stats: data,
    isLoading,
    isError: error,
  };
}
