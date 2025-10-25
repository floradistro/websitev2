"use client";

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import Image from 'next/image';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAdminAuth();

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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #000000 100%)' }}>
      {/* Animated gradient orbs */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s' }} />
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-white/10 to-white/5 rounded-full mb-6 border border-white/10 p-3 shadow-[0_0_40px_rgba(255,255,255,0.05)] backdrop-blur-xl">
            <img src="/yacht-club-logo.png" alt="Yacht Master" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl text-white font-light mb-2 tracking-[0.2em]">YACHT MASTER</h1>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-3" />
          <p className="text-white/30 text-xs tracking-[0.15em] uppercase">Control Center Access</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-lg blur-xl" />
          <div className="relative bg-gradient-to-br from-black/50 to-black/30 backdrop-blur-2xl border border-white/10 p-10 rounded-lg shadow-2xl">
            {error && (
              <div className="mb-6 bg-gradient-to-r from-white/10 to-white/5 border border-white/20 p-4 flex items-start gap-3 rounded-[14px]">
                <AlertCircle size={18} className="text-white/70 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
                <p className="text-white/60 text-sm font-light">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-[0.2em] mb-3 font-light">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  className="w-full bg-black/40 border border-white/10 text-white px-5 py-4 focus:outline-none focus:border-white/30 focus:bg-black/60 transition-all duration-300 rounded-[14px] font-light placeholder:text-white/20 backdrop-blur-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-[0.2em] mb-3 font-light">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full bg-black/40 border border-white/10 text-white px-5 py-4 focus:outline-none focus:border-white/30 focus:bg-black/60 transition-all duration-300 rounded-[14px] font-light placeholder:text-white/20 backdrop-blur-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-white/15 to-white/10 hover:from-white/20 hover:to-white/15 text-white border border-white/20 hover:border-white/30 px-6 py-4 text-xs font-light uppercase tracking-[0.2em] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-[14px] shadow-lg hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] mt-8"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  'Access Control Center'
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-white/20 text-[10px] tracking-[0.15em] uppercase font-light">
            Authorized Personnel Only
          </p>
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-auto mt-3" />
        </div>
      </div>
    </div>
  );
}
