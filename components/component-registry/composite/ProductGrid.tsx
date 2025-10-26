/**
 * Composite Component: ProductGrid
 * Grid layout for displaying multiple products
 */

import React from 'react';
import { ProductCard } from './ProductCard';

export interface ProductGridProps {
  products: any[];
  locations?: any[];
  columns?: 2 | 3 | 4 | 5;
  gap?: 'sm' | 'md' | 'lg';
  showPrice?: boolean;
  showQuickAdd?: boolean;
  imageAspect?: '1:1' | '4:3' | '3:4';
  cardStyle?: 'minimal' | 'bordered' | 'elevated';
  onQuickAdd?: (productId: string) => void;
  basePath?: string;
  vendorId?: string;
  className?: string;
}

export function ProductGrid({
  products,
  locations = [],
  columns = 3,
  gap = 'md',
  showPrice = true,
  showQuickAdd = true,
  imageAspect = '1:1',
  cardStyle = 'minimal',
  onQuickAdd,
  basePath = '/storefront/products',
  vendorId,
  className = '',
}: ProductGridProps) {
  
  const columnClasses: Record<number, string> = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
  };
  
  const gapClasses: Record<string, string> = {
    sm: 'gap-3 sm:gap-4',
    md: 'gap-4 sm:gap-6',
    lg: 'gap-6 sm:gap-8',
  };
  
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-500">No products available</p>
      </div>
    );
  }
  
  return (
    <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]} pt-4 sm:pt-8 px-0 ${className}`} style={{ overflow: 'visible' }}>
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          index={index}
          locations={locations}
          showPrice={showPrice}
          showQuickAdd={showQuickAdd}
          imageAspect={imageAspect}
          cardStyle={cardStyle}
          onQuickAdd={onQuickAdd}
          basePath={basePath}
          vendorId={vendorId}
        />
      ))}
    </div>
  );
}

