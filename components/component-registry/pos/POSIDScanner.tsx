"use client";

import { useState } from "react";
import { SimpleIDScanner } from "./SimpleIDScanner";
import type { AAMVAData } from "@/lib/id-scanner/aamva-parser";

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
  locationId: string;
  onCustomerFound: (customer: any) => void;
  onNoMatchFoundWithData: (data: ScannedIDData) => void;
  onClose: () => void;
}

/**
 * POS ID Scanner Component
 * Wraps the SimpleIDScanner and handles customer lookup/creation
 */
export function POSIDScanner({
  vendorId,
  locationId,
  onCustomerFound,
  onNoMatchFoundWithData,
  onClose,
}: POSIDScannerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [matchConfirmation, setMatchConfirmation] = useState<{
    customer: any;
    scannedData: AAMVAData;
  } | null>(null);

  const handleScanComplete = async (scannedData: AAMVAData) => {
    setIsProcessing(true);

    try {
      // Call API to lookup customer
      const response = await fetch("/api/pos/customers/scan-id", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scannedData,
          vendorId,
          locationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process ID scan");
      }

      const result = await response.json();

      if (result.success && result.customer) {
        // Customer found
        if (result.requiresConfirmation) {
          // Show confirmation dialog for fuzzy matches
          setMatchConfirmation({ customer: result.customer, scannedData });
          setIsProcessing(false);
        } else {
          // Exact match - auto-select
          onCustomerFound(result.customer);
        }
      } else {
        // No match found - provide scanned data to create new
        const fallbackData: ScannedIDData = {
          firstName: scannedData.firstName || "",
          lastName: scannedData.lastName || "",
          middleName: scannedData.middleName,
          dateOfBirth: scannedData.dateOfBirth || "",
          address: scannedData.streetAddress || "",
          city: scannedData.city || "",
          state: scannedData.state || "",
          postalCode: scannedData.zipCode || "",
          licenseNumber: scannedData.licenseNumber || "",
          expirationDate: scannedData.expirationDate || "",
        };
        onNoMatchFoundWithData(fallbackData);
      }
    } catch (error) {
      console.error("[ID Scanner] Failed to process scan:", error);
      // On error, still provide the scanned data
      const fallbackData: ScannedIDData = {
        firstName: scannedData.firstName || "",
        lastName: scannedData.lastName || "",
        middleName: scannedData.middleName,
        dateOfBirth: scannedData.dateOfBirth || "",
        address: scannedData.streetAddress || "",
        city: scannedData.city || "",
        state: scannedData.state || "",
        postalCode: scannedData.zipCode || "",
        licenseNumber: scannedData.licenseNumber || "",
        expirationDate: scannedData.expirationDate || "",
      };
      onNoMatchFoundWithData(fallbackData);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmMatch = () => {
    if (matchConfirmation) {
      onCustomerFound(matchConfirmation.customer);
      setMatchConfirmation(null);
    }
  };

  const handleRejectMatch = () => {
    if (matchConfirmation) {
      // Create new customer with scanned data
      const fallbackData: ScannedIDData = {
        firstName: matchConfirmation.scannedData.firstName || "",
        lastName: matchConfirmation.scannedData.lastName || "",
        middleName: matchConfirmation.scannedData.middleName,
        dateOfBirth: matchConfirmation.scannedData.dateOfBirth || "",
        address: matchConfirmation.scannedData.streetAddress || "",
        city: matchConfirmation.scannedData.city || "",
        state: matchConfirmation.scannedData.state || "",
        postalCode: matchConfirmation.scannedData.zipCode || "",
        licenseNumber: matchConfirmation.scannedData.licenseNumber || "",
        expirationDate: matchConfirmation.scannedData.expirationDate || "",
      };
      onNoMatchFoundWithData(fallbackData);
      setMatchConfirmation(null);
    }
  };

  return (
    <>
      <SimpleIDScanner onScanComplete={handleScanComplete} onClose={onClose} />

      {/* Processing overlay */}
      {isProcessing && (
        <div className="fixed inset-0 left-0 top-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white/10 border-2 border-white/20 rounded-2xl p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              <p className="text-white font-bold text-lg">Looking up customer...</p>
            </div>
          </div>
        </div>
      )}

      {/* Customer Match Confirmation */}
      {matchConfirmation && (
        <div className="fixed inset-0 left-0 top-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto">
          <div className="bg-gradient-to-b from-white/[0.12] to-white/[0.06] border border-yellow-500/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">⚠️</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">
                  Customer Match Found
                </h3>
                <p className="text-sm text-white/70">Is this the same person?</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              {/* Scanned Data */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-xs text-blue-300 uppercase tracking-wider mb-2 font-bold">Scanned ID</p>
                <div className="space-y-1.5">
                  <div>
                    <p className="text-xs text-white/50">Name</p>
                    <p className="text-sm font-bold text-white">
                      {[
                        matchConfirmation.scannedData.firstName,
                        matchConfirmation.scannedData.lastName,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                  </div>
                  {matchConfirmation.scannedData.dateOfBirth && (
                    <div>
                      <p className="text-xs text-white/50">DOB</p>
                      <p className="text-sm font-semibold text-white">
                        {matchConfirmation.scannedData.dateOfBirth}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Existing Customer */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-xs text-green-300 uppercase tracking-wider mb-2 font-bold">
                  Existing Customer
                </p>
                <div className="space-y-1.5">
                  <div>
                    <p className="text-xs text-white/50">Name</p>
                    <p className="text-sm font-bold text-white">
                      {matchConfirmation.customer.first_name} {matchConfirmation.customer.last_name}
                    </p>
                  </div>
                  {matchConfirmation.customer.date_of_birth && (
                    <div>
                      <p className="text-xs text-white/50">DOB</p>
                      <p className="text-sm font-semibold text-white">
                        {matchConfirmation.customer.date_of_birth}
                      </p>
                    </div>
                  )}
                  {matchConfirmation.customer.email && (
                    <div>
                      <p className="text-xs text-white/50">Email</p>
                      <p className="text-xs font-semibold text-white/90 truncate">
                        {matchConfirmation.customer.email}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRejectMatch}
                className="flex-1 px-4 py-3 bg-white/[0.08] border border-white/20 rounded-xl text-white text-sm font-bold uppercase tracking-wide hover:bg-white/[0.12] transition-all duration-200"
              >
                No, Create New
              </button>
              <button
                onClick={handleConfirmMatch}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl text-sm font-bold uppercase tracking-wide hover:from-green-500 hover:to-green-600 transition-all duration-200 shadow-lg shadow-green-900/30"
              >
                Yes, Same Person
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
