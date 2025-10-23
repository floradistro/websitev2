"use client";

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronUp, Layers, Link as LinkIcon } from 'lucide-react';
import { showSuccess, showError } from '@/components/NotificationToast';

interface Field {
  name: string;
  slug: string;
  type: string;
  required?: boolean;
  placeholder?: string;
  description?: string;
  options?: string[];
  min?: number;
  max?: number;
  suffix?: string;
}

interface FieldGroup {
  id: string;
  name: string;
  slug: string;
  description: string;
  fields: Field[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Assignment {
  id: string;
  category_id: string;
  field_group_id: string;
  is_required: boolean;
  display_order: number;
  category?: Category;
  field_group?: FieldGroup;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Select' },
  { value: 'multiselect', label: 'Multi Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'date', label: 'Date' },
  { value: 'url', label: 'URL' },
  { value: 'color', label: 'Color' },
  { value: 'image', label: 'Image' },
  { value: 'file', label: 'File' }
];

export default function FieldGroupsPage() {
  const [fieldGroups, setFieldGroups] = useState<FieldGroup[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'groups' | 'assignments'>('groups');
  
  // Field Group Editor State
  const [editingGroup, setEditingGroup] = useState<Partial<FieldGroup> | null>(null);
  const [showGroupEditor, setShowGroupEditor] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Assignment Editor State
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFieldGroup, setSelectedFieldGroup] = useState('');
  const [assignmentRequired, setAssignmentRequired] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [groupsRes, categoriesRes, assignmentsRes] = await Promise.all([
        fetch('/api/admin/field-groups'),
        fetch('/api/supabase/categories'),
        fetch('/api/admin/field-groups/assignments')
      ]);

      const groupsData = await groupsRes.json();
      const categoriesData = await categoriesRes.json();
      const assignmentsData = await assignmentsRes.json();

      if (groupsData.success) setFieldGroups(groupsData.field_groups);
      if (categoriesData.success) setCategories(categoriesData.categories);
      if (assignmentsData.success) setAssignments(assignmentsData.assignments);
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  // Field Group CRUD
  function handleNewGroup() {
    setEditingGroup({
      name: '',
      slug: '',
      description: '',
      fields: [],
      is_active: true,
      display_order: 0
    });
    setShowGroupEditor(true);
  }

  function handleEditGroup(group: FieldGroup) {
    setEditingGroup({ ...group });
    setShowGroupEditor(true);
  }

  async function handleSaveGroup() {
    if (!editingGroup?.name || !editingGroup?.slug) {
      showError('Name and slug are required');
      return;
    }

    try {
      const method = editingGroup.id ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/field-groups', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingGroup)
      });

      const data = await res.json();

      if (data.success) {
        showSuccess(`Field group ${editingGroup.id ? 'updated' : 'created'} successfully`);
        setShowGroupEditor(false);
        setEditingGroup(null);
        loadData();
      } else {
        showError(data.error || 'Failed to save field group');
      }
    } catch (error) {
      console.error('Error saving field group:', error);
      showError('Failed to save field group');
    }
  }

  async function handleDeleteGroup(id: string) {
    if (!confirm('Are you sure you want to delete this field group?')) return;

    try {
      const res = await fetch(`/api/admin/field-groups?id=${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (data.success) {
        showSuccess('Field group deleted successfully');
        loadData();
      } else {
        showError(data.error || 'Failed to delete field group');
      }
    } catch (error) {
      console.error('Error deleting field group:', error);
      showError('Failed to delete field group');
    }
  }

  // Field Management within a Group
  function handleAddField() {
    if (!editingGroup) return;
    
    const newField: Field = {
      name: '',
      slug: '',
      type: 'text',
      required: false
    };

    setEditingGroup({
      ...editingGroup,
      fields: [...(editingGroup.fields || []), newField]
    });
  }

  function handleUpdateField(index: number, field: Partial<Field>) {
    if (!editingGroup) return;

    const updatedFields = [...(editingGroup.fields || [])];
    updatedFields[index] = { ...updatedFields[index], ...field };

    setEditingGroup({
      ...editingGroup,
      fields: updatedFields
    });
  }

  function handleRemoveField(index: number) {
    if (!editingGroup) return;

    const updatedFields = [...(editingGroup.fields || [])];
    updatedFields.splice(index, 1);

    setEditingGroup({
      ...editingGroup,
      fields: updatedFields
    });
  }

  // Assignment CRUD
  async function handleCreateAssignment() {
    if (!selectedCategory || !selectedFieldGroup) {
      showError('Please select both category and field group');
      return;
    }

    try {
      const res = await fetch('/api/admin/field-groups/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: selectedCategory,
          field_group_id: selectedFieldGroup,
          is_required: assignmentRequired,
          display_order: 0
        })
      });

      const data = await res.json();

      if (data.success) {
        showSuccess('Field group assigned to category successfully');
        setShowAssignmentModal(false);
        setSelectedCategory('');
        setSelectedFieldGroup('');
        setAssignmentRequired(false);
        loadData();
      } else {
        showError(data.error || 'Failed to create assignment');
      }
    } catch (error) {
      console.error('Error creating assignment:', error);
      showError('Failed to create assignment');
    }
  }

  async function handleDeleteAssignment(id: string) {
    if (!confirm('Are you sure you want to remove this assignment?')) return;

    try {
      const res = await fetch(`/api/admin/field-groups/assignments?id=${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (data.success) {
        showSuccess('Assignment removed successfully');
        loadData();
      } else {
        showError(data.error || 'Failed to remove assignment');
      }
    } catch (error) {
      console.error('Error removing assignment:', error);
      showError('Failed to remove assignment');
    }
  }

  async function handleToggleRequired(assignment: Assignment) {
    try {
      const res = await fetch('/api/admin/field-groups/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: assignment.id,
          is_required: !assignment.is_required
        })
      });

      const data = await res.json();

      if (data.success) {
        showSuccess('Assignment updated successfully');
        loadData();
      } else {
        showError(data.error || 'Failed to update assignment');
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      showError('Failed to update assignment');
    }
  }

  function toggleGroupExpansion(id: string) {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedGroups(newExpanded);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-thin text-white/90 tracking-tight mb-2">Attributes</h1>
          <p className="text-white/40 text-xs font-light tracking-wide">CUSTOM FIELD SETS · CATEGORY ASSIGNMENTS</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab('groups')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'groups'
                ? 'text-white border-b-2 border-white'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Field Groups ({fieldGroups.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === 'assignments'
                ? 'text-white border-b-2 border-white'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              Category Assignments ({assignments.length})
            </div>
          </button>
        </div>

        {/* Field Groups Tab */}
        {activeTab === 'groups' && (
          <div>
            <div className="mb-6">
              <button
                onClick={handleNewGroup}
                className="bg-white text-black px-4 py-2 font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Field Group
              </button>
            </div>

            <div className="space-y-4">
              {fieldGroups.map((group) => (
                <div key={group.id} className="bg-[#111111] border border-white/10">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium">{group.name}</h3>
                        {!group.is_active && (
                          <span className="text-xs px-2 py-0.5 bg-white/10 text-white/60">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/60 mb-1">{group.slug}</p>
                      {group.description && (
                        <p className="text-sm text-white/40">{group.description}</p>
                      )}
                      <div className="text-xs text-white/40 mt-2">
                        {group.fields.length} fields
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleGroupExpansion(group.id)}
                        className="p-2 hover:bg-white/5 transition-colors"
                      >
                        {expandedGroups.has(group.id) ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEditGroup(group)}
                        className="p-2 hover:bg-white/5 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="p-2 hover:bg-red-500/10 text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Field List */}
                  {expandedGroups.has(group.id) && (
                    <div className="border-t border-white/10 p-4 bg-black/20">
                      {group.fields.length === 0 ? (
                        <p className="text-sm text-white/40">No fields defined</p>
                      ) : (
                        <div className="space-y-2">
                          {group.fields.map((field, idx) => (
                            <div key={idx} className="bg-white/5 p-3 text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium">{field.name}</span>
                                <span className="text-xs px-2 py-0.5 bg-white/10">
                                  {field.type}
                                </span>
                              </div>
                              <div className="text-xs text-white/60 space-y-1">
                                <div>Slug: {field.slug}</div>
                                {field.required && <div className="text-yellow-500">Required</div>}
                                {field.description && <div>{field.description}</div>}
                                {field.options && (
                                  <div>Options: {field.options.join(', ')}</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div>
            <div className="mb-6">
              <button
                onClick={() => setShowAssignmentModal(true)}
                className="bg-white text-black px-4 py-2 font-medium hover:bg-white/90 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Assign Field Group to Category
              </button>
            </div>

            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="bg-[#111111] border border-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{assignment.category?.name}</h3>
                        <span className="text-white/40">→</span>
                        <span className="text-white/60">{assignment.field_group?.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-white/40">
                        <span>Category: {assignment.category?.slug}</span>
                        <span>Field Group: {assignment.field_group?.slug}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleRequired(assignment)}
                        className={`text-xs px-3 py-1 transition-colors ${
                          assignment.is_required
                            ? 'bg-yellow-500 text-black'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                      >
                        {assignment.is_required ? 'Required' : 'Optional'}
                      </button>
                      <button
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="p-2 hover:bg-red-500/10 text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {assignments.length === 0 && (
                <div className="text-center py-12 text-white/40">
                  No assignments yet. Create one to get started.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Field Group Editor Modal */}
      {showGroupEditor && editingGroup && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-white/10 w-full max-w-4xl max-h-[95vh] flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-bold">
                {editingGroup.id ? 'Edit Field Group' : 'New Field Group'}
              </h2>
              <button
                onClick={() => {
                  setShowGroupEditor(false);
                  setEditingGroup(null);
                }}
                className="p-2 hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2">Name *</label>
                  <input
                    type="text"
                    value={editingGroup.name || ''}
                    onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 px-4 py-2 text-white"
                    placeholder="e.g., Cannabis Flower"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Slug *</label>
                  <input
                    type="text"
                    value={editingGroup.slug || ''}
                    onChange={(e) => setEditingGroup({ ...editingGroup, slug: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 px-4 py-2 text-white"
                    placeholder="e.g., cannabis-flower"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Description</label>
                  <textarea
                    value={editingGroup.description || ''}
                    onChange={(e) => setEditingGroup({ ...editingGroup, description: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 px-4 py-2 text-white h-20"
                    placeholder="Brief description of this field group"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingGroup.is_active}
                      onChange={(e) => setEditingGroup({ ...editingGroup, is_active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Active</span>
                  </label>

                  <div>
                    <label className="text-sm mr-2">Display Order:</label>
                    <input
                      type="number"
                      value={editingGroup.display_order || 0}
                      onChange={(e) => setEditingGroup({ ...editingGroup, display_order: parseInt(e.target.value) })}
                      className="w-20 bg-black/40 border border-white/10 px-2 py-1 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Fields</h3>
                  <button
                    onClick={handleAddField}
                    className="bg-white/10 hover:bg-white/20 px-3 py-1 text-sm flex items-center gap-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Field
                  </button>
                </div>

                <div className="space-y-4">
                  {(editingGroup.fields || []).map((field, idx) => (
                    <div key={idx} className="bg-black/40 border border-white/10 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm text-white/60">Field #{idx + 1}</span>
                        <button
                          onClick={() => handleRemoveField(idx)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs mb-1 text-white/60">Name</label>
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => handleUpdateField(idx, { name: e.target.value })}
                            className="w-full bg-black/60 border border-white/10 px-3 py-2 text-sm"
                            placeholder="e.g., THC Percentage"
                          />
                        </div>

                        <div>
                          <label className="block text-xs mb-1 text-white/60">Slug</label>
                          <input
                            type="text"
                            value={field.slug}
                            onChange={(e) => handleUpdateField(idx, { slug: e.target.value })}
                            className="w-full bg-black/60 border border-white/10 px-3 py-2 text-sm"
                            placeholder="e.g., thc_percentage"
                          />
                        </div>

                        <div>
                          <label className="block text-xs mb-1 text-white/60">Type</label>
                          <select
                            value={field.type}
                            onChange={(e) => handleUpdateField(idx, { type: e.target.value })}
                            className="w-full bg-black/60 border border-white/10 px-3 py-2 text-sm"
                          >
                            {FIELD_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={field.required || false}
                              onChange={(e) => handleUpdateField(idx, { required: e.target.checked })}
                              className="w-4 h-4"
                            />
                            Required
                          </label>
                        </div>

                        <div className="col-span-2">
                          <label className="block text-xs mb-1 text-white/60">Description</label>
                          <input
                            type="text"
                            value={field.description || ''}
                            onChange={(e) => handleUpdateField(idx, { description: e.target.value })}
                            className="w-full bg-black/60 border border-white/10 px-3 py-2 text-sm"
                            placeholder="Help text for this field"
                          />
                        </div>

                        <div>
                          <label className="block text-xs mb-1 text-white/60">Placeholder</label>
                          <input
                            type="text"
                            value={field.placeholder || ''}
                            onChange={(e) => handleUpdateField(idx, { placeholder: e.target.value })}
                            className="w-full bg-black/60 border border-white/10 px-3 py-2 text-sm"
                          />
                        </div>

                        {field.type === 'number' && (
                          <>
                            <div>
                              <label className="block text-xs mb-1 text-white/60">Min</label>
                              <input
                                type="number"
                                value={field.min || ''}
                                onChange={(e) => handleUpdateField(idx, { min: parseFloat(e.target.value) })}
                                className="w-full bg-black/60 border border-white/10 px-3 py-2 text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-xs mb-1 text-white/60">Max</label>
                              <input
                                type="number"
                                value={field.max || ''}
                                onChange={(e) => handleUpdateField(idx, { max: parseFloat(e.target.value) })}
                                className="w-full bg-black/60 border border-white/10 px-3 py-2 text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-xs mb-1 text-white/60">Suffix</label>
                              <input
                                type="text"
                                value={field.suffix || ''}
                                onChange={(e) => handleUpdateField(idx, { suffix: e.target.value })}
                                className="w-full bg-black/60 border border-white/10 px-3 py-2 text-sm"
                                placeholder="e.g., %"
                              />
                            </div>
                          </>
                        )}

                        {(field.type === 'select' || field.type === 'multiselect') && (
                          <div className="col-span-2">
                            <label className="block text-xs mb-1 text-white/60">
                              Options (comma separated)
                            </label>
                            <input
                              type="text"
                              value={(field.options || []).join(', ')}
                              onChange={(e) => handleUpdateField(idx, { 
                                options: e.target.value.split(',').map(o => o.trim()).filter(Boolean)
                              })}
                              className="w-full bg-black/60 border border-white/10 px-3 py-2 text-sm"
                              placeholder="Option 1, Option 2, Option 3"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {(editingGroup.fields || []).length === 0 && (
                    <div className="text-center py-8 text-white/40 text-sm">
                      No fields yet. Click "Add Field" to create one.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setShowGroupEditor(false);
                  setEditingGroup(null);
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGroup}
                className="px-4 py-2 bg-white text-black hover:bg-white/90 transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Field Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-white/10 w-full max-w-md max-h-[95vh] flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-bold">Assign Field Group</h2>
              <button
                onClick={() => {
                  setShowAssignmentModal(false);
                  setSelectedCategory('');
                  setSelectedFieldGroup('');
                  setAssignmentRequired(false);
                }}
                className="p-2 hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 px-4 py-2 text-white"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-2">Field Group</label>
                <select
                  value={selectedFieldGroup}
                  onChange={(e) => setSelectedFieldGroup(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 px-4 py-2 text-white"
                >
                  <option value="">Select a field group</option>
                  {fieldGroups.filter(g => g.is_active).map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={assignmentRequired}
                    onChange={(e) => setAssignmentRequired(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Required fields for this category</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setShowAssignmentModal(false);
                  setSelectedCategory('');
                  setSelectedFieldGroup('');
                  setAssignmentRequired(false);
                }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAssignment}
                className="px-4 py-2 bg-white text-black hover:bg-white/90 transition-colors"
              >
                Create Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
