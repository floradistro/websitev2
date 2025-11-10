"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Sparkles,
  Wand2,
  Eraser,
  Sun,
  Palette,
  Scissors,
  Download,
  RotateCcw,
  RotateCw,
  Layers,
  Zap,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
  Image as ImageIcon,
} from "lucide-react";

interface ImageEditorProps {
  image: {
    id: string;
    file_url: string;
    file_name: string;
    title?: string | null;
    alt_text?: string | null;
  };
  onClose: () => void;
  onSave?: (editedImageUrl: string) => void;
}

type Tool = "perfect" | "background" | "enhance" | "erase" | "color" | "light";

interface EditHistory {
  url: string;
  label: string;
  timestamp: number;
}

export default function ImageEditor({ image, onClose, onSave }: ImageEditorProps) {
  const [currentImage, setCurrentImage] = useState(image.file_url);
  const [originalImage] = useState(image.file_url);
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [history, setHistory] = useState<EditHistory[]>([
    { url: image.file_url, label: "Original", timestamp: Date.now() },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Enhancement sliders
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Quality score (mock for now)
  const [qualityScore] = useState(85);
  const [suggestions] = useState([
    { type: "warning", message: "Background could be cleaner", action: "Remove Background" },
    { type: "info", message: "Colors could pop more", action: "Enhance Colors" },
  ]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Prevent body scroll when editor is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const addToHistory = (url: string, label: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ url, label, timestamp: Date.now() });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentImage(history[newIndex].url);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentImage(history[newIndex].url);
    }
  };

  const handleMakePerfect = async () => {
    setIsProcessing(true);
    setActiveTool("perfect");
    setProcessingProgress(0);

    // Simulate progress animation
    const progressInterval = setInterval(() => {
      setProcessingProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      const response = await fetch("/api/vendor/media/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendorId,
        },
        body: JSON.stringify({
          imageUrl: currentImage,
          operation: "auto-enhance",
          params: {},
        }),
      });

      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (!response.ok) {
        throw new Error("Failed to enhance image");
      }

      const data = await response.json();

      if (data.success && data.url) {
        setCurrentImage(data.url);
        addToHistory(data.url, "Made Perfect");
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Error enhancing image:", error);
      alert("Failed to enhance image");
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setActiveTool(null);
        setProcessingProgress(0);
      }, 500);
    }
  };

  const handleRemoveBackground = async () => {
    setIsProcessing(true);
    setActiveTool("background");

    try {
      const response = await fetch("/api/vendor/media/remove-bg", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendorId,
        },
        body: JSON.stringify({
          imageUrl: currentImage,
          fileName: image.file_name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to remove background");
      }

      const data = await response.json();

      if (data.success && data.file?.url) {
        setCurrentImage(data.file.url);
        addToHistory(data.file.url, "Background Removed");
      }
    } catch (error) {
      console.error("Error removing background:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("API key")) {
        alert("Background removal service is not available. Please contact support.");
      } else {
        alert(`Failed to remove background: ${errorMessage}`);
      }
    } finally {
      setIsProcessing(false);
      setActiveTool(null);
    }
  };

  const handleEnhance = async () => {
    setIsProcessing(true);
    setActiveTool("enhance");

    try {
      const response = await fetch("/api/vendor/media/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendorId,
        },
        body: JSON.stringify({
          imageUrl: currentImage,
          operation: "enhance",
          params: {
            brightness,
            contrast,
            saturation,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to enhance image");
      }

      const data = await response.json();

      if (data.success && data.url) {
        setCurrentImage(data.url);
        addToHistory(data.url, "Enhanced");
        // Reset sliders
        setBrightness(100);
        setContrast(100);
        setSaturation(100);
      }
    } catch (error) {
      console.error("Error enhancing:", error);
      alert("Failed to enhance image");
    } finally {
      setIsProcessing(false);
      setActiveTool(null);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(currentImage);
    }
    onClose();
  };

  const handleExport = () => {
    // TODO: Export with multiple sizes
    const link = document.createElement("a");
    link.href = currentImage;
    link.download = `${image.file_name}_edited.jpg`;
    link.click();
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex flex-col"
      style={{
        background: "linear-gradient(135deg, #000000 0%, #0a0a0a 100%)",
      }}
    >
      {/* Breadcrumb Navigation Bar */}
      <div className="h-12 border-b border-white/10 bg-black/60 backdrop-blur-md flex items-center px-4 flex-shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-medium">Back to Media Library</span>
        </button>

        <div className="flex items-center gap-2 ml-4 text-xs">
          <ChevronRight className="w-3.5 h-3.5 text-white/30" />
          <div className="flex items-center gap-1.5 text-white/40">
            <ImageIcon className="w-3.5 h-3.5" />
            <span className="font-medium">Editing</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-white/30" />
          <span className="text-white/60 font-medium max-w-xs truncate">{image.file_name}</span>
        </div>

        {/* Keyboard shortcut hint */}
        <div className="ml-auto flex items-center gap-2 text-xs text-white/30">
          <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-mono">ESC</kbd>
          <span>to close</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Left Sidebar - Tools */}
        <div className="w-64 border-r border-white/10 bg-black/40 backdrop-blur-sm flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-white">Image Editor</h2>
            <button
              onClick={onClose}
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-white/40 truncate">{image.file_name}</p>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-white/10">
          <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">
            Quick Magic
          </h3>
          <div className="space-y-2">
            <button
              onClick={handleMakePerfect}
              disabled={isProcessing}
              className="w-full px-3 py-2.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-500/30 rounded-lg text-white text-xs font-medium flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              Make It Perfect
            </button>
            <button
              onClick={handleRemoveBackground}
              disabled={isProcessing}
              className="w-full px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-xs font-medium flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Scissors className="w-4 h-4" />
              Remove Background
            </button>
          </div>
        </div>

        {/* Enhancement Tools */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">
            Enhance
          </h3>

          <div className="space-y-4">
            {/* Brightness */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-white/60 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5" />
                  Brightness
                </label>
                <span className="text-xs text-white/40">{brightness}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Contrast */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-white/60 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Contrast
                </label>
                <span className="text-xs text-white/40">{contrast}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Saturation */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-white/60 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" />
                  Saturation
                </label>
                <span className="text-xs text-white/40">{saturation}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={saturation}
                onChange={(e) => setSaturation(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Info about sharpening */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-xs text-white/80 font-medium">Pro Tip</span>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                For sharpening, use "Make It Perfect" for AI-powered enhancement
              </p>
            </div>

            <button
              onClick={handleEnhance}
              disabled={isProcessing}
              className="w-full px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white text-xs font-medium transition-all disabled:opacity-50"
            >
              Apply Enhancements
            </button>
          </div>
        </div>

        {/* Quality Score */}
        <div className="p-4 border-t border-white/10">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/60">Quality Score</span>
              <span className="text-lg font-bold text-white">{qualityScore}/100</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                style={{ width: `${qualityScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Center - Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="h-14 border-b border-white/10 bg-black/40 backdrop-blur-sm flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={historyIndex === 0}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all disabled:opacity-30"
              title="Undo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={historyIndex === history.length - 1}
              className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all disabled:opacity-30"
              title="Redo"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <div className="h-6 w-px bg-white/10 mx-2" />

            <button
              onClick={() => setShowComparison(!showComparison)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                showComparison
                  ? "bg-white/20 text-white border border-white/20"
                  : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
              }`}
            >
              {showComparison ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showComparison ? "Hide Original" : "Compare"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-purple-500 hover:bg-purple-600 rounded-lg text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              Save Changes
            </button>
          </div>
        </div>

        {/* Image Canvas */}
        <div className="flex-1 flex items-center justify-center p-8 relative">
          {isProcessing && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="text-center max-w-xs w-full px-8">
                <div className="w-16 h-16 border-4 border-white/20 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white text-sm font-medium mb-2">Processing...</p>
                <p className="text-white/40 text-xs mb-4">
                  {activeTool === "perfect" && "Making it perfect"}
                  {activeTool === "background" && "Removing background"}
                  {activeTool === "enhance" && "Applying enhancements"}
                </p>
                {/* Progress bar */}
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 ease-out"
                    style={{ width: `${processingProgress}%` }}
                  />
                </div>
                <p className="text-white/60 text-xs mt-2 tabular-nums">{processingProgress}%</p>
              </div>
            </div>
          )}

          {showComparison ? (
            <div className="grid grid-cols-2 gap-4 max-w-full max-h-full">
              <div className="relative">
                <img
                  src={originalImage}
                  alt="Original"
                  className="max-w-full max-h-[calc(100vh-200px)] object-contain rounded-lg"
                  style={{
                    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
                  }}
                />
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs text-white">
                  Original
                </div>
              </div>
              <div className="relative">
                <img
                  src={currentImage}
                  alt="Edited"
                  className="max-w-full max-h-[calc(100vh-200px)] object-contain rounded-lg"
                  style={{
                    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
                  }}
                />
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs text-white">
                  Edited
                </div>
              </div>
            </div>
          ) : (
            <img
              src={currentImage}
              alt="Editing"
              className="max-w-full max-h-full object-contain rounded-lg"
              style={{
                filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
              }}
            />
          )}
        </div>

        {/* Bottom - History Timeline */}
        <div className="h-20 border-t border-white/10 bg-black/40 backdrop-blur-sm px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            {history.map((item, index) => (
              <button
                key={item.timestamp}
                onClick={() => {
                  setHistoryIndex(index);
                  setCurrentImage(item.url);
                }}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  index === historyIndex
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/50"
                    : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Suggestions */}
      <div className="w-72 border-l border-white/10 bg-black/40 backdrop-blur-sm p-4">
        <h3 className="text-sm font-semibold text-white mb-4">Smart Suggestions</h3>

        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-lg p-3"
            >
              <div className="flex items-start gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-white/80">{suggestion.message}</p>
              </div>
              <button className="w-full px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded text-xs text-white font-medium transition-all">
                {suggestion.action}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">
            Export Presets
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-white/60">
              <span>Original (4000x4000)</span>
              <Check className="w-3.5 h-3.5 text-green-500" />
            </div>
            <div className="flex items-center justify-between text-white/60">
              <span>Product (2000x2000)</span>
              <Check className="w-3.5 h-3.5 text-green-500" />
            </div>
            <div className="flex items-center justify-between text-white/60">
              <span>Thumbnail (800x800)</span>
              <Check className="w-3.5 h-3.5 text-green-500" />
            </div>
            <div className="flex items-center justify-between text-white/60">
              <span>Mobile (600x600)</span>
              <Check className="w-3.5 h-3.5 text-green-500" />
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
