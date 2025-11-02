'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAppAuth } from '@/context/AppAuthContext';
import Image from 'next/image';
import { DollarSign, ChevronDown, MapPin, User, CreditCard, ShoppingBag, Clock, LogOut, Package } from 'lucide-react';
import { POSModal } from './POSModal';
import { POSCashDrawer } from './POSCashDrawer';
import { supabase } from '@/lib/supabase/client';

interface POSSession {
  id: string;
  session_number: string;
  status: string;
  opening_cash: number;
  total_sales: number;
  total_transactions: number;
  walk_in_sales: number;
  pickup_orders_fulfilled: number;
  opened_at: string;
}

interface CashMovementSummary {
  opening: number;
  sales: number;
  refunds: number;
  no_sales: number;
  paid_in: number;
  paid_out: number;
  current_balance: number;
  movement_count: number;
}

interface POSVendorDropdownProps {
  locationId: string;
  locationName: string;
  userId?: string;
  userName?: string;
  vendorId?: string;
  registerId?: string;
  onSessionClosed?: () => void;
}

export function POSVendorDropdown({
  locationId,
  locationName,
  userId,
  userName = 'Staff',
  vendorId = 'cd2e1122-d511-4edb-be5d-98ef274b4baf',
  registerId,
  onSessionClosed,
}: POSVendorDropdownProps) {
  const { vendor, refreshUserData } = useAppAuth();
  const [session, setSession] = useState<POSSession | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showCashDrawer, setShowCashDrawer] = useState(false);
  const [cashSummary, setCashSummary] = useState<CashMovementSummary | null>(null);
  const [modal, setModal] = useState<{isOpen: boolean; title: string; message: string; type: 'success'|'error'|'info'; onConfirm?: () => void; confirmText?: string; cancelText?: string}>({
    isOpen: false, title: '', message: '', type: 'info'
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Refresh vendor data on mount
  useEffect(() => {
    if (vendor) {
      refreshUserData();
    }
  }, []);

  const loadActiveSession = useCallback(async () => {
    if (!registerId) return;

    try {
      const response = await fetch(`/api/pos/sessions/active?locationId=${locationId}&registerId=${registerId}`);

      if (response.ok) {
        const data = await response.json();
        setSession(data.session);

        if (data.session) {
          loadCashMovements(data.session.id);
        }
      } else {
        setSession(null);
      }
    } catch (error) {
      console.error('Error loading session:', error);
      setSession(null);
    }
  }, [locationId, registerId]);

  const loadCashMovements = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/pos/cash-movements?sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setCashSummary(data.summary);
      }
    } catch (error) {
      console.error('Error loading cash movements:', error);
    }
  };

  useEffect(() => {
    if (!registerId) return;

    loadActiveSession();

    // Real-time listener for session changes
    const channel = supabase
      .channel(`vendor-dropdown-sessions-${registerId}-${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pos_sessions',
        filter: `register_id=eq.${registerId}`,
      }, (payload) => {
        console.log('🔄 Vendor dropdown - session changed:', payload.eventType);
        loadActiveSession();
      })
      .subscribe();

    // Backup polling every 10 seconds
    const interval = setInterval(loadActiveSession, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [loadActiveSession, registerId]);

  const getSessionDuration = () => {
    if (!session) return '--';
    const start = new Date(session.opened_at);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const closeSession = async () => {
    setModal({
      isOpen: true,
      title: 'End Session?',
      message: `Are you sure you want to end session ${session?.session_number}?\n\nTotal Sales: $${session?.total_sales.toFixed(2)}\nTransactions: ${session?.total_transactions}`,
      type: 'info',
      confirmText: 'End Session',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          const response = await fetch('/api/pos/sessions/close', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: session?.id,
              closingCash: cashSummary?.current_balance || session?.opening_cash || 0
            }),
          });

          if (response.ok) {
            setModal({ isOpen: false, title: '', message: '', type: 'success' });
            loadActiveSession();
            setIsOpen(false);
            // Notify parent that session was closed
            if (onSessionClosed) {
              onSessionClosed();
            }
          } else {
            const error = await response.json();
            setModal({
              isOpen: true,
              title: 'Error',
              message: error.error || 'Failed to close session',
              type: 'error'
            });
          }
        } catch (error: any) {
          setModal({
            isOpen: true,
            title: 'Error',
            message: error.message || 'Network error',
            type: 'error'
          });
        }
      }
    });
  };

  const openSession = async () => {
    try {
      const response = await fetch('/api/pos/sessions/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId,
          vendorId,
          userId,
          registerId,
          openingCash: 200.00,
        }),
      });

      if (response.ok) {
        loadActiveSession();
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error opening session:', error);
    }
  };

  const handleCashMovementRecorded = () => {
    if (session) {
      loadCashMovements(session.id);
      loadActiveSession();
    }
  };

  return (
    <>
      <POSModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        onConfirm={modal.onConfirm}
      />

      {showCashDrawer && session && userId && (
        <POSCashDrawer
          sessionId={session.id}
          registerId={registerId}
          userId={userId}
          locationId={locationId}
          vendorId={vendorId}
          currentBalance={cashSummary?.current_balance || session.opening_cash}
          onMovementRecorded={handleCashMovementRecorded}
          onClose={() => setShowCashDrawer(false)}
        />
      )}

      <div className="relative" ref={dropdownRef}>
        {/* Vendor Logo Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 rounded-2xl px-3 py-2 transition-all group"
        >
          {vendor?.logo_url ? (
            <div className="relative w-8 h-8 flex-shrink-0 bg-white/10 rounded-lg overflow-hidden">
              <Image
                src={vendor.logo_url}
                alt={vendor.store_name || 'Vendor'}
                fill
                className="object-contain p-0.5"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <Package size={16} className="text-white/60" />
            </div>
          )}
          <ChevronDown size={14} className={`text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-80 bg-black border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden">
            {/* Vendor Name */}
            {vendor && (
              <div className="px-4 py-3 border-b border-white/10">
                <div className="text-white font-black text-sm" style={{ fontWeight: 900 }}>
                  {vendor.store_name}
                </div>
              </div>
            )}

            {/* Location & Staff */}
            <div className="px-4 py-3 border-b border-white/10 space-y-2">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-white/40" />
                <div className="flex-1">
                  <div className="text-white/40 text-[9px] uppercase tracking-wider">Location</div>
                  <div className="text-white text-xs font-bold">{locationName}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User size={14} className="text-white/40" />
                <div className="flex-1">
                  <div className="text-white/40 text-[9px] uppercase tracking-wider">Staff</div>
                  <div className="text-white text-xs font-bold">{userName}</div>
                </div>
              </div>
            </div>

            {/* Session Info */}
            {session ? (
              <>
                <div className="px-4 py-3 border-b border-white/10 space-y-3">
                  {/* Session Number & ID */}
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-white/40" />
                    <div className="flex-1">
                      <div className="text-white/40 text-[9px] uppercase tracking-wider">Session</div>
                      <div className="text-white font-bold text-xs">{session.session_number}</div>
                      <div className="text-white/30 text-[9px] font-mono">{session.id.substring(0, 8)}...</div>
                    </div>
                  </div>

                  {/* Cash Drawer */}
                  <button
                    onClick={() => {
                      setShowCashDrawer(true);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-2 hover:bg-white/5 rounded-xl p-2 -m-2 transition-all"
                  >
                    <DollarSign size={14} className="text-green-400" />
                    <div className="flex-1 text-left">
                      <div className="text-white/40 text-[9px] uppercase tracking-wider">Cash Drawer</div>
                      <div className="text-white font-black text-sm" style={{ fontWeight: 900 }}>
                        ${(cashSummary?.current_balance || session.opening_cash).toFixed(2)}
                      </div>
                    </div>
                  </button>

                  {/* Sales */}
                  <div className="flex items-center gap-2">
                    <CreditCard size={14} className="text-white/40" />
                    <div className="flex-1">
                      <div className="text-white/40 text-[9px] uppercase tracking-wider">Sales</div>
                      <div className="text-white font-bold text-xs">${session.total_sales.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Transactions */}
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={14} className="text-white/40" />
                    <div className="flex-1">
                      <div className="text-white/40 text-[9px] uppercase tracking-wider">Transactions</div>
                      <div className="text-white font-bold text-xs">{session.total_transactions}</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-4 py-3 space-y-2">
                  {typeof window !== 'undefined' && window.location.pathname === '/pos/orders' ? (
                    <a
                      href="/pos/register"
                      className="block w-full px-4 py-2.5 border border-white/10 text-white text-center rounded-xl hover:bg-white/5 hover:border-white/20 text-[10px] font-black uppercase tracking-[0.15em] transition-all"
                      style={{ fontWeight: 900 }}
                    >
                      Register
                    </a>
                  ) : (
                    <a
                      href="/pos/orders"
                      className="block w-full px-4 py-2.5 border border-white/10 text-white text-center rounded-xl hover:bg-white/5 hover:border-white/20 text-[10px] font-black uppercase tracking-[0.15em] transition-all"
                      style={{ fontWeight: 900 }}
                    >
                      Orders
                    </a>
                  )}
                  <a
                    href="/vendor/dashboard"
                    className="block w-full px-4 py-2.5 border border-white/10 text-white text-center rounded-xl hover:bg-white/5 hover:border-white/20 text-[10px] font-black uppercase tracking-[0.15em] transition-all"
                    style={{ fontWeight: 900 }}
                  >
                    Dashboard
                  </a>
                  <button
                    onClick={closeSession}
                    className="w-full px-4 py-2.5 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/10 hover:border-red-500/30 text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2"
                    style={{ fontWeight: 900 }}
                  >
                    <LogOut size={12} />
                    End Session
                  </button>
                </div>
              </>
            ) : (
              <div className="px-4 py-3 space-y-2">
                <button
                  onClick={openSession}
                  className="w-full px-5 py-2.5 bg-white/10 text-white border-2 border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 text-[10px] font-black uppercase tracking-[0.15em] transition-all"
                  style={{ fontWeight: 900 }}
                >
                  Open Session
                </button>
                <a
                  href="/vendor/dashboard"
                  className="block w-full px-4 py-2.5 border border-white/10 text-white text-center rounded-xl hover:bg-white/5 hover:border-white/20 text-[10px] font-black uppercase tracking-[0.15em] transition-all"
                  style={{ fontWeight: 900 }}
                >
                  Dashboard
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
