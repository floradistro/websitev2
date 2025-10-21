"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    
    // Super admin accounts
    const superAdmins = [
      { username: 'admin', password: 'admin' },
      { username: 'clistacc2167@gmail.com', password: 'admin' }
    ];
    
    const isValid = superAdmins.some(admin => 
      (username === admin.username || username.toLowerCase() === admin.username.toLowerCase()) && 
      password === admin.password
    );
    
    if (isValid) {
      localStorage.setItem('admin_auth', 'true');
      localStorage.setItem('admin_email', username);
      router.push('/admin/dashboard');
    } else {
      alert('Invalid credentials. Please contact system administrator.');
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded mb-4">
            <Shield size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl text-white font-medium mb-2">Admin Portal</h1>
          <p className="text-white/60 text-sm">Sign in to access the admin dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="bg-[#1a1a1a] border border-white/10 p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">
                Email / Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="clistacc2167@gmail.com"
                className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 text-sm font-medium uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>

        <p className="text-center text-white/40 text-xs mt-6">
          Authorized personnel only
        </p>
      </div>
    </div>
  );
}

