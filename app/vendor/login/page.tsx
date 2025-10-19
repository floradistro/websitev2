"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVendorAuth } from '@/context/VendorAuthContext';
import Link from 'next/link';
import { Store, Mail, Lock, ArrowRight, AlertCircle, ArrowLeft, Home, Users } from 'lucide-react';

export default function VendorLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useVendorAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      
      if (success) {
        router.push('/vendor/dashboard');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link 
              href="/" 
              className="text-white/60 hover:text-white transition-colors flex items-center gap-2 group"
            >
              <Home size={16} className="group-hover:-translate-y-0.5 transition-transform duration-300" />
              <span>Home</span>
            </Link>
            <span className="text-white/40">/</span>
            <Link 
              href="/vendors" 
              className="text-white/60 hover:text-white transition-colors flex items-center gap-2 group"
            >
              <Users size={16} className="group-hover:-translate-y-0.5 transition-transform duration-300" />
              <span>Vendors</span>
            </Link>
            <span className="text-white/40">/</span>
            <span className="text-white/80">Portal Login</span>
          </div>
        </div>
      </div>

      {/* Login Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <img src="/logoprint.png" alt="Flora Distro" className="w-24 h-24 mx-auto mb-4 opacity-80 hover:opacity-100 transition-opacity" />
          </Link>
          <h1 className="text-3xl text-white mb-2" style={{ fontFamily: 'Lobster' }}>Vendor Portal</h1>
          <p className="text-white/60 text-sm">Sign in to manage your store</p>
        </div>

        {/* Login Form */}
        <div className="bg-[#2a2a2a] border border-white/10 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-white/80 text-sm uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black border border-white/20 text-white pl-12 pr-4 py-3 focus:outline-none focus:border-white/40 transition-all"
                  placeholder="your@email.com"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-white/80 text-sm uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border border-white/20 text-white pl-12 pr-4 py-3 focus:outline-none focus:border-white/40 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black py-3 px-6 hover:bg-white/90 active:bg-white/80 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                  <span className="text-sm uppercase tracking-wider">Signing In...</span>
                </>
              ) : (
                <>
                  <span className="text-sm uppercase tracking-wider">Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Help Links */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center space-y-2">
            <p className="text-white/60 text-xs">
              <a href="https://api.floradistro.com/wp-login.php?action=lostpassword" className="hover:text-white transition-colors">
                Forgot your password?
              </a>
            </p>
            <p className="text-white/60 text-xs">
              Don't have a vendor account? <Link href="/" className="text-white hover:text-white/80 transition-colors">Contact us</Link>
            </p>
          </div>
        </div>

        {/* Customer Login Link */}
        <div className="mt-6 text-center">
          <p className="text-white/60 text-xs">
            Customer? <Link href="/login" className="text-white hover:text-white/80 transition-colors">Sign in here</Link>
          </p>
        </div>

        {/* Test Credentials (Remove in production) */}
        <div className="mt-6 bg-white/5 border border-white/10 p-4">
          <p className="text-white/60 text-xs mb-2">Test Credentials:</p>
          <p className="text-white/80 text-xs font-mono">Email: darioncdjr@gmail.com</p>
          <p className="text-white/80 text-xs font-mono">Password: Vendor123!</p>
        </div>
      </div>
      </div>
    </div>
  );
}

