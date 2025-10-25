import { headers } from 'next/headers';
import { getVendorFromHeaders, getVendorStorefront } from '@/lib/storefront/get-vendor';
import { getServiceSupabase } from '@/lib/supabase/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { FlaskConical, Download, FileCheck, Calendar, CheckCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function LabResultsPage() {
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  const vendor = await getVendorStorefront(vendorId);

  if (!vendor) {
    notFound();
  }

  // Fetch COAs from vendor's storage bucket
  const supabase = getServiceSupabase();
  
  // Get vendor's COA files from storage
  const { data: files, error } = await supabase
    .storage
    .from('vendor-coas')
    .list(`${vendorId}`, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    });

  const coaFiles = files || [];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-black to-[#141414]" />
        <div className="absolute inset-0 bg-gradient-to-tr from-neutral-950/50 via-transparent to-neutral-900/50" />
      </div>

      {/* Breadcrumb */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-3">
          <nav className="flex items-center gap-x-2 text-xs uppercase tracking-wider">
            <Link href="/storefront" className="text-white/40 hover:text-white transition-colors">Home</Link>
            <span className="text-white/20">/</span>
            <span className="text-white/60 font-medium">Lab Results</span>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="py-32 px-6 relative">
          <div className="absolute inset-0 bg-black/65 backdrop-blur-xl" />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            {/* Animated Logo */}
            {vendor.logo_url && (
              <div className="mb-12 flex justify-center">
                <div className="relative w-32 h-32 md:w-40 md:h-40 animate-fadeIn">
                  <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '3s' }} />
                  <img 
                    src={vendor.logo_url} 
                    alt={vendor.store_name}
                    className="relative w-full h-full object-contain drop-shadow-2xl hover:scale-110 transition-transform duration-500"
                  />
                </div>
              </div>
            )}
            
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 uppercase tracking-[-0.03em]">
              Lab Results
            </h1>
            
            <p className="text-2xl text-neutral-400 font-light leading-relaxed">
              Third-party tested. Full transparency.
            </p>
          </div>
        </section>

        {/* Commitment Section */}
        <section className="py-16 px-6 relative">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 md:p-10">
              <h2 className="text-3xl font-bold text-white mb-6 tracking-tight">Our Testing Commitment</h2>
              <div className="space-y-4 text-neutral-300 font-light leading-relaxed">
                <p className="text-lg">
                  Every product sold by {vendor.store_name} undergoes rigorous third-party laboratory testing. 
                  We don't just meet industry standards—we exceed them.
                </p>
                <p>
                  Each Certificate of Analysis (COA) verifies:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-semibold">Cannabinoid Profile</p>
                      <p className="text-sm text-neutral-400">THC, CBD, and minor cannabinoid percentages</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-semibold">Terpene Analysis</p>
                      <p className="text-sm text-neutral-400">Complete terpene breakdown</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-semibold">Pesticide Screening</p>
                      <p className="text-sm text-neutral-400">Zero pesticide contamination</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-semibold">Heavy Metals</p>
                      <p className="text-sm text-neutral-400">Lead, arsenic, mercury screening</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-semibold">Microbial Testing</p>
                      <p className="text-sm text-neutral-400">Bacteria and mold analysis</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-semibold">Residual Solvents</p>
                      <p className="text-sm text-neutral-400">For concentrate products</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COA Files Section */}
        <section className="py-16 px-6 relative">
          <div className="absolute inset-0 bg-black/65 backdrop-blur-xl" />
          <div className="max-w-6xl mx-auto relative z-10">
            <h2 className="text-3xl font-bold text-white mb-8 text-center tracking-tight">
              Certificates of Analysis
            </h2>

            {coaFiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {coaFiles.map((file) => {
                  const fileName = file.name;
                  const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vendor-coas/${vendorId}/${fileName}`;
                  
                  // Parse file name to extract product name (remove extension and vendor ID)
                  const displayName = fileName
                    .replace(/\.[^/.]+$/, '') // Remove extension
                    .replace(/_/g, ' ') // Replace underscores with spaces
                    .replace(/^\d+[-_]/, ''); // Remove leading numbers/dashes
                  
                  const fileDate = file.created_at 
                    ? new Date(file.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })
                    : 'N/A';

                  return (
                    <a
                      key={file.id}
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group bg-white/5 border border-white/10 rounded-[24px] p-6 hover:bg-white/[0.08] hover:border-white/20 transition-all hover:shadow-xl hover:shadow-white/5 hover:-translate-y-1"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-[16px] bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-all">
                          <FileCheck className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold mb-1 truncate group-hover:text-neutral-100 transition-colors">
                            {displayName}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-neutral-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{fileDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-white/60 group-hover:text-white group-hover:gap-3 transition-all">
                        <Download className="w-4 h-4" />
                        <span>Download PDF</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-[32px] p-12 text-center">
                <FlaskConical className="w-16 h-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-3">Lab Results Coming Soon</h3>
                <p className="text-neutral-400">
                  We're currently uploading our complete library of lab test results. Check back soon.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Compliance Section */}
        <section className="py-16 px-6 relative">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="bg-white/5 border border-white/20 rounded-[32px] p-8">
              <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">100% Compliant</h2>
              <p className="text-neutral-300 leading-relaxed">
                All products contain less than 0.3% Delta-9 THC and comply with the 2018 Farm Bill. 
                Lab results are updated regularly and available for every product we sell.
              </p>
              <p className="text-sm text-neutral-400 mt-4">
                Testing performed by ISO-certified third-party laboratories.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6 relative">
          <div className="absolute inset-0 bg-black/65 backdrop-blur-xl" />
          <div className="max-w-3xl mx-auto text-center relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-[-0.03em]">
              Questions about our testing?
            </h2>
            <p className="text-lg text-neutral-400 font-light mb-10">
              We're happy to provide detailed lab results for any product.
            </p>
            <Link
              href="/storefront/contact?vendor=flora-distro"
              className="inline-flex items-center gap-3 bg-white text-black px-10 py-5 rounded-full text-base font-bold uppercase tracking-wider hover:bg-neutral-100 transition-all duration-300 shadow-2xl shadow-white/20 hover:shadow-white/30 hover:scale-105"
            >
              <span>Contact Us</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

