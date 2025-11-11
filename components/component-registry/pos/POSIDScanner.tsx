"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, X, AlertCircle, CheckCircle2, Scan } from "lucide-react";

import { logger } from "@/lib/logger";
interface ScannedIDData {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string; // YYYY-MM-DD format
  address: string;
  city: string;
  state: string;
  postalCode: string;
  licenseNumber: string;
  expirationDate: string;
}

interface POSIDScannerProps {
  vendorId: string;
  onCustomerFound: (customer: any) => void;
  onNoMatchFoundWithData: (data: ScannedIDData) => void;
  onClose: () => void;
}

export function POSIDScanner({
  vendorId,
  onCustomerFound,
  onNoMatchFoundWithData,
  onClose,
}: POSIDScannerProps) {
  const [status, setStatus] = useState<
    "idle" | "initializing" | "scanning" | "processing" | "success" | "no-match" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [isClient, setIsClient] = useState(false);

  const viewRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const idCaptureRef = useRef<any>(null);

  // Client-side detection
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize Scandit SDK
  const initializeScandit = async () => {
    if (!isClient) return;

    try {
      setStatus("initializing");
      setMessage("Loading scanner...");
      setCameraError("");

      // Dynamic import of Scandit modules (client-side only)

      const [SDCCore, SDCId] = await Promise.all([
        import("@scandit/web-datacapture-core"),
        import("@scandit/web-datacapture-id"),
      ]);

      setMessage("Configuring scanner...");

      // Configure Scandit with license key and library location
      await SDCCore.configure({
        licenseKey: process.env.NEXT_PUBLIC_SCANDIT_LICENSE_KEY || "",
        libraryLocation: new URL("/scandit/", window.location.origin).href,
        moduleLoaders: [SDCId.idCaptureLoader()],
      });

      // Create data capture context

      const context = await SDCCore.DataCaptureContext.create();
      contextRef.current = context;

      // Create camera and use it on the context

      const camera = SDCCore.Camera.default;
      if (!camera) {
        throw new Error("Default camera not available");
      }

      // Configure camera settings for better barcode scanning
      const cameraSettings = new SDCCore.CameraSettings();
      // Set preferred resolution for better barcode detection
      cameraSettings.preferredResolution = SDCCore.VideoResolution.FullHD;
      await camera.applySettings(cameraSettings);

      await context.setFrameSource(camera);
      cameraRef.current = camera;

      // Create ID capture settings

      const settings = new SDCId.IdCaptureSettings();

      // Set up accepted documents - US driver's licenses and ID cards
      settings.acceptedDocuments = [
        new SDCId.DriverLicense(SDCId.Region.Us),
        new SDCId.IdCard(SDCId.Region.Us),
        new SDCId.DriverLicense(SDCId.Region.Any),
        new SDCId.IdCard(SDCId.Region.Any),
      ];

      // Use SingleSideScanner with barcode prioritized for faster, more reliable scanning
      settings.scannerType = new SDCId.SingleSideScanner(
        true, // barcode (prioritize this for US IDs)
        true, // machineReadableZone
        true, // visualInspectionZone
      );

      // Create ID capture mode

      const idCapture = await SDCId.IdCapture.forContext(context, settings);
      idCaptureRef.current = idCapture;

      // Add listener for ID capture results

      const listener = {
        didCaptureId: async (capturedId: any) => {
          await handleIdCaptured(capturedId);
        },
        didFailWithError: (idCapture: any, error: any) => {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ didFailWithError callback triggered:", error);
          }
          setCameraError(`ID capture failed: ${error.message}`);
          setStatus("error");
        },
        didLocalizeId: (localization: any) => {
          setMessage("ID detected, processing...");
        },
      };

      idCapture.addListener(listener);

      // Create the data capture view
      if (viewRef.current) {
        const view = await SDCCore.DataCaptureView.forContext(context);

        view.connectToElement(viewRef.current);

        const overlay = await SDCId.IdCaptureOverlay.withIdCapture(idCapture);

        // Configure overlay for better visual feedback
        overlay.idLayoutStyle = SDCId.IdLayoutStyle.Rounded;

        await view.addOverlay(overlay);
      }

      setStatus("scanning");
      setMessage("Point camera at the barcode on the back of the ID (works in any orientation)");

      // Enable ID capture mode and start scanning
      await idCapture.setEnabled(true);
      await camera.switchToDesiredState(SDCCore.FrameSourceState.On);
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Scandit initialization error:", err);
      }
      setStatus("error");
      setCameraError(
        `Failed to initialize scanner: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
      setMessage("Initialization failed");
    }
  };

  // Helper function to convert text to proper case
  const toProperCase = (text: string): string => {
    if (!text) return "";

    // Split on spaces and hyphens, convert each word to title case
    return text
      .toLowerCase()
      .split(/(\s+|-)/g) // Split on spaces and hyphens but keep them
      .map((word) => {
        if (word.match(/^\s+$/) || word === "-") return word; // Keep whitespace and hyphens as-is
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join("");
  };

  // Helper function to parse full name into first, middle, last
  const parseFullName = (
    fullName: string,
    existingFirst?: string,
    existingMiddle?: string,
    existingLast?: string,
  ) => {
    if (!fullName) {
      return {
        firstName: existingFirst || "",
        middleName: existingMiddle || "",
        lastName: existingLast || "",
      };
    }

    const nameParts = fullName.trim().split(/\s+/);

    if (nameParts.length === 1) {
      // Only one name part - treat as first name
      return {
        firstName: toProperCase(nameParts[0]),
        middleName: existingMiddle || "",
        lastName: existingLast || "",
      };
    } else if (nameParts.length === 2) {
      // Two parts - first and last
      return {
        firstName: toProperCase(nameParts[0]),
        middleName: existingMiddle || "",
        lastName: toProperCase(nameParts[1]),
      };
    } else {
      // Three or more parts - first, middle(s), last
      return {
        firstName: toProperCase(nameParts[0]),
        middleName: toProperCase(nameParts.slice(1, -1).join(" ")),
        lastName: toProperCase(nameParts[nameParts.length - 1]),
      };
    }
  };

  // Handle captured ID
  const handleIdCaptured = async (capturedId: any) => {
    try {
      // Stop scanning
      if (cameraRef.current) {
        const SDCCore = await import("@scandit/web-datacapture-core");
        await cameraRef.current.switchToDesiredState(SDCCore.FrameSourceState.Off);
      }

      setStatus("processing");
      setMessage("Processing ID data...");

      // Extract data from captured ID
      let rawFirstName = capturedId.firstName || "";
      let rawLastName = capturedId.lastName || "";
      let rawMiddleName = capturedId.middleName || "";
      let documentNumber = capturedId.documentNumber || "";
      let dateOfBirth = capturedId.dateOfBirth;
      let dateOfExpiry = capturedId.dateOfExpiry;
      let rawAddress = capturedId.address || "";
      let rawCity = capturedId.city || "";
      let rawState = capturedId.state || "";
      let zipCode = capturedId.zipCode || capturedId.postalCode || "";

      // Try barcode result first (most reliable for US IDs)
      if (capturedId.barcode) {
        const barcode = capturedId.barcode;
        rawFirstName = rawFirstName || barcode.firstName || "";
        rawLastName = rawLastName || barcode.lastName || "";
        rawMiddleName = rawMiddleName || barcode.middleName || "";
        documentNumber = documentNumber || barcode.documentNumber || "";
        dateOfBirth = dateOfBirth || barcode.dateOfBirth;
        dateOfExpiry = dateOfExpiry || barcode.dateOfExpiry;
        rawAddress = rawAddress || barcode.address || "";
        rawCity = rawCity || barcode.city || "";
        rawState = rawState || barcode.state || "";
        zipCode = zipCode || barcode.postalCode || barcode.zipCode || "";
      }

      // Parse names - handle case where first and middle are combined
      let firstName = "";
      let middleName = "";
      let lastName = "";

      // If we have separate first, middle, last already
      if (rawFirstName && rawLastName) {
        // Check if firstName contains multiple words (first + middle combined)
        const firstNameParts = rawFirstName.trim().split(/\s+/);
        if (firstNameParts.length > 1 && !rawMiddleName) {
          // First name has multiple parts and no separate middle name
          firstName = toProperCase(firstNameParts[0]);
          middleName = toProperCase(firstNameParts.slice(1).join(" "));
          lastName = toProperCase(rawLastName);
        } else {
          // Use as-is with proper case
          firstName = toProperCase(rawFirstName);
          middleName = toProperCase(rawMiddleName);
          lastName = toProperCase(rawLastName);
        }
      } else if (rawFirstName) {
        // Only have first name, might be full name
        const parsed = parseFullName(rawFirstName);
        firstName = parsed.firstName;
        middleName = parsed.middleName;
        lastName = parsed.lastName || toProperCase(rawLastName);
      } else {
        // Fallback
        firstName = toProperCase(rawFirstName);
        middleName = toProperCase(rawMiddleName);
        lastName = toProperCase(rawLastName);
      }

      // Apply proper case to address fields
      const address = toProperCase(rawAddress);
      const city = toProperCase(rawCity);
      const state = rawState.toUpperCase(); // State codes should be uppercase

      // Handle DateResult objects or string dates
      let dobString = "";
      if (dateOfBirth) {
        if (typeof dateOfBirth === "object" && dateOfBirth.year) {
          dobString = `${dateOfBirth.year}-${String(dateOfBirth.month).padStart(2, "0")}-${String(dateOfBirth.day).padStart(2, "0")}`;
        } else if (typeof dateOfBirth === "string") {
          // Parse various date formats to YYYY-MM-DD
          if (/^\d{8}$/.test(dateOfBirth)) {
            // MMDDYYYY format
            dobString = `${dateOfBirth.substring(4, 8)}-${dateOfBirth.substring(0, 2)}-${dateOfBirth.substring(2, 4)}`;
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
            dobString = dateOfBirth;
          }
        }
      }

      let expString = "";
      if (dateOfExpiry) {
        if (typeof dateOfExpiry === "object" && dateOfExpiry.year) {
          expString = `${dateOfExpiry.year}-${String(dateOfExpiry.month).padStart(2, "0")}-${String(dateOfExpiry.day).padStart(2, "0")}`;
        } else if (typeof dateOfExpiry === "string") {
          if (/^\d{8}$/.test(dateOfExpiry)) {
            expString = `${dateOfExpiry.substring(4, 8)}-${dateOfExpiry.substring(0, 2)}-${dateOfExpiry.substring(2, 4)}`;
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateOfExpiry)) {
            expString = dateOfExpiry;
          }
        }
      }

      const idData: ScannedIDData = {
        firstName: firstName,
        lastName: lastName,
        middleName: middleName,
        dateOfBirth: dobString,
        address: address,
        city: city,
        state: state,
        postalCode: zipCode,
        licenseNumber: documentNumber,
        expirationDate: expString,
      };

      if (!idData.firstName && !idData.lastName) {
        throw new Error("Unable to extract name from ID");
      }

      setMessage("Searching for existing customer...");

      // Search for matching customer
      const response = await fetch("/api/pos/customers/match-by-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          firstName: idData.firstName,
          lastName: idData.lastName,
          dateOfBirth: idData.dateOfBirth,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.customer) {
          // Customer found!
          setStatus("success");
          setMessage(`Found: ${data.customer.first_name} ${data.customer.last_name}`);

          setTimeout(() => {
            onCustomerFound(data.customer);
          }, 1000);
        } else {
          // No match - show option to create new customer
          setStatus("no-match");
          setMessage("No existing customer found. Create new?");

          setTimeout(() => {
            onNoMatchFoundWithData(idData);
          }, 1500);
        }
      } else {
        throw new Error("Failed to search for customer");
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        logger.error("ID processing error:", error);
      }
      setStatus("error");
      setMessage(error.message || "Failed to process ID. Please try again.");
      setCameraError(error.message || "Failed to process ID");
    }
  };

  // Initialize when component mounts
  useEffect(() => {
    if (isClient) {
      initializeScandit();
    }

    return () => {
      // Clean up when component unmounts
      if (contextRef.current) {
        contextRef.current.dispose();
      }
    };
  }, [isClient]);

  const getStatusIcon = () => {
    switch (status) {
      case "initializing":
        return <Camera size={24} className="text-white animate-pulse" />;
      case "scanning":
        return <Scan size={24} className="text-white animate-pulse" />;
      case "processing":
        return <Scan size={24} className="text-white animate-pulse" />;
      case "success":
        return <CheckCircle2 size={24} className="text-green-400" />;
      case "no-match":
        return <AlertCircle size={24} className="text-yellow-400" />;
      case "error":
        return <AlertCircle size={24} className="text-red-400" />;
      default:
        return <Camera size={24} className="text-white/60" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "text-green-400";
      case "no-match":
        return "text-yellow-400";
      case "error":
        return "text-red-400";
      default:
        return "text-white/60";
    }
  };

  if (!isClient) {
    return (
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[60] flex items-center justify-center p-4">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-2xl w-full overflow-hidden p-8">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
            <div className="text-white/60 text-sm">Initializing scanner...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[9999] flex items-center justify-center p-2 md:p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-2xl w-full overflow-hidden scanner-modal">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Camera size={20} className="text-white/60" />
            <h3
              className="text-xs uppercase tracking-[0.15em] text-white font-black"
              style={{ fontWeight: 900 }}
            >
              Scan ID / License
            </h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative bg-black scanner-view-container">
          {cameraError ? (
            <div className="scanner-view flex items-center justify-center p-8">
              <div className="text-center">
                <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
                <div className="text-white/80 text-sm mb-2">Camera Access Required</div>
                <div className="text-white/40 text-xs max-w-md">{cameraError}</div>
                <div className="text-white/30 text-[10px] uppercase tracking-wider mt-4">
                  Please allow camera access in your browser settings
                </div>
              </div>
            </div>
          ) : (
            <div ref={viewRef} className="scanner-view" />
          )}

          {/* Scanning Overlay */}
          {status === "scanning" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-4 border-blue-500/50 rounded-2xl w-3/4 h-2/3 animate-pulse">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-blue-500/30 animate-scan" />
              </div>
            </div>
          )}
        </div>

        {/* Status Display */}
        <div className="p-6 border-t border-white/10">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">{getStatusIcon()}</div>
            <div className="flex-1">
              <div className={`text-sm mb-1 ${getStatusColor()}`}>
                {message || "Initializing..."}
              </div>
              <div className="text-[10px] text-white/40 uppercase tracking-[0.15em]">
                {status === "scanning" && "Scan the PDF417 barcode on the back"}
                {status === "processing" && "Processing barcode data..."}
                {status === "initializing" && "Setting up camera..."}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="px-6 pb-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-[10px] text-white/40 uppercase tracking-[0.15em] mb-2">
              Instructions
            </div>
            <div className="text-xs text-white/60 space-y-1">
              <div>• Hold the ID steady in front of the camera</div>
              <div>
                • Scan the <strong>barcode on the back</strong> of the license
              </div>
              <div>
                • Works in <strong>portrait or landscape</strong> orientation
              </div>
              <div>• Keep the barcode centered and in focus</div>
              <div>• Ensure good lighting for best results</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0%,
          100% {
            transform: translateY(-100%);
          }
          50% {
            transform: translateY(100%);
          }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }

        /* Scanner view container - responsive to orientation */
        .scanner-view-container {
          width: 100%;
          position: relative;
        }

        /* Scanner view - adapts to portrait and landscape */
        .scanner-view {
          width: 100%;
          min-height: 400px;
          height: 60vh;
          max-height: 600px;
          position: relative;
        }

        /* Portrait orientation (mobile) */
        @media (orientation: portrait) and (max-width: 768px) {
          .scanner-view {
            min-height: 500px;
            height: 70vh;
            max-height: none;
          }
        }

        /* Landscape orientation (tablet landscape) */
        @media (orientation: landscape) and (max-height: 768px) {
          .scanner-view {
            min-height: 300px;
            height: 50vh;
            max-height: 500px;
          }
        }

        /* Ensure Scandit's video element fills the container */
        .scanner-view :global(video) {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }

        /* Ensure Scandit's canvas overlays match */
        .scanner-view :global(canvas) {
          width: 100% !important;
          height: 100% !important;
        }

        /* Modal container adjustments for different orientations */
        .scanner-modal {
          max-height: 95vh;
          display: flex;
          flex-direction: column;
        }

        /* In portrait mode on mobile, maximize vertical space */
        @media (orientation: portrait) and (max-width: 768px) {
          .scanner-modal {
            max-width: 95vw;
            max-height: calc(
              100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 20px
            );
          }
        }

        /* PWA mode adjustments */
        @media (display-mode: standalone) {
          .scanner-modal {
            max-height: calc(
              100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 20px
            );
          }
        }
      `}</style>
    </div>
  );
}
