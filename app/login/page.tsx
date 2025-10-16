"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login form submitted:", formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="bg-[#1a1a1a] min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center justify-center bg-[#1a1a1a] text-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-8"></div>
          <h1 className="text-5xl md:text-7xl font-light text-white mb-6 leading-tight tracking-tight">
            Sign In
          </h1>
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-12"></div>
          <p className="text-base text-white/50">
            Access your account and exclusive pricing
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="bg-[#2a2a2a] py-16 px-4">
        <div className="max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-[10px] uppercase tracking-[0.2em] mb-3 text-white/60">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] uppercase tracking-[0.2em] mb-3 text-white/60">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center group cursor-pointer">
                <input type="checkbox" className="mr-2 accent-white" />
                <span className="text-white/50 group-hover:text-white transition-colors">Remember me</span>
              </label>
              <Link href="/contact" className="text-white/60 underline hover:text-white transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="group w-full inline-flex items-center justify-center space-x-3 bg-black text-white px-10 py-4 text-xs uppercase tracking-[0.25em] hover:bg-black/70 transition-all duration-500 font-medium border border-white/20 hover:border-white/40 relative overflow-hidden"
            >
              <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <span className="relative z-10">Sign In</span>
              <ArrowRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-white/10 text-center">
            <p className="text-sm text-white/50">
              Don't have an account?{" "}
              <Link href="/register" className="text-white underline hover:no-underline transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
