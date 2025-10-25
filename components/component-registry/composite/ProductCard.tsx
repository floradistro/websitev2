"use client";

/**
 * Composite Component: ProductCard
 * Pre-assembled product card with image, name, price, CTA
 */

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Image } from '../atomic/Image';
import { Text } from '../atomic/Text';
import { Button } from '../atomic/Button';
import { Badge } from '../atomic/Badge';

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    primary_image_url?: string | null;
    featured_image_storage?: string | null;
    image_url?: string | null;
    base_price?: number;
    price?: number;
  };
  showPrice?: boolean;
  showQuickAdd?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  imageAspect?: '1:1' | '4:3' | '3:4';
  cardStyle?: 'minimal' | 'bordered' | 'elevated';
  onQuickAdd?: (productId: string) => void;
  basePath?: string;
  className?: string;
}

export function ProductCard({
  product,
  showPrice = true,
  showQuickAdd = true,
  showBadge = false,
  badgeText,
  imageAspect = '1:1',
  cardStyle = 'minimal',
  onQuickAdd,
  basePath = '/storefront/products',
  className = '',
}: ProductCardProps) {
  
  const cardStyleClasses: Record<string, string> = {
    minimal: 'bg-transparent',
    bordered: 'bg-black border border-neutral-800 rounded-lg p-4',
    elevated: 'bg-neutral-900 rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow',
  };
  
  // Preserve vendor and preview params
  let productUrl = `${basePath}/${product.slug}`;
  
  try {
    const searchParams = useSearchParams();
    const vendor = searchParams?.get('vendor');
    const preview = searchParams?.get('preview');
    
    if (vendor) {
      productUrl += `?vendor=${vendor}`;
      if (preview) {
        productUrl += `&preview=${preview}`;
      }
    }
  } catch (e) {
    // If useSearchParams fails, just use basic URL
  }
  
  return (
    <div className={`group relative ${cardStyleClasses[cardStyle]} ${className}`}>
      {/* Badge */}
      {showBadge && badgeText && (
        <div className="absolute top-2 right-2 z-10">
          <Badge text={badgeText} variant="success" size="sm" />
        </div>
      )}
      
      {/* Image */}
      <a href={productUrl}>
        <div className="relative overflow-hidden rounded-lg bg-black mb-3">
          <Image
            src={product.primary_image_url || product.featured_image_storage || product.image_url || '/placeholder-product.png'}
            alt={product.name}
            aspect={imageAspect}
            fit="contain"
            className="group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </a>
      
      {/* Info */}
      <div className="space-y-2">
        <a href={productUrl}>
          <Text
            content={product.name}
            variant="paragraph"
            size="md"
            weight="medium"
            color="#ffffff"
            className="hover:text-neutral-300 transition-colors line-clamp-2"
          />
        </a>
        
        {showPrice && (product.base_price || product.price) && (
          <Text
            content={`$${((product.base_price || product.price || 0)).toFixed(2)}`}
            variant="paragraph"
            size="lg"
            weight="semibold"
            color="#ffffff"
          />
        )}
        
        {showQuickAdd && (
          <Button
            text="Quick Add"
            variant="outline"
            size="sm"
            fullWidth
            onClick={() => onQuickAdd?.(product.id)}
          />
        )}
      </div>
    </div>
  );
}

