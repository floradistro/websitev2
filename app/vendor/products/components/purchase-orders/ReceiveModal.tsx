'use client';

import { useState, useEffect } from 'react';
import { Modal, Button, Input } from '@/components/ds';
import { ds, cn } from '@/components/ds';
import { Package, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useAppAuth } from '@/context/AppAuthContext';
import type { PurchaseOrder, POItem } from './types';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder | null;
  onSuccess: () => void;
}

interface ReceiveItemData {
  po_item_id: string;
  quantity_received: number;
  condition: 'good' | 'damaged' | 'expired' | 'rejected';
  quality_notes: string;
  notes: string;
}

const CONDITION_OPTIONS = [
  { value: 'good', label: 'Good', description: 'Product in perfect condition', color: 'text-green-400' },
  { value: 'damaged', label: 'Damaged', description: 'Packaging or product damaged', color: 'text-yellow-400' },
  { value: 'expired', label: 'Expired', description: 'Product past expiration', color: 'text-orange-400' },
  { value: 'rejected', label: 'Rejected', description: 'Product rejected/not accepted', color: 'text-red-400' },
];

export function ReceiveModal({ isOpen, onClose, purchaseOrder, onSuccess }: ReceiveModalProps) {
  const { user, vendor } = useAppAuth();
  const [receiveData, setReceiveData] = useState<Record<string, ReceiveItemData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize receive data when PO changes
  useEffect(() => {
    if (purchaseOrder?.items) {
      const initialData: Record<string, ReceiveItemData> = {};
      purchaseOrder.items.forEach((item) => {
        if (item.quantity_remaining && item.quantity_remaining > 0) {
          initialData[item.id] = {
            po_item_id: item.id,
            quantity_received: item.quantity_remaining, // Default to full remaining
            condition: 'good',
            quality_notes: '',
            notes: '',
          };
        }
      });
      setReceiveData(initialData);
    }
    setError(null);
    setSuccess(false);
  }, [purchaseOrder]);

  const handleQuantityChange = (itemId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    const item = purchaseOrder?.items.find((i) => i.id === itemId);
    if (!item) return;

    // Prevent receiving more than remaining
    const maxReceive = item.quantity_remaining || item.quantity;
    const actualValue = Math.min(Math.max(0, numValue), maxReceive);

    setReceiveData((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantity_received: actualValue,
      },
    }));
  };

  const handleConditionChange = (itemId: string, value: string) => {
    setReceiveData((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        condition: value as 'good' | 'damaged' | 'expired' | 'rejected',
      },
    }));
  };

  const handleNotesChange = (itemId: string, field: 'quality_notes' | 'notes', value: string) => {
    setReceiveData((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!purchaseOrder || !vendor) return;

    // Get items to receive (quantity > 0)
    const itemsToReceive = Object.values(receiveData).filter(
      (item) => item.quantity_received > 0
    );

    if (itemsToReceive.length === 0) {
      setError('Please enter quantities to receive');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/vendor/purchase-orders/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          po_id: purchaseOrder.id,
          items: itemsToReceive,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to receive items');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to receive items');
    } finally {
      setIsSubmitting(false);
    }
  };

  const receivableItems = purchaseOrder?.items.filter((item) => (item.quantity_remaining || 0) > 0) || [];
  const totalReceiving = Object.values(receiveData).reduce(
    (sum, item) => sum + item.quantity_received,
    0
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Receive PO: ${purchaseOrder?.po_number || ''}`}
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
            disabled={isSubmitting || totalReceiving === 0 || success}
          >
            {isSubmitting ? 'Receiving...' : success ? 'Received!' : 'Receive Items'}
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
            Items received successfully! Inventory updated.
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

      {/* PO Info */}
      {purchaseOrder && (
        <div className={cn('rounded-lg p-3 mb-4', ds.colors.bg.secondary)}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className={cn(ds.typography.size.xs, ds.colors.text.quaternary, 'mb-1')}>
                Supplier
              </div>
              <div className={cn(ds.typography.size.sm, ds.colors.text.secondary)}>
                {purchaseOrder.supplier?.external_name || 'N/A'}
              </div>
            </div>
            <div>
              <div className={cn(ds.typography.size.xs, ds.colors.text.quaternary, 'mb-1')}>
                Status
              </div>
              <div className={cn(ds.typography.size.sm, ds.colors.text.secondary)}>
                {purchaseOrder.status}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Items to Receive */}
      {receivableItems.length === 0 ? (
        <div className={cn('text-center py-8', ds.colors.text.tertiary)}>
          <Package size={48} className="mx-auto mb-3 opacity-20" />
          <p className={cn(ds.typography.size.sm)}>All items have been received</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className={cn(ds.typography.size.xs, ds.colors.text.quaternary, 'mb-2')}>
            Receiving {totalReceiving} units across {receivableItems.length} items
          </div>

          {receivableItems.map((item) => {
            const data = receiveData[item.id] || {
              po_item_id: item.id,
              quantity_received: 0,
              condition: 'good' as const,
              quality_notes: '',
              notes: '',
            };

            return (
              <div
                key={item.id}
                className={cn(
                  'rounded-lg border p-3',
                  ds.colors.bg.secondary,
                  ds.colors.border.default
                )}
              >
                {/* Product Info */}
                <div className="mb-3">
                  <h4 className={cn(ds.typography.size.sm, ds.colors.text.secondary, 'mb-1')}>
                    {item.product?.name || 'Unknown Product'}
                  </h4>
                  <div className={cn(ds.typography.size.xs, ds.colors.text.tertiary)}>
                    {item.product?.sku && `SKU: ${item.product.sku} • `}
                    Ordered: {item.quantity} • Received: {item.quantity_received} • Remaining:{' '}
                    {item.quantity_remaining}
                  </div>
                </div>

                {/* Quantity Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={cn(ds.typography.size.xs, ds.colors.text.quaternary, 'mb-1 block')}>
                      Quantity Receiving *
                    </label>
                    <Input
                      type="number"
                      value={data.quantity_received}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                      min={0}
                      max={item.quantity_remaining}
                      step={0.01}
                      
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className={cn(ds.typography.size.xs, ds.colors.text.quaternary, 'mb-1 block')}>
                      Condition *
                    </label>
                    <select
                      value={data.condition}
                      onChange={(e) => handleConditionChange(item.id, e.target.value)}
                      className={cn(
                        'w-full rounded-lg px-3 py-2 text-sm',
                        'bg-white/5 border border-white/10',
                        'text-white',
                        'focus:outline-none focus:ring-2 focus:ring-primary-500/50'
                      )}
                    >
                      {CONDITION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Condition Indicator */}
                {data.condition !== 'good' && (
                  <div
                    className={cn(
                      'flex items-center gap-2 p-2 rounded text-xs mb-2',
                      data.condition === 'damaged' && 'bg-yellow-500/10 text-yellow-400',
                      data.condition === 'expired' && 'bg-orange-500/10 text-orange-400',
                      data.condition === 'rejected' && 'bg-red-500/10 text-red-400'
                    )}
                  >
                    <AlertCircle size={12} />
                    {CONDITION_OPTIONS.find((o) => o.value === data.condition)?.description}
                  </div>
                )}

                {/* Quality Notes (required for non-good condition) */}
                {data.condition !== 'good' && (
                  <div className="mb-2">
                    <label className={cn(ds.typography.size.xs, ds.colors.text.quaternary, 'mb-1 block')}>
                      Quality Notes * (Required for {data.condition} items)
                    </label>
                    <Input
                      value={data.quality_notes}
                      onChange={(e) => handleNotesChange(item.id, 'quality_notes', e.target.value)}
                      placeholder="Describe the issue..."
                    />
                  </div>
                )}

                {/* Additional Notes (optional) */}
                <div>
                  <label className={cn(ds.typography.size.xs, ds.colors.text.quaternary, 'mb-1 block')}>
                    Additional Notes
                  </label>
                  <Input
                    value={data.notes}
                    onChange={(e) => handleNotesChange(item.id, 'notes', e.target.value)}
                    placeholder="Optional notes..."
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
