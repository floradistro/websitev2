"use client";

import { useState, useEffect } from 'react';
import { useVendorAuth } from '@/context/VendorAuthContext';
import { Plus, Package, Truck, CheckCircle, Clock, X, Edit2, Eye, FileText, DollarSign, MapPin, Calendar, Search, Filter } from 'lucide-react';
import axios from 'axios';
import { showNotification, showConfirm } from '@/components/NotificationToast';
import AdminModal from '@/components/AdminModal';

interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor_id: string;
  location_id: string;
  order_date: string;
  expected_delivery_date: string | null;
  received_date: string | null;
  status: 'draft' | 'submitted' | 'confirmed' | 'in_transit' | 'received' | 'partial' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  supplier_name: string | null;
  supplier_email: string | null;
  supplier_phone: string | null;
  tracking_number: string | null;
  carrier: string | null;
  internal_notes: string | null;
  created_at: string;
  location?: {
    id: string;
    name: string;
    city: string;
    state: string;
  };
  items?: POItem[];
}

interface POItem {
  id: string;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  line_total: number;
  receive_status: 'pending' | 'partial' | 'received' | 'cancelled';
}

interface Product {
  id: string; // Supabase UUID
  name: string;
  sku: string;
  price: number;
  image: string | null;
  category_name: string;
  current_stock: number;
}

interface Location {
  id: string;
  name: string;
  city: string;
  state: string;
}

export default function VendorPurchaseOrders() {
  const { isAuthenticated, isLoading: authLoading } = useVendorAuth();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  
  // Create PO state
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Map<string, { quantity: number; cost: number }>>(new Map());
  const [productSearch, setProductSearch] = useState('');
  
  // Receive state
  const [receiveQuantities, setReceiveQuantities] = useState<Map<string, number>>(new Map());
  
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const storedVendorId = localStorage.getItem('vendor_id');
      if (storedVendorId) {
        setVendorId(storedVendorId);
        loadData(storedVendorId);
      }
    }
  }, [authLoading, isAuthenticated]);

  const loadData = async (vId: string) => {
    try {
      setLoading(true);
      
      const [posResponse, productsResponse, locationsResponse] = await Promise.all([
        axios.get('/api/vendor/purchase-orders', {
          headers: { 'x-vendor-id': vId }
        }).catch(() => ({ data: { purchase_orders: [] } })),
        axios.get('/api/vendor/products', {
          headers: { 'x-vendor-id': vId }
        }).catch(() => ({ data: { products: [] } })),
        axios.get('/api/vendor/locations', {
          headers: { 'x-vendor-id': vId }
        }).catch(() => ({ data: { locations: [] } }))
      ]);
      
      setPurchaseOrders(posResponse.data.purchase_orders || []);
      
      // Only show published products
      const publishedProducts = (productsResponse.data.products || []).filter((p: any) => 
        p.status === 'published' || p.status === 'publish'
      ).map((p: any) => ({
        id: p.id, // Supabase UUID
        name: p.name,
        sku: p.sku || '',
        price: parseFloat(p.regular_price || 0),
        image: p.featured_image_storage || p.featured_image || null,
        category_name: p.primary_category?.name || 'Product',
        current_stock: parseFloat(p.stock_quantity || 0)
      }));
      
      setProducts(publishedProducts);
      setLocations(locationsResponse.data.locations || []);
      
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification({
        type: 'error',
        title: 'Load Failed',
        message: 'Failed to load purchase orders'
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setSelectedProducts(new Map());
    setSelectedLocation('');
    setExpectedDelivery('');
    setSupplierName('');
    setSupplierEmail('');
    setSupplierPhone('');
    setPoNotes('');
    setProductSearch('');
    setShowCreateModal(true);
  };

  const toggleProduct = (product: Product) => {
    const newSelected = new Map(selectedProducts);
    if (newSelected.has(product.id)) {
      newSelected.delete(product.id);
    } else {
      newSelected.set(product.id, { 
        quantity: 1, 
        cost: product.price 
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

  const updateProductCost = (productId: string, cost: number) => {
    const newSelected = new Map(selectedProducts);
    const existing = newSelected.get(productId);
    if (existing) {
      newSelected.set(productId, { ...existing, cost });
    }
    setSelectedProducts(newSelected);
  };

  const createPurchaseOrder = async () => {
    if (!selectedLocation || selectedProducts.size === 0) {
      showNotification({
        type: 'warning',
        title: 'Missing Information',
        message: 'Please select location and at least one product'
      });
      return;
    }

    try {
      const items = Array.from(selectedProducts.entries()).map(([productId, data]) => {
        const product = products.find(p => p.id === productId);
        return {
          product_id: productId,
          product_name: product?.name || 'Unknown',
          product_sku: product?.sku || '',
          quantity: data.quantity,
          unit_cost: data.cost
        };
      });

      const response = await axios.post('/api/vendor/purchase-orders', {
        location_id: selectedLocation,
        expected_delivery_date: expectedDelivery || null,
        supplier_name: supplierName || null,
        supplier_email: supplierEmail || null,
        supplier_phone: supplierPhone || null,
        notes: poNotes || null,
        items
      }, {
        headers: { 'x-vendor-id': vendorId }
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'PO Created',
          message: `Purchase order ${response.data.purchase_order.po_number} created successfully`
        });
        setShowCreateModal(false);
        if (vendorId) loadData(vendorId);
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Create Failed',
        message: error.response?.data?.error || 'Failed to create purchase order'
      });
    }
  };

  const openReceiveModal = (po: PurchaseOrder) => {
    setSelectedPO(po);
    const quantities = new Map();
    po.items?.forEach(item => {
      if (item.receive_status !== 'received') {
        quantities.set(item.id, item.quantity_ordered - item.quantity_received);
      }
    });
    setReceiveQuantities(quantities);
    setShowReceiveModal(true);
  };

  const receiveItems = async () => {
    if (!selectedPO || receiveQuantities.size === 0) {
      showNotification({
        type: 'warning',
        title: 'No Items',
        message: 'No items to receive'
      });
      return;
    }

    try {
      const items = Array.from(receiveQuantities.entries())
        .filter(([_, qty]) => qty > 0)
        .map(([itemId, qty]) => ({
          po_item_id: itemId,
          quantity_received: qty,
          condition: 'good'
        }));

      if (items.length === 0) {
        showNotification({
          type: 'warning',
          title: 'No Quantities',
          message: 'Please enter quantities to receive'
        });
        return;
      }

      const response = await axios.post('/api/vendor/purchase-orders/receive', {
        po_id: selectedPO.id,
        items
      }, {
        headers: { 'x-vendor-id': vendorId }
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Items Received',
          message: 'Items received and inventory updated'
        });
        setShowReceiveModal(false);
        setSelectedPO(null);
        if (vendorId) loadData(vendorId);
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Receive Failed',
        message: error.response?.data?.error || 'Failed to receive items'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-gray-500 border-gray-500';
      case 'submitted': return 'text-blue-500 border-blue-500';
      case 'confirmed': return 'text-purple-500 border-purple-500';
      case 'in_transit': return 'text-yellow-500 border-yellow-500';
      case 'partial': return 'text-orange-500 border-orange-500';
      case 'received': return 'text-green-500 border-green-500';
      case 'cancelled': return 'text-red-500 border-red-500';
      default: return 'text-white/60 border-white/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit2 size={12} />;
      case 'submitted': return <FileText size={12} />;
      case 'confirmed': return <CheckCircle size={12} />;
      case 'in_transit': return <Truck size={12} />;
      case 'partial': return <Package size={12} />;
      case 'received': return <CheckCircle size={12} />;
      case 'cancelled': return <X size={12} />;
      default: return <Clock size={12} />;
    }
  };

  // Filter POs
  const filteredPOs = purchaseOrders.filter(po => {
    if (statusFilter !== 'all' && po.status !== statusFilter) return false;
    if (search && !po.po_number.toLowerCase().includes(search.toLowerCase()) &&
        !po.supplier_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Calculate totals
  const calculateTotal = () => {
    return Array.from(selectedProducts.entries()).reduce((sum, [productId, data]) => {
      return sum + (data.quantity * data.cost);
    }, 0);
  };

  // Filter products for catalog
  const filteredProducts = products.filter(p => {
    if (productSearch && !p.name.toLowerCase().includes(productSearch.toLowerCase()) &&
        !p.sku.toLowerCase().includes(productSearch.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: purchaseOrders.length,
    draft: purchaseOrders.filter(p => p.status === 'draft').length,
    in_transit: purchaseOrders.filter(p => p.status === 'in_transit').length,
    received: purchaseOrders.filter(p => p.status === 'received').length,
    total_value: purchaseOrders.reduce((sum, p) => sum + parseFloat(p.total_amount?.toString() || '0'), 0)
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-white/40">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fadeIn px-4 lg:px-0">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl lg:text-3xl text-white font-light tracking-tight mb-2">
              Purchase Orders
            </h1>
            <p className="text-white/50 text-sm">Manage restocking and inventory costs</p>
          </div>
          
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-white text-black px-4 py-3 text-xs uppercase tracking-wider hover:bg-white/90 transition-all"
          >
            <Plus size={16} />
            <span className="hidden lg:inline">New Purchase Order</span>
            <span className="lg:hidden">New PO</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={14} className="text-white/40" />
            <span className="text-white/40 text-[10px] uppercase tracking-wider">Total POs</span>
          </div>
          <div className="text-xl text-white font-light">{stats.total}</div>
        </div>
        
        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Edit2 size={14} className="text-gray-500" />
            <span className="text-white/40 text-[10px] uppercase tracking-wider">Draft</span>
          </div>
          <div className="text-xl text-gray-500 font-light">{stats.draft}</div>
        </div>
        
        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Truck size={14} className="text-yellow-500" />
            <span className="text-white/40 text-[10px] uppercase tracking-wider">In Transit</span>
          </div>
          <div className="text-xl text-yellow-500 font-light">{stats.in_transit}</div>
        </div>
        
        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={14} className="text-green-500" />
            <span className="text-white/40 text-[10px] uppercase tracking-wider">Received</span>
          </div>
          <div className="text-xl text-green-500 font-light">{stats.received}</div>
        </div>
        
        <div className="bg-[#111111] border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={14} className="text-white/40" />
            <span className="text-white/40 text-[10px] uppercase tracking-wider">Total Value</span>
          </div>
          <div className="text-xl text-white font-light">${stats.total_value.toFixed(2)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#111111] border border-white/10 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search PO number or supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#111111] border border-white/10 text-white placeholder-white/40 pl-10 pr-4 py-3 focus:outline-none focus:border-white/20 transition-colors text-sm"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#111111] border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:border-white/20"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_transit">In Transit</option>
            <option value="partial">Partial</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Purchase Orders List */}
      {filteredPOs.length === 0 ? (
        <div className="bg-[#111111] border border-white/10 p-12 text-center">
          <Package size={48} className="text-white/20 mx-auto mb-4" />
          <div className="text-white/60 mb-2">No purchase orders found</div>
          <div className="text-white/40 text-sm mb-4">Create your first purchase order to start restocking</div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 text-xs uppercase tracking-wider hover:bg-white/90 transition-all"
          >
            <Plus size={16} />
            Create Purchase Order
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPOs.map((po) => (
            <div
              key={po.id}
              className="bg-[#111111] border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-medium text-lg">{po.po_number}</h3>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase tracking-wider border ${getStatusColor(po.status)}`}>
                        {getStatusIcon(po.status)}
                        {po.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/60">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {po.location?.name || 'No Location'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(po.order_date).toLocaleDateString()}
                      </span>
                      {po.supplier_name && (
                        <span>{po.supplier_name}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl text-white font-light mb-1">
                      ${parseFloat(po.total_amount?.toString() || '0').toFixed(2)}
                    </div>
                    <div className="text-xs text-white/40">
                      {po.items?.length || 0} items
                    </div>
                  </div>
                </div>

                {/* Items Summary */}
                {po.items && po.items.length > 0 && (
                  <div className="bg-white/5 border border-white/5 p-3 mb-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                      <div>
                        <span className="text-white/40 text-xs">Items Ordered:</span>
                        <span className="text-white text-sm ml-2">
                          {po.items.reduce((sum, item) => sum + parseFloat(item.quantity_ordered?.toString() || '0'), 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/40 text-xs">Items Received:</span>
                        <span className="text-green-500 text-sm ml-2">
                          {po.items.reduce((sum, item) => sum + parseFloat(item.quantity_received?.toString() || '0'), 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-white/40 text-xs">Remaining:</span>
                        <span className="text-yellow-500 text-sm ml-2">
                          {po.items.reduce((sum, item) => 
                            sum + (parseFloat(item.quantity_ordered?.toString() || '0') - parseFloat(item.quantity_received?.toString() || '0')), 0
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedPO(po);
                      setShowViewModal(true);
                    }}
                    className="flex items-center gap-2 bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 px-4 py-2 text-xs uppercase tracking-wider transition-all"
                  >
                    <Eye size={14} />
                    View Details
                  </button>
                  
                  {(po.status === 'confirmed' || po.status === 'in_transit' || po.status === 'partial') && (
                    <button
                      onClick={() => openReceiveModal(po)}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-xs uppercase tracking-wider transition-all"
                    >
                      <Package size={14} />
                      Receive Items
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create PO Modal */}
      <AdminModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Purchase Order"
        description="Select products from your catalog to restock"
        onSubmit={createPurchaseOrder}
        submitText="Create PO"
        maxWidth="5xl"
      >
        <div className="space-y-6">
          {/* Location & Delivery */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">
                Destination Location *
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20"
                required
              >
                <option value="">Select location...</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} - {loc.city}, {loc.state}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">
                Expected Delivery
              </label>
              <input
                type="date"
                value={expectedDelivery}
                onChange={(e) => setExpectedDelivery(e.target.value)}
                className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20"
              />
            </div>
          </div>

          {/* Supplier Info */}
          <div className="border-t border-white/10 pt-4">
            <h4 className="text-white text-sm mb-3 uppercase tracking-wider">Supplier Information</h4>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">
                  Supplier Name
                </label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Supplier name"
                  className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20"
                />
              </div>
              
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={supplierEmail}
                  onChange={(e) => setSupplierEmail(e.target.value)}
                  placeholder="supplier@example.com"
                  className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20"
                />
              </div>
              
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20"
                />
              </div>
            </div>
          </div>

          {/* Product Catalog */}
          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white text-sm uppercase tracking-wider">
                Product Catalog ({selectedProducts.size} selected)
              </h4>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="bg-[#111111] border border-white/10 text-white placeholder-white/40 pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-white/20"
                />
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto border border-white/10 bg-[#0a0a0a]">
              {filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-white/40 text-sm">
                  No products found
                </div>
              ) : (
                filteredProducts.map(product => {
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
                        
                        <div className="w-12 h-12 bg-white/5 flex items-center justify-center flex-shrink-0">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package size={20} className="text-white/40" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="text-white text-sm">{product.name}</div>
                          <div className="text-white/40 text-xs">
                            SKU: {product.sku} • Current Stock: {product.current_stock}g
                          </div>
                        </div>
                        
                        {isSelected && selection && (
                          <div className="flex items-center gap-3">
                            <div>
                              <label className="text-white/40 text-xs block mb-1">Qty (g)</label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={selection.quantity}
                                onChange={(e) => updateProductQuantity(product.id, parseFloat(e.target.value) || 0)}
                                className="w-24 bg-[#111111] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-white/20"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <div>
                              <label className="text-white/40 text-xs block mb-1">Cost/g ($)</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={selection.cost}
                                onChange={(e) => updateProductCost(product.id, parseFloat(e.target.value) || 0)}
                                className="w-24 bg-[#111111] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-white/20"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <div className="text-right">
                              <div className="text-white/40 text-xs mb-1">Subtotal</div>
                              <div className="text-white text-sm font-medium">
                                ${(selection.quantity * selection.cost).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Total */}
          {selectedProducts.size > 0 && (
            <div className="bg-white/5 border border-white/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm uppercase tracking-wider">Estimated Total</span>
                <span className="text-white text-2xl font-light">${calculateTotal().toFixed(2)}</span>
              </div>
              <div className="text-white/40 text-xs mt-1">
                {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} • 
                {Array.from(selectedProducts.values()).reduce((sum, s) => sum + s.quantity, 0).toFixed(1)}g total
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">
              Internal Notes
            </label>
            <textarea
              value={poNotes}
              onChange={(e) => setPoNotes(e.target.value)}
              placeholder="Add any notes about this purchase order..."
              rows={3}
              className="w-full bg-[#111111] border border-white/10 text-white placeholder-white/40 px-4 py-3 focus:outline-none focus:border-white/20 resize-none"
            />
          </div>
        </div>
      </AdminModal>

      {/* View PO Modal */}
      {selectedPO && (
        <AdminModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedPO(null);
          }}
          title={`Purchase Order: ${selectedPO.po_number}`}
          description={`Created ${new Date(selectedPO.created_at).toLocaleDateString()}`}
          maxWidth="4xl"
        >
          <div className="space-y-4">
            {/* Status & Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 p-3">
                <div className="text-white/40 text-xs mb-1">Status</div>
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase tracking-wider border ${getStatusColor(selectedPO.status)}`}>
                  {getStatusIcon(selectedPO.status)}
                  {selectedPO.status}
                </span>
              </div>
              <div className="bg-white/5 border border-white/10 p-3">
                <div className="text-white/40 text-xs mb-1">Location</div>
                <div className="text-white text-sm">{selectedPO.location?.name}</div>
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="text-white text-sm mb-3 uppercase tracking-wider">Items</h4>
              <div className="space-y-2">
                {selectedPO.items?.map(item => (
                  <div key={item.id} className="bg-white/5 border border-white/10 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white text-sm">{item.product_name}</div>
                        <div className="text-white/40 text-xs">SKU: {item.product_sku}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white text-sm">
                          {item.quantity_received}/{item.quantity_ordered}g
                        </div>
                        <div className="text-white/40 text-xs">
                          ${parseFloat(item.unit_cost?.toString() || '0').toFixed(2)}/g
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-white/5 border border-white/10 p-4">
              <div className="flex items-center justify-between text-white text-lg">
                <span className="uppercase tracking-wider">Total</span>
                <span className="font-light">${parseFloat(selectedPO.total_amount?.toString() || '0').toFixed(2)}</span>
              </div>
            </div>
          </div>
        </AdminModal>
      )}

      {/* Receive Items Modal */}
      {selectedPO && (
        <AdminModal
          isOpen={showReceiveModal}
          onClose={() => {
            setShowReceiveModal(false);
            setSelectedPO(null);
            setReceiveQuantities(new Map());
          }}
          title="Receive Items"
          description={`PO: ${selectedPO.po_number}`}
          onSubmit={receiveItems}
          submitText="Receive & Update Inventory"
          maxWidth="3xl"
        >
          <div className="space-y-3">
            {selectedPO.items?.filter(item => item.receive_status !== 'received').map(item => (
              <div key={item.id} className="bg-white/5 border border-white/10 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-white text-sm">{item.product_name}</div>
                    <div className="text-white/40 text-xs">
                      Ordered: {item.quantity_ordered}g • Received: {item.quantity_received}g • 
                      Remaining: {(item.quantity_ordered - item.quantity_received).toFixed(1)}g
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-white/60 text-xs mb-2">Quantity to Receive (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={item.quantity_ordered - item.quantity_received}
                    value={receiveQuantities.get(item.id) || 0}
                    onChange={(e) => {
                      const newMap = new Map(receiveQuantities);
                      newMap.set(item.id, parseFloat(e.target.value) || 0);
                      setReceiveQuantities(newMap);
                    }}
                    className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20"
                  />
                </div>
              </div>
            ))}
            
            <div className="bg-blue-500/10 border border-blue-500/20 p-4">
              <p className="text-blue-400 text-xs">
                <strong>Note:</strong> Receiving items will automatically update your inventory at the selected location and record the unit cost for tracking.
              </p>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}

