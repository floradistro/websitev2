"use client";

import { useState, useRef, useEffect } from "react";
import { BrowserPDF417Reader } from "@zxing/browser";
import { DecodeHintType } from "@zxing/library";
import { parseAAMVABarcode, isLegalAge, type AAMVAData } from "@/lib/id-scanner/aamva-parser";
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
  const [barcodeDetected, setBarcodeDetected] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<BrowserPDF417Reader | null>(null);
  const scanningRef = useRef(false);
  const processingRef = useRef(false);

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
      processingRef.current = false;

      // Request rear camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: "environment" },
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

      // Initialize PDF417 reader
      const reader = new BrowserPDF417Reader();
      readerRef.current = reader;

      // Start continuous scanning loop
      scanningRef.current = true;
      scanLoop();
    } catch (err: any) {
      console.error("Failed to start camera:", err);

      let errorMessage = "Failed to access camera";
      if (err.name === "NotAllowedError") {
        errorMessage = "Camera permission denied. Please allow camera access.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "No camera found on this device.";
      } else if (err.name === "NotReadableError") {
        errorMessage = "Camera is already in use by another application.";
      } else if (err.message) {
        errorMessage = `Camera error: ${err.message}`;
      }

      setError(errorMessage);
      setIsScanning(false);
    }
  };

  const scanLoop = async () => {
    if (!scanningRef.current || !readerRef.current || !videoRef.current || !canvasRef.current) {
      return;
    }

    if (processingRef.current) {
      // Wait before next scan
      setTimeout(() => scanLoop(), 100);
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
        setTimeout(() => scanLoop(), 100);
        return;
      }

      // Set canvas size to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Try to decode from canvas
      const result = await readerRef.current.decodeFromCanvas(canvas);

      if (result && !processingRef.current) {
        console.log("[Scanner] Barcode detected!", result.getText());
        setBarcodeDetected(true);
        setMessage("Barcode detected! Processing...");
        processingRef.current = true;
        handleBarcodeDetected(result.getText());
        return; // Stop scanning
      }
    } catch (err) {
      // No barcode found - continue scanning
    }

    // Continue scanning loop
    setTimeout(() => scanLoop(), 100); // Scan every 100ms (10fps)
  };

  const stopScanning = () => {
    scanningRef.current = false;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    readerRef.current = null;
    setIsScanning(false);
    setBarcodeDetected(false);
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
      processingRef.current = false;
      setBarcodeDetected(false);
      setMessage("Scan failed. Position barcode in frame and try again.");
      // Restart scanning
      setTimeout(() => scanLoop(), 500);
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
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Scanning overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className={`relative w-[85%] h-[40%] border-4 rounded-xl transition-all duration-300 ${
                    barcodeDetected ? "border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.6)]" : "border-blue-500"
                  }`}
                >
                  {/* Corner indicators */}
                  <div
                    className={`absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 rounded-tl-xl transition-colors ${
                      barcodeDetected ? "border-green-400" : "border-white"
                    }`}
                  />
                  <div
                    className={`absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 rounded-tr-xl transition-colors ${
                      barcodeDetected ? "border-green-400" : "border-white"
                    }`}
                  />
                  <div
                    className={`absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 rounded-bl-xl transition-colors ${
                      barcodeDetected ? "border-green-400" : "border-white"
                    }`}
                  />
                  <div
                    className={`absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 rounded-br-xl transition-colors ${
                      barcodeDetected ? "border-green-400" : "border-white"
                    }`}
                  />

                  {/* Scanning line */}
                  {!barcodeDetected && (
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-scan" />
                    </div>
                  )}

                  {/* Lock-on indicator */}
                  {barcodeDetected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-green-500/20 border-2 border-green-500 rounded-xl px-6 py-3">
                        <p className="text-green-400 font-black uppercase tracking-wide flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Locked On
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="absolute -bottom-20 left-0 right-0 text-center">
                    <p className="text-white text-base font-semibold drop-shadow-lg">
                      {barcodeDetected
                        ? "Processing barcode..."
                        : "Position barcode from back of ID within frame"}
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
            {isScanning && (
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full animate-pulse ${
                    barcodeDetected ? "bg-green-500" : "bg-blue-500"
                  }`}
                />
                <span className={`text-sm ${barcodeDetected ? "text-green-400" : "text-blue-400"}`}>
                  {barcodeDetected ? "Processing..." : "Scanning..."}
                </span>
              </div>
            )}
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
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
