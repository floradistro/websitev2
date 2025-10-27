'use client';

import { useState, useCallback, useEffect } from 'react';
import { POSSessionHeader } from '@/components/component-registry/pos/POSSessionHeader';
import { POSProductGrid } from '@/components/component-registry/pos/POSProductGrid';
import { POSCart, CartItem } from '@/components/component-registry/pos/POSCart';
import { POSPayment, PaymentData } from '@/components/component-registry/pos/POSPayment';

// For now, hardcode Charlotte Central - will add location selector later
const CHARLOTTE_CENTRAL_ID = 'c4eedafb-4050-4d2d-a6af-e164aad5d934';
const FLORA_DISTRO_VENDOR_ID = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';

export default function POSRegisterPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Check for active session on load
  useEffect(() => {
    loadActiveSession();
  }, []);

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

  // Add product to cart
  const handleAddToCart = useCallback((product: any, quantity: number) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.productId === product.id);
      
      if (existing) {
        // Update quantity
        return prevCart.map(item =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                lineTotal: (item.quantity + quantity) * item.unitPrice,
              }
            : item
        );
      } else {
        // Add new item
        return [
          ...prevCart,
          {
            productId: product.id,
            productName: product.name,
            unitPrice: product.price,
            quantity,
            lineTotal: product.price * quantity,
            inventoryId: product.inventory_id,
          },
        ];
      }
    });
  }, []);

  // Update item quantity
  const handleUpdateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.productId === productId
          ? {
              ...item,
              quantity,
              lineTotal: quantity * item.unitPrice,
            }
          : item
      )
    );
  }, []);

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

  // Open payment modal
  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowPayment(true);
  };

  // Process payment
  const handlePaymentComplete = async (paymentData: PaymentData) => {
    setProcessing(true);

    try {
      const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
      const taxAmount = subtotal * 0.08;
      const total = subtotal + taxAmount;

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
          customerName: 'Walk-In',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete sale');
      }

      const result = await response.json();

      // Show receipt/success
      alert(`✅ Sale completed!\n\nOrder: ${result.order.order_number}\nTotal: $${total.toFixed(2)}\n\nChange: $${paymentData.changeGiven?.toFixed(2) || '0.00'}`);

      // Clear cart and close payment
      setCart([]);
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Session Header */}
      <div className="border-b border-white/10 p-4">
        <POSSessionHeader
          locationId={CHARLOTTE_CENTRAL_ID}
          locationName="Charlotte Central"
          userName="Staff Member"
        />
      </div>

      {/* Main POS Interface */}
      <div className="grid lg:grid-cols-2 gap-6 p-6">
        {/* Left: Product Selection */}
        <div>
          <h2 className="text-2xl font-black text-white uppercase mb-4" style={{ fontWeight: 900 }}>
            Products
          </h2>
          <POSProductGrid
            locationId={CHARLOTTE_CENTRAL_ID}
            onAddToCart={handleAddToCart}
            displayMode="cards"
            showInventory={true}
          />
        </div>

        {/* Right: Cart */}
        <div className="lg:sticky lg:top-6 lg:self-start">
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

