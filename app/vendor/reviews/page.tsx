"use client";

import { useEffect, useState } from 'react';
import { Star, Search, MessageSquare, ThumbsUp, User, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Review {
  id: number;
  productId: number;
  productName: string;
  customerName: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
  response?: string;
  responseDate?: string;
}

export default function VendorReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    // TODO: Fetch from API: /vendor-marketplace/v1/reviews
    setTimeout(() => {
      setReviews([
        {
          id: 1,
          productId: 50002,
          productName: 'Blue Dream',
          customerName: 'Jordan Cooper',
          rating: 5,
          date: '2025-10-17',
          comment: 'Classic Blue Dream done right! Perfect balance of effects. Quality is unmatched.',
          verified: true,
        },
        {
          id: 2,
          productId: 50001,
          productName: 'OG Kush',
          customerName: 'Marcus Thompson',
          rating: 5,
          date: '2025-10-16',
          comment: 'Best OG Kush I\'ve had in years. That classic piney kush smell and flavor. Super fresh, great cure.',
          verified: true,
          response: 'Thank you for the amazing review! We take pride in our cultivation process. Looking forward to serving you again!',
          responseDate: '2025-10-16'
        },
        {
          id: 3,
          productId: 50005,
          productName: 'Gelato',
          customerName: 'Alasia Chestnut',
          rating: 5,
          date: '2025-10-15',
          comment: 'This Gelato is incredible. Sweet, creamy, and potent. Always delivers!',
          verified: true,
        },
        {
          id: 4,
          productId: 50004,
          productName: 'Girl Scout Cookies',
          customerName: 'Zachariah Kryger',
          rating: 5,
          date: '2025-10-14',
          comment: 'Legendary GSC cut. Minty, sweet, and strong. Exactly what I wanted.',
          verified: true,
          response: 'We appreciate your support! Our GSC is a customer favorite.',
          responseDate: '2025-10-14'
        },
        {
          id: 5,
          productId: 50008,
          productName: 'Zkittlez',
          customerName: 'Brendon Balzano',
          rating: 5,
          date: '2025-10-13',
          comment: 'Fire! The Zkittlez is exactly as advertised. Fruity smell, smooth smoke, perfect high.',
          verified: true,
        },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleRespond = (reviewId: number) => {
    setRespondingTo(reviewId);
    setResponseText('');
  };

  const submitResponse = (reviewId: number) => {
    // TODO: Submit response to API
    setRespondingTo(null);
    setResponseText('');
  };

  const filteredReviews = reviews.filter(review =>
    review.productName.toLowerCase().includes(search.toLowerCase()) ||
    review.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length || 0;
  const needsResponse = reviews.filter(r => !r.response).length;

  return (
    <div className="w-full max-w-full animate-fadeIn px-4 lg:px-0 py-6 lg:py-0 overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 lg:mb-8" style={{ animation: 'fadeInUp 0.5s ease-out' }}>
        <h1 className="text-2xl lg:text-3xl font-light text-white mb-2 tracking-tight">
          Customer Reviews
        </h1>
        <p className="text-white/60 text-xs lg:text-sm">
          Manage and respond to customer feedback
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4 mb-6" style={{ animation: 'fadeInUp 0.6s ease-out 0.1s both' }}>
        <div className="bg-[#1a1a1a] border border-white/5 p-6 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white/60 text-xs uppercase tracking-wider">Total Reviews</div>
              <MessageSquare size={20} className="text-white/40" />
            </div>
            <div className="text-3xl font-light text-white mb-1">{reviews.length}</div>
            <div className="text-white/40 text-xs">All products</div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-white/5 p-6 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white/60 text-xs uppercase tracking-wider">Average Rating</div>
              <Star size={20} className="text-white/40 fill-white/40" />
            </div>
            <div className="text-3xl font-light text-white mb-1">{avgRating.toFixed(1)}</div>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  size={14}
                  className={star <= Math.round(avgRating) ? 'text-white fill-white' : 'text-white/20'}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-white/5 p-6 hover:border-white/10 hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="text-white/60 text-xs uppercase tracking-wider">Needs Response</div>
              <MessageSquare size={20} className="text-white/40" />
            </div>
            <div className="text-3xl font-light text-white mb-1">{needsResponse}</div>
            <div className="text-white/40 text-xs">Awaiting reply</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 -mx-4 lg:mx-0" style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}>
        <div className="relative px-4 lg:px-0">
          <Search size={18} className="absolute left-7 lg:left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search by product or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 pl-10 pr-4 py-3 focus:outline-none focus:border-white/10 transition-colors text-base"
          />
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-0 lg:space-y-4 -mx-4 lg:mx-0" style={{ animation: 'fadeInUp 0.6s ease-out 0.3s both' }}>
        {filteredReviews.map((review) => (
          <div key={review.id} className="bg-[#1a1a1a] lg:border border-t lg:border-t border-white/5 lg:hover:border-white/10 transition-all">
            {/* Review Header */}
            <div className="px-4 lg:p-6 py-4 border-b border-white/5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User size={16} className="text-white/40" />
                    <span className="text-white font-medium">{review.customerName}</span>
                    {review.verified && (
                      <span className="px-2 py-0.5 bg-white/5 text-white/60 text-xs border border-white/10">
                        Verified
                      </span>
                    )}
                  </div>
                  <Link 
                    href={`/vendor/products/${review.productId}/edit`}
                    className="text-white/60 hover:text-white text-sm transition-colors"
                  >
                    {review.productName}
                  </Link>
                </div>
                <div className="text-right">
                  <div className="flex gap-0.5 mb-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={16}
                        className={star <= review.rating ? 'text-white fill-white' : 'text-white/20'}
                      />
                    ))}
                  </div>
                  <div className="text-white/40 text-xs">{new Date(review.date).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Review Comment */}
              <p className="text-white/80 text-sm leading-relaxed break-words">{review.comment}</p>
            </div>

            {/* Response Section */}
            {review.response ? (
              <div className="px-4 lg:p-6 py-4 bg-white/5">
                <div className="flex items-start gap-3">
                  <MessageSquare size={16} className="text-white/60 flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="text-white/40 text-xs mb-2">Your Response • {new Date(review.responseDate!).toLocaleDateString()}</div>
                    <p className="text-white/80 text-sm leading-relaxed break-words">{review.response}</p>
                  </div>
                </div>
              </div>
            ) : respondingTo === review.id ? (
              <div className="px-4 lg:p-6 py-4 bg-white/5">
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Write your response..."
                  rows={3}
                  className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 px-4 py-3 mb-3 focus:outline-none focus:border-white/10 transition-colors resize-none text-base"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setRespondingTo(null)}
                    className="px-4 py-2 bg-black text-white border border-white/20 hover:bg-white hover:text-black hover:border-white text-xs uppercase tracking-wider transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => submitResponse(review.id)}
                    className="px-4 py-2 bg-black text-white border border-white/20 hover:bg-white hover:text-black hover:border-white text-xs uppercase tracking-wider transition-all duration-300"
                  >
                    Submit Response
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 lg:p-4 py-3 border-t border-white/5">
                <button
                  onClick={() => handleRespond(review.id)}
                  className="text-white/60 hover:text-white text-xs uppercase tracking-wider transition-colors flex items-center gap-2"
                >
                  <MessageSquare size={14} />
                  Respond to Review
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

