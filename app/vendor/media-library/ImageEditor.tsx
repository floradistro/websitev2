"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Sparkles,
  Scissors,
  Eraser,
  Paintbrush,
  MousePointer2,
  Minimize2,
  Sun,
  Palette,
  RotateCcw,
  RotateCw,
  Eye,
  EyeOff,
  Check,
  ChevronLeft,
} from "lucide-react";

interface ImageEditorProps {
  image: {
    id: string;
    file_url: string;
    file_name: string;
    title?: string | null;
    alt_text?: string | null;
  };
  vendorId: string;
  onClose: () => void;
  onSave?: (editedImageUrl: string) => void;
}

type Tool =
  | "perfect"
  | "background"
  | "erase"
  | "restore"
  | "magic-remove"
  | "ai-reimagine"
  | "refine-edges"
  | "enhance";

interface EditHistory {
  url: string;
  label: string;
  timestamp: number;
}

export default function ImageEditor({
  image,
  vendorId,
  onClose,
  onSave,
}: ImageEditorProps) {
  const [currentImage, setCurrentImage] = useState(image.file_url);
  const [originalImage] = useState(image.file_url);
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [history, setHistory] = useState<EditHistory[]>([
    { url: image.file_url, label: "Original", timestamp: Date.now() },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Enhancement controls
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);

  // Brush tools
  const [brushSize, setBrushSize] = useState(20);
  const [isDrawing, setIsDrawing] = useState(false);
  const isDrawingRef = useRef(false);
  const workingCanvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isUsingBrush, setIsUsingBrush] = useState(false);
  const [hasUnsavedBrushChanges, setHasUnsavedBrushChanges] = useState(false);

  // AI Reimagine
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const [reimaginePrompt, setReimaginePrompt] = useState("");
  const [isMaskDrawing, setIsMaskDrawing] = useState(false);
  const isMaskDrawingRef = useRef(false);

  // Brush history
  const [brushHistory, setBrushHistory] = useState<string[]>([]);
  const [brushHistoryIndex, setBrushHistoryIndex] = useState(-1);
  const [mounted, setMounted] = useState(false);

  // Prevent body scroll and set mounted
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // ESC to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
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

  // Brush initialization
  const initializeBrushCanvas = async () => {
    if (!workingCanvasRef.current || !originalImageRef.current) return;

    const img = originalImageRef.current;
    await new Promise((resolve) => {
      if (img.complete) resolve(null);
      else img.onload = () => resolve(null);
    });

    const canvas = workingCanvasRef.current;
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;

    const ctx = canvas.getContext("2d");
    if (ctx) ctx.drawImage(img, 0, 0);

    setIsUsingBrush(true);
    setHasUnsavedBrushChanges(false);

    const initialState = canvas.toDataURL();
    setBrushHistory([initialState]);
    setBrushHistoryIndex(0);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!activeTool || (activeTool !== "erase" && activeTool !== "restore"))
      return;
    e.preventDefault();
    e.stopPropagation();
    setIsDrawing(true);
    isDrawingRef.current = true;
    draw(e);
  };

  const stopDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === "erase" || activeTool === "restore") {
      e.preventDefault();
      e.stopPropagation();

      if (workingCanvasRef.current && isDrawingRef.current) {
        const newState = workingCanvasRef.current.toDataURL();
        const newHistory = brushHistory.slice(0, brushHistoryIndex + 1);
        newHistory.push(newState);
        setBrushHistory(newHistory);
        setBrushHistoryIndex(newHistory.length - 1);
      }
    }
    setIsDrawing(false);
    isDrawingRef.current = false;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current && e.type !== "mousedown") return;
    if (!workingCanvasRef.current || !originalImageRef.current) return;

    e.preventDefault();
    e.stopPropagation();

    const canvas = workingCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = x * scaleX;
    const canvasY = y * scaleY;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (activeTool === "erase") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, brushSize * scaleX, 0, Math.PI * 2);
      ctx.fill();
    } else if (activeTool === "restore") {
      ctx.globalCompositeOperation = "source-over";
      const originalImg = originalImageRef.current;
      ctx.save();
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, brushSize * scaleX, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(originalImg, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }

    setHasUnsavedBrushChanges(true);
  };

  const handleBrushUndo = () => {
    if (brushHistoryIndex > 0 && workingCanvasRef.current) {
      const newIndex = brushHistoryIndex - 1;
      const canvas = workingCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      const img = new Image();
      img.onload = () => {
        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        setHasUnsavedBrushChanges(newIndex !== 0);
      };
      img.src = brushHistory[newIndex];
      setBrushHistoryIndex(newIndex);
    }
  };

  const handleBrushRedo = () => {
    if (brushHistoryIndex < brushHistory.length - 1 && workingCanvasRef.current) {
      const newIndex = brushHistoryIndex + 1;
      const canvas = workingCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      const img = new Image();
      img.onload = () => {
        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        setHasUnsavedBrushChanges(true);
      };
      img.src = brushHistory[newIndex];
      setBrushHistoryIndex(newIndex);
    }
  };

  const undo = () => {
    if (isUsingBrush) {
      handleBrushUndo();
      return;
    }
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentImage(history[newIndex].url);
    }
  };

  const redo = () => {
    if (isUsingBrush) {
      handleBrushRedo();
      return;
    }
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentImage(history[newIndex].url);
    }
  };

  useEffect(() => {
    if ((activeTool === "erase" || activeTool === "restore") && !isUsingBrush) {
      setIsUsingBrush(true);
    } else if (activeTool !== "erase" && activeTool !== "restore" && isUsingBrush) {
      setIsUsingBrush(false);
    }

    // Initialize mask canvas for AI reimagine
    if (activeTool === "ai-reimagine" && maskCanvasRef.current && imageRef.current) {
      const canvas = maskCanvasRef.current;
      const img = imageRef.current;
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [activeTool]);

  useEffect(() => {
    if (isUsingBrush && workingCanvasRef.current && originalImageRef.current) {
      initializeBrushCanvas();
    }
  }, [isUsingBrush]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isUsingBrush) return;
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleBrushUndo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        handleBrushRedo();
      }
    };

    if (isUsingBrush) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isUsingBrush, brushHistoryIndex, brushHistory]);

  const handleMakePerfect = async () => {
    setIsProcessing(true);
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

      if (!response.ok) throw new Error("Failed to enhance image");

      const data = await response.json();

      if (data.success && data.url) {
        setCurrentImage(data.url);
        addToHistory(data.url, "Made Perfect");
      }
    } catch (error) {
      console.error("Error enhancing image:", error);
      alert("Failed to enhance image");
    } finally {
      setIsProcessing(false);
      setActiveTool(null);
    }
  };

  const handleRemoveBackground = async () => {
    setIsProcessing(true);
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
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to remove background");
      }

      const data = await response.json();

      if (data.success && data.file?.url) {
        setCurrentImage(data.file.url);
        addToHistory(data.file.url, "Background Removed");
      }
    } catch (error) {
      console.error("Error removing background:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("API key")) {
        alert(
          "Background removal service is not available. Please contact support."
        );
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

      if (!response.ok) throw new Error("Failed to enhance image");

      const data = await response.json();

      if (data.success && data.url) {
        setCurrentImage(data.url);
        addToHistory(data.url, "Enhanced");
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

  const handleRefineEdges = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/vendor/media/refine-edges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendorId,
        },
        body: JSON.stringify({
          imageUrl: currentImage,
          fileName: image.file_name,
          intensity: 1,
        }),
      });

      if (!response.ok) throw new Error("Failed to refine edges");

      const data = await response.json();
      if (data.success && data.url) {
        setCurrentImage(data.url);
        addToHistory(data.url, "Edges Refined");
      }
    } catch (error) {
      console.error("Error refining edges:", error);
      alert("Failed to refine edges");
    } finally {
      setIsProcessing(false);
      setActiveTool(null);
    }
  };

  const handleSave = () => {
    if (onSave) onSave(currentImage);
    onClose();
  };

  // Mask drawing for AI reimagine
  const startMaskDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== "ai-reimagine") return;
    e.preventDefault();
    setIsMaskDrawing(true);
    isMaskDrawingRef.current = true;
    drawMask(e);
  };

  const stopMaskDrawing = () => {
    setIsMaskDrawing(false);
    isMaskDrawingRef.current = false;
  };

  const drawMask = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMaskDrawingRef.current && e.type !== "mousedown") return;
    if (!maskCanvasRef.current) return;

    e.preventDefault();
    const canvas = maskCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = x * scaleX;
    const canvasY = y * scaleY;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw white (mask area) where user brushes
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(canvasX, canvasY, brushSize * scaleX, 0, Math.PI * 2);
    ctx.fill();
  };

  const handleAIReimagine = async () => {
    if (!maskCanvasRef.current || !reimaginePrompt.trim()) {
      alert("Please brush an area and enter a prompt");
      return;
    }

    setIsProcessing(true);
    try {
      const maskDataUrl = maskCanvasRef.current.toDataURL();

      const response = await fetch("/api/vendor/media/ai-reimagine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendorId,
        },
        body: JSON.stringify({
          imageUrl: currentImage,
          maskDataUrl,
          prompt: reimaginePrompt,
          fileName: image.file_name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to reimagine";
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (data.success && data.url) {
        setCurrentImage(data.url);
        addToHistory(data.url, `AI: ${reimaginePrompt.substring(0, 30)}...`);
        setReimaginePrompt("");
        setActiveTool(null);
      }
    } catch (error) {
      console.error("Error reimagining:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to reimagine image";

      if (errorMessage.includes("not configured")) {
        alert("AI reimagine service is not configured. Please set REPLICATE_API_TOKEN in your environment variables.");
      } else {
        alert(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMagicRemoveClick = async (e: React.MouseEvent) => {
    if (activeTool !== "magic-remove") return;
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Get color at clicked position
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = imageRef.current.naturalWidth;
    canvas.height = imageRef.current.naturalHeight;

    // Draw image to canvas
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = currentImage;
    await new Promise((resolve) => (img.onload = resolve));

    ctx.drawImage(img, 0, 0);

    // Get pixel color at click position
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const imageData = ctx.getImageData(x * scaleX, y * scaleY, 1, 1);
    const [r, g, b] = imageData.data;

    setIsProcessing(true);
    try {
      const response = await fetch("/api/vendor/media/remove-color", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vendor-id": vendorId,
        },
        body: JSON.stringify({
          imageUrl: currentImage,
          color: { r, g, b },
          tolerance: 30,
          fileName: image.file_name,
        }),
      });

      if (!response.ok) throw new Error("Failed to remove color");

      const data = await response.json();
      if (data.success && data.url) {
        setCurrentImage(data.url);
        addToHistory(data.url, "Magic Remove");
      }
    } catch (error) {
      console.error("Error removing color:", error);
      alert("Failed to remove color");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle tool activation
  useEffect(() => {
    if (!activeTool) return;

    if (activeTool === "perfect") {
      handleMakePerfect();
    } else if (activeTool === "background") {
      handleRemoveBackground();
    } else if (activeTool === "refine-edges") {
      handleRefineEdges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool]);

  if (!mounted) return null;

  const editorContent = (
    <div className="fixed inset-0 z-[99999] bg-black flex flex-col">
      {/* Minimal Top Bar */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-white/5 flex-shrink-0 bg-black">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-all duration-200 group hover:gap-3"
          >
            <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
            <span className="text-sm font-medium tracking-tight">Back</span>
          </button>
          <div className="h-6 w-px bg-white/10" />
          <h1 className="text-white font-medium text-sm tracking-tight truncate max-w-md">{image.file_name}</h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={undo}
            disabled={
              isUsingBrush ? brushHistoryIndex <= 0 : historyIndex === 0
            }
            className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 disabled:opacity-20 hover:scale-110 disabled:hover:scale-100"
            title="Undo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={
              isUsingBrush
                ? brushHistoryIndex >= brushHistory.length - 1
                : historyIndex === history.length - 1
            }
            className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200 disabled:opacity-20 hover:scale-110 disabled:hover:scale-100"
            title="Redo"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-white/10" />

          <button
            onClick={() => setShowComparison(!showComparison)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition-all duration-200 flex items-center gap-2 hover:scale-105 ${
              showComparison
                ? "bg-white/10 text-white"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            {showComparison ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            Compare
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white text-sm font-medium tracking-tight transition-all duration-200 flex items-center gap-2 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
          >
            <Check className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex items-center justify-center relative p-8">
        {/* Floating Tool Palette */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 shadow-2xl">
          <div className="flex flex-col gap-1.5">
            <ToolButton
              icon={<Sparkles className="w-5 h-5" />}
              label="Perfect"
              active={activeTool === "perfect"}
              onClick={() => setActiveTool("perfect")}
            />
            <ToolButton
              icon={<Scissors className="w-5 h-5" />}
              label="Remove BG"
              active={activeTool === "background"}
              onClick={() => setActiveTool("background")}
            />
            <div className="h-px bg-white/10 my-1" />
            <ToolButton
              icon={<MousePointer2 className="w-5 h-5" />}
              label="Magic Remove"
              active={activeTool === "magic-remove"}
              onClick={() => setActiveTool(activeTool === "magic-remove" ? null : "magic-remove")}
            />
            <ToolButton
              icon={<Palette className="w-5 h-5" />}
              label="AI Reimagine"
              active={activeTool === "ai-reimagine"}
              onClick={() => setActiveTool(activeTool === "ai-reimagine" ? null : "ai-reimagine")}
            />
            <ToolButton
              icon={<Eraser className="w-5 h-5" />}
              label="Erase"
              active={activeTool === "erase"}
              onClick={() => setActiveTool(activeTool === "erase" ? null : "erase")}
            />
            <ToolButton
              icon={<Paintbrush className="w-5 h-5" />}
              label="Restore"
              active={activeTool === "restore"}
              onClick={() => setActiveTool(activeTool === "restore" ? null : "restore")}
            />
            <ToolButton
              icon={<Minimize2 className="w-5 h-5" />}
              label="Refine Edges"
              active={activeTool === "refine-edges"}
              onClick={() => setActiveTool("refine-edges")}
            />
            <div className="h-px bg-white/10 my-1" />
            <ToolButton
              icon={<Sun className="w-5 h-5" />}
              label="Enhance"
              active={activeTool === "enhance"}
              onClick={() => setActiveTool(activeTool === "enhance" ? null : "enhance")}
            />
          </div>
        </div>

        {/* Contextual Tool Options */}
        {(activeTool === "erase" || activeTool === "restore") && (
          <div className="absolute left-32 top-1/2 -translate-y-1/2 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-2xl w-64 transition-all duration-300">
            <div className="text-white text-sm font-medium tracking-tight mb-4">
              Brush Size
            </div>
            <input
              type="range"
              min="5"
              max="100"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500"
            />
            <div className="text-white/50 text-xs mt-3 text-center font-medium tabular-nums">
              {brushSize}px
            </div>
            {brushHistory.length > 1 && (
              <div className="mt-5 pt-5 border-t border-white/10">
                <div className="text-white/40 text-xs text-center font-medium tabular-nums tracking-wide">
                  State {brushHistoryIndex + 1} / {brushHistory.length}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTool === "enhance" && (
          <div className="absolute left-32 top-1/2 -translate-y-1/2 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-2xl w-72 transition-all duration-300">
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white text-xs font-medium tracking-wide">Brightness</span>
                  <span className="text-white/50 text-xs font-medium tabular-nums">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white text-xs font-medium tracking-wide">Contrast</span>
                  <span className="text-white/50 text-xs font-medium tabular-nums">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white text-xs font-medium tracking-wide">Saturation</span>
                  <span className="text-white/50 text-xs font-medium tabular-nums">{saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500"
                />
              </div>
              <button
                onClick={handleEnhance}
                disabled={isProcessing}
                className="w-full py-2.5 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 rounded-lg text-white text-sm font-medium tracking-tight transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 disabled:hover:scale-100"
              >
                Apply Enhancement
              </button>
            </div>
          </div>
        )}

        {activeTool === "ai-reimagine" && (
          <div className="absolute left-32 top-1/2 -translate-y-1/2 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-2xl w-72 transition-all duration-300">
            <div className="space-y-5">
              <div>
                <div className="text-white text-sm font-medium tracking-tight mb-4">
                  Brush Size
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500"
                />
                <div className="text-white/50 text-xs mt-3 text-center font-medium tabular-nums">
                  {brushSize}px
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="text-white text-sm font-medium tracking-tight mb-3">
                  Describe Changes
                </div>
                <textarea
                  value={reimaginePrompt}
                  onChange={(e) => setReimaginePrompt(e.target.value)}
                  placeholder="e.g., change the color to blue, add text saying..."
                  className="w-full h-24 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                />
              </div>

              <button
                onClick={handleAIReimagine}
                disabled={isProcessing || !reimaginePrompt.trim()}
                className="w-full py-2.5 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 rounded-lg text-white text-sm font-medium tracking-tight transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 disabled:hover:scale-100"
              >
                {isProcessing ? "Reimagining..." : "Apply AI Reimagine"}
              </button>

              <div className="text-white/40 text-xs text-center">
                Brush over the area you want to change, then describe what you want
              </div>
            </div>
          </div>
        )}

        {/* Image Display */}
        <div
          className="relative"
          onClick={handleMagicRemoveClick}
          style={{ cursor: activeTool === "magic-remove" ? "crosshair" : "default" }}
        >
          <img
            ref={originalImageRef}
            src={currentImage}
            alt="Original"
            className="hidden"
            crossOrigin="anonymous"
          />

          {isUsingBrush ? (
            <canvas
              ref={workingCanvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="max-w-full max-h-[calc(100vh-200px)] object-contain rounded-lg cursor-crosshair shadow-2xl transition-all duration-300"
              style={{
                filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
              }}
            />
          ) : (
            <>
              <img
                ref={imageRef}
                src={currentImage}
                alt="Editing"
                draggable={false}
                className="max-w-full max-h-[calc(100vh-200px)] object-contain rounded-lg shadow-2xl select-none transition-all duration-300"
                style={{
                  filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
                  userSelect: "none",
                  WebkitUserDrag: "none",
                } as React.CSSProperties & { WebkitUserDrag?: string }}
              />

              {/* AI Reimagine Mask Canvas Overlay */}
              {activeTool === "ai-reimagine" && (
                <canvas
                  ref={maskCanvasRef}
                  onMouseDown={startMaskDrawing}
                  onMouseMove={drawMask}
                  onMouseUp={stopMaskDrawing}
                  onMouseLeave={stopMaskDrawing}
                  className="absolute top-0 left-0 max-w-full max-h-[calc(100vh-200px)] object-contain rounded-lg cursor-crosshair"
                  style={{
                    mixBlendMode: "screen",
                    opacity: 0.5,
                  }}
                />
              )}
            </>
          )}
        </div>

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center transition-opacity duration-200">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-white/10 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-sm font-medium tracking-wide">Processing...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(editorContent, document.body);
}

function ToolButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative p-3 rounded-xl transition-all duration-300 ${
        active
          ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25 scale-105"
          : "text-white/60 hover:text-white hover:bg-white/5 hover:scale-105"
      }`}
      title={label}
    >
      {icon}
      <div className="absolute left-full ml-4 px-3 py-2 bg-black/95 backdrop-blur-sm border border-white/10 rounded-lg text-white text-xs font-medium tracking-wide whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 scale-95 group-hover:scale-100 shadow-xl">
        {label}
      </div>
    </button>
  );
}
