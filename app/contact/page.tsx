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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-black via-[#1a1a1a] to-black text-white py-20 md:py-32 px-4 md:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03),transparent_50%)]"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-block px-4 py-1.5 bg-white/10 border border-white/20 text-[10px] uppercase tracking-[0.3em] mb-6 backdrop-blur-sm animate-fadeIn">
            Get In Touch
          </div>
          <h1 className="text-4xl md:text-6xl font-light mb-4 leading-tight animate-fadeIn" style={{ animationDelay: '0.1s' }}>
            Contact Us
          </h1>
          <p className="text-base md:text-lg font-light text-white/60 max-w-2xl mx-auto animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            Questions, orders, or collaboration opportunities—our team is ready to help.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="bg-[#b5b5b2] py-16 md:py-24 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div className="animate-fadeIn" style={{ animationDelay: '0.3s' }}>
              <h2 className="text-2xl font-light uppercase tracking-wider mb-8">
                Send Us a Message
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="group">
                  <label htmlFor="name" className="block text-[10px] uppercase tracking-[0.2em] mb-3 font-medium text-black/70 group-focus-within:text-black transition-colors">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-5 py-4 text-sm bg-white/80 backdrop-blur-sm border-0 focus:outline-none focus:bg-white focus:shadow-lg transition-all duration-300 font-light"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
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
                      required
                      className="w-full px-5 py-4 text-sm bg-white/80 backdrop-blur-sm border-0 focus:outline-none focus:bg-white focus:shadow-lg transition-all duration-300 font-light"
                    />
                  </div>

                  <div className="group">
                    <label htmlFor="phone" className="block text-[10px] uppercase tracking-[0.2em] mb-3 font-medium text-black/70 group-focus-within:text-black transition-colors">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-5 py-4 text-sm bg-white/80 backdrop-blur-sm border-0 focus:outline-none focus:bg-white focus:shadow-lg transition-all duration-300 font-light"
                    />
                  </div>
                </div>

                <div className="group">
                  <label htmlFor="subject" className="block text-[10px] uppercase tracking-[0.2em] mb-3 font-medium text-black/70 group-focus-within:text-black transition-colors">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-5 py-4 text-sm bg-white/80 backdrop-blur-sm border-0 focus:outline-none focus:bg-white focus:shadow-lg transition-all duration-300 font-light"
                  />
                </div>

                <div className="group">
                  <label htmlFor="message" className="block text-[10px] uppercase tracking-[0.2em] mb-3 font-medium text-black/70 group-focus-within:text-black transition-colors">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    required
                    className="w-full px-5 py-4 text-sm bg-white/80 backdrop-blur-sm border-0 focus:outline-none focus:bg-white focus:shadow-lg transition-all duration-300 resize-none font-light"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center space-x-3 bg-black text-white px-8 py-5 text-xs uppercase tracking-[0.2em] hover:bg-black/90 transition-all duration-300 font-medium shadow-elevated hover:shadow-elevated-lg group"
                >
                  <span>Send Message</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
              <div>
                <h2 className="text-2xl font-light uppercase tracking-wider mb-4">
                  Get in Touch
                </h2>
                <p className="text-sm font-light text-black/60 leading-relaxed">
                  Whether you're interested in our products, have questions about our services, or want to discuss a partnership, our team is ready to help.
                </p>
              </div>

              <div className="space-y-6">
                <div className="bg-white/60 backdrop-blur-sm p-6 hover:bg-white/80 transition-all duration-300">
                  <div className="flex items-start space-x-4">
                    <Mail className="mt-1 flex-shrink-0" size={20} />
                    <div>
                      <h3 className="text-[10px] uppercase tracking-[0.2em] mb-2 font-medium">
                        Email
                      </h3>
                      <a
                        href="mailto:info@floradistro.com"
                        className="text-sm font-light text-black/70 hover:text-black transition-colors"
                      >
                        info@floradistro.com
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-sm p-6 hover:bg-white/80 transition-all duration-300">
                  <div className="flex items-start space-x-4">
                    <Phone className="mt-1 flex-shrink-0" size={20} />
                    <div>
                      <h3 className="text-[10px] uppercase tracking-[0.2em] mb-2 font-medium">
                        Phone
                      </h3>
                      <a
                        href="tel:+1234567890"
                        className="text-sm font-light text-black/70 hover:text-black transition-colors"
                      >
                        +1 (234) 567-890
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-white/60 backdrop-blur-sm p-6 hover:bg-white/80 transition-all duration-300">
                  <div className="flex items-start space-x-4">
                    <MapPin className="mt-1 flex-shrink-0" size={20} />
                    <div>
                      <h3 className="text-[10px] uppercase tracking-[0.2em] mb-2 font-medium">
                        Address
                      </h3>
                      <p className="text-sm font-light text-black/70">
                        123 Flora Avenue<br />
                        New York, NY 10001<br />
                        United States
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Hours */}
              <div className="bg-[#8a8a87] text-white p-8">
                <h3 className="text-[10px] uppercase tracking-[0.2em] mb-6 font-medium">
                  Business Hours
                </h3>
                <div className="space-y-3 text-sm font-light">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span className="text-white/80">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span className="text-white/80">10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span className="text-white/80">Closed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
