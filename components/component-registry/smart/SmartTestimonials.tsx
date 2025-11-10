/**
 * Smart Component: SmartTestimonials
 * Auto-fetches reviews - REWRITTEN FOR ZERO GLITCHING
 */

"use client";

import React, { useState, useEffect } from "react";

export interface SmartTestimonialsProps {
  vendorId: string;
  productId?: string;
  limit?: number;
  minRating?: number;
  layout?: "carousel" | "grid" | "list";
  showProductName?: boolean;
  className?: string;
}

export function SmartTestimonials({
  vendorId,
  productId,
  limit = 6,
  minRating = 1,
  layout = "grid",
  showProductName = true,
  className = "",
}: SmartTestimonialsProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Hydration fix
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch reviews
  useEffect(() => {
    if (!isClient) return;

    async function loadReviews() {
      try {
        let url = `/api/reviews?vendor_id=${vendorId}&limit=${limit}`;

        if (productId) url += `&product_id=${productId}`;
        if (minRating > 1) url += `&min_rating=${minRating}`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setReviews(data.reviews || []);
        }
      } catch (err) {
        // Silent fail
      }
    }

    loadReviews();
  }, [isClient, vendorId, productId, minRating, limit]);

  // SSR: render placeholder
  if (!isClient) {
    return <div className={className} style={{ minHeight: "300px" }} />;
  }

  // No reviews: show nothing
  if (reviews.length === 0) {
    return <div className={className} />;
  }

  const layoutClass =
    layout === "grid"
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      : layout === "carousel"
        ? "flex overflow-x-auto gap-6 snap-x"
        : "flex flex-col gap-6";

  return (
    <div className={className}>
      <div className={layoutClass}>
        {reviews.map((review) => (
          <div
            key={review.id}
            className={`bg-[#0a0a0a] rounded-2xl p-6 border border-white/5 ${layout === "carousel" ? "min-w-[300px] snap-start" : ""}`}
          >
            {/* Rating stars */}
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={
                    i < review.rating ? "text-yellow-400" : "text-neutral-600"
                  }
                >
                  {i < review.rating ? "⭐" : "☆"}
                </span>
              ))}
            </div>

            {/* Review text */}
            {review.review_text && (
              <p className="text-white italic mb-4">"{review.review_text}"</p>
            )}

            {/* Reviewer name */}
            <div className="flex items-center gap-2">
              <p
                className="text-sm font-black uppercase tracking-[0.08em] text-white"
                style={{ fontWeight: 900 }}
              >
                {review.customer_name || "Customer"}
              </p>
              {review.verified && (
                <span className="px-2 py-0.5 text-xs bg-green-600 text-white rounded-full">
                  Verified
                </span>
              )}
            </div>

            {/* Product name */}
            {showProductName && review.product_name && (
              <p className="text-xs text-neutral-500 mt-2">
                Product: {review.product_name}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
