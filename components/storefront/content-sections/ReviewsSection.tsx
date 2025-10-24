"use client";

import { Star } from 'lucide-react';

interface Review {
  rating: number;
  quote: string;
  customer_name: string;
  product?: string;
}

interface ReviewsSectionProps {
  content: {
    headline: string;
    show_count?: boolean;
    max_display?: number;
    layout?: 'carousel' | 'grid';
  };
  reviews: Review[];
  templateStyle?: 'minimalist' | 'luxury' | 'bold' | 'organic';
}

export function ReviewsSection({ content, reviews, templateStyle = 'minimalist' }: ReviewsSectionProps) {
  // Transform reviews to handle nested objects from database
  const transformedReviews = reviews.map((review: any) => ({
    rating: review.rating || 5,
    quote: review.review_text || review.quote || review.title || '',
    customer_name: review.customer_name || 
                   (review.customer ? `${review.customer.first_name} ${review.customer.last_name?.charAt(0)}.` : 'Customer'),
    product: typeof review.product === 'string' ? review.product : review.product?.name || ''
  }));

  const displayReviews = transformedReviews.slice(0, content.max_display || 6);

  const styles = {
    minimalist: {
      container: 'py-20 bg-[#0a0a0a]',
      header: 'flex items-center justify-between mb-12',
      headline: 'text-3xl md:text-4xl font-light text-white',
      count: 'text-white/40 text-sm',
      grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
      card: 'bg-white/5 border border-white/10 p-6 rounded-lg',
      stars: 'flex gap-1 mb-4',
      star: 'text-white/80',
      quote: 'text-white/70 text-sm mb-4 leading-relaxed',
      author: 'text-white/50 text-xs',
      product: 'text-white/30 text-xs',
    },
    luxury: {
      container: 'py-32 bg-gradient-to-b from-neutral-900 to-black',
      header: 'text-center mb-16',
      headline: 'text-5xl md:text-6xl font-serif font-light text-amber-100',
      count: 'text-amber-200/60 text-base mt-2',
      grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8',
      card: 'bg-gradient-to-br from-amber-950/30 to-transparent border border-amber-500/10 p-8 rounded-xl',
      stars: 'flex gap-1 mb-6 justify-center',
      star: 'text-amber-400',
      quote: 'text-amber-200/80 text-lg mb-6 leading-relaxed font-light italic text-center',
      author: 'text-amber-200/60 text-sm text-center',
      product: 'text-amber-200/40 text-xs text-center mt-1',
    },
    bold: {
      container: 'py-24 bg-gradient-to-br from-pink-900 to-purple-900',
      header: 'text-center mb-14',
      headline: 'text-6xl md:text-7xl font-black text-white',
      count: 'text-white/70 text-xl mt-3 font-bold',
      grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
      card: 'bg-white/10 backdrop-blur border-2 border-white/20 p-8 rounded-2xl hover:scale-105 transition-transform',
      stars: 'flex gap-1 mb-4',
      star: 'text-yellow-400',
      quote: 'text-white/90 text-lg mb-4 leading-relaxed font-medium',
      author: 'text-white/70 text-sm font-semibold',
      product: 'text-white/50 text-xs mt-1',
    },
    organic: {
      container: 'py-28 bg-emerald-950',
      header: 'text-center mb-14',
      headline: 'text-4xl md:text-5xl font-light text-green-100',
      count: 'text-green-200/60 text-base mt-2',
      grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8',
      card: 'bg-green-900/20 border border-green-500/10 p-6 rounded-3xl',
      stars: 'flex gap-1 mb-4',
      star: 'text-green-400',
      quote: 'text-green-200/80 text-base mb-4 leading-relaxed',
      author: 'text-green-200/60 text-sm',
      product: 'text-green-200/40 text-xs mt-1',
    },
  };

  const style = styles[templateStyle];

  return (
    <div className={style.container}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className={style.header}>
          <h2 className={style.headline}>{content.headline}</h2>
          {content.show_count && (
            <p className={style.count}>{reviews.length} reviews</p>
          )}
        </div>
        
        <div className={style.grid}>
          {displayReviews.map((review, index) => (
            <div key={index} className={style.card}>
              <div className={style.stars}>
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={16} 
                    className={style.star}
                    fill={i < review.rating ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <p className={style.quote}>"{String(review.quote || '')}"</p>
              <p className={style.author}>{String(review.customer_name || 'Customer')}</p>
              {review.product && (
                <p className={style.product}>{String(review.product)}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

