'use client';

import Link from 'next/link';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { showToast } from './NotificationToast';
import { useState, useEffect, useRef } from 'react';
import OptimizedProductImage from './OptimizedProductImage';

interface StableProductCardProps {
  product: any;
  priority?: boolean;
}

/**
 * Stable Product Card with proper cleanup and no memory leaks
 */
export default function StableProductCard({ product, priority = false }: StableProductCardProps) {
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [isAdding, setIsAdding] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const mountedRef = useRef(true);

  // Sync wishlist state
  useEffect(() => {
    mountedRef.current = true;
    setIsWishlisted(isInWishlist(product.uuid || product.id));

    return () => {
      mountedRef.current = false;
    };
  }, [product.id, product.uuid, isInWishlist]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAdding || !mountedRef.current) return;

    setIsAdding(true);
    try {
      await addToCart(product, 1);
      if (mountedRef.current) {
        showToast(`Added ${product.name} to cart`, 'success');
      }
    } catch (error) {
      if (mountedRef.current) {
        showToast('Failed to add to cart', 'error');
      }
    } finally {
      if (mountedRef.current) {
        setIsAdding(false);
      }
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!mountedRef.current) return;

    if (isWishlisted) {
      removeFromWishlist(product.uuid || product.id);
      showToast('Removed from wishlist', 'info');
    } else {
      addToWishlist(product);
      showToast('Added to wishlist', 'success');
    }
  };

  const imageUrl = product.featured_image || 
                   product.featured_image_storage || 
                   (product.images && product.images[0]?.src);

  const price = product.sale_price || product.price || product.regular_price || 0;
  const regularPrice = product.regular_price || 0;
  const onSale = product.on_sale || (product.sale_price && product.sale_price < regularPrice);

  return (
    <Link 
      href={`/products/${product.id}`}
      className="group block bg-neutral-900 rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-neutral-800">
        <OptimizedProductImage
          src={imageUrl}
          alt={product.name}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Sale Badge */}
        {onSale && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
            SALE
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className={`absolute top-2 right-2 p-2 rounded-full transition-all ${
            isWishlisted 
              ? 'bg-red-600 text-white' 
              : 'bg-black/50 text-white hover:bg-black/70'
          }`}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-medium text-white mb-1 line-clamp-2 group-hover:text-amber-400 transition-colors">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-white">
            ${parseFloat(price).toFixed(2)}
          </span>
          {onSale && regularPrice > 0 && (
            <span className="text-sm text-neutral-400 line-through">
              ${parseFloat(regularPrice).toFixed(2)}
            </span>
          )}
        </div>

        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          disabled={isAdding || product.stock_status === 'outofstock'}
          className="w-full bg-white text-black py-2 px-4 rounded-lg font-medium hover:bg-amber-400 transition-colors disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <ShoppingCart size={16} />
          {isAdding ? 'Adding...' : product.stock_status === 'outofstock' ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  );
}

