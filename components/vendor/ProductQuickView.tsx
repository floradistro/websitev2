'use client';

/**
 * ProductQuickView - Clean, Jobs-worthy modal for editing products
 * Simplified from 978 lines to <400 lines
 * Focus: Edit basic info quickly, link to full editor for complex tasks
 */

import { useState, useEffect } from 'react';
import { X, Save, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { showNotification, showConfirm } from '@/components/NotificationToast';
import { Button, Input, Textarea, Modal, ds, cn } from '@/components/ds';
import axios from 'axios';

interface ProductQuickViewProps {
  product: any;
  vendorId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onDelete: () => void;
}

export function ProductQuickView({ product, vendorId, isOpen, onClose, onSave, onDelete }: ProductQuickViewProps) {
  const [editedProduct, setEditedProduct] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load product data when modal opens
  useEffect(() => {
    if (isOpen && product?.id) {
      setLoading(true);
      axios.get(`/api/vendor/products/${product.id}`, {
        headers: { 'x-vendor-id': vendorId }
      })
        .then(response => {
          if (response.data.success) {
            const p = response.data.product;
            setEditedProduct({
              name: p.name || '',
              sku: p.sku || '',
              regular_price: p.regular_price || p.price || 0,
              cost_price: p.cost_price || 0,
              description: p.description || '',
              status: p.status || 'draft'
            });
          }
        })
        .catch(error => {
          showNotification({
            type: 'error',
            title: 'Load Failed',
            message: 'Failed to load product details'
          });
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, product?.id, vendorId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await axios.put(
        `/api/vendor/products/${product.id}`,
        editedProduct,
        { headers: { 'x-vendor-id': vendorId } }
      );

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Saved',
          message: 'Product updated successfully'
        });
        onSave();
        onClose();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Save Failed',
        message: error.response?.data?.error || 'Failed to save product'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await showConfirm({
      title: 'Delete Product',
      message: `Delete "${product.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      try {
        await axios.delete(`/api/vendor/products/${product.id}`, {
          headers: { 'x-vendor-id': vendorId }
        });
        showNotification({
          type: 'success',
          title: 'Deleted',
          message: 'Product deleted successfully'
        });
        onDelete();
        onClose();
      } catch (error: any) {
        showNotification({
          type: 'error',
          title: 'Delete Failed',
          message: error.response?.data?.error || 'Failed to delete product'
        });
      }
    }
  };

  const hasChanges = Object.keys(editedProduct).length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Product"
      size="lg"
    >
      {loading ? (
        <div className="py-12 text-center">
          <div className={cn(ds.typography.size.xs, ds.colors.text.quaternary, ds.typography.transform.uppercase, ds.typography.tracking.wide)}>
            Loading...
          </div>
        </div>
      ) : (
        <>
          {/* Header with status badge */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={cn(ds.typography.size.base, ds.typography.weight.medium, "text-white/90")}>
                {product.name}
              </h2>
              <p className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "mt-0.5")}>
                SKU: {product.sku}
              </p>
            </div>
            <div className={cn(
              "px-3 py-1.5 rounded-full border",
              ds.typography.size.micro,
              ds.typography.transform.uppercase,
              ds.typography.tracking.wide,
              editedProduct.status === 'published' ? 'bg-green-500/10 text-green-400/70 border-green-500/20' :
              editedProduct.status === 'pending' ? 'bg-orange-500/10 text-orange-400/70 border-orange-500/20' :
              'bg-white/5 text-white/40 border-white/10'
            )}>
              {editedProduct.status}
            </div>
          </div>

          {/* Quick Edit Form */}
          <div className="space-y-4 mb-6">
            <div>
              <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                Product Name
              </label>
              <Input
                value={editedProduct.name || ''}
                onChange={(e) => setEditedProduct({ ...editedProduct, name: e.target.value })}
                placeholder="Enter product name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                  Regular Price
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={editedProduct.regular_price || ''}
                  onChange={(e) => setEditedProduct({ ...editedProduct, regular_price: parseFloat(e.target.value) })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                  Cost Price
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={editedProduct.cost_price || ''}
                  onChange={(e) => setEditedProduct({ ...editedProduct, cost_price: parseFloat(e.target.value) })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                Description
              </label>
              <Textarea
                value={editedProduct.description || ''}
                onChange={(e) => setEditedProduct({ ...editedProduct, description: e.target.value })}
                placeholder="Product description"
                rows={3}
              />
            </div>

            <div>
              <label className={cn(ds.typography.size.xs, ds.colors.text.tertiary, "block mb-1.5")}>
                Status
              </label>
              <select
                value={editedProduct.status || 'draft'}
                onChange={(e) => setEditedProduct({ ...editedProduct, status: e.target.value })}
                className={cn(
                  "w-full px-3 py-2 rounded-lg",
                  ds.typography.size.xs,
                  ds.colors.bg.primary,
                  ds.colors.border.default,
                  "border text-white/90",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                )}
              >
                <option value="draft">Draft</option>
                <option value="pending">Pending Review</option>
                <option value="published">Published</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Advanced edit link */}
          <div className={cn("p-4 rounded-lg mb-6", ds.colors.bg.elevated, ds.colors.border.default, "border")}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(ds.typography.size.xs, "text-white/80")}>
                  Need to edit pricing tiers, images, or custom fields?
                </p>
                <p className={cn(ds.typography.size.micro, ds.colors.text.quaternary, "mt-0.5")}>
                  Use the full editor for advanced options
                </p>
              </div>
              <Link href={`/vendor/products/${product.id}/edit`}>
                <Button variant="secondary" size="sm">
                  <ExternalLink className="w-3 h-3 mr-1.5" />
                  Full Editor
                </Button>
              </Link>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: ds.colors.border.default }}>
            <button
              onClick={handleDelete}
              className={cn(
                "px-4 py-2 rounded-lg transition-colors",
                ds.typography.size.xs,
                ds.typography.transform.uppercase,
                ds.typography.tracking.wide,
                "text-red-400/70 hover:bg-red-500/10",
                "focus:outline-none focus:ring-2 focus:ring-red-500/50"
              )}
            >
              <Trash2 className="w-3 h-3 inline mr-1.5" />
              Delete
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className={cn(
                  "px-4 py-2 rounded-lg transition-colors",
                  ds.typography.size.xs,
                  ds.typography.transform.uppercase,
                  ds.typography.tracking.wide,
                  ds.colors.text.tertiary,
                  "hover:text-white/80",
                  "focus:outline-none focus:ring-2 focus:ring-white/20"
                )}
              >
                Cancel
              </button>

              <Button
                onClick={handleSave}
                disabled={saving || !hasChanges}
              >
                <Save className="w-3 h-3 mr-1.5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}
