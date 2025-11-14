"use client";

import { useState } from "react";
import { Scan, LogOut } from "lucide-react";
import { POSCustomerSelector } from "./POSCustomerSelector";
import { POSIDScanner } from "./POSIDScanner";
import { NewCustomerForm } from "./POSNewCustomerForm";
import { usePOSSession } from "@/context/POSSessionContext";
import { showConfirm } from "@/components/NotificationToast";
import { useAppAuth } from "@/context/AppAuthContext";
import Image from "next/image";

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

export interface CartItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  inventoryId: string;
  // Promotion fields
  originalPrice?: number; // Price before discount
  discount?: number; // Discount amount
  promotionName?: string; // Name of applied promotion
  badgeText?: string; // Badge text (e.g., "20% OFF")
  badgeColor?: string; // Badge color
}

interface TaxBreakdown {
  name: string;
  rate: number;
  type: string;
}

interface POSCartProps {
  items: CartItem[];
  vendorId: string;
  locationId: string;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onCheckout: (customer: Customer | null) => void;
  taxRate: number;
  taxBreakdown?: TaxBreakdown[];
  taxError?: string | null;
  isProcessing?: boolean;
}

export function POSCart({
  items,
  vendorId,
  locationId,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  taxRate,
  taxBreakdown,
  taxError,
  isProcessing = false,
}: POSCartProps) {
  const { session, endSession } = usePOSSession();
  const { vendor } = useAppAuth();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showIDScanner, setShowIDScanner] = useState(false);
  const [prefilledData, setPrefilledData] = useState<any>(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleEndSession = async () => {
    await showConfirm({
      title: "End Session",
      message: `Are you sure you want to end session ${session?.session_number}?\n\nYou can start a new session immediately after.`,
      confirmText: "End Session",
      cancelText: "Cancel",
      type: "warning",
      onConfirm: async () => {
        try {
          setIsEndingSession(true);
          await endSession();
        } catch (error) {
          alert("Failed to end session. Please try again.");
        } finally {
          setIsEndingSession(false);
        }
      },
    });
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#0a0a0a] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-start justify-between">
          <div>
            <h3
              className="text-xs uppercase tracking-[0.15em] text-white font-black"
              style={{ fontWeight: 900 }}
            >
              Cart
            </h3>
            <div className="text-white/40 text-[10px] mt-1 uppercase tracking-wider">
              {items.length} items · {itemCount} units
            </div>
          </div>
          
          {/* End Session Button */}
          {session && (
            <button
              onClick={handleEndSession}
              disabled={isEndingSession}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 hover:border-red-500/50 transition-all text-[9px] uppercase tracking-[0.15em] font-black disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontWeight: 900 }}
            >
              <LogOut size={10} strokeWidth={2.5} />
              <span>{isEndingSession ? "Ending..." : "End"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Customer Selector - Sleek Full Width Design */}
      <div className="px-4 py-3 border-b border-white/5">
        <POSCustomerSelector
          vendorId={vendorId}
          locationId={locationId}
          selectedCustomer={selectedCustomer}
          onCustomerSelect={setSelectedCustomer}
        />
      </div>

      {/* Cart Items - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0 bg-[#0a0a0a]">
        {items.length === 0 ? (
          <div className="h-full flex items-center justify-center text-white/40">
            <div className="text-center">
              {/* Interactive Vendor Logo - Click to Scan ID */}
              {vendor?.logo_url ? (
                <button
                  onClick={() => setShowIDScanner(true)}
                  className="group flex flex-col items-center gap-3 transition-all"
                >
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-white/5 border border-white/10 opacity-40 group-hover:opacity-60 group-hover:border-white/20 group-hover:bg-white/10 transition-all">
                    <Image
                      src={vendor.logo_url}
                      alt={vendor.store_name || "Vendor"}
                      fill
                      className="object-contain p-3"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.15em] text-white/40 group-hover:text-white/60 transition-colors">
                    <Scan size={10} strokeWidth={2} />
                    <span>Scan ID</span>
                  </div>
                </button>
              ) : (
                <div className="text-5xl mb-4">🛒</div>
              )}
              <div className="text-[10px] uppercase tracking-[0.15em] text-white/60 mt-2">
                Cart is empty
              </div>
              <div className="text-[10px] text-white/40 mt-1">Add products to start</div>
            </div>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.productId}
              className="bg-[#141414] border border-white/5 hover:border-white/10 rounded-2xl p-3 transition-all relative"
            >
              {/* Sale Badge */}
              {item.badgeText && (
                <div
                  className="absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider"
                  style={{
                    backgroundColor:
                      item.badgeColor === "red"
                        ? "#ef4444"
                        : item.badgeColor === "orange"
                          ? "#f97316"
                          : item.badgeColor === "green"
                            ? "#22c55e"
                            : item.badgeColor === "blue"
                              ? "#3b82f6"
                              : "#ef4444",
                    color: "white",
                  }}
                >
                  {item.badgeText}
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div
                    className="text-white font-black text-xs uppercase tracking-tight"
                    style={{ fontWeight: 900 }}
                  >
                    {item.productName}
                  </div>

                  {/* Show original price if on sale */}
                  {item.originalPrice && item.originalPrice > item.unitPrice ? (
                    <div className="mt-1">
                      <div className="text-white/40 text-[10px] line-through">
                        ${item.originalPrice.toFixed(2)} each
                      </div>
                      <div className="text-green-400 text-[10px] font-bold uppercase tracking-[0.15em]">
                        ${item.unitPrice.toFixed(2)} each
                      </div>
                    </div>
                  ) : (
                    <div className="text-white/40 text-[10px] uppercase tracking-[0.15em] mt-1">
                      ${item.unitPrice.toFixed(2)} each
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onRemoveItem(item.productId)}
                  className="text-white/40 hover:text-red-400 text-sm ml-2 w-6 h-6 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="w-8 h-8 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-black hover:bg-white/10 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                    style={{ fontWeight: 900 }}
                  >
                    −
                  </button>
                  <div
                    className="w-12 text-white text-xs font-black text-center"
                    style={{ fontWeight: 900 }}
                  >
                    {item.quantity}
                  </div>
                  <button
                    onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                    className="w-8 h-8 bg-white/5 border border-white/10 rounded-xl text-white text-sm font-black hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center"
                    style={{ fontWeight: 900 }}
                  >
                    +
                  </button>
                </div>

                <div className="text-right">
                  <div
                    className="text-white font-black text-sm tracking-tight"
                    style={{ fontWeight: 900 }}
                  >
                    ${item.lineTotal.toFixed(2)}
                  </div>
                  {item.discount && item.discount > 0 && (
                    <div className="text-green-400 text-[9px] font-bold mt-0.5">
                      Saved ${item.discount.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      {items.length > 0 && (
        <div className="border-t border-white/5 px-4 py-3 space-y-2 bg-[#0a0a0a]">
          {taxError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-3">
              <div className="text-red-400 text-[10px] uppercase tracking-wider font-bold mb-1">
                TAX ERROR
              </div>
              <div className="text-red-300 text-[9px]">{taxError}</div>
            </div>
          )}
          <div className="flex justify-between text-white/60 text-[10px] uppercase tracking-[0.15em]">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>

          {/* Tax Breakdown */}
          {taxBreakdown && taxBreakdown.length > 0 ? (
            <>
              {taxBreakdown.map((tax, idx) => {
                const taxAmt = subtotal * (tax.rate / 100);
                return (
                  <div
                    key={idx}
                    className="flex justify-between text-white/50 text-[9px] uppercase tracking-[0.15em] pl-2"
                  >
                    <span>
                      {tax.name} ({Number(tax.rate).toFixed(2)}%)
                    </span>
                    <span>${taxAmt.toFixed(2)}</span>
                  </div>
                );
              })}
              <div className="flex justify-between text-white/60 text-[10px] uppercase tracking-[0.15em] font-bold pt-1 border-t border-white/5">
                <span>Total Tax</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-white/60 text-[10px] uppercase tracking-[0.15em]">
              <span>Tax ({(taxRate * 100).toFixed(2)}%)</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
          )}

          <div
            className="flex justify-between text-white font-black text-lg pt-2 border-t border-white/5 tracking-tight"
            style={{ fontWeight: 900 }}
          >
            <span>TOTAL</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      {items.length > 0 && (
        <div className="px-4 pb-4 pt-3 border-t border-white/5 space-y-2 bg-[#0a0a0a]">
          <>
            <button
              onClick={() => (taxError ? alert(taxError) : onCheckout(selectedCustomer))}
              disabled={isProcessing || !!taxError}
              className="w-full bg-white/10 text-white border-2 border-white/20 rounded-2xl px-4 py-4 text-xs uppercase tracking-[0.15em] hover:bg-white/20 hover:border-white/30 font-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ fontWeight: 900 }}
              title={taxError || undefined}
            >
              {isProcessing
                ? "Processing..."
                : taxError
                  ? "TAX ERROR"
                  : `Charge $${total.toFixed(2)}`}
            </button>

            <div className="flex gap-2">
              <button
                onClick={onClearCart}
                disabled={isProcessing}
                className="flex-1 px-3 py-2.5 border border-white/10 text-white rounded-2xl hover:bg-white/5 hover:border-white/20 text-[10px] font-bold uppercase disabled:opacity-50 tracking-[0.15em] transition-all"
              >
                Clear
              </button>
              <button
                onClick={() => {}} // TODO: Implement hold feature
                disabled={isProcessing}
                className="flex-1 px-3 py-2.5 border border-white/10 text-white rounded-2xl hover:bg-white/5 hover:border-white/20 text-[10px] font-bold uppercase disabled:opacity-50 tracking-[0.15em] transition-all"
              >
                Hold
              </button>
            </div>
          </>
        </div>
      )}

      {/* ID Scanner Modal */}
      {showIDScanner && (
        <POSIDScanner
          vendorId={vendorId}
          locationId={locationId}
          onCustomerFound={(customer) => {
            setSelectedCustomer(customer);
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

      {/* New Customer Form Modal (from ID scan) */}
      {showNewCustomerForm && (
        <NewCustomerForm
          vendorId={vendorId}
          prefilledData={prefilledData}
          onCustomerCreated={(customer) => {
            setSelectedCustomer(customer);
            setShowNewCustomerForm(false);
            setPrefilledData(null);
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
