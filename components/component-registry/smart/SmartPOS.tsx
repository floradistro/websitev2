/**
 * Smart Component: SmartPOS
 * Point of Sale System - Walk-in sales & pickup order fulfillment
 * WhaleTools luxury theme with vendor auto-configuration
 */

"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { 
  SmartComponentWrapper, 
  SmartComponentBaseProps 
} from '@/lib/smart-component-base';
import { POSSessionHeader } from '../pos/POSSessionHeader';
import { POSProductGrid } from '../pos/POSProductGrid';
import { POSCart, CartItem } from '../pos/POSCart';
import { POSPayment, PaymentData } from '../pos/POSPayment';

export interface SmartPOSProps extends SmartComponentBaseProps {
  locationId: string;
  locationName: string;
  userName?: string;
  defaultView?: 'register' | 'pickup';
}

export function SmartPOS({
  vendorId = '',
  vendorSlug = '',
  vendorName = '',
  vendorLogo = '',
  locationId,
  locationName,
  userName = 'Staff',
  defaultView = 'register',
  animate = false, // POS doesn't need animations for speed
  className = '',
}: SmartPOSProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);

  // Check for active session on load
  useEffect(() => {
    loadActiveSession();
  }, [locationId]);

  const loadActiveSession = async () => {
    try {
      const response = await fetch(`/api/pos/sessions/active?locationId=${locationId}`);
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
          locationId,
          vendorId,
          sessionId,
          userId: null,
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
    <SmartComponentWrapper animate={animate} componentName="POS">
      <div className="fixed inset-0 bg-black text-white flex flex-col overflow-hidden">
        {/* Compact Header */}
        <header className="flex-shrink-0 border-b border-white/10 bg-black">
          <POSSessionHeader
            locationId={locationId}
            locationName={locationName}
            userName={userName}
          />
        </header>

        {/* Main POS Interface - Fixed Height */}
        <main className="flex-1 grid grid-cols-[1fr_420px] gap-0 overflow-hidden">
          {/* Left: Product Grid - Independently Scrollable */}
          <div className="flex flex-col border-r border-white/10 bg-[#0a0a0a] overflow-hidden">
            <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ minHeight: 0 }}>
              <POSProductGrid
                locationId={locationId}
                onAddToCart={handleAddToCart}
                displayMode="cards"
                showInventory={true}
              />
            </div>
          </div>

          {/* Right: Cart - Fixed Height with Internal Scroll */}
          <div className="flex flex-col bg-black">
            <POSCart
              items={cart}
              vendorId={vendorId}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              onCheckout={handleCheckout}
              taxRate={0.08}
              isProcessing={processing}
            />
          </div>
        </main>

        {/* Payment Modal */}
        {showPayment && !processing && (
          <POSPayment
            total={total}
            onPaymentComplete={handlePaymentComplete}
            onCancel={() => setShowPayment(false)}
          />
        )}
      </div>
    </SmartComponentWrapper>
  );
}

