"use client";

import { useState } from "react";
import { FileCheck, Download, ChevronDown, ChevronUp } from "lucide-react";

interface LabResultsProps {
  metaData: any[];
  attributes?: any[];
}

export default function LabResults({ metaData, attributes }: LabResultsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Extract lab-related data from meta_data
  const labData: Record<string, any> = {};
  
  metaData.forEach((meta: any) => {
    const key = meta.key.toLowerCase();
    if (
      key.includes("thc") ||
      key.includes("cbd") ||
      key.includes("terpene") ||
      key.includes("cannabinoid") ||
      key.includes("lab") ||
      key.includes("test") ||
      key.includes("coa") ||
      key.includes("certificate")
    ) {
      labData[meta.key] = meta.value;
    }
  });

  // Check attributes for lab info
  attributes?.forEach((attr: any) => {
    const name = attr.name.toLowerCase();
    if (
      name.includes("thc") ||
      name.includes("cbd") ||
      name.includes("terpene") ||
      name.includes("cannabinoid") ||
      name.includes("lab") ||
      name.includes("test")
    ) {
      labData[attr.name] = attr.options?.join(", ") || attr.option;
    }
  });

  // If no lab data found, return null
  if (Object.keys(labData).length === 0) {
    return null;
  }

  // Format the key for display
  const formatKey = (key: string) => {
    return key
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="border border-white/10 bg-white/5 backdrop-blur-sm rounded-lg shadow-sm animate-fadeIn">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-white/10 transition-colors duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-lg">
            <FileCheck size={20} strokeWidth={1.5} className="text-white/90" />
          </div>
          <div className="text-left">
            <h3 className="text-sm uppercase tracking-[0.15em] font-semibold text-white">
              Lab Results & Analysis
            </h3>
            <p className="text-xs text-white/60 font-light mt-0.5">
              Third-party tested for quality & potency
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp size={20} strokeWidth={1.5} className="text-white/60" />
        ) : (
          <ChevronDown size={20} strokeWidth={1.5} className="text-white/60" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-4 animate-fadeIn">
          {/* Certificate Badge */}
          <div className="bg-gradient-to-br from-green-950/80 to-emerald-950/80 border border-green-800/50 rounded-lg p-4 text-center backdrop-blur-sm">
            <div className="inline-flex items-center gap-2 text-green-300 font-semibold text-sm">
              <FileCheck size={16} strokeWidth={2} />
              Certified Lab Tested
            </div>
            <p className="text-xs text-green-400/80 mt-1 font-light">
              Compliant with state regulations
            </p>
          </div>

          {/* Lab Data Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(labData).map(([key, value], idx) => (
              <div
                key={key}
                style={{ animationDelay: `${idx * 50}ms` }}
                className="bg-white/5 border border-white/10 rounded-lg p-4 animate-fadeIn hover:shadow-md hover:bg-white/10 transition-all duration-300"
              >
                <div className="text-xs uppercase tracking-wider text-white/50 mb-1 font-semibold">
                  {formatKey(key)}
                </div>
                <div className="text-base font-light text-white/90">
                  {typeof value === "object" ? JSON.stringify(value) : value}
                </div>
              </div>
            ))}
          </div>

          {/* Download COA Button */}
          {(labData.coa_url || labData.certificate_url || labData.lab_report_url) && (
            <a
              href={
                labData.coa_url ||
                labData.certificate_url ||
                labData.lab_report_url
              }
              target="_blank"
              rel="noopener noreferrer"
              className="w-full border border-white/20 bg-white/10 text-white py-3 rounded-full text-sm uppercase tracking-[0.15em] hover:bg-white hover:text-black transition-all duration-300 flex items-center justify-center gap-2 font-light shadow-sm hover:shadow-md"
            >
              <Download size={16} strokeWidth={1.5} />
              Download Full Certificate of Analysis
            </a>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-white/50 leading-relaxed font-light pt-3 border-t border-white/10">
            * Lab results are provided by licensed third-party testing facilities.
            Results may vary by batch. Always check the batch number on your product
            packaging.
          </p>
        </div>
      )}
    </div>
  );
}

