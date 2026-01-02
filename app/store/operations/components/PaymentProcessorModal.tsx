"use client";

import { useState } from "react";
import { X, CreditCard } from "@/lib/icons";

interface PaymentProcessorModalProps {
  locationId: string;
  locationName: string;
  existingProcessor?: {
    id: string;
    processor_type: string;
    processor_name: string;
    is_active: boolean;
    environment: string;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

type ProcessorType = "dejavoo" | "stripe" | "square" | "authorizenet" | "clover";

export function PaymentProcessorModal({
  locationId,
  locationName,
  existingProcessor,
  onClose,
  onSuccess,
}: PaymentProcessorModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processorType, setProcessorType] = useState<ProcessorType>(
    (existingProcessor?.processor_type as ProcessorType) || "dejavoo"
  );
  const [formData, setFormData] = useState({
    processorName: existingProcessor?.processor_name || "",
    environment: existingProcessor?.environment || "production",
    isActive: existingProcessor?.is_active ?? true,
    // Dejavoo
    dejavooAuthkey: "",
    dejavooTpn: "",
    dejavooMerchantId: "",
    dejavooStoreNumber: "",
    // Stripe
    stripePublishableKey: "",
    stripeSecretKey: "",
    // Square
    squareApplicationId: "",
    squareAccessToken: "",
    squareLocationId: "",
    // Authorize.net
    authorizenetApiLoginId: "",
    authorizenetTransactionKey: "",
    // Clover
    cloverMerchantId: "",
    cloverApiToken: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: any = {
        action: existingProcessor ? "update" : "create",
        location_id: locationId,
        processor_type: processorType,
        processor_name: formData.processorName,
        environment: formData.environment,
        is_active: formData.isActive,
      };

      if (existingProcessor) {
        payload.id = existingProcessor.id;
      }

      // Add processor-specific fields
      if (processorType === "dejavoo") {
        payload.dejavoo_authkey = formData.dejavooAuthkey;
        payload.dejavoo_tpn = formData.dejavooTpn;
        payload.dejavoo_merchant_id = formData.dejavooMerchantId;
        payload.dejavoo_store_number = formData.dejavooStoreNumber;
      } else if (processorType === "stripe") {
        payload.stripe_publishable_key = formData.stripePublishableKey;
        payload.stripe_secret_key = formData.stripeSecretKey;
      } else if (processorType === "square") {
        payload.square_application_id = formData.squareApplicationId;
        payload.square_access_token = formData.squareAccessToken;
        payload.square_location_id = formData.squareLocationId;
      } else if (processorType === "authorizenet") {
        payload.authorizenet_api_login_id = formData.authorizenetApiLoginId;
        payload.authorizenet_transaction_key = formData.authorizenetTransactionKey;
      } else if (processorType === "clover") {
        payload.clover_merchant_id = formData.cloverMerchantId;
        payload.clover_api_token = formData.cloverApiToken;
      }

      const response = await fetch("/api/vendor/payment-processors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.processor) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || "Failed to configure payment processor");
      }
    } catch (err) {
      console.error("Error configuring payment processor:", err);
      setError("Failed to configure payment processor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#0a0a0a] border border-white/[0.12] rounded-xl max-w-2xl w-full p-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <CreditCard className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {existingProcessor ? "Edit" : "Add"} Payment Processor
              </h2>
              <p className="text-sm text-white/60 mt-1">{locationName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Processor Type */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Processor Type *</label>
            <select
              value={processorType}
              onChange={(e) => setProcessorType(e.target.value as ProcessorType)}
              disabled={!!existingProcessor}
              className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 disabled:opacity-50"
            >
              <option value="dejavoo">Dejavoo</option>
              <option value="stripe">Stripe</option>
              <option value="square">Square</option>
              <option value="authorizenet">Authorize.Net</option>
              <option value="clover">Clover</option>
            </select>
          </div>

          {/* Processor Name */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Processor Name *</label>
            <input
              type="text"
              required
              value={formData.processorName}
              onChange={(e) => setFormData({ ...formData, processorName: e.target.value })}
              placeholder={`e.g., ${processorType} - ${locationName}`}
              className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Environment */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Environment *</label>
            <select
              value={formData.environment}
              onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
              className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30"
            >
              <option value="production">Production</option>
              <option value="sandbox">Sandbox / Testing</option>
            </select>
          </div>

          {/* Processor-Specific Fields */}
          <div className="p-4 bg-white/[0.03] rounded-lg border border-white/[0.08] space-y-4">
            <p className="text-sm font-medium text-white/70">Credentials</p>

            {processorType === "dejavoo" && (
              <>
                <input
                  type="text"
                  value={formData.dejavooAuthkey}
                  onChange={(e) => setFormData({ ...formData, dejavooAuthkey: e.target.value })}
                  placeholder="Auth Key"
                  className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                />
                <input
                  type="text"
                  value={formData.dejavooTpn}
                  onChange={(e) => setFormData({ ...formData, dejavooTpn: e.target.value })}
                  placeholder="TPN"
                  className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                />
                <input
                  type="text"
                  value={formData.dejavooMerchantId}
                  onChange={(e) => setFormData({ ...formData, dejavooMerchantId: e.target.value })}
                  placeholder="Merchant ID"
                  className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                />
                <input
                  type="text"
                  value={formData.dejavooStoreNumber}
                  onChange={(e) => setFormData({ ...formData, dejavooStoreNumber: e.target.value })}
                  placeholder="Store Number"
                  className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                />
              </>
            )}

            {processorType === "stripe" && (
              <>
                <input
                  type="text"
                  value={formData.stripePublishableKey}
                  onChange={(e) => setFormData({ ...formData, stripePublishableKey: e.target.value })}
                  placeholder="Publishable Key (pk_...)"
                  className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                />
                <input
                  type="password"
                  value={formData.stripeSecretKey}
                  onChange={(e) => setFormData({ ...formData, stripeSecretKey: e.target.value })}
                  placeholder="Secret Key (sk_...)"
                  className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                />
              </>
            )}

            {processorType === "square" && (
              <>
                <input
                  type="text"
                  value={formData.squareApplicationId}
                  onChange={(e) => setFormData({ ...formData, squareApplicationId: e.target.value })}
                  placeholder="Application ID"
                  className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                />
                <input
                  type="password"
                  value={formData.squareAccessToken}
                  onChange={(e) => setFormData({ ...formData, squareAccessToken: e.target.value })}
                  placeholder="Access Token"
                  className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                />
                <input
                  type="text"
                  value={formData.squareLocationId}
                  onChange={(e) => setFormData({ ...formData, squareLocationId: e.target.value })}
                  placeholder="Location ID"
                  className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                />
              </>
            )}

            {processorType === "authorizenet" && (
              <>
                <input
                  type="text"
                  value={formData.authorizenetApiLoginId}
                  onChange={(e) => setFormData({ ...formData, authorizenetApiLoginId: e.target.value })}
                  placeholder="API Login ID"
                  className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                />
                <input
                  type="password"
                  value={formData.authorizenetTransactionKey}
                  onChange={(e) => setFormData({ ...formData, authorizenetTransactionKey: e.target.value })}
                  placeholder="Transaction Key"
                  className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                />
              </>
            )}

            {processorType === "clover" && (
              <>
                <input
                  type="text"
                  value={formData.cloverMerchantId}
                  onChange={(e) => setFormData({ ...formData, cloverMerchantId: e.target.value })}
                  placeholder="Merchant ID"
                  className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                />
                <input
                  type="password"
                  value={formData.cloverApiToken}
                  onChange={(e) => setFormData({ ...formData, cloverApiToken: e.target.value })}
                  placeholder="API Token"
                  className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                />
              </>
            )}
          </div>

          {/* Active Status */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm text-white/70">Active (allow payments through this processor)</span>
          </label>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/[0.05] border border-white/[0.12] rounded-lg text-white/70 hover:bg-white/[0.08] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : existingProcessor ? "Update Processor" : "Add Processor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
