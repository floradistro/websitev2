/**
 * Smart Component: SmartProductShowcase
 * Featured products with advanced filtering and real-time updates
 */

"use client";

import React, { useState, useEffect } from "react";
import { ProductGrid } from "../composite/ProductGrid";
import { Text } from "../atomic/Text";
import { Badge } from "../atomic/Badge";

import { logger } from "@/lib/logger";
export interface SmartProductShowcaseProps {
  vendorId: string;

  // Filtering
  filter?: "newest" | "bestsellers" | "featured" | "sale";
  categoryIds?: string[];

  // Display Options
  headline?: string;
  subheadline?: string;
  limit?: number;
  layout?: "grid" | "carousel" | "featured" | "list";
  columns?: 2 | 3 | 4 | 5;
  showFilters?: boolean;

  className?: string;
}

export function SmartProductShowcase({
  vendorId,
  filter = "featured",
  categoryIds = [],
  headline,
  subheadline,
  limit = 8,
  layout = "grid",
  columns = 4,
  showFilters = false,
  className = "",
}: SmartProductShowcaseProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState(filter);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);

        let url = `/api/products?vendor_id=${vendorId}&limit=${limit}`;

        // Apply filter
        if (activeFilter === "newest") {
          url += "&sort=created_at&order=desc";
        } else if (activeFilter === "bestsellers") {
          url += "&sort=sales&order=desc";
        } else if (activeFilter === "featured") {
          url += "&featured=true";
        } else if (activeFilter === "sale") {
          url += "&on_sale=true";
        }

        // Apply category filter
        if (categoryIds.length > 0) {
          url += `&category_ids=${categoryIds.join(",")}`;
        }

        const response = await fetch(url, { cache: "no-store" });
        const data = await response.json();
        setProducts(data.products || []);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          logger.error("SmartProductShowcase fetch error:", err);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId, activeFilter, JSON.stringify(categoryIds), limit]);

  if (loading) {
    return (
      <div className={`py-12 ${className}`}>
        <div className="animate-pulse space-y-4">
          {headline && <div className="h-10 bg-white/5 rounded w-1/3 mx-auto"></div>}
          {subheadline && <div className="h-6 bg-white/5 rounded w-1/2 mx-auto"></div>}
          <div className={`grid grid-cols-${columns} gap-6 mt-8`}>
            {[...Array(columns)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-square bg-neutral-800 rounded"></div>
                <div className="h-4 bg-neutral-800 rounded"></div>
                <div className="h-6 bg-neutral-800 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      {(headline || subheadline) && (
        <div className="text-center mb-8">
          {headline && <Text content={headline} variant="headline" size="3xl" align="center" />}
          {subheadline && (
            <Text
              content={subheadline}
              variant="paragraph"
              color="#a3a3a3"
              align="center"
              className="mt-2"
            />
          )}
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="flex justify-center gap-3 mb-8">
          {["featured", "newest", "bestsellers", "sale"].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeFilter === f
                  ? "bg-white text-black"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Products */}
      {layout === "grid" && (
        <ProductGrid
          products={products}
          columns={columns}
          showPrice={true}
          showQuickAdd={true}
          cardStyle="minimal"
        />
      )}

      {layout === "carousel" && (
        <div className="overflow-x-auto">
          <div className="flex gap-6">
            <ProductGrid
              products={products}
              columns={products.length as any}
              showPrice={true}
              showQuickAdd={true}
              cardStyle="elevated"
            />
          </div>
        </div>
      )}

      {products.length === 0 && (
        <div className="text-center py-12">
          <Text content="No products found" variant="paragraph" color="#737373" />
        </div>
      )}
    </div>
  );
}
