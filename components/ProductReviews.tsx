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
    <div className="-mx-3 md:mx-0 mb-6 md:mb-8">
      <div className="bg-white/5 backdrop-blur-sm md:rounded-lg border-y md:border border-white/10">
        {/* Modern Rating Header */}
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex flex-col md:flex-row items-center md:items-center gap-6 justify-center md:justify-start">
            {/* Rating Score */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-5xl font-light text-white mb-1">
                  {averageRating.toFixed(1)}
                </div>
                <div className="flex items-center gap-1 mb-1 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={16}
                      className={`${
                        star <= Math.round(averageRating)
                          ? "fill-white text-white"
                          : "text-white/30"
                      }`}
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
                <div className="text-xs text-white/50 font-light uppercase tracking-wider">
                  {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
                </div>
              </div>
            </div>

            {/* Rating Bars */}
            <div className="flex-1 space-y-2 w-full md:max-w-xs">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingCounts[rating - 1];
                const percentage = (count / reviews.length) * 100;
                return (
                  <div key={rating} className="flex items-center gap-3">
                    <span className="text-xs text-white/50 font-light w-8">{rating} ★</span>
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-white/50 font-light w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="divide-y divide-white/10">
          {visibleReviews.map((review, idx) => (
            <div
              key={review.id}
              style={{ animationDelay: `${idx * 50}ms` }}
              className="animate-fadeIn px-6 py-5 hover:bg-white/5 transition-colors duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-semibold text-white">
                      {review.reviewer}
                    </span>
                    {review.verified && (
                      <span className="text-xs bg-white/10 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-white/50 font-light">
                    {formatDate(review.date_created)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={14}
                      className={`${
                        star <= review.rating
                          ? "fill-white text-white"
                          : "text-white/30"
                      }`}
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
              </div>
              <div
                className="text-sm text-white/80 leading-relaxed font-light"
                dangerouslySetInnerHTML={{ __html: review.review }}
              />
            </div>
          ))}
        </div>

        {/* Show More Button */}
        {reviews.length > 3 && (
          <div className="px-6 py-4 border-t border-white/10">
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm font-semibold text-white uppercase tracking-wider"
            >
              {showAll ? (
                <>
                  Show Less
                  <ChevronDown size={16} className="rotate-180 transition-transform duration-300" />
                </>
              ) : (
                <>
                  Show All {reviews.length} Reviews
                  <ChevronDown size={16} className="transition-transform duration-300" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

