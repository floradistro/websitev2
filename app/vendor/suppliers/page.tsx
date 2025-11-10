"use client";

import { useState, useEffect } from "react";
import { useVendorAuth } from "@/context/AppAuthContext";
import {
  Plus,
  Building2,
  Mail,
  Phone,
  MapPin,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
} from "lucide-react";
import axios from "axios";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Supplier {
  id: string;
  vendor_id: string;
  supplier_vendor_id: string | null;
  external_name: string | null;
  external_company: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  payment_terms: string | null;
  is_active: boolean;
  created_at: string;
  supplier_vendor?: {
    store_name: string;
  };
}

export default function SuppliersPage() {
  const { vendor, isAuthenticated, isLoading: authLoading } = useVendorAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    external_name: "",
    external_company: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
    payment_terms: "",
    notes: "",
  });

  useEffect(() => {
    if (isAuthenticated && vendor) {
      loadSuppliers();
    }
  }, [isAuthenticated, vendor]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/vendor/suppliers?vendor_id=${vendor!.id}`,
      );
      setSuppliers(response.data.data || []);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error loading suppliers:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingSupplier(null);
    setFormData({
      external_name: "",
      external_company: "",
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      zip: "",
      country: "US",
      payment_terms: "",
      notes: "",
    });
    setShowModal(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      external_name: supplier.external_name || "",
      external_company: supplier.external_company || "",
      contact_name: supplier.contact_name || "",
      contact_email: supplier.contact_email || "",
      contact_phone: supplier.contact_phone || "",
      address_line1: supplier.address_line1 || "",
      address_line2: "",
      city: supplier.city || "",
      state: supplier.state || "",
      zip: supplier.zip || "",
      country: "US",
      payment_terms: supplier.payment_terms || "",
      notes: "",
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      const action = editingSupplier ? "update" : "create";
      const payload = {
        action,
        vendor_id: vendor!.id,
        ...formData,
        ...(editingSupplier && { id: editingSupplier.id }),
      };

      await axios.post("/api/vendor/suppliers", payload);
      setShowModal(false);
      loadSuppliers();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error saving supplier:", error);
      }
      alert("Failed to save supplier");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this supplier?")) return;

    try {
      await axios.post("/api/vendor/suppliers", {
        action: "delete",
        vendor_id: vendor!.id,
        id,
      });
      loadSuppliers();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error deleting supplier:", error);
      }
      alert("Failed to delete supplier");
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    const searchLower = search.toLowerCase();
    const name = (
      s.external_name ||
      s.supplier_vendor?.store_name ||
      ""
    ).toLowerCase();
    const company = (s.external_company || "").toLowerCase();
    return name.includes(searchLower) || company.includes(searchLower);
  });

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white/40">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 lg:px-0">
      {/* Header */}
      <PageHeader
        title="Suppliers"
        subtitle="Manage suppliers for purchasing inventory"
        action={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-white text-black px-4 py-3 text-xs uppercase tracking-wider hover:bg-white/90 transition-all"
          >
            <Plus size={16} />
            Add Supplier
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 spacing-grid mb-8">
        <StatCard
          label="Total Suppliers"
          value={suppliers.length}
          sublabel="All Suppliers"
          icon={Building2}
          loading={loading}
          delay="0s"
        />
        <StatCard
          label="Active"
          value={suppliers.filter((s) => s.is_active).length}
          sublabel="Currently Active"
          icon={Check}
          loading={loading}
          delay="0.1s"
        />
        <StatCard
          label="Inactive"
          value={suppliers.filter((s) => !s.is_active).length}
          sublabel="Deactivated"
          icon={X}
          loading={loading}
          delay="0.2s"
        />
        <StatCard
          label="External"
          value={suppliers.filter((s) => !s.supplier_vendor_id).length}
          sublabel="Non-B2B"
          icon={Building2}
          loading={loading}
          delay="0.3s"
        />
      </div>

      {/* Search */}
      <Card className="mb-6" padding="sm">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black border border-white/10 text-white placeholder-white/40 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors text-sm"
          />
        </div>
      </Card>

      {/* Suppliers List */}
      {filteredSuppliers.length === 0 ? (
        <Card className="text-center" padding="lg">
          <Building2 size={48} className="text-white/20 mx-auto mb-4" />
          <div className="text-white/60 mb-2">No suppliers found</div>
          <div className="text-white/40 text-sm mb-4">
            Add your first supplier to start purchasing
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg text-xs uppercase tracking-wider hover:bg-white/90 transition-all"
          >
            <Plus size={16} />
            Add Supplier
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 spacing-grid">
          {filteredSuppliers.map((supplier) => (
            <Card key={supplier.id} hover={true} className="group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-white font-medium text-lg mb-1">
                    {supplier.external_name ||
                      supplier.supplier_vendor?.store_name ||
                      "Unnamed"}
                  </h3>
                  {supplier.external_company && (
                    <p className="text-white/60 text-sm mb-2">
                      {supplier.external_company}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    {supplier.is_active ? (
                      <Badge variant="success">
                        <Check size={10} className="inline mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="error">
                        <X size={10} className="inline mr-1" />
                        Inactive
                      </Badge>
                    )}
                    {supplier.supplier_vendor_id && (
                      <Badge variant="neutral">B2B Vendor</Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(supplier)}
                    className="p-2 hover:bg-white/5 border border-white/10 hover:border-white/20 rounded-md transition-all"
                  >
                    <Edit2 size={14} className="text-white/60" />
                  </button>
                  <button
                    onClick={() => handleDelete(supplier.id)}
                    className="p-2 hover:bg-red-500/10 border border-white/10 hover:border-red-500 rounded-md transition-all"
                  >
                    <Trash2
                      size={14}
                      className="text-red-500/60 hover:text-red-500"
                    />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {supplier.contact_name && (
                  <div className="flex items-center gap-2 text-white/60">
                    <span className="text-white/40">Contact:</span>
                    {supplier.contact_name}
                  </div>
                )}
                {supplier.contact_email && (
                  <div className="flex items-center gap-2 text-white/60">
                    <Mail size={14} className="text-white/40" />
                    {supplier.contact_email}
                  </div>
                )}
                {supplier.contact_phone && (
                  <div className="flex items-center gap-2 text-white/60">
                    <Phone size={14} className="text-white/40" />
                    {supplier.contact_phone}
                  </div>
                )}
                {supplier.city && supplier.state && (
                  <div className="flex items-center gap-2 text-white/60">
                    <MapPin size={14} className="text-white/40" />
                    {supplier.city}, {supplier.state}
                  </div>
                )}
                {supplier.payment_terms && (
                  <div className="text-white/60">
                    <span className="text-white/40">Terms:</span>{" "}
                    {supplier.payment_terms}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="minimal-glass subtle-glow border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl text-white/90 font-light tracking-tight">
                {editingSupplier ? "Edit Supplier" : "Add Supplier"}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-label mb-2">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    value={formData.external_name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        external_name: e.target.value,
                      })
                    }
                    className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-label mb-2">Company Name</label>
                  <input
                    type="text"
                    value={formData.external_company}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        external_company: e.target.value,
                      })
                    }
                    className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-label mb-2">Contact Name</label>
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={(e) =>
                      setFormData({ ...formData, contact_name: e.target.value })
                    }
                    className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-label mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_email: e.target.value,
                      })
                    }
                    className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-label mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_phone: e.target.value,
                      })
                    }
                    className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-label mb-2">Address</label>
                <input
                  type="text"
                  value={formData.address_line1}
                  onChange={(e) =>
                    setFormData({ ...formData, address_line1: e.target.value })
                  }
                  className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors"
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-label mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-label mb-2">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-label mb-2">ZIP</label>
                  <input
                    type="text"
                    value={formData.zip}
                    onChange={(e) =>
                      setFormData({ ...formData, zip: e.target.value })
                    }
                    className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-label mb-2">Payment Terms</label>
                <input
                  type="text"
                  value={formData.payment_terms}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_terms: e.target.value })
                  }
                  placeholder="e.g., Net 30, Net 60"
                  className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 rounded-lg text-xs uppercase tracking-wider text-white hover:bg-white/5 transition-all border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-3 rounded-lg text-xs uppercase tracking-wider bg-white text-black hover:bg-white/90 transition-all"
              >
                {editingSupplier ? "Update" : "Create"} Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
