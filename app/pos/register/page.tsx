"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function POSRegisterRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to new location
    router.replace("/vendor/pos/register");
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-white/60 text-xs uppercase tracking-[0.15em]">Redirecting...</div>
    </div>
  );
}
