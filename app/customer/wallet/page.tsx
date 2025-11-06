'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Wallet, Download, Smartphone, CheckCircle2, AlertCircle } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function CustomerWalletContent() {
  const searchParams = useSearchParams();
  const vendorSlug = searchParams.get('vendor');
  const customerId = searchParams.get('customer');

  const [vendor, setVendor] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [vendorSlug, customerId]);

  async function loadData() {
    try {
      if (!vendorSlug) {
        setError('Vendor not specified');
        setLoading(false);
        return;
      }

      // Get vendor by slug
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('slug', vendorSlug)
        .single();

      if (vendorError || !vendorData) {
        setError('Vendor not found');
        setLoading(false);
        return;
      }

      setVendor(vendorData);

      // If customer ID provided, load customer data
      if (customerId) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('*')
          .eq('id', customerId)
          .single();

        if (customerData) {
          setCustomer(customerData);
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load page');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload() {
    if (!vendor) return;

    setDownloading(true);
    setError('');

    try {
      // If no customer ID, show error
      if (!customerId) {
        setError('Customer ID required. Please use the link from your email or text message.');
        setDownloading(false);
        return;
      }

      const url = `/api/customer/wallet-pass?customer_id=${customerId}&vendor_id=${vendor.id}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to generate pass');
      }

      // Download the pass
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${vendor.slug}-loyalty-pass.pkpass`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to download wallet pass. Please try again.');
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-xs text-white/40">Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !vendor) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black p-6">
        <div className="max-w-md w-full bg-white/[0.02] border border-white/10 rounded-3xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500/60 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">Error</h1>
          <p className="text-sm text-white/60">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          {vendor?.logo_url && (
            <div className="w-24 h-24 mx-auto mb-6 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center overflow-hidden">
              <img src={vendor.logo_url} alt={vendor.store_name} className="w-full h-full object-contain p-3" />
            </div>
          )}
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-3">
            Add to Apple Wallet
          </h1>
          <p className="text-base text-white/60">
            Get your {vendor?.store_name || 'loyalty'} card in your wallet
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 mb-8">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white mb-2">Digital Loyalty Card</h2>
              <p className="text-sm text-white/60 leading-relaxed">
                Add your loyalty card to Apple Wallet for easy access. Your points will automatically update when you make purchases.
              </p>
            </div>
          </div>

          {customer && (
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-white">Customer Details</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/40">Name</span>
                  <span className="text-white">{customer.first_name} {customer.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Points</span>
                  <span className="text-white font-medium">{customer.loyalty_points || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Tier</span>
                  <span className="text-white">{customer.loyalty_tier || 'Bronze'}</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-500">{error}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleDownload}
            disabled={downloading || !customerId}
            className="w-full bg-white text-black rounded-xl px-6 py-4 text-sm font-medium hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {downloading ? (
              <>
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Generating Pass...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download Wallet Pass
              </>
            )}
          </button>

          {!customerId && (
            <div className="mt-4 flex items-start gap-3 p-4 bg-white/[0.02] border border-white/10 rounded-xl">
              <AlertCircle className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-white/60">
                This link requires a customer ID. Please use the personalized link sent to you via email or text message.
              </p>
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="space-y-6">
          <h3 className="text-sm font-medium text-white/80 mb-6">How It Works</h3>

          <div className="flex gap-4">
            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-sm font-medium text-white flex-shrink-0">
              1
            </div>
            <div>
              <div className="text-sm font-medium text-white mb-1">Download Your Pass</div>
              <div className="text-xs text-white/40 leading-relaxed">
                Tap the button above to download your .pkpass file
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-sm font-medium text-white flex-shrink-0">
              2
            </div>
            <div>
              <div className="text-sm font-medium text-white mb-1">Open in Wallet</div>
              <div className="text-xs text-white/40 leading-relaxed">
                The pass will automatically open in Apple Wallet. Tap "Add" to save it.
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-sm font-medium text-white flex-shrink-0">
              3
            </div>
            <div>
              <div className="text-sm font-medium text-white mb-1">Use at Checkout</div>
              <div className="text-xs text-white/40 leading-relaxed">
                Show your pass at checkout to earn and redeem points. Updates automatically!
              </div>
            </div>
          </div>
        </div>

        {/* Device Support */}
        <div className="mt-12 flex items-start gap-3 p-6 bg-white/[0.02] border border-white/10 rounded-2xl">
          <Smartphone className="w-5 h-5 text-white/40 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-white/60 leading-relaxed">
            <strong className="text-white">Compatible with iPhone & Apple Watch.</strong> Make sure you have the latest version of iOS for the best experience. Your pass will sync across all your Apple devices.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerWalletPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-xs text-white/40">Loading...</p>
        </div>
      </div>
    }>
      <CustomerWalletContent />
    </Suspense>
  );
}
