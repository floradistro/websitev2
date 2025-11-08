'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { POSProductGrid } from '@/components/component-registry/pos/POSProductGrid';
import { POSCart, CartItem } from '@/components/component-registry/pos/POSCart';
import { POSPayment, PaymentData } from '@/components/component-registry/pos/POSPayment';
import { POSRegisterSelector } from '@/components/component-registry/pos/POSRegisterSelector';
import { POSLocationSelector } from '@/components/component-registry/pos/POSLocationSelector';
import { useAppAuth } from '@/context/AppAuthContext';
import { supabase } from '@/lib/supabase/client';
import { calculatePrice, type Promotion } from '@/lib/pricing';

export default function POSRegisterPage() {
  const { user, vendor, locations, isLoading } = useAppAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [registerId, setRegisterId] = useState<string | null>(null);
  const [hasPaymentProcessor, setHasPaymentProcessor] = useState<boolean>(false);

  // CRITICAL FIX: Persist selected location in localStorage to survive navigation
  const [selectedLocation, setSelectedLocation] = useState<{ id: string; name: string } | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pos_selected_location');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  });
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [skuInput, setSkuInput] = useState('');
  const [skuLoading, setSkuLoading] = useState(false);
  const [skuError, setSkuError] = useState<string | null>(null);
  const skuInputRef = useRef<HTMLInputElement>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [productsCache, setProductsCache] = useState<Map<string, any>>(new Map());
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [existingSessionInfo, setExistingSessionInfo] = useState<any>(null);
  const [taxRate, setTaxRate] = useState<number | null>(null);
  const [taxBreakdown, setTaxBreakdown] = useState<Array<{name: string; rate: number; type: string}>>([]);
  const [taxError, setTaxError] = useState<string | null>(null);

  // Auto-select location for single-location staff
  useEffect(() => {
    if (!selectedLocation && locations.length === 1) {
      const singleLocation = locations[0];
      const location = { id: singleLocation.id, name: singleLocation.name };
      setSelectedLocation(location);
      localStorage.setItem('pos_selected_location', JSON.stringify(location));
      console.log('🎯 Auto-selected single location:', singleLocation.name);
    }
  }, [locations, selectedLocation]);

  // FRESH TAX DATA - NO FALLBACKS, NO HARDCODED VALUES
  useEffect(() => {
    async function loadTaxRate() {
      if (!selectedLocation?.id || !vendor?.id) {
        setTaxRate(null);
        return;
      }

      console.log('💰 Fetching tax rate from API for:', selectedLocation.name);
      setTaxError(null);

      try {
        const response = await fetch(`/api/vendor/locations`, {
          headers: { 'x-vendor-id': vendor.id }
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error('API returned success: false');
        }

        const location = data.locations?.find((l: any) => l.id === selectedLocation.id);

        if (!location) {
          throw new Error(`Location ${selectedLocation.name} not found in API response`);
        }

        const rate = location.settings?.tax_config?.sales_tax_rate;
        const taxes = location.settings?.tax_config?.taxes || [];

        if (!rate || typeof rate !== 'number' || rate <= 0) {
          throw new Error(`NO TAX CONFIGURED FOR ${selectedLocation.name}! Go to Settings > Locations to configure taxes.`);
        }

        setTaxRate(rate);
        setTaxBreakdown(taxes);
        console.log(`✅ Tax rate loaded from API: ${(rate * 100)}%`);
        console.log(`   Tax breakdown (${taxes.length} items):`, taxes);
        console.log(`   Full location data:`, location.settings?.tax_config);

      } catch (error: any) {
        console.error('❌ TAX LOAD FAILED:', error.message);
        setTaxError(error.message);
        setTaxRate(null);
        alert(`TAX CONFIGURATION ERROR:\n\n${error.message}\n\nPOS cannot operate without tax configuration.`);
      }
    }

    loadTaxRate();
  }, [selectedLocation?.id, vendor?.id]);

  // Check for existing session on mount
  useEffect(() => {
    if (!registerId) return;

    const checkExistingSession = async () => {
      try {
        const { data: existingSession } = await supabase
          .from('pos_sessions')
          .select('id, session_number, total_sales, opened_at')
          .eq('register_id', registerId)
          .eq('status', 'open')
          .maybeSingle();

        if (existingSession && !sessionId) {
          // Found existing session - show modal
          setExistingSessionInfo(existingSession);
          setShowSessionModal(true);
        }
      } catch (error) {
        console.error('Error checking for existing session:', error);
      }
    };

    checkExistingSession();
  }, [registerId, sessionId]);

  const handleJoinSession = () => {
    if (existingSessionInfo) {
      setSessionId(existingSessionInfo.id);
      setShowSessionModal(false);
    }
  };

  const handleStartNewSession = async () => {
    // Close existing session and start new one
    if (existingSessionInfo) {
      try {
        await fetch('/api/pos/sessions/close', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: existingSessionInfo.id,
            closingCash: 0,
            closingNotes: 'Closed to start new session',
          }),
        });

        // Start new session
        const response = await fetch('/api/pos/sessions/open', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registerId,
            locationId: selectedLocation?.id,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setSessionId(data.session.id);
          setShowSessionModal(false);
        }
      } catch (error) {
        console.error('Error starting new session:', error);
        alert('Failed to start new session');
      }
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
        console.log('🎉 Loaded promotions:', data.promotions?.length || 0);
      }
    } catch (error) {
      console.error('Error loading promotions:', error);
    }
  };

  // Load initial data
  useEffect(() => {
    loadPromotions();
  }, [vendor]);

  // Simple session monitoring with polling - works on all devices/networks
  useEffect(() => {
    if (!sessionId || !registerId) return;

    const checkSession = async () => {
      try {
        const response = await fetch(`/api/pos/sessions/status?sessionId=${sessionId}`);

        if (response.ok) {
          const { session } = await response.json();

          // Kick out ONLY if session is explicitly closed
          if (session && session.status === 'closed') {
            console.log('❌ Session closed, returning to register selector');
            setSessionId(null);
            setRegisterId(null);
            setCart([]);
          }
        }
      } catch (error) {
        // Don't kick out on errors - just log them
        console.error('Session check error (not kicking out):', error);
      }
    };

    // Poll every 2 seconds - fast enough to prevent issues
    const interval = setInterval(checkSession, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [sessionId, registerId]);

  const loadActiveSession = async () => {
    if (!selectedLocation?.id) return;
    try {
      const response = await fetch(`/api/pos/sessions/active?locationId=${selectedLocation.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.session) {
          setSessionId(data.session.id);
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  // Recalculate cart with current promotions
  const recalculateCart = useCallback(() => {
    setCart(prevCart => {
      return prevCart.map(item => {
        // Get product from cache
        const product = productsCache.get(item.productId);
        if (!product) return item;

        // Calculate price with promotions
        const priceCalc = calculatePrice(product, promotions, item.quantity);

        return {
          ...item,
          unitPrice: priceCalc.finalPrice,
          lineTotal: priceCalc.finalPrice * item.quantity,
          originalPrice: priceCalc.originalPrice !== priceCalc.finalPrice ? priceCalc.originalPrice : undefined,
          discount: priceCalc.savings * item.quantity,
          promotionName: priceCalc.appliedPromotion?.name,
          badgeText: priceCalc.badge?.text,
          badgeColor: priceCalc.badge?.color,
        };
      });
    });
  }, [promotions, productsCache]);

  // Add product to cart
  const handleAddToCart = useCallback((product: any, quantity: number) => {
    // Cache the product for future calculations
    setProductsCache(prev => {
      const newCache = new Map(prev);
      newCache.set(product.id, product);
      return newCache;
    });

    // Calculate price with promotions
    const priceCalc = calculatePrice(product, promotions, quantity);

    setCart(prevCart => {
      const existing = prevCart.find(item => item.productId === product.id);

      if (existing) {
        // Update quantity and recalculate
        const newQuantity = existing.quantity + quantity;
        const newPriceCalc = calculatePrice(product, promotions, newQuantity);

        return prevCart.map(item =>
          item.productId === product.id
            ? {
                ...item,
                quantity: newQuantity,
                unitPrice: newPriceCalc.finalPrice,
                lineTotal: newPriceCalc.finalPrice * newQuantity,
                originalPrice: newPriceCalc.originalPrice !== newPriceCalc.finalPrice ? newPriceCalc.originalPrice : undefined,
                discount: newPriceCalc.savings * newQuantity,
                promotionName: newPriceCalc.appliedPromotion?.name,
                badgeText: newPriceCalc.badge?.text,
                badgeColor: newPriceCalc.badge?.color,
              }
            : item
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
            originalPrice: priceCalc.originalPrice !== priceCalc.finalPrice ? priceCalc.originalPrice : undefined,
            discount: priceCalc.savings * quantity,
            promotionName: priceCalc.appliedPromotion?.name,
            badgeText: priceCalc.badge?.text,
            badgeColor: priceCalc.badge?.color,
          },
        ];
      }
    });
  }, [promotions]);

  // Update item quantity
  const handleUpdateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item => {
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
            originalPrice: priceCalc.originalPrice !== priceCalc.finalPrice ? priceCalc.originalPrice : undefined,
            discount: priceCalc.savings * quantity,
            promotionName: priceCalc.appliedPromotion?.name,
            badgeText: priceCalc.badge?.text,
            badgeColor: priceCalc.badge?.color,
          };
        }
        return item;
      })
    );
  }, [promotions, productsCache]);

  // Remove item from cart
  const handleRemoveItem = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  }, []);

  // Clear cart
  const handleClearCart = useCallback(() => {
    if (confirm('Clear entire cart?')) {
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
        `/api/pos/products/lookup?sku=${encodeURIComponent(sku.trim())}&location_id=${selectedLocation?.id}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Product not found');
      }

      const data = await response.json();
      const product = data.product;

      // Check if product is in stock
      if (product.inventory.available_quantity <= 0) {
        setSkuError(`❌ ${product.name} is out of stock`);
        setTimeout(() => setSkuError(null), 3000);
        setSkuInput('');
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
        1
      );

      // Show success feedback
      setSkuInput('');
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
      if (taxRate === null) {
        throw new Error('Tax configuration not loaded. Please refresh the page.');
      }

      if (!selectedLocation?.id || !vendor?.id) {
        throw new Error('Location or vendor information missing. Please refresh.');
      }

      // Calculate totals
      const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;

      // Get customer info
      const customerId = selectedCustomer?.id || null;
      const customerName = selectedCustomer
        ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}`
        : 'Walk-In';

      console.log('🛒 Creating sale:', {
        items: cart.length,
        total: `$${total.toFixed(2)}`,
        payment: paymentData.paymentMethod
      });

      // Call sales API
      const response = await fetch('/api/pos/sales/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: selectedLocation.id,
          vendorId: vendor.id,
          sessionId,
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || 'Failed to complete sale');
      }

      const result = await response.json();

      console.log('✅ Sale completed:', result.order.order_number);

      // Clear cart and state FIRST
      setCart([]);
      setSelectedCustomer(null);

      // Close modal
      setShowPayment(false);

      // Show success message
      alert(
        `✅ Sale Completed!\n\n` +
        `Order: ${result.order.order_number}\n` +
        `Total: $${total.toFixed(2)}\n` +
        `${paymentData.changeGiven ? `Change: $${paymentData.changeGiven.toFixed(2)}` : ''}`
      );

      // Reload session in background (non-blocking)
      loadActiveSession().catch(err =>
        console.error('Failed to reload session:', err)
      );

    } catch (error: any) {
      console.error('❌ Sale failed:', error);

      // Show user-friendly error
      alert(
        `❌ Sale Failed\n\n` +
        `${error.message}\n\n` +
        `Your cart has not been cleared. Please try again or contact support.`
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
    console.log('⏳ POS waiting for auth context to load...');
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-white/40 text-xs uppercase tracking-[0.15em]">Loading...</div>
      </div>
    );
  }

  // Show location selector if not selected (for admins or multi-location staff)
  if (!selectedLocation) {
    console.log('📍 POS showing location selector - locations available:', locations.length);
    return (
      <POSLocationSelector
        locations={locations}
        onLocationSelected={(locationId, locationName) => {
          const location = { id: locationId, name: locationName };
          setSelectedLocation(location);
          // CRITICAL FIX: Persist to localStorage
          localStorage.setItem('pos_selected_location', JSON.stringify(location));
          console.log('✅ Location selected:', locationName);
        }}
      />
    );
  }

  // Show register selector if location selected but no register assigned
  if (!registerId) {
    return (
      <POSRegisterSelector
        locationId={selectedLocation.id}
        locationName={selectedLocation.name}
        onRegisterSelected={(id, sessionId, hasProcessor) => {
          setRegisterId(id);
          setHasPaymentProcessor(hasProcessor || false);
          if (sessionId) {
            setSessionId(sessionId);
          }
          console.log('🔐 Register selected:', id, 'Has processor:', hasProcessor);
        }}
        onBackToLocationSelector={() => {
          // Clear location selection to go back to location selector
          setSelectedLocation(null);
          localStorage.removeItem('pos_selected_location');
          console.log('🔙 Cleared location selection, returning to location selector');
        }}
      />
    );
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col overflow-hidden">
      {/* Main POS Interface */}
      <div className="flex gap-0 flex-1 min-h-0">
        {/* Left: Product Selection */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <POSProductGrid
            locationId={selectedLocation.id}
            locationName={selectedLocation.name}
            vendorId={vendor?.id || ''}
            userName={user?.name || 'Staff Member'}
            registerId={registerId}
            onAddToCart={handleAddToCart}
            displayMode="cards"
            showInventory={true}
            skuInput={skuInput}
            onSkuInputChange={setSkuInput}
            onSkuSubmit={handleSkuSubmit}
            skuInputRef={skuInputRef}
            onSessionClosed={() => {
              setSessionId(null);
              setRegisterId(null);
              setCart([]);
            }}
          />
        </div>

        {/* Right: Cart - Fixed Width Sidebar */}
        <div className="w-[400px] flex-shrink-0 border-l border-white/10 bg-[#0a0a0a]">
          <POSCart
            items={cart}
            vendorId={vendor?.id || ''}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onCheckout={handleCheckout}
            taxRate={taxRate || 0}
            taxBreakdown={taxBreakdown}
            taxError={taxError}
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
          locationId={selectedLocation?.id}
          registerId={registerId || undefined}
          hasPaymentProcessor={hasPaymentProcessor}
        />
      )}

      {/* Existing Session Modal */}
      {showSessionModal && existingSessionInfo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-black border-2 border-white/20 rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4" style={{ fontWeight: 900 }}>
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
                <div className="text-white font-bold">${existingSessionInfo.total_sales.toFixed(2)}</div>
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

