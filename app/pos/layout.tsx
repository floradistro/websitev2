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
        }
      `}</style>
      <div className="min-h-screen bg-black text-white antialiased overflow-x-hidden">
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
