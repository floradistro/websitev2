'use client';

import { SWRConfig } from 'swr';
import { swrConfig } from '@/lib/cache-config';
import ErrorBoundary from '@/components/ErrorBoundary';
import { AuthProvider } from '@/context/AuthContext';
import { AdminAuthProvider } from '@/context/AdminAuthContext';
import { AppAuthProvider } from '@/context/AppAuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AdminAuthProvider>
          <AppAuthProvider>
            <CartProvider>
              <WishlistProvider>
                <SWRConfig value={swrConfig}>
                  {children}
                </SWRConfig>
              </WishlistProvider>
            </CartProvider>
          </AppAuthProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

