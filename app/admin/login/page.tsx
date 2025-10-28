"use client";

import { useState, useEffect, useRef } from 'react';
import { AlertCircle, Lock } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import Link from 'next/link';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { signIn } = useAdminAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Matrix rain animation on canvas
  useEffect(() => {
    if (!loading || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to full screen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const columns = Math.floor(canvas.width / 20);
    const drops: number[] = Array(columns).fill(1);

    // Matrix characters
    const matrixChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*()_+-=[]{}|;:,.<>?/~`';
    const katakana = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    const chars = matrixChars + katakana;

    let animationFrameId: number;

    function draw() {
      // Fade effect
      ctx!.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx!.fillRect(0, 0, canvas.width, canvas.height);

      ctx!.font = '15px monospace';

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];

        // Bright green for leading character
        const isLeading = Math.random() > 0.975;
        ctx!.fillStyle = isLeading ? '#00ff41' : `rgba(0, 255, 65, ${0.3 + Math.random() * 0.3})`;

        ctx!.fillText(char, i * 20, drops[i] * 20);

        // Reset drop to top randomly
        if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animationFrameId = requestAnimationFrame(draw);
    }

    draw();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [loading]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Map username to email
      const email = username.toLowerCase() === 'admin' ? 'yacht@yachtclub.vip' : `${username}@yachtclub.vip`;
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please contact system administrator.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Matrix Rain Loading Animation */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ animation: 'fade-in 0.3s ease-out' }}>
          <canvas ref={canvasRef} className="absolute inset-0" />
          <div className="relative z-10 text-center">
            <div className="mb-6">
              <Lock className="w-16 h-16 text-green-500/80 mx-auto mb-4 animate-pulse" strokeWidth={1} />
            </div>
            <div className="font-mono text-green-500/90 text-lg tracking-[0.3em] uppercase mb-2">
              [AUTHENTICATING]
            </div>
            <div className="flex items-center justify-center gap-1 font-mono text-green-500/60 text-xs">
              <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
              <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
      )}

      {/* Subtle matrix-inspired orbs with green tint */}
      <div className="absolute top-20 left-20 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(0,255,65,0.015) 0%, rgba(0,255,65,0.005) 50%, transparent 100%)', animation: 'subtle-glow 8s ease-in-out infinite' }} />
      <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(0,255,65,0.01) 0%, rgba(0,255,65,0.003) 50%, transparent 100%)', animation: 'subtle-glow 12s ease-in-out infinite' }} />

      {/* Subtle matrix rain effect - very faint - client only to avoid hydration mismatch */}
      {mounted && (
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none font-mono text-[10px] text-green-500/20 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${i * 5}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 10}s`
              }}
            >
              {String.fromCharCode(0x30A0 + Math.random() * 96)}
            </div>
          ))}
        </div>
      )}

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-black/40 rounded-sm mb-6 border border-green-500/10 p-3 backdrop-blur-xl relative group" style={{ boxShadow: '0 0 40px rgba(0,255,65,0.03)' }}>
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock className="w-8 h-8 text-green-500/20 group-hover:text-green-500/30 transition-colors duration-500" strokeWidth={1} />
            </div>
            <div className="absolute inset-0 bg-green-500/5 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
          <div className="mb-3 flex items-center justify-center gap-2">
            <div className="w-3 h-px bg-green-500/20" />
            <h1 className="text-2xl text-green-500/80 font-light tracking-[0.3em] uppercase" style={{ fontFamily: 'monospace' }}>[CLASSIFIED]</h1>
            <div className="w-3 h-px bg-green-500/20" />
          </div>
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-green-500/10 to-transparent mx-auto mb-3" />
          <p className="text-green-500/30 text-[9px] tracking-[0.2em] uppercase font-light" style={{ fontFamily: 'monospace' }}>System Access Terminal</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="relative">
          {/* Glass effect backdrop with green tint */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/[0.02] to-black/50 rounded-sm blur-xl" />

          <div className="relative bg-black/40 backdrop-blur-xl border border-green-500/10 p-6 md:p-10 rounded-sm" style={{ boxShadow: '0 0 30px rgba(0,255,65,0.02), inset 0 0 30px rgba(0,255,65,0.01)' }}>
            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/30 p-4 flex items-start gap-3 rounded-sm">
                <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <p className="text-red-400 text-sm font-light font-mono">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-green-500/40 text-[9px] uppercase tracking-[0.25em] mb-3 font-light" style={{ fontFamily: 'monospace' }}>
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  className="w-full bg-black/40 border border-green-500/20 text-green-500/90 px-5 py-4 focus:outline-none focus:border-green-500/40 focus:bg-black/60 transition-all duration-300 rounded-sm font-light placeholder:text-green-500/20 font-mono text-sm"
                  style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}
                  required
                  autoFocus
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-green-500/40 text-[9px] uppercase tracking-[0.25em] mb-3 font-light" style={{ fontFamily: 'monospace' }}>
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full bg-black/40 border border-green-500/20 text-green-500/90 px-5 py-4 focus:outline-none focus:border-green-500/40 focus:bg-black/60 transition-all duration-300 rounded-sm font-light placeholder:text-green-500/20 font-mono text-sm"
                  style={{ boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500/10 hover:bg-green-500/15 text-green-500/90 border border-green-500/30 hover:border-green-500/50 px-6 py-4 text-[10px] font-light uppercase tracking-[0.25em] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm mt-8 font-mono"
                style={{ boxShadow: '0 0 20px rgba(0,255,65,0.1)' }}
              >
                &gt;_ Access System
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-8 space-y-3">
          <p className="text-green-500/20 text-[9px] tracking-[0.2em] uppercase font-light font-mono">
            Authorized Access Only
          </p>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-green-500/10 to-transparent mx-auto" />
          <p className="text-green-500/20 text-xs font-light font-mono">
            <Link href="/" className="text-green-500/30 hover:text-green-500/60 transition-colors">← Return</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
