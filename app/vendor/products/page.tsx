"use client";

import ProductsClient from './ProductsClient';
import { ProductErrorBoundary } from '@/components/ErrorBoundary';
import { QueryProvider } from '@/lib/providers/query-provider';
import { ProductFiltersProvider } from '@/lib/contexts/ProductFiltersContext';

export default function ProductsPage() {
  return (
    <ProductErrorBoundary>
      <QueryProvider>
        <ProductFiltersProvider>
          <ProductsClient />
        </ProductFiltersProvider>
      </QueryProvider>
    </ProductErrorBoundary>
  );
}
