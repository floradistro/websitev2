import Link from "next/link";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#1a1a1a] text-white mt-auto">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Company */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold mb-4 text-white">Company</h3>
            <ul className="space-y-2 text-sm text-white/60">
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
            <h3 className="text-xs uppercase tracking-wider font-semibold mb-4 text-white">Customer Service</h3>
            <ul className="space-y-2 text-sm text-white/60">
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

          {/* Legal */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold mb-4 text-white">Legal</h3>
            <ul className="space-y-2 text-sm text-white/60">
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
            <h3 className="text-xs uppercase tracking-wider font-semibold mb-4 text-white">Newsletter</h3>
            <p className="text-xs text-white/60 mb-3">
              Subscribe to receive updates, access to exclusive deals, and more.
            </p>
            <form className="space-y-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-2 border border-white/20 bg-white/5 focus:border-white/40 focus:outline-none text-sm text-white placeholder:text-white/40"
              />
              <button
                type="submit"
                className="w-full bg-black border border-white/20 text-white py-2 text-xs uppercase tracking-wider hover:bg-white hover:text-black hover:border-white transition-all duration-300"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Legal Compliance */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="space-y-3 max-w-5xl">
            <p className="text-[10px] text-white/40 leading-relaxed font-light">
              All products contain less than 0.3% hemp-derived Delta-9 THC in compliance with the 2018 Farm Bill.
            </p>
            <p className="text-[10px] text-white/40 leading-relaxed font-light">
              Products are not available for shipment to the following states: Arkansas, Hawaii, Idaho, Kansas, Louisiana, Oklahoma, Oregon, Rhode Island, Utah, Vermont.
            </p>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-white/60 mb-4 md:mb-0">
              © {new Date().getFullYear()} Flora Distro. All rights reserved.
            </p>
            <div className="flex items-center space-x-5">
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                <Facebook size={16} />
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                <Instagram size={16} />
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                <Twitter size={16} />
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                <Youtube size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
