"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the mega launch pad
    router.replace("/vendor/apps");
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white/60 text-sm uppercase tracking-wider animate-pulse">
        Loading...
      </div>
    </div>
  );
}
