'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input, Select } from '@/components/ds';
import { ds, cn } from '@/components/ds';
import { Plus, Trash2, Package, Building2, CheckCircle2, XCircle } from 'lucide-react';
import { useAppAuth } from '@/context/AppAuthContext';

interface Supplier {
  id: string;
  external_name: string;
  external_company?: string;
  supplier_vendor?: {
    store_name: string;
  };
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  regular_price?: number;
}

interface POLineItem {
  product_id: string;
  product_name: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
}

interface CreatePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePOModal({ isOpen, onClose, onSuccess }: CreatePOModalProps) {
  const { vendor, primaryLocation } = useAppAuth();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [lineItems, setLineItems] = useState<POLineItem[]>([
    { product_id: '', product_name: '', product_sku: '', quantity: 0, unit_price: 0 },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load suppliers
  useEffect(() => {
    if (isOpen && vendor?.id) {
      loadSuppliers();
      loadProducts();
    }
  }, [isOpen, vendor?.id]);

  const loadSuppliers = async () => {
    if (!vendor?.id) return;
    setLoadingSuppliers(true);
    try {
      const response = await fetch(`/api/vendor/suppliers?vendor_id=${vendor.id}`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setSuppliers(data.suppliers || []);
      }
    } catch (err) {
      console.error('Failed to load suppliers:', err);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  const loadProducts = async () => {
    if (!vendor?.id) return;
    setLoadingProducts(true);
    try {
      const response = await fetch(`/api/vendor/products/full?vendor_id=${vendor.id}&limit=1000`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { product_id: '', product_name: '', product_sku: '', quantity: 0, unit_price: 0 },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) return; // Keep at least one
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof POLineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };

    // If product_id changed, auto-fill product details
    if (field === 'product_id' && value) {
      const product = products.find((p) => p.id === value);
      if (product) {
        updated[index].product_name = product.name;
        updated[index].product_sku = product.sku || '';
        updated[index].unit_price = parseFloat(product.regular_price?.toString() || '0');
      }
    }

    setLineItems(updated);
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  };

  const validateForm = () => {
    if (!selectedSupplier) {
      setError('Please select a supplier');
      return false;
    }

    const validItems = lineItems.filter(
      (item) => item.product_id && item.quantity > 0 && item.unit_price >= 0
    );

    if (validItems.length === 0) {
      setError('Please add at least one valid item');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!vendor?.id || !primaryLocation?.id) {
      setError('Vendor or location not found');
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare items
      const validItems = lineItems
        .filter((item) => item.product_id && item.quantity > 0)
        .map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: item.quantity * item.unit_price,
        }));

      const response = await fetch('/api/vendor/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'create',
          vendor_id: vendor.id,
          po_type: 'inbound',
          supplier_id: selectedSupplier,
          location_id: primaryLocation.id,
          expected_delivery_date: expectedDeliveryDate || null,
          internal_notes: internalNotes || null,
          items: validItems,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create purchase order');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        resetForm();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to create purchase order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedSupplier('');
    setExpectedDeliveryDate('');
    setInternalNotes('');
    setLineItems([{ product_id: '', product_name: '', product_sku: '', quantity: 0, unit_price: 0 }]);
    setError(null);
    setSuccess(false);
  };

  const subtotal = calculateSubtotal();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Purchase Order"
      size="xl"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || success}
          >
            {isSubmitting ? 'Creating...' : success ? 'Created!' : 'Create PO'}
          </Button>
        </>
      }
    >
      {/* Success Message */}
      {success && (
        <div
          className={cn(
            'flex items-center gap-2 p-3 rounded-lg mb-4',
            'bg-green-500/10 border border-green-500/20'
          )}
        >
          <CheckCircle2 size={16} className="text-green-400" />
          <span className={cn(ds.typography.size.xs, 'text-green-400')}>
            Purchase order created successfully!
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          className={cn(
            'flex items-center gap-2 p-3 rounded-lg mb-4',
            'bg-red-500/10 border border-red-500/20'
          )}
        >
          <XCircle size={16} className="text-red-400" />
          <span className={cn(ds.typography.size.xs, 'text-red-400')}>{error}</span>
        </div>
      )}

      {/* Supplier Selection */}
      <div className="mb-4">
        <label className={cn(ds.typography.size.xs, ds.colors.text.quaternary, 'mb-2 block flex items-center gap-1')}>
          <Building2 size={12} />
          Supplier *
        </label>
        <Select
          value={selectedSupplier}
          onChange={(e) => setSelectedSupplier(e.target.value)}
          size="sm"
          disabled={loadingSuppliers}
        >
          <option value="">
            {loadingSuppliers ? 'Loading suppliers...' : 'Select supplier'}
          </option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.external_name || supplier.external_company || 'Unknown Supplier'}
              {supplier.supplier_vendor && ` (${supplier.supplier_vendor.store_name})`}
            </option>
          ))}
        </Select>
        {suppliers.length === 0 && !loadingSuppliers && (
          <p className={cn(ds.typography.size.xs, ds.colors.text.quaternary, 'mt-1')}>
            No suppliers found. Create a supplier first.
          </p>
        )}
      </div>

      {/* Expected Delivery Date */}
      <div className="mb-4">
        <label className={cn(ds.typography.size.xs, ds.colors.text.quaternary, 'mb-2 block')}>
          Expected Delivery Date
        </label>
        <Input
          type="date"
          value={expectedDeliveryDate}
          onChange={(e) => setExpectedDeliveryDate(e.target.value)}
          size="sm"
        />
      </div>

      {/* Line Items */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <label className={cn(ds.typography.size.xs, ds.colors.text.quaternary, 'flex items-center gap-1')}>
            <Package size={12} />
            Items *
          </label>
          <Button variant="ghost" size="xs" onClick={addLineItem}>
            <Plus size={12} />
            Add Item
          </Button>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {lineItems.map((item, index) => (
            <div
              key={index}
              className={cn(
                'rounded-lg border p-3',
                ds.colors.bg.secondary,
                ds.colors.border.default
              )}
            >
              <div className="flex items-start gap-2 mb-2">
                <div className="flex-1">
                  <label className={cn(ds.typography.size.xs, ds.colors.text.quaternary, 'mb-1 block')}>
                    Product
                  </label>
                  <Select
                    value={item.product_id}
                    onChange={(e) => updateLineItem(index, 'product_id', e.target.value)}
                    size="sm"
                    disabled={loadingProducts}
                  >
                    <option value="">
                      {loadingProducts ? 'Loading...' : 'Select product'}
                    </option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} {product.sku && `(${product.sku})`}
                      </option>
                    ))}
                  </Select>
                </div>
                {lineItems.length > 1 && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => removeLineItem(index)}
                    className="mt-5"
                  >
                    <Trash2 size={12} />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={cn(ds.typography.size.xs, ds.colors.text.quaternary, 'mb-1 block')}>
                    Quantity
                  </label>
                  <Input
                    type="number"
                    value={item.quantity || ''}
                    onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    min={0}
                    step={0.01}
                    size="sm"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className={cn(ds.typography.size.xs, ds.colors.text.quaternary, 'mb-1 block')}>
                    Unit Price
                  </label>
                  <Input
                    type="number"
                    value={item.unit_price || ''}
                    onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    min={0}
                    step={0.01}
                    size="sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {item.quantity > 0 && item.unit_price > 0 && (
                <div className={cn('text-right mt-2', ds.typography.size.xs, ds.colors.text.tertiary)}>
                  Line Total: ${(item.quantity * item.unit_price).toFixed(2)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Internal Notes */}
      <div className="mb-4">
        <label className={cn(ds.typography.size.xs, ds.colors.text.quaternary, 'mb-2 block')}>
          Internal Notes
        </label>
        <Input
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
          size="sm"
          placeholder="Optional internal notes..."
        />
      </div>

      {/* Subtotal */}
      {subtotal > 0 && (
        <div className={cn('rounded-lg p-3', ds.colors.bg.secondary)}>
          <div className="flex items-center justify-between">
            <span className={cn(ds.typography.size.sm, ds.colors.text.secondary)}>Subtotal</span>
            <span className={cn(ds.typography.size.lg, 'text-white font-light')}>
              ${subtotal.toFixed(2)}
            </span>
          </div>
          <div className={cn(ds.typography.size.xs, ds.colors.text.quaternary, 'mt-1')}>
            Tax and shipping can be added after PO is created
          </div>
        </div>
      )}
    </Modal>
  );
}
