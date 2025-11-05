"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { VendorStorefront } from '@/lib/storefront/get-vendor';
import { supabase } from '@/lib/supabase/client';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';

interface StorefrontLoginClientProps {
  vendor: VendorStorefront;
}

export default function StorefrontLoginClient({ vendor }: StorefrontLoginClientProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const vendorParam = searchParams?.get('vendor');
  const redirect = searchParams?.get('redirect') || `/storefront${vendorParam ? `?vendor=${vendorParam}` : ''}`;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Check if customer record exists
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('id')
          .eq('auth_user_id', authData.user.id)
          .single();

        if (!customer || customerError) {
          // Create customer record if doesn't exist
          const { data: newCustomer, error: createError } = await supabase
            .from('customers')
            .insert({
              auth_user_id: authData.user.id,
              email: authData.user.email,
              first_name: authData.user.user_metadata?.first_name || '',
              last_name: authData.user.user_metadata?.last_name || '',
            })
            .select('id')
            .single();

          if (createError) {
            console.error('Error creating customer:', createError);
          }

          // Create vendor_customer relationship
          if (newCustomer) {
            await supabase
              .from('vendor_customers')
              .insert({
                vendor_id: vendor.id,
                customer_id: newCustomer.id,
              });
          }
        } else {
          // Check if vendor_customer relationship exists
          const { data: vendorCustomer } = await supabase
            .from('vendor_customers')
            .select('id')
            .eq('vendor_id', vendor.id)
            .eq('customer_id', customer.id)
            .single();

          // Create relationship if doesn't exist
          if (!vendorCustomer) {
            await supabase
              .from('vendor_customers')
              .insert({
                vendor_id: vendor.id,
                customer_id: customer.id,
              });
          }
        }

        // Redirect to intended page
        router.push(redirect);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-[20px] p-4 text-sm text-red-300">
          {error}
        </div>
      )}

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
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-white text-black py-4 rounded-full font-bold uppercase tracking-wider hover:bg-neutral-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-white/10"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      {/* Links */}
      <div className="space-y-3 text-center">
        <Link
          href={`/storefront/register${vendorParam ? `?vendor=${vendorParam}` : ''}`}
          className="block text-sm text-white/60 hover:text-white transition-colors"
        >
          Don't have an account? <span className="font-semibold">Create one</span>
        </Link>
        <Link
          href={`/storefront/reset-password${vendorParam ? `?vendor=${vendorParam}` : ''}`}
          className="block text-sm text-white/60 hover:text-white transition-colors"
        >
          Forgot password?
        </Link>
      </div>
    </form>
  );
}

