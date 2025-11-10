"use client";

import { Star } from "lucide-react";

interface ProductReviewsProps {
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    author: string;
    created_at: string;
  }>;
}

export default function ProductReviews({ reviews }: ProductReviewsProps) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-white/80 uppercase tracking-wider">
          Customer Reviews
        </h3>
        <div className="p-8 bg-white/5 border border-white/10 rounded-lg text-center">
          <Star className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">No reviews yet</p>
          <p className="text-white/30 text-sm mt-1">
            Be the first to review this product
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-white/80 uppercase tracking-wider">
        Customer Reviews
      </h3>
      <div className="space-y-3">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="p-4 bg-white/5 border border-white/10 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < review.rating
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-white/20"
                    }`}
                  />
                ))}
              </div>
              <span className="text-white/60 text-sm">{review.author}</span>
            </div>
            <p className="text-white/80">{review.comment}</p>
            <p className="text-white/40 text-xs mt-2">
              {new Date(review.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
