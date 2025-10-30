"use client";

import { useState, useEffect } from 'react';
import { Sparkles, Download, CheckCircle, FolderTree, Layers, ArrowRight, X } from 'lucide-react';
import { showNotification } from '@/components/NotificationToast';
import { useAppAuth } from '@/context/AppAuthContext';
import PageHeader, { Button } from '@/components/dashboard/PageHeader';

interface BusinessTemplate {
  id: string;
  name: string;
  slug: string;
  description: string;
  industry_type: string;
  icon: string;
  image_url: string | null;
  display_order: number;
  category_count?: number;
  field_group_count?: number;
}

interface TemplateCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  image_url: string | null;
}

interface TemplateFieldGroup {
  id: string;
  name: string;
  description: string;
  fields: any[];
}

interface TemplateImport {
  vendor_id: string;
  template_id: string;
  imported_at: string;
}

export default function VendorTemplatesPage() {
  const { vendor, isAuthenticated, isLoading: authLoading } = useAppAuth();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<BusinessTemplate[]>([]);
  const [imports, setImports] = useState<TemplateImport[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<BusinessTemplate | null>(null);
  const [templateCategories, setTemplateCategories] = useState<TemplateCategory[]>([]);
  const [templateFieldGroups, setTemplateFieldGroups] = useState<TemplateFieldGroup[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importOptions, setImportOptions] = useState({
    categories: true,
    fieldGroups: true
  });

  useEffect(() => {
    if (!authLoading && isAuthenticated && vendor?.id) {
      loadTemplates();
      loadImports();
    }
  }, [authLoading, isAuthenticated, vendor?.id]);

  async function loadTemplates() {
    setLoading(true);
    try {
      const res = await fetch('/api/business-templates');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      showNotification({
        type: 'error',
        title: 'Load Failed',
        message: 'Could not load business templates'
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadImports() {
    try {
      const res = await fetch(`/api/business-templates/imports?vendor_id=${vendor?.id}`);
      const data = await res.json();
      if (data.success) {
        setImports(data.imports || []);
      }
    } catch (error) {
      console.error('Failed to load imports:', error);
    }
  }

  async function loadTemplateDetails(template: BusinessTemplate) {
    try {
      const [categoriesRes, fieldGroupsRes] = await Promise.all([
        fetch(`/api/business-templates/${template.id}/categories`),
        fetch(`/api/business-templates/${template.id}/field-groups`)
      ]);

      const categoriesData = await categoriesRes.json();
      const fieldGroupsData = await fieldGroupsRes.json();

      if (categoriesData.success) {
        setTemplateCategories(categoriesData.categories || []);
      }
      if (fieldGroupsData.success) {
        setTemplateFieldGroups(fieldGroupsData.field_groups || []);
      }

      setSelectedTemplate(template);
      setShowPreviewModal(true);
    } catch (error) {
      console.error('Failed to load template details:', error);
      showNotification({
        type: 'error',
        title: 'Load Failed',
        message: 'Could not load template details'
      });
    }
  }

  async function handleImportTemplate() {
    if (!selectedTemplate || !vendor?.id) return;

    setImporting(true);

    try {
      const res = await fetch('/api/business-templates/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-vendor-id': vendor.id
        },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          import_categories: importOptions.categories,
          import_field_groups: importOptions.fieldGroups
        })
      });

      const data = await res.json();

      if (data.success) {
        showNotification({
          type: 'success',
          title: 'Template Imported',
          message: `Successfully imported ${data.categories_created || 0} categories and ${data.field_groups_created || 0} field groups`
        });
        setShowPreviewModal(false);
        loadImports();
      } else {
        throw new Error(data.error || 'Import failed');
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Import Failed',
        message: error.message || 'Could not import template'
      });
    } finally {
      setImporting(false);
    }
  }

  function isTemplateImported(templateId: string): boolean {
    return imports.some(imp => imp.template_id === templateId);
  }

  return (
    <div className="w-full px-4 lg:px-0">
      <PageHeader
        title="Template Library"
        subtitle="Rapid business setup with pre-configured templates"
        icon={Sparkles}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/40">
          <div className="flex gap-1 mr-3">
            <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-[10px] uppercase tracking-[0.15em]">Loading templates</span>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">📦</div>
          <div className="text-white/60 text-sm font-black uppercase tracking-tight mb-2" style={{ fontWeight: 900 }}>
            No Templates Available
          </div>
          <p className="text-white/40 text-[10px] uppercase tracking-[0.15em]">
            Check back later for business templates
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => {
            const imported = isTemplateImported(template.id);
            return (
              <div
                key={template.id}
                className="bg-white/5 border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden transition-all group"
              >
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{template.icon}</span>
                      <div>
                        <h3 className="text-white font-black text-base tracking-tight" style={{ fontWeight: 900 }}>
                          {template.name}
                        </h3>
                        <p className="text-white/40 text-[9px] uppercase tracking-[0.15em]">
                          {template.industry_type}
                        </p>
                      </div>
                    </div>
                    {imported && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <CheckCircle size={12} className="text-green-400" strokeWidth={2.5} />
                        <span className="text-green-400 text-[9px] uppercase tracking-[0.15em] font-black">
                          Imported
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-white/60 text-xs leading-relaxed">
                    {template.description}
                  </p>
                </div>

                {/* Stats */}
                <div className="px-6 py-4 bg-black/20">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1">
                        Categories
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FolderTree size={14} className="text-white/60" />
                        <span className="text-white font-black text-sm">
                          {template.category_count || 0}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-1">
                        Field Groups
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Layers size={14} className="text-white/60" />
                        <span className="text-white font-black text-sm">
                          {template.field_group_count || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4">
                  <button
                    onClick={() => loadTemplateDetails(template)}
                    className="w-full bg-white text-black px-4 py-3 rounded-xl text-[10px] uppercase tracking-[0.15em] font-black hover:bg-white/90 transition-all flex items-center justify-center gap-2"
                    style={{ fontWeight: 900 }}
                  >
                    {imported ? (
                      <>
                        View Template
                        <ArrowRight size={14} strokeWidth={2.5} />
                      </>
                    ) : (
                      <>
                        <Download size={14} strokeWidth={2.5} />
                        Import Template
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Template Preview/Import Modal */}
      {showPreviewModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedTemplate.icon}</span>
                <div>
                  <h2 className="text-white font-black text-lg tracking-tight" style={{ fontWeight: 900 }}>
                    {selectedTemplate.name}
                  </h2>
                  <p className="text-white/40 text-[10px] uppercase tracking-[0.15em]">
                    {selectedTemplate.industry_type} Template
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-white/40 hover:text-white transition-all"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Categories */}
              {templateCategories.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <FolderTree size={16} className="text-white/60" strokeWidth={2} />
                    <h3 className="text-white/80 text-sm uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>
                      Included Categories ({templateCategories.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {templateCategories.map((category) => (
                      <div
                        key={category.id}
                        className="bg-white/5 border border-white/10 rounded-xl p-3"
                      >
                        <div className="flex items-center gap-2">
                          {category.image_url ? (
                            <img
                              src={category.image_url}
                              alt={category.name}
                              className="w-8 h-8 rounded-lg object-cover border border-white/10"
                            />
                          ) : (
                            <span className="text-xl">{category.icon || '📦'}</span>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white text-xs font-black tracking-tight truncate" style={{ fontWeight: 900 }}>
                              {category.name}
                            </h4>
                            {category.description && (
                              <p className="text-white/40 text-[8px] uppercase tracking-[0.15em] truncate">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Field Groups */}
              {templateFieldGroups.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Layers size={16} className="text-white/60" strokeWidth={2} />
                    <h3 className="text-white/80 text-sm uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>
                      Included Field Groups ({templateFieldGroups.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {templateFieldGroups.map((fieldGroup) => (
                      <div
                        key={fieldGroup.id}
                        className="bg-white/5 border border-white/10 rounded-xl p-4"
                      >
                        <h4 className="text-white text-sm font-black tracking-tight mb-2" style={{ fontWeight: 900 }}>
                          {fieldGroup.name}
                        </h4>
                        {fieldGroup.description && (
                          <p className="text-white/40 text-[9px] uppercase tracking-[0.15em] mb-3">
                            {fieldGroup.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {fieldGroup.fields.map((field: any, idx: number) => (
                            <div
                              key={idx}
                              className="px-2 py-1 bg-white/10 border border-white/10 rounded-lg text-white/60 text-[9px] uppercase tracking-[0.15em]"
                            >
                              {field.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Import Options */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-white text-sm font-black tracking-tight mb-4" style={{ fontWeight: 900 }}>
                  What to Import
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={importOptions.categories}
                      onChange={(e) => setImportOptions({ ...importOptions, categories: e.target.checked })}
                      className="w-4 h-4 rounded border-white/20 bg-white/10 text-white"
                    />
                    <div>
                      <div className="text-white text-xs font-black">Categories</div>
                      <div className="text-white/40 text-[9px] uppercase tracking-[0.15em]">
                        Import {templateCategories.length} categories
                      </div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={importOptions.fieldGroups}
                      onChange={(e) => setImportOptions({ ...importOptions, fieldGroups: e.target.checked })}
                      className="w-4 h-4 rounded border-white/20 bg-white/10 text-white"
                    />
                    <div>
                      <div className="text-white text-xs font-black">Field Groups</div>
                      <div className="text-white/40 text-[9px] uppercase tracking-[0.15em]">
                        Import {templateFieldGroups.length} field configurations
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="flex-1 px-4 py-3 border border-white/10 text-white rounded-2xl hover:bg-white/5 text-[10px] uppercase tracking-[0.15em] font-black transition-all"
                style={{ fontWeight: 900 }}
              >
                Cancel
              </button>
              <button
                onClick={handleImportTemplate}
                disabled={importing || (!importOptions.categories && !importOptions.fieldGroups)}
                className="flex-1 bg-white text-black px-4 py-3 rounded-2xl text-[10px] uppercase tracking-[0.15em] font-black hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ fontWeight: 900 }}
              >
                {importing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download size={12} strokeWidth={2.5} />
                    Import Template
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
