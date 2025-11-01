'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { POSProductGrid } from '@/components/component-registry/pos/POSProductGrid';
import { POSCart, CartItem } from '@/components/component-registry/pos/POSCart';
import { POSPayment, PaymentData } from '@/components/component-registry/pos/POSPayment';
import { POSRegisterSelector } from '@/components/component-registry/pos/POSRegisterSelector';
import { supabase } from '@/lib/supabase/client';
import { calculatePrice, type Promotion } from '@/lib/pricing';

// For now, hardcode Charlotte Central - will add location selector later
const CHARLOTTE_CENTRAL_ID = 'c4eedafb-4050-4d2d-a6af-e164aad5d934';
const FLORA_DISTRO_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

export default function POSRegisterPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [registerId, setRegisterId] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [skuInput, setSkuInput] = useState('');
  const [skuLoading, setSkuLoading] = useState(false);
  const [skuError, setSkuError] = useState<string | null>(null);
  const skuInputRef = useRef<HTMLInputElement>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [productsCache, setProductsCache] = useState<Map<string, any>>(new Map());

  // Load promotions
  const loadPromotions = async () => {
    try {
      const response = await fetch(`/api/vendor/promotions?vendor_id=${FLORA_DISTRO_VENDOR_ID}`);
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
  }, []);

  // Subscribe to broadcast channel for promotion updates (more reliable)
  useEffect(() => {
    const channel = supabase
      .channel(`pos-promotions-${FLORA_DISTRO_VENDOR_ID}`, {
        config: {
          broadcast: { self: true },
        },
      })
      .on('broadcast', { event: 'promotion-update' }, (payload) => {
        console.log('🎉 Promotion update broadcast received:', payload);
        loadPromotions();
        // Recalculate cart with new promotions
        recalculateCart();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [recalculateCart]);

  const loadActiveSession = async () => {
    try {
      const response = await fetch(`/api/pos/sessions/active?locationId=${CHARLOTTE_CENTRAL_ID}`);
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
        `/api/pos/products/lookup?sku=${encodeURIComponent(sku.trim())}&location_id=${CHARLOTTE_CENTRAL_ID}`
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

  // Process payment
  const handlePaymentComplete = async (paymentData: PaymentData) => {
    setProcessing(true);

    try {
      const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
      const taxAmount = subtotal * 0.08;
      const total = subtotal + taxAmount;

      // Get customer info
      const customerId = selectedCustomer?.id || null;
      const customerName = selectedCustomer
        ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}`
        : 'Walk-In';

      const response = await fetch('/api/pos/sales/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: CHARLOTTE_CENTRAL_ID,
          vendorId: FLORA_DISTRO_VENDOR_ID,
          sessionId,
          userId: null, // TODO: Get from auth
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
        throw new Error(errorData.error || 'Failed to complete sale');
      }

      const result = await response.json();

      // Show receipt/success
      alert(`✅ Sale completed!\n\nOrder: ${result.order.order_number}\nTotal: $${total.toFixed(2)}\n\nChange: $${paymentData.changeGiven?.toFixed(2) || '0.00'}`);

      // Clear cart, customer, and close payment
      setCart([]);
      setSelectedCustomer(null);
      setShowPayment(false);
      
      // Reload session to update totals
      loadActiveSession();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Calculate totals for cart
  const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
  const taxAmount = subtotal * 0.08;
  const total = subtotal + taxAmount;

  // Show register selector if not assigned
  if (!registerId) {
    return (
      <POSRegisterSelector
        locationId={CHARLOTTE_CENTRAL_ID}
        locationName="Charlotte Central"
        onRegisterSelected={(id, sessionId) => {
          setRegisterId(id);
          if (sessionId) {
            setSessionId(sessionId);
          }
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
            locationId={CHARLOTTE_CENTRAL_ID}
            locationName="Charlotte Central"
            vendorId={FLORA_DISTRO_VENDOR_ID}
            userName="Staff Member"
            registerId={registerId}
            onAddToCart={handleAddToCart}
            displayMode="cards"
            showInventory={true}
            skuInput={skuInput}
            onSkuInputChange={setSkuInput}
            onSkuSubmit={handleSkuSubmit}
            skuInputRef={skuInputRef}
          />
        </div>

        {/* Right: Cart - Fixed Width Sidebar */}
        <div className="w-[400px] flex-shrink-0 border-l border-white/10 bg-[#0a0a0a]">
          <POSCart
            items={cart}
            vendorId={FLORA_DISTRO_VENDOR_ID}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            onCheckout={handleCheckout}
            taxRate={0.08}
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
        />
      )}
    </div>
  );
}

