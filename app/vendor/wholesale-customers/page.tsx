"use client";

import { useState, useEffect } from 'react';
import { useVendorAuth } from '@/context/AppAuthContext';
import { Plus, Users, Mail, Phone, MapPin, Search, Edit2, Trash2, Check, X, DollarSign, CreditCard } from 'lucide-react';
import axios from 'axios';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface WholesaleCustomer {
  id: string;
  vendor_id: string;
  customer_vendor_id: string | null;
  external_company_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  billing_city: string | null;
  billing_state: string | null;
  billing_zip: string | null;
  pricing_tier: string;
  discount_percent: number;
  payment_terms: string | null;
  credit_limit: number | null;
  is_active: boolean;
  created_at: string;
  customer_vendor?: {
    business_name: string;
  };
}

export default function WholesaleCustomersPage() {
  const { vendor, isAuthenticated, isLoading: authLoading } = useVendorAuth();
  const [customers, setCustomers] = useState<WholesaleCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<WholesaleCustomer | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    external_company_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    billing_address_line1: '',
    billing_city: '',
    billing_state: '',
    billing_zip: '',
    billing_country: 'US',
    shipping_address_line1: '',
    shipping_city: '',
    shipping_state: '',
    shipping_zip: '',
    shipping_country: 'US',
    pricing_tier: 'wholesale',
    discount_percent: 0,
    payment_terms: 'Net 30',
    credit_limit: 0,
    tax_id: '',
    notes: ''
  });

  useEffect(() => {
    if (isAuthenticated && vendor) {
      loadCustomers();
    }
  }, [isAuthenticated, vendor]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/vendor/wholesale-customers?vendor_id=${vendor!.id}`);
      setCustomers(response.data.data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormData({
      external_company_name: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      billing_address_line1: '',
      billing_city: '',
      billing_state: '',
      billing_zip: '',
      billing_country: 'US',
      shipping_address_line1: '',
      shipping_city: '',
      shipping_state: '',
      shipping_zip: '',
      shipping_country: 'US',
      pricing_tier: 'wholesale',
      discount_percent: 0,
      payment_terms: 'Net 30',
      credit_limit: 0,
      tax_id: '',
      notes: ''
    });
    setShowModal(true);
  };

  const openEditModal = (customer: WholesaleCustomer) => {
    setEditingCustomer(customer);
    setFormData({
      external_company_name: customer.external_company_name || '',
      contact_name: customer.contact_name || '',
      contact_email: customer.contact_email || '',
      contact_phone: customer.contact_phone || '',
      billing_address_line1: '',
      billing_city: customer.billing_city || '',
      billing_state: customer.billing_state || '',
      billing_zip: customer.billing_zip || '',
      billing_country: 'US',
      shipping_address_line1: '',
      shipping_city: '',
      shipping_state: '',
      shipping_zip: '',
      shipping_country: 'US',
      pricing_tier: customer.pricing_tier || 'wholesale',
      discount_percent: customer.discount_percent || 0,
      payment_terms: customer.payment_terms || 'Net 30',
      credit_limit: customer.credit_limit || 0,
      tax_id: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      const action = editingCustomer ? 'update' : 'create';
      const payload = {
        action,
        vendor_id: vendor!.id,
        ...formData,
        ...(editingCustomer && { id: editingCustomer.id })
      };

      await axios.post('/api/vendor/wholesale-customers', payload);
      setShowModal(false);
      loadCustomers();
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Failed to save customer');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this customer?')) return;

    try {
      await axios.post('/api/vendor/wholesale-customers', {
        action: 'delete',
        vendor_id: vendor!.id,
        id
      });
      loadCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Failed to delete customer');
    }
  };

  const getTierVariant = (tier: string): 'success' | 'warning' | 'error' | 'neutral' => {
    switch (tier) {
      case 'wholesale': return 'neutral';
      case 'distributor': return 'warning';
      case 'vip': return 'success';
      default: return 'neutral';
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (tierFilter !== 'all' && c.pricing_tier !== tierFilter) return false;
    const searchLower = search.toLowerCase();
    const name = (c.external_company_name || c.customer_vendor?.business_name || '').toLowerCase();
    return name.includes(searchLower);
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
        title="Wholesale Customers"
        subtitle="Manage B2B customers and pricing tiers"
        action={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-white text-black px-4 py-3 text-xs uppercase tracking-wider hover:bg-white/90 transition-all"
          >
            <Plus size={16} />
            Add Customer
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 spacing-grid mb-8">
        <StatCard
          label="Total Customers"
          value={customers.length}
          sublabel="All Customers"
          icon={Users}
          loading={loading}
          delay="0s"
        />
        <StatCard
          label="Active"
          value={customers.filter(c => c.is_active).length}
          sublabel="Currently Active"
          icon={Check}
          loading={loading}
          delay="0.1s"
        />
        <StatCard
          label="Wholesale"
          value={customers.filter(c => c.pricing_tier === 'wholesale').length}
          sublabel="Standard Tier"
          icon={DollarSign}
          loading={loading}
          delay="0.2s"
        />
        <StatCard
          label="Distributor"
          value={customers.filter(c => c.pricing_tier === 'distributor').length}
          sublabel="Mid Tier"
          icon={DollarSign}
          loading={loading}
          delay="0.3s"
        />
        <StatCard
          label="VIP"
          value={customers.filter(c => c.pricing_tier === 'vip').length}
          sublabel="Premium Tier"
          icon={DollarSign}
          loading={loading}
          delay="0.4s"
        />
      </div>

      {/* Filters */}
      <Card className="mb-6" padding="sm">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black border border-white/10 text-white placeholder-white/40 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors text-sm"
            />
          </div>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-black border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:border-white/20 transition-colors"
          >
            <option value="all">All Tiers</option>
            <option value="wholesale">Wholesale</option>
            <option value="distributor">Distributor</option>
            <option value="vip">VIP</option>
          </select>
        </div>
      </Card>

      {/* Customers List */}
      {filteredCustomers.length === 0 ? (
        <Card className="text-center" padding="lg">
          <Users size={48} className="text-white/20 mx-auto mb-4" />
          <div className="text-white/60 mb-2">No wholesale customers found</div>
          <div className="text-white/40 text-sm mb-4">Add your first wholesale customer</div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg text-xs uppercase tracking-wider hover:bg-white/90 transition-all"
          >
            <Plus size={16} />
            Add Customer
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 spacing-grid">
          {filteredCustomers.map((customer) => (
            <Card
              key={customer.id}
              hover={true}
              className="group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-white font-medium text-lg mb-1">
                    {customer.external_company_name || customer.customer_vendor?.business_name || 'Unnamed'}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    {customer.is_active ? (
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
                    <Badge variant={getTierVariant(customer.pricing_tier)}>
                      {customer.pricing_tier}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign size={14} className="text-green-500" />
                    <span className="text-green-500 font-medium">{customer.discount_percent}% Discount</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(customer)}
                    className="p-2 hover:bg-white/5 border border-white/10 hover:border-white/20 rounded-md transition-all"
                  >
                    <Edit2 size={14} className="text-white/60" />
                  </button>
                  <button
                    onClick={() => handleDelete(customer.id)}
                    className="p-2 hover:bg-red-500/10 border border-white/10 hover:border-red-500 rounded-md transition-all"
                  >
                    <Trash2 size={14} className="text-red-500/60 hover:text-red-500" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {customer.contact_name && (
                  <div className="flex items-center gap-2 text-white/60">
                    <span className="text-white/40">Contact:</span>
                    {customer.contact_name}
                  </div>
                )}
                {customer.contact_email && (
                  <div className="flex items-center gap-2 text-white/60">
                    <Mail size={14} className="text-white/40" />
                    {customer.contact_email}
                  </div>
                )}
                {customer.contact_phone && (
                  <div className="flex items-center gap-2 text-white/60">
                    <Phone size={14} className="text-white/40" />
                    {customer.contact_phone}
                  </div>
                )}
                {(customer.billing_city && customer.billing_state) && (
                  <div className="flex items-center gap-2 text-white/60">
                    <MapPin size={14} className="text-white/40" />
                    {customer.billing_city}, {customer.billing_state}
                  </div>
                )}
                {customer.payment_terms && (
                  <div className="text-white/60">
                    <span className="text-white/40">Terms:</span> {customer.payment_terms}
                  </div>
                )}
                {customer.credit_limit && (
                  <div className="flex items-center gap-2 text-white/60">
                    <CreditCard size={14} className="text-white/40" />
                    Credit Limit: ${customer.credit_limit.toLocaleString()}
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
          <div className="minimal-glass subtle-glow border border-white/20 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl text-white/90 font-light tracking-tight">
                {editingCustomer ? 'Edit Customer' : 'Add Wholesale Customer'}
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 spacing-grid">
                <div>
                  <label className="block text-label mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.external_company_name}
                    onChange={(e) => setFormData({...formData, external_company_name: e.target.value})}
                    className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-label mb-2">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                    className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 spacing-grid">
                <div>
                  <label className="block text-label mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                    className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-label mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                    className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="border-t border-white/10 pt-4">
                <h4 className="text-label mb-3">Pricing & Terms</h4>
                <div className="grid grid-cols-4 spacing-grid">
                  <div>
                    <label className="block text-label mb-2">
                      Tier
                    </label>
                    <select
                      value={formData.pricing_tier}
                      onChange={(e) => setFormData({...formData, pricing_tier: e.target.value})}
                      className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors"
                    >
                      <option value="wholesale">Wholesale</option>
                      <option value="distributor">Distributor</option>
                      <option value="vip">VIP</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-label mb-2">
                      Discount %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount_percent}
                      onChange={(e) => setFormData({...formData, discount_percent: parseFloat(e.target.value) || 0})}
                      className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-label mb-2">
                      Payment Terms
                    </label>
                    <input
                      type="text"
                      value={formData.payment_terms}
                      onChange={(e) => setFormData({...formData, payment_terms: e.target.value})}
                      placeholder="Net 30"
                      className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-label mb-2">
                      Credit Limit ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.credit_limit}
                      onChange={(e) => setFormData({...formData, credit_limit: parseFloat(e.target.value) || 0})}
                      className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              <div className="border-t border-white/10 pt-4">
                <h4 className="text-label mb-3">Billing Address</h4>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Street address"
                    value={formData.billing_address_line1}
                    onChange={(e) => setFormData({...formData, billing_address_line1: e.target.value})}
                    className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors"
                  />

                  <div className="grid grid-cols-3 spacing-grid">
                    <input
                      type="text"
                      placeholder="City"
                      value={formData.billing_city}
                      onChange={(e) => setFormData({...formData, billing_city: e.target.value})}
                      className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={formData.billing_state}
                      onChange={(e) => setFormData({...formData, billing_state: e.target.value})}
                      className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="ZIP"
                      value={formData.billing_zip}
                      onChange={(e) => setFormData({...formData, billing_zip: e.target.value})}
                      className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors"
                    />
                  </div>
                </div>
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
                {editingCustomer ? 'Update' : 'Create'} Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
