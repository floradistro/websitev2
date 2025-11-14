"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function POSOrdersRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/vendor/pos/orders");
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-white/60 text-xs uppercase tracking-[0.15em]">Redirecting...</div>
    </div>
  );
}
