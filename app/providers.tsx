'use client';

import { SWRConfig } from 'swr';
import { swrConfig } from '@/lib/cache-config';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <SWRConfig value={swrConfig}>
        {children}
      </SWRConfig>
    </ErrorBoundary>
  );
}

