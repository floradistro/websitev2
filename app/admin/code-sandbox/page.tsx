"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect to Storefront Builder
 */
export default function StorefrontBuilderRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.push('/storefront-builder');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <p className="text-white/60 animate-pulse">Redirecting to Storefront Builder...</p>
      </div>
    </div>
  );
}
