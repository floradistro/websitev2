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

  const handleScanComplete = async (scannedData: AAMVAData) => {
    setIsProcessing(true);

    try {
      // Call API to lookup/create customer
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
        // Customer found or created
        onCustomerFound(result.customer);
      } else if (result.error) {
        // Error occurred
        console.error("[ID Scanner] Error:", result.error);
        // Convert AAMVA data to ScannedIDData format for fallback
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

  return (
    <>
      <SimpleIDScanner onScanComplete={handleScanComplete} onClose={onClose} />

      {/* Processing overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white/10 border-2 border-white/20 rounded-2xl p-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              <p className="text-white font-bold text-lg">Looking up customer...</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
