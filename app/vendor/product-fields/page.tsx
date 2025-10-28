"use client";

import { useState, useEffect } from 'react';
import { useAppAuth } from '@/context/AppAuthContext';
import { Plus, Edit2, Trash2, Save, X, Layers, Lock } from 'lucide-react';
import { showSuccess, showError } from '@/components/NotificationToast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

interface FieldDefinition {
  type: string;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  suffix?: string;
}

interface VendorProductField {
  id: string;
  fieldId: string;
  definition: FieldDefinition;
  categoryId?: string;
  sortOrder: number;
  source: 'vendor';
}

interface AdminFieldGroup {
  id: string;
  name: string;
  slug: string;
  description: string;
  fields: any[];
  scope: string;
  isRequired: boolean;
  category?: any;
  source: 'admin';
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Dropdown' },
  { value: 'multiselect', label: 'Multi Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'date', label: 'Date' },
  { value: 'url', label: 'URL' },
  { value: 'color', label: 'Color Picker' },
  { value: 'image', label: 'Image Upload' },
];

export default function VendorProductFieldsPage() {
  const { vendor } = useAppAuth();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [adminFields, setAdminFields] = useState<AdminFieldGroup[]>([]);
  const [vendorFields, setVendorFields] = useState<VendorProductField[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingField, setEditingField] = useState<Partial<VendorProductField> | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  async function loadData() {
    try {
      setLoading(true);
      const vendorId = vendor?.id;

      // Load categories
      const categoriesRes = await fetch('/api/supabase/categories');
      const categoriesData = await categoriesRes.json();
      if (categoriesData.success) {
        setCategories(categoriesData.categories || []);
      }

      // Load product fields
      const url = selectedCategory
        ? `/api/vendor/product-fields?category_id=${selectedCategory}`
        : '/api/vendor/product-fields';
      
      const fieldsRes = await fetch(url, {
        headers: { 'x-vendor-id': vendorId! }
      });
      
      const fieldsData = await fieldsRes.json();
      
      if (fieldsData.success) {
        setAdminFields(fieldsData.adminFields || []);
        setVendorFields(fieldsData.vendorFields || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveField() {
    if (!editingField?.fieldId || !editingField?.definition) {
      showError('Field ID and definition are required');
      return;
    }

    try {
      const vendorId = vendor?.id;
      const method = editingField.id ? 'PUT' : 'POST';
      
      const res = await fetch('/api/vendor/product-fields', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendorId!
        },
        body: JSON.stringify({
          id: editingField.id,
          field_id: editingField.fieldId,
          field_definition: editingField.definition,
          category_id: selectedCategory || null
        })
      });

      const data = await res.json();

      if (data.success) {
        showSuccess(editingField.id ? 'Field updated' : 'Field created');
        setShowAddModal(false);
        setEditingField(null);
        loadData();
      } else {
        showError(data.error || 'Failed to save field');
      }
    } catch (error) {
      console.error('Error saving field:', error);
      showError('Failed to save field');
    }
  }

  async function handleDeleteField(fieldId: string) {
    if (!confirm('Are you sure you want to delete this field?')) return;

    try {
      const vendorId = vendor?.id;
      const res = await fetch(`/api/vendor/product-fields?id=${fieldId}`, {
        method: 'DELETE',
        headers: { 'x-vendor-id': vendorId! }
      });

      const data = await res.json();

      if (data.success) {
        showSuccess('Field deleted successfully');
        loadData();
      } else {
        showError(data.error || 'Failed to delete field');
      }
    } catch (error) {
      console.error('Error deleting field:', error);
      showError('Failed to delete field');
    }
  }

  function handleNewField() {
    setEditingField({
      fieldId: '',
      definition: {
        type: 'text',
        label: '',
        placeholder: '',
        description: '',
        required: false
      },
      source: 'vendor'
    });
    setShowAddModal(true);
  }

  function handleEditField(field: VendorProductField) {
    setEditingField({ ...field });
    setShowAddModal(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 lg:px-0">
      

      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl font-thin text-white/90 tracking-tight mb-2">
          Product Fields
        </h1>
        <p className="text-white/40 text-xs font-light tracking-wide">
          MANAGE CUSTOM PRODUCT ATTRIBUTES · ADMIN REQUIRED FIELDS
        </p>
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex items-center gap-4">
          <label className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">
            Filter by Category
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-black/20 border border-white/10 px-4 py-3 text-white rounded-[14px] text-sm focus:outline-none focus:border-white/30 transition-all duration-300"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Admin Required Fields */}
        {adminFields.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-white/40" />
                <CardTitle>Required Fields</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white/40 mb-4 font-light">
                These fields are required by the platform admin. You cannot edit or remove these fields.
              </p>
              
              <div className="space-y-3">
                {adminFields.map((group) => (
                  <div key={group.id} className="bg-black/20 border border-white/10 rounded-[20px] p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-medium text-sm text-white/90">{group.name}</h3>
                      {group.isRequired && (
                        <Badge variant="primary">Required</Badge>
                      )}
                    </div>
                    
                    {group.description && (
                      <p className="text-xs text-white/50 mb-3 font-light">{group.description}</p>
                    )}
                    
                    <div className="space-y-2">
                      {group.fields.map((field, idx) => (
                        <div key={idx} className="bg-white/5 rounded-[10px] p-3 text-sm flex items-center justify-between hover:bg-white/10 transition-all duration-300">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-white/90">{field.name}</span>
                              <Badge variant="secondary">{field.type}</Badge>
                              {field.required && (
                                <span className="text-xs text-white/60">*</span>
                              )}
                            </div>
                            {field.description && (
                              <p className="text-xs text-white/40 font-light">{field.description}</p>
                            )}
                          </div>
                          <Lock className="w-4 h-4 text-white/20" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vendor Custom Fields */}
        <Card className="">
          <CardHeader action={
            <Button variant="primary" icon={Plus} onClick={handleNewField}>
              Add Custom Field
            </Button>
          }>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-white/60" />
              <CardTitle>Your Custom Fields</CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-white/40 mb-4 font-light">
              Create custom fields specific to your products. These will be shown in addition to any required admin fields.
            </p>

            {vendorFields.length === 0 ? (
              <EmptyState
                icon={Layers}
                title="No custom fields yet"
                description="Create your first custom field to get started"
                action={
                  <Button variant="secondary" icon={Plus} onClick={handleNewField}>
                    Add Custom Field
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {vendorFields.map((field) => (
                  <div key={field.id} className="bg-black/20 border border-white/10 rounded-[20px] p-4 hover:border-white/20 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-sm text-white/90">{field.definition.label}</h3>
                          <Badge variant="secondary">{field.definition.type}</Badge>
                          {field.definition.required && (
                            <Badge variant="ghost">Required</Badge>
                          )}
                        </div>
                        
                        <div className="text-xs text-white/50 space-y-1 font-light">
                          <div>ID: <span className="font-mono text-white/60">{field.fieldId}</span></div>
                          {field.definition.description && (
                            <div>{field.definition.description}</div>
                          )}
                          {field.definition.placeholder && (
                            <div className="text-white/40">Placeholder: {field.definition.placeholder}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditField(field)}
                          className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all duration-300"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteField(field.id)}
                          className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all duration-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      

      {/* Add/Edit Field Modal */}
      {showAddModal && editingField && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="minimal-glass subtle-glow w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" style={{ background: 'rgba(0, 0, 0, 0.95)' }}>
            <div className="p-6 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-thin tracking-tight">
                {editingField.id ? 'Edit Field' : 'New Custom Field'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingField(null);
                }}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <Input
                type="text"
                label="Field ID *"
                value={editingField.fieldId || ''}
                onChange={(value) => setEditingField({ 
                  ...editingField, 
                  fieldId: value.toLowerCase().replace(/\s+/g, '_') 
                })}
                placeholder="e.g., harvest_date"
                disabled={!!editingField.id}
                className="font-mono"
              />
              <p className="text-xs text-white/40 -mt-2 font-light">
                Unique identifier for this field (cannot be changed after creation)
              </p>

              <Input
                type="text"
                label="Label *"
                value={editingField.definition?.label || ''}
                onChange={(value) => setEditingField({
                  ...editingField,
                  definition: { ...editingField.definition!, label: value }
                })}
                placeholder="e.g., Harvest Date"
              />

              <div className="space-y-2">
                <label className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">
                  Field Type *
                </label>
                <select
                  value={editingField.definition?.type || 'text'}
                  onChange={(e) => setEditingField({
                    ...editingField,
                    definition: { ...editingField.definition!, type: e.target.value }
                  })}
                  className="w-full bg-black/20 border border-white/10 px-4 py-3 text-white rounded-[14px] text-sm focus:outline-none focus:border-white/30 transition-all duration-300"
                >
                  {FIELD_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                type="text"
                label="Placeholder"
                value={editingField.definition?.placeholder || ''}
                onChange={(value) => setEditingField({
                  ...editingField,
                  definition: { ...editingField.definition!, placeholder: value }
                })}
                placeholder="Hint text shown in the field"
              />

              <div className="space-y-2">
                <label className="text-white/40 text-[11px] uppercase tracking-[0.2em] font-light">
                  Description
                </label>
                <textarea
                  value={editingField.definition?.description || ''}
                  onChange={(e) => setEditingField({
                    ...editingField,
                    definition: { ...editingField.definition!, description: e.target.value }
                  })}
                  className="w-full bg-black/20 border border-white/10 px-4 py-3 text-white rounded-[14px] text-sm focus:outline-none focus:border-white/30 transition-all duration-300 h-20 resize-none"
                  placeholder="Help text for this field"
                />
              </div>

              {editingField.definition?.type === 'number' && (
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    type="number"
                    label="Min"
                    value={String(editingField.definition?.min || '')}
                    onChange={(value) => setEditingField({
                      ...editingField,
                      definition: { ...editingField.definition!, min: parseFloat(value) }
                    })}
                  />
                  <Input
                    type="number"
                    label="Max"
                    value={String(editingField.definition?.max || '')}
                    onChange={(value) => setEditingField({
                      ...editingField,
                      definition: { ...editingField.definition!, max: parseFloat(value) }
                    })}
                  />
                  <Input
                    type="text"
                    label="Suffix"
                    value={editingField.definition?.suffix || ''}
                    onChange={(value) => setEditingField({
                      ...editingField,
                      definition: { ...editingField.definition!, suffix: value }
                    })}
                    placeholder="e.g., %"
                  />
                </div>
              )}

              {(editingField.definition?.type === 'select' || editingField.definition?.type === 'multiselect') && (
                <Input
                  type="text"
                  label="Options (comma separated)"
                  value={(editingField.definition?.options || []).join(', ')}
                  onChange={(value) => setEditingField({
                    ...editingField,
                    definition: {
                      ...editingField.definition!,
                      options: value.split(',').map(o => o.trim()).filter(Boolean)
                    }
                  })}
                  placeholder="Option 1, Option 2, Option 3"
                />
              )}

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingField.definition?.required || false}
                    onChange={(e) => setEditingField({
                      ...editingField,
                      definition: { ...editingField.definition!, required: e.target.checked }
                    })}
                    className="w-4 h-4 rounded border-white/10"
                  />
                  <span className="text-sm font-light">Required field</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex justify-end gap-3 flex-shrink-0">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingField(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={Save}
                onClick={handleSaveField}
              >
                Save Field
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

