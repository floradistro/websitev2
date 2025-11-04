'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

/**
 * React Query Provider with optimized defaults
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Keep unused data for 10 minutes
            gcTime: 10 * 60 * 1000,
            // Retry failed requests 1 time
            retry: 1,
            // Don't refetch on window focus in development
            refetchOnWindowFocus: process.env.NODE_ENV === 'production',
            // Refetch on reconnect
            refetchOnReconnect: true,
            // Show error boundary on error
            throwOnError: false,
          },
          mutations: {
            // Retry failed mutations 0 times (user should retry manually)
            retry: 0,
            // Show error boundary on error
            throwOnError: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
