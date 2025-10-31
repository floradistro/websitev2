"use client";

import { FileText, X, CheckCircle, Loader } from 'lucide-react';

interface COAUploadPanelProps {
  coaFile: File | null;
  uploadedCoaUrl: string | null;
  uploadingCOA: boolean;
  onCOAUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveCOA: () => void;
}

export default function COAUploadPanel({
  coaFile,
  uploadedCoaUrl,
  uploadingCOA,
  onCOAUpload,
  onRemoveCOA
}: COAUploadPanelProps) {
  return (
    <div className="bg-[#141414] border border-white/5 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-black" style={{ fontWeight: 900 }}>
          Certificate of Analysis (COA)
        </h2>
        <span className="text-red-400 text-[9px] uppercase tracking-wider font-black bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-lg" style={{ fontWeight: 900 }}>
          Required
        </span>
      </div>

      {coaFile ? (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <FileText size={18} className="text-white/60" />
            </div>
            <div>
              <div className="text-white text-[10px] font-black uppercase tracking-tight flex items-center gap-2 mb-1" style={{ fontWeight: 900 }}>
                {coaFile.name}
                {uploadedCoaUrl && (
                  <span className="bg-green-500/20 border border-green-500/40 text-green-400 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.15em] flex items-center gap-1" style={{ fontWeight: 900 }}>
                    <CheckCircle size={8} strokeWidth={2.5} />
                    Uploaded
                  </span>
                )}
                {uploadingCOA && (
                  <span className="bg-blue-500/20 border border-blue-500/40 text-blue-400 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-[0.15em] flex items-center gap-1" style={{ fontWeight: 900 }}>
                    <Loader size={8} strokeWidth={2.5} className="animate-spin" />
                    Uploading
                  </span>
                )}
              </div>
              <div className="text-white/40 text-[9px]">{(coaFile.size / 1024).toFixed(1)} KB</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemoveCOA}
            className="text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-white/10 hover:border-white/20 rounded-2xl p-8 text-center transition-all bg-[#0a0a0a] group">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-white/20 transition-all">
              <FileText size={20} className="text-white/60 group-hover:text-white transition-colors" />
            </div>
            <div className="text-white text-[10px] uppercase tracking-[0.15em] font-black mb-1" style={{ fontWeight: 900 }}>
              Upload Certificate of Analysis
            </div>
            <div className="text-white/40 text-[9px] uppercase tracking-wider">
              PDF format, max 5MB
            </div>
          </div>
          <input
            type="file"
            accept=".pdf"
            onChange={onCOAUpload}
            className="hidden"
          />
        </label>
      )}

      <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
        <div className="flex gap-2">
          <FileText size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-blue-300/90 text-[9px] leading-relaxed">
            All products must include a Certificate of Analysis from an accredited laboratory. COAs must be less than 90 days old.
          </div>
        </div>
      </div>
    </div>
  );
}
