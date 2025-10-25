/**
 * Atomic Component: Image
 * Renders images with aspect ratios, fit modes, and optimization
 */

import React from 'react';
import NextImage from 'next/image';

export interface ImageProps {
  src: string;
  alt: string;
  aspect?: '1:1' | '4:3' | '16:9' | '21:9' | '3:4' | '9:16' | 'auto';
  fit?: 'contain' | 'cover' | 'fill' | 'none';
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  quality?: number;
  priority?: boolean;
  className?: string;
  onClick?: () => void;
  loading?: 'lazy' | 'eager';
}

export function Image({
  src,
  alt,
  aspect = 'auto',
  fit = 'cover',
  position = 'center',
  radius = 'none',
  quality = 85,
  priority = false,
  className = '',
  onClick,
  loading = 'lazy',
}: ImageProps) {
  
  // Aspect ratio classes
  const aspectClasses: Record<string, string> = {
    '1:1': 'aspect-square',
    '4:3': 'aspect-[4/3]',
    '16:9': 'aspect-video',
    '21:9': 'aspect-[21/9]',
    '3:4': 'aspect-[3/4]',
    '9:16': 'aspect-[9/16]',
    auto: '',
  };
  
  // Fit classes
  const fitClasses: Record<string, string> = {
    contain: 'object-contain',
    cover: 'object-cover',
    fill: 'object-fill',
    none: 'object-none',
  };
  
  // Position classes
  const positionClasses: Record<string, string> = {
    center: 'object-center',
    top: 'object-top',
    bottom: 'object-bottom',
    left: 'object-left',
    right: 'object-right',
  };
  
  // Radius classes
  const radiusClasses: Record<string, string> = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };
  
  const combinedClasses = [
    aspectClasses[aspect],
    fitClasses[fit],
    positionClasses[position],
    radiusClasses[radius],
    'w-full',
    onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : '',
    className,
  ].filter(Boolean).join(' ');
  
  // Validate image URL
  const isValidUrl = src && !src.includes('example.com') && (src.startsWith('http') || src.startsWith('/'));
  
  // Use Next.js Image for optimization (if valid URL)
  if (aspect !== 'auto' && isValidUrl) {
    return (
      <div className={`relative overflow-hidden ${aspectClasses[aspect]} ${radiusClasses[radius]}`}>
        <NextImage
          src={src}
          alt={alt}
          fill
          quality={quality}
          priority={priority}
          className={`${fitClasses[fit]} ${positionClasses[position]}`}
          onClick={onClick}
          loading={loading}
          unoptimized={!src.startsWith('http')}
        />
      </div>
    );
  }
  
  // Native img fallback (for invalid URLs or auto aspect)
  return (
    <img
      src={isValidUrl ? src : '/placeholder-product.png'}
      alt={alt}
      className={combinedClasses}
      onClick={onClick}
      loading={loading}
      onError={(e) => {
        e.currentTarget.src = '/placeholder-product.png';
      }}
    />
  );
}

