'use client';

import { SWRConfig } from 'swr';
import { swrConfig } from '@/lib/cache-config';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthProvider } from '@/context/AuthContext';
import { AdminAuthProvider } from '@/context/AdminAuthContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AdminAuthProvider>
          <SWRConfig value={swrConfig}>
            {children}
          </SWRConfig>
        </AdminAuthProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

