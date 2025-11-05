"use client";

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface AddCustomFieldButtonProps {
  sectionKey: string;
  vendorId: string;
  onFieldAdded: () => void;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'color', label: 'Color' },
  { value: 'boolean', label: 'Checkbox' },
  { value: 'image', label: 'Image' },
  { value: 'url', label: 'URL' },
];

export function AddCustomFieldButton({ sectionKey, vendorId, onFieldAdded }: AddCustomFieldButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [newField, setNewField] = useState({
    field_id: '',
    label: '',
    type: 'text',
    placeholder: '',
  });
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!newField.field_id || !newField.label) {
      alert('Field ID and Label are required');
      return;
    }

    try {
      setSaving(true);

      const fieldDefinition: any = {
        type: newField.type,
        label: newField.label,
      };

      if (newField.placeholder) {
        fieldDefinition.placeholder = newField.placeholder;
      }

      const response = await fetch('/api/vendor/custom-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendorId
        },
        body: JSON.stringify({
          section_key: sectionKey,
          field_id: newField.field_id,
          field_definition: fieldDefinition
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowModal(false);
        setNewField({ field_id: '', label: '', type: 'text', placeholder: '' });
        onFieldAdded();
        alert('✅ Custom field added! Refresh to see it.');
      } else {
        alert(data.error || 'Failed to add field');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to add field');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors"
      >
        <Plus size={12} />
        Add Custom Field
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-lg max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Add Custom Field</h3>
              <button onClick={() => setShowModal(false)} className="text-white/60 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-white/80 mb-1 text-sm">Field ID *</label>
                <input
                  type="text"
                  value={newField.field_id}
                  onChange={(e) => setNewField({ ...newField, field_id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
                  placeholder="my_custom_field"
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-white/80 mb-1 text-sm">Label *</label>
                <input
                  type="text"
                  value={newField.label}
                  onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                  placeholder="My Custom Field"
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-white/80 mb-1 text-sm">Type</label>
                <select
                  value={newField.type}
                  onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 text-white text-sm"
                >
                  {FIELD_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white/80 mb-1 text-sm">Placeholder</label>
                <input
                  type="text"
                  value={newField.placeholder}
                  onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                  placeholder="Optional hint text"
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 text-white text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={saving || !newField.field_id || !newField.label}
                className="flex-1 bg-white text-black px-4 py-2 rounded text-sm hover:bg-white/90 disabled:opacity-50"
              >
                {saving ? 'Adding...' : 'Add Field'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

