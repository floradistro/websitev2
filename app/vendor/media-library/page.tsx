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

  async function loadMedia() {
    try {
      setLoading(true);
      const vendorId = localStorage.getItem('vendor_id');
      if (!vendorId) return;

      const response = await axios.get('/api/vendor/media', {
        headers: { 'x-vendor-id': vendorId }
      });

      if (response.data.success) {
        // Add optimized thumbnail URLs using Supabase transform API
        const filesWithThumbnails = response.data.files.map((file: MediaFile) => ({
          ...file,
          thumbnailUrl: getOptimizedImageUrl(file.url, 300, 300),
          previewUrl: getOptimizedImageUrl(file.url, 800, 800)
        }));
        setFiles(filesWithThumbnails);
      }
    } catch (error) {
      console.error('Error loading media:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load media library'
      });
    } finally {
      setLoading(false);
    }
  }

  // Generate optimized Supabase image URL with transformations
  const getOptimizedImageUrl = (url: string, width: number, height: number) => {
    if (!url) return url;
    
    // Convert public URL to render URL with transformations
    // From: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
    // To:   https://[project].supabase.co/storage/v1/render/image/public/[bucket]/[path]?width=X&height=Y&resize=cover&quality=80
    
    const renderUrl = url
      .replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
      + `?width=${width}&height=${height}&resize=cover&quality=75`;
    
    return renderUrl;
  };

  const handleFileUpload = async (uploadFiles: FileList | null) => {
    if (!uploadFiles || uploadFiles.length === 0) return;

    setUploading(true);
    const vendorId = localStorage.getItem('vendor_id');
    
    try {
      const uploadPromises = Array.from(uploadFiles).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        return axios.post('/api/vendor/media', formData, {
          headers: { 'x-vendor-id': vendorId }
        });
      });

      await Promise.all(uploadPromises);

      showNotification({
        type: 'success',
        title: 'Upload Complete',
        message: `${uploadFiles.length} file(s) uploaded successfully`
      });

      loadMedia();
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Upload Failed',
        message: error.response?.data?.error || 'Failed to upload files'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileName: string) => {
    await showConfirm({
      title: 'Delete Image',
      message: 'Are you sure you want to delete this image? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'warning',
      onConfirm: async () => {
        try {
          const vendorId = localStorage.getItem('vendor_id');
          await axios.delete(`/api/vendor/media?file=${encodeURIComponent(fileName)}`, {
            headers: { 'x-vendor-id': vendorId }
          });

          showNotification({
            type: 'success',
            title: 'Deleted',
            message: 'Image deleted successfully'
          });

          loadMedia();
        } catch (error: any) {
          showNotification({
            type: 'error',
            title: 'Delete Failed',
            message: error.response?.data?.error || 'Failed to delete image'
          });
        }
      }
    });
  };

  const startEditing = (fileName: string) => {
    setEditingFile(fileName);
    // Remove extension for editing
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    setEditingName(nameWithoutExt);
  };

  const cancelEditing = () => {
    setEditingFile(null);
    setEditingName('');
  };

  const handleRename = async (oldFileName: string) => {
    if (!editingName.trim()) {
      showNotification({
        type: 'error',
        title: 'Invalid Name',
        message: 'Filename cannot be empty'
      });
      return;
    }

    try {
      const vendorId = localStorage.getItem('vendor_id');
      
      // Get file extension from original
      const oldExt = oldFileName.split('.').pop();
      const newFileName = `${editingName.trim()}.${oldExt}`;
      
      // Don't rename if name hasn't changed
      if (newFileName === oldFileName) {
        cancelEditing();
        return;
      }

      const response = await axios.put('/api/vendor/media/rename',
        { oldName: oldFileName, newName: newFileName },
        { headers: { 'x-vendor-id': vendorId } }
      );

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Renamed',
          message: `Renamed to ${newFileName}`
        });
        
        // Update selected files if the renamed file was selected
        if (selectedFiles.has(oldFileName)) {
          const newSelected = new Set(selectedFiles);
          newSelected.delete(oldFileName);
          newSelected.add(newFileName);
          setSelectedFiles(newSelected);
        }
        
        cancelEditing();
        loadMedia();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Rename Failed',
        message: error.response?.data?.error || 'Failed to rename image'
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;

    await showConfirm({
      title: 'Delete Images',
      message: `Are you sure you want to delete ${selectedFiles.size} image(s)? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'warning',
      onConfirm: async () => {
        try {
          const vendorId = localStorage.getItem('vendor_id');
          const deletePromises = Array.from(selectedFiles).map(fileName =>
            axios.delete(`/api/vendor/media?file=${encodeURIComponent(fileName)}`, {
              headers: { 'x-vendor-id': vendorId }
            })
          );

          await Promise.all(deletePromises);

          showNotification({
            type: 'success',
            title: 'Deleted',
            message: `${selectedFiles.size} image(s) deleted successfully`
          });

          setSelectedFiles(new Set());
          loadMedia();
        } catch (error: any) {
          showNotification({
            type: 'error',
            title: 'Delete Failed',
            message: 'Failed to delete some images'
          });
        }
      }
    });
  };

  const handleRemoveBackground = async (fileName: string, imageUrl: string) => {
    setRemovingBg(true);
    setBgRemovalProgress(`⚡ Removing background (MAX quality)...`);

    try {
      const vendorId = localStorage.getItem('vendor_id');
      const response = await axios.post('/api/vendor/media/remove-bg', 
        { imageUrl, fileName },
        { headers: { 'x-vendor-id': vendorId } }
      );

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Background Removed (MAX Quality)',
          message: `✨ Replaced ${fileName} with premium transparent version`
        });
        loadMedia();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Remove Background Failed',
        message: error.response?.data?.error || 'Failed to remove background'
      });
    } finally {
      setRemovingBg(false);
      setBgRemovalProgress('');
    }
  };

  const handleAddBackground = async (fileName: string, imageUrl: string, color: string) => {
    setRemovingBg(true);
    setBgRemovalProgress(`Adding ${color} background...`);

    try {
      const vendorId = localStorage.getItem('vendor_id');
      const response = await axios.post('/api/vendor/media/add-background', 
        { imageUrl, fileName, backgroundColor: color },
        { headers: { 'x-vendor-id': vendorId } }
      );

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: 'Background Added',
          message: `Created ${response.data.file.name} with ${color} background`
        });
        setShowBgPicker(null);
        loadMedia();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Add Background Failed',
        message: error.response?.data?.error || 'Failed to add background'
      });
    } finally {
      setRemovingBg(false);
      setBgRemovalProgress('');
    }
  };

  const handleBulkRemoveBackground = async () => {
    if (selectedFiles.size === 0) return;

    await showConfirm({
      title: 'Remove Backgrounds (MAX Quality)',
      message: `Remove backgrounds from ${selectedFiles.size} image(s)? Original images will be replaced with MAX quality transparent versions. Real-time progress monitor will show each completion.`,
      confirmText: 'Remove Backgrounds',
      cancelText: 'Cancel',
      type: 'warning',
      onConfirm: async () => {
        const filesToProcess = Array.from(selectedFiles).map(fileName => {
          const file = files.find(f => f.name === fileName);
          return {
            name: fileName,
            url: file?.url || ''
          };
        }).filter(f => f.url);

        // Initialize progress items
        const initialItems = filesToProcess.map(f => ({
          id: f.name,
          name: f.name,
          status: 'pending' as const,
        }));
        
        setProcessingItems(initialItems);
        setRemovingBg(true);

        try {
          const vendorId = localStorage.getItem('vendor_id');
          
          // Use streaming endpoint for real-time updates
          const response = await fetch('/api/vendor/media/remove-bg-stream', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-vendor-id': vendorId || '',
            },
            body: JSON.stringify({
              files: filesToProcess,
              concurrency: 50
            }),
          });

          if (!response.body) throw new Error('No response stream');

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'processing') {
                  setProcessingItems(prev =>
                    prev.map(item =>
                      item.name === data.fileName
                        ? { ...item, status: 'processing', startTime: Date.now() }
                        : item
                    )
                  );
                } else if (data.type === 'success') {
                  setProcessingItems(prev =>
                    prev.map(item =>
                      item.name === data.fileName
                        ? { ...item, status: 'success', endTime: Date.now() }
                        : item
                    )
                  );
                } else if (data.type === 'error') {
                  setProcessingItems(prev =>
                    prev.map(item =>
                      item.name === data.fileName
                        ? { ...item, status: 'error', error: data.error, endTime: Date.now() }
                        : item
                    )
                  );
                }
              }
            }
          }

          setSelectedFiles(new Set());
          
          // Reload media and reset after brief delay
          setTimeout(() => {
            loadMedia();
            setProcessingItems([]);
            
            const successCount = processingItems.filter(i => i.status === 'success').length;
            const failedCount = processingItems.filter(i => i.status === 'error').length;
            
            if (successCount > 0) {
              showNotification({
                type: failedCount > 0 ? 'warning' : 'success',
                title: 'Background Removal Complete',
                message: `✅ ${successCount} processed${failedCount > 0 ? `, ❌ ${failedCount} failed` : ''}`
              });
            }
          }, 2000);

        } catch (error: any) {
          showNotification({
            type: 'error',
            title: 'Bulk Remove Failed',
            message: error.message || 'Failed to remove backgrounds'
          });
          setProcessingItems([]);
        } finally {
          setRemovingBg(false);
        }
      }
    });
  };

  const handleUpscale = async (fileName: string, imageUrl: string, scale: number) => {
    setUpscaling(true);
    setUpscaleProgress(`🔬 AI Upscaling ${scale}x (Real-ESRGAN)...`);
    setShowUpscaleOptions(null);

    try {
      const vendorId = localStorage.getItem('vendor_id');
      const response = await axios.post('/api/vendor/media/upscale',
        { imageUrl, fileName, scale },
        { 
          headers: { 'x-vendor-id': vendorId },
          timeout: 120000
        }
      );

      if (response.data.success) {
        showNotification({
          type: 'success',
          title: `${scale}x Upscale Complete`,
          message: `✨ Crystal-clear ${fileName} ready for zoom!`
        });
        loadMedia();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Upscale Failed',
        message: error.response?.data?.error || 'Failed to upscale image'
      });
    } finally {
      setUpscaling(false);
      setUpscaleProgress('');
    }
  };

  const handleBulkUpscale = async (scale: number) => {
    if (selectedFiles.size === 0) return;

    await showConfirm({
      title: `${scale}x AI Upscaling`,
      message: `Upscale ${selectedFiles.size} image(s) to ${scale}x resolution? Original images will be replaced with crystal-clear versions. Real-time progress monitor will show each completion.`,
      confirmText: `Upscale ${scale}x`,
      cancelText: 'Cancel',
      type: 'info',
      onConfirm: async () => {
        const filesToProcess = Array.from(selectedFiles).map(fileName => {
          const file = files.find(f => f.name === fileName);
          return {
            name: fileName,
            url: file?.url || ''
          };
        }).filter(f => f.url);

        // Initialize progress items
        const initialItems = filesToProcess.map(f => ({
          id: f.name,
          name: f.name,
          status: 'pending' as const,
        }));
        
        setProcessingItems(initialItems);
        setUpscaling(true);

        try {
          const vendorId = localStorage.getItem('vendor_id');
          
          // Use streaming endpoint for real-time updates
          const response = await fetch('/api/vendor/media/upscale-stream', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-vendor-id': vendorId || '',
            },
            body: JSON.stringify({
              files: filesToProcess,
              scale,
              concurrency: 20
            }),
          });

          if (!response.body) throw new Error('No response stream');

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'processing') {
                  setProcessingItems(prev =>
                    prev.map(item =>
                      item.name === data.fileName
                        ? { ...item, status: 'processing', startTime: Date.now() }
                        : item
                    )
                  );
                } else if (data.type === 'success') {
                  setProcessingItems(prev =>
                    prev.map(item =>
                      item.name === data.fileName
                        ? { ...item, status: 'success', endTime: Date.now() }
                        : item
                    )
                  );
                } else if (data.type === 'error') {
                  setProcessingItems(prev =>
                    prev.map(item =>
                      item.name === data.fileName
                        ? { ...item, status: 'error', error: data.error, endTime: Date.now() }
                        : item
                    )
                  );
                } else if (data.type === 'info') {
                  console.log(`ℹ️ ${data.fileName}: ${data.message}`);
                }
              }
            }
          }

          setSelectedFiles(new Set());
          
          // Reload media and reset after brief delay
          setTimeout(() => {
            loadMedia();
            setProcessingItems([]);
            
            const successCount = processingItems.filter(i => i.status === 'success').length;
            const failedCount = processingItems.filter(i => i.status === 'error').length;
            
            if (successCount > 0) {
              showNotification({
                type: failedCount > 0 ? 'warning' : 'success',
                title: 'Upscaling Complete',
                message: `✅ ${successCount} upscaled${failedCount > 0 ? `, ❌ ${failedCount} failed` : ''}`
              });
            }
          }, 2000);

        } catch (error: any) {
          showNotification({
            type: 'error',
            title: 'Bulk Upscale Failed',
            message: error.message || 'Failed to upscale images'
          });
          setProcessingItems([]);
        } finally {
          setUpscaling(false);
        }
      }
    });
  };

  const handleBulkEnhanceColor = async () => {
    if (selectedFiles.size === 0) return;

    await showConfirm({
      title: 'Auto-Enhance Images',
      message: `Fix brightness and colors for ${selectedFiles.size} image(s)? Cloudinary AI will auto-correct exposure, color balance, and contrast. Real-time progress in toolbar.`,
      confirmText: 'Auto-Enhance',
      cancelText: 'Cancel',
      type: 'info',
      onConfirm: async () => {
        const filesToProcess = Array.from(selectedFiles).map(fileName => {
          const file = files.find(f => f.name === fileName);
          return {
            name: fileName,
            url: file?.url || ''
          };
        }).filter(f => f.url);

        const initialItems = filesToProcess.map(f => ({
          id: f.name,
          name: f.name,
          status: 'pending' as const,
        }));
        
        setProcessingItems(initialItems);
        setRemovingBg(true);

        try {
          const vendorId = localStorage.getItem('vendor_id');
          
          const response = await fetch('/api/vendor/media/enhance-stream', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-vendor-id': vendorId || '',
            },
            body: JSON.stringify({
              files: filesToProcess,
              concurrency: 30
            }),
          });

          if (!response.body) throw new Error('No response stream');

          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = JSON.parse(line.slice(6));

                if (data.type === 'processing') {
                  setProcessingItems(prev =>
                    prev.map(item =>
                      item.name === data.fileName
                        ? { ...item, status: 'processing', startTime: Date.now() }
                        : item
                    )
                  );
                } else if (data.type === 'success') {
                  setProcessingItems(prev =>
                    prev.map(item =>
                      item.name === data.fileName
                        ? { ...item, status: 'success', endTime: Date.now() }
                        : item
                    )
                  );
                } else if (data.type === 'error') {
                  setProcessingItems(prev =>
                    prev.map(item =>
                      item.name === data.fileName
                        ? { ...item, status: 'error', error: data.error, endTime: Date.now() }
                        : item
                    )
                  );
                }
              }
            }
          }

          setSelectedFiles(new Set());
          
          setTimeout(() => {
            loadMedia();
            setProcessingItems([]);
            
            const successCount = processingItems.filter(i => i.status === 'success').length;
            const failedCount = processingItems.filter(i => i.status === 'error').length;
            
            if (successCount > 0) {
              showNotification({
                type: failedCount > 0 ? 'warning' : 'success',
                title: 'Auto-Enhancement Complete',
                message: `✨ ${successCount} enhanced${failedCount > 0 ? `, ❌ ${failedCount} failed` : ''}`
              });
            }
          }, 2000);

        } catch (error: any) {
          showNotification({
            type: 'error',
            title: 'Enhancement Failed',
            message: error.message || 'Failed to enhance images'
          });
          setProcessingItems([]);
        } finally {
          setRemovingBg(false);
        }
      }
    });
  };

  const handleBulkEnhance = async (options: any) => {
    if (selectedFiles.size === 0) return;

    setRemovingBg(true);
    setBgRemovalProgress(`⚡ Bulk enhancing ${selectedFiles.size} images...`);

    try {
      const vendorId = localStorage.getItem('vendor_id');
      
      const filesToProcess = Array.from(selectedFiles).map(fileName => {
        const file = files.find(f => f.name === fileName);
        return {
          name: fileName,
          url: file?.url || ''
        };
      }).filter(f => f.url);

      const response = await axios.post('/api/vendor/media/bulk-enhance',
        {
          files: filesToProcess,
          options,
          concurrency: 10
        },
        {
          headers: { 'x-vendor-id': vendorId },
          timeout: 300000
        }
      );

      if (response.data.success) {
        if (response.data.failed > 0) {
          showNotification({
            type: 'warning',
            title: 'Bulk Enhancement Partial Success',
            message: `✅ ${response.data.processed} succeeded, ❌ ${response.data.failed} failed.`
          });
        } else {
          showNotification({
            type: 'success',
            title: 'Bulk Enhancement Complete',
            message: `✨ Successfully enhanced all ${response.data.processed} image(s)`
          });
        }
        
        setSelectedFiles(new Set());
        setShowBulkEditor(false);
        loadMedia();
      }
    } catch (error: any) {
      showNotification({
        type: 'error',
        title: 'Bulk Enhancement Failed',
        message: error.response?.data?.error || 'Failed to enhance images'
      });
    } finally {
      setRemovingBg(false);
      setBgRemovalProgress('');
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    showNotification({
      type: 'success',
      title: 'Copied',
      message: 'Image URL copied to clipboard'
    });
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const toggleFileSelection = (fileName: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileName)) {
      newSelected.delete(fileName);
    } else {
      newSelected.add(fileName);
    }
    setSelectedFiles(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length && filteredFiles.length > 0) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.name)));
    }
  };

  const selectRange = (fileName: string) => {
    const fileNames = filteredFiles.map(f => f.name);
    const clickedIndex = fileNames.indexOf(fileName);
    
    if (selectedFiles.size === 0) {
      setSelectedFiles(new Set([fileName]));
      return;
    }
    
    const selectedArray = Array.from(selectedFiles);
    const lastSelected = selectedArray[selectedArray.length - 1];
    const lastIndex = fileNames.indexOf(lastSelected);
    
    const start = Math.min(clickedIndex, lastIndex);
    const end = Math.max(clickedIndex, lastIndex);
    
    const newSelected = new Set(selectedFiles);
    for (let i = start; i <= end; i++) {
      newSelected.add(fileNames[i]);
    }
    setSelectedFiles(newSelected);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-full animate-fadeIn overflow-x-hidden">
      {/* Header */}
      <div className="flex justify-between items-center gap-4 px-4 lg:px-0 py-6 lg:py-0 lg:mb-8 border-b lg:border-b-0 border-white/5">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl lg:text-3xl font-light text-white mb-1 lg:mb-2 tracking-tight">
            Media Library
          </h1>
          <p className="text-white/60 text-xs lg:text-sm">
            {filteredFiles.length} {filteredFiles.length === 1 ? 'image' : 'images'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="group flex items-center justify-center bg-transparent border border-white/20 text-white/80 w-[44px] h-[44px] lg:w-auto lg:h-auto lg:px-4 lg:py-3 text-xs font-medium uppercase tracking-wider active:bg-white/10 lg:hover:bg-white/10 lg:hover:text-white lg:hover:border-white/30 transition-all duration-300"
          >
            {viewMode === 'grid' ? <List size={18} /> : <Grid size={18} />}
          </button>
          <label className="group flex items-center gap-2 bg-black border border-white/20 text-white px-3 lg:px-6 py-3 text-[10px] lg:text-xs font-medium uppercase tracking-wider active:bg-white active:text-black lg:hover:bg-white lg:hover:text-black lg:hover:border-white transition-all duration-300 cursor-pointer whitespace-nowrap min-h-[44px] lg:min-h-0">
            <Upload size={16} className="lg:w-[18px] lg:h-[18px]" />
            <span className="hidden sm:inline">Upload Images</span>
            <span className="sm:hidden">Upload</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Bulk Actions / Processing Progress */}
      {(selectedFiles.size > 0 || upscaling || removingBg) && (
        <div className="sticky top-0 lg:static bg-black lg:bg-[#1a1a1a] border-t lg:border border-white/20 lg:border-white/10 p-4 z-50 mb-0 lg:mb-4">
          {/* Processing in progress */}
          {(upscaling || removingBg) && processingItems.length > 0 ? (
            <div className="space-y-3">
              {/* Progress Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-medium mb-1">
                    {upscaling ? '🔬 AI Upscaling' : '✨ Background Removal'} in Progress
                  </div>
                  <div className="text-white/60 text-sm">
                    {processingItems.filter(i => i.status === 'success' || i.status === 'error').length}/{processingItems.length} processed
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-green-600/10 border border-green-500/20 px-3 py-1.5">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-500 text-sm font-medium">
                      {processingItems.filter(i => i.status === 'success').length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-red-600/10 border border-red-500/20 px-3 py-1.5">
                    <X className="w-4 h-4 text-red-500" />
                    <span className="text-red-500 text-sm font-medium">
                      {processingItems.filter(i => i.status === 'error').length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 px-3 py-1.5">
                    <Zap className="w-4 h-4 text-blue-500 animate-pulse" />
                    <span className="text-blue-500 text-sm font-medium">
                      {processingItems.filter(i => i.status === 'processing').length}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div>
                <div className="h-2 bg-white/5 overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-green-500 to-green-500 transition-all duration-500 relative overflow-hidden"
                    style={{ 
                      width: `${((processingItems.filter(i => i.status === 'success' || i.status === 'error').length / processingItems.length) * 100)}%` 
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" 
                         style={{ animation: 'shimmer 2s infinite linear' }} />
                  </div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-white/60">
                  <span>{Math.round((processingItems.filter(i => i.status === 'success' || i.status === 'error').length / processingItems.length) * 100)}% complete</span>
                  <span>
                    {processingItems.filter(i => i.endTime && i.startTime).length > 0 &&
                      `${(processingItems.filter(i => i.endTime && i.startTime).reduce((acc, i) => acc + ((i.endTime! - i.startTime!) / 1000), 0) / processingItems.filter(i => i.endTime && i.startTime).length).toFixed(1)}s avg`
                    }
                  </span>
                </div>
              </div>

              {/* Live Items Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                {processingItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-2 p-2 border transition-all text-xs ${
                      item.status === 'success'
                        ? 'bg-green-600/5 border-green-500/20'
                        : item.status === 'error'
                        ? 'bg-red-600/5 border-red-500/20'
                        : item.status === 'processing'
                        ? 'bg-blue-600/5 border-blue-500/20'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    {item.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                    {item.status === 'error' && <X className="w-4 h-4 text-red-500 flex-shrink-0" />}
                    {item.status === 'processing' && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />}
                    {item.status === 'pending' && <div className="w-4 h-4 rounded-full border-2 border-white/20 flex-shrink-0" />}
                    <span className="flex-1 truncate text-white/80">{item.name}</span>
                    {item.endTime && item.startTime && (
                      <span className="text-white/40">{((item.endTime - item.startTime) / 1000).toFixed(1)}s</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Regular Bulk Actions */
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-white font-medium">{selectedFiles.size} selected</span>
                <button
                  onClick={() => setSelectedFiles(new Set())}
                  className="text-white/60 hover:text-white text-sm transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleBulkEnhanceColor()}
                  disabled={upscaling || removingBg}
                  className="flex items-center gap-2 bg-yellow-600/10 border border-yellow-500/20 text-yellow-500 px-4 lg:px-6 py-3 font-medium hover:bg-yellow-600/20 transition-all disabled:opacity-50 text-xs lg:text-sm relative"
                >
                  <Sun className="w-4 h-4" />
                  <span className="hidden sm:inline">Auto-Enhance</span>
                  <span className="sm:hidden">Fix</span>
                  <Sparkles size={10} className="absolute -top-1 -right-1 text-orange-400" />
                </button>
                <button
                  onClick={() => handleBulkUpscale(4)}
                  disabled={upscaling || removingBg}
                  className="flex items-center gap-2 bg-green-600/10 border border-green-500/20 text-green-500 px-4 lg:px-6 py-3 font-medium hover:bg-green-600/20 transition-all disabled:opacity-50 text-xs lg:text-sm relative"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Upscale 4x</span>
                  <span className="sm:hidden">4x</span>
                  <Sparkles size={10} className="absolute -top-1 -right-1 text-yellow-400" />
                </button>
                <button
                  onClick={() => setShowBulkEditor(true)}
                  className="flex items-center gap-2 bg-purple-600/10 border border-purple-500/20 text-purple-500 px-4 lg:px-6 py-3 font-medium hover:bg-purple-600/20 transition-all text-xs lg:text-sm"
                >
                  <Wand2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Enhance</span>
                  <span className="sm:hidden">Edit</span>
                </button>
                <button
                  onClick={handleBulkRemoveBackground}
                  disabled={removingBg || upscaling}
                  className="flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 text-blue-500 px-4 lg:px-6 py-3 font-medium hover:bg-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs lg:text-sm"
                >
                  <Scissors className="w-4 h-4" />
                  <span className="hidden sm:inline">Remove BG</span>
                  <span className="sm:hidden">BG</span>
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 bg-red-600/10 border border-red-500/20 text-red-500 px-4 lg:px-6 py-3 font-medium hover:bg-red-600/20 transition-all text-xs lg:text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete</span>
                  <span className="sm:hidden">Del</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Background Removal Progress */}
      {removingBg && (
        <div className="bg-blue-600/10 border border-blue-500/20 p-4 mb-0 lg:mb-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
            <div>
              <div className="text-blue-500 font-medium text-sm">Processing Images</div>
              <div className="text-blue-400 text-xs">{bgRemovalProgress}</div>
            </div>
          </div>
        </div>
      )}

      {/* Upscaling Progress */}
      {upscaling && (
        <div className="bg-green-600/10 border border-green-500/20 p-4 mb-0 lg:mb-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-500 border-t-transparent"></div>
            <div>
              <div className="text-green-500 font-medium text-sm">AI Upscaling (Real-ESRGAN)</div>
              <div className="text-green-400 text-xs">{upscaleProgress}</div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Quick Select */}
      <div className="bg-[#1a1a1a] lg:border border-t border-b border-white/5 px-4 lg:p-4 py-3 lg:py-4 mb-0 lg:mb-6">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="lg:w-[18px] lg:h-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Search images..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/5 text-white placeholder-white/40 pl-9 lg:pl-10 pr-4 py-2.5 lg:py-3 focus:outline-none focus:border-white/10 transition-colors text-sm lg:text-base"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white px-4 py-2.5 text-xs uppercase tracking-wider transition-all whitespace-nowrap"
            >
              <Check size={14} />
              <span>{selectedFiles.size === filteredFiles.length && filteredFiles.length > 0 ? 'Deselect All' : 'Select All'}</span>
            </button>
            {selectedFiles.size > 0 && (
              <span className="text-white/60 text-sm px-3 py-2 bg-white/5 border border-white/10">
                {selectedFiles.size} selected
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Upload Area with Drag & Drop */}
      <div
        className={`bg-[#1a1a1a] lg:border border-t border-white/5 p-8 mb-0 lg:mb-6 transition-all ${
          dragActive ? 'border-white/30 bg-white/5' : ''
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <label className="flex flex-col items-center justify-center cursor-pointer group">
          <div className="w-16 h-16 bg-white/5 border-2 border-dashed border-white/20 group-hover:border-white/40 flex items-center justify-center mb-4 transition-all">
            <Upload size={32} className="text-white/40 group-hover:text-white/60 transition-colors" />
          </div>
          <p className="text-white/80 text-sm mb-1">
            {uploading ? 'Uploading...' : 'Drop images here or click to upload'}
          </p>
          <p className="text-white/40 text-xs">JPEG, PNG, WebP (max 10MB)</p>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {/* Media Grid/List */}
      {loading ? (
        <div className="bg-[#1a1a1a] lg:border border-white/5 p-12 lg:p-16">
          <div className="text-center text-white/60">Loading media library...</div>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="bg-[#1a1a1a] lg:border border-white/5 p-12">
          <div className="text-center">
            <ImageIcon size={48} className="text-white/20 mx-auto mb-4" />
            <div className="text-white/60 mb-4">No images yet</div>
            <p className="text-white/40 text-sm">Upload your first image to get started</p>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0 lg:gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.name}
              className="group relative bg-[#1a1a1a] border-r border-b lg:border border-white/5 hover:border-white/20 transition-all overflow-hidden"
            >
              {/* Checkbox */}
              <div className="absolute top-2 left-2 z-10">
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file.name)}
                  onChange={() => toggleFileSelection(file.name)}
                  className="w-5 h-5 rounded border-white/20 bg-black/50 cursor-pointer accent-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Image - Click to select/deselect */}
              <div 
                className="aspect-square bg-white/5 overflow-hidden cursor-pointer relative"
                onClick={(e) => {
                  if (e.shiftKey) {
                    selectRange(file.name);
                  } else {
                    toggleFileSelection(file.name);
                  }
                }}
              >
                <img
                  src={file.thumbnailUrl || file.url}
                  alt={file.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to original if transform fails
                    e.currentTarget.src = file.url;
                  }}
                />
                {selectedFiles.has(file.name) && (
                  <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-500 pointer-events-none"></div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                {/* Editable filename */}
                {editingFile === file.name ? (
                  <div className="mb-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRename(file.name);
                        } else if (e.key === 'Escape') {
                          cancelEditing();
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-black border border-blue-500 text-white text-xs px-2 py-1 focus:outline-none focus:border-blue-400"
                      autoFocus
                    />
                    <div className="flex gap-1 mt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRename(file.name);
                        }}
                        className="flex-1 bg-blue-600 text-white text-[9px] px-2 py-1 uppercase tracking-wider"
                      >
                        Save
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEditing();
                        }}
                        className="flex-1 bg-white/5 text-white/60 text-[9px] px-2 py-1 uppercase tracking-wider"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="text-white text-xs font-medium mb-1 truncate group/name flex items-center gap-1 cursor-pointer hover:text-blue-400 transition-colors"
                    title={file.name}
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(file.name);
                    }}
                  >
                    <span className="flex-1 truncate">{file.name}</span>
                    <Edit2 size={10} className="opacity-0 group-hover/name:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                )}
                
                <div className="text-white/40 text-[10px] mb-2">
                  {formatFileSize(file.size)} • {formatDate(file.created_at)}
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(file.url);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/80 hover:text-white px-1.5 py-1.5 text-[9px] uppercase tracking-wider transition-all"
                  >
                    {copiedUrl === file.url ? <Check size={10} /> : <Copy size={10} />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveBackground(file.name, file.url);
                    }}
                    disabled={removingBg}
                    className="flex items-center justify-center bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 hover:border-blue-500/40 text-blue-500 w-7 h-7 transition-all disabled:opacity-50 relative group/tooltip"
                    title="Remove BG (MAX)"
                  >
                    <Scissors size={10} />
                    <Sparkles size={6} className="absolute -top-0.5 -right-0.5 text-yellow-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUpscaleOptions(showUpscaleOptions === file.name ? null : file.name);
                    }}
                    disabled={upscaling}
                    className="flex items-center justify-center bg-green-600/10 hover:bg-green-600/20 border border-green-500/20 hover:border-green-500/40 text-green-500 w-7 h-7 transition-all disabled:opacity-50 relative"
                    title="AI Upscale"
                  >
                    <Maximize2 size={10} />
                    <Zap size={6} className="absolute -top-0.5 -right-0.5 text-yellow-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditorFile({ name: file.name, url: file.url });
                    }}
                    className="flex items-center justify-center bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 hover:border-purple-500/40 text-purple-500 w-7 h-7 transition-all relative group/tooltip"
                    title="Advanced Editor"
                  >
                    <Wand2 size={10} />
                    <Sparkles size={6} className="absolute -top-0.5 -right-0.5 text-yellow-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(file.name);
                    }}
                    className="flex items-center justify-center bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 hover:border-red-500/40 text-red-500 w-7 h-7 transition-all"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
                
                {/* Upscale Options */}
                {showUpscaleOptions === file.name && (
                  <div className="mt-2 p-2 bg-black border border-green-500/20" onClick={(e) => e.stopPropagation()}>
                    <div className="text-[9px] text-white/60 mb-2 uppercase tracking-wider">AI Upscale (Real-ESRGAN)</div>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        onClick={() => handleUpscale(file.name, file.url, 2)}
                        disabled={upscaling}
                        className="bg-green-600/10 hover:bg-green-600/20 border border-green-500/20 text-green-500 text-[9px] py-1.5 uppercase tracking-wider disabled:opacity-50"
                      >
                        2x Quality
                      </button>
                      <button
                        onClick={() => handleUpscale(file.name, file.url, 4)}
                        disabled={upscaling}
                        className="bg-green-600 hover:bg-green-700 text-white text-[9px] py-1.5 uppercase tracking-wider disabled:opacity-50"
                      >
                        4x MAX
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#1a1a1a] lg:border border-white/5 divide-y divide-white/5">
          {filteredFiles.map((file) => (
            <div
              key={file.name}
              className={`flex items-center gap-4 p-4 hover:bg-white/5 transition-all cursor-pointer ${
                selectedFiles.has(file.name) ? 'bg-blue-500/10 border-l-2 border-blue-500' : ''
              }`}
              onClick={(e) => {
                if (e.shiftKey) {
                  selectRange(file.name);
                } else {
                  toggleFileSelection(file.name);
                }
              }}
            >
              <input
                type="checkbox"
                checked={selectedFiles.has(file.name)}
                onChange={() => toggleFileSelection(file.name)}
                className="w-5 h-5 rounded border-white/20 bg-transparent cursor-pointer accent-blue-500"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="w-16 h-16 bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                <img
                  src={file.thumbnailUrl || file.url}
                  alt={file.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => e.currentTarget.src = file.url}
                />
              </div>
              <div className="flex-1 min-w-0">
                {/* Editable filename */}
                {editingFile === file.name ? (
                  <div className="mb-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRename(file.name);
                        } else if (e.key === 'Escape') {
                          cancelEditing();
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-black border border-blue-500 text-white text-sm px-3 py-2 focus:outline-none focus:border-blue-400"
                      autoFocus
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRename(file.name);
                        }}
                        className="bg-blue-600 text-white text-xs px-4 py-2 uppercase tracking-wider"
                      >
                        Save
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEditing();
                        }}
                        className="bg-white/5 text-white/60 text-xs px-4 py-2 uppercase tracking-wider"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="text-white text-sm font-medium mb-1 truncate group/name flex items-center gap-2 cursor-pointer hover:text-blue-400 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(file.name);
                    }}
                  >
                    <span className="flex-1 truncate">{file.name}</span>
                    <Edit2 size={14} className="opacity-0 group-hover/name:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                )}
                
                <div className="text-white/40 text-xs">
                  {formatFileSize(file.size)} • {formatDate(file.created_at)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(file.url);
                  }}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/80 hover:text-white px-4 py-2 text-xs uppercase tracking-wider transition-all"
                >
                  {copiedUrl === file.url ? (
                    <>
                      <Check size={14} />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpscale(file.name, file.url, 4);
                  }}
                  disabled={upscaling}
                  className="flex items-center gap-2 bg-green-600/10 hover:bg-green-600/20 border border-green-500/20 hover:border-green-500/40 text-green-500 px-4 py-2 text-xs uppercase tracking-wider transition-all disabled:opacity-50 relative"
                >
                  <Maximize2 size={14} />
                  <span>Upscale 4x</span>
                  <Zap size={10} className="absolute -top-1 -right-1 text-yellow-400" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveBackground(file.name, file.url);
                  }}
                  disabled={removingBg}
                  className="flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 hover:border-blue-500/40 text-blue-500 px-4 py-2 text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  <Scissors size={14} />
                  <span>Remove BG</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(file.name);
                  }}
                  className="flex items-center gap-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 hover:border-red-500/40 text-red-500 px-4 py-2 text-xs uppercase tracking-wider transition-all"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Editor Modal */}
      {editorFile && (
        <ImageEditorModal
          isOpen={!!editorFile}
          onClose={() => setEditorFile(null)}
          file={editorFile}
          vendorId={localStorage.getItem('vendor_id') || ''}
          onSuccess={loadMedia}
        />
      )}

      {/* Bulk Enhancement Modal */}
      {showBulkEditor && (
        <BulkEnhanceModal
          isOpen={showBulkEditor}
          onClose={() => setShowBulkEditor(false)}
          fileCount={selectedFiles.size}
          onApply={handleBulkEnhance}
        />
      )}

      {/* Add shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

// Bulk Enhancement Modal Component
function BulkEnhanceModal({ 
  isOpen, 
  onClose, 
  fileCount, 
  onApply 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  fileCount: number; 
  onApply: (options: any) => void;
}) {
  const [bgColor, setBgColor] = useState('#ffffff');
  const [addShadow, setAddShadow] = useState(false);
  const [enableCrop, setEnableCrop] = useState(false);
  const [outputFormat, setOutputFormat] = useState<'png' | 'jpg' | 'webp'>('png');

  if (!isOpen) return null;

  const handleApply = () => {
    const options: any = {
      format: outputFormat,
      suffix: '-enhanced',
    };

    if (bgColor !== 'transparent') {
      options.backgroundColor = bgColor;
    }
    if (addShadow) {
      options.addShadow = true;
    }
    if (enableCrop) {
      options.crop = true;
      options.cropMargin = '10';
    }

    onApply(options);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl text-white font-light mb-1">Bulk Enhancement</h2>
            <p className="text-white/60 text-sm">{fileCount} images selected</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-white text-sm mb-2 block">Background Color</label>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="w-full h-12 cursor-pointer"
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={addShadow}
                onChange={(e) => setAddShadow(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-white text-sm">Add Shadow</span>
            </label>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={enableCrop}
                onChange={(e) => setEnableCrop(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-white text-sm">Smart Crop to Subject</span>
            </label>
          </div>

          <div>
            <label className="text-white text-sm mb-2 block">Output Format</label>
            <div className="grid grid-cols-3 gap-2">
              {(['png', 'jpg', 'webp'] as const).map(format => (
                <button
                  key={format}
                  onClick={() => setOutputFormat(format)}
                  className={`py-2 text-sm uppercase ${
                    outputFormat === format
                      ? 'bg-white text-black'
                      : 'bg-white/5 text-white/60 border border-white/10'
                  }`}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-3 text-white/60 hover:text-white border border-white/10 hover:border-white/20 transition-all text-sm uppercase tracking-wider"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white transition-all text-sm uppercase tracking-wider flex items-center gap-2"
          >
            <Sparkles size={16} />
            <span>Enhance {fileCount} Images</span>
          </button>
        </div>
      </div>
    </div>
  );
}

