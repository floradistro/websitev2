"use client";

import { useState } from "react";
import { Star, ChevronDown } from "lucide-react";

interface Review {
  id: number;
  product_id: number;
  reviewer: string;
  reviewer_email: string;
  review: string;
  rating: number;
  verified: boolean;
  date_created: string;
}

interface ProductReviewsProps {
  reviews: Review[];
}

export default function ProductReviews({ reviews }: ProductReviewsProps) {
  const [showAll, setShowAll] = useState(false);

  if (!reviews || reviews.length === 0) {
    return null;
  }

  // Calculate average rating
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  
  // Calculate rating distribution
  const ratingCounts = [0, 0, 0, 0, 0];
  reviews.forEach(review => {
    ratingCounts[review.rating - 1]++;
  });

  // Show only first 3 reviews initially
  const visibleReviews = showAll ? reviews : reviews.slice(0, 3);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="border border-white/20 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Star size={14} className="fill-white text-white" strokeWidth={1.5} />
          <span className="text-xs uppercase tracking-[0.12em] text-white/80">
            {averageRating.toFixed(1)} ({reviews.length})
          </span>
        </div>
        {reviews.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-white/60 uppercase tracking-wider hover:text-white transition-colors"
          >
            {showAll ? "Show Less" : "Show All"}
          </button>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {visibleReviews.map((review) => (
          <div key={review.id} className="pb-3 border-b border-white/10 last:border-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs uppercase tracking-[0.12em] text-white/60">
                  {review.reviewer}
                </span>
                <span className="text-[10px] text-white/40 tracking-wide">
                  {formatDate(review.date_created)}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={10}
                    className={`${
                      star <= review.rating ? "fill-white text-white" : "text-white/30"
                    }`}
                    strokeWidth={1.5}
                  />
                ))}
              </div>
            </div>
            <div
              className="text-xs text-white/80 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: review.review }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

