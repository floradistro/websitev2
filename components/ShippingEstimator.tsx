"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface ShippingRate {
  method_id: string;
  method_title: string;
  cost: number;
  currency: string;
  delivery_days: string;
  delivery_date: string;
}

interface ShippingEstimatorProps {
  productId: number;
  quantity?: number;
  productPrice?: number;
  locationId?: number;
}

export default function ShippingEstimator({ 
  productId, 
  quantity = 1,
  productPrice = 0,
  locationId
}: ShippingEstimatorProps) {
  const [zipCode, setZipCode] = useState("");
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(75);
  const [amountUntilFree, setAmountUntilFree] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [originLocation, setOriginLocation] = useState<any>(null);

  // Debug: Log props on mount and when they change
  useEffect(() => {
    console.log('🚚 ShippingEstimator props:', { productId, quantity, productPrice, locationId });
  }, [productId, quantity, productPrice, locationId]);

  // Load saved zip code from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("shipping_zip");
    if (saved) {
      setZipCode(saved);
    }
  }, []);

  const formatDeliveryDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return "Today";
    if (isTomorrow) return "Tomorrow";

    return date.toLocaleDateString("en-US", { 
      weekday: "short", 
      month: "short", 
      day: "numeric" 
    });
  };

  const getShippingSpeed = (methodId: string) => {
    if (methodId.includes("express")) return "EXPRESS";
    if (methodId.includes("priority")) return "PRIORITY";
    if (methodId.includes("first")) return "STANDARD";
    return "STANDARD";
  };

  const validateZipCode = (zip: string) => {
    return /^\d{5}$/.test(zip);
  };

  const calculateShipping = async () => {
    if (!validateZipCode(zipCode)) {
      setError("Please enter a valid 5-digit US ZIP code");
      return;
    }

    setLoading(true);
    setError("");
    setShowResults(false);

    try {
      // Validate productId (can be UUID or number)
      if (!productId) {
        console.error('❌ Missing productId');
        setError("Invalid product ID");
        setLoading(false);
        return;
      }

      const requestBody: any = {
        items: [
          {
            product_id: parseInt(String(productId)),
            quantity: quantity,
            price: productPrice, // Add price for shipping calculation
            productPrice: productPrice // Alternate field name
          },
        ],
        destination: {
          postcode: zipCode,
          country: "US",
        },
      };

      // Add location_id if available (for multi-origin shipping)
      if (locationId) {
        requestBody.location_id = locationId;
        console.log('🚚 Calculating shipping from location ID:', locationId);
      } else {
        console.log('⚠️ No location_id provided, will use default origin');
      }
      
      console.log('📦 Shipping Request:', {
        productId,
        quantity,
        zipCode,
        locationId,
        requestBody
      });

      const response = await fetch(
        "/api/shipping/calculate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify(requestBody),
          cache: "no-store",
        }
      );

      console.log('🌐 Shipping API Response Status:', response.status);
      console.log('🌐 Response OK:', response.ok);
      
      // Check if response is OK
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Shipping API HTTP Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: Unable to calculate shipping`);
      }

      // Get response text first to see what we're getting
      const responseText = await response.text();
      console.log('Shipping API Raw Response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError);
        console.error('Response was:', responseText);
        throw new Error('Invalid response from server');
      }
      
      console.log('Shipping API Parsed Data:', data);
      console.log('Data.success:', data.success);
      console.log('Data.rates:', data.rates);

      if (data.success && data.rates) {
        console.log('✓ Success! Setting rates:', data.rates.length);
        console.log('✓ Rates data:', data.rates);
        console.log('✓ Origin data received:', data.origin);
        
        if (data.rates.length === 0) {
          console.warn('⚠️ No shipping rates returned');
          setError("No shipping options available for this location");
          setLoading(false);
          return;
        }
        
        setRates(data.rates);
        setFreeShippingThreshold(data.free_shipping_threshold || 45);
        setAmountUntilFree(data.amount_until_free_shipping || 0);
        
        // Force origin location
        const origin = data.origin || { name: 'Blowing Rock', city: 'Blowing Rock', state: 'NC' };
        console.log('✓ Setting origin location:', origin);
        setOriginLocation(origin);
        setShowResults(true);
        
        // Save zip code
        localStorage.setItem("shipping_zip", zipCode);
      } else {
        console.error('❌ Shipping API error - no success or rates:', data);
        setError(data.error || "Unable to calculate shipping rates");
      }
    } catch (err: any) {
      console.error('❌ Shipping API exception:', err);
      setError(err.message || "Service temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      calculateShipping();
    }
  };

  return (
    <div className="border-t border-white/10 pt-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 bg-white/40" />
        <h3 className="text-xs uppercase tracking-[0.15em] text-white/80 font-medium">
          Delivery & Shipping
        </h3>
      </div>

      {/* ZIP Code Input */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={zipCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 5);
              setZipCode(value);
              setError("");
            }}
            onKeyPress={handleKeyPress}
            placeholder="Enter ZIP code"
            className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-base text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 focus:bg-white/10 active:bg-white/10 transition-colors"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            maxLength={5}
          />
          {zipCode && !validateZipCode(zipCode) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">
              5 digits
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={calculateShipping}
          disabled={loading || !validateZipCode(zipCode)}
          className="w-full sm:w-auto px-4 sm:px-6 py-2.5 bg-white text-black font-medium uppercase tracking-wider rounded-full hover:bg-white/90 active:bg-white/80 active:scale-[0.98] disabled:bg-white/20 disabled:text-white/40 disabled:cursor-not-allowed transition-all whitespace-nowrap"
          style={{ fontSize: '16px', WebkitTapHighlightColor: 'transparent' }}
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              <span className="hidden sm:inline">Calculating...</span>
              <span className="sm:hidden">Loading...</span>
            </div>
          ) : (
            "Get Rates"
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2"
        >
          {error}
        </div>
      )}

      {/* Shipping Options */}
      <div>
        {showResults && rates.length > 0 && (
          <div
            className="space-y-2 overflow-hidden"
          >
            {rates.map((rate, index) => (
              <div
                key={rate.method_id}
                className="bg-white/5 border border-white/10 rounded-[24px] p-4 hover:bg-white/[0.07] hover:border-white/20 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="px-2 py-1 bg-white/10 border border-white/20 rounded-full text-[10px] font-medium tracking-wider text-white/80 mt-0.5">
                      {getShippingSpeed(rate.method_id)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-white">
                          {rate.method_title.replace("USPS ", "")}
                        </span>
                        <span className="text-xs text-white/40">USPS</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-white/60">
                          Get it by{" "}
                          <span className="text-white font-medium">
                            {formatDeliveryDate(rate.delivery_date)}
                          </span>
                        </span>
                        {rate.delivery_days !== "1" && (
                          <span className="text-white/30">
                            ({rate.delivery_days} days)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-white">
                      ${rate.cost.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Free Shipping Message */}
      {showResults && amountUntilFree > 0 && productPrice > 0 && (
        <div
          className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 rounded p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-1 h-12 bg-emerald-400 rounded-full" />
            <div className="flex-1">
              <p className="text-xs text-emerald-300 uppercase tracking-wider mb-2">
                Add <span className="font-semibold">${amountUntilFree.toFixed(2)}</span> more for{" "}
                <span className="font-semibold">FREE SHIPPING</span>
              </p>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.min(((productPrice * quantity) / freeShippingThreshold) * 100, 100)}%` }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Free Shipping Eligible */}
      {showResults && amountUntilFree === 0 && (
        <div
          className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 rounded p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-1 h-12 bg-emerald-400 rounded-full" />
            <div>
              <p className="text-sm font-medium text-emerald-300 uppercase tracking-wider">
                Qualifies for FREE SHIPPING
              </p>
              <p className="text-xs text-emerald-400/60 mt-0.5">
                Your order meets the ${freeShippingThreshold} minimum
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Origin Info - Always show when results are displayed */}
      {showResults && (
        <div
          className="flex items-center gap-2 text-sm text-white/60 pt-4 border-t border-white/10 mt-4"
        >
          <div className="w-1 h-3 bg-white/30 rounded-full" />
          <span className="uppercase tracking-wider font-medium">
            Ships from {originLocation?.name || 'Blowing Rock'} ({originLocation?.city || 'Blowing Rock'}, {originLocation?.state || 'NC'})
          </span>
        </div>
      )}

      {/* Info Text */}
      {!showResults && (
        <p className="text-xs text-white/40 leading-relaxed">
          Enter your ZIP code to see available shipping options and estimated delivery dates.
          All orders include tracking.
        </p>
      )}
    </div>
  );
}

