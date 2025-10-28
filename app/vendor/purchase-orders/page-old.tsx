"use client";

import { useState, useEffect } from 'react';
import { useVendorAuth } from '@/context/AppAuthContext';
import { Plus, Package, Truck, CheckCircle, ArrowDown, ArrowUp, Search, DollarSign, Calendar, Building2, Users } from 'lucide-react';
import axios from 'axios';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface PurchaseOrder {
  id: string;
  po_number: string;
  po_type: 'inbound' | 'outbound';
  status: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  expected_delivery_date: string | null;
  created_at: string;
  supplier?: {
    external_name: string;
  };
  wholesale_customer?: {
    external_company_name: string;
  };
  items?: POItem[];
}

interface POItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  product?: {
    name: string;
    sku: string;
  };
}

interface Supplier {
  id: string;
  external_name: string;
  external_company: string;
}

interface Customer {
  id: string;
  external_company_name: string;
  discount_percent: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
}

export default function PurchaseOrdersPage() {
  const { vendor, isAuthenticated, isLoading: authLoading } = useVendorAuth();
  const [activeTab, setActiveTab] = useState<'inbound' | 'outbound'>('inbound');
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create PO state
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Map<string, { quantity: number; price: number }>>(new Map());

  useEffect(() => {
    if (isAuthenticated && vendor) {
      loadData();
    }
  }, [isAuthenticated, vendor, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [posRes, suppliersRes, customersRes, productsRes] = await Promise.all([
        axios.get(`/api/vendor/purchase-orders?vendor_id=${vendor!.id}&po_type=${activeTab}`),
        axios.get(`/api/vendor/suppliers?vendor_id=${vendor!.id}`),
        axios.get(`/api/vendor/wholesale-customers?vendor_id=${vendor!.id}`),
        axios.get(`/api/vendor/products`, { headers: { 'x-vendor-id': vendor!.id } })
      ]);

      setPurchaseOrders(posRes.data.data || []);
      setSuppliers(suppliersRes.data.data || []);
      setCustomers(customersRes.data.data || []);

      const publishedProducts = (productsRes.data.products || [])
        .filter((p: any) => p.status === 'published')
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku || '',
          price: parseFloat(p.regular_price || p.price || 0)
        }));
      setProducts(publishedProducts);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setSelectedProducts(new Map());
    setSelectedSupplier('');
    setSelectedCustomer('');
    setExpectedDelivery('');
    setShowCreateModal(true);
  };

  const toggleProduct = (product: Product) => {
    const newSelected = new Map(selectedProducts);
    if (newSelected.has(product.id)) {
      newSelected.delete(product.id);
    } else {
      newSelected.set(product.id, {
        quantity: 1,
        price: activeTab === 'inbound' ? product.price * 0.5 : product.price
      });
    }
    setSelectedProducts(newSelected);
  };

  const updateProductQuantity = (productId: string, quantity: number) => {
    const newSelected = new Map(selectedProducts);
    const existing = newSelected.get(productId);
    if (existing) {
      newSelected.set(productId, { ...existing, quantity });
    }
    setSelectedProducts(newSelected);
  };

  const updateProductPrice = (productId: string, price: number) => {
    const newSelected = new Map(selectedProducts);
    const existing = newSelected.get(productId);
    if (existing) {
      newSelected.set(productId, { ...existing, price });
    }
    setSelectedProducts(newSelected);
  };

  const calculateTotal = () => {
    let subtotal = 0;
    selectedProducts.forEach((item) => {
      subtotal += item.quantity * item.price;
    });

    // Apply customer discount if outbound
    if (activeTab === 'outbound' && selectedCustomer) {
      const customer = customers.find(c => c.id === selectedCustomer);
      if (customer) {
        subtotal = subtotal * (1 - customer.discount_percent / 100);
      }
    }

    const tax = subtotal * 0.08;
    const shipping = 25;
    const total = subtotal + tax + shipping;

    return { subtotal, tax, shipping, total };
  };

  const handleCreatePO = async () => {
    if (activeTab === 'inbound' && !selectedSupplier) {
      alert('Please select a supplier');
      return;
    }
    if (activeTab === 'outbound' && !selectedCustomer) {
      alert('Please select a customer');
      return;
    }
    if (selectedProducts.size === 0) {
      alert('Please select at least one product');
      return;
    }

    try {
      const items = Array.from(selectedProducts.entries()).map(([productId, data]) => ({
        product_id: productId,
        quantity: data.quantity,
        unit_price: data.price
      }));

      const { subtotal, tax, shipping, total } = calculateTotal();

      const payload = {
        action: 'create',
        vendor_id: vendor!.id,
        po_type: activeTab,
        ...(activeTab === 'inbound' && { supplier_id: selectedSupplier }),
        ...(activeTab === 'outbound' && { wholesale_customer_id: selectedCustomer }),
        items,
        subtotal,
        tax,
        shipping_cost: shipping,
        total,
        expected_delivery_date: expectedDelivery || null,
        payment_terms: 'Net 30',
        internal_notes: `${activeTab === 'inbound' ? 'Inbound' : 'Outbound'} PO created from web interface`
      };

      await axios.post('/api/vendor/purchase-orders', payload);
      setShowCreateModal(false);
      loadData();
    } catch (error) {
      console.error('Error creating PO:', error);
      alert('Failed to create purchase order');
    }
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'neutral' => {
    switch (status) {
      case 'draft': return 'neutral';
      case 'sent': return 'warning';
      case 'confirmed': return 'warning';
      case 'in_transit': return 'warning';
      case 'received': return 'success';
      case 'fulfilled': return 'success';
      case 'shipped': return 'warning';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'neutral';
    }
  };

  const filteredPOs = purchaseOrders.filter(po => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return po.po_number.toLowerCase().includes(searchLower);
  });

  const stats = {
    total: purchaseOrders.length,
    draft: purchaseOrders.filter(p => p.status === 'draft').length,
    inProgress: purchaseOrders.filter(p => ['sent', 'confirmed', 'in_transit'].includes(p.status)).length,
    completed: purchaseOrders.filter(p => ['received', 'fulfilled', 'delivered'].includes(p.status)).length,
    totalValue: purchaseOrders.reduce((sum, p) => sum + parseFloat(p.total?.toString() || '0'), 0)
  };

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
        title="Purchase Orders"
        subtitle={activeTab === 'inbound' ? 'Manage inbound orders from suppliers' : 'Manage outbound orders to wholesale customers'}
        action={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-white text-black px-4 py-3 text-xs uppercase tracking-wider hover:bg-white/90 transition-all"
          >
            <Plus size={16} />
            New {activeTab === 'inbound' ? 'Inbound' : 'Outbound'} PO
          </button>
        }
      />

      {/* Tabs */}
      <Card className="mb-6" padding="none">
        <div className="flex gap-2 border-b border-white/10">
          <button
            onClick={() => setActiveTab('inbound')}
            className={`px-6 py-3 text-sm uppercase tracking-wider transition-all ${
              activeTab === 'inbound'
                ? 'text-white border-b-2 border-white'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <ArrowDown size={16} />
              Inbound (Buying)
            </div>
          </button>
          <button
            onClick={() => setActiveTab('outbound')}
            className={`px-6 py-3 text-sm uppercase tracking-wider transition-all ${
              activeTab === 'outbound'
                ? 'text-white border-b-2 border-white'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <ArrowUp size={16} />
              Outbound (Selling)
            </div>
          </button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 spacing-grid mb-8">
        <StatCard
          label="Total Orders"
          value={stats.total}
          sublabel="All Purchase Orders"
          icon={Package}
          loading={loading}
          delay="0s"
        />
        <StatCard
          label="Draft"
          value={stats.draft}
          sublabel="Not Sent"
          icon={Package}
          loading={loading}
          delay="0.1s"
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          sublabel="Active Orders"
          icon={Truck}
          loading={loading}
          delay="0.2s"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          sublabel="Finished"
          icon={CheckCircle}
          loading={loading}
          delay="0.3s"
        />
        <StatCard
          label="Total Value"
          value={`$${stats.totalValue.toFixed(2)}`}
          sublabel="Order Value"
          icon={DollarSign}
          loading={loading}
          delay="0.4s"
        />
      </div>

      {/* Search */}
      <Card className="mb-6" padding="sm">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="Search PO number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black border border-white/10 text-white placeholder-white/40 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors text-sm"
          />
        </div>
      </Card>

      {/* PO List */}
      {filteredPOs.length === 0 ? (
        <Card className="text-center" padding="lg">
          <Package size={48} className="text-white/20 mx-auto mb-4" />
          <div className="text-white/60 mb-2">No {activeTab} purchase orders found</div>
          <div className="text-white/40 text-sm mb-4">
            Create your first {activeTab} PO to {activeTab === 'inbound' ? 'restock inventory' : 'fulfill wholesale orders'}
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg text-xs uppercase tracking-wider hover:bg-white/90 transition-all"
          >
            <Plus size={16} />
            Create {activeTab === 'inbound' ? 'Inbound' : 'Outbound'} PO
          </button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPOs.map((po) => (
            <Card
              key={po.id}
              hover={true}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white font-medium text-lg">{po.po_number}</h3>
                    <Badge variant={getStatusVariant(po.status)}>
                      {po.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-white/60 mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(po.created_at).toLocaleDateString()}
                    </span>
                    {activeTab === 'inbound' && po.supplier && (
                      <span className="flex items-center gap-1">
                        <Building2 size={12} />
                        {po.supplier.external_name}
                      </span>
                    )}
                    {activeTab === 'outbound' && po.wholesale_customer && (
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {po.wholesale_customer.external_company_name}
                      </span>
                    )}
                  </div>

                  {po.items && po.items.length > 0 && (
                    <div className="text-sm text-white/60">
                      {po.items.length} item{po.items.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-2xl text-white font-light">
                    ${parseFloat(po.total?.toString() || '0').toFixed(2)}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create PO Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="minimal-glass subtle-glow border border-white/20 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl text-white/90 font-light tracking-tight">
                Create {activeTab === 'inbound' ? 'Inbound' : 'Outbound'} Purchase Order
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Supplier/Customer Selection */}
              <div className="grid grid-cols-2 spacing-grid">
                {activeTab === 'inbound' ? (
                  <div>
                    <label className="block text-label mb-2">
                      Select Supplier *
                    </label>
                    <select
                      value={selectedSupplier}
                      onChange={(e) => setSelectedSupplier(e.target.value)}
                      className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors"
                      required
                    >
                      <option value="">Select supplier...</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.external_name || s.external_company}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-label mb-2">
                      Select Customer *
                    </label>
                    <select
                      value={selectedCustomer}
                      onChange={(e) => setSelectedCustomer(e.target.value)}
                      className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors"
                      required
                    >
                      <option value="">Select customer...</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.external_company_name} ({c.discount_percent}% discount)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-label mb-2">
                    Expected {activeTab === 'inbound' ? 'Delivery' : 'Ship'} Date
                  </label>
                  <input
                    type="date"
                    value={expectedDelivery}
                    onChange={(e) => setExpectedDelivery(e.target.value)}
                    className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
              </div>

              {/* Product Selection */}
              <div className="border-t border-white/10 pt-4">
                <h4 className="text-label mb-3">
                  Select Products ({selectedProducts.size} selected)
                </h4>

                <div className="max-h-96 overflow-y-auto border border-white/10 bg-black/98">
                  {products.map(product => {
                    const isSelected = selectedProducts.has(product.id);
                    const selection = selectedProducts.get(product.id);

                    return (
                      <div
                        key={product.id}
                        className={`border-b border-white/5 p-4 hover:bg-white/5 transition-colors ${
                          isSelected ? 'bg-white/5' : ''
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleProduct(product)}
                            className="w-4 h-4"
                          />

                          <div className="flex-1">
                            <div className="text-white text-sm">{product.name}</div>
                            <div className="text-white/40 text-xs">SKU: {product.sku}</div>
                          </div>

                          {isSelected && selection && (
                            <div className="flex items-center gap-3">
                              <div>
                                <label className="text-white/40 text-xs block mb-1">Qty</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={selection.quantity}
                                  onChange={(e) => updateProductQuantity(product.id, parseInt(e.target.value) || 1)}
                                  className="w-24 bg-black border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-white/20"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <div>
                                <label className="text-white/40 text-xs block mb-1">Price ($)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={selection.price}
                                  onChange={(e) => updateProductPrice(product.id, parseFloat(e.target.value) || 0)}
                                  className="w-24 bg-black border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-white/20"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <div className="text-right">
                                <div className="text-white/40 text-xs mb-1">Subtotal</div>
                                <div className="text-white text-sm font-medium">
                                  ${(selection.quantity * selection.price).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totals */}
              {selectedProducts.size > 0 && (
                <div className="bg-white/5 border border-white/10 p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-white/60">
                      <span>Subtotal:</span>
                      <span>${calculateTotal().subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>Tax (8%):</span>
                      <span>${calculateTotal().tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-white/60">
                      <span>Shipping:</span>
                      <span>${calculateTotal().shipping.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-white text-lg font-light border-t border-white/10 pt-2 mt-2">
                      <span>Total:</span>
                      <span>${calculateTotal().total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 rounded-lg text-xs uppercase tracking-wider text-white hover:bg-white/5 transition-all border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePO}
                className="px-6 py-3 rounded-lg text-xs uppercase tracking-wider bg-white text-black hover:bg-white/90 transition-all"
              >
                Create Purchase Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
