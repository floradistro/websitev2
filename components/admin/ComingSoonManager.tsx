"use client";

import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Calendar, Save, AlertCircle } from "lucide-react";

import { logger } from "@/lib/logger";
interface ComingSoonManagerProps {
  vendorId: string;
  vendorName: string;
}

export function ComingSoonManager({ vendorId, vendorName }: ComingSoonManagerProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [comingSoon, setComingSoon] = useState(false);
  const [message, setMessage] = useState("We're launching soon! Stay tuned for something amazing.");
  const [launchDate, setLaunchDate] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, [vendorId]);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/admin/vendor/${vendorId}/coming-soon`);
      const data = await res.json();

      if (data.success) {
        setComingSoon(data.data.coming_soon || false);
        setMessage(
          data.data.coming_soon_message ||
            "We're launching soon! Stay tuned for something amazing.",
        );
        setLaunchDate(
          data.data.launch_date ? new Date(data.data.launch_date).toISOString().slice(0, 16) : "",
        );
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Failed to fetch coming soon status:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);

    try {
      const res = await fetch(`/api/admin/vendor/${vendorId}/coming-soon`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coming_soon: comingSoon,
          coming_soon_message: message,
          launch_date: launchDate || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Failed to save coming soon settings:", error);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/5 rounded-2xl w-1/3"></div>
          <div className="h-20 bg-white/5 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3
            className="text-2xl font-black uppercase tracking-tight text-white mb-2"
            style={{ fontWeight: 900 }}
          >
            Coming Soon Mode
          </h3>
          <p className="text-white/60 leading-relaxed">
            Show a coming soon page instead of the storefront
          </p>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={() => setComingSoon(!comingSoon)}
          className={`relative inline-flex h-14 w-28 items-center rounded-2xl transition-all duration-300 ${
            comingSoon ? "bg-white" : "bg-white/5 border border-white/10"
          }`}
        >
          <span
            className={`inline-block h-12 w-12 transform rounded-2xl transition-all duration-300 flex items-center justify-center ${
              comingSoon ? "translate-x-14 bg-black" : "translate-x-1 bg-white"
            }`}
          >
            {comingSoon ? (
              <Eye size={20} className="text-white" />
            ) : (
              <EyeOff size={20} className="text-black" />
            )}
          </span>
        </button>
      </div>

      {/* Status Alert */}
      {comingSoon && (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="bg-white rounded-2xl p-3">
              <AlertCircle size={24} className="text-black" />
            </div>
            <div className="flex-1">
              <p
                className="text-white font-black uppercase tracking-tight mb-2"
                style={{ fontWeight: 900 }}
              >
                Coming Soon Mode Active
              </p>
              <p className="text-white/60 leading-relaxed">
                Customers will see a coming soon page instead of your storefront. Preview mode still
                works for you.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Settings */}
      <div className="space-y-6">
        {/* Message */}
        <div>
          <label className="block text-white/40 text-xs font-black uppercase tracking-[0.15em] mb-3">
            Coming Soon Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full bg-black border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-white/40 focus:outline-none focus:border-white/10 transition-colors resize-none leading-relaxed"
            placeholder="We're launching soon! Stay tuned for something amazing."
          />
        </div>

        {/* Launch Date */}
        <div>
          <label className="block text-white/40 text-xs font-black uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
            <Calendar size={14} />
            Launch Date (Optional)
          </label>
          <input
            type="datetime-local"
            value={launchDate}
            onChange={(e) => setLaunchDate(e.target.value)}
            className="w-full bg-black border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-white/10 transition-colors"
          />
          <p className="text-white/40 text-sm mt-3">Show a countdown timer to this date</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-white hover:bg-white/90 text-black px-8 py-4 rounded-2xl font-black uppercase tracking-tight transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            style={{ fontWeight: 900 }}
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {comingSoon && (
            <a
              href={`/storefront?vendor=${vendorName.toLowerCase().replace(/\s+/g, "-")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#0a0a0a] border border-white/10 hover:border-white/20 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-tight transition-all duration-300 hover:scale-[1.02] flex items-center gap-3"
              style={{ fontWeight: 900 }}
            >
              <Eye size={18} />
              Preview
            </a>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div
            className="bg-white text-black rounded-2xl p-4 text-center font-black uppercase tracking-tight"
            style={{ fontWeight: 900 }}
          >
            ✓ Settings Saved Successfully
          </div>
        )}
      </div>
    </div>
  );
}
