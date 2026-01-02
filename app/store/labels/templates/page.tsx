"use client";

import { useState, useEffect } from "react";
import { useAppAuth } from "@/context/AppAuthContext";
import { PageLoader } from "@/components/vendor/VendorSkeleton";
import { pageLayouts } from "@/lib/design-system";
import { SavedTemplate } from "@/lib/types/labels";
import { getTemplateList } from "@/lib/label-templates";
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Copy,
  Star,
  ChevronLeft,
  Grid3x3,
} from "lucide-react";
import Link from "next/link";

export default function TemplatesPage() {
  const { vendor, isLoading } = useAppAuth();
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const standardTemplates = getTemplateList();

  useEffect(() => {
    if (vendor?.id) {
      loadSavedTemplates();
    }
  }, [vendor?.id]);

  const loadSavedTemplates = async () => {
    try {
      // TODO: Load from API
      // const response = await fetch(`/api/vendor/labels/templates?vendorId=${vendor.id}`);
      // const data = await response.json();

      // Mock data for now
      setSavedTemplates([
        {
          id: "1",
          user_id: vendor!.id,
          name: "Default",
          description: "Standard shelf label with price and THC",
          template_type: "avery_5160",
          config_data: {
            template_id: "avery_5160",
            showBorders: false,
            showLogo: true,
            showPrice: true,
            showSKU: true,
            showCategory: false,
            showMargin: false,
            showEffect: true,
            showLineage: false,
            showNose: false,
            showTerpenes: false,
            showPotency: true,
            showDate: false,
            productName: {
              font: "Inter",
              size: 10,
              color: "#000000",
              weight: "bold",
            },
            details: {
              font: "Inter",
              size: 8,
              color: "#666666",
            },
            lineHeight: 1.2,
            logoSize: 12,
          },
          is_public: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
      setLoading(false);
    } catch (error) {
      console.error("Error loading templates:", error);
      setLoading(false);
    }
  };

  const handleDuplicateTemplate = (template: SavedTemplate) => {
    // TODO: Implement duplication
    console.log("Duplicate template:", template.id);
  };

  const handleDeleteTemplate = (templateId: string) => {
    // TODO: Implement deletion
    console.log("Delete template:", templateId);
  };

  if (isLoading || loading) {
    return <PageLoader message="Loading templates..." />;
  }

  return (
    <div className={pageLayouts.page}>
      <div className={pageLayouts.content}>
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/vendor/labels"
            className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Labels
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light text-white mb-1">Label Templates</h1>
              <p className="text-sm text-white/40">
                Manage your custom label templates
              </p>
            </div>
            <Link
              href="/vendor/labels/templates/new"
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Template
            </Link>
          </div>
        </div>

        {/* Standard Templates */}
        <div className="mb-8">
          <h2 className="text-lg font-light text-white mb-4 flex items-center gap-2">
            <Grid3x3 className="w-5 h-5 text-white/40" />
            Standard Templates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {standardTemplates.map((template) => (
              <Link
                key={template.id}
                href={`/vendor/labels/print?template=${template.id}`}
                className="group p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center">
                    <Tag className="w-6 h-6 text-white/40" strokeWidth={1.5} />
                  </div>
                </div>
                <h3 className="text-base font-medium text-white mb-1">
                  {template.name}
                </h3>
                <p className="text-sm text-white/40">{template.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Saved Templates */}
        <div>
          <h2 className="text-lg font-light text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-white/40" />
            Your Templates ({savedTemplates.length})
          </h2>
          {savedTemplates.length === 0 ? (
            <div className="text-center py-16 rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06]">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                <Tag className="w-8 h-8 text-white/20" strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-light text-white mb-2">No custom templates yet</h3>
              <p className="text-sm text-white/40 mb-6 max-w-sm mx-auto">
                Create your first custom template to save time when printing labels
              </p>
              <Link
                href="/vendor/labels/templates/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Template
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedTemplates.map((template) => (
                <div
                  key={template.id}
                  className="group p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center">
                      <Tag className="w-6 h-6 text-blue-400" strokeWidth={1.5} />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDuplicateTemplate(template)}
                        className="p-1.5 hover:bg-white/[0.08] rounded-lg transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-4 h-4 text-white/60" />
                      </button>
                      <Link
                        href={`/vendor/labels/templates/${template.id}/edit`}
                        className="p-1.5 hover:bg-white/[0.08] rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-white/60" />
                      </Link>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-400/60" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-base font-medium text-white mb-1">
                    {template.name}
                  </h3>
                  <p className="text-sm text-white/40 mb-4">
                    {template.description || "No description"}
                  </p>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/vendor/labels/print?templateId=${template.id}`}
                      className="flex-1 text-center px-3 py-2 bg-white/[0.06] text-white text-sm rounded-lg hover:bg-white/[0.08] transition-colors"
                    >
                      Use Template
                    </Link>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <div className="text-xs text-white/30">
                      Last updated {new Date(template.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
