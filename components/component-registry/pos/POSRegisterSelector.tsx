'use client';

import { useState, useEffect } from 'react';
import { Monitor, Check, Users, DollarSign, Clock, X } from 'lucide-react';

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
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [selectedRegisterWithSession, setSelectedRegisterWithSession] = useState<Register | null>(null);

  useEffect(() => {
    loadRegisters();
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
    // If register has active session, show modal with options
    if (register.current_session) {
      setSelectedRegisterWithSession(register);
      setShowSessionModal(true);
      return;
    }

    // No active session - proceed with new session
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

  const joinExistingSession = async () => {
    if (!selectedRegisterWithSession?.current_session) return;

    // Join existing session
    onRegisterSelected(
      selectedRegisterWithSession.id,
      selectedRegisterWithSession.current_session.id
    );
    setShowSessionModal(false);
  };

  const endAndStartNew = async () => {
    if (!selectedRegisterWithSession) return;

    try {
      // End existing session
      const endResponse = await fetch('/api/pos/sessions/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedRegisterWithSession.current_session?.id,
          closingCash: 0, // Will be reconciled later
        }),
      });

      if (!endResponse.ok) {
        throw new Error('Failed to end session');
      }

      // Start new session
      setShowSessionModal(false);
      await startNewSession(selectedRegisterWithSession.id);
    } catch (error) {
      console.error('Error ending session:', error);
      alert('Failed to end session');
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
    <>
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

      {/* Session Modal */}
      {showSessionModal && selectedRegisterWithSession && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[9999] flex items-center justify-center p-6">
          <div className="bg-[#141414] border-2 border-white/20 rounded-3xl p-8 max-w-md w-full relative">
            {/* Close button */}
            <button
              onClick={() => setShowSessionModal(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all"
            >
              <X size={16} className="text-white" />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2" style={{ fontWeight: 900 }}>
                Active Session
              </h2>
              <p className="text-white/60 text-sm uppercase tracking-[0.15em]">
                {selectedRegisterWithSession.register_name}
              </p>
            </div>

            {/* Session Info */}
            {selectedRegisterWithSession.current_session && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-xs uppercase tracking-[0.15em]">Session</span>
                  <span className="text-white font-black text-sm">{selectedRegisterWithSession.current_session.session_number}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-xs uppercase tracking-[0.15em]">Total Sales</span>
                  <span className="text-green-400 font-black text-sm">${selectedRegisterWithSession.current_session.total_sales.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-xs uppercase tracking-[0.15em]">Duration</span>
                  <span className="text-white/60 text-sm">{formatDuration(selectedRegisterWithSession.current_session.started_at)}</span>
                </div>
                {selectedRegisterWithSession.current_session.user_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-xs uppercase tracking-[0.15em]">User</span>
                    <span className="text-white text-sm">{selectedRegisterWithSession.current_session.user_name}</span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={joinExistingSession}
                className="w-full bg-white/10 border-2 border-white/20 text-white rounded-2xl px-4 py-4 text-xs uppercase tracking-[0.15em] hover:bg-white/20 hover:border-white/30 font-black transition-all"
                style={{ fontWeight: 900 }}
              >
                Join Session
              </button>
              <button
                onClick={endAndStartNew}
                className="w-full bg-red-500/10 border-2 border-red-500/30 text-red-400 rounded-2xl px-4 py-4 text-xs uppercase tracking-[0.15em] hover:bg-red-500/20 hover:border-red-500/50 font-black transition-all"
                style={{ fontWeight: 900 }}
              >
                End Session & Start New
              </button>
              <button
                onClick={() => setShowSessionModal(false)}
                className="w-full border border-white/10 text-white/60 rounded-2xl px-4 py-3 text-xs uppercase tracking-[0.15em] hover:bg-white/5 hover:border-white/20 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

