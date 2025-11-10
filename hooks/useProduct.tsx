"use client";

import useSWR from "swr";
import { logger } from "@/lib/logger";

const fetcher = async (url: string) => {
  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    logger.error("Fetch failed in useProduct", error, { url });
    throw error; // Re-throw for SWR to handle
  }
};

export function useProduct(productId: string | number) {
  const { data, error, isLoading } = useSWR(`/api/product/${productId}`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // 1 minute
    fallbackData: null,
  });

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
  fetch(`/api/product/${productId}`)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Prefetch failed: HTTP ${res.status}`);
      }
      return res.json();
    })
    .catch((error) => {
      // Non-critical: Prefetch failure doesn't affect functionality
      logger.debug("Product prefetch failed", { productId, error });
    });
}
