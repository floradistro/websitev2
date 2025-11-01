'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppAuthProvider, useAppAuth } from '@/context/AppAuthContext';

function POSLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, vendor } = useAppAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check vendor authentication
  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      console.log('⚠️ Not authenticated, redirecting to vendor login');
      router.push('/vendor/login?redirect=/pos');
    }
  }, [mounted, isLoading, isAuthenticated, router]);

  // Debug logging
  useEffect(() => {
    console.log('🔍 POS Layout State:', {
      mounted,
      isLoading,
      isAuthenticated,
      vendor: vendor?.store_name
    });
  }, [mounted, isLoading, isAuthenticated, vendor]);

  // Show loading while checking auth
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-white/60 text-xs uppercase tracking-[0.15em]">Loading POS...</div>
      </div>
    );
  }

  // If not authenticated, show loading while redirecting
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-white/60 text-xs uppercase tracking-[0.15em]">Redirecting...</div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        html, body {
          overflow: hidden !important;
          height: 100% !important;
          position: fixed !important;
          width: 100% !important;
          touch-action: pan-x pan-y;
        }
        /* iOS PWA - Full height viewport */
        @supports (-webkit-touch-callout: none) {
          html, body {
            height: -webkit-fill-available !important;
          }
        }
        /* Smooth touch scrolling for mobile */
        * {
          -webkit-overflow-scrolling: touch;
        }
        /* Disable pull-to-refresh */
        body {
          overscroll-behavior: none;
        }
        /* Allow touches on buttons and interactive elements */
        button, a, input, select, textarea {
          touch-action: manipulation;
        }
      `}</style>
      {/* PWA Safe Area Spacer for iOS status bar */}
      <div
        className="fixed top-0 left-0 right-0 z-50 pointer-events-none bg-black"
        style={{
          height: 'env(safe-area-inset-top, 0px)'
        }}
      />
      <div
        className="h-screen bg-black text-white antialiased overflow-hidden"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        {children}
      </div>
    </>
  );
}

export default function POSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppAuthProvider>
      <POSLayoutInner>
        {children}
      </POSLayoutInner>
    </AppAuthProvider>
  );
}
