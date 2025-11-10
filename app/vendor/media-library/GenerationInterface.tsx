"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import type { PromptTemplate } from "@/lib/types/prompt-template";

import { logger } from "@/lib/logger";
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

interface GeneratedImage {
  url: string;
  tempPath?: string;
  productId: string;
  productName: string;
  status: "pending" | "approved" | "rejected";
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
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [artStyle, setArtStyle] = useState<string>("default");
  const [format, setFormat] = useState<string>("digital");
  const [includeText, setIncludeText] = useState<string>("none");

  const selectedProductsList = Array.from(selectedProducts)
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as Product[];

  // Load templates
  useEffect(() => {
    if (selectedProducts.size > 0 && templates.length === 0) {
      loadTemplates();
    }
  }, [selectedProducts]);

  // Auto-fill prompt when template changes
  useEffect(() => {
    if (selectedTemplate) {
      setPrompt(selectedTemplate.prompt_text);
    }
  }, [selectedTemplate]);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await fetch("/api/vendor/media/prompt-templates?category=product", {
        headers: { "x-vendor-id": vendorId },
      });
      const data = await response.json();
      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      logger.error("Error loading templates:", error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleApprove = async (index: number) => {
    const image = generatedImages[index];

    // Mark as approved and show saving state
    setGeneratedImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, status: "approved" as const } : img)),
    );

    try {
      // Auto-save immediately when approved
      const response = await fetch("/api/vendor/media/approve-generated", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendorId,
        },
        body: JSON.stringify({
          imageUrl: image.url,
          tempPath: image.tempPath,
          productId: image.productId,
          productName: image.productName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save image");
      }

      // Refresh the media library and product list
      onGenerated?.();

      // Move to next image
      if (index < generatedImages.length - 1) {
        setCurrentReviewIndex(index + 1);
      }
    } catch (error) {
      logger.error("Error saving approved image", error instanceof Error ? error : new Error(String(error)));
      alert("Failed to save image. Please try again.");
      // Revert approval status on error
      setGeneratedImages((prev) =>
        prev.map((img, i) => (i === index ? { ...img, status: "pending" as const } : img)),
      );
    }
  };

  const handleReject = (index: number) => {
    setGeneratedImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, status: "rejected" as const } : img)),
    );
    if (index < generatedImages.length - 1) {
      setCurrentReviewIndex(index + 1);
    }
  };


  const handleGenerate = async () => {
    if (!prompt.trim() || selectedProducts.size === 0) return;

    setGenerating(true);
    setGeneratedImages([]);
    setCurrentReviewIndex(0);

    try {
      const styleMap: Record<string, string> = {
        banksy: "in the style of Banksy",
        futura2000: "in the style of Futura 2000",
        ladypink: "in the style of Lady Pink",
        "shepard-fairey": "in the style of Shepard Fairey (Obey Giant)",
        "leonardo-da-vinci": "in the style of Leonardo da Vinci",
        "jackson-pollock": "in the style of Jackson Pollock",
        "salvador-dali": "in the style of Salvador Dali",
        "andy-warhol": "in the style of Andy Warhol",
      };

      const formatMap: Record<string, string> = {
        stamp: "as a rubber stamp design",
        canvas: "as a canvas painting",
        sticker: "as a die-cut sticker design",
        poster: "as a vintage poster",
      };

      const generationPromises = Array.from(selectedProducts).map(async (productId) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return null;

        let styleModifier = "";
        let formatModifier = "";

        if (artStyle === "random") {
          const styles = Object.keys(styleMap);
          const randomSeed = Date.now() + product.id.charCodeAt(0);
          const randomIndex = Math.floor((randomSeed * Math.random()) % styles.length);
          styleModifier = styleMap[styles[randomIndex]];
        } else if (artStyle !== "default") {
          styleModifier = styleMap[artStyle] || "";
        }

        if (format === "random") {
          const formats = Object.keys(formatMap);
          const randomSeed = Date.now() + product.id.charCodeAt(1);
          const randomIndex = Math.floor((randomSeed * Math.random()) % formats.length);
          formatModifier = formatMap[formats[randomIndex]];
        } else if (format !== "digital") {
          formatModifier = formatMap[format] || "";
        }

        let individualPrompt = prompt
          .replace(/\{product_name\}/g, product.name)
          .replace(/\{product\}/g, product.name);

        let textModifier = "";
        if (includeText === "none") {
          textModifier =
            "Important: create a purely visual icon with no text, letters, words, numbers, labels, or typography anywhere in the image.";
        } else if (includeText === "product_name") {
          textModifier = `Include the text "${product.name}" prominently in the design.`;
        }

        if (textModifier) individualPrompt += ` ${textModifier}`;
        if (styleModifier) individualPrompt += ` ${styleModifier}`;
        if (formatModifier) individualPrompt += ` ${formatModifier}`;

        try {
          const response = await fetch("/api/vendor/media/ai-generate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-vendor-id": vendorId,
            },
            body: JSON.stringify({
              prompt: individualPrompt,
            }),
          });

          const data = await response.json();
          if (data.success && data.tempUrl) {
            return {
              url: data.tempUrl,
              tempPath: data.tempPath,
              productId: productId,
              productName: product.name,
              status: "pending" as const,
            };
          }
        } catch (error) {
          logger.error(`Error generating for ${product.name}:`, error);
        }
        return null;
      });

      const results = (await Promise.all(generationPromises)).filter(Boolean);
      setGeneratedImages(results as typeof generatedImages);

      if (selectedTemplate && results.length > 0) {
        await fetch(`/api/vendor/media/prompt-templates/${selectedTemplate.id}`, {
          method: "POST",
          headers: { "x-vendor-id": vendorId },
        });
      }
    } catch (error) {
      logger.error("Generation error:", error);
      alert("Failed to generate images");
    } finally {
      setGenerating(false);
    }
  };

  // No products selected
  if (selectedProducts.size === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <Sparkles className="w-16 h-16 text-white/30 mx-auto mb-4" strokeWidth={1} />
          <h3 className="text-xl text-white font-light mb-2">AI Product Generation</h3>
          <p className="text-sm text-white/50 font-light">
            Select products from the left sidebar to generate stunning product icons
          </p>
        </div>
      </div>
    );
  }

  // Review mode - full-screen approval interface
  if (generatedImages.length > 0 && !generating) {
    const currentImage = generatedImages[currentReviewIndex];
    const approvedCount = generatedImages.filter((img) => img.status === "approved").length;
    const rejectedCount = generatedImages.filter((img) => img.status === "rejected").length;

    return (
      <div className="h-full flex flex-col bg-black">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg text-white font-light">Review Generated Images</h2>
              <p className="text-sm text-white/50 font-light">
                {currentReviewIndex + 1} of {generatedImages.length} •
                {approvedCount > 0 && ` ${approvedCount} approved`}
                {rejectedCount > 0 && ` • ${rejectedCount} rejected`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setGeneratedImages([])}
                className="px-6 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-4xl w-full">
            {/* Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-white mb-6">
              <img
                src={currentImage.url}
                alt={currentImage.productName}
                className="w-full h-full object-contain"
              />

              {/* Status badge */}
              {currentImage.status !== "pending" && (
                <div
                  className={`absolute top-4 right-4 px-4 py-2 rounded-full text-sm font-medium ${
                    currentImage.status === "approved"
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {currentImage.status === "approved" ? "Approved" : "Rejected"}
                </div>
              )}
            </div>

            {/* Product name */}
            <div className="text-center mb-6">
              <h3 className="text-2xl text-white font-light mb-1">{currentImage.productName}</h3>
              <p className="text-sm text-white/50 font-light">
                Will be saved as:{" "}
                {currentImage.productName
                  .replace(/[^a-zA-Z0-9\s-]/g, "")
                  .replace(/\s+/g, "-")
                  .toLowerCase()}
                .png
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => handleReject(currentReviewIndex)}
                disabled={currentImage.status === "rejected"}
                className="flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white transition-all disabled:opacity-50"
              >
                <X className="w-5 h-5" strokeWidth={2} />
                Reject
              </button>

              <button
                onClick={() => handleApprove(currentReviewIndex)}
                disabled={currentImage.status === "approved"}
                className="flex items-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-600 rounded-xl text-white transition-all disabled:opacity-50"
              >
                <Check className="w-5 h-5" strokeWidth={2} />
                Approve
              </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => setCurrentReviewIndex(Math.max(0, currentReviewIndex - 1))}
                disabled={currentReviewIndex === 0}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5 text-white" strokeWidth={2} />
              </button>

              <div className="flex gap-2">
                {generatedImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentReviewIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentReviewIndex
                        ? "bg-white w-6"
                        : generatedImages[idx].status === "approved"
                          ? "bg-green-500"
                          : generatedImages[idx].status === "rejected"
                            ? "bg-red-500"
                            : "bg-white/30"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() =>
                  setCurrentReviewIndex(
                    Math.min(generatedImages.length - 1, currentReviewIndex + 1),
                  )
                }
                disabled={currentReviewIndex === generatedImages.length - 1}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5 text-white" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Template selection
  if (!selectedTemplate) {
    return (
      <div className="h-full overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl text-white font-light mb-2">Choose a Style</h2>
            <p className="text-sm text-white/50 font-light">
              Generating for{" "}
              {selectedProducts.size === 1
                ? `"${selectedProductsList[0]?.name}"`
                : `${selectedProducts.size} products`}
            </p>
          </div>

          {loadingTemplates ? (
            <div className="text-center py-20">
              <Loader2 className="w-12 h-12 text-white/20 mx-auto mb-4 animate-spin" />
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
    <div className="h-full flex flex-col p-8">
      <div className="max-w-3xl mx-auto w-full">
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
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
            </button>
            <h2 className="text-xl text-white font-light">{selectedTemplate.name}</h2>
          </div>
          <p className="text-sm text-white/50 font-light">
            Generating for{" "}
            {selectedProducts.size === 1
              ? `"${selectedProductsList[0]?.name}"`
              : `${selectedProducts.size} products`}
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div>
            <label className="block text-xs text-white/50 mb-2 font-light uppercase tracking-wider">
              Artist Style
            </label>
            <select
              value={artStyle}
              onChange={(e) => setArtStyle(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/30"
            >
              <option value="default">Default</option>
              <option value="random">🎲 Random</option>
              <option value="banksy">Banksy</option>
              <option value="futura2000">Futura 2000</option>
              <option value="ladypink">Lady Pink</option>
              <option value="shepard-fairey">Shepard Fairey</option>
              <option value="leonardo-da-vinci">Leonardo da Vinci</option>
              <option value="jackson-pollock">Jackson Pollock</option>
              <option value="salvador-dali">Salvador Dali</option>
              <option value="andy-warhol">Andy Warhol</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-2 font-light uppercase tracking-wider">
              Format
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/30"
            >
              <option value="digital">Digital</option>
              <option value="random">🎲 Random</option>
              <option value="stamp">Stamp</option>
              <option value="canvas">Canvas</option>
              <option value="sticker">Sticker</option>
              <option value="poster">Poster</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-2 font-light uppercase tracking-wider">
              Include Text
            </label>
            <select
              value={includeText}
              onChange={(e) => setIncludeText(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-white/30"
            >
              <option value="none">No Text</option>
              <option value="product_name">Product Name</option>
              <option value="custom">Custom (in prompt)</option>
            </select>
          </div>
        </div>

        {/* Prompt */}
        <div className="mb-6">
          <label className="block text-sm text-white/70 mb-2 font-light">
            Customize Your Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={6}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30 font-mono resize-none"
            placeholder="Describe the image you want to generate..."
          />
          <p className="text-xs text-white/40 mt-2 font-light">
            Use {"{product_name}"} to insert the product name
          </p>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={generating || !prompt.trim()}
          className="w-full py-4 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating {selectedProducts.size} {selectedProducts.size === 1 ? "image" : "images"}
              ...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" strokeWidth={2} />
              Generate {selectedProducts.size} {selectedProducts.size === 1 ? "Image" : "Images"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
