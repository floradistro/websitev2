'use client';

import { useState } from 'react';
import { Wallet, Smartphone, AlertCircle, CheckCircle2, Loader2, Download } from 'lucide-react';

interface AddToWalletButtonProps {
  customerId: string;
  vendorId?: string;
  variant?: 'full' | 'compact';
}

export default function AddToWalletButton({
  customerId,
  vendorId,
  variant = 'full',
}: AddToWalletButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleAddToWallet() {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Build URL with params
      const url = new URL('/api/customer/wallet-pass', window.location.origin);
      url.searchParams.set('customer_id', customerId);
      if (vendorId) {
        url.searchParams.set('vendor_id', vendorId);
      }

      // Fetch the .pkpass file
      const response = await fetch(url.toString());

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate wallet pass');
      }

      // Get the blob
      const blob = await response.blob();

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'loyalty-pass.pkpass';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setSuccess(true);

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error('Failed to add to wallet:', err);
      setError(err.message || 'Unable to generate wallet pass. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleAddToWallet}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] uppercase tracking-[0.15em] font-black hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading...
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            Added!
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4" />
            Add to Wallet
          </>
        )}
      </button>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
          <Wallet className="w-6 h-6 text-purple-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-xs uppercase tracking-[0.15em] text-white font-black mb-2">
            Digital Loyalty Card
          </h3>
          <p className="text-[10px] uppercase tracking-[0.15em] text-white/60">
            Add your loyalty card to Apple Wallet for easy access and automatic updates
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-[10px] uppercase tracking-[0.15em] text-red-300">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-green-300 font-black">
                Pass Downloaded Successfully!
              </p>
            </div>
          </div>
          <p className="text-[9px] uppercase tracking-[0.15em] text-green-300/70 mt-2">
            Tap the downloaded file to add it to Apple Wallet. Your card will update automatically when you earn points.
          </p>
        </div>
      )}

      <button
        onClick={handleAddToWallet}
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 px-6 py-4 rounded-xl text-[10px] uppercase tracking-[0.15em] font-black hover:from-purple-500/30 hover:to-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating Your Pass...
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            Pass Ready - Download Again
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Add to Apple Wallet
          </>
        )}
      </button>

      {/* Benefits */}
      <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-2">
        <p className="text-[10px] uppercase tracking-[0.15em] text-blue-300 font-black mb-3">
          Benefits:
        </p>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-[9px] uppercase tracking-[0.15em] text-blue-300/80">
            Automatic updates when points change
          </p>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-[9px] uppercase tracking-[0.15em] text-blue-300/80">
            Quick access from lock screen
          </p>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-[9px] uppercase tracking-[0.15em] text-blue-300/80">
            Push notifications for special offers
          </p>
        </div>
      </div>

      {/* Device Info */}
      <div className="mt-4 p-3 bg-white/5 rounded-xl">
        <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.15em] text-white/40">
          <Smartphone className="w-3 h-3" />
          <span>Works on iPhone & Apple Watch</span>
        </div>
      </div>
    </div>
  );
}
