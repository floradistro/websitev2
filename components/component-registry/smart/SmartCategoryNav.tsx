/**
 * Smart Component: SmartCategoryNav
 * Auto-fetches categories and renders navigation
 */

"use client";

import React, { useState, useEffect } from "react";
import { Text } from "../atomic/Text";
import { Badge } from "../atomic/Badge";

import { logger } from "@/lib/logger";
export interface SmartCategoryNavProps {
  vendorId: string;

  // Field Data
  selectedCategoryIds?: string[]; // From category_picker
  headline?: string;
  showProductCounts?: boolean;

  // Styling
  layout?: "horizontal" | "vertical" | "grid";
  className?: string;
}

export function SmartCategoryNav({
  vendorId,
  selectedCategoryIds = [],
  headline,
  showProductCounts = true,
  layout = "horizontal",
  className = "",
}: SmartCategoryNavProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);

        let url = `/api/categories?vendor_id=${vendorId}`;

        if (selectedCategoryIds.length > 0) {
          url += `&category_ids=${selectedCategoryIds.join(",")}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          logger.error("SmartCategoryNav fetch error:", err);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, [vendorId, selectedCategoryIds]);

  if (loading) {
    return (
      <div className={`py-4 ${className}`}>
        <div className="animate-pulse flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-neutral-800 rounded-full w-24"></div>
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  const layoutClasses: Record<string, string> = {
    horizontal: "flex flex-wrap gap-3",
    vertical: "flex flex-col gap-2",
    grid: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3",
  };

  return (
    <div className={className}>
      {headline && (
        <div className="mb-6">
          <Text content={headline} variant="headline" size="xl" />
        </div>
      )}

      <div className={layoutClasses[layout]}>
        {categories.map((category) => (
          <a
            key={category.id}
            href={`/storefront/shop?category=${category.slug}`}
            className="group"
          >
            <Badge
              text={`${category.name}${showProductCounts && category.product_count ? ` (${category.product_count})` : ""}`}
              variant="neutral"
              size="lg"
              outline
              className="hover:bg-white hover:text-black transition-all"
            />
          </a>
        ))}
      </div>
    </div>
  );
}
