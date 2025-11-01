'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ResetPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();

    // Clear cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    // Wait a moment then redirect
    setTimeout(() => {
      alert('✅ All data cleared! Redirecting to POS...');
      router.push('/pos/register');
    }, 1000);
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-8">🧹</div>
        <h1 className="text-2xl font-bold mb-4 uppercase tracking-tight">Clearing Data...</h1>
        <p className="text-white/60 text-sm uppercase tracking-wider">
          Removing cached authentication
        </p>
        <div className="mt-8 text-xs text-white/40">
          <p>✓ Clearing localStorage</p>
          <p>✓ Clearing sessionStorage</p>
          <p>✓ Clearing cookies</p>
        </div>
      </div>
    </div>
  );
}
