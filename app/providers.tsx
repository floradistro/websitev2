'use client';

import ErrorBoundary from '@/components/ErrorBoundary';
import { AppAuthProvider } from '@/context/AppAuthContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AppAuthProvider>
        {children}
      </AppAuthProvider>
    </ErrorBoundary>
  );
}

