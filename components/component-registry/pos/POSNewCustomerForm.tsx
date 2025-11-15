"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { logger } from "@/lib/logger";
interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  display_name: string | null;
  loyalty_points: number;
  loyalty_tier: string;
  vendor_customer_number: string;
}

interface NewCustomerFormProps {
  vendorId: string;
  onCustomerCreated: (customer: Customer) => void;
  onCancel: () => void;
  prefilledData?: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    dateOfBirth?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  } | null;
}

export function NewCustomerForm({
  vendorId,
  onCustomerCreated,
  onCancel,
  prefilledData = null,
}: NewCustomerFormProps) {
  const [firstName, setFirstName] = useState(prefilledData?.firstName || "");
  const [middleName, setMiddleName] = useState(prefilledData?.middleName || "");
  const [lastName, setLastName] = useState(prefilledData?.lastName || "");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(prefilledData?.dateOfBirth || "");
  const [address, setAddress] = useState(prefilledData?.address || "");
  const [city, setCity] = useState(prefilledData?.city || "");
  const [state, setState] = useState(prefilledData?.state || "");
  const [postalCode, setPostalCode] = useState(prefilledData?.postalCode || "");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🔥 Form submit triggered!", { firstName, lastName });

    if (!firstName || !lastName) {
      return; // Form validation prevents submission
    }

    setCreating(true);
    setError(null); // Clear previous errors

    // FAILSAFE: Force reset after 30 seconds to prevent permanent freeze
    const failsafeTimeout = setTimeout(() => {
      console.error("⚠️ FAILSAFE: Customer creation took too long, forcing reset");
      setError("Request timed out. Please try again.");
      setCreating(false);
    }, 30000);

    try {
      console.log("🆕 Creating customer:", { vendorId, firstName, lastName });

      // Generate unique email if not provided
      const uniqueEmail = email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${Date.now()}@walk-in.local`;

      const response = await fetch("/api/pos/customers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          firstName,
          middleName: middleName || null,
          lastName,
          phone: phone || null,
          email: uniqueEmail,
          dateOfBirth: dateOfBirth || null,
          address: address || null,
          city: city || null,
          state: state || null,
          postalCode: postalCode || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ API Error Response:", errorData);

        // Handle specific error cases
        let errorMessage = errorData.error || errorData.details || "Failed to create customer";

        // Make duplicate email error user-friendly
        if (errorMessage.includes("duplicate") && errorMessage.includes("email")) {
          errorMessage = "This email is already registered. Please use a different email or leave it blank.";
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("✅ Customer created successfully:", data.customer);

      // Clear failsafe timeout
      clearTimeout(failsafeTimeout);

      // CRITICAL FIX: Call onCustomerCreated which closes the modal
      onCustomerCreated(data.customer);
      // Modal closes, so no need to reset 'creating' state
    } catch (error: any) {
      console.error("❌ Error creating customer:", error);
      if (process.env.NODE_ENV === "development") {
        logger.error("Error creating customer:", error);
      }

      // Clear failsafe timeout
      clearTimeout(failsafeTimeout);

      // CRITICAL FIX: Show error to user and reset creating state
      setError(error.message || "Failed to create customer. Please try again.");
      setCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto"
      style={{
        touchAction: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/90 backdrop-blur-xl"
        onClick={creating ? undefined : onCancel}
        style={{ touchAction: 'auto' }}
      />

      {/* Modal Container */}
      <div className="relative min-h-full flex items-center justify-center p-4">
        <div
          className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-md w-full my-8"
          style={{ touchAction: 'auto' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Loading Overlay */}
          {creating && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
                <div className="text-white font-black text-sm uppercase tracking-[0.15em]">
                  Creating Customer...
                </div>
                <div className="text-white/60 text-xs mt-2">Please wait</div>
              </div>
            </div>
          )}

        <div className="flex items-center justify-between mb-6">
          <h3
            className="text-xs uppercase tracking-[0.15em] text-white font-black"
            style={{ fontWeight: 900 }}
          >
            New Customer
          </h3>
          <button onClick={onCancel} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 block">
                First Name *
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => {
                  console.log("✏️ First name changed:", e.target.value);
                  setFirstName(e.target.value);
                }}
                onFocus={() => console.log("📝 First name focused")}
                onClick={() => console.log("🖱️ First name clicked")}
                required
                disabled={creating}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-2xl text-xs focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all disabled:opacity-50"
                placeholder="First name"
                style={{ touchAction: 'auto', cursor: 'text' }}
                autoComplete="off"
              />
            </div>
            <div>
              <label className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 block">
                Middle Name
              </label>
              <input
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-2xl text-xs focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all"
                placeholder="Middle"
              />
            </div>
          </div>

          <div>
            <label className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 block">
              Last Name *
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-2xl text-xs focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all"
              placeholder="Last name"
            />
          </div>

          <div>
            <label className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 block">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-2xl text-xs focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all"
              placeholder="(704) 555-0100"
            />
          </div>

          <div>
            <label className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 block">
              Email (Optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-2xl text-xs focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all"
              placeholder="customer@email.com"
            />
            <div className="text-[9px] text-white/30 mt-1 uppercase tracking-wider">
              Auto-generated if empty
            </div>
          </div>

          <div>
            <label className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 block">
              Date of Birth {prefilledData?.dateOfBirth && "(From ID)"}
            </label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => {
                console.log("📅 Birthday changed:", e.target.value);
                setDateOfBirth(e.target.value);
              }}
              onFocus={() => console.log("📅 Birthday picker focused")}
              onClick={() => console.log("📅 Birthday picker clicked")}
              disabled={creating}
              max={new Date().toISOString().split("T")[0]}
              min="1900-01-01"
              className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-2xl text-xs focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all disabled:opacity-50"
              placeholder="YYYY-MM-DD"
              style={{
                touchAction: 'manipulation',
                cursor: 'pointer',
                colorScheme: 'dark'
              }}
            />
            <div className="text-[9px] text-white/30 mt-1 uppercase tracking-wider">
              Tap to open date picker
            </div>
          </div>

          <div>
            <label className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 block">
              Address {prefilledData?.address && "(From ID)"}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-2xl text-xs focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all"
              placeholder="Street address"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 block">
                City {prefilledData?.city && "(From ID)"}
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-2xl text-xs focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all"
                placeholder="City"
              />
            </div>
            <div>
              <label className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 block">
                State {prefilledData?.state && "(From ID)"}
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-2xl text-xs focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all"
                placeholder="ST"
                maxLength={2}
              />
            </div>
          </div>

          <div>
            <label className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 block">
              Postal Code {prefilledData?.postalCode && "(From ID)"}
            </label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white px-3 py-2.5 rounded-2xl text-xs focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all"
              placeholder="ZIP code"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-3">
              <div className="text-red-400 text-[10px] uppercase tracking-[0.15em] font-bold">
                ❌ Error
              </div>
              <div className="text-red-300 text-xs mt-1">{error}</div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={(e) => {
                console.log("🔴 Cancel clicked!");
                e.stopPropagation();
                onCancel();
              }}
              onTouchEnd={(e) => {
                console.log("👆 Cancel touched!");
              }}
              disabled={creating}
              className="flex-1 px-4 py-3 border border-white/10 text-white rounded-2xl hover:bg-white/5 hover:border-white/20 text-[10px] font-black uppercase tracking-[0.15em] disabled:opacity-50 transition-all active:scale-95"
              style={{ fontWeight: 900, touchAction: 'manipulation', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !firstName || !lastName}
              className="flex-1 px-4 py-3 bg-white/10 text-white border-2 border-white/20 rounded-2xl hover:bg-white/20 hover:border-white/30 text-[10px] font-black uppercase tracking-[0.15em] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 active:scale-95"
              style={{ fontWeight: 900, touchAction: 'manipulation' }}
            >
              {creating ? "Creating..." : "Create Customer"}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
