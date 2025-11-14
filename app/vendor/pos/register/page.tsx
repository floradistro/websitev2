"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { POSProductGrid } from "@/components/component-registry/pos/POSProductGrid";
import { POSCart, CartItem } from "@/components/component-registry/pos/POSCart";
import { POSPayment, PaymentData } from "@/components/component-registry/pos/POSPayment";
import { POSRegisterSelector } from "@/components/component-registry/pos/POSRegisterSelector";
import { POSLocationSelector } from "@/components/component-registry/pos/POSLocationSelector";
import { OpenCashDrawerModal } from "./components/OpenCashDrawerModal";
import { useAppAuth } from "@/context/AppAuthContext";
import { usePOSSession } from "@/context/POSSessionContext";
import { supabase } from "@/lib/supabase/client";
import { calculatePrice, type Promotion } from "@/lib/pricing";

import { logger } from "@/lib/logger";

export default function POSRegisterPage() {
  const { user, vendor, locations, isLoading } = useAppAuth();
  const {
    session,
    registerId: contextRegisterId,
    location: contextLocation,
    startSession,
    joinSession,
    setLocation,
    clearLocation,
  } = usePOSSession();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [hasPaymentProcessor, setHasPaymentProcessor] = useState<boolean>(false);

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [skuInput, setSkuInput] = useState("");
  const [skuLoading, setSkuLoading] = useState(false);
  const [skuError, setSkuError] = useState<string | null>(null);
  const skuInputRef = useRef<HTMLInputElement>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [productsCache, setProductsCache] = useState<Map<string, any>>(new Map());
  const [showOpenDrawerModal, setShowOpenDrawerModal] = useState(false);
  const [existingSessionInfo, setExistingSessionInfo] = useState<any>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [taxRate, setTaxRate] = useState<number | null>(null);
  const [taxBreakdown, setTaxBreakdown] = useState<
    Array<{ name: string; rate: number; type: string }>
  >([]);
  const [taxError, setTaxError] = useState<string | null>(null);
  const [taxLoading, setTaxLoading] = useState(true);

  // Register management state
  const [selectedRegister, setSelectedRegister] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Auto-select location for single-location staff
  useEffect(() => {
    if (!contextLocation && locations.length === 1) {
      const singleLocation = locations[0];
      setLocation({ id: singleLocation.id, name: singleLocation.name });
    }
  }, [locations, contextLocation, setLocation]);

  // FRESH TAX DATA - NO FALLBACKS, NO HARDCODED VALUES
  useEffect(() => {
    async function loadTaxRate() {
      if (!contextLocation?.id || !vendor?.id) {
        setTaxRate(null);
        setTaxLoading(false);
        return;
      }

      setTaxError(null);
      setTaxLoading(true);

      try {
        const response = await fetch(`/api/vendor/locations`, {
          headers: { "x-vendor-id": vendor.id },
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error("API returned success: false");
        }

        const location = data.locations?.find((l: any) => l.id === contextLocation.id);

        if (!location) {
          throw new Error(`Location ${contextLocation.name} not found in API response`);
        }

        const rate = location.settings?.tax_config?.sales_tax_rate;
        const taxes = location.settings?.tax_config?.taxes || [];

        if (!rate || typeof rate !== "number" || rate <= 0) {
          throw new Error(
            `NO TAX CONFIGURED FOR ${contextLocation.name}! Go to Settings > Locations to configure taxes.`,
          );
        }

        setTaxRate(rate);
        setTaxBreakdown(taxes);
        setTaxLoading(false);
      } catch (error: any) {
        if (process.env.NODE_ENV === "development") {
          logger.error("❌ TAX LOAD FAILED:", error.message);
        }
        setTaxError(error.message);
        setTaxRate(null);
        setTaxLoading(false);
        alert(
          `TAX CONFIGURATION ERROR:\n\n${error.message}\n\nPOS cannot operate without tax configuration.`,
        );
      }
    }

    loadTaxRate();
  }, [contextLocation?.id, vendor?.id]);

  // NOTE: Existing session check is now handled directly in onRegisterSelected callback
  // This avoids race conditions and ensures the modal shows immediately

  const handleJoinSession = async () => {
    console.log("handleJoinSession called", { existingSessionInfo, selectedRegister });
    if (!existingSessionInfo || !selectedRegister) {
      console.error("Missing required data", { existingSessionInfo, selectedRegister });
      return;
    }
    
    try {
      setProcessing(true);
      console.log("Joining session via startSession...");
      
      // Join existing session via context - startSession will handle existing session
      await startSession(
        existingSessionInfo.register_id,
        contextLocation!.id,
        contextLocation!.name,
        selectedRegister.name,
        0 // No opening cash needed for joining
      );
      
      setShowSessionModal(false);
      console.log("Successfully joined existing session");
    } catch (error) {
      console.error("Failed to join session:", error);
      alert(`Failed to join session: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleStartNewSession = async () => {
    // Close existing session if present, then show drawer count modal
    if (existingSessionInfo) {
      try {
        await fetch("/api/pos/sessions/close", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: existingSessionInfo.id,
            closingCash: 0,
            closingNotes: "Closed to start new session",
          }),
        });
        setShowSessionModal(false);
        setShowOpenDrawerModal(true);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          logger.error("Error closing session:", error);
        }
        alert("Failed to close existing session");
      }
    } else {
      // No existing session, go straight to drawer count
      setShowOpenDrawerModal(true);
    }
  };

  const handleOpenDrawerSubmit = async (openingCash: number, notes: string) => {
    console.log("🟡 handleOpenDrawerSubmit called", { 
      openingCash, 
      notes,
      selectedRegister,
      contextLocation,
      contextRegisterId 
    });
    
    // Prevent concurrent requests
    if (processing) {
      console.log("⚠️ Already processing, skipping");
      return;
    }

    if (!selectedRegister || !contextLocation) {
      console.error("❌ Missing required data:", { selectedRegister, contextLocation });
      alert("Missing register or location information");
      return;
    }

    try {
      setProcessing(true);
      console.log("🟡 Starting session with:", {
        registerId: selectedRegister.id,
        locationId: contextLocation.id,
        locationName: contextLocation.name,
        registerName: selectedRegister.name,
        openingCash
      });

      // Use session context to start session
      await startSession(
        selectedRegister.id, // Use selectedRegister.id instead of contextRegisterId
        contextLocation.id,
        contextLocation.name,
        selectedRegister.name,
        openingCash
      );

      console.log("✅ Session started successfully");
      setShowOpenDrawerModal(false);
    } catch (error) {
      console.error("❌ Error starting session:", error);
      if (process.env.NODE_ENV === "development") {
        logger.error("Error starting session:", error);
      }
      alert(
        `❌ Failed to Start Session\n\n` +
          `Network or system error occurred.\n\n` +
          `Details: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setProcessing(false);
    }
  };

  // Load promotions
  const loadPromotions = async () => {
    if (!vendor?.id) return;
    try {
      const response = await fetch(`/api/vendor/promotions?vendor_id=${vendor.id}`);
      const data = await response.json();
      if (data.success) {
        setPromotions(data.promotions || []);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error loading promotions:", error);
      }
    }
  };

  // Load initial data
  useEffect(() => {
    loadPromotions();
  }, [vendor]);

  // Recalculate cart with current promotions
  const recalculateCart = useCallback(() => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        // Get product from cache
        const product = productsCache.get(item.productId);
        if (!product) return item;

        // Calculate price with promotions
        const priceCalc = calculatePrice(product, promotions, item.quantity);

        return {
          ...item,
          unitPrice: priceCalc.finalPrice,
          lineTotal: priceCalc.finalPrice * item.quantity,
          originalPrice:
            priceCalc.originalPrice !== priceCalc.finalPrice ? priceCalc.originalPrice : undefined,
          discount: priceCalc.savings * item.quantity,
          promotionName: priceCalc.appliedPromotion?.name,
          badgeText: priceCalc.badge?.text,
          badgeColor: priceCalc.badge?.color,
        };
      });
    });
  }, [promotions, productsCache]);

  // Add product to cart
  const handleAddToCart = useCallback(
    (product: any, quantity: number) => {
      // Cache the product for future calculations
      setProductsCache((prev) => {
        const newCache = new Map(prev);
        newCache.set(product.id, product);
        return newCache;
      });

      // Calculate price with promotions
      const priceCalc = calculatePrice(product, promotions, quantity);

      setCart((prevCart) => {
        const existing = prevCart.find((item) => item.productId === product.id);

        if (existing) {
          // Update quantity and recalculate
          const newQuantity = existing.quantity + quantity;
          const newPriceCalc = calculatePrice(product, promotions, newQuantity);

          return prevCart.map((item) =>
            item.productId === product.id
              ? {
                  ...item,
                  quantity: newQuantity,
                  unitPrice: newPriceCalc.finalPrice,
                  lineTotal: newPriceCalc.finalPrice * newQuantity,
                  originalPrice:
                    newPriceCalc.originalPrice !== newPriceCalc.finalPrice
                      ? newPriceCalc.originalPrice
                      : undefined,
                  discount: newPriceCalc.savings * newQuantity,
                  promotionName: newPriceCalc.appliedPromotion?.name,
                  badgeText: newPriceCalc.badge?.text,
                  badgeColor: newPriceCalc.badge?.color,
                }
              : item,
          );
        } else {
          // Add new item with promotion applied
          return [
            ...prevCart,
            {
              productId: product.id,
              productName: product.name,
              unitPrice: priceCalc.finalPrice,
              quantity,
              lineTotal: priceCalc.finalPrice * quantity,
              inventoryId: product.inventory_id,
              originalPrice:
                priceCalc.originalPrice !== priceCalc.finalPrice
                  ? priceCalc.originalPrice
                  : undefined,
              discount: priceCalc.savings * quantity,
              promotionName: priceCalc.appliedPromotion?.name,
              badgeText: priceCalc.badge?.text,
              badgeColor: priceCalc.badge?.color,
            },
          ];
        }
      });
    },
    [promotions],
  );

  // Update item quantity
  const handleUpdateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        handleRemoveItem(productId);
        return;
      }

      setCart((prevCart) =>
        prevCart.map((item) => {
          if (item.productId === productId) {
            // Get product from cache and recalculate with new quantity
            const product = productsCache.get(productId);
            if (!product) {
              // Fallback if product not in cache
              return {
                ...item,
                quantity,
                lineTotal: quantity * item.unitPrice,
              };
            }

            const priceCalc = calculatePrice(product, promotions, quantity);

            return {
              ...item,
              quantity,
              unitPrice: priceCalc.finalPrice,
              lineTotal: priceCalc.finalPrice * quantity,
              originalPrice:
                priceCalc.originalPrice !== priceCalc.finalPrice
                  ? priceCalc.originalPrice
                  : undefined,
              discount: priceCalc.savings * quantity,
              promotionName: priceCalc.appliedPromotion?.name,
              badgeText: priceCalc.badge?.text,
              badgeColor: priceCalc.badge?.color,
            };
          }
          return item;
        }),
      );
    },
    [promotions, productsCache],
  );

  // Remove item from cart
  const handleRemoveItem = useCallback((productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
  }, []);

  // Clear cart
  const handleClearCart = useCallback(() => {
    if (confirm("Clear entire cart?")) {
      setCart([]);
    }
  }, []);

  // SKU lookup and add to cart
  const handleSkuLookup = async (sku: string) => {
    if (!sku.trim()) return;

    setSkuLoading(true);
    setSkuError(null);

    try {
      const response = await fetch(
        `/api/pos/products/lookup?sku=${encodeURIComponent(sku.trim())}&location_id=${contextLocation?.id}`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Product not found");
      }

      const data = await response.json();
      const product = data.product;

      // Check if product is in stock
      if (product.inventory.available_quantity <= 0) {
        setSkuError(`❌ ${product.name} is out of stock`);
        setTimeout(() => setSkuError(null), 3000);
        setSkuInput("");
        skuInputRef.current?.focus();
        return;
      }

      // Add to cart
      handleAddToCart(
        {
          id: product.id,
          name: product.name,
          price: product.price,
          inventory_id: product.id, // Will be resolved in backend
        },
        1,
      );

      // Show success feedback
      setSkuInput("");
      skuInputRef.current?.focus();

      // Flash success (optional)
      const successMsg = `✅ Added: ${product.name}`;
      setSkuError(successMsg);
      setTimeout(() => setSkuError(null), 2000);
    } catch (error: any) {
      setSkuError(error.message);
      setTimeout(() => setSkuError(null), 3000);
    } finally {
      setSkuLoading(false);
    }
  };

  // Handle SKU input submission (Enter key or scan)
  const handleSkuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (skuInput.trim()) {
      handleSkuLookup(skuInput);
    }
  };

  // Open payment modal
  const handleCheckout = (customer?: any) => {
    if (cart.length === 0) return;
    setSelectedCustomer(customer || null);
    setShowPayment(true);
  };

  // Process payment - CLEAN VERSION WITH PROPER ERROR RECOVERY
  const handlePaymentComplete = async (paymentData: PaymentData) => {
    // Set processing AFTER modal validates and calls this
    setProcessing(true);

    try {
      // Validation
      if (taxLoading) {
        throw new Error("Tax configuration is still loading. Please wait a moment.");
      }

      if (taxRate === null) {
        throw new Error("Tax configuration not loaded. Please refresh the page.");
      }

      if (!contextLocation?.id || !vendor?.id) {
        throw new Error("Location or vendor information missing. Please refresh.");
      }

      // Calculate totals
      const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;

      // Get customer info
      const customerId = selectedCustomer?.id || null;
      const customerName = selectedCustomer
        ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}`
        : "Walk-In";

      // Call sales API
      const response = await fetch("/api/pos/sales/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: contextLocation.id,
          vendorId: vendor.id,
          sessionId: session?.id,
          userId: user?.id,
          items: cart,
          subtotal,
          taxAmount,
          total,
          paymentMethod: paymentData.paymentMethod,
          cashTendered: paymentData.cashTendered,
          changeGiven: paymentData.changeGiven,
          customerId,
          customerName,
          // Payment processor details (from Dejavoo)
          authorizationCode: paymentData.authorizationCode,
          paymentTransactionId: paymentData.transactionId,
          cardType: paymentData.cardType,
          cardLast4: paymentData.cardLast4,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || "Failed to complete sale");
      }

      const result = await response.json();

      // Clear cart and state FIRST
      setCart([]);
      setSelectedCustomer(null);

      // Close modal
      setShowPayment(false);

      // SEAMLESS RESET - The Steve Jobs Way
      // Automatically reset everything for next sale - invisible, instant, perfect
      setTimeout(() => {
        // Reset product grid (search, filters, scroll)
        if ((window as any).__posResetFunction) {
          (window as any).__posResetFunction();
        }
      }, 100); // Small delay ensures smooth transition

      // Show success message
      alert(
        `✅ Sale Completed!\n\n` +
          `Order: ${result.order.order_number}\n` +
          `Total: $${total.toFixed(2)}\n` +
          `${paymentData.changeGiven ? `Change: $${paymentData.changeGiven.toFixed(2)}` : ""}`,
      );
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Sale failed:", error);
      }
      // Show user-friendly error
      alert(
        `❌ Sale Failed\n\n` +
          `${error.message}\n\n` +
          `Your cart has not been cleared. Please try again or contact support.`,
      );

      // Don't close modal on error - let user retry
      // Modal stays open, processing flag will be cleared in finally
    } finally {
      // ALWAYS clear processing flag
      setProcessing(false);
    }
  };

  // Calculate totals for cart - REQUIRES VALID TAX RATE
  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const taxAmount = taxRate !== null ? subtotal * taxRate : 0;
  const total = subtotal + taxAmount;

  // CRITICAL FIX: Wait for context to load before showing location selector
  // This prevents "No locations found" when navigating back from dashboard
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-white/40 text-xs uppercase tracking-[0.15em]">Loading...</div>
      </div>
    );
  }

  // Show location selector if not selected (for admins or multi-location staff)
  if (!contextLocation) {
    // If still loading context, show loading state
    if (isLoading) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-white/40 text-xs uppercase tracking-[0.15em]">
            Loading locations...
          </div>
        </div>
      );
    }

    // If context finished loading but has no locations (and user is logged in), show error
    // DO NOT auto-reload - this causes bootloop when switching locations with active session
    if (locations.length === 0 && vendor?.id) {
      if (process.env.NODE_ENV === "development") {
        logger.error("CRITICAL: Context has no locations", undefined, {
          vendorId: vendor.id,
          userEmail: user?.email,
        });
      }
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <div className="text-red-400 text-sm uppercase tracking-[0.15em] mb-4">
              No Locations Available
            </div>
            <p className="text-white/60 text-xs mb-6">
              Your account doesn't have access to any locations. Please contact your administrator.
            </p>
            <button
              onClick={() => {
                clearLocation();
                window.location.href = "/vendor/dashboard";
              }}
              className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-all text-xs uppercase tracking-[0.15em]"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 left-[60px] flex items-center justify-center bg-black">
        <POSLocationSelector
          locations={locations}
          onLocationSelected={(locationId, locationName) => {
            setLocation({ id: locationId, name: locationName });
          }}
        />
      </div>
    );
  }

  // Show register selector if location selected but no register assigned OR no session
  if (!contextRegisterId || !session) {
    return (
      <>
        <div className="fixed inset-0 left-[60px] bg-black">
          <POSRegisterSelector
            locationId={contextLocation.id}
            locationName={contextLocation.name}
            onRegisterSelected={async (id, sessionId, hasProcessor, registerData) => {
              console.log("🟢 onRegisterSelected callback triggered:", { 
                id, 
                sessionId, 
                hasProcessor, 
                registerName: registerData?.register_name,
                hasCurrentSession: !!registerData?.current_session 
              });
              
              try {
                // Store register info for session creation
                const register = { id, name: registerData?.register_name || `Register ${id.slice(0, 8)}` };
                console.log("🟢 Setting register state:", register);
                setSelectedRegister(register);
                setHasPaymentProcessor(hasProcessor || false);
                
                if (sessionId && registerData?.current_session) {
                  // Existing session - fetch full session data and show join modal
                  console.log("🟢 Existing session detected, fetching session data...", { sessionId });
                  
                  const { data: existingSession, error } = await supabase
                    .from("pos_sessions")
                    .select("id, session_number, total_sales, opened_at, register_id")
                    .eq("id", sessionId)
                    .single();
                  
                  if (error) {
                    console.error("❌ Supabase error:", error);
                    throw error;
                  }
                  
                  if (existingSession) {
                    console.log("🟢 Found existing session:", existingSession);
                    console.log("🟢 Setting existingSessionInfo state and showing modal");
                    setExistingSessionInfo(existingSession);
                    setShowSessionModal(true);
                    console.log("🟢 Modal state should now be visible");
                  } else {
                    console.warn("⚠️ No session data returned");
                  }
                } else {
                  // No active session - show drawer count modal to start new
                  console.log("🟢 No session - showing drawer modal");
                  setShowOpenDrawerModal(true);
                }
              } catch (error) {
                console.error("❌ Error in onRegisterSelected:", error);
                alert(`Failed to load session information: ${error instanceof Error ? error.message : String(error)}`);
              }
            }}
            onBackToLocationSelector={() => {
              clearLocation();
            }}
          />
        </div>

        {/* Modals that need to be accessible from register selector */}
        {showOpenDrawerModal && (
          <OpenCashDrawerModal
            onSubmit={handleOpenDrawerSubmit}
            onCancel={() => setShowOpenDrawerModal(false)}
          />
        )}

        {showSessionModal && existingSessionInfo && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-black border-2 border-white/20 rounded-2xl p-8 max-w-md w-full">
              <h2
                className="text-2xl font-black text-white uppercase tracking-tight mb-4"
                style={{ fontWeight: 900 }}
              >
                Session Active
              </h2>
              <p className="text-white/60 text-sm mb-6">
                This register has an active session. Would you like to join it or start a new one?
              </p>

              <div className="space-y-3 mb-6">
                <div className="bg-white/5 rounded-xl p-4 space-y-2">
                  <div className="text-white/40 text-xs uppercase tracking-[0.15em]">Session</div>
                  <div className="text-white font-bold">{existingSessionInfo.session_number}</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 space-y-2">
                  <div className="text-white/40 text-xs uppercase tracking-[0.15em]">Total Sales</div>
                  <div className="text-white font-bold">
                    ${existingSessionInfo.total_sales.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleJoinSession}
                  disabled={processing}
                  className="w-full py-3 bg-white text-black rounded-xl hover:bg-white/90 transition-all text-sm font-black uppercase tracking-[0.15em] disabled:opacity-50"
                  style={{ fontWeight: 900 }}
                >
                  {processing ? "Joining..." : "Join Session"}
                </button>
                <button
                  onClick={handleStartNewSession}
                  disabled={processing}
                  className="w-full py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 hover:border-red-500/50 transition-all text-sm font-black uppercase tracking-[0.15em] disabled:opacity-50"
                  style={{ fontWeight: 900 }}
                >
                  End & Start New
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="fixed inset-0 left-[60px] flex flex-col bg-black">
      {/* Main POS Interface */}
      <div className="flex flex-1 h-full w-full bg-black overflow-hidden">
        {/* Left: Product Selection */}
        <div className="flex-1 h-full overflow-hidden">
          <POSProductGrid
            locationId={contextLocation.id}
            locationName={contextLocation.name}
            vendorId={vendor?.id || ""}
            userName={user?.name || "Staff Member"}
            registerId={contextRegisterId}
            onAddToCart={handleAddToCart}
            displayMode="cards"
            showInventory={true}
            skuInput={skuInput}
            onSkuInputChange={setSkuInput}
            onSkuSubmit={handleSkuSubmit}
            skuInputRef={skuInputRef}
            onResetRequest={() => {}} // Enable reset functionality
          />
        </div>

        {/* Right: Cart - Fixed Width Sidebar */}
        <div className="w-[400px] h-full flex-shrink-0 border-l border-white/10 bg-black flex flex-col">
          <POSCart
            items={cart}
            vendorId={vendor?.id || ""}
            locationId={contextLocation?.id || ""}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onCheckout={handleCheckout}
            taxRate={taxRate || 0}
            taxBreakdown={taxBreakdown}
            taxError={taxLoading ? null : taxError}
            isProcessing={processing}
          />
        </div>
      </div>

      {/* Payment Modal */}
      {showPayment && !processing && (
        <POSPayment
          total={total}
          onPaymentComplete={handlePaymentComplete}
          onCancel={() => setShowPayment(false)}
          locationId={contextLocation?.id}
          registerId={contextRegisterId || undefined}
          hasPaymentProcessor={hasPaymentProcessor}
        />
      )}

      {/* Open Cash Drawer Modal */}
      {showOpenDrawerModal && (
        <OpenCashDrawerModal
          onSubmit={handleOpenDrawerSubmit}
          onCancel={() => setShowOpenDrawerModal(false)}
        />
      )}

      {/* Existing Session Modal */}
      {showSessionModal && existingSessionInfo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black border-2 border-white/20 rounded-2xl p-8 max-w-md w-full">
            <h2
              className="text-2xl font-black text-white uppercase tracking-tight mb-4"
              style={{ fontWeight: 900 }}
            >
              Session Active
            </h2>
            <p className="text-white/60 text-sm mb-6">
              This register has an active session. Would you like to join it or start a new one?
            </p>

            <div className="space-y-3 mb-6">
              <div className="bg-white/5 rounded-xl p-4 space-y-2">
                <div className="text-white/40 text-xs uppercase tracking-[0.15em]">Session</div>
                <div className="text-white font-bold">{existingSessionInfo.session_number}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-4 space-y-2">
                <div className="text-white/40 text-xs uppercase tracking-[0.15em]">Total Sales</div>
                <div className="text-white font-bold">
                  ${existingSessionInfo.total_sales.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleJoinSession}
                className="w-full py-3 bg-white text-black rounded-xl hover:bg-white/90 transition-all text-sm font-black uppercase tracking-[0.15em]"
                style={{ fontWeight: 900 }}
              >
                Join Session
              </button>
              <button
                onClick={handleStartNewSession}
                className="w-full py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 hover:border-red-500/50 transition-all text-sm font-black uppercase tracking-[0.15em]"
                style={{ fontWeight: 900 }}
              >
                End & Start New
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
