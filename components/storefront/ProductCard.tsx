'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  retail_price: number;
  category: string;
  slug: string;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.images && product.images.length > 0 
    ? product.images[0] 
    : '/placeholder-product.png';

  const price = typeof product.retail_price === 'number' 
    ? product.retail_price.toFixed(2)
    : '0.00';

  return (
    <Link href={`/products/${product.slug || product.id}`}>
      <div className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer">
        {/* Product Image */}
        <div className="aspect-square overflow-hidden bg-gray-100">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Product Info */}
        <div className="p-4">
          <div className="mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide">
              {product.category || 'Product'}
            </span>
          </div>
          
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-gray-700">
            {product.name}
          </h3>
          
          <p className="text-gray-600 text-sm line-clamp-2 mb-4">
            {product.description}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              ${price}
            </span>
            
            <button 
              className="p-2 rounded-full transition-all hover:scale-110"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-secondary)'
              }}
              onClick={(e) => {
                e.preventDefault();
                // TODO: Add to cart functionality
                console.log('Add to cart:', product.id);
              }}
            >
              <ShoppingCart size={18} />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

