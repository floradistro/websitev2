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
  Image as ImageIcon,
} from "lucide-react";
import type { PromptTemplate } from "@/lib/types/prompt-template";
import ReferenceImageSelector from "./ReferenceImageSelector";
import ReferencePreview from "./ReferencePreview";
import SaveConfigModal from "./SaveConfigModal";

import { logger } from "@/lib/logger";
interface Product {
  id: string;
  name: string;
}

interface MediaFile {
  id: string;
  file_name: string;
  file_url: string;
  file_path: string;
  folder_id?: string | null;
  created_at: string;
  updated_at?: string;
}

interface ReferenceWeight {
  fileId: string;
  weight: number;
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
  rejectionTags?: string[]; // Optional tags for why rejected
}

type RejectionTag = "colors" | "style" | "complex" | "realistic" | "other";

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

  // Reference images state
  const [showReferenceSelector, setShowReferenceSelector] = useState(false);
  const [referenceImages, setReferenceImages] = useState<MediaFile[]>([]);
  const [referenceWeights, setReferenceWeights] = useState<ReferenceWeight[]>([]);
  const [styleDescription, setStyleDescription] = useState<string>("");
  const [analyzingReferences, setAnalyzingReferences] = useState(false);

  // Session learning state
  const [currentIteration, setCurrentIteration] = useState(1);
  const [approvedStyleDescription, setApprovedStyleDescription] = useState<string>("");
  const [rejectedStyleDescription, setRejectedStyleDescription] = useState<string>("");
  const [regenerating, setRegenerating] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

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

  // Handle reference image selection
  const handleReferenceSelection = (imageIds: Set<string>, images: MediaFile[]) => {
    setReferenceImages(images);

    // Initialize weights evenly distributed
    const totalImages = images.length;
    const evenWeight = Math.floor(100 / totalImages);
    const remainder = 100 - (evenWeight * totalImages);

    const weights = images.map((img, index) => ({
      fileId: img.id,
      weight: index === 0 ? evenWeight + remainder : evenWeight,
    }));

    setReferenceWeights(weights);
  };

  // Analyze references when weights change
  useEffect(() => {
    const analyzeReferences = async () => {
      if (referenceImages.length === 0) {
        setStyleDescription("");
        return;
      }

      // Only analyze if we have non-zero weights
      const hasNonZeroWeights = referenceWeights.some((w) => w.weight > 0);
      if (!hasNonZeroWeights) {
        setStyleDescription("");
        return;
      }

      setAnalyzingReferences(true);
      try {
        const imageUrls = referenceImages.map((img) => img.file_url);
        const weights = referenceWeights.map((w) => w.weight);

        const response = await fetch("/api/vendor/media/analyze-references", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-vendor-id": vendorId,
          },
          body: JSON.stringify({ imageUrls, weights }),
        });

        const data = await response.json();
        if (data.success && data.styleDescription) {
          setStyleDescription(data.styleDescription);
        }
      } catch (error) {
        logger.error("Error analyzing references:", error);
      } finally {
        setAnalyzingReferences(false);
      }
    };

    // Debounce the analysis
    const timeoutId = setTimeout(analyzeReferences, 500);
    return () => clearTimeout(timeoutId);
  }, [referenceImages, referenceWeights, vendorId]);

  const handleWeightChange = (fileId: string, weight: number) => {
    setReferenceWeights((prev) =>
      prev.map((w) => (w.fileId === fileId ? { ...w, weight } : w))
    );
  };

  const handleRemoveReference = (fileId: string) => {
    setReferenceImages((prev) => prev.filter((img) => img.id !== fileId));
    setReferenceWeights((prev) => prev.filter((w) => w.fileId !== fileId));
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

  const handleReject = (index: number, tags?: string[]) => {
    setGeneratedImages((prev) =>
      prev.map((img, i) =>
        i === index ? { ...img, status: "rejected" as const, rejectionTags: tags } : img
      ),
    );
    if (index < generatedImages.length - 1) {
      setCurrentReviewIndex(index + 1);
    }
  };

  const toggleRejectionTag = (index: number, tag: RejectionTag) => {
    setGeneratedImages((prev) =>
      prev.map((img, i) => {
        if (i !== index) return img;
        const currentTags = img.rejectionTags || [];
        const hasTag = currentTags.includes(tag);
        const newTags = hasTag
          ? currentTags.filter((t) => t !== tag)
          : [...currentTags, tag];
        return { ...img, rejectionTags: newTags };
      })
    );
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

        // Inject reference style description if available
        if (styleDescription) {
          individualPrompt += ` ${styleDescription}`;
        }

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

  const handleRegenerate = async () => {
    const rejected = generatedImages.filter((img) => img.status === "rejected");
    const approved = generatedImages.filter((img) => img.status === "approved");

    if (rejected.length === 0) {
      alert("No rejected images to regenerate");
      return;
    }

    setRegenerating(true);

    try {
      // Step 1: Analyze approved images if we have any
      let approvedAnalysis = "";
      if (approved.length > 0) {
        const approvedUrls = approved.map((img) => img.url);
        const approvedWeights = approved.map(() => Math.floor(100 / approved.length));

        const approvedResponse = await fetch("/api/vendor/media/analyze-references", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-vendor-id": vendorId,
          },
          body: JSON.stringify({
            imageUrls: approvedUrls,
            weights: approvedWeights,
          }),
        });

        const approvedData = await approvedResponse.json();
        if (approvedData.success) {
          approvedAnalysis = approvedData.styleDescription;
          setApprovedStyleDescription(approvedAnalysis);
        }
      }

      // Step 2: Analyze rejected images to understand what to avoid
      let rejectedAnalysis = "";
      if (rejected.length > 0) {
        const rejectedUrls = rejected.map((img) => img.url);
        const rejectedWeights = rejected.map(() => Math.floor(100 / rejected.length));

        const rejectedResponse = await fetch("/api/vendor/media/analyze-references", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-vendor-id": vendorId,
          },
          body: JSON.stringify({
            imageUrls: rejectedUrls,
            weights: rejectedWeights,
          }),
        });

        const rejectedData = await rejectedResponse.json();
        if (rejectedData.success) {
          rejectedAnalysis = rejectedData.styleDescription;
          setRejectedStyleDescription(rejectedAnalysis);
        }
      }

      // Step 3: Build smart prompt with learnings
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

      // Step 4: Regenerate only rejected products
      const regenerationPromises = rejected.map(async (rejectedImg) => {
        const product = products.find((p) => p.id === rejectedImg.productId);
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

        // Inject reference style description
        if (styleDescription) {
          individualPrompt += ` ${styleDescription}`;
        }

        // Add approved learnings
        if (approvedAnalysis) {
          individualPrompt += ` IMPORTANT: ${approvedAnalysis}`;
        }

        // Add rejection guidance
        if (rejectedAnalysis) {
          individualPrompt += ` AVOID the following characteristics: ${rejectedAnalysis.replace("Match the style of the reference images:", "")}`;
        }

        // Add rejection tags guidance
        if (rejectedImg.rejectionTags && rejectedImg.rejectionTags.length > 0) {
          const tagGuidance: Record<string, string> = {
            colors: "avoid the color palette",
            style: "avoid the artistic style",
            complex: "simplify and reduce complexity",
            realistic: "avoid realistic photography style, use illustrated/abstract approach",
            other: "significant style adjustment needed",
          };

          const guidance = rejectedImg.rejectionTags
            .map((tag) => tagGuidance[tag])
            .filter(Boolean)
            .join(", ");

          if (guidance) {
            individualPrompt += ` User feedback: ${guidance}.`;
          }
        }

        individualPrompt += ` (Iteration ${currentIteration + 1})`;

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
              productId: rejectedImg.productId,
              productName: product.name,
              status: "pending" as const,
            };
          }
        } catch (error) {
          logger.error(`Error regenerating for ${product.name}:`, error);
        }
        return null;
      });

      const newResults = (await Promise.all(regenerationPromises)).filter(Boolean) as GeneratedImage[];

      // Merge: Keep approved images + add new regenerated images
      const mergedImages = [
        ...approved,
        ...newResults,
      ];

      setGeneratedImages(mergedImages);
      setCurrentIteration((prev) => prev + 1);

      // Reset to first new regenerated image
      setCurrentReviewIndex(approved.length);
    } catch (error) {
      logger.error("Regeneration error:", error);
      alert("Failed to regenerate images");
    } finally {
      setRegenerating(false);
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

  // Regenerating loading screen
  if (regenerating) {
    const approved = generatedImages.filter((img) => img.status === "approved");
    const rejected = generatedImages.filter((img) => img.status === "rejected");

    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="max-w-md text-center space-y-6">
          <Loader2 className="w-16 h-16 text-white mx-auto animate-spin" strokeWidth={1} />
          <div>
            <h3 className="text-xl text-white font-light mb-2">🧠 Learning from Session...</h3>
            <p className="text-sm text-white/50 font-light">
              Analyzing {approved.length} approved and {rejected.length} rejected images
            </p>
          </div>

          {approvedStyleDescription && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left">
              <p className="text-xs text-green-500 mb-2">✓ Approved style:</p>
              <p className="text-xs text-white/60 font-light leading-relaxed">
                {approvedStyleDescription}
              </p>
            </div>
          )}

          {rejectedStyleDescription && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left">
              <p className="text-xs text-red-500 mb-2">🚫 Avoiding:</p>
              <p className="text-xs text-white/60 font-light leading-relaxed">
                {rejectedStyleDescription}
              </p>
            </div>
          )}

          <p className="text-sm text-white/40 font-light">
            Regenerating {rejected.length} product{rejected.length === 1 ? "" : "s"}...
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
    const pendingCount = generatedImages.filter((img) => img.status === "pending").length;
    const allReviewed = pendingCount === 0;
    const successRate = Math.round((approvedCount / generatedImages.length) * 100);

    // Show summary screen if all reviewed
    if (allReviewed) {
      return (
        <div className="h-full flex flex-col bg-black">
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg text-white font-light">Review Complete!</h2>
                <p className="text-sm text-white/50 font-light">
                  Iteration {currentIteration} • {successRate}% success rate
                </p>
              </div>
              <button
                onClick={() => {
                  setGeneratedImages([]);
                  setCurrentIteration(1);
                  setApprovedStyleDescription("");
                  setRejectedStyleDescription("");
                }}
                className="px-6 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/10 transition-all"
              >
                Exit
              </button>
            </div>
          </div>

          {/* Summary Content */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-2xl w-full space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                  <div className="text-4xl font-light text-green-500 mb-2">{approvedCount}</div>
                  <div className="text-sm text-white/50 font-light">Approved</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                  <div className="text-4xl font-light text-red-500 mb-2">{rejectedCount}</div>
                  <div className="text-sm text-white/50 font-light">Rejected</div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {rejectedCount > 0 && (
                  <button
                    onClick={handleRegenerate}
                    className="w-full py-4 bg-white text-black rounded-xl font-medium hover:bg-white/90 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" strokeWidth={2} />
                    Regenerate Rejected ({rejectedCount})
                    {approvedCount > 0 && " - AI will learn from approved"}
                  </button>
                )}

                <button
                  onClick={() => setShowSaveModal(true)}
                  className="w-full py-4 bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-white/20 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" strokeWidth={2} />
                  Save Configuration
                </button>

                {approvedCount > 0 && (
                  <button
                    onClick={() => {
                      // Save all approved images
                      const approved = generatedImages.filter((img) => img.status === "approved");
                      approved.forEach((img, index) => handleApprove(generatedImages.indexOf(img)));
                      setTimeout(() => {
                        setGeneratedImages([]);
                        setCurrentIteration(1);
                      }, 1000);
                    }}
                    className="w-full py-4 bg-green-500 hover:bg-green-600 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" strokeWidth={2} />
                    Save Approved & Exit
                  </button>
                )}
              </div>

              {/* Learnings Preview */}
              {(approvedStyleDescription || rejectedStyleDescription) && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                  <h3 className="text-sm text-white/70 font-light">Session Learnings</h3>
                  {approvedStyleDescription && (
                    <div>
                      <p className="text-xs text-green-500 mb-1">✓ Approved Style:</p>
                      <p className="text-xs text-white/60 font-light leading-relaxed">
                        {approvedStyleDescription}
                      </p>
                    </div>
                  )}
                  {rejectedStyleDescription && (
                    <div>
                      <p className="text-xs text-red-500 mb-1">✗ Avoided Style:</p>
                      <p className="text-xs text-white/60 font-light leading-relaxed">
                        {rejectedStyleDescription}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

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
                {pendingCount > 0 && ` • ${pendingCount} pending`}
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
        <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-y-auto">
          <div className="max-w-2xl w-full">
            {/* Image */}
            <div className="relative w-full max-h-[55vh] md:max-h-[60vh] rounded-2xl overflow-hidden bg-white mb-6 flex items-center justify-center">
              <img
                src={currentImage.url}
                alt={currentImage.productName}
                className="w-full h-full object-contain max-h-[55vh] md:max-h-[60vh]"
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
            <div className="space-y-4">
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

              {/* Rejection Tags */}
              {currentImage.status === "rejected" && (
                <div className="text-center">
                  <p className="text-xs text-white/50 mb-2 font-light">Why reject? (optional)</p>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {[
                      { id: "colors" as RejectionTag, label: "🎨 Colors", desc: "Wrong palette" },
                      { id: "style" as RejectionTag, label: "🖼️ Style", desc: "Wrong art style" },
                      { id: "complex" as RejectionTag, label: "🔧 Too Complex", desc: "Too busy" },
                      { id: "realistic" as RejectionTag, label: "📸 Too Realistic", desc: "Not illustrated" },
                      { id: "other" as RejectionTag, label: "💡 Other", desc: "Just didn't vibe" },
                    ].map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => toggleRejectionTag(currentReviewIndex, tag.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          currentImage.rejectionTags?.includes(tag.id)
                            ? "bg-red-500 text-white"
                            : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
                        }`}
                        title={tag.desc}
                      >
                        {tag.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
      <div className="h-full overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <h2 
            className="text-2xl font-black text-white uppercase tracking-tight mb-8"
            style={{ fontWeight: 900 }}
          >
            Choose Style
          </h2>

          {loadingTemplates ? (
            <div className="text-center py-20">
              <Loader2 className="w-8 h-8 text-white/20 mx-auto mb-4 animate-spin" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-20">
              <Sparkles className="w-12 h-12 text-white/20 mx-auto mb-4" strokeWidth={1} />
              <p className="text-white/40 text-sm">No templates available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-6 text-left transition-all"
                >
                  <h3 
                    className="text-lg font-black text-white uppercase tracking-tight mb-3"
                    style={{ fontWeight: 900 }}
                  >
                    {template.name}
                  </h3>
                  
                  {template.description && (
                    <p className="text-xs text-white/60 mb-4 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  <div className="bg-black/40 border border-white/5 rounded-xl px-3 py-2">
                    <p className="text-[11px] text-white/50 font-mono line-clamp-2 leading-relaxed">
                      {template.prompt_text}
                    </p>
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
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedTemplate(null);
                  setGeneratedImages([]);
                }}
                className="text-white/40 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={2} />
              </button>
              <h2 
                className="text-2xl font-black text-white uppercase tracking-tight"
                style={{ fontWeight: 900 }}
              >
                {selectedTemplate.name}
              </h2>
            </div>
            <button
              onClick={() => setShowReferenceSelector(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl text-xs uppercase tracking-[0.15em] text-white transition-all font-black"
              style={{ fontWeight: 900 }}
            >
              <ImageIcon className="w-4 h-4" strokeWidth={2} />
              {referenceImages.length > 0 ? "Change References" : "Add References"}
            </button>
          </div>
        </div>

        {/* Reference Images Preview */}
        {referenceImages.length > 0 && (
          <div className="mb-6">
            <ReferencePreview
              vendorId={vendorId}
              references={referenceImages}
              weights={referenceWeights}
              onWeightChange={handleWeightChange}
              onRemove={handleRemoveReference}
              styleDescription={styleDescription}
              analyzing={analyzingReferences}
            />
          </div>
        )}

        {/* Options - Minimal Labels */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <select
            value={artStyle}
            onChange={(e) => setArtStyle(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all"
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
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all"
          >
            <option value="digital">Digital</option>
            <option value="random">🎲 Random</option>
            <option value="stamp">Stamp</option>
            <option value="canvas">Canvas</option>
            <option value="sticker">Sticker</option>
            <option value="poster">Poster</option>
          </select>
          <select
            value={includeText}
            onChange={(e) => setIncludeText(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/20 hover:bg-white/10 transition-all"
          >
            <option value="none">No Text</option>
            <option value="product_name">Product Name</option>
            <option value="custom">Custom (in prompt)</option>
          </select>
        </div>

        {/* Prompt - Minimal */}
        <div className="mb-6">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/20 hover:bg-white/10 focus:bg-white/10 transition-all resize-none"
            placeholder="Describe the image you want to generate..."
          />
        </div>

        {/* Generate Button - Steve Jobs Minimal */}
        <button
          onClick={handleGenerate}
          disabled={generating || !prompt.trim()}
          className="w-full py-4 bg-white text-black rounded-xl font-black hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm uppercase tracking-[0.15em]"
          style={{ fontWeight: 900 }}
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating {selectedProducts.size}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" strokeWidth={2.5} />
              Generate {selectedProducts.size}
            </>
          )}
        </button>
        </div>
      </div>

      {/* Reference Image Selector Modal */}
      {showReferenceSelector && (
        <ReferenceImageSelector
          vendorId={vendorId}
          selectedImageIds={new Set(referenceImages.map((img) => img.id))}
          onSelectionChange={handleReferenceSelection}
          onClose={() => setShowReferenceSelector(false)}
        />
      )}

      {/* Save Config Modal */}
      {showSaveModal && (
        <SaveConfigModal
          vendorId={vendorId}
          config={{
            templateId: selectedTemplate?.id,
            basePrompt: prompt,
            artStyle,
            format,
            includeText,
            referenceImages: referenceImages.map((img, index) => ({
              mediaFileId: img.id,
              fileUrl: img.file_url,
              weight: referenceWeights[index]?.weight || 0,
              thumbnailUrl: img.file_url,
            })),
            approvedStyleDescription,
            rejectedStyleDescription,
            iterationsCount: currentIteration,
            successRate: Math.round(
              (generatedImages.filter((img) => img.status === "approved").length /
                generatedImages.length) *
                100
            ),
            totalGenerated: generatedImages.length,
          }}
          onClose={() => setShowSaveModal(false)}
          onSaved={() => {
            // Optionally refresh something or show a toast
          }}
        />
      )}
    </div>
  );
}
