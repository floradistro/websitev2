'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ds, cn } from '@/components/ds';
import { LogIn } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store auth token
      localStorage.setItem('admin-auth', JSON.stringify({
        token: data.token,
        user: data.user
      }));

      // Redirect to admin dashboard
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
      setLoading(false);
    }
  };

  return (
    <div className={cn("min-h-screen flex items-center justify-center p-4", ds.colors.bg.default)}>
      <div className={cn("w-full max-w-md", ds.colors.bg.elevated, "border", ds.colors.border.default, "rounded-2xl p-8")}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className={cn("inline-flex items-center justify-center w-16 h-16 rounded-full mb-4", "bg-blue-500/10")}>
            <LogIn className="w-8 h-8 text-blue-400" strokeWidth={1.5} />
          </div>
          <h1 className={cn(ds.typography.size["2xl"], ds.typography.weight.bold, ds.colors.text.primary)}>
            Admin Login
          </h1>
          <p className={cn(ds.typography.size.sm, ds.colors.text.tertiary, "mt-2")}>
            Sign in to access the WhaleTools dashboard
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className={cn("mb-6 p-4 rounded-lg", "bg-red-500/10 border border-red-500/20")}>
            <p className={cn(ds.typography.size.sm, "text-red-400")}>{error}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="username" className={cn(ds.typography.size.sm, ds.typography.weight.medium, ds.colors.text.secondary, "block mb-2")}>
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className={cn(
                "w-full px-4 py-3 rounded-lg",
                ds.colors.bg.elevated,
                "border",
                ds.colors.border.default,
                ds.colors.text.primary,
                "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                "transition-all"
              )}
              placeholder="admin"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className={cn(ds.typography.size.sm, ds.typography.weight.medium, ds.colors.text.secondary, "block mb-2")}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={cn(
                "w-full px-4 py-3 rounded-lg",
                ds.colors.bg.elevated,
                "border",
                ds.colors.border.default,
                ds.colors.text.primary,
                "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                "transition-all"
              )}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full py-3 rounded-lg",
              ds.typography.size.sm,
              ds.typography.weight.medium,
              "bg-blue-500 hover:bg-blue-600",
              "text-white",
              "transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            )}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary)}>
            Authorized access only
          </p>
        </div>
      </div>
    </div>
  );
}
