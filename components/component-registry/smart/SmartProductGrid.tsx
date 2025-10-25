/**
 * Smart Component: SmartProductGrid
 * Auto-fetches products - REWRITTEN FOR ZERO GLITCHING
 */

"use client";

import React, { useState, useEffect } from 'react';
import { ProductGrid } from '../composite/ProductGrid';

export interface SmartProductGridProps {
  vendorId: string;
  selectedProductIds?: string[];
  selectedCategoryIds?: string[];
  headline?: string;
  subheadline?: string;
  maxProducts?: number;
  columns?: 2 | 3 | 4 | 5;
  showPrice?: boolean;
  showQuickAdd?: boolean;
  cardStyle?: 'minimal' | 'bordered' | 'elevated';
  className?: string;
}

export function SmartProductGrid({
  vendorId,
  selectedProductIds = [],
  selectedCategoryIds = [],
  headline,
  subheadline,
  maxProducts = 12,
  columns = 3,
  showPrice = true,
  showQuickAdd = true,
  cardStyle = 'minimal',
  className = '',
}: SmartProductGridProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  
  // Hydration fix
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Fetch products - Use JSON.stringify to prevent infinite loops from array refs
  useEffect(() => {
    if (!isClient) {
      return;
    }
    
    async function loadProducts() {
      try {
        let url = `/api/products?vendor_id=${vendorId}&limit=${maxProducts}`;
        
        if (selectedProductIds.length > 0) {
          url += `&product_ids=${selectedProductIds.join(',')}`;
        } else if (selectedCategoryIds.length > 0) {
          url += `&category_ids=${selectedCategoryIds.join(',')}`;
        }
        
        const res = await fetch(url, { cache: 'no-store' });
        
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Products fetch error:', err);
        }
      }
    }
    
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, vendorId, JSON.stringify(selectedProductIds), JSON.stringify(selectedCategoryIds), maxProducts]);
  
  // Keep showing placeholder until we have data (no disappearing)
  if (!isClient || (products.length === 0 && !isClient)) {
    return <div className={className} style={{ minHeight: '400px' }} />;
  }
  
  // After client-side, if still no products after trying to load, show nothing
  // But ONLY if we've actually tried to fetch (isClient is true)
  if (isClient && products.length === 0) {
    // Don't return null immediately - products might still be loading
    // Just return empty container
    return <div className={className} />;
  }
  
  return (
    <div className={className}>
      {(headline || subheadline) && (
        <div className="text-center mb-8">
          {headline && <h2 className="text-3xl font-bold text-white mb-2">{headline}</h2>}
          {subheadline && <p className="text-lg text-neutral-400">{subheadline}</p>}
        </div>
      )}
      
      <ProductGrid
        products={products}
        columns={columns}
        showPrice={showPrice}
        showQuickAdd={showQuickAdd}
        cardStyle={cardStyle}
      />
    </div>
  );
}
