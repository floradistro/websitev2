"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppAuth } from "@/context/AppAuthContext";

function POSLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, vendor } = useAppAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check vendor authentication - DISABLED for POS
  // POS works without vendor login (uses register assignment instead)
  // useEffect(() => {
  //   if (mounted && !isLoading && !isAuthenticated) {
  //
  //     router.push('/vendor/login?redirect=/pos');
  //   }
  // }, [mounted, isLoading, isAuthenticated, router]);

  // Debug logging
  useEffect(() => {}, [mounted, isLoading, isAuthenticated, vendor]);

  // Show loading while checking auth
  if (!mounted) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-white/60 text-xs uppercase tracking-[0.15em]">Loading POS...</div>
      </div>
    );
  }

  // POS doesn't require authentication - allow access for register selection
  // Authentication is handled per-register via device assignment

  return (
    <>
      <style jsx global>{`
        html,
        body {
          overflow: hidden !important;
          height: 100vh !important;
          height: 100dvh !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          touch-action: pan-x pan-y;
        }
        /* iOS PWA - Full height viewport */
        @supports (-webkit-touch-callout: none) {
          html,
          body {
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
        button,
        a,
        input,
        select,
        textarea {
          touch-action: manipulation;
        }
      `}</style>
      {/* PWA Safe Area Spacer for iOS status bar */}
      <div
        className="fixed top-0 left-0 right-0 z-50 pointer-events-none bg-black"
        style={{
          height: "env(safe-area-inset-top, 0px)",
        }}
      />
      <div
        className="bg-black text-white antialiased"
        style={{
          height: "100%",
          width: "100%",
          paddingTop: "env(safe-area-inset-top, 0px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>
    </>
  );
}

export default function POSLayout({ children }: { children: React.ReactNode }) {
  // AppAuthProvider moved to root Providers - no longer duplicated here
  return <POSLayoutInner>{children}</POSLayoutInner>;
}
