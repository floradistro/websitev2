/**
 * Default Template - Product Card Component
 * Simple product card design
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

interface ProductCardProps {
  product: any;
  vendorSlug: string;
  locations?: any[];
}

export default function ProductCard({ product, vendorSlug, locations = [] }: ProductCardProps) {
  const pathname = usePathname();
  const basePath = pathname?.startsWith('/storefront') ? '/storefront' : '';
  
  const imageUrl = product.featured_image_storage || 
                   (product.image_gallery_storage && product.image_gallery_storage[0]) ||
                   '/placeholder-product.png';
  
  const inStock = product.total_stock > 0;
  const price = product.price || product.regular_price || 0;

  return (
    <Link 
      href={`${basePath}/products/${product.slug}`}
      className="group block bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-100">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {!inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-900 px-3 py-1 rounded-full text-sm font-semibold">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
          {product.name}
        </h3>
        
        {product.categories && product.categories.length > 0 && (
          <p className="text-sm text-gray-600 mb-2">
            {product.categories[0].name}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">
            ${parseFloat(price).toFixed(2)}
          </span>
          {inStock && (
            <span className="text-sm text-green-600 font-medium">
              In Stock
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

