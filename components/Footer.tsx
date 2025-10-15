import Link from "next/link";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-[#a8a8a5] bg-[#c5c5c2] mt-auto">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Company */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-[#767676]">
              <li>
                <Link href="/about" className="hover:text-black transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/sustainability" className="hover:text-black transition-colors">
                  Sustainability
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-black transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-black transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2 text-sm text-[#767676]">
              <li>
                <Link href="/faq" className="hover:text-black transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-black transition-colors">
                  Shipping
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-black transition-colors">
                  Returns
                </Link>
              </li>
              <li>
                <Link href="/track" className="hover:text-black transition-colors">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-[#767676]">
              <li>
                <Link href="/privacy" className="hover:text-black transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-black transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-black transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold mb-4">Newsletter</h3>
            <p className="text-xs text-[#767676] mb-3">
              Subscribe to receive updates, access to exclusive deals, and more.
            </p>
            <form className="space-y-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-4 py-2 border border-[#a8a8a5] focus:border-black focus:outline-none text-sm"
              />
              <button
                type="submit"
                className="w-full bg-black text-white py-2 text-xs uppercase tracking-wider hover:bg-[#333] transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12 pt-6 border-t border-[#a8a8a5]">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-[#767676] mb-4 md:mb-0">
              © {new Date().getFullYear()} Flora Distro. All rights reserved.
            </p>
            <div className="flex items-center space-x-5">
              <a href="#" className="text-[#767676] hover:text-black transition-colors">
                <Facebook size={16} />
              </a>
              <a href="#" className="text-[#767676] hover:text-black transition-colors">
                <Instagram size={16} />
              </a>
              <a href="#" className="text-[#767676] hover:text-black transition-colors">
                <Twitter size={16} />
              </a>
              <a href="#" className="text-[#767676] hover:text-black transition-colors">
                <Youtube size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
