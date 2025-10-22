"use client";

import { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import { showNotification, showConfirm } from '@/components/NotificationToast';
import AdminModal from '@/components/AdminModal';

interface FieldGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  fields: Field[];
  is_active: boolean;
  display_order: number;
  created_at: string;
}

interface Field {
  name: string;
  slug: string;
  type: string;
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: string[];
  min?: number;
  max?: number;
  suffix?: string;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Dropdown' },
  { value: 'multiselect', label: 'Multi-Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'date', label: 'Date' },
  { value: 'url', label: 'URL' },
  { value: 'color', label: 'Color' },
  { value: 'image', label: 'Image Upload' },
];

export default function FieldGroups() {
  const [fieldGroups, setFieldGroups] = useState<FieldGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<FieldGroup | null>(null);
  const [newGroup, setNewGroup] = useState({
    name: '',
    slug: '',
    description: '',
  });
  const [fields, setFields] = useState<Field[]>([]);

  useEffect(() => {
    loadFieldGroups();
  }, []);

  async function loadFieldGroups() {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/field-groups');
      if (response.data.success) {
        setFieldGroups(response.data.field_groups || []);
      }
    } catch (error) {
      console.error('Error loading field groups:', error);
    } finally {
      setLoading(false);
    }
  }

  function addField() {
    setFields([...fields, {
      name: '',
      slug: '',
      type: 'text',
      required: false,
    }]);
  }

  function updateField(index: number, updates: Partial<Field>) {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  }

  function removeField(index: number) {
    setFields(fields.filter((_, i) => i !== index));
  }

  async function createFieldGroup() {
    if (!newGroup.name || fields.length === 0) {
      showNotification({
        type: 'error',
        title: 'Missing Fields',
        message: 'Name and at least one field are required'
      });
      return;
    }

    try {
      const response = await axios.post('/api/admin/field-groups', {
        action: 'create',
        ...newGroup,
        slug: newGroup.slug || newGroup.name.toLowerCase().replace(/\s+/g, '-'),
        fields
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Field Group Created',
          message: `${newGroup.name} has been created`
        });
        setShowAddModal(false);
        setNewGroup({ name: '', slug: '', description: '' });
        setFields([]);
        loadFieldGroups();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Failed to create field group'
      });
    }
  }

  async function deleteFieldGroup(id: string, name: string) {
    const confirmed = await showConfirm({
      title: 'Delete Field Group',
      message: `Delete "${name}"? This will not delete product data, only the field template.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: () => {},
    });

    if (!confirmed) return;

    try {
      const response = await axios.post('/api/admin/field-groups', {
        action: 'delete',
        field_group_id: id
      });

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Field Group Deleted',
          message: 'Field group deleted successfully'
        });
        loadFieldGroups();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Failed to delete field group'
      });
    }
  }

  return (
    <div className="w-full animate-fadeIn px-4 lg:px-0">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl lg:text-3xl text-white font-light tracking-tight mb-2">Field Groups</h1>
          <p className="text-white/50 text-sm">Manage custom fields for product categories</p>
        </div>
        <button
          onClick={() => {
            setShowAddModal(true);
            setFields([]);
          }}
          className="flex items-center gap-2 bg-white text-black px-4 py-2.5 lg:px-5 lg:py-3 text-xs font-medium uppercase tracking-wider hover:bg-white/90 transition-all whitespace-nowrap flex-shrink-0"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Add Field Group</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Field Groups List */}
      {loading ? (
        <div className="bg-[#111111] border border-white/10 p-12 text-center -mx-4 lg:mx-0">
          <div className="text-white/40 text-sm">Loading...</div>
        </div>
      ) : fieldGroups.length === 0 ? (
        <div className="bg-[#111111] border border-white/10 p-12 text-center -mx-4 lg:mx-0">
          <Layers size={32} className="text-white/20 mx-auto mb-3" />
          <div className="text-white/60 text-sm mb-4">No field groups found</div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-white text-black px-6 py-3 text-xs font-medium uppercase tracking-wider hover:bg-white/90 transition-all"
          >
            Create First Field Group
          </button>
        </div>
      ) : (
        <div className="space-y-4 -mx-4 lg:mx-0">
          {fieldGroups.map(group => (
            <div
              key={group.id}
              className="bg-[#111111] border border-white/10 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-white text-lg font-medium mb-1">{group.name}</h3>
                  {group.description && (
                    <p className="text-white/60 text-sm">{group.description}</p>
                  )}
                  <span className="inline-block mt-2 text-xs px-2 py-1 bg-white/5 text-white/40 border border-white/10">
                    {group.fields.length} field{group.fields.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => deleteFieldGroup(group.id, group.name)}
                    className="p-2 text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Fields Preview */}
              <div className="space-y-2">
                {group.fields.map((field, idx) => (
                  <div key={idx} className="bg-[#0a0a0a] border border-white/10 p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium">{field.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 bg-white/5 text-white/60 border border-white/10">
                          {field.type}
                        </span>
                        {field.required && (
                          <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                    {field.description && (
                      <p className="text-white/40 text-xs">{field.description}</p>
                    )}
                    {field.options && field.options.length > 0 && (
                      <p className="text-white/40 text-xs mt-1">
                        Options: {field.options.join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Field Group Modal */}
      <AdminModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setNewGroup({ name: '', slug: '', description: '' });
          setFields([]);
        }}
        title="Create Field Group"
        description="Define a set of custom fields for products"
        onSubmit={createFieldGroup}
        submitText="Create Field Group"
        maxWidth="4xl"
      >
        <div className="space-y-6">
          {/* Group Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Group Name *</label>
              <input
                type="text"
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                placeholder="e.g., Cannabis Flower"
                className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-white/60 text-xs uppercase tracking-wider mb-2">Description</label>
              <textarea
                value={newGroup.description}
                onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                placeholder="Describe what these fields are for..."
                rows={2}
                className="w-full bg-[#111111] border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-white/20 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Fields */}
          <div className="border-t border-white/10 pt-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-white text-sm font-medium">Fields</label>
              <button
                type="button"
                onClick={addField}
                className="flex items-center gap-2 px-3 py-1.5 text-xs bg-white/10 text-white hover:bg-white/20 transition-all"
              >
                <Plus size={14} />
                Add Field
              </button>
            </div>

            {fields.length === 0 ? (
              <div className="bg-white/5 border border-white/10 p-6 text-center">
                <p className="text-white/40 text-sm">No fields added yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {fields.map((field, index) => (
                  <div key={index} className="bg-[#0a0a0a] border border-white/10 p-4">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-white/60 text-xs mb-1">Field Name *</label>
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => {
                            const name = e.target.value;
                            const slug = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                            updateField(index, { name, slug });
                          }}
                          placeholder="THC Percentage"
                          className="w-full bg-[#111111] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-white/20 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-xs mb-1">Type *</label>
                        <select
                          value={field.type}
                          onChange={(e) => updateField(index, { type: e.target.value })}
                          className="w-full bg-[#111111] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-white/20 transition-colors"
                        >
                          {FIELD_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="block text-white/60 text-xs mb-1">Description</label>
                      <input
                        type="text"
                        value={field.description || ''}
                        onChange={(e) => updateField(index, { description: e.target.value })}
                        placeholder="Help text for vendors"
                        className="w-full bg-[#111111] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-white/20 transition-colors"
                      />
                    </div>

                    {(field.type === 'select' || field.type === 'multiselect') && (
                      <div className="mb-3">
                        <label className="block text-white/60 text-xs mb-1">Options (comma-separated)</label>
                        <input
                          type="text"
                          value={field.options?.join(', ') || ''}
                          onChange={(e) => updateField(index, { 
                            options: e.target.value.split(',').map(o => o.trim()).filter(Boolean)
                          })}
                          placeholder="Option 1, Option 2, Option 3"
                          className="w-full bg-[#111111] border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-white/20 transition-colors"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(index, { required: e.target.checked })}
                        />
                        <span className="text-white/60 text-xs">Required field</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => removeField(index)}
                        className="p-1.5 text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AdminModal>
    </div>
  );
}

