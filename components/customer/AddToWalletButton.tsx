'use client';

import { useState } from 'react';
import { Wallet, Smartphone, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface AddToWalletButtonProps {
  customerId: string;
  variant?: 'full' | 'compact';
}

export default function AddToWalletButton({ customerId, variant = 'full' }: AddToWalletButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [walletLinks, setWalletLinks] = useState<{ apple?: string; google?: string } | null>(null);

  async function handleGetWalletPass() {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/customer/wallet-pass?customer_id=${customerId}`);
      const data = await response.json();

      if (!data.success) {
        if (data.needsEnrollment) {
          // Special handling for enrollment needed
          setError('Make your first purchase to join our loyalty program and get your digital wallet card!');
        } else {
          setError(data.error || 'Failed to get wallet pass');
        }
        setLoading(false);
        return;
      }

      setWalletLinks(data.walletPass);
      setSuccess(true);

      // Don't auto-redirect - user needs to open on mobile device
      // Alpine IQ wallet URLs only work properly on mobile devices

    } catch (err: any) {
      console.error('Failed to get wallet pass:', err);
      setError('Unable to load wallet pass. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleGetWalletPass}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] uppercase tracking-[0.15em] font-black hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading...
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
            Loyalty Card
          </h3>
          <p className="text-[10px] uppercase tracking-[0.15em] text-white/60">
            Add your loyalty card to your phone's wallet for easy access
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-[10px] uppercase tracking-[0.15em] text-red-300">{error}</p>
        </div>
      )}

      {success && walletLinks && (
        <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl">
          <div className="flex items-start gap-2 mb-2">
            <Smartphone className="w-4 h-4 text-blue-400 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-blue-300 font-black mb-1">
                Open on Your Phone
              </p>
              <p className="text-[10px] uppercase tracking-[0.15em] text-blue-300/80">
                This link must be opened on your mobile device to add to Apple Wallet or Google Wallet
              </p>
            </div>
          </div>
        </div>
      )}

      {!walletLinks ? (
        <button
          onClick={handleGetWalletPass}
          disabled={loading}
          className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-xl text-[10px] uppercase tracking-[0.15em] font-black hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Wallet Pass...
            </>
          ) : (
            <>
              <Smartphone className="w-5 h-5" />
              Get Wallet Pass
            </>
          )}
        </button>
      ) : (
        <div className="space-y-3">
          <button
            onClick={() => {
              if (walletLinks.apple) {
                navigator.clipboard.writeText(walletLinks.apple);
                alert('Wallet pass link copied! Open it on your phone to add to Apple Wallet or Google Wallet.');
              }
            }}
            className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-[0.15em] font-black text-white">Copy Link to Clipboard</div>
              <div className="text-[8px] uppercase tracking-[0.15em] text-white/60">Then paste in your phone's browser</div>
            </div>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <a
              href={`sms:?&body=Add my loyalty card to your wallet: ${walletLinks.apple || ''}`}
              className="bg-white/5 border border-white/10 px-4 py-3 rounded-xl hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-2 text-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <div className="text-[8px] uppercase tracking-[0.15em] font-black text-white">Text Me</div>
            </a>

            <a
              href={`mailto:?subject=My Loyalty Wallet Pass&body=Add your loyalty card to wallet: ${walletLinks.apple || ''}`}
              className="bg-white/5 border border-white/10 px-4 py-3 rounded-xl hover:bg-white/10 transition-all flex flex-col items-center justify-center gap-2 text-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div className="text-[8px] uppercase tracking-[0.15em] font-black text-white">Email Me</div>
            </a>
          </div>

          <div className="p-3 bg-white/5 rounded-xl">
            <p className="text-[9px] uppercase tracking-[0.15em] text-white/60 break-all">
              {walletLinks.apple || ''}
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <p className="text-[10px] uppercase tracking-[0.15em] text-blue-300">
          <strong className="font-black">💡 Tip:</strong> Show your digital loyalty card at checkout to earn points instantly
        </p>
      </div>
    </div>
  );
}
