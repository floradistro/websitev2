"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CartItem {
  productId: number;
  quantity: number;
  price: number;
}

interface ShippingRate {
  method_id: string;
  method_title: string;
  cost: number;
  currency: string;
  delivery_days: string;
  delivery_date: string;
}

interface CartShippingEstimatorProps {
  items: CartItem[];
  onShippingSelect?: (rate: ShippingRate) => void;
}

export default function CartShippingEstimator({ 
  items,
  onShippingSelect 
}: CartShippingEstimatorProps) {
  const [zipCode, setZipCode] = useState("");
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(75);
  const [amountUntilFree, setAmountUntilFree] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [autoCalculated, setAutoCalculated] = useState(false);

  // Load saved zip code and auto-calculate
  useEffect(() => {
    const saved = localStorage.getItem("shipping_zip");
    if (saved && items.length > 0) {
      setZipCode(saved);
      // Auto-calculate with saved zip
      setTimeout(() => {
        calculateShippingWithZip(saved);
      }, 500);
    }
  }, [items]);

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
      weekday: "long", 
      month: "long", 
      day: "numeric" 
    });
  };

  const validateZipCode = (zip: string) => {
    return /^\d{5}$/.test(zip);
  };

  const calculateShippingWithZip = async (zip: string) => {
    if (!validateZipCode(zip)) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const apiItems = items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity
      }));

      const response = await fetch(
        "/api/shipping/calculate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: apiItems,
            destination: {
              postcode: zip,
              country: "US",
            },
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setRates(data.rates);
        setFreeShippingThreshold(data.free_shipping_threshold);
        setAmountUntilFree(data.amount_until_free_shipping);
        setCartTotal(data.cart_total);
        setAutoCalculated(true);
        
        // Auto-select cheapest shipping by default
        if (data.rates.length > 0) {
          const cheapest = data.rates.reduce((prev: ShippingRate, current: ShippingRate) => 
            current.cost < prev.cost ? current : prev
          );
          setSelectedRate(cheapest);
          if (onShippingSelect) {
            onShippingSelect(cheapest);
          }
        }
        
        localStorage.setItem("shipping_zip", zip);
      } else {
        setError(data.error || "Unable to calculate shipping");
      }
    } catch (err) {
      setError("Service temporarily unavailable");
    } finally {
      setLoading(false);
    }
  };

  const calculateShipping = () => {
    calculateShippingWithZip(zipCode);
  };

  const handleRateSelect = (rate: ShippingRate) => {
    setSelectedRate(rate);
    if (onShippingSelect) {
      onShippingSelect(rate);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      calculateShipping();
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="border border-white/10 bg-black/20 rounded-sm p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-white/40" />
          <h3 className="text-xs uppercase tracking-[0.15em] text-white font-medium">
            Shipping Options
          </h3>
        </div>
        {autoCalculated && zipCode && (
          <button
            onClick={() => {
              setZipCode("");
              setRates([]);
              setSelectedRate(null);
              setAutoCalculated(false);
            }}
            className="text-xs uppercase tracking-wider text-white/40 hover:text-white/60 transition-colors"
          >
            Change ZIP
          </button>
        )}
      </div>

      {/* ZIP Code Input - Only show if not auto-calculated */}
      {!autoCalculated && (
        <div className="flex gap-2">
          <input
            type="text"
            value={zipCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 5);
              setZipCode(value);
              setError("");
            }}
            onKeyPress={handleKeyPress}
            placeholder="Enter ZIP code"
            className="flex-1 bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
            maxLength={5}
          />
          <button
            onClick={calculateShipping}
            disabled={loading || !validateZipCode(zipCode)}
            className="px-6 py-3 bg-white text-black text-xs font-medium uppercase tracking-wider rounded-sm hover:bg-white/90 disabled:bg-white/20 disabled:text-white/40 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "..." : "Calculate"}
          </button>
        </div>
      )}

      {/* Current ZIP Display */}
      {autoCalculated && zipCode && (
        <div className="flex items-center gap-2 text-xs text-white/60">
          <div className="w-1 h-3 bg-white/30" />
          <span className="uppercase tracking-wider">Delivering to {zipCode}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-sm px-3 py-2">
          {error}
        </div>
      )}

      {/* Shipping Rates */}
      <AnimatePresence>
        {rates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {rates.map((rate, index) => (
              <motion.button
                key={rate.method_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleRateSelect(rate)}
                className={`w-full text-left border rounded-sm p-4 transition-all group ${
                  selectedRate?.method_id === rate.method_id
                    ? "border-white/40 bg-white/10"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Radio Button */}
                    <div className={`w-4 h-4 rounded-full border transition-all ${
                      selectedRate?.method_id === rate.method_id
                        ? "border-white bg-white"
                        : "border-white/30"
                    }`}>
                      {selectedRate?.method_id === rate.method_id && (
                        <div className="w-2 h-2 rounded-full bg-black m-1" />
                      )}
                    </div>
                    
                    <div>
                      <div className="text-sm text-white font-medium mb-0.5">
                        {rate.method_title.replace("USPS ", "")}
                      </div>
                      <div className="text-xs text-white/60">
                        Arrives {formatDeliveryDate(rate.delivery_date)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm font-medium text-white">
                    ${rate.cost.toFixed(2)}
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Free Shipping Progress */}
      {rates.length > 0 && amountUntilFree > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-white/10 pt-4 mt-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-white/50">
              Free Shipping Progress
            </span>
            <span className="text-xs text-white/60">
              ${amountUntilFree.toFixed(2)} away
            </span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ 
                width: `${Math.min((cartTotal / freeShippingThreshold) * 100, 100)}%` 
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
            />
          </div>
        </motion.div>
      )}

      {/* Free Shipping Achieved */}
      {rates.length > 0 && amountUntilFree === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="border-t border-emerald-500/20 pt-4 mt-4"
        >
          <div className="flex items-center gap-2 text-emerald-400">
            <div className="w-1 h-4 bg-emerald-400 rounded-full" />
            <span className="text-xs font-medium uppercase tracking-wider">
              Free Shipping Available
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

