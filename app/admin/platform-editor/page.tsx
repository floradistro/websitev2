"use client";

import dynamic from 'next/dynamic';

// Lazy load the platform editor component
const PlatformEditorClient = dynamic(() => import('./PlatformEditorClient'), {
  loading: () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white/60 text-sm uppercase tracking-wider">Loading Platform Editor...</p>
      </div>
    </div>
  ),
});

export default function PlatformEditorPage() {
  return <PlatformEditorClient />;
}
