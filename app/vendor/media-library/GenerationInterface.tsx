"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Wand2,
  Loader2,
  Image as ImageIcon,
  ChevronRight,
  Check,
  TrendingUp,
} from "lucide-react";
import type { PromptTemplate } from "@/lib/types/prompt-template";

interface Product {
  id: string;
  name: string;
}

interface GenerationInterfaceProps {
  vendorId: string;
  selectedProducts: Set<string>;
  products: Product[];
  onGenerated?: () => void;
}

export default function GenerationInterface({
  vendorId,
  selectedProducts,
  products,
  onGenerated,
}: GenerationInterfaceProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<
    Array<{ url: string; productId: string; productName: string }>
  >([]);

  const selectedProductsList = Array.from(selectedProducts)
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as Product[];

  // Load templates
  useEffect(() => {
    if (selectedProducts.size > 0 && templates.length === 0) {
      loadTemplates();
    }
  }, [selectedProducts]);

  // Auto-fill prompt when template or products change
  useEffect(() => {
    if (selectedTemplate && selectedProducts.size > 0) {
      const productNames = selectedProductsList.map((p) => p.name);
      let filledPrompt = selectedTemplate.prompt_text;

      if (productNames.length === 1) {
        filledPrompt = filledPrompt.replace(/\{product_name\}/g, productNames[0]);
        filledPrompt = filledPrompt.replace(/\{product\}/g, productNames[0]);
      } else {
        filledPrompt = filledPrompt.replace(/\{product_name\}/g, productNames.join(", "));
        filledPrompt = filledPrompt.replace(/\{product\}/g, productNames.join(", "));
      }
      setPrompt(filledPrompt);
    }
  }, [selectedTemplate, selectedProducts]);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await fetch(
        "/api/vendor/media/prompt-templates?category=product",
        { headers: { "x-vendor-id": vendorId } }
      );
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || selectedProducts.size === 0) return;

    setGenerating(true);
    const results = [];

    try {
      for (const productId of selectedProducts) {
        const product = products.find((p) => p.id === productId);
        if (!product) continue;

        const response = await fetch("/api/vendor/media/ai-generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-vendor-id": vendorId,
          },
          body: JSON.stringify({
            prompt: prompt.trim(),
            size: selectedTemplate?.parameters?.size || "1024x1024",
            quality: selectedTemplate?.parameters?.quality || "standard",
            productId: productId,
          }),
        });

        const data = await response.json();
        if (data.success && data.file) {
          results.push({
            url: data.file.file_url,
            productId: productId,
            productName: product.name,
          });

          // Track template usage
          if (selectedTemplate) {
            await fetch(
              `/api/vendor/media/prompt-templates/${selectedTemplate.id}`,
              {
                method: "POST",
                headers: { "x-vendor-id": vendorId },
              }
            );
          }
        }
      }

      setGeneratedImages(results);
      if (onGenerated) onGenerated();
    } catch (error) {
      console.error("Generation error:", error);
      alert("Failed to generate images");
    } finally {
      setGenerating(false);
    }
  };

  // No products selected - show prompt
  if (selectedProducts.size === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <Sparkles className="w-16 h-16 text-white/30 mx-auto mb-4" strokeWidth={1} />
          <h3 className="text-xl text-white font-light mb-2">
            Product AI Generation
          </h3>
          <p className="text-sm text-white/50 font-light">
            Select products from the left sidebar to generate AI-powered images
          </p>
        </div>
      </div>
    );
  }

  // Template selection view
  if (!selectedTemplate) {
    return (
      <div className="h-full overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl text-white font-light mb-2">
              Choose a Template
            </h2>
            <p className="text-sm text-white/50 font-light">
              Generating for{" "}
              {selectedProducts.size === 1
                ? `"${selectedProductsList[0]?.name}"`
                : `${selectedProducts.size} products`}
            </p>
          </div>

          {loadingTemplates ? (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/40 text-sm font-light">Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-20">
              <Sparkles className="w-12 h-12 text-white/20 mx-auto mb-4" strokeWidth={1} />
              <p className="text-white/40 font-light">No templates available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className="group relative bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-white/30 rounded-xl p-5 text-left transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-medium text-white truncate mb-1">
                        {template.name}
                      </h3>
                      {template.description && (
                        <p className="text-xs text-white/50 line-clamp-2 font-light">
                          {template.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-black/30 rounded-lg px-3 py-2 mb-3">
                    <p className="text-xs text-white/60 font-mono line-clamp-3 leading-relaxed">
                      {template.prompt_text}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40 font-light flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" strokeWidth={1.5} />
                      {template.usage_count} uses
                    </span>
                    <span className="text-white/60 group-hover:text-white transition-colors font-light flex items-center gap-1">
                      Select
                      <ChevronRight className="w-3 h-3" strokeWidth={2} />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Generation interface
  return (
    <div className="h-full flex">
      {/* Left: Prompt Editor */}
      <div className="flex-1 p-8 overflow-y-auto border-r border-white/10">
        <div className="max-w-2xl">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => {
                  setSelectedTemplate(null);
                  setGeneratedImages([]);
                }}
                className="text-white/40 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4 rotate-180" strokeWidth={2} />
              </button>
              <h2 className="text-xl text-white font-light">
                {selectedTemplate.name}
              </h2>
            </div>
            <p className="text-sm text-white/50 font-light">
              Generating for{" "}
              {selectedProducts.size === 1
                ? `"${selectedProductsList[0]?.name}"`
                : `${selectedProducts.size} products`}
            </p>
          </div>

          {/* Prompt Editor */}
          <div className="mb-6">
            <label className="block text-sm text-white/70 mb-2 font-light">
              Customize Your Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30 font-mono resize-none"
              placeholder="Describe the image you want to generate..."
            />
          </div>

          {/* Parameters */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div>
              <label className="block text-xs text-white/50 mb-1 font-light uppercase tracking-wider">
                Size
              </label>
              <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 font-light">
                {selectedTemplate.parameters?.size || "1024x1024"}
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1 font-light uppercase tracking-wider">
                Quality
              </label>
              <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 font-light">
                {selectedTemplate.parameters?.quality || "standard"}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt.trim()}
            className="w-full px-6 py-4 bg-white/10 hover:bg-white/15 disabled:bg-white/5 border border-white/20 hover:border-white/30 disabled:border-white/10 rounded-lg text-white disabled:text-white/40 font-light transition-all flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" strokeWidth={1.5} />
                <span>
                  Generating {selectedProducts.size}{" "}
                  {selectedProducts.size === 1 ? "image" : "images"}...
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" strokeWidth={1.5} />
                <span>
                  Generate {selectedProducts.size}{" "}
                  {selectedProducts.size === 1 ? "Image" : "Images"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right: Preview */}
      <div className="w-1/2 p-8 bg-black/20 overflow-y-auto">
        <div className="max-w-2xl">
          <label className="block text-sm text-white/70 mb-4 font-light">
            Preview
          </label>

          {generatedImages.length > 0 ? (
            <div className="space-y-4">
              {generatedImages.map((img, idx) => (
                <div
                  key={idx}
                  className="bg-white/5 border border-white/10 rounded-lg overflow-hidden"
                >
                  <div className="aspect-square bg-black/30 flex items-center justify-center">
                    <img
                      src={img.url}
                      alt={img.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 border-t border-white/10">
                    <p className="text-sm text-white/70 font-light">
                      {img.productName}
                    </p>
                    <p className="text-xs text-green-400 font-light flex items-center gap-1 mt-1">
                      <Check className="w-3 h-3" strokeWidth={2} />
                      Generated successfully
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : generating ? (
            <div className="aspect-square bg-black/30 border border-white/10 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white/40 text-sm font-light">
                  Creating your images...
                </p>
                <p className="text-white/30 text-xs mt-1 font-light">
                  This may take 10-20 seconds per image
                </p>
              </div>
            </div>
          ) : (
            <div className="aspect-square bg-black/30 border border-white/10 rounded-lg flex items-center justify-center">
              <div className="text-center px-6">
                <ImageIcon
                  className="w-16 h-16 text-white/20 mx-auto mb-4"
                  strokeWidth={1}
                />
                <p className="text-white/40 text-sm font-light">
                  Your generated images will appear here
                </p>
                <p className="text-white/30 text-xs mt-1 font-light">
                  Customize the prompt and click Generate
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
