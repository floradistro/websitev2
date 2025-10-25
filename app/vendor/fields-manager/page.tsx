"use client";

import { useState, useEffect } from 'react';
import { useVendorAuth } from '@/context/VendorAuthContext';
import { Plus, Trash2, Edit2, Save, X, Sparkles } from 'lucide-react';

interface CustomField {
  id: string;
  section_key: string;
  field_id: string;
  field_definition: {
    type: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    helper_text?: string;
    max_length?: number;
    min?: number;
    max?: number;
    options?: string[];
    [key: string]: any;
  };
  created_at: string;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'color', label: 'Color Picker' },
  { value: 'boolean', label: 'Checkbox' },
  { value: 'select', label: 'Dropdown' },
  { value: 'image', label: 'Image Upload' },
  { value: 'url', label: 'URL' },
  { value: 'array', label: 'Repeatable Items' },
];

export default function FieldsManagerPage() {
  const { vendor } = useVendorAuth();
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newField, setNewField] = useState({
    section_key: 'hero',
    field_id: '',
    type: 'text',
    label: '',
    placeholder: '',
    helper_text: '',
    required: false,
  });

  useEffect(() => {
    loadCustomFields();
  }, []);

  async function loadCustomFields() {
    try {
      setLoading(true);
      const vendorId = localStorage.getItem('vendor_id');
      
      const response = await fetch('/api/vendor/custom-fields', {
        headers: { 'x-vendor-id': vendorId! }
      });
      
      const data = await response.json();
      if (data.success) {
        setCustomFields(data.customFields || []);
      }
    } catch (error) {
      console.error('Error loading custom fields:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddField() {
    try {
      const vendorId = localStorage.getItem('vendor_id');
      
      const fieldDefinition: any = {
        type: newField.type,
        label: newField.label,
      };

      if (newField.placeholder) fieldDefinition.placeholder = newField.placeholder;
      if (newField.helper_text) fieldDefinition.helper_text = newField.helper_text;
      if (newField.required) fieldDefinition.required = true;

      const response = await fetch('/api/vendor/custom-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendorId!
        },
        body: JSON.stringify({
          section_key: newField.section_key,
          field_id: newField.field_id,
          field_definition: fieldDefinition
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowAddModal(false);
        setNewField({
          section_key: 'hero',
          field_id: '',
          type: 'text',
          label: '',
          placeholder: '',
          helper_text: '',
          required: false,
        });
        loadCustomFields();
        alert('✅ Custom field added successfully!');
      } else {
        alert(data.error || 'Failed to add custom field');
      }
    } catch (error) {
      console.error('Error adding custom field:', error);
      alert('Failed to add custom field');
    }
  }

  async function handleDeleteField(fieldId: string) {
    if (!confirm('Delete this custom field? Values will be preserved but field won\'t be editable anymore.')) {
      return;
    }

    try {
      const vendorId = localStorage.getItem('vendor_id');
      
      const response = await fetch(`/api/vendor/custom-fields?id=${fieldId}`, {
        method: 'DELETE',
        headers: { 'x-vendor-id': vendorId! }
      });

      const data = await response.json();

      if (data.success) {
        loadCustomFields();
        alert('✅ Custom field removed');
      } else {
        alert(data.error || 'Failed to delete custom field');
      }
    } catch (error) {
      console.error('Error deleting custom field:', error);
      alert('Failed to delete custom field');
    }
  }

  // Group fields by section
  const fieldsBySection = customFields.reduce((acc, field) => {
    if (!acc[field.section_key]) {
      acc[field.section_key] = [];
    }
    acc[field.section_key].push(field);
    return acc;
  }, {} as Record<string, CustomField[]>);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Custom Fields</h1>
            <p className="text-white/60">Extend your sections with custom fields</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-white text-black px-6 py-3 rounded-lg hover:bg-white/90 transition-colors flex items-center gap-2 font-medium"
          >
            <Plus size={20} />
            Add Custom Field
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
          <div className="flex gap-3">
            <Sparkles className="text-purple-400 flex-shrink-0" size={20} />
            <div>
              <p className="text-purple-400 font-medium text-sm mb-1">Infinite Customization</p>
              <p className="text-white/60 text-sm">
                Add any custom field to any section. Want a promotional badge on your hero? A countdown timer? 
                Video backgrounds? Just define it here and start using it immediately.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Field Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-black border border-white/10 rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Add Custom Field</h2>
              <button onClick={() => setShowAddModal(false)} className="text-white/60 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Section Selection */}
              <div>
                <label className="block text-white/80 mb-2 text-sm">Apply to Section</label>
                <select
                  value={newField.section_key}
                  onChange={(e) => setNewField({ ...newField, section_key: e.target.value })}
                  className="w-full bg-black/98 border border-white/10 rounded-[14px] px-4 py-2 text-white"
                >
                  <option value="hero">Hero</option>
                  <option value="process">Process Steps</option>
                  <option value="featured_products">Featured Products</option>
                  <option value="reviews">Reviews</option>
                  <option value="locations">Locations</option>
                  <option value="about_story">About Story</option>
                  <option value="footer">Footer</option>
                  <option value="global">All Sections (Global)</option>
                </select>
              </div>

              {/* Field ID */}
              <div>
                <label className="block text-white/80 mb-2 text-sm">
                  Field ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newField.field_id}
                  onChange={(e) => setNewField({ ...newField, field_id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                  placeholder="promotional_badge"
                  className="w-full bg-black/98 border border-white/10 rounded-[14px] px-4 py-2 text-white font-mono"
                />
                <p className="text-white/40 text-xs mt-1">Lowercase, underscores only (e.g., promo_badge, video_url)</p>
              </div>

              {/* Field Label */}
              <div>
                <label className="block text-white/80 mb-2 text-sm">
                  Field Label <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newField.label}
                  onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                  placeholder="Promotional Badge"
                  className="w-full bg-black/98 border border-white/10 rounded-[14px] px-4 py-2 text-white"
                />
                <p className="text-white/40 text-xs mt-1">What users see in the editor</p>
              </div>

              {/* Field Type */}
              <div>
                <label className="block text-white/80 mb-2 text-sm">Field Type</label>
                <select
                  value={newField.type}
                  onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                  className="w-full bg-black/98 border border-white/10 rounded-[14px] px-4 py-2 text-white"
                >
                  {FIELD_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Placeholder */}
              <div>
                <label className="block text-white/80 mb-2 text-sm">Placeholder (Optional)</label>
                <input
                  type="text"
                  value={newField.placeholder}
                  onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                  placeholder="e.g., Enter text here..."
                  className="w-full bg-black/98 border border-white/10 rounded-[14px] px-4 py-2 text-white"
                />
              </div>

              {/* Helper Text */}
              <div>
                <label className="block text-white/80 mb-2 text-sm">Helper Text (Optional)</label>
                <textarea
                  value={newField.helper_text}
                  onChange={(e) => setNewField({ ...newField, helper_text: e.target.value })}
                  placeholder="Explain what this field does..."
                  rows={2}
                  className="w-full bg-black/98 border border-white/10 rounded-[14px] px-4 py-2 text-white"
                />
              </div>

              {/* Required */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={newField.required}
                  onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                  className="w-5 h-5"
                />
                <label className="text-white/80 text-sm">Make this field required</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddField}
                disabled={!newField.field_id || !newField.label}
                className="flex-1 bg-white text-black px-4 py-3 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Field
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Fields List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <p className="text-white/60 mt-4">Loading custom fields...</p>
        </div>
      ) : Object.keys(fieldsBySection).length === 0 ? (
        <div className="bg-black border border-white/10 rounded-lg p-12 text-center">
          <Sparkles className="text-white/40 mx-auto mb-4" size={48} />
          <h3 className="text-white font-semibold mb-2">No custom fields yet</h3>
          <p className="text-white/60 mb-6">
            Add custom fields to extend your sections with unique functionality
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-white text-black px-6 py-3 rounded-lg hover:bg-white/90 transition-colors inline-flex items-center gap-2"
          >
            <Plus size={20} />
            Add Your First Custom Field
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(fieldsBySection).map(([sectionKey, fields]) => (
            <div key={sectionKey} className="bg-black border border-white/10 rounded-lg p-6">
              <h3 className="text-white font-semibold mb-4 text-lg capitalize">
                {sectionKey === 'global' ? '🌐 Global (All Sections)' : `${sectionKey} Section`}
              </h3>
              
              <div className="space-y-3">
                {fields.map((field) => (
                  <div key={field.id} className="bg-black/98 border border-white/10 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-white font-medium">{field.field_definition.label}</h4>
                          <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-[14px] text-xs">
                            {field.field_definition.type}
                          </span>
                        </div>
                        <p className="text-white/40 text-sm font-mono">Field ID: {field.field_id}</p>
                        {field.field_definition.helper_text && (
                          <p className="text-white/60 text-sm mt-2">{field.field_definition.helper_text}</p>
                        )}
                        {field.field_definition.placeholder && (
                          <p className="text-white/40 text-xs mt-1">
                            Placeholder: "{field.field_definition.placeholder}"
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteField(field.id)}
                        className="text-red-400 hover:text-red-300 p-2"
                        title="Delete custom field"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Documentation */}
      <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
        <h3 className="text-white font-medium mb-3">💡 How Custom Fields Work</h3>
        <ul className="text-white/60 text-sm space-y-2">
          <li>• Custom fields extend the base section schema with your unique needs</li>
          <li>• Add fields here, then use them immediately in the Live Editor</li>
          <li>• Fields are specific to YOU - other vendors won't see them</li>
          <li>• Global fields apply to all section types</li>
          <li>• Values are saved per section instance in your storefront</li>
        </ul>
      </div>
    </div>
  );
}

