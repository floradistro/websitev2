"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Registration form submitted:", formData);
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
            Join Us
          </div>
          <h1 className="text-4xl md:text-6xl font-light mb-4 leading-tight animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            Create Account
          </h1>
          <p className="text-base md:text-lg font-light text-white/60 max-w-2xl mx-auto animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            Unlock exclusive pricing, early access to drops, and member-only deals.
          </p>
        </div>
      </section>

      {/* Benefits Strip */}
      <section className="bg-[#8a8a87] text-white py-8 px-4 md:px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          <div className="animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            <div className="text-3xl font-light mb-1">10%</div>
            <p className="text-xs uppercase tracking-wider text-white/80">First Order</p>
          </div>
          <div className="animate-fadeIn" style={{ animationDelay: '0.4s' }}>
            <div className="text-3xl font-light mb-1">24h</div>
            <p className="text-xs uppercase tracking-wider text-white/80">Early Access</p>
          </div>
          <div className="animate-fadeIn" style={{ animationDelay: '0.5s' }}>
            <div className="text-3xl font-light mb-1">∞</div>
            <p className="text-xs uppercase tracking-wider text-white/80">Exclusive Pricing</p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="bg-[#b5b5b2] py-16 md:py-24 px-4 md:px-6">
        <div className="max-w-2xl mx-auto animate-fadeIn" style={{ animationDelay: '0.6s' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="group">
                <label htmlFor="firstName" className="block text-[10px] uppercase tracking-[0.2em] mb-3 font-medium text-black/70 group-focus-within:text-black transition-colors">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-5 py-4 text-sm bg-white/80 backdrop-blur-sm border-0 focus:outline-none focus:bg-white focus:shadow-lg transition-all duration-300 font-light"
                  required
                />
              </div>
              <div className="group">
                <label htmlFor="lastName" className="block text-[10px] uppercase tracking-[0.2em] mb-3 font-medium text-black/70 group-focus-within:text-black transition-colors">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-5 py-4 text-sm bg-white/80 backdrop-blur-sm border-0 focus:outline-none focus:bg-white focus:shadow-lg transition-all duration-300 font-light"
                  required
                />
              </div>
            </div>

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

            <div className="group">
              <label htmlFor="confirmPassword" className="block text-[10px] uppercase tracking-[0.2em] mb-3 font-medium text-black/70 group-focus-within:text-black transition-colors">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-5 py-4 text-sm bg-white/80 backdrop-blur-sm border-0 focus:outline-none focus:bg-white focus:shadow-lg transition-all duration-300 font-light"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center space-x-3 bg-black text-white px-8 py-5 text-xs uppercase tracking-[0.2em] hover:bg-black/90 transition-all duration-300 font-medium shadow-elevated hover:shadow-elevated-lg group"
            >
              <span>Create Account & Save 10%</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-xs text-black/50 text-center leading-relaxed">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-black/70 underline hover:no-underline hover:text-black transition-colors">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-black/70 underline hover:no-underline hover:text-black transition-colors">
                Privacy Policy
              </Link>
            </p>
          </form>

          <div className="mt-12 pt-8 border-t border-black/10 text-center">
            <p className="text-sm text-black/60 font-light">
              Already have an account?{" "}
              <Link href="/login" className="text-black underline hover:no-underline font-medium transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

