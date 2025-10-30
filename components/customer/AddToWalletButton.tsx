'use client';

import { useState, useEffect } from 'react';
import { Wallet, Smartphone, AlertCircle, CheckCircle2, Loader2, QrCode } from 'lucide-react';

interface AddToWalletButtonProps {
  customerId: string;
  variant?: 'full' | 'compact';
}

export default function AddToWalletButton({ customerId, variant = 'full' }: AddToWalletButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [walletLinks, setWalletLinks] = useState<{ apple?: string; google?: string } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    // Detect if user is on mobile device
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'mobile'];
      return mobileKeywords.some(keyword => userAgent.includes(keyword));
    };
    setIsMobile(checkMobile());
  }, []);

  async function handleGetWalletPass() {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/customer/wallet-pass?customer_id=${customerId}`);
      const data = await response.json();

      if (!data.success) {
        if (data.needsEnrollment) {
          setError('Make your first purchase to join our loyalty program and get your digital wallet card!');
        } else {
          setError(data.error || 'Failed to get wallet pass');
        }
        setLoading(false);
        return;
      }

      setWalletLinks(data.walletPass);
      setSuccess(true);

      // Generate QR code for desktop users
      if (data.webWalletUrl) {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.webWalletUrl)}`;
        setQrCodeUrl(qrUrl);
      }

      // If on mobile, auto-redirect to Alpine IQ wallet page
      if (isMobile && data.webWalletUrl) {
        window.location.href = data.webWalletUrl;
      }

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

      {success && walletLinks && isMobile && (
        <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-green-300 font-black">
                Redirecting to Add Wallet Pass...
              </p>
            </div>
          </div>
          <p className="text-[9px] uppercase tracking-[0.15em] text-green-300/70 mt-2">
            You'll see an "Add to {navigator.userAgent.toLowerCase().includes('iphone') ? 'Apple' : 'Google'} Wallet" button on the next page
          </p>
        </div>
      )}

      {success && walletLinks && !isMobile && qrCodeUrl && (
        <div className="mb-4 p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl">
          <div className="flex flex-col items-center text-center">
            <QrCode className="w-5 h-5 text-blue-400 mb-3" />
            <p className="text-[10px] uppercase tracking-[0.15em] text-blue-300 font-black mb-2">
              Scan with Your Phone
            </p>
            <div className="bg-white p-3 rounded-lg mb-3">
              <img src={qrCodeUrl} alt="Wallet Pass QR Code" className="w-48 h-48" />
            </div>
            <p className="text-[9px] uppercase tracking-[0.15em] text-blue-300/80">
              Open your phone camera and scan this code to add your loyalty card to Apple Wallet or Google Wallet
            </p>
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
              Loading...
            </>
          ) : isMobile ? (
            <>
              <Wallet className="w-5 h-5" />
              Add to Wallet
            </>
          ) : (
            <>
              <QrCode className="w-5 h-5" />
              Get QR Code
            </>
          )}
        </button>
      ) : !isMobile ? (
        <div className="space-y-3">
          <div className="text-center p-3 bg-white/5 rounded-xl">
            <p className="text-[9px] uppercase tracking-[0.15em] text-white/60 mb-2">
              Or send to your phone:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  if (walletLinks.apple) {
                    navigator.clipboard.writeText(walletLinks.apple);
                    alert('Link copied! Paste it in your phone browser.');
                  }
                }}
                className="bg-white/5 border border-white/10 px-3 py-2 rounded-lg hover:bg-white/10 transition-all text-[8px] uppercase tracking-[0.15em] font-black"
              >
                Copy Link
              </button>
              <a
                href={`sms:?&body=${encodeURIComponent(walletLinks.apple || '')}`}
                className="bg-white/5 border border-white/10 px-3 py-2 rounded-lg hover:bg-white/10 transition-all text-[8px] uppercase tracking-[0.15em] font-black flex items-center justify-center"
              >
                Text Me
              </a>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <p className="text-[10px] uppercase tracking-[0.15em] text-blue-300">
          <strong className="font-black">💡 Tip:</strong> Show your digital loyalty card at checkout to earn points instantly
        </p>
      </div>
    </div>
  );
}
