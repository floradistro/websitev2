/**
 * Top Bar Component
 * Header with navigation and action buttons
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Settings, Check } from 'lucide-react';
import { VendorSelector } from './VendorSelector';
import { Vendor } from '@/lib/storefront-builder/types';

interface TopBarProps {
  vendors: Vendor[];
  selectedVendor: string;
  onVendorChange: (vendorId: string) => void;
  onShowConversationHistory: () => void;
  onShowAgentConfig: () => void;
}

export function TopBar({
  vendors,
  selectedVendor,
  onVendorChange,
  onShowConversationHistory,
  onShowAgentConfig,
}: TopBarProps) {
  const [lastSaveTime, setLastSaveTime] = useState<string>('');

  // Track auto-save status
  useEffect(() => {
    const updateSaveTime = () => {
      try {
        const timestamp = localStorage.getItem('code_backup_timestamp');
        if (timestamp) {
          const saveDate = new Date(timestamp);
          const now = new Date();
          const secondsAgo = Math.floor((now.getTime() - saveDate.getTime()) / 1000);

          if (secondsAgo < 10) {
            setLastSaveTime('just now');
          } else if (secondsAgo < 60) {
            setLastSaveTime(`${secondsAgo}s ago`);
          } else if (secondsAgo < 3600) {
            setLastSaveTime(`${Math.floor(secondsAgo / 60)}m ago`);
          } else {
            setLastSaveTime(`${Math.floor(secondsAgo / 3600)}h ago`);
          }
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    };

    // Update immediately and then every 5 seconds
    updateSaveTime();
    const interval = setInterval(updateSaveTime, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-black border-b border-white/5 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/dashboard"
          className="text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={2} />
        </Link>
        <div className="text-white text-sm font-black uppercase tracking-tight" style={{ fontWeight: 900 }}>
          Storefront Builder
        </div>

        {/* Auto-save indicator */}
        {lastSaveTime && (
          <div className="flex items-center gap-1.5 text-white/40 text-xs">
            <Check size={12} strokeWidth={2} className="text-emerald-400" />
            <span>Auto-saved {lastSaveTime}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <VendorSelector
          vendors={vendors}
          selectedVendor={selectedVendor}
          onVendorChange={onVendorChange}
        />

        <button
          onClick={onShowConversationHistory}
          className="bg-[#0a0a0a] border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-3 py-2 rounded-lg transition-all flex items-center gap-2"
        >
          <MessageSquare size={14} strokeWidth={2} />
          <span className="text-xs font-black uppercase tracking-tight" style={{ fontWeight: 900 }}>
            History
          </span>
        </button>

        <button
          onClick={onShowAgentConfig}
          className="bg-[#0a0a0a] border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-3 py-2 rounded-lg transition-all"
        >
          <Settings size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
