"use client";

import React, { useState } from "react";
import { Scan, LogOut, Percent, DollarSign, Check, X as XIcon } from "lucide-react";
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
  // Manual adjustment fields
  manualDiscountType?: "percentage" | "amount"; // Type of manual discount
  manualDiscountValue?: number; // Discount value (% or $)
  adjustedPrice?: number; // Final price after manual adjustment
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
  onCheckout: (customer: Customer | null, loyaltyPointsRedeemed?: number, loyaltyDiscountAmount?: number) => void;
  onApplyManualDiscount?: (productId: string, type: "percentage" | "amount", value: number) => void;
  onRemoveManualDiscount?: (productId: string) => void;
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
  onApplyManualDiscount,
  onRemoveManualDiscount,
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

  // Manual discount state
  const [discountingItem, setDiscountingItem] = useState<string | null>(null);
  const [discountType, setDiscountType] = useState<"percentage" | "amount">("percentage");
  const [discountValue, setDiscountValue] = useState("");

  // Loyalty redemption state
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState(0);
  const [loyaltyProgram, setLoyaltyProgram] = useState<any>(null);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const loyaltyDiscountAmount = loyaltyProgram ? loyaltyPointsToRedeem * loyaltyProgram.point_value : 0;
  const subtotalAfterLoyalty = Math.max(0, subtotal - loyaltyDiscountAmount);
  const taxAmount = subtotalAfterLoyalty * taxRate;
  const total = subtotalAfterLoyalty + taxAmount;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Load loyalty program settings
  const loadLoyaltyProgram = async () => {
    try {
      const response = await fetch(`/api/vendor/loyalty/program`);
      if (response.ok) {
        const data = await response.json();
        setLoyaltyProgram(data.program);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Failed to load loyalty program:", error);
      }
    }
  };

  // Load loyalty program on mount
  React.useEffect(() => {
    loadLoyaltyProgram();
  }, []);

  // Reset loyalty points when customer changes
  React.useEffect(() => {
    setLoyaltyPointsToRedeem(0);
  }, [selectedCustomer]);

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

  const handleApplyDiscount = (productId: string) => {
    const value = parseFloat(discountValue);
    if (value > 0 && onApplyManualDiscount) {
      onApplyManualDiscount(productId, discountType, value);
      setDiscountingItem(null);
      setDiscountValue("");
    }
  };

  const maxLoyaltyPoints = selectedCustomer?.loyalty_points || 0;
  const maxLoyaltyValue = loyaltyProgram ? maxLoyaltyPoints * loyaltyProgram.point_value : 0;
  const maxRedeemablePoints = loyaltyProgram
    ? Math.min(maxLoyaltyPoints, Math.floor(subtotal / loyaltyProgram.point_value))
    : 0;

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

              {/* Manual Discount UI - Simplified */}
              {onApplyManualDiscount && (
                <div className="mt-2 pt-2 border-t border-white/5">
                  {item.manualDiscountValue && item.manualDiscountValue > 0 ? (
                    /* Show applied discount */
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] text-orange-400 font-bold">
                        Staff Discount: {item.manualDiscountType === "percentage" ? `${item.manualDiscountValue}%` : `$${item.manualDiscountValue.toFixed(2)}`} OFF
                      </div>
                      {onRemoveManualDiscount && (
                        <button
                          onClick={() => onRemoveManualDiscount(item.productId)}
                          className="text-[9px] text-white/40 hover:text-white uppercase tracking-wider"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ) : discountingItem === item.productId ? (
                    /* Discount input form */
                    <div className="space-y-2">
                      <div className="text-[9px] text-white/60 uppercase tracking-[0.15em] font-bold">Apply Discount</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDiscountType("percentage")}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${
                            discountType === "percentage"
                              ? "bg-orange-500/20 text-orange-400 border-2 border-orange-500/40"
                              : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                          }`}
                        >
                          % Percent
                        </button>
                        <button
                          onClick={() => setDiscountType("amount")}
                          className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${
                            discountType === "amount"
                              ? "bg-orange-500/20 text-orange-400 border-2 border-orange-500/40"
                              : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
                          }`}
                        >
                          $ Dollar
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          placeholder={discountType === "percentage" ? "Enter %" : "Enter $"}
                          className="flex-1 bg-white/5 border border-white/10 text-white text-sm text-center py-2 rounded-lg focus:outline-none focus:border-orange-500/40 placeholder-white/30"
                          autoFocus
                        />
                        <button
                          onClick={() => handleApplyDiscount(item.productId)}
                          disabled={!discountValue || parseFloat(discountValue) <= 0}
                          className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-400 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed text-[10px] font-bold uppercase"
                        >
                          Apply
                        </button>
                        <button
                          onClick={() => {
                            setDiscountingItem(null);
                            setDiscountValue("");
                          }}
                          className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg transition-all"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Show "+ Add Discount" button */
                    <button
                      onClick={() => setDiscountingItem(item.productId)}
                      className="w-full py-1.5 text-[10px] text-white/40 hover:text-orange-400 uppercase tracking-[0.15em] transition-colors font-bold"
                    >
                      + Staff Discount
                    </button>
                  )}
                </div>
              )}
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

          {/* Loyalty Points Redemption - Simplified */}
          {selectedCustomer && selectedCustomer.loyalty_points > 0 && loyaltyProgram && loyaltyProgram.is_active && (
            <div className="bg-[#141414] border border-green-500/20 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-green-400 font-bold">
                  💰 Loyalty Points
                </div>
                <div className="text-[10px] text-white/60">
                  {selectedCustomer.loyalty_points.toLocaleString()} available
                </div>
              </div>

              {loyaltyPointsToRedeem > 0 ? (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between bg-green-500/10 rounded-lg p-2">
                    <div className="text-white/60 text-[10px]">
                      Using {loyaltyPointsToRedeem.toLocaleString()} points
                    </div>
                    <div className="text-green-400 text-sm font-black">
                      -${loyaltyDiscountAmount.toFixed(2)}
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={maxRedeemablePoints}
                    step={Math.max(10, loyaltyProgram.min_redemption_points || 10)}
                    value={loyaltyPointsToRedeem}
                    onChange={(e) => setLoyaltyPointsToRedeem(parseInt(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer slider-green"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setLoyaltyPointsToRedeem(0)}
                      className="flex-1 py-2 bg-white/5 border border-white/10 text-white/60 rounded-lg text-[10px] font-bold hover:bg-white/10 transition-all"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setLoyaltyPointsToRedeem(maxRedeemablePoints)}
                      className="flex-1 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg text-[10px] font-bold hover:bg-green-500/30 transition-all"
                    >
                      Max ({maxLoyaltyValue.toFixed(2)})
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setLoyaltyPointsToRedeem(Math.min(loyaltyProgram.min_redemption_points || 100, maxRedeemablePoints))}
                  disabled={maxRedeemablePoints < (loyaltyProgram.min_redemption_points || 100)}
                  className="w-full py-2.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-[10px] font-bold hover:bg-green-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {maxRedeemablePoints < (loyaltyProgram.min_redemption_points || 100)
                    ? `Need ${loyaltyProgram.min_redemption_points} pts minimum`
                    : `Use Points (Worth $${maxLoyaltyValue.toFixed(2)})`}
                </button>
              )}
            </div>
          )}

          {loyaltyPointsToRedeem > 0 && (
            <div className="flex justify-between text-green-400 text-[10px] uppercase tracking-[0.15em] font-bold">
              <span>Loyalty Discount</span>
              <span>-${loyaltyDiscountAmount.toFixed(2)}</span>
            </div>
          )}

          {/* Tax Breakdown */}
          {taxBreakdown && taxBreakdown.length > 0 ? (
            <>
              {taxBreakdown.map((tax, idx) => {
                const taxAmt = subtotalAfterLoyalty * (tax.rate / 100);
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
              onClick={() => (taxError ? alert(taxError) : onCheckout(selectedCustomer, loyaltyPointsToRedeem, loyaltyDiscountAmount))}
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
