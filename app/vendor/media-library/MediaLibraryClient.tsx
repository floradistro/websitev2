"use client";

import { useEffect, useState } from 'react';
import { useVendorAuth } from '@/context/VendorAuthContext';
import { Upload } from 'lucide-react';

interface MediaFile {
  id: string;
  name: string;
  url: string;
  size: number;
  created_at: string;
}

export default function VendorMediaLibrary() {
  const { vendor, isAuthenticated, isLoading: authLoading } = useVendorAuth();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && isAuthenticated && vendor) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, vendor]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60 text-sm uppercase tracking-wider">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/60">Please log in to access the media library.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Media Library</h1>
        
        <div className="bg-white/5 border border-white/10 rounded-lg p-12 text-center">
          <Upload className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h2 className="text-xl text-white/60 mb-2">Media Library Coming Soon</h2>
          <p className="text-white/40">Upload and manage your product images here.</p>
        </div>
      </div>
    </div>
  );
}
