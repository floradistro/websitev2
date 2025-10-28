"use client";

import { useState, useEffect, useMemo } from 'react';
import { useVendorAuth } from '@/context/AppAuthContext';
import {
  Plus, Package, Truck, CheckCircle, ArrowDown, ArrowUp, Search, DollarSign,
  Calendar, Building2, Users, Filter, X, AlertTriangle, TrendingUp, Clock,
  Copy, Star, Grid, List, ChevronDown
} from 'lucide-react';
import axios from 'axios';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// ... interfaces stay the same ...
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
  pricing_tier: string;
  discount_percent: number;
  credit_limit: number | null;
  payment_terms: string | null;
  is_active: boolean;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  category?: string;
  stock_quantity?: number;
}

interface NewProduct {
  tempId: string; // Temporary ID for tracking
  name: string;
  sku: string;
  supplier_sku?: string;
  category: string;
  unit_cost: number;
  brand?: string;
}

export default function PurchaseOrdersPageEnhanced() {
  const { vendor, isAuthenticated, isLoading: authLoading } = useVendorAuth();
  const [activeTab, setActiveTab] = useState<'inbound' | 'outbound'>('outbound');
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Enhanced filtering state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState<'customer' | 'products' | 'review'>('customer');

  // Create PO state
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Map<string, { quantity: number; price: number }>>(new Map());

  // Product selection enhancements
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // New product workflow (for inbound POs)
  const [newProducts, setNewProducts] = useState<NewProduct[]>([]);
  const [showNewProductForm, setShowNewProductForm] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    sku: '',
    supplier_sku: '',
    category: '',
    unit_cost: '',
    brand: ''
  });

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
          price: parseFloat(p.regular_price || p.price || 0),
          category: p.category || 'Uncategorized',
          stock_quantity: 0 // TODO: fetch from inventory API
        }));
      setProducts(publishedProducts);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtered POs
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter(po => {
      // Status filter
      if (statusFilter !== 'all' && po.status !== statusFilter) return false;

      // Date range filter
      if (dateFrom && new Date(po.created_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(po.created_at) > new Date(dateTo)) return false;

      // Customer filter
      if (customerFilter && activeTab === 'outbound') {
        const customerName = po.wholesale_customer?.external_company_name?.toLowerCase() || '';
        if (!customerName.includes(customerFilter.toLowerCase())) return false;
      }

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const poNumber = po.po_number?.toLowerCase() || '';
        const partner = activeTab === 'inbound'
          ? po.supplier?.external_name?.toLowerCase() || ''
          : po.wholesale_customer?.external_company_name?.toLowerCase() || '';
        return poNumber.includes(searchLower) || partner.includes(searchLower);
      }

      return true;
    });
  }, [purchaseOrders, statusFilter, dateFrom, dateTo, customerFilter, search, activeTab]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Search filter
    if (productSearch) {
      const searchLower = productSearch.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        p.sku.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    // Sorting
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'price') return b.price - a.price;
      if (sortBy === 'stock') return (b.stock_quantity || 0) - (a.stock_quantity || 0);
      return 0;
    });

    return filtered;
  }, [products, productSearch, categoryFilter, sortBy]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category || 'Uncategorized'));
    return Array.from(cats);
  }, [products]);

  // Get status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: purchaseOrders.length,
      draft: 0,
      sent: 0,
      confirmed: 0,
      received: 0,
      fulfilled: 0,
      shipped: 0
    };
    purchaseOrders.forEach(po => {
      if (counts[po.status] !== undefined) {
        counts[po.status]++;
      }
    });
    return counts;
  }, [purchaseOrders]);

  const selectedCustomerData = useMemo(() => {
    return customers.find(c => c.id === selectedCustomer);
  }, [selectedCustomer, customers]);

  const openCreateModal = () => {
    setSelectedProducts(new Map());
    setSelectedSupplier('');
    setSelectedCustomer('');
    setExpectedDelivery('');
    setCreateStep('customer');
    setProductSearch('');
    setCategoryFilter('all');
    setNewProducts([]);
    setShowNewProductForm(false);
    setShowCreateModal(true);
  };

  // New product handlers
  const handleAddNewProduct = () => {
    if (!newProductForm.name || !newProductForm.unit_cost) {
      alert('Product name and unit cost are required');
      return;
    }

    const newProduct: NewProduct = {
      tempId: `new-${Date.now()}`,
      name: newProductForm.name,
      sku: newProductForm.sku || `AUTO-${Date.now()}`,
      supplier_sku: newProductForm.supplier_sku,
      category: newProductForm.category || 'Uncategorized',
      unit_cost: parseFloat(newProductForm.unit_cost),
      brand: newProductForm.brand
    };

    setNewProducts([...newProducts, newProduct]);

    // Add to selected products
    const newSelected = new Map(selectedProducts);
    newSelected.set(newProduct.tempId, {
      quantity: 1,
      price: newProduct.unit_cost
    });
    setSelectedProducts(newSelected);

    // Reset form
    setNewProductForm({
      name: '',
      sku: '',
      supplier_sku: '',
      category: '',
      unit_cost: '',
      brand: ''
    });
    setShowNewProductForm(false);
  };

  const removeNewProduct = (tempId: string) => {
    setNewProducts(newProducts.filter(p => p.tempId !== tempId));
    const newSelected = new Map(selectedProducts);
    newSelected.delete(tempId);
    setSelectedProducts(newSelected);
  };

  const toggleProduct = (product: Product) => {
    const newSelected = new Map(selectedProducts);
    if (newSelected.has(product.id)) {
      newSelected.delete(product.id);
    } else {
      let price = product.price;
      // Apply customer discount for outbound
      if (activeTab === 'outbound' && selectedCustomerData) {
        price = price * (1 - selectedCustomerData.discount_percent / 100);
      } else if (activeTab === 'inbound') {
        price = product.price * 0.5; // Default wholesale cost
      }
      newSelected.set(product.id, {
        quantity: 1,
        price
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

    const tax = subtotal * 0.08;
    const shipping = 25;
    const total = subtotal + tax + shipping;
    return { subtotal, tax, shipping, total };
  };

  const handleSubmit = async () => {
    try {
      // Separate existing products from new products
      const items = Array.from(selectedProducts.entries()).map(([productIdOrTempId, item]) => {
        // Check if this is a new product
        const newProduct = newProducts.find(np => np.tempId === productIdOrTempId);

        if (newProduct) {
          // New product - send product data
          return {
            product_id: null, // No existing product_id
            is_new_product: true,
            product_name: newProduct.name,
            sku: newProduct.sku,
            supplier_sku: newProduct.supplier_sku,
            category: newProduct.category,
            brand: newProduct.brand,
            quantity: item.quantity,
            unit_price: item.price
          };
        } else {
          // Existing product
          return {
            product_id: productIdOrTempId,
            is_new_product: false,
            quantity: item.quantity,
            unit_price: item.price
          };
        }
      });

      await axios.post('/api/vendor/purchase-orders', {
        action: 'create',
        vendor_id: vendor!.id,
        po_type: activeTab,
        supplier_id: activeTab === 'inbound' ? selectedSupplier : undefined,
        wholesale_customer_id: activeTab === 'outbound' ? selectedCustomer : undefined,
        expected_delivery_date: expectedDelivery || null,
        items
      });

      setShowCreateModal(false);
      loadData();
      alert(`Purchase order created successfully with ${newProducts.length} new product(s)!`);
    } catch (error) {
      console.error('Error creating PO:', error);
      alert('Failed to create purchase order: ' + (error as any).response?.data?.error || (error as any).message);
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen bg-black p-6"><div className="text-white">Loading...</div></div>;
  }

  if (!isAuthenticated || !vendor) {
    return <div className="min-h-screen bg-black p-6"><div className="text-white">Please log in</div></div>;
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <PageHeader
        title="Purchase Orders"
        subtitle="Manage inbound and outbound purchase orders"
        action={
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg text-xs uppercase tracking-wider hover:bg-white/90 transition-all"
          >
            <Plus size={16} />
            Create PO
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('inbound')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg text-xs uppercase tracking-wider transition-all ${
            activeTab === 'inbound'
              ? 'bg-white text-black'
              : 'bg-white/5 text-white hover:bg-white/10'
          }`}
        >
          <ArrowDown size={14} />
          Inbound
        </button>
        <button
          onClick={() => setActiveTab('outbound')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg text-xs uppercase tracking-wider transition-all ${
            activeTab === 'outbound'
              ? 'bg-white text-black'
              : 'bg-white/5 text-white hover:bg-white/10'
          }`}
        >
          <ArrowUp size={14} />
          Outbound
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 spacing-grid mb-6">
        <StatCard
          label="Total"
          value={statusCounts.all}
          sublabel="All Orders"
          icon={Package}
          loading={loading}
        />
        <StatCard
          label="Draft"
          value={statusCounts.draft}
          sublabel="Pending"
          icon={Clock}
          loading={loading}
          delay="0.1s"
        />
        <StatCard
          label="Active"
          value={statusCounts.sent + statusCounts.confirmed}
          sublabel="In Progress"
          icon={Truck}
          loading={loading}
          delay="0.2s"
        />
        <StatCard
          label="Completed"
          value={statusCounts.fulfilled + statusCounts.received}
          sublabel="Finished"
          icon={CheckCircle}
          loading={loading}
          delay="0.3s"
        />
        <StatCard
          label="Revenue"
          value={`$${filteredPOs.reduce((sum, po) => sum + po.total, 0).toFixed(0)}`}
          sublabel="Total Value"
          icon={DollarSign}
          loading={loading}
          delay="0.4s"
        />
      </div>

      {/* Enhanced Filters */}
      <Card className="mb-6" padding="sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search PO number, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black border border-white/10 text-white placeholder-white/40 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors text-sm"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors text-sm"
          >
            <option value="all">All Status ({statusCounts.all})</option>
            <option value="draft">Draft ({statusCounts.draft})</option>
            <option value="sent">Sent</option>
            <option value="confirmed">Confirmed</option>
            <option value="received">Received ({statusCounts.received})</option>
            <option value="fulfilled">Fulfilled ({statusCounts.fulfilled})</option>
          </select>

          {/* Date From */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="From Date"
            className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors text-sm"
          />

          {/* Date To */}
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="To Date"
            className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors text-sm"
          />
        </div>

        {/* Active Filters */}
        {(statusFilter !== 'all' || dateFrom || dateTo || customerFilter) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
            <span className="text-xs text-white/40">Active filters:</span>
            {statusFilter !== 'all' && (
              <Badge variant="neutral">
                {statusFilter}
                <X size={10} className="ml-1 cursor-pointer" onClick={() => setStatusFilter('all')} />
              </Badge>
            )}
            {dateFrom && (
              <Badge variant="neutral">
                From {new Date(dateFrom).toLocaleDateString()}
                <X size={10} className="ml-1 cursor-pointer" onClick={() => setDateFrom('')} />
              </Badge>
            )}
            {dateTo && (
              <Badge variant="neutral">
                To {new Date(dateTo).toLocaleDateString()}
                <X size={10} className="ml-1 cursor-pointer" onClick={() => setDateTo('')} />
              </Badge>
            )}
          </div>
        )}
      </Card>

      {/* PO List */}
      {filteredPOs.length === 0 ? (
        <Card className="text-center" padding="lg">
          <Package size={48} className="text-white/20 mx-auto mb-4" />
          <div className="text-white/60 mb-2">No purchase orders found</div>
          <div className="text-white/40 text-sm mb-4">
            {statusFilter !== 'all' || dateFrom || dateTo
              ? 'Try adjusting your filters'
              : `Create your first ${activeTab} PO to get started`}
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg text-xs uppercase tracking-wider hover:bg-white/90 transition-all"
          >
            <Plus size={16} />
            Create PO
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 spacing-grid">
          {filteredPOs.map((po) => (
            <Card key={po.id} hover={true}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white font-medium">
                      {po.po_number}
                    </h3>
                    <Badge variant={
                      po.status === 'fulfilled' || po.status === 'received' ? 'success' :
                      po.status === 'draft' ? 'warning' :
                      po.status === 'cancelled' ? 'error' : 'neutral'
                    }>
                      {po.status}
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

      {/* Enhanced Create PO Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="minimal-glass subtle-glow border border-white/20 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            {/* Modal content - will continue in next message */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-xl text-white/90 font-light tracking-tight mb-1">
                  Create {activeTab === 'inbound' ? 'Inbound' : 'Outbound'} Purchase Order
                </h2>
                <div className="flex items-center gap-2">
                  {['customer', 'products', 'review'].map((step, idx) => (
                    <div key={step} className="flex items-center">
                      <div className={`text-xs uppercase tracking-wider ${
                        createStep === step ? 'text-white' : 'text-white/40'
                      }`}>
                        {idx + 1}. {step}
                      </div>
                      {idx < 2 && <ChevronDown size={12} className="mx-2 text-white/40 rotate-[-90deg]" />}
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-white/5 border border-white/10 hover:border-white/20 rounded-md transition-all"
              >
                <X size={16} className="text-white/60" />
              </button>
            </div>

            <div className="p-6">
              {/* Step 1: Customer Selection (Outbound only) */}
              {createStep === 'customer' && activeTab === 'outbound' && (
                <div>
                  <h3 className="text-label mb-4">Select Customer</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
                    {customers.map(customer => {
                      const isSelected = selectedCustomer === customer.id;
                      return (
                        <div
                          key={customer.id}
                          onClick={() => setSelectedCustomer(customer.id)}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? 'border-white/40 bg-white/10'
                              : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="text-white font-medium mb-1">
                                {customer.external_company_name}
                              </h4>
                              <div className="flex items-center gap-2">
                                <Badge variant={
                                  customer.pricing_tier === 'vip' ? 'warning' :
                                  customer.pricing_tier === 'distributor' ? 'neutral' : 'neutral'
                                }>
                                  {customer.pricing_tier}
                                </Badge>
                                <span className="text-xs text-white/60">
                                  {customer.discount_percent}% discount
                                </span>
                              </div>
                            </div>
                            {!customer.is_active && (
                              <Badge variant="error">Inactive</Badge>
                            )}
                          </div>

                          <div className="space-y-1 text-xs text-white/60">
                            {customer.payment_terms && (
                              <div>Terms: {customer.payment_terms}</div>
                            )}
                            {customer.credit_limit && (
                              <div className="flex items-center gap-1">
                                <DollarSign size={10} />
                                Credit: ${customer.credit_limit.toLocaleString()}
                              </div>
                            )}
                            <div className="text-white/40">
                              Member since {new Date(customer.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="px-6 py-3 rounded-lg text-xs uppercase tracking-wider text-white hover:bg-white/5 transition-all border border-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setCreateStep('products')}
                      disabled={!selectedCustomer}
                      className="px-6 py-3 rounded-lg text-xs uppercase tracking-wider bg-white text-black hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next: Select Products
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Product Selection - Enhanced */}
              {createStep === 'products' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-label">
                      Select Products ({selectedProducts.size} selected)
                    </h3>
                    <div className="flex items-center gap-2">
                      {/* ADD NEW PRODUCT BUTTON - Only for inbound POs */}
                      {activeTab === 'inbound' && (
                        <button
                          onClick={() => setShowNewProductForm(!showNewProductForm)}
                          className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 border border-green-500/30 px-4 py-2 rounded-lg text-xs uppercase tracking-wider hover:bg-green-500/30 transition-all"
                        >
                          <Plus size={14} />
                          {showNewProductForm ? 'Cancel' : 'Add New Product'}
                        </button>
                      )}

                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-all ${
                          viewMode === 'grid'
                            ? 'bg-white/10 text-white'
                            : 'text-white/40 hover:text-white/60'
                        }`}
                      >
                        <Grid size={16} />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-all ${
                          viewMode === 'list'
                            ? 'bg-white/10 text-white'
                            : 'text-white/40 hover:text-white/60'
                        }`}
                      >
                        <List size={16} />
                      </button>
                    </div>
                  </div>

                  {/* NEW PRODUCT FORM */}
                  {showNewProductForm && activeTab === 'inbound' && (
                    <Card className="mb-4 border-green-500/30 bg-green-500/5">
                      <div className="p-4">
                        <h4 className="text-white text-sm font-medium mb-4 flex items-center gap-2">
                          <Package size={16} className="text-green-400" />
                          Add New Product from Supplier
                        </h4>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div>
                            <label className="block text-xs text-white/60 mb-1">Product Name *</label>
                            <input
                              type="text"
                              value={newProductForm.name}
                              onChange={(e) => setNewProductForm({...newProductForm, name: e.target.value})}
                              placeholder="e.g., Purple Haze"
                              className="w-full bg-black border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-green-500/50"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-white/60 mb-1">Supplier SKU</label>
                            <input
                              type="text"
                              value={newProductForm.supplier_sku}
                              onChange={(e) => setNewProductForm({...newProductForm, supplier_sku: e.target.value})}
                              placeholder="Supplier's product code"
                              className="w-full bg-black border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-green-500/50"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-white/60 mb-1">Your SKU (optional)</label>
                            <input
                              type="text"
                              value={newProductForm.sku}
                              onChange={(e) => setNewProductForm({...newProductForm, sku: e.target.value})}
                              placeholder="Auto-generated if blank"
                              className="w-full bg-black border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-green-500/50"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-white/60 mb-1">Category</label>
                            <input
                              type="text"
                              value={newProductForm.category}
                              onChange={(e) => setNewProductForm({...newProductForm, category: e.target.value})}
                              placeholder="e.g., Flower, Edibles"
                              className="w-full bg-black border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-green-500/50"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-white/60 mb-1">Unit Cost *</label>
                            <input
                              type="number"
                              step="0.01"
                              value={newProductForm.unit_cost}
                              onChange={(e) => setNewProductForm({...newProductForm, unit_cost: e.target.value})}
                              placeholder="0.00"
                              className="w-full bg-black border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-green-500/50"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-white/60 mb-1">Brand (optional)</label>
                            <input
                              type="text"
                              value={newProductForm.brand}
                              onChange={(e) => setNewProductForm({...newProductForm, brand: e.target.value})}
                              placeholder="e.g., Cookies, Jungle Boys"
                              className="w-full bg-black border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-green-500/50"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setShowNewProductForm(false)}
                            className="px-4 py-2 rounded-lg text-xs uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/5 transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddNewProduct}
                            className="px-4 py-2 rounded-lg text-xs uppercase tracking-wider bg-green-500 text-white hover:bg-green-600 transition-all"
                          >
                            Add to PO
                          </button>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* NEW PRODUCTS LIST */}
                  {newProducts.length > 0 && (
                    <Card className="mb-4 border-green-500/30 bg-green-500/5">
                      <div className="p-4">
                        <h4 className="text-green-400 text-sm font-medium mb-3">
                          New Products ({newProducts.length})
                        </h4>
                        <div className="space-y-2">
                          {newProducts.map((np) => {
                            const selection = selectedProducts.get(np.tempId);
                            return (
                              <div key={np.tempId} className="flex items-center justify-between bg-black/50 p-3 rounded-lg border border-green-500/20">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-white text-sm font-medium">{np.name}</span>
                                    <Badge variant="success">NEW</Badge>
                                  </div>
                                  <div className="text-xs text-white/60">
                                    SKU: {np.sku} • Category: {np.category || 'N/A'} • ${Number(np.unit_cost).toFixed(2)}
                                  </div>
                                </div>

                                {selection && (
                                  <div className="flex items-center gap-3">
                                    <div>
                                      <label className="text-white/40 text-xs block mb-1">Qty</label>
                                      <input
                                        type="number"
                                        min="1"
                                        value={selection.quantity}
                                        onChange={(e) => {
                                          const newSelected = new Map(selectedProducts);
                                          newSelected.set(np.tempId, {
                                            quantity: parseInt(e.target.value) || 1,
                                            price: selection.price
                                          });
                                          setSelectedProducts(newSelected);
                                        }}
                                        className="w-20 bg-black border border-white/10 text-white px-2 py-1 rounded text-sm"
                                      />
                                    </div>
                                    <button
                                      onClick={() => removeNewProduct(np.tempId)}
                                      className="p-2 hover:bg-red-500/10 border border-red-500/20 rounded-md transition-all"
                                    >
                                      <X size={14} className="text-red-500" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Product Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="relative">
                      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full bg-black border border-white/10 text-white placeholder-white/40 pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors text-sm"
                      />
                    </div>

                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors text-sm"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>

                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="w-full bg-black border border-white/10 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-white/20 transition-colors text-sm"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="price">Sort by Price</option>
                      <option value="stock">Sort by Stock</option>
                    </select>
                  </div>

                  {/* Product Grid/List */}
                  <div className={`max-h-[400px] overflow-y-auto border border-white/10 bg-black/98 rounded-lg ${
                    viewMode === 'grid' ? 'p-4' : ''
                  }`}>
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredProducts.map(product => {
                          const isSelected = selectedProducts.has(product.id);
                          const selection = selectedProducts.get(product.id);
                          const displayPrice = selection?.price || product.price;

                          return (
                            <div
                              key={product.id}
                              onClick={() => toggleProduct(product)}
                              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-white/40 bg-white/10'
                                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                              }`}
                            >
                              <div className="aspect-square bg-white/5 rounded-md mb-3 flex items-center justify-center">
                                <Package size={32} className="text-white/20" />
                              </div>

                              <div className="text-white text-sm font-medium mb-1 truncate">
                                {product.name}
                              </div>
                              <div className="text-white/40 text-xs mb-2">{product.sku}</div>

                              <div className="flex items-center justify-between">
                                <div className="text-white text-sm">${displayPrice.toFixed(2)}</div>
                                {product.stock_quantity !== undefined && (
                                  <div className="text-xs text-white/60">
                                    {product.stock_quantity} in stock
                                  </div>
                                )}
                              </div>

                              {isSelected && selection && (
                                <div className="mt-3 pt-3 border-t border-white/10">
                                  <div className="flex gap-2">
                                    <input
                                      type="number"
                                      min="1"
                                      value={selection.quantity}
                                      onChange={(e) => updateProductQuantity(product.id, parseInt(e.target.value) || 1)}
                                      onClick={(e) => e.stopPropagation()}
                                      placeholder="Qty"
                                      className="w-full bg-black border border-white/10 text-white px-2 py-1 rounded text-xs focus:outline-none focus:border-white/20"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div>
                        {filteredProducts.map(product => {
                          const isSelected = selectedProducts.has(product.id);
                          const selection = selectedProducts.get(product.id);
                          const displayPrice = selection?.price || product.price;

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
                                  <div className="text-white/40 text-xs">
                                    SKU: {product.sku} • ${displayPrice.toFixed(2)}
                                  </div>
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
                                        className="w-24 bg-black border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-white/20"
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
                                        className="w-24 bg-black border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-white/20"
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
                    )}
                  </div>

                  {/* Totals */}
                  {selectedProducts.size > 0 && (
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 mt-4">
                      <div className="space-y-2 text-sm">
                        {selectedCustomerData && (
                          <div className="flex justify-between text-white/60 mb-2 pb-2 border-b border-white/10">
                            <span>Customer Discount ({selectedCustomerData.discount_percent}%):</span>
                            <span className="text-green-500">Applied</span>
                          </div>
                        )}
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

                  <div className="flex justify-between gap-3 mt-6">
                    <button
                      onClick={() => setCreateStep('customer')}
                      className="px-6 py-3 rounded-lg text-xs uppercase tracking-wider text-white hover:bg-white/5 transition-all border border-white/10"
                    >
                      Back
                    </button>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowCreateModal(false)}
                        className="px-6 py-3 rounded-lg text-xs uppercase tracking-wider text-white hover:bg-white/5 transition-all border border-white/10"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={selectedProducts.size === 0}
                        className="px-6 py-3 rounded-lg text-xs uppercase tracking-wider bg-white text-black hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Create Purchase Order
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
