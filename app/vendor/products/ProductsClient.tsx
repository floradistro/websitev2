"use client";

import { useState, useMemo, useCallback } from "react";
import { useProducts, useProductCategories } from "@/lib/hooks/useProducts";
import { useProductFilters } from "@/lib/contexts/ProductFiltersContext";
import { useAppAuth } from "@/context/AppAuthContext";
import { ProductsHeader } from "./components/ProductsHeader";
import { ProductsStats } from "./components/ProductsStats";
import { ProductsFilters } from "./components/ProductsFilters";
import { ProductsList } from "./components/ProductsList";
import { ProductsPagination } from "./components/ProductsPagination";
import { ProductQuickView } from "@/components/vendor/ProductQuickView";
import { CategoriesManagement } from "./components/CategoriesManagement";
import { InventoryTab } from "./components/inventory";
import { PurchaseOrdersTab } from "./components/purchase-orders";
import { ds, cn } from "@/components/ds";
import { Package, FolderTree, Warehouse, FileText } from "lucide-react";
import type { Product } from "@/lib/types/product";

type TabType = "products" | "categories" | "inventory" | "purchase-orders";

/**
 * Modern ProductsClient - Clean rewrite with React Query + Categories Management
 * Zero legacy code, all fresh, Jobs-worthy simplicity
 */
export default function ProductsClient() {
  const { vendor } = useAppAuth();
  const { filters, setPage } = useProductFilters();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("products");

  // Fetch products with React Query (cached, paginated, filtered)
  const {
    data: productsData,
    isLoading,
    error,
    refetch,
  } = useProducts({
    page: filters.page,
    limit: filters.itemsPerPage,
    search: filters.search,
    status: filters.status !== "all" ? filters.status : undefined,
    category: filters.category !== "all" ? filters.category : undefined,
  });

  // Fetch categories for filter dropdown
  const { data: categoriesData } = useProductCategories();

  const products = productsData?.products || [];
  const total = productsData?.total || 0;
  const totalPages = productsData?.totalPages || 0;

  // Use stats from API response - calculated across ALL products, not just current page
  const stats = productsData?.stats || {
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
  };

  // Memoize event handlers
  const handleViewProduct = useCallback(
    (productId: string) => {
      const product = products.find((p: Product) => p.id === productId);
      setSelectedProduct(product || null);
    },
    [products],
  );

  return (
    <main
      className={cn(
        ds.colors.bg.primary,
        "min-h-screen px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-6",
      )}
      role="main"
      aria-label="Product management"
    >
      <div className="w-full mx-auto">
        {/* Header */}
        <ProductsHeader totalProducts={total} isLoading={isLoading} />

        {/* Tabs - Horizontal scroll on mobile */}
        <div
          className={cn(
            "flex gap-2 mb-6 border-b overflow-x-auto scrollbar-hide",
            ds.colors.border.default,
          )}
          role="tablist"
        >
          <button
            role="tab"
            aria-selected={activeTab === "products"}
            aria-controls="products-panel"
            onClick={() => setActiveTab("products")}
            className={cn(
              "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b-2 transition-colors whitespace-nowrap",
              ds.typography.size.xs,
              ds.typography.transform.uppercase,
              ds.typography.tracking.wide,
              ds.typography.weight.light,
              activeTab === "products"
                ? "border-white text-white"
                : cn(
                    ds.colors.text.quaternary,
                    "hover:text-white/60",
                    "border-transparent",
                  ),
            )}
          >
            <Package size={14} strokeWidth={1} className="opacity-60" />
            Products
            <span
              className={cn(
                "px-1.5 sm:px-2 py-0.5 rounded text-[8px]",
                ds.colors.bg.hover,
              )}
            >
              {total}
            </span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === "categories"}
            aria-controls="categories-panel"
            onClick={() => setActiveTab("categories")}
            className={cn(
              "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b-2 transition-colors whitespace-nowrap",
              ds.typography.size.xs,
              ds.typography.transform.uppercase,
              ds.typography.tracking.wide,
              ds.typography.weight.light,
              activeTab === "categories"
                ? "border-white text-white"
                : cn(
                    ds.colors.text.quaternary,
                    "hover:text-white/60",
                    "border-transparent",
                  ),
            )}
          >
            <FolderTree size={14} strokeWidth={1} className="opacity-60" />
            Categories
            <span
              className={cn(
                "px-1.5 sm:px-2 py-0.5 rounded text-[8px]",
                ds.colors.bg.hover,
              )}
            >
              {categoriesData?.length || 0}
            </span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === "inventory"}
            aria-controls="inventory-panel"
            onClick={() => setActiveTab("inventory")}
            className={cn(
              "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b-2 transition-colors whitespace-nowrap",
              ds.typography.size.xs,
              ds.typography.transform.uppercase,
              ds.typography.tracking.wide,
              ds.typography.weight.light,
              activeTab === "inventory"
                ? "border-white text-white"
                : cn(
                    ds.colors.text.quaternary,
                    "hover:text-white/60",
                    "border-transparent",
                  ),
            )}
          >
            <Warehouse size={14} strokeWidth={1} className="opacity-60" />
            Inventory
          </button>

          <button
            role="tab"
            aria-selected={activeTab === "purchase-orders"}
            aria-controls="purchase-orders-panel"
            onClick={() => setActiveTab("purchase-orders")}
            className={cn(
              "flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b-2 transition-colors whitespace-nowrap",
              ds.typography.size.xs,
              ds.typography.transform.uppercase,
              ds.typography.tracking.wide,
              ds.typography.weight.light,
              activeTab === "purchase-orders"
                ? "border-white text-white"
                : cn(
                    ds.colors.text.quaternary,
                    "hover:text-white/60",
                    "border-transparent",
                  ),
            )}
          >
            <FileText size={14} strokeWidth={1} className="opacity-60" />
            Purchase Orders
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === "products" && (
          <div
            id="products-panel"
            role="tabpanel"
            aria-labelledby="products-tab"
          >
            {/* Stats Cards */}
            <ProductsStats
              total={total}
              inStock={stats.inStock}
              lowStock={stats.lowStock}
              outOfStock={stats.outOfStock}
              isLoading={isLoading}
            />

            {/* Filters */}
            <ProductsFilters categories={categoriesData || []} />

            {/* Products List */}
            <ProductsList
              products={products}
              isLoading={isLoading}
              error={error}
              onViewProduct={handleViewProduct}
              onRetry={() => refetch()}
            />

            {/* Pagination */}
            <ProductsPagination
              currentPage={filters.page}
              totalPages={totalPages}
              total={total}
              itemsPerPage={filters.itemsPerPage}
              onPageChange={setPage}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div
            id="categories-panel"
            role="tabpanel"
            aria-labelledby="categories-tab"
          >
            <CategoriesManagement vendorId={vendor?.id || ""} />
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === "inventory" && (
          <div
            id="inventory-panel"
            role="tabpanel"
            aria-labelledby="inventory-tab"
          >
            <InventoryTab />
          </div>
        )}

        {/* Purchase Orders Tab */}
        {activeTab === "purchase-orders" && (
          <div
            id="purchase-orders-panel"
            role="tabpanel"
            aria-labelledby="purchase-orders-tab"
          >
            <PurchaseOrdersTab />
          </div>
        )}

        {/* Quick View Modal */}
        {selectedProduct && (
          <ProductQuickView
            product={selectedProduct}
            vendorId={vendor?.id || ""}
            isOpen={!!selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onSave={() => {
              setSelectedProduct(null);
              // Refetch will happen automatically via React Query
            }}
            onDelete={() => {
              setSelectedProduct(null);
              // Refetch will happen automatically via React Query
            }}
          />
        )}

        {/* Skip to content link for screen readers */}
        <a
          href="#products-list"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg"
        >
          Skip to products list
        </a>
      </div>
    </main>
  );
}
