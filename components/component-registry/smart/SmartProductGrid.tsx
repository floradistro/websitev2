/**
 * Smart Component: SmartProductGrid
 * Auto-fetches products - REWRITTEN FOR ZERO GLITCHING
 */

"use client";

import React, { useState, useEffect } from "react";
import { ProductGrid } from "../composite/ProductGrid";

export interface SmartProductGridProps {
  vendorId: string;
  selectedProductIds?: string[];
  selectedCategoryIds?: string[];
  headline?: string;
  subheadline?: string;
  maxProducts?: number;
  columns?: 2 | 3 | 4 | 5;
  showPrice?: boolean;
  showQuickAdd?: boolean;
  cardStyle?: "minimal" | "bordered" | "elevated";
  className?: string;
}

export function SmartProductGrid({
  vendorId,
  selectedProductIds = [],
  selectedCategoryIds = [],
  headline,
  subheadline,
  maxProducts = 12,
  columns = 3,
  showPrice = true,
  showQuickAdd = true,
  cardStyle = "minimal",
  className = "",
}: SmartProductGridProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Hydration fix
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch products - Use JSON.stringify to prevent infinite loops from array refs
  useEffect(() => {
    if (!isClient) {
      return;
    }

    async function loadProducts() {
      try {
        // Fetch products using page-data endpoint (includes locations)
        const res = await fetch("/api/page-data/products", {
          cache: "no-store",
        });

        if (res.ok) {
          const result = await res.json();

          if (result.success) {
            // Filter to this vendor's products
            const allProducts = result.data.products || [];
            let vendorProducts = allProducts.filter(
              (p: any) => p.vendor_id === vendorId,
            );

            // Apply category filter if specified
            if (selectedCategoryIds.length > 0) {
              vendorProducts = vendorProducts.filter((p: any) =>
                p.categories?.some((cat: any) =>
                  selectedCategoryIds.includes(cat.id),
                ),
              );
            }

            // Apply product ID filter if specified
            if (selectedProductIds.length > 0) {
              vendorProducts = vendorProducts.filter((p: any) =>
                selectedProductIds.includes(p.id),
              );
            }

            // Limit results
            vendorProducts = vendorProducts.slice(0, maxProducts);

            setProducts(vendorProducts);
            setLocations(result.data.locations || []);
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Products fetch error:", err);
        }
      }
    }

    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isClient,
    vendorId,
    JSON.stringify(selectedProductIds),
    JSON.stringify(selectedCategoryIds),
    maxProducts,
  ]);

  // Show loading state while hydrating
  if (!isClient) {
    return (
      <div className={className} style={{ minHeight: "400px" }}>
        <div className="text-center py-12 text-white/40">
          Loading products...
        </div>
      </div>
    );
  }

  // After client-side, if no products, show message
  if (products.length === 0) {
    return (
      <div className={className}>
        <div className="text-center py-12">
          <p className="text-white/60 text-lg">No products available</p>
          <p className="text-white/40 text-sm mt-2">
            Check back soon for new arrivals
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {(headline || subheadline) && (
        <div className="text-center mb-8">
          {headline && (
            <h2 className="text-3xl font-bold text-white mb-2">{headline}</h2>
          )}
          {subheadline && (
            <p className="text-lg text-neutral-400">{subheadline}</p>
          )}
        </div>
      )}

      <ProductGrid
        products={products}
        locations={locations}
        columns={columns}
        showPrice={showPrice}
        showQuickAdd={showQuickAdd}
        cardStyle={cardStyle}
        vendorId={vendorId}
      />
    </div>
  );
}
