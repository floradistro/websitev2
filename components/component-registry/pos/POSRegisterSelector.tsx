'use client';

import { useState, useEffect } from 'react';
import { Monitor, Check, Users, DollarSign, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface Register {
  id: string;
  register_number: string;
  register_name: string;
  device_name: string;
  status: string;
  current_session?: {
    id: string;
    session_number: string;
    total_sales: number;
    started_at: string;
    user_name?: string;
  };
}

interface POSRegisterSelectorProps {
  locationId: string;
  locationName: string;
  onRegisterSelected: (registerId: string, sessionId?: string) => void;
}

export function POSRegisterSelector({
  locationId,
  locationName,
  onRegisterSelected,
}: POSRegisterSelectorProps) {
  const [registers, setRegisters] = useState<Register[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRegisters();

    // Subscribe to broadcast channel for session updates (more reliable for multi-device)
    const channel = supabase
      .channel(`pos-sessions-${locationId}`, {
        config: {
          broadcast: { self: true },
        },
      })
      .on('broadcast', { event: 'session-update' }, (payload) => {
        console.log('🔄 Session update broadcast received:', payload);
        loadRegisters();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [locationId]);

  const loadRegisters = async () => {
    try {
      console.log('🔍 Loading registers for location:', locationId);
      const response = await fetch(`/api/pos/registers?locationId=${locationId}`);
      console.log('📡 Register API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Registers received:', data.registers?.length, data.registers);
        setRegisters(data.registers || []);
      } else {
        console.error('❌ Failed to load registers:', response.status);
      }
    } catch (error) {
      console.error('Error loading registers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRegister = async (register: Register) => {
    // If register has active session, just join it directly
    if (register.current_session) {
      console.log('✅ Joining existing session:', register.current_session.id);
      onRegisterSelected(register.id, register.current_session.id);
      return;
    }

    // No active session - start new one
    startNewSession(register.id);
  };

  const startNewSession = async (registerId: string) => {
    try {
      const response = await fetch('/api/pos/sessions/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registerId,
          locationId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onRegisterSelected(registerId, data.session?.id);
      } else {
        const error = await response.json();
        alert(`Failed to start session: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Failed to start session');
    }
  };


  const formatDuration = (startedAt: string) => {
    const start = new Date(startedAt);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-white/40 text-xs uppercase tracking-[0.15em]">Loading...</div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-2" style={{ fontWeight: 900 }}>
              Select Register
            </h1>
            <p className="text-white/60 text-sm uppercase tracking-[0.15em]">
              {locationName}
            </p>
          </div>

          {/* Register Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {registers.length === 0 ? (
              <div className="col-span-2 text-center py-12">
                <p className="text-white/40 text-sm uppercase tracking-[0.15em] mb-4">
                  No registers found
                </p>
                <p className="text-white/60 text-xs">
                  Registers loaded: {registers.length}
                </p>
              </div>
            ) : (
              registers.map((register) => (
                <button
                  key={register.id}
                  onClick={() => handleSelectRegister(register)}
                  className="bg-white/5 border-2 border-white/10 rounded-2xl p-6 hover:border-white/30 hover:bg-white/10 transition-all duration-300 text-left relative group"
                >
                  {/* Icon */}
                  <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4 group-hover:bg-white/10 transition-all">
                    <Monitor size={24} className="text-white/60" />
                  </div>

                  {/* Info */}
                  <div className="mb-4">
                    <div className="text-white font-black text-lg uppercase tracking-tight mb-1" style={{ fontWeight: 900 }}>
                      {register.register_name}
                    </div>
                    <div className="text-white/40 text-xs uppercase tracking-[0.15em]">
                      {register.register_number}
                    </div>
                    <div className="text-white/60 text-xs mt-2">
                      {register.device_name}
                    </div>
                  </div>

                  {/* Status */}
                  {register.current_session ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[10px] text-green-400 uppercase tracking-[0.15em] font-black">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        Session Active
                      </div>
                      <div className="text-[10px] text-white/60 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <DollarSign size={10} />
                          ${register.current_session.total_sales.toFixed(2)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={10} />
                          {formatDuration(register.current_session.started_at)}
                        </div>
                        {register.current_session.user_name && (
                          <div className="flex items-center gap-1.5">
                            <Users size={10} />
                            {register.current_session.user_name}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[10px] text-white/40 uppercase tracking-[0.15em]">
                      Available
                    </div>
                  )}

                  {/* Select Indicator */}
                  <div className="absolute top-4 right-4 w-8 h-8 bg-white text-black rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Check size={16} strokeWidth={3} />
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Help Text */}
          <div className="mt-8 text-center text-white/40 text-xs uppercase tracking-[0.15em]">
            <p>Select any register to begin</p>
            <p className="mt-2 text-white/20">You can switch registers anytime</p>
          </div>
        </div>
      </div>
  );
}

