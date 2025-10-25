"use client";

import dynamic from 'next/dynamic';

// Lazy load the heavy media library component
const MediaLibraryClient = dynamic(() => import('./MediaLibraryClient'), {
  loading: () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white/60 text-sm uppercase tracking-wider">Loading Media Library...</p>
      </div>
    </div>
  ),
  ssr: false,
});

export default function MediaLibraryPage() {
  return <MediaLibraryClient />;
}
