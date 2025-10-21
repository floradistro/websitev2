"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { showNotification } from '@/components/NotificationToast';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      showNotification({
        type: 'success',
        title: 'Password Set',
        message: 'Your password has been set successfully. You can now log in.'
      });

      // Redirect to appropriate login page based on user role
      const { data: { user } } = await supabase.auth.getUser();
      const role = user?.user_metadata?.role;

      if (role === 'admin') {
        router.push('/admin/login');
      } else {
        router.push('/vendor/login');
      }
      
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl text-white font-light tracking-tight mb-2">Set Your Password</h1>
          <p className="text-white/50 text-sm">Choose a secure password for your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleResetPassword} className="bg-[#111111] border border-white/10 p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
                placeholder="Enter new password"
                required
                minLength={8}
              />
              <p className="text-white/40 text-xs mt-1">Must be at least 8 characters</p>
            </div>

            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-black border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
                placeholder="Confirm new password"
                required
                minLength={8}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black py-3 text-sm font-medium uppercase tracking-wider hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Setting Password...' : 'Set Password'}
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="mt-6 text-center">
          <p className="text-white/40 text-xs">
            After setting your password, you'll be redirected to the login page
          </p>
        </div>
      </div>
    </div>
  );
}

