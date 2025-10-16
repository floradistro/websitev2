"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { ArrowRight, Store, Truck, Lock, ChevronLeft, CreditCard } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CartShippingEstimator from "@/components/CartShippingEstimator";
import Script from "next/script";
import { analytics } from "@/lib/analytics";

declare global {
  interface Window {
    Accept: any;
    ApplePaySession: any;
  }
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  
  const [billingInfo, setBillingInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    address2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US"
  });

  const [shippingInfo, setShippingInfo] = useState({
    firstName: "",
    lastName: "",
    address: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    country: "US"
  });

  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  const [paymentError, setPaymentError] = useState("");
  const [acceptJsLoaded, setAcceptJsLoaded] = useState(false);
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [useShippingAddress, setUseShippingAddress] = useState(false);

  const pickupItems = items.filter((item) => item.orderType === "pickup");
  const deliveryItems = items.filter((item) => item.orderType === "delivery");
  const hasPickupItems = pickupItems.length > 0;
  const hasDeliveryItems = deliveryItems.length > 0;

  const shippingCost = selectedShipping?.cost || 0;
  const finalTotal = total + shippingCost;

  const [authorizeKeys, setAuthorizeKeys] = useState<any>(null);

  useEffect(() => {
    if (window.ApplePaySession && window.ApplePaySession.canMakePayments()) {
      setApplePayAvailable(true);
    }

    // Track begin checkout event
    if (items.length > 0) {
      analytics.beginCheckout({
        items: items,
        total: total,
      });
    }

    // Fetch Authorize.net keys
    fetch("/api/authorize-keys")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAuthorizeKeys(data);
        }
      })
      .catch((err) => console.error("Failed to load payment keys:", err));
  }, []);

  const processPayment = async (paymentToken: string) => {
    try {
      const response = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payment_token: paymentToken,
          billing: billingInfo,
          shipping: useShippingAddress ? shippingInfo : null,
          items: items,
          shipping_method: selectedShipping,
          shipping_cost: shippingCost,
          total: finalTotal
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Payment failed");
      }

      clearCart();
      router.push(`/track?orderId=${data.order_id}&type=${hasPickupItems && !hasDeliveryItems ? 'pickup' : hasDeliveryItems && !hasPickupItems ? 'delivery' : 'mixed'}`);
    } catch (error: any) {
      setPaymentError(error.message || "Payment processing failed");
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentError("");

    if (!authorizeKeys || !authorizeKeys.apiLoginId) {
      setPaymentError("Payment configuration not loaded. Please refresh and try again.");
      setIsProcessing(false);
      return;
    }

    // If using server-side processing (no Accept.js)
    if (authorizeKeys.useServerSide || !acceptJsLoaded || !window.Accept) {
      // Send card data directly - will be tokenized server-side
      const [expMonth, expYear] = paymentInfo.expiry.split("/");
      const paymentData = {
        cardNumber: paymentInfo.cardNumber.replace(/\s/g, ""),
        expMonth,
        expYear,
        cvv: paymentInfo.cvv
      };
      
      await processPayment(JSON.stringify(paymentData));
      return;
    }

    // Use Accept.js if available and configured
    const authData = {
      clientKey: authorizeKeys.clientKey,
      apiLoginID: authorizeKeys.apiLoginId
    };

    const [expMonth, expYear] = paymentInfo.expiry.split("/");
    const fullYear = expYear.length === 2 ? "20" + expYear : expYear;

    const cardData = {
      cardNumber: paymentInfo.cardNumber.replace(/\s/g, ""),
      month: expMonth,
      year: fullYear,
      cardCode: paymentInfo.cvv,
      zip: billingInfo.zipCode
    };

    const secureData = {
      authData: authData,
      cardData: cardData
    };

    window.Accept.dispatchData(secureData, async (response: any) => {
      if (response.messages.resultCode === "Error") {
        let errorMessage = "";
        for (let i = 0; i < response.messages.message.length; i++) {
          errorMessage += response.messages.message[i].text + " ";
        }
        setPaymentError(errorMessage);
        setIsProcessing(false);
      } else {
        const paymentToken = response.opaqueData.dataValue;
        await processPayment(paymentToken);
      }
    });
  };

  const handleApplePay = async () => {
    setPaymentError("Apple Pay is not configured yet. Please use credit card payment.");
    setIsProcessing(false);
    return;
    
    // Apple Pay implementation (disabled until configured)
    /*
    if (!window.ApplePaySession) {
      setPaymentError("Apple Pay is not available on this device");
      return;
    }

    setIsProcessing(true);
    setPaymentError("");

    const request = {
      countryCode: "US",
      currencyCode: "USD",
      supportedNetworks: ["visa", "masterCard", "amex", "discover"],
      merchantCapabilities: ["supports3DS"],
      total: {
        label: "Flora Distro",
        amount: finalTotal.toFixed(2)
      },
      lineItems: items.map(item => ({
        label: item.name,
        amount: (item.price * item.quantity).toFixed(2)
      }))
    };

    const session = new window.ApplePaySession(3, request);

    session.onvalidatemerchant = async (event: any) => {
      try {
        const response = await fetch("/api/apple-pay-validate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            validationURL: event.validationURL
          })
        });

        const data = await response.json();

        if (data.success) {
          session.completeMerchantValidation(data.merchantSession);
        } else {
          throw new Error(data.error || "Merchant validation failed");
        }
      } catch (error: any) {
        console.error("Apple Pay validation error:", error);
        session.abort();
        setPaymentError("Apple Pay setup failed: " + error.message);
        setIsProcessing(false);
      }
    };

    session.onpaymentauthorized = async (event: any) => {
      try {
        const payment = event.payment;
        
        // Extract payment token from Apple Pay
        const paymentToken = payment.token.paymentData;
        
        // Process the payment
        const response = await fetch("/api/payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            payment_token: JSON.stringify(paymentToken),
            payment_type: "apple_pay",
            billing: {
              firstName: payment.billingContact?.givenName || billingInfo.firstName,
              lastName: payment.billingContact?.familyName || billingInfo.lastName,
              email: payment.shippingContact?.emailAddress || billingInfo.email,
              phone: payment.shippingContact?.phoneNumber || billingInfo.phone,
              address: payment.billingContact?.addressLines?.[0] || billingInfo.address,
              address2: payment.billingContact?.addressLines?.[1] || "",
              city: payment.billingContact?.locality || billingInfo.city,
              state: payment.billingContact?.administrativeArea || billingInfo.state,
              zipCode: payment.billingContact?.postalCode || billingInfo.zipCode,
              country: payment.billingContact?.countryCode || "US"
            },
            shipping: payment.shippingContact ? {
              firstName: payment.shippingContact.givenName,
              lastName: payment.shippingContact.familyName,
              address: payment.shippingContact.addressLines[0],
              address2: payment.shippingContact.addressLines[1] || "",
              city: payment.shippingContact.locality,
              state: payment.shippingContact.administrativeArea,
              zip: payment.shippingContact.postalCode,
              country: payment.shippingContact.countryCode || "US"
            } : null,
            items: items,
            shipping_method: selectedShipping,
            shipping_cost: shippingCost,
            total: finalTotal
          })
        });

        const data = await response.json();

        if (data.success) {
          session.completePayment(window.ApplePaySession.STATUS_SUCCESS);
          clearCart();
          router.push(`/track?orderId=${data.order_id}&type=${hasPickupItems && !hasDeliveryItems ? 'pickup' : hasDeliveryItems && !hasPickupItems ? 'delivery' : 'mixed'}`);
        } else {
          throw new Error(data.error || "Payment failed");
        }
      } catch (error: any) {
        console.error("Apple Pay payment error:", error);
        session.completePayment(window.ApplePaySession.STATUS_FAILURE);
        setPaymentError("Payment failed: " + error.message);
        setIsProcessing(false);
      }
    };

    session.oncancel = () => {
      setIsProcessing(false);
    };

    session.begin();
    */
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-light text-white mb-6">Your cart is empty</h1>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-black border border-white/20 text-white px-10 py-4 text-xs uppercase tracking-[0.25em] hover:bg-black/70 transition-all font-medium"
          >
            <span>Shop Products</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://js.authorize.net/v1/Accept.js"
        onLoad={() => setAcceptJsLoaded(true)}
        strategy="lazyOnload"
      />
      <div className="min-h-screen bg-[#1a1a1a]">
        {/* Breadcrumb */}
        <div className="border-b border-white/10 bg-[#1a1a1a]">
          <div className="px-4 py-4">
            <Link
              href="/products"
              className="inline-flex items-center space-x-2 text-xs text-white/60 hover:text-white transition-colors uppercase tracking-wider"
            >
              <ChevronLeft size={14} />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

      <form onSubmit={handleSubmit} className="py-0">
        <div className="grid lg:grid-cols-2">
          {/* Left - Forms */}
          <div className="bg-[#2a2a2a] px-8 md:px-12 py-12 space-y-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-light text-white mb-6 uppercase tracking-wider">Checkout</h1>
            </div>

            {/* Contact Info */}
            <div>
              <h2 className="text-sm uppercase tracking-[0.2em] text-white mb-6 font-normal">Contact Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      autoComplete="given-name"
                      value={billingInfo.firstName}
                      onChange={(e) => setBillingInfo({ ...billingInfo, firstName: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      autoComplete="family-name"
                      value={billingInfo.lastName}
                      onChange={(e) => setBillingInfo({ ...billingInfo, lastName: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={billingInfo.email}
                    onChange={(e) => setBillingInfo({ ...billingInfo, email: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60">
                    Phone
                  </label>
                  <input
                    type="tel"
                    required
                    autoComplete="tel"
                    value={billingInfo.phone}
                    onChange={(e) => setBillingInfo({ ...billingInfo, phone: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Billing Address */}
            <div>
              <h2 className="text-sm uppercase tracking-[0.2em] text-white mb-6 font-normal">Billing Address</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60">
                    Address
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="street-address"
                    value={billingInfo.address}
                    onChange={(e) => setBillingInfo({ ...billingInfo, address: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60">
                    Apartment, Suite, etc. (Optional)
                  </label>
                  <input
                    type="text"
                    autoComplete="address-line2"
                    value={billingInfo.address2}
                    onChange={(e) => setBillingInfo({ ...billingInfo, address2: e.target.value })}
                    className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      autoComplete="address-level2"
                      value={billingInfo.city}
                      onChange={(e) => setBillingInfo({ ...billingInfo, city: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60">
                      State
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      autoComplete="address-level1"
                      value={billingInfo.state}
                      onChange={(e) => setBillingInfo({ ...billingInfo, state: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all uppercase"
                      placeholder="NC"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      autoComplete="postal-code"
                      value={billingInfo.zipCode}
                      onChange={(e) => setBillingInfo({ ...billingInfo, zipCode: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                      placeholder="28801"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address Toggle */}
            {hasDeliveryItems && (
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useShippingAddress}
                    onChange={(e) => setUseShippingAddress(e.target.checked)}
                    className="w-4 h-4 bg-white/5 border border-white/10 rounded focus:ring-2 focus:ring-white/30"
                  />
                  <span className="text-xs text-white/80">Ship to a different address</span>
                </label>
              </div>
            )}

            {/* Shipping Address */}
            {hasDeliveryItems && useShippingAddress && (
              <div>
                <h2 className="text-sm uppercase tracking-[0.2em] text-white mb-6 font-normal">Shipping Address</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.firstName}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, firstName: e.target.value })}
                        className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.lastName}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, lastName: e.target.value })}
                        className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60">
                      Address
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingInfo.address}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60">
                      Apartment, Suite, etc. (Optional)
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.address2}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, address2: e.target.value })}
                      className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60">
                        City
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.city}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                        className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60">
                        State
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={2}
                        value={shippingInfo.state}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, state: e.target.value.toUpperCase() })}
                        className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all uppercase"
                        placeholder="NC"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60">
                        ZIP
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingInfo.zip}
                        onChange={(e) => setShippingInfo({ ...shippingInfo, zip: e.target.value })}
                        maxLength={5}
                        className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Info */}
            <div>
              <h2 className="text-sm uppercase tracking-[0.2em] text-white mb-6 font-normal flex items-center gap-2">
                <Lock size={16} className="text-white/60" />
                Payment Information
              </h2>
              
              {/* Apple Pay Button */}
              {applePayAvailable && (
                <button
                  type="button"
                  onClick={handleApplePay}
                  className="w-full mb-4 px-4 py-3 bg-black border border-white/20 text-white text-sm uppercase tracking-[0.2em] hover:bg-black/70 transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard size={16} />
                  Pay with Apple Pay
                </button>
              )}

              {paymentError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-400 text-xs">
                  {paymentError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60">
                    Card Number
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="cc-number"
                    placeholder="1234 5678 9012 3456"
                    value={paymentInfo.cardNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\s/g, "");
                      const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
                      setPaymentInfo({ ...paymentInfo, cardNumber: formatted });
                    }}
                    maxLength={19}
                    className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60">
                      Expiry (MM/YY)
                    </label>
                    <input
                      type="text"
                      required
                      autoComplete="cc-exp"
                      placeholder="12/25"
                      value={paymentInfo.expiry}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "");
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + "/" + value.slice(2, 4);
                        }
                        setPaymentInfo({ ...paymentInfo, expiry: value });
                      }}
                      maxLength={5}
                      className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] mb-2 text-white/60">
                      CVV
                    </label>
                    <input
                      type="text"
                      required
                      autoComplete="cc-csc"
                      placeholder="123"
                      value={paymentInfo.cvv}
                      onChange={(e) => setPaymentInfo({ ...paymentInfo, cvv: e.target.value.replace(/\D/g, "") })}
                      maxLength={4}
                      className="w-full px-4 py-3 text-sm bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Order Summary */}
          <div className="bg-[#3a3a3a] px-8 md:px-12 py-12">
            <h2 className="text-sm uppercase tracking-[0.2em] text-white mb-6 font-normal">Order Summary</h2>
            
            {/* Cart Items */}
            <div className="space-y-4 mb-8 max-h-[400px] overflow-y-auto scrollbar-hide">
              {items.map((item) => (
                <div key={`${item.productId}-${item.tierName}`} className="flex gap-4 pb-4 border-b border-white/5 last:border-0">
                  <div className="w-16 h-16 bg-[#2a2a2a] flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                    ) : (
                      <img src="/logoprint.png" alt="Flora Distro" className="w-full h-full object-contain opacity-20" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs text-white mb-1 line-clamp-1">{item.name}</h3>
                    <p className="text-[10px] text-white/40 mb-2">{item.tierName}</p>
                    {item.orderType === "pickup" ? (
                      <div className="flex items-center gap-1 text-[10px] text-white/50 mb-2">
                        <Store size={10} />
                        <span>{item.locationName}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-[10px] text-white/50 mb-2">
                        <Truck size={10} />
                        <span>Delivery</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/40">Qty: {item.quantity}</span>
                      <span className="text-xs text-white">${(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Shipping Estimator */}
            {deliveryItems.length > 0 && (
              <div className="mb-6">
                <CartShippingEstimator
                  items={deliveryItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price
                  }))}
                  onShippingSelect={(rate) => setSelectedShipping(rate)}
                />
              </div>
            )}

            {/* Totals */}
            <div className="space-y-3 pt-6 border-t border-white/10">
              <div className="flex justify-between text-sm text-white/60">
                <span>Subtotal</span>
                <span>${total.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-sm text-white/60">
                <span>Shipping</span>
                <span>{shippingCost > 0 ? `$${shippingCost.toFixed(2)}` : 'FREE'}</span>
              </div>
              {shippingCost === 0 && total >= 75 && (
                <div className="flex items-center gap-2 text-[10px] text-emerald-400 uppercase tracking-wider">
                  <div className="w-1 h-2 bg-emerald-400 rounded-full" />
                  <span>Free shipping applied</span>
                </div>
              )}
              <div className="flex justify-between text-lg text-white pt-3 border-t border-white/10 font-medium">
                <span>Total</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className={`w-full mt-8 px-8 py-4 text-xs uppercase tracking-[0.25em] transition-all duration-500 font-medium flex items-center justify-center gap-2 ${
                isProcessing
                  ? "bg-black/40 text-white/60 cursor-not-allowed border border-white/10"
                  : "bg-black text-white hover:bg-black/70 border border-white/20 hover:border-white/40"
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  Place Order
                  <ArrowRight size={14} />
                </>
              )}
            </button>

            {/* Security Notice */}
            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-white/40">
              <Lock size={10} />
              <span>Secure checkout · SSL encrypted</span>
            </div>
          </div>
        </div>
      </form>
      </div>
    </>
  );
}
