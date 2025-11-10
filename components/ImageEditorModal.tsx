"use client";

import { useState } from "react";
import {
  X,
  Scissors,
  Palette,
  Crop,
  Sparkles,
  FileImage,
  Maximize2,
  Download,
} from "lucide-react";
import axios from "axios";
import { showNotification } from "./NotificationToast";

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: { name: string; url: string };
  vendorId: string;
  onSuccess: () => void;
}

export default function ImageEditorModal({
  isOpen,
  onClose,
  file,
  vendorId,
  onSuccess,
}: ImageEditorModalProps) {
  const [activeTab, setActiveTab] = useState<
    "background" | "crop" | "enhance" | "format"
  >("background");
  const [processing, setProcessing] = useState(false);

  // Background options
  const [bgColor, setBgColor] = useState("#ffffff");
  const [removeBg, setRemoveBg] = useState(true);
  const [addShadow, setAddShadow] = useState(false);

  // Crop options
  const [enableCrop, setEnableCrop] = useState(false);
  const [cropMargin, setCropMargin] = useState("10");

  // Format options
  const [outputFormat, setOutputFormat] = useState<"png" | "jpg" | "webp">(
    "png",
  );

  // Subject type
  const [subjectType, setSubjectType] = useState("auto");

  if (!isOpen) return null;

  const handleProcess = async () => {
    setProcessing(true);

    try {
      const options: any = {
        format: outputFormat,
        suffix: `-edited`,
      };

      // Background options
      if (!removeBg && bgColor !== "transparent") {
        options.backgroundColor = bgColor;
      }
      if (addShadow) {
        options.addShadow = true;
      }

      // Crop options
      if (enableCrop) {
        options.crop = true;
        options.cropMargin = cropMargin;
      }

      // Subject type
      options.type = subjectType;

      const response = await axios.post(
        "/api/vendor/media/enhance",
        {
          imageUrl: file.url,
          fileName: file.name,
          options,
        },
        {
          headers: { "x-vendor-id": vendorId },
        },
      );

      if (response.data.success) {
        showNotification({
          type: "success",
          title: "Image Processed",
          message: `Created ${response.data.file.name}`,
        });
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      showNotification({
        type: "error",
        title: "Processing Failed",
        message: error.response?.data?.error || "Failed to process image",
      });
    } finally {
      setProcessing(false);
    }
  };

  const presetColors = [
    { name: "White", value: "#ffffff" },
    { name: "Black", value: "#000000" },
    { name: "Gray", value: "#9ca3af" },
    { name: "Light", value: "#f3f4f6" },
    { name: "Red", value: "#ef4444" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Green", value: "#22c55e" },
    { name: "Orange", value: "#f59e0b" },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl text-white font-light mb-1">Image Editor</h2>
            <p className="text-white/60 text-sm">{file.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Preview */}
            <div className="bg-white/5 border border-white/10 p-4 flex items-center justify-center min-h-[300px]">
              <img
                src={file.url}
                alt={file.name}
                className="max-w-full max-h-[400px] object-contain"
              />
            </div>

            {/* Options */}
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex gap-2 border-b border-white/10 pb-2">
                {[
                  { id: "background", icon: Palette, label: "Background" },
                  { id: "crop", icon: Crop, label: "Crop" },
                  { id: "enhance", icon: Sparkles, label: "Enhance" },
                  { id: "format", icon: FileImage, label: "Format" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm transition-all ${
                      activeTab === tab.id
                        ? "bg-white/10 text-white border border-white/20"
                        : "text-white/60 hover:text-white border border-transparent"
                    }`}
                  >
                    <tab.icon size={16} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Background Tab */}
              {activeTab === "background" && (
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={removeBg}
                        onChange={(e) => setRemoveBg(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-white text-sm">
                        Remove Background
                      </span>
                    </label>
                  </div>

                  {!removeBg && (
                    <div>
                      <div className="text-white text-sm mb-2">
                        Background Color
                      </div>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {presetColors.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setBgColor(color.value)}
                            className={`h-12 border-2 transition-all ${
                              bgColor === color.value
                                ? "border-white scale-105"
                                : "border-white/20"
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-full h-10 cursor-pointer"
                      />
                    </div>
                  )}

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={addShadow}
                        onChange={(e) => setAddShadow(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-white text-sm">Add Shadow</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Crop Tab */}
              {activeTab === "crop" && (
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={enableCrop}
                        onChange={(e) => setEnableCrop(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-white text-sm">
                        Smart Crop to Subject
                      </span>
                    </label>
                  </div>

                  {enableCrop && (
                    <div>
                      <label className="text-white text-sm mb-2 block">
                        Crop Margin: {cropMargin}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        value={cropMargin}
                        onChange={(e) => setCropMargin(e.target.value)}
                        className="w-full"
                      />
                      <div className="flex justify-between text-white/40 text-xs mt-1">
                        <span>Tight</span>
                        <span>Loose</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Enhance Tab */}
              {activeTab === "enhance" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-white text-sm mb-2 block">
                      Subject Type
                    </label>
                    <select
                      value={subjectType}
                      onChange={(e) => setSubjectType(e.target.value)}
                      className="w-full bg-black border border-white/20 text-white px-4 py-2"
                    >
                      <option value="auto">Auto Detect</option>
                      <option value="person">Person</option>
                      <option value="product">Product</option>
                      <option value="car">Vehicle</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Format Tab */}
              {activeTab === "format" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-white text-sm mb-2 block">
                      Output Format
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["png", "jpg", "webp"] as const).map((format) => (
                        <button
                          key={format}
                          onClick={() => setOutputFormat(format)}
                          className={`py-3 text-sm uppercase tracking-wider transition-all ${
                            outputFormat === format
                              ? "bg-white text-black"
                              : "bg-white/5 text-white/60 hover:text-white border border-white/10"
                          }`}
                        >
                          {format}
                        </button>
                      ))}
                    </div>
                    <div className="text-white/40 text-xs mt-2">
                      {outputFormat === "png" &&
                        "• Best quality • Transparency support"}
                      {outputFormat === "jpg" &&
                        "• Smaller file size • No transparency"}
                      {outputFormat === "webp" &&
                        "• Modern format • Best compression"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-3 text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition-all text-sm uppercase tracking-wider"
          >
            Cancel
          </button>
          <button
            onClick={handleProcess}
            disabled={processing}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white transition-all text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Process & Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
