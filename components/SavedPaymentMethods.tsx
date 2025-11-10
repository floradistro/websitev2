"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { CreditCard, Plus, X, Check } from "lucide-react";
import axios from "axios";
import { showNotification } from "@/components/NotificationToast";

import { logger } from "@/lib/logger";
interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  brand: string;
  exp_month: string;
  exp_year: string;
  is_default: boolean;
}

export default function SavedPaymentMethods() {
  const { user } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    name: "",
  });

  useEffect(() => {
    if (user) {
      loadPaymentMethods();
    }
  }, [user]);

  const loadPaymentMethods = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Use proxy to avoid CORS
      const response = await axios.get(`/api/customers/${user.id}`);

      const customerData = response.data;
      const methodsMeta = customerData.meta_data?.find((m: any) => m.key === "payment_methods");

      if (methodsMeta && methodsMeta.value) {
        try {
          const parsed =
            typeof methodsMeta.value === "string"
              ? JSON.parse(methodsMeta.value)
              : methodsMeta.value;
          setMethods(Array.isArray(parsed) ? parsed : []);
        } catch {
          setMethods([]);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error loading payment methods:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      // Create payment profile via Authorize.net (tokenize card)
      const tokenizeResponse = await fetch("/api/authorize-tokenize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardNumber: newCard.cardNumber.replace(/\s/g, ""),
          expMonth: newCard.expiry.split("/")[0],
          expYear: "20" + newCard.expiry.split("/")[1],
          cvv: newCard.cvv,
          customerEmail: user.email,
          customerName: newCard.name,
        }),
      });

      const tokenData = await tokenizeResponse.json();

      if (!tokenData.success) {
        showNotification({
          type: "error",
          title: "Card Save Failed",
          message: tokenData.error || "Failed to save card",
        });
        return;
      }

      // Save tokenized card to customer metadata
      const newMethod: PaymentMethod = {
        id: tokenData.paymentProfileId || Date.now().toString(),
        type: "card",
        last4: newCard.cardNumber.slice(-4),
        brand: detectCardBrand(newCard.cardNumber),
        exp_month: newCard.expiry.split("/")[0],
        exp_year: "20" + newCard.expiry.split("/")[1],
        is_default: methods.length === 0,
      };

      const updatedMethods = [...methods, newMethod];

      // Use proxy to avoid CORS
      await axios.put(`/api/customers/${user.id}`, {
        meta_data: [
          {
            key: "payment_methods",
            value: JSON.stringify(updatedMethods),
          },
        ],
      });

      setMethods(updatedMethods);
      setShowAddCard(false);
      setNewCard({ cardNumber: "", expiry: "", cvv: "", name: "" });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error saving payment method:", error);
      }
      showNotification({
        type: "error",
        title: "Payment Error",
        message: "Failed to save payment method. Please try again.",
      });
    }
  };

  const handleRemoveCard = async (methodId: string) => {
    if (!user) return;

    try {
      const updatedMethods = methods.filter((m) => m.id !== methodId);

      // Use proxy to avoid CORS
      await axios.put(`/api/customers/${user.id}`, {
        meta_data: [
          {
            key: "payment_methods",
            value: JSON.stringify(updatedMethods),
          },
        ],
      });

      setMethods(updatedMethods);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error removing payment method:", error);
      }
      showNotification({
        type: "error",
        title: "Removal Error",
        message: "Failed to remove payment method. Please try again.",
      });
    }
  };

  const detectCardBrand = (cardNumber: string): string => {
    const num = cardNumber.replace(/\s/g, "");
    if (/^4/.test(num)) return "Visa";
    if (/^5[1-5]/.test(num)) return "Mastercard";
    if (/^3[47]/.test(num)) return "Amex";
    if (/^6(?:011|5)/.test(num)) return "Discover";
    return "Card";
  };

  if (loading) {
    return (
      <div className="bg-[#2a2a2a] border border-white/10 p-6">
        <p className="text-white/40 text-xs">Loading payment methods...</p>
      </div>
    );
  }

  return (
    <div className="bg-[#2a2a2a] border border-white/10">
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <h2 className="text-sm uppercase tracking-[0.2em] text-white font-medium">
          Payment Methods
        </h2>
        <button
          onClick={() => setShowAddCard(!showAddCard)}
          className="text-[10px] uppercase tracking-[0.2em] text-white/60 hover:text-white transition-smooth flex items-center gap-2"
        >
          <Plus size={14} />
          Add Card
        </button>
      </div>

      <div className="p-6 space-y-4">
        {/* Add New Card Form */}
        {showAddCard && (
          <form
            onSubmit={handleAddCard}
            className="bg-[#3a3a3a] border border-white/10 p-6 space-y-4"
          >
            <h3 className="text-xs uppercase tracking-[0.2em] text-white/80 mb-4">Add New Card</h3>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-white/60 mb-2 font-medium">
                Cardholder Name
              </label>
              <input
                type="text"
                value={newCard.name}
                onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                className="w-full px-4 py-3 text-sm bg-black/20 border border-white/10 text-white focus:border-white/30 focus:outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-white/60 mb-2 font-medium">
                Card Number
              </label>
              <input
                type="text"
                value={newCard.cardNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\s/g, "");
                  const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
                  setNewCard({ ...newCard, cardNumber: formatted });
                }}
                maxLength={19}
                className="w-full px-4 py-3 text-sm bg-black/20 border border-white/10 text-white focus:border-white/30 focus:outline-none transition-all"
                placeholder="1234 5678 9012 3456"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-white/60 mb-2 font-medium">
                  Expiry (MM/YY)
                </label>
                <input
                  type="text"
                  value={newCard.expiry}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, "");
                    if (value.length >= 2) {
                      value = value.slice(0, 2) + "/" + value.slice(2, 4);
                    }
                    setNewCard({ ...newCard, expiry: value });
                  }}
                  maxLength={5}
                  className="w-full px-4 py-3 text-sm bg-black/20 border border-white/10 text-white focus:border-white/30 focus:outline-none transition-all"
                  placeholder="12/25"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-white/60 mb-2 font-medium">
                  CVV
                </label>
                <input
                  type="text"
                  value={newCard.cvv}
                  onChange={(e) =>
                    setNewCard({
                      ...newCard,
                      cvv: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  maxLength={4}
                  className="w-full px-4 py-3 text-sm bg-black/20 border border-white/10 text-white focus:border-white/30 focus:outline-none transition-all"
                  placeholder="123"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="interactive-button bg-white text-black px-6 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-white/90 transition-all font-medium flex items-center gap-2"
              >
                <Check size={12} />
                Save Card
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddCard(false);
                  setNewCard({ cardNumber: "", expiry: "", cvv: "", name: "" });
                }}
                className="interactive-button bg-black/40 border border-white/10 text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-white/5 transition-all font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Saved Cards List */}
        {methods.length === 0 && !showAddCard ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
              <CreditCard size={24} className="text-white/20" />
            </div>
            <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-4">No saved cards</p>
            <button
              onClick={() => setShowAddCard(true)}
              className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-white/90 transition-all font-medium"
            >
              <Plus size={12} />
              Add Your First Card
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {methods.map((method) => (
              <div
                key={method.id}
                className="bg-[#3a3a3a] border border-white/10 p-5 flex items-center justify-between hover:border-white/20 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <CreditCard size={18} className="text-white/60" />
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium mb-1">
                      {method.brand} •••• {method.last4}
                    </p>
                    <p className="text-[10px] text-white/40">
                      Expires {method.exp_month}/{method.exp_year}
                    </p>
                  </div>
                  {method.is_default && (
                    <span className="text-[9px] uppercase tracking-[0.2em] bg-green-500/20 text-green-400 px-2 py-1 border border-green-500/30">
                      Default
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveCard(method.id)}
                  className="interactive-button w-8 h-8 flex items-center justify-center bg-black/40 border border-white/10 text-white hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 transition-all"
                  title="Remove card"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
