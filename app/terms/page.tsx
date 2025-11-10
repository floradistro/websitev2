import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
            <Link
              href="/"
              className="text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2"
            >
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
            Terms of Service
          </h1>
          <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-white/30 to-transparent mb-8 mx-auto md:mx-0"></div>
          <p className="text-white/50 mb-12 text-center md:text-left">
            Last updated: October 25, 2025
          </p>

          <div className="space-y-12 text-white/60 leading-relaxed">
            {/* Section 1 */}
            <div className="border-l-2 border-white/10 pl-6">
              <h2 className="text-2xl font-light text-white/90 mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using WhaleTools ("Service"), you accept and agree to be bound by
                the terms and provision of this agreement. If you do not agree to these Terms of
                Service, please do not use the Service.
              </p>
            </div>

            {/* Section 2 */}
            <div className="border-l-2 border-white/10 pl-6">
              <h2 className="text-2xl font-light text-white/90 mb-4">2. Description of Service</h2>
              <p>
                WhaleTools provides a multi-tenant commerce platform that enables partners to
                create, manage, and operate unlimited e-commerce storefronts. The Service includes
                but is not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>Storefront creation and management tools</li>
                <li>Product catalog management</li>
                <li>Order processing and fulfillment</li>
                <li>Payment processing integration</li>
                <li>Analytics and reporting</li>
                <li>API access for custom integrations</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div className="border-l-2 border-white/10 pl-6">
              <h2 className="text-2xl font-light text-white/90 mb-4">3. Account Registration</h2>
              <div className="space-y-4">
                <p>To use the Service, you must:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Be at least 18 years of age</li>
                  <li>Provide accurate and complete registration information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>Be responsible for all activities under your account</li>
                </ul>
              </div>
            </div>

            {/* Section 4 */}
            <div className="border-l-2 border-white/10 pl-6">
              <h2 className="text-2xl font-light text-white/90 mb-4">4. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
                <li>Use the Service for any illegal purposes</li>
                <li>Violate any laws in your jurisdiction</li>
                <li>Infringe upon intellectual property rights</li>
                <li>Transmit malicious code or viruses</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Collect or harvest user information</li>
                <li>Impersonate any person or entity</li>
              </ul>
            </div>

            {/* Section 5 */}
            <div className="border-l-2 border-white/10 pl-6">
              <h2 className="text-2xl font-light text-white/90 mb-4">5. Payment Terms</h2>
              <div className="space-y-4">
                <p>Partner subscription fees:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Fees are billed monthly in advance</li>
                  <li>All fees are non-refundable except as required by law</li>
                  <li>We reserve the right to change pricing with 30 days notice</li>
                  <li>Failure to pay may result in service suspension</li>
                  <li>You are responsible for all applicable taxes</li>
                </ul>
              </div>
            </div>

            {/* Section 6 */}
            <div className="border-l-2 border-white/10 pl-6">
              <h2 className="text-2xl font-light text-white/90 mb-4">6. Intellectual Property</h2>
              <p>
                The Service and its original content, features, and functionality are owned by
                WhaleTools and are protected by international copyright, trademark, patent, trade
                secret, and other intellectual property laws.
              </p>
              <p className="mt-4">
                You retain all rights to content you upload to the Service. By uploading content,
                you grant us a worldwide, non-exclusive license to use, host, and display that
                content for the purpose of operating and providing the Service.
              </p>
            </div>

            {/* Section 7 */}
            <div className="border-l-2 border-white/10 pl-6">
              <h2 className="text-2xl font-light text-white/90 mb-4">7. Service Level Agreement</h2>
              <div className="space-y-4">
                <p>We commit to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>99.9% uptime guarantee (excluding scheduled maintenance)</li>
                  <li>Maximum 4 hours scheduled maintenance per month</li>
                  <li>24-hour advance notice for planned downtime</li>
                  <li>Response time of 1 hour for critical issues</li>
                </ul>
                <p className="mt-4">
                  In the event we fail to meet our uptime guarantee, you may be eligible for service
                  credits as outlined in our SLA documentation.
                </p>
              </div>
            </div>

            {/* Section 8 */}
            <div className="border-l-2 border-white/10 pl-6">
              <h2 className="text-2xl font-light text-white/90 mb-4">8. Data and Privacy</h2>
              <p>
                Your use of the Service is also governed by our Privacy Policy. We take data
                protection seriously and implement industry-standard security measures. You are
                responsible for ensuring your use of the Service complies with applicable data
                protection laws, including GDPR and CCPA.
              </p>
            </div>

            {/* Section 9 */}
            <div className="border-l-2 border-white/10 pl-6">
              <h2 className="text-2xl font-light text-white/90 mb-4">9. Termination</h2>
              <p>
                We may terminate or suspend your account immediately, without prior notice or
                liability, for any reason, including breach of these Terms. Upon termination, your
                right to use the Service will cease immediately.
              </p>
              <p className="mt-4">
                You may terminate your account at any time by contacting us. Upon termination, we
                will provide you with an export of your data within 30 days.
              </p>
            </div>

            {/* Section 10 */}
            <div className="border-l-2 border-white/10 pl-6">
              <h2 className="text-2xl font-light text-white/90 mb-4">
                10. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by law, WhaleTools shall not be liable for any
                indirect, incidental, special, consequential, or punitive damages, or any loss of
                profits or revenues, whether incurred directly or indirectly, or any loss of data,
                use, goodwill, or other intangible losses.
              </p>
            </div>

            {/* Section 11 */}
            <div className="border-l-2 border-white/10 pl-6">
              <h2 className="text-2xl font-light text-white/90 mb-4">11. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless WhaleTools, its officers, directors,
                employees, and agents from any claims, damages, losses, liabilities, and expenses
                arising out of your use of the Service or violation of these Terms.
              </p>
            </div>

            {/* Section 12 */}
            <div className="border-l-2 border-white/10 pl-6">
              <h2 className="text-2xl font-light text-white/90 mb-4">12. Dispute Resolution</h2>
              <p>
                Any disputes arising out of or relating to these Terms or the Service shall be
                resolved through binding arbitration in accordance with the rules of the American
                Arbitration Association, except where prohibited by law.
              </p>
            </div>

            {/* Section 13 */}
            <div className="border-l-2 border-white/10 pl-6">
              <h2 className="text-2xl font-light text-white/90 mb-4">13. Modifications</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will provide notice of
                material changes by email or through the Service. Your continued use of the Service
                after such modifications constitutes acceptance of the updated Terms.
              </p>
            </div>

            {/* Section 14 */}
            <div className="border-l-2 border-white/10 pl-6">
              <h2 className="text-2xl font-light text-white/90 mb-4">14. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the
                State of California, United States, without regard to its conflict of law
                provisions.
              </p>
            </div>

            {/* Contact */}
            <div className="border-l-2 border-white/10 pl-6">
              <h2 className="text-2xl font-light text-white/90 mb-4">Contact Us</h2>
              <p>If you have any questions about these Terms of Service, please contact us at:</p>
              <div className="mt-4 space-y-2">
                <p className="font-mono text-white/70">legal@whaletools.com</p>
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
              <span className="text-sm text-white/40">
                © 2025 WhaleTools. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-8">
              <Link
                href="/about"
                className="text-sm text-white/40 hover:text-white transition-colors"
              >
                About
              </Link>
              <Link
                href="/partners"
                className="text-sm text-white/40 hover:text-white transition-colors"
              >
                Partners
              </Link>
              <Link
                href="/api-status"
                className="text-sm text-white/40 hover:text-white transition-colors"
              >
                API
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-white/40 hover:text-white transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-white/40 hover:text-white transition-colors"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
