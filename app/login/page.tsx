"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
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
    <div className="bg-[#1a1a1a] min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-12 group">
          <Image 
            src="/logoprint.png" 
            alt="Flora Distro" 
            width={40} 
            height={40}
            className="object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <span className="text-2xl logo-font text-white">Flora Distro</span>
        </Link>

        {/* Card */}
        <div className="bg-[#2a2a2a] border border-white/10 p-8 hover:border-white/20 transition-all duration-300 glow-hover">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-light text-white mb-3 tracking-tight">
              Welcome Back
            </h1>
            <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 text-xs animate-fadeIn">
                {error}
              </div>
            )}

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
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-4 py-3.5 text-sm bg-black/20 border border-white/10 text-white placeholder:text-white/20 focus:border-white/30 focus:bg-black/30 focus:outline-none transition-all input-elegant focus-elegant"
                required
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center group cursor-pointer">
                <input type="checkbox" className="mr-2 accent-white" disabled={loading} />
                <span className="text-white/40 group-hover:text-white/60 transition-smooth text-[11px]">Remember me</span>
              </label>
              <Link href="/contact" className="text-white/40 hover:text-white transition-smooth text-[11px] underline-offset-2 hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="interactive-button group w-full inline-flex items-center justify-center space-x-3 bg-white text-black px-6 py-4 text-[11px] uppercase tracking-[0.2em] hover:bg-white/90 font-medium border border-white/20 hover:border-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all duration-300"
            >
              <span className="relative z-10">{loading ? "Signing In..." : "Sign In"}</span>
              {!loading && <ArrowRight size={13} className="relative z-10 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em]">
              <span className="bg-[#2a2a2a] px-3 text-white/40">New to Flora?</span>
            </div>
          </div>

          {/* Register Link */}
          <Link
            href="/register"
            className="interactive-button group w-full inline-flex items-center justify-center space-x-3 bg-black/40 text-white px-6 py-4 text-[11px] uppercase tracking-[0.2em] hover:bg-black/60 font-medium border border-white/10 hover:border-white/30 transition-all duration-300"
          >
            <span className="relative z-10">Create Account</span>
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
