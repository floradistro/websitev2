/**
 * Lazy-loaded components for better performance
 * Heavy components are loaded only when needed
 */

import dynamic from 'next/dynamic';

// Animation components - load on demand
export const ProductGridAnimation = dynamic(() => import('@/components/ProductGridAnimation'), {
  ssr: false,
  loading: () => null,
});

export const GlobalAnimation = dynamic(() => import('@/components/GlobalAnimation'), {
  ssr: false,
  loading: () => null,
});

export const GrowRoomAnimation = dynamic(() => import('@/components/GrowRoomAnimation'), {
  ssr: false,
  loading: () => null,
});

export const VendorWhaleAnimation = dynamic(() => import('@/components/VendorWhaleAnimation'), {
  ssr: false,
  loading: () => null,
});

export const DeliveryAnimation = dynamic(() => import('@/components/DeliveryAnimation'), {
  ssr: false,
  loading: () => null,
});

// Charts - load on demand  
export const AdminAnalytics = dynamic(() => import('@/app/admin/analytics/page'), {
  ssr: false,
  loading: () => null,
});

// Image editing - load on demand
export const ImageEditorModal = dynamic(() => import('@/components/ImageEditorModal'), {
  ssr: false,
  loading: () => null,
});

export const ImageLightbox = dynamic(() => import('@/components/ImageLightbox'), {
  ssr: false,
  loading: () => null,
});

// Heavy modals - load on demand
export const SearchModal = dynamic(() => import('@/components/SearchModal'), {
  ssr: false,
  loading: () => null,
});

// 3D/Canvas components - load on demand
export const HeroAnimation = dynamic(() => import('@/components/storefront/HeroAnimation'), {
  ssr: false,
  loading: () => null,
});

export const FlowerAnimation = dynamic(() => import('@/components/storefront/FlowerAnimation'), {
  ssr: false,
  loading: () => null,
});

