"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, User, Plus, Scan } from "lucide-react";
import { NewCustomerForm } from "./POSNewCustomerForm";
import { POSIDScanner } from "./POSIDScanner";

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

interface POSCustomerSelectorProps {
  vendorId: string;
  locationId: string;
  selectedCustomer: Customer | null;
  onCustomerSelect: (customer: Customer | null) => void;
}

export function POSCustomerSelector({
  vendorId,
  locationId,
  selectedCustomer,
  onCustomerSelect,
}: POSCustomerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [showIDScanner, setShowIDScanner] = useState(false);
  const [prefilledData, setPrefilledData] = useState<any>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load customers for vendor on open
  useEffect(() => {
    if (isOpen) {
      loadCustomers();
    }
  }, [isOpen, vendorId]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        // Server-side search for 2+ characters
        loadCustomers(searchQuery.trim());
      } else if (searchQuery.trim().length === 0) {
        // Reset to top 1000 when search cleared
        loadCustomers();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadCustomers = async (search: string = "") => {
    try {
      setLoading(true);
      const url = `/api/pos/customers?vendorId=${vendorId}${search ? `&search=${encodeURIComponent(search)}` : ""}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to load customers");
      }

      const data = await response.json();

      setCustomers(data.customers || []);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error loading customers:", error);
      }
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // Customers are now filtered server-side
  const filteredCustomers = customers;

  const handleSelectCustomer = (customer: Customer) => {
    onCustomerSelect(customer);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClearCustomer = () => {
    onCustomerSelect(null);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Customer Display */}
      {selectedCustomer ? (
        <div className="bg-[#141414] border border-white/10 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-white/60" />
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-white font-black text-xs uppercase tracking-tight truncate"
                style={{ fontWeight: 900 }}
              >
                {selectedCustomer.first_name} {selectedCustomer.last_name}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-green-400 uppercase tracking-[0.15em] font-bold">
                  {selectedCustomer.loyalty_points} pts
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleClearCustomer}
            className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center transition-all ml-2 flex-shrink-0"
          >
            <X size={14} className="text-white/60" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-3 py-3 flex items-center gap-2 hover:bg-white/10 hover:border-white/20 transition-all"
        >
          <User size={16} className="text-white/40" />
          <span className="text-[10px] uppercase tracking-[0.15em] text-white/60">
            Select Customer
          </span>
        </button>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 max-h-96 overflow-hidden flex flex-col z-50">
          {/* Search */}
          <div className="p-3 border-b border-white/5">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
              />
              <input
                type="text"
                placeholder="Search name, phone, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Customer List */}
          <div className="flex-1 overflow-y-auto p-2 max-h-64">
            {loading ? (
              <div className="text-center py-8 text-white/40 text-[10px] uppercase tracking-[0.15em]">
                Loading...
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-white/40 text-[10px] uppercase tracking-[0.15em] mb-3">
                  No customers found
                </div>
                <button
                  onClick={() => setShowNewCustomerForm(true)}
                  className="text-[10px] uppercase tracking-[0.15em] text-white font-black hover:text-white/80 transition-colors flex items-center gap-1 mx-auto"
                  style={{ fontWeight: 900 }}
                >
                  <Plus size={12} />
                  Create New Customer
                </button>
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                  className="w-full bg-[#141414] hover:bg-[#1a1a1a] border border-white/5 hover:border-white/10 rounded-xl p-3 mb-2 text-left transition-all"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="text-white font-black text-xs uppercase tracking-tight"
                      style={{ fontWeight: 900 }}
                    >
                      {customer.first_name} {customer.last_name}
                    </div>
                    <span className="text-green-400 font-black text-xs">
                      {customer.loyalty_points.toLocaleString()} pts
                    </span>
                  </div>
                  <div className="text-[10px] text-white/40 uppercase tracking-[0.15em]">
                    {customer.phone || customer.email}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="p-2 border-t border-white/5 space-y-2">
            <button
              onClick={() => {
                setShowIDScanner(true);
                setIsOpen(false);
              }}
              className="w-full bg-white/[0.02] border border-white/[0.06] rounded-2xl py-2.5 text-[10px] uppercase tracking-[0.15em] text-white/60 hover:bg-white/[0.04] hover:text-white/80 transition-all font-light flex items-center justify-center gap-2"
            >
              <Scan size={12} strokeWidth={1.5} />
              Scan ID / License
            </button>
            <button
              onClick={() => setShowNewCustomerForm(true)}
              className="w-full bg-white/10 text-white border-2 border-white/20 rounded-2xl py-2.5 text-[10px] uppercase tracking-[0.15em] hover:bg-white/20 hover:border-white/30 font-black transition-all duration-300 flex items-center justify-center gap-2"
              style={{ fontWeight: 900 }}
            >
              <Plus size={12} strokeWidth={2.5} />
              New Customer
            </button>
          </div>
        </div>
      )}

      {/* ID Scanner Modal */}
      {showIDScanner && (
        <POSIDScanner
          vendorId={vendorId}
          locationId={locationId}
          onCustomerFound={(customer) => {
            handleSelectCustomer(customer);
            setShowIDScanner(false);
          }}
          onNoMatchFoundWithData={(idData) => {
            setPrefilledData(idData);
            setShowIDScanner(false);
            setShowNewCustomerForm(true);
          }}
          onClose={() => setShowIDScanner(false)}
        />
      )}

      {/* New Customer Form Modal */}
      {showNewCustomerForm && (
        <NewCustomerForm
          vendorId={vendorId}
          prefilledData={prefilledData}
          onCustomerCreated={(customer) => {
            handleSelectCustomer(customer);
            setShowNewCustomerForm(false);
            setPrefilledData(null);
            loadCustomers(); // Refresh list
          }}
          onCancel={() => {
            setShowNewCustomerForm(false);
            setPrefilledData(null);
          }}
        />
      )}
    </div>
  );
}
