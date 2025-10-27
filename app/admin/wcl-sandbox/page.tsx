"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FlaskConical } from 'lucide-react';

/**
 * WCL Sandbox - Admin Dashboard Entry Point
 * Redirects to the full WCL Editor
 */
export default function WCLSandboxPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the standalone WCL editor
    router.push('/wcl-editor');
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-6">
          <FlaskConical size={32} className="text-white/40" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
          Launching WCL Sandbox
        </h1>
        <p className="text-white/40 text-sm tracking-wide">
          Redirecting to editor...
        </p>
        
        {/* Animated dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <div className="w-2 h-2 rounded-full bg-white/20 animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-white/20 animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-white/20 animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

