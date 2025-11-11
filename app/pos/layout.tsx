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

  return <div className="fixed inset-0 bg-[#0a0a0a] text-white overflow-hidden">{children}</div>;
}

export default function POSLayout({ children }: { children: React.ReactNode }) {
  // AppAuthProvider moved to root Providers - no longer duplicated here
  return <POSLayoutInner>{children}</POSLayoutInner>;
}
