"use client";

import Link from "next/link";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { useState } from "react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address");
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStatus("success");
        setMessage("Successfully subscribed!");
        setEmail("");
        setTimeout(() => {
          setStatus("idle");
          setMessage("");
        }, 5000);
      } else {
        setStatus("error");
        setMessage("Failed to subscribe. Please try again.");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Failed to subscribe. Please try again.");
    }
  };

  return (
    <footer className="border-t border-white/10 bg-[#1a1a1a] text-white mt-auto">
      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10">
          {/* Company */}
          <div>
            <h3 className="text-xs sm:text-sm uppercase tracking-wider font-semibold mb-4 text-white">Company</h3>
            <ul className="space-y-2.5 text-sm sm:text-base text-white/60">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/sustainability" className="hover:text-white transition-colors">
                  Sustainability
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-white transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-xs sm:text-sm uppercase tracking-wider font-semibold mb-4 text-white">Customer Service</h3>
            <ul className="space-y-2.5 text-sm sm:text-base text-white/60">
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-white transition-colors">
                  Shipping
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-white transition-colors">
                  Returns
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-white transition-colors">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* For Vendors */}
          <div>
            <h3 className="text-xs sm:text-sm uppercase tracking-wider font-semibold mb-4 text-white">For Vendors</h3>
            <ul className="space-y-2.5 text-sm sm:text-base text-white/60">
              <li>
                <Link href="/vendors" className="hover:text-white transition-colors">
                  Browse Vendors
                </Link>
              </li>
              <li>
                <Link href="/vendor/login" className="hover:text-white transition-colors">
                  Vendor Portal
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Become a Vendor
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs sm:text-sm uppercase tracking-wider font-semibold mb-4 text-white">Legal</h3>
            <ul className="space-y-2.5 text-sm sm:text-base text-white/60">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-white transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-xs sm:text-sm uppercase tracking-wider font-semibold mb-4 text-white">Newsletter</h3>
            <p className="text-xs sm:text-sm text-white/60 mb-4">
              Subscribe to receive updates, access to exclusive deals, and more.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={status === "loading"}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-white/20 bg-white/5 focus:border-white/40 focus:outline-none text-sm text-white placeholder:text-white/40 disabled:opacity-50 rounded-sm"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-black border border-white/20 text-white py-2.5 sm:py-3 text-xs uppercase tracking-wider hover:bg-white hover:text-black hover:border-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "loading" ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
            {message && (
              <p className={`text-xs sm:text-sm mt-2 ${status === "success" ? "text-green-400" : "text-red-400"}`}>
                {message}
              </p>
            )}
          </div>
        </div>

        {/* Legal Compliance */}
        <div className="mt-10 sm:mt-12 pt-6 sm:pt-8 border-t border-white/10">
          <div className="space-y-3 max-w-5xl">
            <p className="text-xs text-white/40 leading-relaxed font-light">
              All products contain less than 0.3% hemp-derived Delta-9 THC in compliance with the 2018 Farm Bill.
            </p>
            <p className="text-xs text-white/40 leading-relaxed font-light">
              Products are not available for shipment to the following states: Arkansas, Hawaii, Idaho, Kansas, Louisiana, Oklahoma, Oregon, Rhode Island, Utah, Vermont.
            </p>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-6 sm:mt-8 pt-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-white/60">
              © {new Date().getFullYear()} Yacht Club. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              <a 
                href="https://www.facebook.com/floradistro" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
              >
                <Facebook size={18} />
              </a>
              <a 
                href="https://www.instagram.com/floradistro" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
              >
                <Instagram size={18} />
              </a>
              <a 
                href="https://twitter.com/floradistro" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
              >
                <Twitter size={18} />
              </a>
              <a 
                href="https://www.youtube.com/@floradistro" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
              >
                <Youtube size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
