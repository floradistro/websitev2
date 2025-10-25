'use client';

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <Image 
                src="/yacht-club-logo.png" 
                alt="WhaleTools" 
                width={32} 
                height={32}
                className="object-contain"
              />
              <span className="text-xl font-light tracking-tight">WhaleTools</span>
            </Link>
            <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex justify-center md:justify-start">
            <div className="relative">
              <Image 
                src="/yacht-club-logo.png" 
                alt="WhaleTools" 
                width={60} 
                height={60}
                className="object-contain opacity-90 logo-breathe"
              />
              <div className="absolute inset-0 logo-glow"></div>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-light mb-6 tracking-tight text-center md:text-left">
            Privacy Policy
          </h1>
          <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-white/30 to-transparent mb-8 mx-auto md:mx-0"></div>
          <p className="text-white/50 mb-12 text-center md:text-left">Last updated: October 25, 2025</p>

          <style jsx>{`
            @keyframes breathe {
              0%, 100% { opacity: 0.9; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.02); }
            }
            @keyframes glow-pulse {
              0%, 100% { opacity: 0; }
              50% { opacity: 0.15; }
            }
            .logo-breathe {
              animation: breathe 4s ease-in-out infinite;
            }
            .logo-glow {
              background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
              animation: glow-pulse 4s ease-in-out infinite;
              pointer-events: none;
            }
          `}</style>

          <div className="space-y-12 text-white/60 leading-relaxed">
            {/* Section 1 */}
            <div className="border-l-2 border-white/10 pl-6">
              <h2 className="text-2xl font-light text-white/90 mb-4">1. Information We Collect</h2>
              <div className="space-y-4">
                <p>
                  We collect information that you provide directly to us when you create an account, 
                  use our services, or communicate with us. This includes:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Account information (name, email, password)</li>
                  <li>Business information (company name, address, tax ID)</li>
                  <li>Payment information (processed securely through third-party providers)</li>
                  <li>Usage data and analytics</li>
                  <li>Communications with our support team</li>
                </ul>
              </div>
            </div>

            {/* Section 2 */}
            <div className="border-l-2 border-white/10 pl-6">
              <h2 className="text-2xl font-light text-white/90 mb-4">2. How We Use Your Information</h2>
              <div className="space-y-4">
                <p>We use the information we collect to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send technical notices and support messages</li>
                  <li>Respond to your comments and questions</li>
                  <li>Monitor and analyze trends, usage, and activities</li>
                  <li>Detect, investigate, and prevent fraudulent transactions</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </div>
            </div>

            {/* Section 3 */}
            <div className="border-l-2 border-white/10 pl-6">
              <h2 className="text-2xl font-light text-white/90 mb-4">3. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your personal information. 
                This includes:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>End-to-end encryption for data in transit</li>
                <li>AES-256 encryption for data at rest</li>
                <li>Regular security audits and penetration testing</li>
                <li>Multi-factor authentication for all accounts</li>
                <li>Complete tenant isolation at the database level</li>
                <li>SOC 2 Type II compliance</li>
              </ul>
            </div>

            {/* Section 4 */}
            <div className="border-l-2 border-white/10 pl-6">
              <h2 className="text-2xl font-light text-white/90 mb-4">4. Data Sharing</h2>
              <p>
                We do not sell your personal information. We may share your information only in the 
                following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>With your explicit consent</li>
                <li>With service providers who assist in our operations</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and prevent fraud</li>
                <li>In connection with a business transaction (merger, acquisition)</li>
              </ul>
            </div>

            {/* Section 5 */}
            <div className="border-l-2 border-white/10 pl-6">
              <h2 className="text-2xl font-light text-white/90 mb-4">5. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Object to processing of your information</li>
                <li>Export your data in a portable format</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </div>

            {/* Section 6 */}
            <div className="border-l-2 border-white/10 pl-6">
              <h2 className="text-2xl font-light text-white/90 mb-4">6. Data Retention</h2>
              <p>
                We retain your information for as long as your account is active or as needed to 
                provide you services. We will retain and use your information as necessary to comply 
                with legal obligations, resolve disputes, and enforce our agreements.
              </p>
            </div>

            {/* Section 7 */}
            <div className="border-l-2 border-white/10 pl-6">
              <h2 className="text-2xl font-light text-white/90 mb-4">7. Cookies</h2>
              <p>
                We use cookies and similar tracking technologies to track activity on our service 
                and hold certain information. You can instruct your browser to refuse all cookies 
                or to indicate when a cookie is being sent.
              </p>
            </div>

            {/* Section 8 */}
            <div className="border-l-2 border-white/10 pl-6">
              <h2 className="text-2xl font-light text-white/90 mb-4">8. International Data Transfers</h2>
              <p>
                Your information may be transferred to and maintained on computers located outside 
                of your state, province, country, or other governmental jurisdiction where data 
                protection laws may differ. We ensure appropriate safeguards are in place for such 
                transfers.
              </p>
            </div>

            {/* Section 9 */}
            <div className="border-l-2 border-white/10 pl-6">
              <h2 className="text-2xl font-light text-white/90 mb-4">9. Children's Privacy</h2>
              <p>
                Our service is not intended for users under the age of 18. We do not knowingly 
                collect personal information from children under 18. If you become aware that a 
                child has provided us with personal information, please contact us.
              </p>
            </div>

            {/* Section 10 */}
            <div className="border-l-2 border-white/10 pl-6">
              <h2 className="text-2xl font-light text-white/90 mb-4">10. Changes to This Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes 
                by posting the new Privacy Policy on this page and updating the "Last updated" date. 
                You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </div>

            {/* Contact */}
            <div className="border-l-2 border-white/10 pl-6">
              <h2 className="text-2xl font-light text-white/90 mb-4">Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <div className="mt-4 space-y-2">
                <p className="font-mono text-white/70">privacy@whaletools.com</p>
                <p className="text-white/50 text-sm">We typically respond within 24-48 hours</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image 
                src="/yacht-club-logo.png" 
                alt="WhaleTools" 
                width={24} 
                height={24}
                className="object-contain opacity-60"
              />
              <span className="text-sm text-white/40">© 2025 WhaleTools. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-8">
              <Link href="/about" className="text-sm text-white/40 hover:text-white transition-colors">
                About
              </Link>
              <Link href="/partners" className="text-sm text-white/40 hover:text-white transition-colors">
                Partners
              </Link>
              <Link href="/api-status" className="text-sm text-white/40 hover:text-white transition-colors">
                API
              </Link>
              <Link href="/privacy" className="text-sm text-white/40 hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-sm text-white/40 hover:text-white transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
