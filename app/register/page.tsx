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
    <div className="bg-[#1a1a1a] min-h-screen">
      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center justify-center bg-[#1a1a1a] text-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-8"></div>
          <h1 className="text-5xl md:text-7xl font-light text-white mb-6 leading-tight tracking-tight">
            Create Account
          </h1>
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-12"></div>
          <p className="text-base text-white/50">
            Unlock exclusive pricing and early access
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-[#2a2a2a] py-12 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-light text-white mb-1">10%</div>
            <p className="text-xs uppercase tracking-wider text-white/50">First Order</p>
          </div>
          <div>
            <div className="text-3xl font-light text-white mb-1">24h</div>
            <p className="text-xs uppercase tracking-wider text-white/50">Early Access</p>
          </div>
          <div>
            <div className="text-3xl font-light text-white mb-1">∞</div>
            <p className="text-xs uppercase tracking-wider text-white/50">Exclusive Pricing</p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="bg-[#3a3a3a] py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-xs uppercase tracking-[0.2em] mb-3 text-white/60">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  autoComplete="given-name"
                  className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-xs uppercase tracking-[0.2em] mb-3 text-white/60">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  autoComplete="family-name"
                  className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs uppercase tracking-[0.2em] mb-3 text-white/60">
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
              <label htmlFor="password" className="block text-xs uppercase tracking-[0.2em] mb-3 text-white/60">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs uppercase tracking-[0.2em] mb-3 text-white/60">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                required
              />
            </div>

            <button
              type="submit"
              className="group w-full inline-flex items-center justify-center space-x-3 bg-black text-white px-10 py-4 text-xs uppercase tracking-[0.25em] hover:bg-black/70 transition-all duration-500 font-medium border border-white/20 hover:border-white/40 relative overflow-hidden"
            >
              <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <span className="relative z-10">Create Account</span>
              <ArrowRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-xs text-white/40 text-center leading-relaxed">
              By creating an account, you agree to our{" "}
              <Link href="/terms" className="text-white/60 underline hover:text-white transition-colors">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-white/60 underline hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </p>
          </form>

          <div className="mt-12 pt-8 border-t border-white/10 text-center">
            <p className="text-sm text-white/50">
              Already have an account?{" "}
              <Link href="/login" className="text-white underline hover:no-underline transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
