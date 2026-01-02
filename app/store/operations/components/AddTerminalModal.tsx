"use client";

import { useState, useEffect } from "react";
import { X } from "@/lib/icons";

interface AddTerminalModalProps {
  storeId: string;
  storeName: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface PaymentProcessor {
  id: string;
  processor_name: string;
  processor_type: string;
  is_active: boolean;
}

export function AddTerminalModal({ storeId, storeName, onClose, onSuccess }: AddTerminalModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingProcessors, setLoadingProcessors] = useState(true);
  const [processors, setProcessors] = useState<PaymentProcessor[]>([]);
  const [formData, setFormData] = useState({
    registerName: "",
    registerNumber: "",
    deviceName: "",
    hardwareModel: "",
    allowCash: true,
    allowCard: true,
    paymentProcessorId: "",
    // Processor config fields
    createNewProcessor: false,
    processorType: "dejavoo" as "dejavoo" | "stripe" | "square" | "authorizenet" | "clover",
    processorName: "",
    dejavooAuthkey: "",
    dejavooTpn: "",
    dejavooMerchantId: "",
    dejavooStoreNumber: "",
  });

  // Load available payment processors for this location
  useEffect(() => {
    const loadProcessors = async () => {
      try {
        const response = await fetch(`/api/vendor/payment-processors?location_id=${storeId}`);
        const data = await response.json();
        if (data.processors) {
          setProcessors(data.processors);
        }
      } catch (error) {
        console.error("Error loading processors:", error);
      } finally {
        setLoadingProcessors(false);
      }
    };
    loadProcessors();
  }, [storeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let processorId = formData.paymentProcessorId;

      // Create processor first if needed
      if (formData.createNewProcessor) {
        const processorResponse = await fetch("/api/vendor/payment-processors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            location_id: storeId,
            processor_type: formData.processorType,
            processor_name: formData.processorName || `${formData.processorType} - ${formData.registerName}`,
            environment: "production",
            is_active: true,
            dejavoo_authkey: formData.dejavooAuthkey,
            dejavoo_tpn: formData.dejavooTpn,
            dejavoo_merchant_id: formData.dejavooMerchantId,
            dejavoo_store_number: formData.dejavooStoreNumber,
          }),
        });

        const processorData = await processorResponse.json();
        if (!processorData.processor) {
          alert(processorData.error || "Failed to create payment processor");
          setLoading(false);
          return;
        }
        processorId = processorData.processor.id;
      }

      // Create terminal
      const response = await fetch("/api/vendor/terminals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationId: storeId,
          registerName: formData.registerName,
          registerNumber: formData.registerNumber,
          deviceName: formData.deviceName,
          hardwareModel: formData.hardwareModel,
          allowCash: formData.allowCash,
          allowCard: formData.allowCard,
          paymentProcessorId: processorId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        alert(data.error || "Failed to add terminal");
      }
    } catch (error) {
      console.error("Error adding terminal:", error);
      alert("Failed to add terminal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0a0a0a] border border-white/[0.12] rounded-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Add Terminal</h2>
            <p className="text-sm text-white/60 mt-1">{storeName}</p>
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
          <div>
            <label className="block text-sm text-white/70 mb-2">Register Name *</label>
            <input
              type="text"
              required
              value={formData.registerName}
              onChange={(e) => setFormData({ ...formData, registerName: e.target.value })}
              placeholder="e.g., Front Counter"
              className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2">Register Number *</label>
            <input
              type="text"
              required
              value={formData.registerNumber}
              onChange={(e) => setFormData({ ...formData, registerNumber: e.target.value })}
              placeholder="e.g., REG-001"
              className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2">Device Name</label>
            <input
              type="text"
              value={formData.deviceName}
              onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
              placeholder="e.g., iPad Pro"
              className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label className="block text-sm text-white/70 mb-2">Hardware Model</label>
            <input
              type="text"
              value={formData.hardwareModel}
              onChange={(e) => setFormData({ ...formData, hardwareModel: e.target.value })}
              placeholder="e.g., A2377"
              className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Payment Processor */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Payment Processor</label>
            {!loadingProcessors && (
              <div className="space-y-3">
                <select
                  value={formData.createNewProcessor ? "new" : formData.paymentProcessorId}
                  onChange={(e) => {
                    if (e.target.value === "new") {
                      setFormData({ ...formData, createNewProcessor: true, paymentProcessorId: "" });
                    } else {
                      setFormData({ ...formData, createNewProcessor: false, paymentProcessorId: e.target.value });
                    }
                  }}
                  className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30"
                >
                  <option value="">None</option>
                  {processors.map((processor) => (
                    <option key={processor.id} value={processor.id}>
                      {processor.processor_name} ({processor.processor_type})
                      {!processor.is_active && " - Inactive"}
                    </option>
                  ))}
                  <option value="new">+ Create New Processor</option>
                </select>

                {/* New Processor Configuration */}
                {formData.createNewProcessor && (
                  <div className="p-4 bg-white/[0.03] rounded-lg border border-white/[0.08] space-y-3">
                    <p className="text-sm font-medium text-white/70">New Processor Configuration</p>

                    <select
                      value={formData.processorType}
                      onChange={(e) => setFormData({ ...formData, processorType: e.target.value as any })}
                      className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30"
                    >
                      <option value="dejavoo">Dejavoo</option>
                      <option value="stripe">Stripe</option>
                      <option value="square">Square</option>
                      <option value="authorizenet">Authorize.Net</option>
                      <option value="clover">Clover</option>
                    </select>

                    <input
                      type="text"
                      value={formData.processorName}
                      onChange={(e) => setFormData({ ...formData, processorName: e.target.value })}
                      placeholder="Processor name (optional)"
                      className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
                    />

                    {formData.processorType === "dejavoo" && (
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
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment Options */}
          <div className="space-y-2">
            <p className="text-sm text-white/70">Payment Methods</p>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.allowCash}
                onChange={(e) => setFormData({ ...formData, allowCash: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-white/70">Accept Cash</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.allowCard}
                onChange={(e) => setFormData({ ...formData, allowCard: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm text-white/70">Accept Card</span>
            </label>
          </div>

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
              {loading ? "Adding..." : "Add Terminal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
