"use client";

import { useEffect, useState, useCallback } from 'react';
import { useVendorAuth } from '@/context/VendorAuthContext';
import { Upload, Image as ImageIcon, Trash2, Copy, Check, Search, Grid, List, X, Scissors, Edit2, Palette, Sparkles, Wand2, Maximize2, Zap, Sun, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { showNotification, showConfirm } from '@/components/NotificationToast';
import ImageEditorModal from '@/components/ImageEditorModal';
import ProcessingMonitor from '@/components/ProcessingMonitor';

interface MediaFile {
  id: string;
  name: string;
  url: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  size: number;
  created_at: string;
  updated_at: string;
}

export default function VendorMediaLibrary() {
  const { vendor, isAuthenticated, isLoading: authLoading } = useVendorAuth();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [dragActive, setDragActive] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [bgRemovalProgress, setBgRemovalProgress] = useState<string>('');
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [showBgPicker, setShowBgPicker] = useState<string | null>(null);
  const [selectedBgColor, setSelectedBgColor] = useState<string>('#ffffff');
  const [editorFile, setEditorFile] = useState<{ name: string; url: string } | null>(null);
  const [showBulkEditor, setShowBulkEditor] = useState(false);
  const [upscaling, setUpscaling] = useState(false);
  const [upscaleProgress, setUpscaleProgress] = useState<string>('');
  const [showUpscaleOptions, setShowUpscaleOptions] = useState<string | null>(null);
  const [processingItems, setProcessingItems] = useState<any[]>([]);
  const [showProcessingMonitor, setShowProcessingMonitor] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      loadMedia();
    }
  }, [authLoading, isAuthenticated]);

}
