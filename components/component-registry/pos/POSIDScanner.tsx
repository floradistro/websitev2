'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, X, AlertCircle, CheckCircle2, Scan } from 'lucide-react';
// @ts-ignore - parse-usdl doesn't have TypeScript definitions
import parseUSDL from 'parse-usdl';

// Dynamsoft types (loaded from CDN, not npm)
declare global {
  interface Window {
    Dynamsoft: any;
  }
}

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
  const [scanner, setScanner] = useState<any>(null);
  const [status, setStatus] = useState<'idle' | 'initializing' | 'scanning' | 'processing' | 'success' | 'no-match' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [cameraError, setCameraError] = useState('');
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [dynamusoftLoaded, setDynamusoftLoaded] = useState(false);

  // Load Dynamsoft library
  useEffect(() => {
    const loadDynamsoft = async () => {
      if (typeof window === 'undefined') return;

      try {
        // Load from CDN if not already loaded
        if (!window.Dynamsoft) {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/dynamsoft-barcode-reader-bundle@11.0.3000/dist/dbr.bundle.js';
          script.async = true;
          script.onload = () => {
            setDynamusoftLoaded(true);
          };
          document.body.appendChild(script);
        } else {
          setDynamusoftLoaded(true);
        }
      } catch (error) {
        console.error('Failed to load Dynamsoft:', error);
        setStatus('error');
        setCameraError('Failed to load barcode scanner library');
      }
    };

    loadDynamsoft();
  }, []);

  // Initialize scanner when library is loaded
  useEffect(() => {
    if (dynamusoftLoaded) {
      initializeScanner();
    }

    return () => {
      if (scanner) {
        try {
          scanner.close();
        } catch (e) {
          console.error('Error closing scanner:', e);
        }
      }
    };
  }, [dynamusoftLoaded]);

  const parseDateToISO = (aamvaDate: string): string => {
    // AAMVA format is MMDDYYYY
    if (aamvaDate && aamvaDate.length === 8) {
      const month = aamvaDate.substring(0, 2);
      const day = aamvaDate.substring(2, 4);
      const year = aamvaDate.substring(4, 8);
      return `${year}-${month}-${day}`;
    }
    return '';
  };

  const initializeScanner = async () => {
    if (!window.Dynamsoft) {
      setCameraError('Barcode scanner library not loaded');
      return;
    }

    try {
      setStatus('initializing');
      setMessage('Starting camera...');

      // Initialize license
      await window.Dynamsoft.License.LicenseManager.initLicense(
        'DLS2eyJoYW5kc2hha2VDb2RlIjoiMjAwMDAxLTE2NDk4Mjk3OTI2MzUiLCJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSIsInNlc3Npb25QYXNzd29yZCI6IndTcGR6Vm05WDJrcEQ5YUoifQ=='
      );

      // Create scanner instance
      const barcodeScanner = await window.Dynamsoft.DBR.BarcodeScanner.createInstance();

      // Configure to only scan PDF417 (driver license barcode)
      const settings = await barcodeScanner.getRuntimeSettings();
      settings.barcodeFormatIds = window.Dynamsoft.DBR.EnumBarcodeFormat.BF_PDF417;
      await barcodeScanner.updateRuntimeSettings(settings);

      // Set up UI
      if (videoContainerRef.current) {
        barcodeScanner.setUIElement(videoContainerRef.current);
      }

      // Set up scan callback
      barcodeScanner.onUnduplicatedRead = async (txt: string, result: any) => {
        await handleBarcodeDetected(txt);
      };

      setScanner(barcodeScanner);

      // Start scanning
      await barcodeScanner.open();
      setStatus('scanning');
      setMessage('Point camera at the barcode on the back of the ID');

    } catch (error: any) {
      console.error('Camera initialization error:', error);
      setStatus('error');
      setCameraError(error.message || 'Failed to access camera');
      setMessage('Camera access denied or not available');
    }
  };

  const handleBarcodeDetected = async (barcodeData: string) => {
    if (!barcodeData || barcodeData.length < 50) {
      return;
    }

    // Stop scanning while processing
    if (scanner) {
      try {
        await scanner.close();
      } catch (e) {
        console.error('Error closing scanner:', e);
      }
    }

    setStatus('processing');
    setMessage('Parsing ID data...');

    try {
      // Parse the barcode data
      const parsed = parseUSDL(barcodeData);

      if (!parsed || !parsed.firstName || !parsed.lastName) {
        throw new Error('Unable to parse ID data');
      }

      // Extract and format the data
      const idData: ScannedIDData = {
        firstName: parsed.firstName || '',
        lastName: parsed.lastName || '',
        middleName: parsed.middleName || '',
        dateOfBirth: parseDateToISO(parsed.dateOfBirth),
        address: parsed.addressStreet || '',
        city: parsed.addressCity || '',
        state: parsed.addressState || '',
        postalCode: parsed.addressPostalCode || '',
        licenseNumber: parsed.licenseNumber || '',
        expirationDate: parseDateToISO(parsed.expirationDate),
      };

      setMessage('Searching for existing customer...');

      // Search for matching customer
      const response = await fetch('/api/pos/customers/match-by-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          setStatus('success');
          setMessage(`Found: ${data.customer.first_name} ${data.customer.last_name}`);

          setTimeout(() => {
            onCustomerFound(data.customer);
          }, 1000);
        } else {
          // No match - show option to create new customer
          setStatus('no-match');
          setMessage('No existing customer found. Create new?');

          setTimeout(() => {
            onNoMatchFoundWithData(idData);
          }, 1500);
        }
      } else {
        throw new Error('Failed to search for customer');
      }

    } catch (error: any) {
      console.error('ID scan error:', error);
      setStatus('error');
      setMessage(error.message || 'Failed to process ID. Please try again.');

      // Restart scanning after 3 seconds
      setTimeout(async () => {
        if (scanner) {
          try {
            await scanner.open();
            setStatus('scanning');
            setMessage('Point camera at the barcode on the back of the ID');
          } catch (e) {
            console.error('Error reopening scanner:', e);
          }
        }
      }, 3000);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'initializing':
        return <Camera size={24} className="text-white animate-pulse" />;
      case 'scanning':
        return <Scan size={24} className="text-white animate-pulse" />;
      case 'processing':
        return <Scan size={24} className="text-white animate-pulse" />;
      case 'success':
        return <CheckCircle2 size={24} className="text-green-400" />;
      case 'no-match':
        return <AlertCircle size={24} className="text-yellow-400" />;
      case 'error':
        return <AlertCircle size={24} className="text-red-400" />;
      default:
        return <Camera size={24} className="text-white/60" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'no-match': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-white/60';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[60] flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Camera size={20} className="text-white/60" />
            <h3 className="text-xs uppercase tracking-[0.15em] text-white font-black" style={{ fontWeight: 900 }}>
              Scan ID / License
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative bg-black">
          {cameraError ? (
            <div className="aspect-video flex items-center justify-center p-8">
              <div className="text-center">
                <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
                <div className="text-white/80 text-sm mb-2">Camera Access Required</div>
                <div className="text-white/40 text-xs max-w-md">
                  {cameraError}
                </div>
                <div className="text-white/30 text-[10px] uppercase tracking-wider mt-4">
                  Please allow camera access in your browser settings
                </div>
              </div>
            </div>
          ) : (
            <div
              ref={videoContainerRef}
              className="aspect-video"
              style={{ minHeight: '400px' }}
            />
          )}

          {/* Scanning Overlay */}
          {status === 'scanning' && (
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
            <div className="flex-shrink-0">
              {getStatusIcon()}
            </div>
            <div className="flex-1">
              <div className={`text-sm mb-1 ${getStatusColor()}`}>
                {message || 'Initializing...'}
              </div>
              <div className="text-[10px] text-white/40 uppercase tracking-[0.15em]">
                {status === 'scanning' && 'Scan the PDF417 barcode on the back'}
                {status === 'processing' && 'Processing barcode data...'}
                {status === 'initializing' && 'Setting up camera...'}
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
              <div>• Scan the <strong>barcode on the back</strong> of the license</div>
              <div>• Keep the barcode within the blue frame</div>
              <div>• Ensure good lighting for best results</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0%, 100% { transform: translateY(-100%); }
          50% { transform: translateY(100%); }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
