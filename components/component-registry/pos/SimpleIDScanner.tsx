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

  // Play success beep sound using Web Audio API
  const playSuccessBeep = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Resume audio context (required for iOS)
      audioContext.resume().then(() => {
        // Double beep pattern for satisfaction
        const playBeep = (startTime: number, frequency: number) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value = frequency;
          oscillator.type = "sine";

          gainNode.gain.setValueAtTime(0.4, startTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.08);

          oscillator.start(startTime);
          oscillator.stop(startTime + 0.08);
        };

        const now = audioContext.currentTime;
        playBeep(now, 800); // First beep at 800Hz
        playBeep(now + 0.1, 1000); // Second beep at 1000Hz (higher pitch)
      });
    } catch (err) {
      console.log("Audio playback failed:", err);
    }
  };

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

        // Play success sound
        playSuccessBeep();

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
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50">
      {/* Scanner Interface - Only show when actively scanning */}
      {isScanning && (
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="relative w-full max-w-lg flex flex-col">
            {/* Compact Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/20">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-white" />
                <h2 className="text-lg font-black text-white uppercase tracking-tight">
                  Scan ID Barcode
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Compact Scanner Area - Focused on barcode */}
            <div className="relative h-64 overflow-hidden bg-black">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Focused scanning overlay - just the barcode area */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className={`relative w-[90%] h-[70%] border-4 rounded-lg transition-all duration-200 ${
                    barcodeDetected ? "border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.8)]" : "border-blue-400"
                  }`}
                >
                  {/* Animated corner indicators */}
                  <div
                    className={`absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 rounded-tl-lg transition-all duration-200 ${
                      barcodeDetected ? "border-green-400 animate-pulse" : "border-white"
                    }`}
                  />
                  <div
                    className={`absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 rounded-tr-lg transition-all duration-200 ${
                      barcodeDetected ? "border-green-400 animate-pulse" : "border-white"
                    }`}
                  />
                  <div
                    className={`absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 rounded-bl-lg transition-all duration-200 ${
                      barcodeDetected ? "border-green-400 animate-pulse" : "border-white"
                    }`}
                  />
                  <div
                    className={`absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 rounded-br-lg transition-all duration-200 ${
                      barcodeDetected ? "border-green-400 animate-pulse" : "border-white"
                    }`}
                  />

                  {/* Scanning line animation */}
                  {!barcodeDetected && (
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-scan" />
                    </div>
                  )}

                  {/* Green capture ring - pulsing animation when locked on */}
                  {barcodeDetected && (
                    <>
                      <div className="absolute inset-0 border-4 border-green-500 rounded-lg animate-ping opacity-75" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-green-500/30 border-2 border-green-400 rounded-lg px-4 py-2 backdrop-blur-sm">
                          <p className="text-green-300 font-black uppercase tracking-wider flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Capturing
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="absolute -bottom-12 left-0 right-0 text-center">
                    <p className="text-white text-sm font-semibold drop-shadow-lg">
                      {barcodeDetected ? "Capturing..." : "Position barcode within frame"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sleek Status Bar */}
              <div className="px-4 py-3 border-t border-white/10 bg-gradient-to-r from-black via-black/95 to-black">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${
                        barcodeDetected ? "bg-green-500 animate-pulse" : "bg-blue-400 animate-pulse"
                      }`}
                    />
                    <p className={`text-xs font-medium ${barcodeDetected ? "text-green-400" : "text-white/70"}`}>
                      {message}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      barcodeDetected ? "text-green-400" : "text-blue-400"
                    }`}
                  >
                    {barcodeDetected ? "Locked" : "Active"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Screen - Full Screen Overlay */}
      {scannedData && !isScanning && (
        <div className="fixed inset-0 bg-gradient-to-br from-black via-black/95 to-black/90 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-white/[0.08] to-white/[0.04] border border-white/20 rounded-2xl p-5 max-w-md w-full backdrop-blur-xl shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  {error ? (
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                  )}
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    {error ? "Verification Failed" : "Verified"}
                  </h3>
                </div>

                <div className="space-y-2.5 mb-4">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                    <User className="w-4 h-4 text-white/50 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/50 uppercase tracking-wider mb-0.5">Name</p>
                      <p className="text-sm font-bold text-white break-words">
                        {[scannedData.firstName, scannedData.middleName, scannedData.lastName]
                          .filter(Boolean)
                          .join(" ") || scannedData.fullName || "Unknown"}
                      </p>
                    </div>
                  </div>

                  {scannedData.dateOfBirth && (
                    <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                      <div className="w-4 h-4 flex items-center justify-center text-white/50 text-xs mt-0.5 flex-shrink-0">
                        🎂
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/50 uppercase tracking-wider mb-0.5">Date of Birth</p>
                        <p className="text-sm font-bold text-white">{scannedData.dateOfBirth}</p>
                      </div>
                    </div>
                  )}

                  {scannedData.licenseNumber && (
                    <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                      <div className="w-4 h-4 flex items-center justify-center text-white/50 text-xs mt-0.5 flex-shrink-0">
                        🪪
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/50 uppercase tracking-wider mb-0.5">License</p>
                        <p className="text-xs font-bold text-white font-mono break-all">{scannedData.licenseNumber}</p>
                      </div>
                    </div>
                  )}

                  {(scannedData.streetAddress || scannedData.city) && (
                    <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                      <div className="w-4 h-4 flex items-center justify-center text-white/50 text-xs mt-0.5 flex-shrink-0">
                        📍
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/50 uppercase tracking-wider mb-0.5">Address</p>
                        <p className="text-xs font-semibold text-white/90 break-words">
                          {[scannedData.streetAddress, scannedData.city, scannedData.state, scannedData.zipCode]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-300 font-medium">{error}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleRetry}
                    className="flex-1 px-4 py-3 bg-white/[0.08] border border-white/20 rounded-xl text-white text-sm font-bold uppercase tracking-wide hover:bg-white/[0.12] transition-all duration-200"
                  >
                    Scan Again
                  </button>
                  {!error && (
                    <button
                      onClick={handleConfirm}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl text-sm font-bold uppercase tracking-wide hover:from-green-500 hover:to-green-600 transition-all duration-200 shadow-lg shadow-green-900/30"
                    >
                      Confirm
                    </button>
                  )}
                </div>
              </div>
        </div>
      )}

      {/* Error State - Full Screen Overlay */}
      {error && !scannedData && (
        <div className="fixed inset-0 bg-gradient-to-br from-black via-black/95 to-black/90 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-red-500/[0.08] to-red-500/[0.04] border border-red-500/30 rounded-2xl p-6 max-w-md w-full backdrop-blur-xl shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <h3 className="text-xl font-black text-white uppercase mb-3 tracking-tight">Scanner Error</h3>
            <p className="text-white/70 text-sm mb-5 leading-relaxed">{error}</p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-white/[0.08] border border-white/20 rounded-xl text-white text-sm font-bold uppercase tracking-wide hover:bg-white/[0.12] transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRetry}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl text-sm font-bold uppercase tracking-wide hover:from-blue-500 hover:to-blue-600 transition-all duration-200 shadow-lg shadow-blue-900/30"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

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
