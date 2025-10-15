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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-black via-[#1a1a1a] to-black text-white py-20 md:py-32 px-4 md:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03),transparent_50%)]"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block px-4 py-1.5 bg-white/10 border border-white/20 text-[10px] uppercase tracking-[0.3em] mb-6 backdrop-blur-sm animate-fadeIn">
            Welcome Back
          </div>
          <h1 className="text-4xl md:text-6xl font-light mb-4 leading-tight animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            Sign In
          </h1>
          <p className="text-base md:text-lg font-light text-white/60 max-w-2xl mx-auto animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            Access your account and exclusive member pricing.
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="bg-[#b5b5b2] py-16 md:py-24 px-4 md:px-6">
        <div className="max-w-lg mx-auto animate-fadeIn" style={{ animationDelay: '0.3s' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="group">
              <label htmlFor="email" className="block text-[10px] uppercase tracking-[0.2em] mb-3 font-medium text-black/70 group-focus-within:text-black transition-colors">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-5 py-4 text-sm bg-white/80 backdrop-blur-sm border-0 focus:outline-none focus:bg-white focus:shadow-lg transition-all duration-300 font-light"
                required
              />
            </div>

            <div className="group">
              <label htmlFor="password" className="block text-[10px] uppercase tracking-[0.2em] mb-3 font-medium text-black/70 group-focus-within:text-black transition-colors">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-5 py-4 text-sm bg-white/80 backdrop-blur-sm border-0 focus:outline-none focus:bg-white focus:shadow-lg transition-all duration-300 font-light"
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center group cursor-pointer">
                <input type="checkbox" className="mr-2 accent-black" />
                <span className="text-black/60 group-hover:text-black transition-colors">Remember me</span>
              </label>
              <Link href="/contact" className="text-black/70 underline hover:no-underline hover:text-black transition-colors">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center space-x-3 bg-black text-white px-8 py-5 text-xs uppercase tracking-[0.2em] hover:bg-black/90 transition-all duration-300 font-medium shadow-elevated hover:shadow-elevated-lg group"
            >
              <span>Sign In</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-black/10 text-center">
            <p className="text-sm text-black/60 font-light">
              Don't have an account?{" "}
              <Link href="/register" className="text-black underline hover:no-underline font-medium transition-colors">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

