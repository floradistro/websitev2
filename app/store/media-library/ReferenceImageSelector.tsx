"use client";

import { useState, useEffect, memo } from "react";
import {
  X,
  Check,
  Folder,
  FolderOpen,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { logger } from "@/lib/logger";

interface MediaFile {
  id: string;
  file_name: string;
  file_url: string;
  file_path: string;
  folder_id?: string | null;
  created_at: string;
  updated_at?: string;
}

interface MediaFolder {
  id: string;
  name: string;
  parent_folder_id: string | null;
  color: string;
  icon: string;
}

interface ReferenceImageSelectorProps {
  vendorId: string;
  selectedImageIds: Set<string>;
  onSelectionChange: (imageIds: Set<string>, images: MediaFile[]) => void;
  onClose: () => void;
}

// Memoized grid item
const ReferenceGridItem = memo(
  ({
    file,
    isSelected,
    onSelect,
  }: {
    file: MediaFile;
    isSelected: boolean;
    onSelect: () => void;
  }) => {
    const thumbnailUrl = file.file_url.includes("supabase.co")
      ? file.file_url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/") +
        `?width=400&height=400&quality=75&t=${file.updated_at || file.created_at}`
      : file.file_url;

    return (
      <div
        onClick={onSelect}
        className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all ${
          isSelected ? "ring-2 ring-white scale-95" : "hover:scale-[0.97]"
        }`}
      >
        <img
          src={thumbnailUrl}
          alt={file.file_name}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <p className="text-white text-xs font-medium truncate">{file.file_name}</p>
          </div>
        </div>

        {/* Selection indicator */}
        <div
          className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
            isSelected ? "bg-white border-white" : "bg-black/40 border-white/60 backdrop-blur-sm"
          }`}
        >
          {isSelected && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
        </div>

        {/* Selection count badge */}
        {isSelected && (
          <div className="absolute top-2 left-2 bg-white text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {Array.from(document.querySelectorAll('[data-selected="true"]')).indexOf(
              document.querySelector(`[data-file-id="${file.id}"]`) as Element
            ) + 1}
          </div>
        )}
      </div>
    );
  }
);

ReferenceGridItem.displayName = "ReferenceGridItem";

export default function ReferenceImageSelector({
  vendorId,
  selectedImageIds,
  onSelectionChange,
  onClose,
}: ReferenceImageSelectorProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [localSelection, setLocalSelection] = useState<Set<string>>(new Set(selectedImageIds));
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);

  // Load folders
  useEffect(() => {
    const loadFolders = async () => {
      try {
        const response = await fetch("/api/vendor/media/folders", {
          headers: { "x-vendor-id": vendorId },
        });
        const data = await response.json();
        if (data.success) {
          setFolders(data.folders || []);
        }
      } catch (error) {
        logger.error("Error loading folders:", error);
      }
    };

    loadFolders();
  }, [vendorId]);

  // Load media files
  useEffect(() => {
    const loadMedia = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/vendor/media", {
          headers: { "x-vendor-id": vendorId },
        });

        const data = await response.json();
        if (data.success) {
          setFiles(data.files || []);
        }
      } catch (error) {
        logger.error("Error loading media:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMedia();
  }, [vendorId]);

  // Filter files by current folder
  const filteredFiles = files.filter((file) => {
    const fileFolder = file.folder_id || null;
    return fileFolder === currentFolderId;
  });

  // Get current folder's subfolders
  const currentFolders = folders.filter((folder) => folder.parent_folder_id === currentFolderId);

  // Build breadcrumb trail
  const buildBreadcrumbs = () => {
    if (!currentFolderId) return [];

    const trail: MediaFolder[] = [];
    let folderId: string | null = currentFolderId;

    while (folderId) {
      const folder = folders.find((f) => f.id === folderId);
      if (!folder) break;
      trail.unshift(folder);
      folderId = folder.parent_folder_id;
    }

    return trail;
  };

  const breadcrumbs = buildBreadcrumbs();

  const handleToggleSelection = (file: MediaFile) => {
    const newSelection = new Set(localSelection);
    if (newSelection.has(file.id)) {
      newSelection.delete(file.id);
      setSelectedFiles(selectedFiles.filter((f) => f.id !== file.id));
    } else {
      newSelection.add(file.id);
      setSelectedFiles([...selectedFiles, file]);
    }
    setLocalSelection(newSelection);
  };

  const handleDone = () => {
    onSelectionChange(localSelection, selectedFiles);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-6xl h-[80vh] bg-neutral-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white/10">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg text-white font-light">Select Reference Images</h2>
              <p className="text-sm text-white/50 font-light">
                {localSelection.size === 0
                  ? "Choose images to guide the style"
                  : `${localSelection.size} image${localSelection.size === 1 ? "" : "s"} selected`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDone}
                disabled={localSelection.size === 0}
                className="px-6 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Done
              </button>
            </div>
          </div>
        </div>

        {/* Breadcrumbs */}
        {(currentFolderId || breadcrumbs.length > 0) && (
          <div className="flex-shrink-0 px-6 py-3 border-b border-white/5">
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => setCurrentFolderId(null)}
                className="text-white/60 hover:text-white transition-colors font-light"
              >
                Media Library
              </button>
              {breadcrumbs.map((folder) => (
                <div key={folder.id} className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-white/30" />
                  <button
                    onClick={() => setCurrentFolderId(folder.id)}
                    className="text-white/60 hover:text-white transition-colors font-light"
                  >
                    {folder.name}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {/* Folders */}
              {currentFolders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setCurrentFolderId(folder.id)}
                  className="group relative aspect-square rounded-lg bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-white/20 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
                >
                  <FolderOpen className="w-8 h-8 text-white/40 group-hover:text-white/60 transition-colors" strokeWidth={1.5} />
                  <p className="text-sm text-white/70 font-light truncate px-2 max-w-full">
                    {folder.name}
                  </p>
                </button>
              ))}

              {/* Files */}
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  data-file-id={file.id}
                  data-selected={localSelection.has(file.id)}
                >
                  <ReferenceGridItem
                    file={file}
                    isSelected={localSelection.has(file.id)}
                    onSelect={() => handleToggleSelection(file)}
                  />
                </div>
              ))}

              {/* Empty state */}
              {currentFolders.length === 0 && filteredFiles.length === 0 && (
                <div className="col-span-full text-center py-20">
                  <Folder className="w-12 h-12 text-white/20 mx-auto mb-3" strokeWidth={1} />
                  <p className="text-white/40 text-sm font-light">
                    {currentFolderId ? "This folder is empty" : "No media files yet"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
