"use client";

import { Mail, Phone, MapPin, ArrowRight, Store, Users } from "lucide-react";
import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    inquiryType: "customer",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Submit to API
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div 
      className="bg-[#1a1a1a] relative overflow-x-hidden w-full max-w-full"
      style={{ minHeight: 'calc(100vh - env(safe-area-inset-top, 0px))' }}
    >
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center bg-[#1a1a1a] text-white px-4 pt-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-8"></div>
          <h1 className="text-5xl md:text-7xl font-light text-white mb-6 leading-tight tracking-tight">
            Get in Touch
          </h1>
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-12"></div>
          <p className="text-lg md:text-xl font-light text-white/50 leading-relaxed">
            Customer questions. Vendor inquiries. Partnerships. We're here.
          </p>
        </div>
      </section>

      {/* Quick Links */}
      <section className="bg-[#2a2a2a] py-16">
        <div className="grid md:grid-cols-3 gap-px">
          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-10 border border-white/5">
            <Users className="w-10 h-10 mb-6 text-white/60" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-3 font-normal">Customer Support</h3>
            <p className="text-xs text-white/50 font-light mb-4">Questions about orders, products, or your account?</p>
            <a href="mailto:support@floradistro.com" className="text-xs text-white underline hover:no-underline">
              support@floradistro.com
            </a>
          </div>

          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-10 border border-white/5">
            <Store className="w-10 h-10 mb-6 text-white/60" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-3 font-normal">Vendor Inquiries</h3>
            <p className="text-xs text-white/50 font-light mb-4">Interested in selling on our marketplace?</p>
            <a href="mailto:vendors@floradistro.com" className="text-xs text-white underline hover:no-underline">
              vendors@floradistro.com
            </a>
          </div>

          <div className="bg-[#3a3a3a] hover:bg-[#404040] transition-all duration-500 p-10 border border-white/5">
            <Mail className="w-10 h-10 mb-6 text-white/60" />
            <h3 className="text-sm uppercase tracking-[0.2em] text-white mb-3 font-normal">General Inquiries</h3>
            <p className="text-xs text-white/50 font-light mb-4">Business partnerships or media requests?</p>
            <a href="mailto:info@floradistro.com" className="text-xs text-white underline hover:no-underline">
              info@floradistro.com
            </a>
          </div>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="bg-[#1a1a1a] py-0">
        <div className="grid md:grid-cols-2">
          {/* Form */}
          <div className="px-8 md:px-12 py-16 bg-[#1a1a1a]">
            <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
              <div>
                <label htmlFor="inquiryType" className="block text-xs uppercase tracking-[0.2em] mb-3 text-white/60">
                  I am a
                </label>
                <select
                  id="inquiryType"
                  name="inquiryType"
                  value={formData.inquiryType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-smooth"
                >
                  <option value="customer" className="bg-[#1a1a1a]">Customer</option>
                  <option value="vendor" className="bg-[#1a1a1a]">Prospective Vendor</option>
                  <option value="partner" className="bg-[#1a1a1a]">Business Partner</option>
                  <option value="other" className="bg-[#1a1a1a]">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="name" className="block text-xs uppercase tracking-[0.2em] mb-3 text-white/60">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-smooth input-elegant focus-elegant"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
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
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-smooth input-elegant focus-elegant"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs uppercase tracking-[0.2em] mb-3 text-white/60">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-smooth input-elegant focus-elegant"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-xs uppercase tracking-[0.2em] mb-3 text-white/60">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-smooth input-elegant focus-elegant"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs uppercase tracking-[0.2em] mb-3 text-white/60">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-smooth resize-none input-elegant focus-elegant"
                />
              </div>

              <button
                type="submit"
                className="interactive-button group w-full inline-flex items-center justify-center space-x-3 bg-black text-white px-12 py-4 text-xs uppercase tracking-[0.25em] hover:bg-white hover:text-black font-medium border border-white/20 hover:border-white"
              >
                <span className="relative z-10">Send Message</span>
                <ArrowRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="bg-[#2a2a2a] px-8 md:px-12 py-16 flex items-center">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-light text-white mb-8 uppercase tracking-wider">
                  Contact Information
                </h2>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4 group">
                  <div className="w-10 h-10 flex-shrink-0 border border-white/20 flex items-center justify-center group-hover:border-white/40 transition-smooth">
                    <Mail size={18} className="text-white/60 group-hover:scale-110 transition-smooth" />
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.15em] text-white mb-1">General</h3>
                    <a href="mailto:info@floradistro.com" className="text-sm text-white/50 hover:text-white transition-smooth click-feedback">
                      info@floradistro.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="w-10 h-10 flex-shrink-0 border border-white/20 flex items-center justify-center group-hover:border-white/40 transition-smooth">
                    <Store size={18} className="text-white/60 group-hover:scale-110 transition-smooth" />
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.15em] text-white mb-1">Vendors</h3>
                    <a href="mailto:vendors@floradistro.com" className="text-sm text-white/50 hover:text-white transition-smooth click-feedback">
                      vendors@floradistro.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="w-10 h-10 flex-shrink-0 border border-white/20 flex items-center justify-center group-hover:border-white/40 transition-smooth">
                    <MapPin size={18} className="text-white/60 group-hover:scale-110 transition-smooth" />
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.15em] text-white mb-1">Hours</h3>
                    <p className="text-sm text-white/50">Daily: 11AM-9PM EST</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-[#1a1a1a] py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-light text-white mb-12 leading-tight">
            Building the cannabis marketplace of the future.
          </h2>
          <p className="text-lg md:text-xl font-light text-white/50 leading-relaxed max-w-2xl mx-auto">
            Whether you're a customer, vendor, or partner—we're here to support you every step of the way.
          </p>
        </div>
      </section>
    </div>
  );
}
