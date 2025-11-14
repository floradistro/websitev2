"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppAuth } from "@/context/AppAuthContext";
import Link from "next/link";
import { Mail, Lock, AlertCircle, Home, Users, Store } from "lucide-react";

export default function VendorLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAppAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const success = await login(email, password);

      if (success) {
        // Force full page reload to ensure auth context is properly initialized
        // This prevents the issue where apps don't show until manual refresh
        window.location.href = "/vendor/dashboard";
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } catch (err) {
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col relative overflow-hidden">
      {/* PWA Safe Area Spacer */}
      <div
        className="fixed top-0 left-0 right-0 bg-black z-[130] pointer-events-none"
        style={{ height: "env(safe-area-inset-top, 0px)" }}
      />

      {/* Animated gradient orbs */}
      <div
        className="absolute top-20 left-20 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl"
        style={{ animation: "subtle-glow 8s ease-in-out infinite" }}
      />
      <div
        className="absolute bottom-20 right-20 w-96 h-96 bg-white/[0.015] rounded-full blur-3xl"
        style={{ animation: "subtle-glow 12s ease-in-out infinite" }}
      />

      {/* Breadcrumb Navigation */}
      <div
        className="border-b border-white/5 relative z-10 sticky bg-black/95 backdrop-blur-xl"
        style={{ top: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm">
            <Link
              href="/"
              className="text-white/60 hover:text-white transition-colors flex items-center gap-2 group"
            >
              <Home
                size={16}
                className="group-hover:-translate-y-0.5 transition-transform duration-300"
              />
              <span>Home</span>
            </Link>
            <span className="text-white/30">/</span>
            <Link
              href="/vendors"
              className="text-white/60 hover:text-white transition-colors flex items-center gap-2 group"
            >
              <Users
                size={16}
                className="group-hover:-translate-y-0.5 transition-transform duration-300"
              />
              <span>Vendors</span>
            </Link>
            <span className="text-white/30">/</span>
            <span className="text-white/90">Portal Login</span>
          </div>
        </div>
      </div>

      {/* Login Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="max-w-md w-full">
          {/* Logo & Header */}
          <div className="text-center mb-10">
            <Link href="/" className="inline-block group">
              <div
                className="inline-flex items-center justify-center w-20 h-20 bg-white/[0.02] rounded-full mb-6 border border-white/10 p-3 backdrop-blur-xl group-hover:bg-white/[0.04] group-hover:border-white/20 transition-all duration-300"
                style={{ boxShadow: "0 0 40px rgba(255,255,255,0.02)" }}
              >
                <img
                  src="/yacht-club-logo.png"
                  alt="Yacht Club"
                  className="w-full h-full object-contain"
                />
              </div>
            </Link>
            <h1 className="text-3xl text-white font-light mb-2 tracking-[0.15em] uppercase">
              Vendor Portal
            </h1>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-3" />
            <p className="text-white/40 text-xs tracking-[0.1em] uppercase font-light">
              Sign in to manage your store
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="relative">
            {/* Glass effect backdrop */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-white/[0.01] rounded-2xl blur-xl" />

            <div
              className="relative bg-white/[0.02] backdrop-blur-xl border border-white/10 p-6 md:p-10 rounded-2xl"
              style={{ boxShadow: "0 0 30px rgba(255,255,255,0.02)" }}
            >
              {/* Error Message */}
              {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3 rounded-xl">
                  <AlertCircle
                    size={18}
                    className="text-red-500 flex-shrink-0 mt-0.5"
                    strokeWidth={1.5}
                  />
                  <p className="text-red-500 text-sm font-light">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-white/40 text-[10px] uppercase tracking-[0.2em] mb-3 font-light"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30"
                      strokeWidth={1.5}
                    />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 text-white pl-12 pr-5 py-4 focus:outline-none focus:border-white/30 focus:bg-black/30 transition-all duration-300 rounded-2xl font-light placeholder:text-white/20"
                      placeholder="your@email.com"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-white/40 text-[10px] uppercase tracking-[0.2em] mb-3 font-light"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30"
                      strokeWidth={1.5}
                    />
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 text-white pl-12 pr-5 py-4 focus:outline-none focus:border-white/30 focus:bg-black/30 transition-all duration-300 rounded-2xl font-light placeholder:text-white/20"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white/10 hover:bg-white/15 text-white border border-white/20 hover:border-white/30 px-6 py-4 text-xs font-light uppercase tracking-[0.2em] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl mt-8"
                  style={{ boxShadow: "0 0 20px rgba(255,255,255,0.05)" }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Authenticating...
                    </span>
                  ) : (
                    "Access Portal"
                  )}
                </button>
              </div>

              {/* Help Links */}
              <div className="mt-8 pt-6 border-t border-white/5 text-center space-y-3">
                <p className="text-white/40 text-xs font-light">
                  <a
                    href="/reset-password"
                    className="hover:text-white/70 transition-colors tracking-wide"
                  >
                    Forgot your password?
                  </a>
                </p>
                <p className="text-white/40 text-xs font-light">
                  Need an account?{" "}
                  <Link href="/" className="text-white/60 hover:text-white/90 transition-colors">
                    Contact us
                  </Link>
                </p>
              </div>
            </div>
          </form>

          {/* Additional Links */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-white/30 text-xs font-light">
              Customer?{" "}
              <Link href="/login" className="text-white/50 hover:text-white/90 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
