/**
 * Lazy-loaded components for better performance
 * Heavy components are loaded only when needed
 */

import dynamic from 'next/dynamic';

export const VendorWhaleAnimation = dynamic(() => import('@/components/VendorWhaleAnimation'), {
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

