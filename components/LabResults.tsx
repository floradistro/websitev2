"use client";

import { QrCode } from "lucide-react";

interface LabResultsProps {
  metaData: any[];
  attributes?: any[];
}

export default function LabResults({ metaData, attributes }: LabResultsProps) {
  // Extract THCa percentage
  let thcaValue = "";
  
  metaData.forEach((meta: any) => {
    const key = meta.key.toLowerCase();
    if (key.includes("thca") && key.includes("%")) {
      thcaValue = meta.value;
    }
  });

  // Extract COA URL
  let coaUrl = "";
  
  metaData.forEach((meta: any) => {
    const key = meta.key.toLowerCase();
    if (key.includes("coa") || key.includes("certificate") || key.includes("lab_report")) {
      if (meta.value && (meta.value.startsWith("http") || meta.value.startsWith("www"))) {
        coaUrl = meta.value;
      }
    }
  });

  // If no THCa data found, return null
  if (!thcaValue) {
    return null;
  }

  return (
    <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-lg p-6 md:p-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        {/* THCa Percentage */}
        <div>
          <div className="text-sm uppercase tracking-wider text-white/50 mb-2 font-light">
            THCa
          </div>
          <div className="text-3xl md:text-4xl font-light text-white">
            {thcaValue}
          </div>
        </div>

        {/* QR Code Link */}
        {coaUrl && (
          <a
            href={coaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-20 h-20 md:w-24 md:h-24 border-2 border-white/20 bg-white/5 rounded-lg hover:bg-white/10 hover:border-white/40 transition-all duration-300"
            title="View Lab Results"
          >
            <QrCode size={40} strokeWidth={1.5} className="text-white md:w-12 md:h-12" />
          </a>
        )}
      </div>
    </div>
  );
}

