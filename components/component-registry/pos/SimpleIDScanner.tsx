"use client";

import { useState, useRef, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
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

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);
  const scannerId = "id-scanner-reader";

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

      // Initialize scanner
      const scanner = new Html5Qrcode(scannerId);
      scannerRef.current = scanner;

      // Detect device type
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

      // Start scanning with PDF417 support
      await scanner.start(
        { facingMode: isMobile ? "environment" : "user" },
        {
          fps: 10,
          qrbox: { width: 400, height: 150 }, // Wide box for barcode
          aspectRatio: 1.777778, // 16:9
          formatsToSupport: [13], // PDF417 format code
        },
        (decodedText, decodedResult) => {
          // Success callback - auto-capture on detection
          if (!processingRef.current) {
            console.log("[Scanner] Barcode detected!", decodedText);
            setBarcodeDetected(true);
            setMessage("Barcode detected! Processing...");
            processingRef.current = true;
            handleBarcodeDetected(decodedText);
          }
        },
        (errorMessage) => {
          // Error callback - most are just "no barcode found" which is normal
          // Don't log these to avoid console spam
        }
      );

      setMessage("Position barcode on back of ID in frame");
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

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        const isScanning = scannerRef.current.getState() === 2; // SCANNING state
        if (isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn("Error stopping scanner:", err);
      }
      scannerRef.current = null;
    }

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
          {/* Scanner container */}
          <div id={scannerId} className="w-full h-full" />

          {/* Force video to show NATURAL - no mirroring */}
          <style jsx global>{`
            #${scannerId} video {
              transform: none !important;
              -webkit-transform: none !important;
            }
          `}</style>

          {/* Lock-on indicator overlay */}
          {barcodeDetected && isScanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-green-500/20 border-4 border-green-500 rounded-xl px-8 py-4 shadow-[0_0_40px_rgba(34,197,94,0.8)]">
                <p className="text-green-400 font-black uppercase tracking-wide flex items-center gap-3 text-xl">
                  <CheckCircle className="w-6 h-6" />
                  Locked On - Processing...
                </p>
              </div>
            </div>
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
    </div>
  );
}
