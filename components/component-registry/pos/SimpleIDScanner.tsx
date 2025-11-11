"use client";

import { useState, useRef, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { DecodeHintType, BarcodeFormat } from "@zxing/library";
import type { IScannerControls } from "@zxing/browser";
import { parseAAMVABarcode, formatAAMVAData, isLegalAge, type AAMVAData } from "@/lib/id-scanner/aamva-parser";
import { Camera, X, CheckCircle, AlertCircle, User } from "@/lib/icons";

interface SimpleIDScannerProps {
  onScanComplete: (data: AAMVAData) => void;
  onClose: () => void;
}

export function SimpleIDScanner({ onScanComplete, onClose }: SimpleIDScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<AAMVAData | null>(null);
  const [message, setMessage] = useState("Position barcode in frame");
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      setMessage("Starting camera...");
      setIsScanning(true);

      // Detect device type
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      const isTablet = /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768;

      // Lock screen orientation on mobile/tablet
      if ((isMobile || isTablet) && screen.orientation) {
        try {
          // @ts-ignore - ScreenOrientation.lock() is not in all TypeScript definitions
          if (typeof screen.orientation.lock === "function") {
            // @ts-ignore
            await screen.orientation.lock("landscape").catch((err: Error) => {
              console.warn("Could not lock orientation:", err);
            });
          }
        } catch (err) {
          console.warn("Orientation lock not supported:", err);
        }
      }

      // Request camera access with device-specific settings
      const videoConstraints: MediaTrackConstraints = isMobile || isTablet
        ? {
            facingMode: "environment", // Use back camera on mobile/tablet
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          }
        : {
            // Desktop/laptop - no facingMode constraint
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setMessage("Position barcode on back of ID in frame");

      // Initialize barcode reader with PDF417 hints
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.PDF_417]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const reader = new BrowserMultiFormatReader(hints);
      readerRef.current = reader;

      // Start continuous scanning and store controls
      const controls = await reader.decodeFromVideoDevice(
        undefined, // Use default camera
        videoRef.current!,
        (result, error) => {
          if (result) {
            console.log("[Scanner] Barcode detected!");
            handleBarcodeDetected(result.getText());
          }
          // Don't log NotFoundException errors (expected when no barcode in frame)
          if (error && error.name !== "NotFoundException") {
            console.error("Scan error:", error);
          }
        }
      );
      scannerControlsRef.current = controls;
    } catch (err) {
      console.error("Failed to start camera:", err);

      // Handle different error types
      let errorMessage = "Failed to access camera";
      if (err instanceof DOMException) {
        switch (err.name) {
          case "NotAllowedError":
            errorMessage = "Camera permission denied. Click the camera icon in the address bar and allow camera access for this site.";
            break;
          case "NotFoundError":
            errorMessage = "No camera found on this device.";
            break;
          case "NotReadableError":
            errorMessage = "Camera is already in use by another application.";
            break;
          case "OverconstrainedError":
            // If facingMode constraint failed on desktop, try again without it
            errorMessage = "Retrying camera access...";
            setError(null);
            try {
              const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                  width: { ideal: 1920 },
                  height: { ideal: 1080 },
                },
              });

              streamRef.current = stream;
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
              }

              setMessage("Position barcode on back of ID in frame");

              const hints = new Map();
              hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.PDF_417]);
              hints.set(DecodeHintType.TRY_HARDER, true);

              const reader = new BrowserMultiFormatReader(hints);
              readerRef.current = reader;

              reader.decodeFromVideoDevice(
                undefined,
                videoRef.current!,
                (result, error) => {
                  if (result) {
                    console.log("[Scanner] Barcode detected!");
                    handleBarcodeDetected(result.getText());
                  }
                  if (error && error.name !== "NotFoundException") {
                    console.error("Scan error:", error);
                  }
                }
              );
              return; // Success! Exit the error handler
            } catch (retryErr) {
              errorMessage = "Camera doesn't support the requested settings. Please try a different device.";
            }
            break;
          case "SecurityError":
            errorMessage = "Camera access blocked by security policy. Make sure you're using HTTPS or localhost.";
            break;
          default:
            errorMessage = `Camera error: ${err.message}`;
        }
      } else if (err instanceof Error) {
        errorMessage = `Camera error: ${err.message}`;
      }

      setError(errorMessage);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    // Stop barcode scanner using controls
    if (scannerControlsRef.current) {
      try {
        scannerControlsRef.current.stop();
      } catch (err) {
        console.warn("Error stopping barcode scanner:", err);
      }
      scannerControlsRef.current = null;
    }

    // Clear reader reference
    if (readerRef.current) {
      readerRef.current = null;
    }

    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Unlock screen orientation
    if (screen.orientation && screen.orientation.unlock) {
      try {
        screen.orientation.unlock();
      } catch (err) {
        console.warn("Could not unlock orientation:", err);
      }
    }

    setIsScanning(false);
  };

  const handleBarcodeDetected = (barcodeText: string) => {
    try {
      console.log("[ID Scanner] Raw barcode data:", barcodeText);

      // Parse AAMVA data
      const parsedData = parseAAMVABarcode(barcodeText);
      console.log("[ID Scanner] Parsed data:", parsedData);

      // Check if valid data
      if (!parsedData.firstName && !parsedData.lastName && !parsedData.fullName) {
        throw new Error("Could not parse name from barcode");
      }

      if (!parsedData.dateOfBirth) {
        throw new Error("Could not parse date of birth from barcode");
      }

      // Check legal age
      if (!isLegalAge(parsedData.dateOfBirth)) {
        setError("Customer is under 21 years old");
        setScannedData(parsedData);
        stopScanning();
        return;
      }

      setScannedData(parsedData);
      setMessage("Scan successful!");
      stopScanning();
    } catch (err) {
      console.error("[ID Scanner] Parse error:", err);
      setError(err instanceof Error ? err.message : "Failed to parse barcode data");
      stopScanning();
    }
  };

  const handleConfirm = () => {
    if (scannedData) {
      onScanComplete(scannedData);
    }
  };

  const handleRetry = () => {
    setScannedData(null);
    setError(null);
    startScanning();
  };

  const handleManualCapture = async () => {
    if (!videoRef.current || !readerRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      setMessage("Processing image...");

      // Create canvas if it doesn't exist
      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas (flipped back to normal)
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");

      // Flip horizontally to undo the CSS mirror transform
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Try to decode from the canvas
      console.log("[Scanner] Attempting manual capture...");
      const result = readerRef.current.decodeFromCanvas(canvas);

      if (result) {
        console.log("[Scanner] Manual capture successful!");
        handleBarcodeDetected(result.getText());
      }
    } catch (err) {
      console.error("[Scanner] Manual capture failed:", err);
      setMessage("Could not detect barcode. Please adjust position and try again.");
      setError("Barcode not detected. Make sure it's clearly visible and well-lit.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="relative w-full h-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6 text-white" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
              Scan ID
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="flex-1 relative overflow-hidden bg-black">
          {isScanning && (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
                playsInline
                muted
              />

              {/* Scanning overlay - Wide rectangle optimized for barcode scanning */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-[90%] h-[35%] border-4 border-blue-500 rounded-xl">
                  <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-xl" />

                  {/* Scanning line animation */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-scan" />
                  </div>

                  {/* Helper text overlay */}
                  <div className="absolute -bottom-16 left-0 right-0 text-center">
                    <p className="text-white text-sm font-medium">
                      Position the barcode from the back of the ID within the frame
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Results */}
          {scannedData && !isScanning && (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-8">
              <div className="bg-white/10 border-2 border-white/20 rounded-2xl p-8 max-w-md w-full">
                <div className="flex items-center gap-3 mb-6">
                  {error ? (
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  ) : (
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  )}
                  <h3 className="text-2xl font-black text-white uppercase">
                    {error ? "Age Verification Failed" : "ID Scanned"}
                  </h3>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-white/60 mt-1" />
                    <div>
                      <p className="text-sm text-white/60">Name</p>
                      <p className="text-lg font-bold text-white">
                        {[scannedData.firstName, scannedData.middleName, scannedData.lastName]
                          .filter(Boolean)
                          .join(" ") || scannedData.fullName || "Unknown"}
                      </p>
                    </div>
                  </div>

                  {scannedData.dateOfBirth && (
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 flex items-center justify-center text-white/60 mt-1">
                        🎂
                      </div>
                      <div>
                        <p className="text-sm text-white/60">Date of Birth</p>
                        <p className="text-lg font-bold text-white">{scannedData.dateOfBirth}</p>
                      </div>
                    </div>
                  )}

                  {scannedData.licenseNumber && (
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 flex items-center justify-center text-white/60 mt-1">
                        🪪
                      </div>
                      <div>
                        <p className="text-sm text-white/60">License Number</p>
                        <p className="text-lg font-bold text-white">{scannedData.licenseNumber}</p>
                      </div>
                    </div>
                  )}

                  {(scannedData.streetAddress || scannedData.city) && (
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 flex items-center justify-center text-white/60 mt-1">
                        📍
                      </div>
                      <div>
                        <p className="text-sm text-white/60">Address</p>
                        <p className="text-lg font-bold text-white">
                          {[scannedData.streetAddress, scannedData.city, scannedData.state, scannedData.zipCode]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleRetry}
                    className="flex-1 px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white font-bold uppercase tracking-wide hover:bg-white/20 transition-all"
                  >
                    Scan Again
                  </button>
                  {!error && (
                    <button
                      onClick={handleConfirm}
                      className="flex-1 px-6 py-4 bg-green-600 text-white rounded-xl font-bold uppercase tracking-wide hover:bg-green-700 transition-all"
                    >
                      Confirm
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !scannedData && (
            <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-8">
              <div className="bg-red-500/10 border-2 border-red-500/20 rounded-2xl p-8 max-w-md w-full">
                <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                <h3 className="text-2xl font-black text-white uppercase mb-4">Scanner Error</h3>
                <p className="text-white/80 mb-6">{error}</p>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white font-bold uppercase tracking-wide hover:bg-white/20 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRetry}
                    className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-xl font-bold uppercase tracking-wide hover:bg-blue-700 transition-all"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="p-4 border-t border-white/20 bg-black/50">
          <div className="flex items-center justify-between">
            <p className="text-white/60 text-sm">{message}</p>
            <div className="flex items-center gap-3">
              {isScanning && !isProcessing && (
                <button
                  onClick={handleManualCapture}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  Capture
                </button>
              )}
              {isScanning && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-green-400">
                    {isProcessing ? "Processing..." : "Scanning..."}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% {
            top: 0;
          }
          50% {
            top: 100%;
          }
          100% {
            top: 0;
          }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
