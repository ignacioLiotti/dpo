'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Image, FileType, Archive, Code } from 'lucide-react';

interface DocumentThumbnailProps {
  document: {
    id: string;
    name: string;
    file_type?: string;
    type?: string;
    storage_path: string;
  };
  className?: string;
}

const FILE_TYPE_ICONS = {
  // Images
  'image/jpeg': { icon: Image, color: 'text-green-500' },
  'image/png': { icon: Image, color: 'text-green-500' },
  'image/webp': { icon: Image, color: 'text-green-500' },
  'image/gif': { icon: Image, color: 'text-green-500' },

  // PDFs
  'application/pdf': { icon: FileText, color: 'text-red-500' },

  // Office documents
  'application/msword': { icon: FileType, color: 'text-blue-500' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: FileType, color: 'text-blue-500' },
  'application/vnd.ms-excel': { icon: FileType, color: 'text-green-600' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: FileType, color: 'text-green-600' },
  'application/vnd.ms-powerpoint': { icon: FileType, color: 'text-orange-500' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { icon: FileType, color: 'text-orange-500' },

  // Text files
  'text/plain': { icon: Code, color: 'text-gray-500' },
  'text/csv': { icon: Code, color: 'text-gray-500' },

  // Archives
  'application/zip': { icon: Archive, color: 'text-purple-500' },
  'application/x-rar-compressed': { icon: Archive, color: 'text-purple-500' },

  // CAD files
  'application/dwg': { icon: FileType, color: 'text-cyan-500' },
  'application/dxf': { icon: FileType, color: 'text-cyan-500' },
} as const;

export function DocumentThumbnail({ document, className = '' }: DocumentThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Handle both file_type and type properties with null safety
  const fileType = document.file_type || document.type || '';
  console.log('fileType', fileType, typeof fileType);
  const isImage = fileType.startsWith('image')
  const fileTypeConfig = FILE_TYPE_ICONS[fileType as keyof typeof FILE_TYPE_ICONS] ||
    { icon: FileText, color: 'text-gray-400' };

  useEffect(() => {
    // Only try to load thumbnails for images to optimize costs
    if (isImage) {
      loadThumbnail();
    }
  }, [document.id, isImage]);

  const loadThumbnail = async () => {
    if (loading || thumbnailUrl || error) return;

    setLoading(true);
    setError(false);

    try {
      // Use a lightweight thumbnail endpoint or the full image with size constraints
      const response = await fetch(`/api/documents/${document.id}/thumbnail`, {
        // Add cache headers to reduce API calls
        headers: {
          'Cache-Control': 'public, max-age=3600'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          setThumbnailUrl(data.url);
        } else {
          setError(true);
        }
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error loading thumbnail:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (isImage && !error && !loading && thumbnailUrl) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`relative overflow-hidden bg-gray-50 border border-gray-200 ${className}`}
      >
        <img
          src={thumbnailUrl}
          alt={document.name}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
        {/* Subtle overlay to show it's a preview */}
        <div className="absolute inset-0 bg-white/5" />
      </motion.div>
    );
  }

  if (isImage && loading) {
    return (
      <div className={`bg-gray-100 animate-pulse ${className}`}>
        <div className="w-full h-full flex items-center justify-center">
          <Image className="w-8 h-8 text-gray-400" />
        </div>
      </div>
    );
  }

  // Fallback to file type icon
  const IconComponent = fileTypeConfig.icon;

  return (
    <div className={`bg-gray-50 border border-gray-200 flex items-center justify-center ${className}`}>
      <IconComponent className={`w-12 h-12 ${fileTypeConfig.color}`} />
    </div>
  );
}