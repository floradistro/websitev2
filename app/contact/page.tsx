"use client";

import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";
import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Contact form submitted:", formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="bg-[#1a1a1a]">
      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center bg-[#1a1a1a] text-white px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-8"></div>
          <h1 className="text-5xl md:text-7xl font-light text-white mb-6 leading-tight tracking-tight">
            Get in Touch
          </h1>
          <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-12"></div>
          <p className="text-lg md:text-xl font-light text-white/50 leading-relaxed">
            Questions? Wholesale inquiry? We're here.
          </p>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="bg-[#2a2a2a] py-0">
        <div className="grid md:grid-cols-2">
          {/* Form */}
          <div className="px-8 md:px-12 py-16 bg-[#2a2a2a]">
            <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
              <div>
                <label htmlFor="name" className="block text-[10px] uppercase tracking-[0.2em] mb-3 text-white/60">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all duration-300"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
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
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all duration-300"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-[10px] uppercase tracking-[0.2em] mb-3 text-white/60">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all duration-300"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-[10px] uppercase tracking-[0.2em] mb-3 text-white/60">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all duration-300"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-[10px] uppercase tracking-[0.2em] mb-3 text-white/60">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={6}
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all duration-300 resize-none"
                />
              </div>

              <button
                type="submit"
                className="group w-full inline-flex items-center justify-center space-x-3 bg-black text-white px-12 py-4 text-xs uppercase tracking-[0.25em] hover:bg-black/70 transition-all duration-500 font-medium border border-white/20 hover:border-white/40 relative overflow-hidden"
              >
                <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <span className="relative z-10">Send Message</span>
                <ArrowRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div className="bg-[#3a3a3a] px-8 md:px-12 py-16 flex items-center">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-light text-white mb-8 uppercase tracking-wider">
                  Contact Information
                </h2>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4 group">
                  <div className="w-10 h-10 flex-shrink-0 border border-white/20 flex items-center justify-center group-hover:border-white/40 transition-colors duration-300">
                    <Mail size={18} className="text-white/60" />
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.15em] text-white mb-1">Email</h3>
                    <a href="mailto:info@floradistro.com" className="text-sm text-white/50 hover:text-white transition-colors">
                      info@floradistro.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="w-10 h-10 flex-shrink-0 border border-white/20 flex items-center justify-center group-hover:border-white/40 transition-colors duration-300">
                    <Phone size={18} className="text-white/60" />
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.15em] text-white mb-1">Phone</h3>
                    <a href="tel:+1234567890" className="text-sm text-white/50 hover:text-white transition-colors">
                      +1 (234) 567-890
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 group">
                  <div className="w-10 h-10 flex-shrink-0 border border-white/20 flex items-center justify-center group-hover:border-white/40 transition-colors duration-300">
                    <MapPin size={18} className="text-white/60" />
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
            Our mission is simple.
          </h2>
          <p className="text-lg md:text-xl font-light text-white/50 leading-relaxed max-w-2xl mx-auto">
            Connect quality cannabis from our facilities and trusted partner farms to stores and consumers. Fresh product, fair pricing, fast delivery.
          </p>
        </div>
      </section>
    </div>
  );
}
