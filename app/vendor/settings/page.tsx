"use client";

import { useState, useEffect } from "react";
import { Save, Building2, MapPin, Users, Map, Eye, EyeOff } from "lucide-react";
import { useAppAuth } from "@/context/AppAuthContext";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

export default function SettingsPage() {
  const { vendor } = useAppAuth();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    taxId: "",
    siteHidden: false,
  });

  useEffect(() => {
    if (vendor?.id) {
      loadSettings();
    }
  }, [vendor?.id]);

  async function loadSettings() {
    if (!vendor?.id) return;

    try {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("id", vendor.id)
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          companyName: data.store_name || "",
          contactName: data.contact_name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          zip: data.zip || "",
          taxId: data.tax_id || "",
          siteHidden: data.site_hidden || false,
        });
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error loading settings:", err);
      }
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!vendor?.id) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from("vendors")
        .update({
          store_name: settings.companyName,
          contact_name: settings.contactName,
          email: settings.email,
          phone: settings.phone,
          address: settings.address,
          city: settings.city,
          state: settings.state,
          zip: settings.zip,
          tax_id: settings.taxId,
          site_hidden: settings.siteHidden,
        })
        .eq("id", vendor.id);

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error saving settings:", err);
      }
      alert(err.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  }

  // Always render the page structure - even while loading vendor data
  return (
    <div className="w-full min-h-screen p-8">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-white/70 text-2xl tracking-tight mb-1 font-light">
          Settings
        </h1>
        <p className="text-white/25 text-[11px] uppercase tracking-[0.2em] font-light">
          Business Configuration
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        <Link
          href="/vendor/locations"
          className="group bg-[#0a0a0a] border border-white/[0.04] hover:border-white/[0.08] rounded-3xl p-6 transition-all duration-400"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <Map size={18} className="text-white/40" strokeWidth={1.5} />
            </div>
            <div className="text-white/80 text-sm font-light">Locations</div>
          </div>
          <p className="text-white/40 text-[11px] font-light">
            Manage store locations & addresses
          </p>
        </Link>

        <Link
          href="/vendor/employees"
          className="group bg-[#0a0a0a] border border-white/[0.04] hover:border-white/[0.08] rounded-3xl p-6 transition-all duration-400"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <Users size={18} className="text-white/40" strokeWidth={1.5} />
            </div>
            <div className="text-white/80 text-sm font-light">Team</div>
          </div>
          <p className="text-white/40 text-[11px] font-light">
            Employee management & permissions
          </p>
        </Link>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-8">
        {/* Company Information */}
        <div className="bg-[#0a0a0a] border border-white/[0.04] rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Building2 size={18} className="text-white/40" strokeWidth={1.5} />
            <h2 className="text-white/70 text-sm font-light uppercase tracking-[0.15em]">
              Company Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-light">
                Company Name
              </label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) =>
                  setSettings({ ...settings, companyName: e.target.value })
                }
                className="w-full bg-white/[0.04] border border-white/[0.06] focus:border-white/[0.12] rounded-xl px-4 py-3 text-white/80 text-sm font-light transition-all focus:outline-none"
                placeholder="Your Company LLC"
              />
            </div>

            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-light">
                Contact Name
              </label>
              <input
                type="text"
                value={settings.contactName}
                onChange={(e) =>
                  setSettings({ ...settings, contactName: e.target.value })
                }
                className="w-full bg-white/[0.04] border border-white/[0.06] focus:border-white/[0.12] rounded-xl px-4 py-3 text-white/80 text-sm font-light transition-all focus:outline-none"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-light">
                Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) =>
                  setSettings({ ...settings, email: e.target.value })
                }
                className="w-full bg-white/[0.04] border border-white/[0.06] focus:border-white/[0.12] rounded-xl px-4 py-3 text-white/80 text-sm font-light transition-all focus:outline-none"
                placeholder="contact@company.com"
              />
            </div>

            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-light">
                Phone
              </label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) =>
                  setSettings({ ...settings, phone: e.target.value })
                }
                className="w-full bg-white/[0.04] border border-white/[0.06] focus:border-white/[0.12] rounded-xl px-4 py-3 text-white/80 text-sm font-light transition-all focus:outline-none"
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-light">
                Tax ID / EIN
              </label>
              <input
                type="text"
                value={settings.taxId}
                onChange={(e) =>
                  setSettings({ ...settings, taxId: e.target.value })
                }
                className="w-full bg-white/[0.04] border border-white/[0.06] focus:border-white/[0.12] rounded-xl px-4 py-3 text-white/80 text-sm font-light transition-all focus:outline-none"
                placeholder="XX-XXXXXXX"
              />
            </div>
          </div>
        </div>

        {/* Business Address */}
        <div className="bg-[#0a0a0a] border border-white/[0.04] rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <MapPin size={18} className="text-white/40" strokeWidth={1.5} />
            <h2 className="text-white/70 text-sm font-light uppercase tracking-[0.15em]">
              Business Address
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-light">
                Street Address
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) =>
                  setSettings({ ...settings, address: e.target.value })
                }
                className="w-full bg-white/[0.04] border border-white/[0.06] focus:border-white/[0.12] rounded-xl px-4 py-3 text-white/80 text-sm font-light transition-all focus:outline-none"
                placeholder="123 Main St"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-light">
                  City
                </label>
                <input
                  type="text"
                  value={settings.city}
                  onChange={(e) =>
                    setSettings({ ...settings, city: e.target.value })
                  }
                  className="w-full bg-white/[0.04] border border-white/[0.06] focus:border-white/[0.12] rounded-xl px-4 py-3 text-white/80 text-sm font-light transition-all focus:outline-none"
                  placeholder="Charlotte"
                />
              </div>

              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-light">
                  State
                </label>
                <input
                  type="text"
                  value={settings.state}
                  onChange={(e) =>
                    setSettings({ ...settings, state: e.target.value })
                  }
                  className="w-full bg-white/[0.04] border border-white/[0.06] focus:border-white/[0.12] rounded-xl px-4 py-3 text-white/80 text-sm font-light transition-all focus:outline-none"
                  placeholder="NC"
                />
              </div>

              <div>
                <label className="block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-light">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={settings.zip}
                  onChange={(e) =>
                    setSettings({ ...settings, zip: e.target.value })
                  }
                  className="w-full bg-white/[0.04] border border-white/[0.06] focus:border-white/[0.12] rounded-xl px-4 py-3 text-white/80 text-sm font-light transition-all focus:outline-none"
                  placeholder="28202"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Storefront Visibility */}
        <div className="bg-[#0a0a0a] border border-white/[0.04] rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            {settings.siteHidden ? (
              <EyeOff size={18} className="text-white/40" strokeWidth={1.5} />
            ) : (
              <Eye size={18} className="text-white/40" strokeWidth={1.5} />
            )}
            <h2 className="text-white/70 text-sm font-light uppercase tracking-[0.15em]">
              Storefront Visibility
            </h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-white/70 text-sm font-light mb-1">
                Hide Storefront
              </div>
              <p className="text-white/40 text-[11px] font-light">
                Show a coming soon page instead of your products
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setSettings({ ...settings, siteHidden: !settings.siteHidden })
              }
              className={`relative w-14 h-8 rounded-full transition-all ${
                settings.siteHidden ? "bg-white/[0.12]" : "bg-white/[0.06]"
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white/60 transition-all ${
                  settings.siteHidden ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="group flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.12] px-8 py-4 rounded-2xl transition-all active:scale-[0.96] disabled:opacity-50"
          >
            <Save
              size={16}
              className="text-white/60 group-hover:text-white/80 transition-colors"
              strokeWidth={1.5}
            />
            <span className="text-white/60 group-hover:text-white/80 text-[10px] uppercase tracking-[0.2em] font-light transition-colors">
              {loading ? "Saving..." : "Save Changes"}
            </span>
          </button>

          {saved && (
            <div className="text-green-400/60 text-[11px] font-light">
              Settings saved successfully
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
