'use client';

import { useEffect, useState } from 'react';
import { useAppAuth } from '@/context/AppAuthContext';
import { motion } from 'framer-motion';
import {
  Wallet,
  Smartphone,
  Users,
  TrendingUp,
  Apple,
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function WalletPassesPage() {
  const { vendor } = useAppAuth();
  const [stats, setStats] = useState({
    total_customers: 0,
    wallet_adds: 0,
    active_passes: 0,
  });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (vendor) {
      loadWalletStats();
    }
  }, [vendor]);

  async function loadWalletStats() {
    if (!vendor) return;
    try {
      // In a real implementation, you would fetch actual stats from your API
      // For now, we'll use placeholder data
      setStats({
        total_customers: 0,
        wallet_adds: 0,
        active_passes: 0,
      });
    } catch (error) {
      console.error('Failed to load wallet stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const customerLoyaltyUrl = vendor
    ? `${window.location.origin}/storefront/loyalty?vendor=${vendor.slug}`
    : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(customerLoyaltyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 lg:px-0 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xs uppercase tracking-[0.15em] text-white font-black mb-1">
              Wallet Passes
            </h1>
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/40">
              Apple & Google Wallet • Loyalty Cards • Digital Passes
            </p>
          </div>

          <Link
            href="/vendor/marketing"
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl transition-all"
          >
            <span className="text-xs text-white/80">← Back to Marketing</span>
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Total Customers"
          value={stats.total_customers}
          subtext="Eligible for wallet passes"
          icon={Users}
          color="purple"
        />
        <StatCard
          label="Wallet Additions"
          value={stats.wallet_adds}
          subtext="Customers with digital passes"
          icon={Wallet}
          color="blue"
        />
        <StatCard
          label="Active Passes"
          value={stats.active_passes}
          subtext="Currently in use"
          icon={Smartphone}
          color="green"
        />
      </div>

      {/* Customer Loyalty Link */}
      <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-8 mb-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
            <Wallet className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xs uppercase tracking-[0.15em] text-white font-black mb-2">
              Customer Loyalty Page
            </h3>
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/60 mb-4">
              Share this link with customers to let them add their loyalty card to Apple or Google Wallet
            </p>

            {/* URL Display */}
            <div className="flex items-center gap-2 p-4 bg-black/40 border border-white/10 rounded-xl mb-4">
              <code className="flex-1 text-sm text-white/80 font-mono truncate">
                {customerLoyaltyUrl}
              </code>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all"
              >
                {copied ? (
                  <>
                    <CheckCircle2 size={16} className="text-green-400" />
                    <span className="text-xs text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} className="text-white/60" />
                    <span className="text-xs text-white/80">Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Preview Button */}
            <a
              href={customerLoyaltyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
            >
              <ExternalLink size={16} className="text-white/60" />
              <span className="text-xs text-white/80">Preview Customer Page</span>
            </a>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Apple Wallet */}
        <div className="bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/5 rounded-xl">
              <Apple className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xs uppercase tracking-[0.15em] text-white font-black">
              Apple Wallet
            </h3>
          </div>

          <p className="text-[10px] uppercase tracking-[0.15em] text-white/60 mb-4">
            iOS customers can add their loyalty card directly to their iPhone's Wallet app
          </p>

          <div className="space-y-3">
            <Step number={1} text="Customer visits loyalty page" />
            <Step number={2} text="Taps 'Add to Apple Wallet' button" />
            <Step number={3} text="Card automatically added to Wallet app" />
            <Step number={4} text="Show card at checkout to earn points" />
          </div>
        </div>

        {/* Google Wallet */}
        <div className="bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/5 rounded-xl">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </div>
            <h3 className="text-xs uppercase tracking-[0.15em] text-white font-black">
              Google Wallet
            </h3>
          </div>

          <p className="text-[10px] uppercase tracking-[0.15em] text-white/60 mb-4">
            Android customers can add their loyalty card to Google Wallet for easy access
          </p>

          <div className="space-y-3">
            <Step number={1} text="Customer visits loyalty page" />
            <Step number={2} text="Taps 'Add to Google Wallet' button" />
            <Step number={3} text="Card saved to Google Wallet" />
            <Step number={4} text="Quick access from any Android device" />
          </div>
        </div>
      </div>

      {/* Integration Status */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-xs uppercase tracking-[0.15em] text-green-300 font-black mb-2">
              Wallet Integration Active
            </h3>
            <p className="text-[10px] uppercase tracking-[0.15em] text-green-300/80 mb-3">
              Your wallet pass integration is connected to Alpine IQ. Customers can now add their loyalty cards
              to Apple Wallet and Google Wallet.
            </p>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-green-300/60">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Alpine IQ Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  subtext: string;
  icon: any;
  color: 'blue' | 'purple' | 'green';
}) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/20 text-purple-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/20 text-green-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative bg-gradient-to-br ${colorClasses[color]} border rounded-2xl p-6 overflow-hidden`}
    >
      <Icon size={24} className="mb-4" />
      <div className="text-2xl font-black text-white mb-1">{value}</div>
      <div className="text-xs text-white/60 mb-1">{label}</div>
      <div className="text-[10px] text-white/40">{subtext}</div>
    </motion.div>
  );
}

// Step Component
function Step({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 border border-white/20">
        <span className="text-xs text-white/80 font-bold">{number}</span>
      </div>
      <p className="text-[10px] uppercase tracking-[0.15em] text-white/60">{text}</p>
    </div>
  );
}
