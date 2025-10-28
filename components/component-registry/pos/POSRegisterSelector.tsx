'use client';

import { useState, useEffect } from 'react';
import { Monitor, Check } from 'lucide-react';

interface Register {
  id: string;
  register_number: string;
  register_name: string;
  device_name: string;
  status: string;
  current_session?: {
    session_number: string;
    total_sales: number;
  };
}

interface POSRegisterSelectorProps {
  locationId: string;
  locationName: string;
  onRegisterSelected: (registerId: string) => void;
}

export function POSRegisterSelector({
  locationId,
  locationName,
  onRegisterSelected,
}: POSRegisterSelectorProps) {
  const [registers, setRegisters] = useState<Register[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegister, setSelectedRegister] = useState<string | null>(null);

  useEffect(() => {
    loadRegisters();
    checkDeviceAssignment();
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

  const checkDeviceAssignment = async () => {
    const deviceId = getDeviceId();
    
    try {
      const response = await fetch('/api/pos/registers/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, locationId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.register) {
          // Device already assigned
          setSelectedRegister(data.register.id);
          onRegisterSelected(data.register.id);
        }
      }
    } catch (error) {
      console.error('Error checking device assignment:', error);
    }
  };

  const handleSelectRegister = async (registerId: string) => {
    const deviceId = getDeviceId();
    
    try {
      const response = await fetch('/api/pos/registers/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          locationId,
          registerId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedRegister(registerId);
        onRegisterSelected(registerId);
        
        // Store in localStorage
        localStorage.setItem('pos_register_id', registerId);
        localStorage.setItem('pos_device_id', deviceId);
      }
    } catch (error) {
      console.error('Error assigning register:', error);
      alert('Failed to assign register');
    }
  };

  const getDeviceId = (): string => {
    // Check localStorage first
    let deviceId = localStorage.getItem('pos_device_id');
    
    if (!deviceId) {
      // Generate device fingerprint
      const userAgent = navigator.userAgent;
      const platform = navigator.platform;
      const language = navigator.language;
      const screenRes = `${screen.width}x${screen.height}`;
      
      deviceId = btoa(`${userAgent}-${platform}-${language}-${screenRes}-${Date.now()}`);
      localStorage.setItem('pos_device_id', deviceId);
    }
    
    return deviceId;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-white/40 text-xs uppercase tracking-[0.15em]">Loading...</div>
      </div>
    );
  }

  if (selectedRegister) {
    return null; // Register selected, don't show selector
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
                onClick={() => handleSelectRegister(register.id)}
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
                <div className="flex items-center gap-2 text-[10px] text-green-400 uppercase tracking-[0.15em] font-black">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Session Active
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
          <p>This device will be assigned to the selected register</p>
          <p className="mt-2 text-white/20">You can change this later in settings</p>
        </div>
      </div>
    </div>
  );
}

