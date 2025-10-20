"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      await register(formData.email, formData.password, formData.firstName, formData.lastName);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div 
      className="bg-[#1a1a1a] relative overflow-x-hidden w-full max-w-full flex items-center justify-center px-4 py-12"
      style={{ minHeight: 'calc(100vh - env(safe-area-inset-top, 0px))' }}
    >
      <div className="w-full max-w-2xl">
        {/* Card */}
        <div className="bg-[#2a2a2a] border border-white/10 p-8 hover:border-white/20 transition-all duration-300 glow-hover">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-light text-white mb-3 tracking-tight">
              Create Account
            </h1>
            <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-4"></div>
            <p className="text-[11px] text-white/40 uppercase tracking-[0.15em]">
              Unlock exclusive pricing & early access
            </p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-3 gap-4 mb-8 pb-8 border-b border-white/10">
            <div className="text-center">
              <div className="text-2xl font-light text-white mb-1">10%</div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-white/40">First Order</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-light text-white mb-1">24h</div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-white/40">Early Access</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-light text-white mb-1">∞</div>
              <p className="text-[9px] uppercase tracking-[0.15em] text-white/40">Exclusive Pricing</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 text-xs animate-fadeIn">
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="firstName" className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60 font-medium">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  autoComplete="given-name"
                  placeholder="John"
                  className="w-full px-4 py-3.5 text-sm bg-black/20 border border-white/10 text-white placeholder:text-white/20 focus:border-white/30 focus:bg-black/30 focus:outline-none transition-all input-elegant focus-elegant"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60 font-medium">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  autoComplete="family-name"
                  placeholder="Doe"
                  className="w-full px-4 py-3.5 text-sm bg-black/20 border border-white/10 text-white placeholder:text-white/20 focus:border-white/30 focus:bg-black/30 focus:outline-none transition-all input-elegant focus-elegant"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60 font-medium">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3.5 text-sm bg-black/20 border border-white/10 text-white placeholder:text-white/20 focus:border-white/30 focus:bg-black/30 focus:outline-none transition-all input-elegant focus-elegant"
                required
                disabled={loading}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="password" className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60 font-medium">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 text-sm bg-black/20 border border-white/10 text-white placeholder:text-white/20 focus:border-white/30 focus:bg-black/30 focus:outline-none transition-all input-elegant focus-elegant"
                  required
                  disabled={loading}
                  minLength={8}
                />
                <p className="text-[10px] text-white/30 mt-1.5">Min. 8 characters</p>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60 font-medium">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3.5 text-sm bg-black/20 border border-white/10 text-white placeholder:text-white/20 focus:border-white/30 focus:bg-black/30 focus:outline-none transition-all input-elegant focus-elegant"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="interactive-button group w-full inline-flex items-center justify-center space-x-3 bg-white text-black px-6 py-4 text-[11px] uppercase tracking-[0.2em] hover:bg-white/90 font-medium border border-white/20 hover:border-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all duration-300"
            >
              <span className="relative z-10">{loading ? "Creating Account..." : "Create Account"}</span>
              {!loading && <ArrowRight size={13} className="relative z-10 group-hover:translate-x-1 transition-transform" />}
            </button>

            <p className="text-[10px] text-white/30 text-center leading-relaxed">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-white/40 hover:text-white/60 transition-smooth underline-offset-2 hover:underline">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-white/40 hover:text-white/60 transition-smooth underline-offset-2 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em]">
              <span className="bg-[#2a2a2a] px-3 text-white/40">Already have an account?</span>
            </div>
          </div>

          {/* Login Link */}
          <Link
            href="/login"
            className="interactive-button group w-full inline-flex items-center justify-center space-x-3 bg-black/40 text-white px-6 py-4 text-[11px] uppercase tracking-[0.2em] hover:bg-black/60 font-medium border border-white/10 hover:border-white/30 transition-all duration-300"
          >
            <span className="relative z-10">Sign In</span>
            <ArrowRight size={13} className="relative z-10 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">
            Secure Authentication
          </p>
          <div className="flex items-center justify-center gap-4 text-[10px] text-white/40">
            <Link href="/privacy" className="hover:text-white/60 transition-smooth">Privacy</Link>
            <span className="text-white/20">·</span>
            <Link href="/terms" className="hover:text-white/60 transition-smooth">Terms</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
