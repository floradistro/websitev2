"use client";

import { InventoryTab } from '@/app/vendor/products/components/inventory';
import { QueryProvider } from '@/lib/providers/query-provider';
import { ds, cn } from '@/components/ds';
import { Warehouse, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * Standalone Inventory Management Page
 *
 * This page provides direct access to inventory management functionality.
 * Previously, inventory was only accessible as a tab within the products page.
 */
export default function InventoryPage() {
  return (
    <QueryProvider>
      <main className={cn(ds.colors.bg.primary, "min-h-screen px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-6")} role="main" aria-label="Inventory management">
        {/* Header */}
        <div className="mb-6">
          {/* Breadcrumb Navigation */}
          <div className="mb-4">
            <Link
              href="/vendor/products"
              className={cn(
                "inline-flex items-center gap-2 text-sm",
                ds.colors.text.quaternary,
                "hover:text-white/80 transition-colors"
              )}
            >
              <ArrowLeft size={14} strokeWidth={1.5} />
              Back to Products
            </Link>
          </div>

          {/* Page Title */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              ds.colors.bg.secondary,
              "border",
              ds.colors.border.default
            )}>
              <Warehouse size={24} strokeWidth={1} className="text-white/60" />
            </div>
            <div>
              <h1 className={cn(
                ds.typography.size['2xl'],
                ds.typography.weight.light,
                ds.typography.tracking.wide,
                "text-white"
              )}>
                Inventory Management
              </h1>
              <p className={cn(
                ds.typography.size.xs,
                ds.colors.text.quaternary,
                ds.typography.tracking.wide
              )}>
                Track and manage stock levels across all locations
              </p>
            </div>
          </div>
        </div>

        {/* Inventory Tab Component */}
        <InventoryTab />
      </main>
    </QueryProvider>
  );
}
