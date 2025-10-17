"use client";

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useProduct(productId: string | number) {
  const { data, error, isLoading } = useSWR(
    `/api/product/${productId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
      fallbackData: null,
    }
  );

  return {
    product: data?.product || null,
    inventory: data?.inventory || [],
    locations: data?.locations || [],
    pricingRules: data?.pricingRules || null,
    productFields: data?.productFields || null,
    totalStock: data?.total_stock || 0,
    isLoading,
    isError: error,
    meta: data?.meta,
  };
}

// Prefetch product data
export function prefetchProduct(productId: string | number) {
  // This will prime the SWR cache
  fetch(`/api/product/${productId}`);
}

