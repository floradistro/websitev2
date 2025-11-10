"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

// Prefetch route and data on hover
export function usePrefetch() {
  const router = useRouter();
  const prefetchedRoutes = useRef(new Set<string>());

  const prefetchRoute = useCallback(
    (href: string) => {
      // Only prefetch once per route
      if (prefetchedRoutes.current.has(href)) {
        return;
      }

      prefetchedRoutes.current.add(href);

      // Prefetch the route
      router.prefetch(href);

      // Optionally prefetch data via API
      // You can add custom data prefetching here
    },
    [router],
  );

  return { prefetchRoute };
}

// Hook for link prefetching with hover intent
export function useLinkPrefetch(href: string) {
  const { prefetchRoute } = usePrefetch();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Add small delay to avoid prefetching accidental hovers
    timeoutRef.current = setTimeout(() => {
      prefetchRoute(href);
    }, 50); // 50ms delay
  }, [href, prefetchRoute]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };
}
