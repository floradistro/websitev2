'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';

interface OptimizedProductImageProps {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  sizes?: string;
  quality?: number;
}

/**
 * Optimized Product Image with lazy loading, blur placeholder, and error handling
 * Prevents memory leaks and improves performance
 */
export default function OptimizedProductImage({
  src,
  alt,
  fill = false,
  width,
  height,
  priority = false,
  className = '',
  sizes,
  quality = 75,
}: OptimizedProductImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(src || '/placeholder-product.jpg');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    
    // Update source if prop changes
    if (src && src !== imgSrc && !hasError) {
      setImgSrc(src);
      setIsLoading(true);
    }

    return () => {
      mountedRef.current = false;
    };
  }, [src]);

  const handleLoad = () => {
    if (mountedRef.current) {
      setIsLoading(false);
      setHasError(false);
    }
  };

  const handleError = () => {
    if (mountedRef.current) {
      setHasError(true);
      setIsLoading(false);
      setImgSrc('/placeholder-product.jpg');
    }
  };

  // Common image props
  const imageProps = {
    src: imgSrc,
    alt: alt || 'Product image',
    onLoad: handleLoad,
    onError: handleError,
    className: `${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`,
    quality,
    sizes: sizes || fill ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw' : undefined,
    priority,
  };

  return (
    <div className={`relative ${fill ? 'w-full h-full' : ''} bg-neutral-900`}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-neutral-800 animate-pulse rounded" />
      )}
      
      {/* Image */}
      {fill ? (
        <Image
          {...imageProps}
          fill
          style={{ objectFit: 'cover' }}
        />
      ) : (
        <Image
          {...imageProps}
          width={width || 400}
          height={height || 400}
          style={{ objectFit: 'cover' }}
        />
      )}
    </div>
  );
}

