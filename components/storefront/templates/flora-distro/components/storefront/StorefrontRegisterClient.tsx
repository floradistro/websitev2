"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { VendorStorefront } from '@/lib/storefront/get-vendor';
import { supabase } from '@/lib/supabase/client';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

interface StorefrontRegisterClientProps {
  vendor: VendorStorefront;
}

export default function StorefrontRegisterClient({ vendor }: StorefrontRegisterClientProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const vendorParam = searchParams?.get('vendor');
  const redirect = searchParams?.get('redirect') || `/storefront${vendorParam ? `?vendor=${vendorParam}` : ''}`;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      // Use API route with service role access
      const response = await fetch('/api/storefront/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          vendorId: vendor.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // Sign in the user after successful registration
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Account created but couldn't auto-login
        setError('Account created! Please sign in.');
        setLoading(false);
        setTimeout(() => {
          router.push(`/storefront/login${vendorParam ? `?vendor=${vendorParam}` : ''}`);
        }, 2000);
        return;
      }

      // Redirect after successful signup and login
      router.push(redirect);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleRegister} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-[20px] p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* First Name */}
      <div>
        <label htmlFor="firstName" className="block text-sm font-medium text-white/80 mb-2">
          First Name
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <User className="w-5 h-5 text-white/40" />
          </div>
          <input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/20 rounded-full px-12 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-all"
            placeholder="John"
          />
        </div>
      </div>

      {/* Last Name */}
      <div>
        <label htmlFor="lastName" className="block text-sm font-medium text-white/80 mb-2">
          Last Name
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <User className="w-5 h-5 text-white/40" />
          </div>
          <input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/20 rounded-full px-12 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-all"
            placeholder="Doe"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
          Email
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Mail className="w-5 h-5 text-white/40" />
          </div>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/20 rounded-full px-12 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-all"
            placeholder="your@email.com"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
          Password
        </label>
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <Lock className="w-5 h-5 text-white/40" />
          </div>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-white/5 border border-white/20 rounded-full px-12 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-all"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-xs text-white/40 mt-2">Minimum 6 characters</p>
      </div>

      {/* Age Verification */}
      <div className="bg-white/5 border border-white/10 rounded-[20px] p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            required
            className="mt-1 w-4 h-4 rounded border-white/20 bg-white/10 text-white focus:ring-0"
          />
          <span className="text-sm text-neutral-300">
            I confirm that I am 21 years of age or older
          </span>
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-white text-black py-4 rounded-full font-bold uppercase tracking-wider hover:bg-neutral-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-white/10"
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </button>

      {/* Login Link */}
      <div className="text-center">
        <Link
          href={`/storefront/login${vendorParam ? `?vendor=${vendorParam}` : ''}`}
          className="text-sm text-white/60 hover:text-white transition-colors"
        >
          Already have an account? <span className="font-semibold">Sign in</span>
        </Link>
      </div>
    </form>
  );
}

