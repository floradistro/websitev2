"use client";

import { useState, useEffect } from "react";
import { X } from "@/lib/icons";

interface EditTerminalModalProps {
  terminal: {
    id: string;
    registerName: string;
    registerNumber: string;
    deviceName: string | null;
    hardwareModel: string | null;
    allowCash: boolean;
    allowCard: boolean;
    paymentProcessorId: string | null;
  };
  locationId: string;
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

export function EditTerminalModal({ terminal, locationId, storeName, onClose, onSuccess }: EditTerminalModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingProcessors, setLoadingProcessors] = useState(true);
  const [processors, setProcessors] = useState<PaymentProcessor[]>([]);
  const [formData, setFormData] = useState({
    registerName: terminal.registerName,
    registerNumber: terminal.registerNumber,
    deviceName: terminal.deviceName || "",
    hardwareModel: terminal.hardwareModel || "",
    allowCash: terminal.allowCash,
    allowCard: terminal.allowCard,
    paymentProcessorId: terminal.paymentProcessorId || "",
  });

  // Load available payment processors
  useEffect(() => {
    const loadProcessors = async () => {
      try {
        const response = await fetch(`/api/vendor/payment-processors?location_id=${locationId}`);
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
  }, [locationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/vendor/terminals?id=${terminal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registerName: formData.registerName,
          registerNumber: formData.registerNumber,
          deviceName: formData.deviceName || null,
          hardwareModel: formData.hardwareModel || null,
          allowCash: formData.allowCash,
          allowCard: formData.allowCard,
          paymentProcessorId: formData.paymentProcessorId || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        alert(data.error || "Failed to update terminal");
      }
    } catch (error) {
      console.error("Error updating terminal:", error);
      alert("Failed to update terminal");
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
            <h2 className="text-xl font-bold text-white">Edit Terminal</h2>
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
              <select
                value={formData.paymentProcessorId}
                onChange={(e) => setFormData({ ...formData, paymentProcessorId: e.target.value })}
                className="w-full bg-white/[0.05] border border-white/[0.12] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30"
              >
                <option value="">None</option>
                {processors.map((processor) => (
                  <option key={processor.id} value={processor.id}>
                    {processor.processor_name} ({processor.processor_type})
                    {!processor.is_active && " - Inactive"}
                  </option>
                ))}
              </select>
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
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
