"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";

// Prefetch route and data on hover
export function usePrefetch() {
  const router = useRouter();
  const prefetchedRoutes = useRef(new Set<string>());

  const prefetchRoute = useCallback((href: string) => {
    // Only prefetch once per route
    if (prefetchedRoutes.current.has(href)) {
      return;
    }

    prefetchedRoutes.current.add(href);
    
    // Prefetch the route
    router.prefetch(href);
    
    // Optionally prefetch data via API
    // You can add custom data prefetching here
  }, [router]);

  return { prefetchRoute };
}

// Hook for link prefetching with hover intent
export function useLinkPrefetch(href: string) {
  const { prefetchRoute } = usePrefetch();
  let timeoutId: NodeJS.Timeout;

  const handleMouseEnter = () => {
    // Add small delay to avoid prefetching accidental hovers
    timeoutId = setTimeout(() => {
      prefetchRoute(href);
    }, 50); // 50ms delay
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };

  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };
}

